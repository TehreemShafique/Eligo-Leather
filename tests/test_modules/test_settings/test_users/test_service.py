"""Tests for app.modules.settings.users.service"""

import pytest
from sqlalchemy.exc import IntegrityError

from app.modules.auth.model import UserType
from app.modules.settings.users import service
from app.modules.settings.users.schema import StaffUserCreate, StaffUserUpdate


# ---------------------------------------------------------------------------
# Create
# ---------------------------------------------------------------------------

async def test_create_staff_user_pos(db_session):
    user = await service.create_staff_user(
        db_session,
        StaffUserCreate(
            email="staff@example.com", password="secret123", full_name="Staff One", user_type=UserType.pos,
        ),
        actor_id=1,
    )
    assert user.id is not None
    assert user.email == "staff@example.com"
    assert user.full_name == "Staff One"
    assert user.user_type == UserType.pos
    assert user.is_admin is False
    assert user.is_active is True


async def test_create_admin_sets_is_admin(db_session):
    admin = await service.create_staff_user(
        db_session,
        StaffUserCreate(email="admin@example.com", password="secret123", user_type=UserType.admin),
        actor_id=1,
    )
    assert admin.user_type == UserType.admin
    assert admin.is_admin is True


async def test_create_second_admin_raises(db_session):
    await service.create_staff_user(
        db_session,
        StaffUserCreate(email="first@example.com", password="secret123", user_type=UserType.admin),
        actor_id=1,
    )
    with pytest.raises(ValueError):
        await service.create_staff_user(
            db_session,
            StaffUserCreate(email="second@example.com", password="secret123", user_type=UserType.admin),
            actor_id=1,
        )


async def test_create_staff_user_duplicate_email_raises(db_session):
    await service.create_staff_user(
        db_session,
        StaffUserCreate(email="dup@example.com", password="secret123", user_type=UserType.pos),
        actor_id=1,
    )
    with pytest.raises(IntegrityError):
        await service.create_staff_user(
            db_session,
            StaffUserCreate(email="dup@example.com", password="secret456", user_type=UserType.pos),
            actor_id=1,
        )


# ---------------------------------------------------------------------------
# List / get
# ---------------------------------------------------------------------------

async def test_list_staff_users(db_session):
    await service.create_staff_user(
        db_session, StaffUserCreate(email="a@example.com", password="secret123", user_type=UserType.pos), actor_id=1,
    )
    await service.create_staff_user(
        db_session, StaffUserCreate(email="b@example.com", password="secret123", user_type=UserType.pos), actor_id=1,
    )

    users = await service.list_staff_users(db_session)
    assert len(users) == 2
    assert {u.email for u in users} == {"a@example.com", "b@example.com"}


async def test_get_staff_user_missing_returns_none(db_session):
    assert await service.get_staff_user(db_session, 99999) is None


# ---------------------------------------------------------------------------
# Update
# ---------------------------------------------------------------------------

async def test_update_staff_user(db_session):
    user = await service.create_staff_user(
        db_session,
        StaffUserCreate(email="up@example.com", password="secret123", full_name="Before", user_type=UserType.pos),
        actor_id=1,
    )
    updated = await service.update_staff_user(
        db_session, user.id, StaffUserUpdate(full_name="After", is_active=False),
    )
    assert updated is not None
    assert updated.id == user.id
    assert updated.full_name == "After"
    assert updated.is_active is False


async def test_update_staff_user_missing_returns_none(db_session):
    assert await service.update_staff_user(db_session, 99999, StaffUserUpdate(full_name="x")) is None


# ---------------------------------------------------------------------------
# Delete
# ---------------------------------------------------------------------------

async def test_delete_staff_user(db_session):
    user = await service.create_staff_user(
        db_session, StaffUserCreate(email="del@example.com", password="secret123", user_type=UserType.pos), actor_id=1,
    )
    assert await service.delete_staff_user(db_session, user.id, actor_id=1) is True
    assert await service.get_staff_user(db_session, user.id) is None


async def test_delete_staff_user_missing_returns_false(db_session):
    assert await service.delete_staff_user(db_session, 99999, actor_id=1) is False


async def test_delete_only_admin_raises(db_session):
    admin = await service.create_staff_user(
        db_session, StaffUserCreate(email="only@example.com", password="secret123", user_type=UserType.admin), actor_id=1,
    )
    with pytest.raises(ValueError):
        await service.delete_staff_user(db_session, admin.id, actor_id=1)
