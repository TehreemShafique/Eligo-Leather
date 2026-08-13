"""Tests for the auth service layer in ``app.modules.auth.service``."""

import pytest
from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import hash_password
from app.modules.auth import service
from app.modules.auth.model import User
from app.modules.auth.schema import UserCreate


@pytest.mark.asyncio
async def test_create_user_hashes_password(db_session):
    user = await service.create_user(
        db_session,
        UserCreate(email="new@example.com", password="secret123", full_name="New User"),
    )
    assert user.email == "new@example.com"
    assert user.full_name == "New User"
    assert user.hashed_password != "secret123"
    assert user.hashed_password.startswith("$2")


@pytest.mark.asyncio
async def test_get_user_by_email_finds_user(db_session):
    db_session.add(User(email="findme@example.com", hashed_password=hash_password("x")))
    await db_session.commit()

    found = await service.get_user_by_email(db_session, "findme@example.com")
    assert found is not None
    assert found.email == "findme@example.com"


@pytest.mark.asyncio
async def test_get_user_by_email_missing_returns_none(db_session):
    assert await service.get_user_by_email(db_session, "nope@example.com") is None


@pytest.mark.asyncio
async def test_authentication_success(db_session):
    password = "password123"
    db_session.add(
        User(email="auth@example.com", hashed_password=hash_password(password))
    )
    await db_session.commit()

    user = await service.authentication(db_session, "auth@example.com", password)
    assert user is not None
    assert user.email == "auth@example.com"


@pytest.mark.asyncio
async def test_authentication_wrong_password_raises_404(db_session):
    db_session.add(
        User(email="auth@example.com", hashed_password=hash_password("correct"))
    )
    await db_session.commit()

    with pytest.raises(HTTPException) as exc:
        await service.authentication(db_session, "auth@example.com", "wrong")
    assert exc.value.status_code == 404
    assert exc.value.detail == "Invalid email or password"


@pytest.mark.asyncio
async def test_authentication_unknown_email_raises_404(db_session):
    with pytest.raises(HTTPException) as exc:
        await service.authentication(db_session, "ghost@example.com", "whatever")
    assert exc.value.status_code == 404


@pytest.mark.asyncio
async def test_create_user_returns_async_orm_object(db_session):
    user = await service.create_user(
        db_session, UserCreate(email="obj@example.com", password="secret123")
    )
    assert isinstance(user, User)
    assert isinstance(db_session, AsyncSession)
