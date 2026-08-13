"""Tests for app.modules.settings.security.router

Each test makes at most one admin-authenticated HTTP request: SQLite stores
``UserSession.last_seen_at`` without timezone info, so the session-touch logic
in ``get_current_user`` raises TypeError on the second admin request of a
test. Setup/verification therefore go through ``db_session``.
"""

import pytest
from sqlalchemy import func, select

from app.modules.settings.security import service
from app.modules.settings.security.model import CollaboratorCodes


# ---------------------------------------------------------------------------
# Auth
# ---------------------------------------------------------------------------

async def test_security_require_auth(client):
    resp = await client.get("/api/v1/settings/security/activity-logs")
    assert resp.status_code in (401, 403)


# ---------------------------------------------------------------------------
# Activity logs
# ---------------------------------------------------------------------------

async def test_activity_logs_empty(client, admin_headers):
    resp = await client.get("/api/v1/settings/security/activity-logs", headers=admin_headers)
    assert resp.status_code == 200
    assert resp.json() == []


# ---------------------------------------------------------------------------
# Collaborator codes
# ---------------------------------------------------------------------------

async def test_generate_collaborator_code(client, admin_headers):
    resp = await client.post("/api/v1/settings/security/collaborator-codes", headers=admin_headers)
    assert resp.status_code == 201
    body = resp.json()
    assert len(body["code"]) == 4
    assert body["is_active"] is True


async def test_list_collaborator_codes_active_only(client, admin_headers, db_session):
    active = await service.generate_collaborator_code(db_session)
    revoked = await service.generate_collaborator_code(db_session)
    await service.revoke_collaborator_code(db_session, revoked.id)

    resp = await client.get("/api/v1/settings/security/collaborator-codes", headers=admin_headers)
    assert resp.status_code == 200
    assert [c["id"] for c in resp.json()] == [active.id]


async def test_revoke_collaborator_code(client, admin_headers, db_session):
    code = await service.generate_collaborator_code(db_session)

    resp = await client.delete(
        f"/api/v1/settings/security/collaborator-codes/{code.id}", headers=admin_headers,
    )
    assert resp.status_code == 200
    assert resp.json()["is_active"] is False

    active_count = (
        await db_session.execute(
            select(func.count()).select_from(CollaboratorCodes).where(
                CollaboratorCodes.id == code.id, CollaboratorCodes.is_active == True,  # noqa: E712
            )
        )
    ).scalar_one()
    assert active_count == 0


async def test_revoke_collaborator_code_missing_404(client, admin_headers):
    resp = await client.delete("/api/v1/settings/security/collaborator-codes/99999", headers=admin_headers)
    assert resp.status_code == 404
    assert resp.json()["detail"] == "Code not found"
