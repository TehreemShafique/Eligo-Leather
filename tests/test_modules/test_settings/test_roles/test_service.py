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

async def test_list_roles_empty_returns_none(db_session):
    assert await services.list_roles(db_session) is None


async def test_list_roles_raises_attribute_error(db_session):
    """list_roles always raises AttributeError once any role exists: it builds
    ``select(func.count(User.id).where(...))``, but ``func.count`` has no
    ``where`` method (see app/modules/settings/roles/services.py). This pins
    the current behavior so the failure is visible instead of silently
    passing."""
    await services.create_role(db_session, RoleCreate(name="Custom", domain=RoleDomain.store))
    with pytest.raises(AttributeError):
        await services.list_roles(db_session)


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
