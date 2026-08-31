"""Tests for app.modules.settings.roles.services"""

import pytest
from sqlalchemy import func, select

from app.modules.settings.roles import services
from app.modules.settings.roles.model import RoleDomain, Roles
from app.modules.settings.roles.schema import RoleCreate


# ---------------------------------------------------------------------------
# Seeding
# ---------------------------------------------------------------------------

async def test_seed_system_roles(db_session):
    await services.seed_system_roles(db_session)
    count = (
        await db_session.execute(select(func.count()).select_from(Roles))
    ).scalar_one()
    assert count == len(services.SYSTEM_ROLES)


async def test_seed_system_roles_idempotent(db_session):
    await services.seed_system_roles(db_session)
    await services.seed_system_roles(db_session)
    count = (
        await db_session.execute(select(func.count()).select_from(Roles))
    ).scalar_one()
    assert count == len(services.SYSTEM_ROLES)


# ---------------------------------------------------------------------------
# List / get
# ---------------------------------------------------------------------------

async def test_list_roles_empty(db_session):
    assert await services.list_roles(db_session) == []


async def test_list_roles_builds_output_dicts(db_session):
    role = await services.create_role(
        db_session, RoleCreate(name="Manager", domain=RoleDomain.store)
    )

    roles = await services.list_roles(db_session)
    assert len(roles) == 1
    assert roles[0]["id"] == role.id
    assert roles[0]["name"] == "Manager"
    assert roles[0]["domain"] == RoleDomain.store
    assert roles[0]["is_system"] is False
    assert roles[0]["user_count"] == 0


async def test_get_role_missing_returns_none(db_session):
    assert await services.get_role(db_session, 99999) is None


# ---------------------------------------------------------------------------
# Create
# ---------------------------------------------------------------------------

async def test_create_role(db_session):
    role = await services.create_role(
        db_session,
        RoleCreate(name="Manager", domain=RoleDomain.organization, description="Manages the store"),
    )
    assert role.id is not None
    assert role.name == "Manager"
    assert role.domain == RoleDomain.organization
    assert role.description == "Manages the store"
    assert role.is_system is False
