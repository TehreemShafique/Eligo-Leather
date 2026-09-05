"""Tests for app.modules.settings.users.router

Each test makes at most one admin-authenticated HTTP request: SQLite stores
``UserSession.last_seen_at`` without timezone info, so the session-touch logic
in ``get_current_user`` raises TypeError on the second admin request of a
test. Setup/verification therefore go through ``db_session``.
"""

import pytest
from sqlalchemy import func, select

from app.modules.auth.model import User, UserType
from app.modules.settings.users import service
from app.modules.settings.users.schema import StaffUserCreate


async def _make_staff(db_session, **overrides):
    data = {
        "email": "staff@example.com",
        "password": "secret123",
        "full_name": "Staff One",
        "user_type": UserType.pos,
    }
    data.update(overrides)
    return await service.create_staff_user(db_session, StaffUserCreate(**data), actor_id=1)


# ---------------------------------------------------------------------------
# Auth
# ---------------------------------------------------------------------------

async def test_users_require_auth(client):
    resp = await client.get("/api/v1/settings/users/")
    assert resp.status_code in (401, 403)


async def test_users_require_admin(client, auth_headers):
    resp = await client.get("/api/v1/settings/users/", headers=auth_headers)
    assert resp.status_code == 403


# ---------------------------------------------------------------------------
# Create
# ---------------------------------------------------------------------------

async def test_create_staff_user(client, admin_headers):
    resp = await client.post(
        "/api/v1/settings/users/",
        headers=admin_headers,
        json={"email": "staff@example.com", "password": "secret123", "full_name": "Staff One", "user_type": "pos"},
    )
    assert resp.status_code == 201
    body = resp.json()
    assert body["email"] == "staff@example.com"
    assert body["full_name"] == "Staff One"
    assert body["user_type"] == "pos"
    assert body["is_admin"] is False


async def test_create_second_admin_422(client, admin_headers):
    resp = await client.post(
        "/api/v1/settings/users/",
        headers=admin_headers,
        json={"email": "other@example.com", "password": "secret123", "user_type": "admin"},
    )
    assert resp.status_code == 422
    assert "one admin" in resp.json()["detail"].lower()


async def test_create_invalid_email_422(client, admin_headers):
    resp = await client.post(
        "/api/v1/settings/users/",
        headers=admin_headers,
        json={"email": "not-an-email", "password": "secret123"},
    )
    assert resp.status_code == 422


# ---------------------------------------------------------------------------
# List / get
# ---------------------------------------------------------------------------

async def test_list_staff_users(client, admin_headers, db_session):
    await _make_staff(db_session)

    resp = await client.get("/api/v1/settings/users/", headers=admin_headers)
    assert resp.status_code == 200
    assert any(u["email"] == "staff@example.com" for u in resp.json())


async def test_get_staff_user(client, admin_headers, db_session):
    user = await _make_staff(db_session)

    resp = await client.get(f"/api/v1/settings/users/{user.id}", headers=admin_headers)
    assert resp.status_code == 200
    assert resp.json()["full_name"] == "Staff One"


async def test_get_staff_user_missing_404(client, admin_headers):
    resp = await client.get("/api/v1/settings/users/99999", headers=admin_headers)
    assert resp.status_code == 404
    assert resp.json()["detail"] == "User not found"


# ---------------------------------------------------------------------------
# Update
# ---------------------------------------------------------------------------

async def test_patch_staff_user(client, admin_headers, db_session):
    user = await _make_staff(db_session)

    resp = await client.patch(
        f"/api/v1/settings/users/{user.id}",
        headers=admin_headers,
        json={"full_name": "Staff Renamed", "is_active": False},
    )
    assert resp.status_code == 200
    assert resp.json()["full_name"] == "Staff Renamed"
    assert resp.json()["is_active"] is False


async def test_patch_staff_user_missing_404(client, admin_headers):
    resp = await client.patch(
        "/api/v1/settings/users/99999", headers=admin_headers, json={"full_name": "x"},
    )
    assert resp.status_code == 404
    assert resp.json()["detail"] == "User not found"


# ---------------------------------------------------------------------------
# Delete
# ---------------------------------------------------------------------------

async def test_delete_staff_user(client, admin_headers, db_session):
    user = await _make_staff(db_session)

    resp = await client.delete(f"/api/v1/settings/users/{user.id}", headers=admin_headers)
    assert resp.status_code == 204

    count = (
        await db_session.execute(select(func.count()).select_from(User).where(User.id == user.id))
    ).scalar_one()
    assert count == 0


async def test_delete_staff_user_missing_404(client, admin_headers):
    resp = await client.delete("/api/v1/settings/users/99999", headers=admin_headers)
    assert resp.status_code == 404
    assert resp.json()["detail"] == "User not found"


async def test_delete_only_admin_422(client, admin, admin_headers):
    resp = await client.delete(f"/api/v1/settings/users/{admin.id}", headers=admin_headers)
    assert resp.status_code == 422
    assert "only admin" in resp.json()["detail"].lower()
