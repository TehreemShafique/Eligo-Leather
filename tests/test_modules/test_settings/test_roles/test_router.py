"""Tests for app.modules.settings.roles.router

Each test makes at most one admin-authenticated HTTP request: SQLite stores
``UserSession.last_seen_at`` without timezone info, so the session-touch logic
in ``get_current_user`` raises TypeError on the second admin request of a
test. Setup/verification therefore go through ``db_session``.
"""

import pytest
from sqlalchemy import func, select

from app.modules.settings.roles import services
from app.modules.settings.roles.model import RoleDomain, Roles
from app.modules.settings.roles.schema import RoleCreate


# ---------------------------------------------------------------------------
# Auth
# ---------------------------------------------------------------------------

async def test_roles_require_auth(client):
    resp = await client.get("/api/v1/settings/roles/list-roles")
    assert resp.status_code in (401, 403)


# ---------------------------------------------------------------------------
# Seed / list
# ---------------------------------------------------------------------------

async def test_seed_system_roles(client, admin_headers, db_session):
    resp = await client.post("/api/v1/settings/roles/seed", headers=admin_headers)
    assert resp.status_code == 204

    count = (await db_session.execute(select(func.count()).select_from(Roles))).scalar_one()
    assert count == len(services.SYSTEM_ROLES)


async def test_list_roles_empty_404(client, admin_headers):
    resp = await client.get("/api/v1/settings/roles/list-roles", headers=admin_headers)
    assert resp.status_code == 404
    assert resp.json()["detail"] == "Roles are not found."


async def test_list_roles_hits_user_count_bug(client, admin_headers, db_session):
    """GET /api/v1/settings/roles/list-roles 500s once a role exists: the
    service builds ``select(func.count(User.id).where(...))`` which has no
    ``where`` method (see app/modules/settings/roles/services.py). This pins
    the current behavior so the failure is visible instead of silently
    passing."""
    await services.seed_system_roles(db_session)
    with pytest.raises(AttributeError):
        await client.get("/api/v1/settings/roles/list-roles", headers=admin_headers)


# ---------------------------------------------------------------------------
# Get role by id
# ---------------------------------------------------------------------------

async def test_get_role_by_id(client, admin_headers, db_session):
    role = await services.create_role(
        db_session, RoleCreate(name="Custom", domain=RoleDomain.store),
    )

    resp = await client.get(f"/api/v1/settings/roles/role/{role.id}", headers=admin_headers)
    assert resp.status_code == 200
    assert resp.json()["id"] == role.id
    assert resp.json()["name"] == "Custom"
    assert resp.json()["is_system"] is False


async def test_get_role_missing_404(client, admin_headers):
    resp = await client.get("/api/v1/settings/roles/role/99999", headers=admin_headers)
    assert resp.status_code == 404
    assert resp.json()["detail"] == "Role not found."


# ---------------------------------------------------------------------------
# Create role
# ---------------------------------------------------------------------------

async def test_create_role(client, admin_headers):
    resp = await client.post(
        "/api/v1/settings/roles/create_role",
        headers=admin_headers,
        json={"name": "Custom", "domain": "store", "description": "A custom role"},
    )
    assert resp.status_code == 201
    body = resp.json()
    assert body["name"] == "Custom"
    assert body["domain"] == "store"
    assert body["is_system"] is False
    assert body["user_count"] == 0


async def test_create_role_invalid_domain_422(client, admin_headers):
    resp = await client.post(
        "/api/v1/settings/roles/create_role",
        headers=admin_headers,
        json={"name": "Bad", "domain": "not-a-domain"},
    )
    assert resp.status_code == 422
