"""Tests for auth dependencies in ``app.core.dependencies``."""

import pytest
from fastapi import HTTPException

from app.core.dependencies import (
    get_current_user,
    require_admin,
    require_discount_manager,
)
from app.core.security import create_access_token, decode_access_token, hash_password
from app.modules.auth.model import User
from app.modules.settings.account.model import UserSession
from app.modules.settings.roles.model import RoleDomain, Roles


class _FakeCredentials:
    def __init__(self, token):
        self.credentials = token


async def _seed_user(db, email, is_admin=False, role=None, password="password123"):
    user = User(
        email=email,
        hashed_password=hash_password(password),
        is_admin=is_admin,
        is_active=True,
        role=role,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user


@pytest.mark.asyncio
async def test_get_current_user_returns_user(db_session):
    user = await _seed_user(db_session, "dev@example.com")
    token = create_access_token({"sub": user.email})

    result = await get_current_user(
        credentials=_FakeCredentials(token), db=db_session
    )
    assert result.id == user.id


@pytest.mark.asyncio
async def test_get_current_user_invalid_token_raises_401(db_session):
    with pytest.raises(HTTPException) as exc:
        await get_current_user(
            credentials=_FakeCredentials("not-a-jwt"), db=db_session
        )
    assert exc.value.status_code == 401
    assert exc.value.detail == "Credentials are not valid"


@pytest.mark.asyncio
async def test_get_current_user_unknown_email_raises_401(db_session):
    token = create_access_token({"sub": "nobody@example.com"})
    with pytest.raises(HTTPException) as exc:
        await get_current_user(
            credentials=_FakeCredentials(token), db=db_session
        )
    assert exc.value.status_code == 401


@pytest.mark.asyncio
async def test_get_current_user_admin_requires_session(db_session):
    admin = await _seed_user(db_session, "boss@example.com", is_admin=True)
    token = create_access_token({"sub": admin.email})

    with pytest.raises(HTTPException) as exc:
        await get_current_user(
            credentials=_FakeCredentials(token), db=db_session
        )
    assert exc.value.status_code == 401

    jti = decode_access_token(token)["jti"]
    db_session.add(UserSession(user_id=admin.id, token_id=jti))
    await db_session.commit()

    result = await get_current_user(
        credentials=_FakeCredentials(token), db=db_session
    )
    assert result.id == admin.id


@pytest.mark.asyncio
async def test_get_current_user_admin_revoked_session_raises(db_session):
    admin = await _seed_user(db_session, "boss2@example.com", is_admin=True)
    token = create_access_token({"sub": admin.email})
    jti = decode_access_token(token)["jti"]
    db_session.add(UserSession(user_id=admin.id, token_id=jti, revoked_at=__import__("datetime").datetime.now()))
    await db_session.commit()

    with pytest.raises(HTTPException) as exc:
        await get_current_user(
            credentials=_FakeCredentials(token), db=db_session
        )
    assert exc.value.status_code == 401


@pytest.mark.asyncio
async def test_require_admin_accepts_admin(db_session):
    admin = await _seed_user(db_session, "boss3@example.com", is_admin=True)
    result = await require_admin(admin)
    assert result.id == admin.id


@pytest.mark.asyncio
async def test_require_admin_rejects_non_admin(db_session):
    user = await _seed_user(db_session, "staff@example.com")
    with pytest.raises(HTTPException) as exc:
        await require_admin(user)
    assert exc.value.status_code == 403
    assert exc.value.detail == "User is Not admin"


@pytest.mark.asyncio
async def test_require_discount_manager_accepts_admin(db_session):
    admin = await _seed_user(db_session, "boss4@example.com", is_admin=True)
    assert (await require_discount_manager(admin, db_session)).id == admin.id


@pytest.mark.asyncio
async def test_require_discount_manager_accepts_store_role(db_session):
    role = Roles(name="Store Manager", domain=RoleDomain.store)
    user = await _seed_user(
        db_session, "store@example.com", role=role
    )
    result = await require_discount_manager(user, db_session)
    assert result.id == user.id


@pytest.mark.asyncio
async def test_require_discount_manager_rejects_pos_role(db_session):
    role = Roles(name="POS Clerk", domain=RoleDomain.point_of_sale)
    user = await _seed_user(db_session, "pos@example.com", role=role)

    with pytest.raises(HTTPException) as exc:
        await require_discount_manager(user, db_session)
    assert exc.value.status_code == 403
    assert exc.value.detail == "User is not allowed to manage discounts"
