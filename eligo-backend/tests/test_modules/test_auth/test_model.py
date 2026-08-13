"""Tests for the ``User`` model in ``app.modules.auth.model``."""

from datetime import datetime

from app.db.base import Base
from app.modules.auth.model import User, UserType


def test_user_table_registered():
    assert "users" in Base.metadata.tables


def test_user_table_name():
    assert User.__tablename__ == "users"


def test_user_required_columns():
    table = Base.metadata.tables["users"]
    assert "id" in table.c
    assert "email" in table.c
    assert "hashed_password" in table.c


def test_user_email_is_unique():
    assert User.__table__.c.email.unique is True


async def test_user_defaults(db_session):
    user = User(
        email="defaults@example.com",
        hashed_password="x",
    )
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)
    assert user.is_admin is False
    assert user.is_active is True
    assert user.user_type == UserType.admin
    assert user.preferred_language == "en"
    assert user.regional_format == "en-PK"
    assert user.timezone == "Asia/Karachi"
    assert user.created_at is not None
    assert isinstance(user.created_at, datetime)


def test_usertype_enum_values():
    assert UserType.admin.value == "admin"
    assert UserType.pos.value == "pos"


def test_user_has_role_relationship():
    assert User.__mapper__.relationships["role"].target is not None
