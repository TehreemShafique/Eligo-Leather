"""
Tests for app.modules.settings.apps.router
"""

import pytest
from sqlalchemy import func, select

from app.modules.settings.account.model import UserSession
from app.modules.settings.apps import adapters
from app.modules.settings.apps.model import StoreIntegration


async def _reset_admin_sessions(db_session):
    """SQLite re-reads the timezone-aware ``last_seen_at`` written by an admin
    request as naive; app/core/dependencies.py then subtracts it from an aware
    ``now`` and raises TypeError on every request after the first. Reset the
    ledger rows to None so each request behaves like the first."""
    rows = (await db_session.execute(select(UserSession))).scalars().all()
    for row in rows:
        row.last_seen_at = None
    await db_session.commit()


# ---------------------------------------------------------------------------
# Auth
# ---------------------------------------------------------------------------

async def test_apps_require_auth(client):
    resp = await client.get("/api/v1/settings/apps")
    assert resp.status_code == 401


async def test_apps_require_admin(client, auth_headers):
    resp = await client.get("/api/v1/settings/apps", headers=auth_headers)
    assert resp.status_code == 403
    assert resp.json()["detail"] == "User is Not admin"


# ---------------------------------------------------------------------------
# Catalog
# ---------------------------------------------------------------------------

async def test_list_apps_returns_catalog(client, admin_headers):
    resp = await client.get("/api/v1/settings/apps", headers=admin_headers)
    assert resp.status_code == 200
    body = resp.json()
    assert len(body) > 0
    assert all(app["installed"] is False for app in body)
    assert any(app["code"] == "resend_email" for app in body)


async def test_get_app_returns_definition(client, admin_headers):
    resp = await client.get("/api/v1/settings/apps/resend_email", headers=admin_headers)
    assert resp.status_code == 200
    assert resp.json()["code"] == "resend_email"


async def test_get_app_unknown_404(client, admin_headers):
    resp = await client.get("/api/v1/settings/apps/no_such_app", headers=admin_headers)
    assert resp.status_code == 404
    assert resp.json()["detail"] == "App not found"


# ---------------------------------------------------------------------------
# Install / installed / update / status / uninstall
# ---------------------------------------------------------------------------

async def test_install_and_manage_app_flow(client, admin_headers, db_session):
    await _reset_admin_sessions(db_session)
    resp = await client.post(
        "/api/v1/settings/apps/resend_email/install",
        json={
            "app_code": "resend_email",
            "api_credentials": {"api_key": "k"},
            "settings": {"a": 1},
        },
        headers=admin_headers,
    )
    assert resp.status_code == 201
    body = resp.json()
    assert body["app_code"] == "resend_email"
    assert body["status"] == "installed"
    assert body["has_credentials"] is True

    await _reset_admin_sessions(db_session)
    installed = await client.get("/api/v1/settings/apps/installed", headers=admin_headers)
    assert installed.status_code == 200
    assert len(installed.json()) == 1

    await _reset_admin_sessions(db_session)
    app = await client.get("/api/v1/settings/apps/resend_email", headers=admin_headers)
    assert app.status_code == 200
    assert app.json()["installed"] is True

    await _reset_admin_sessions(db_session)
    updated = await client.patch(
        "/api/v1/settings/apps/resend_email",
        json={"settings": {"a": 2}},
        headers=admin_headers,
    )
    assert updated.status_code == 200
    assert updated.json()["settings"] == {"a": 2}

    await _reset_admin_sessions(db_session)
    activated = await client.post(
        "/api/v1/settings/apps/resend_email/activate", headers=admin_headers
    )
    assert activated.status_code == 200
    assert activated.json()["status"] == "active"

    await _reset_admin_sessions(db_session)
    deactivated = await client.post(
        "/api/v1/settings/apps/resend_email/deactivate", headers=admin_headers
    )
    assert deactivated.status_code == 200
    assert deactivated.json()["status"] == "inactive"

    await _reset_admin_sessions(db_session)
    removed = await client.post(
        "/api/v1/settings/apps/resend_email/uninstall", headers=admin_headers
    )
    assert removed.status_code == 204

    await _reset_admin_sessions(db_session)
    after = await client.get("/api/v1/settings/apps/installed", headers=admin_headers)
    assert after.status_code == 200
    assert after.json() == []


async def test_install_unknown_app_404(client, admin_headers):
    resp = await client.post(
        "/api/v1/settings/apps/no_such_app/install",
        json={"app_code": "no_such_app"},
        headers=admin_headers,
    )
    assert resp.status_code == 404
    assert "Unknown app" in resp.json()["detail"]


async def test_install_existing_app_keeps_single_row(client, admin_headers, db_session):
    payload = {"app_code": "resend_email", "settings": {"a": 1}}
    await _reset_admin_sessions(db_session)
    first = await client.post(
        "/api/v1/settings/apps/resend_email/install", json=payload, headers=admin_headers
    )
    await _reset_admin_sessions(db_session)
    second = await client.post(
        "/api/v1/settings/apps/resend_email/install", json=payload, headers=admin_headers
    )
    assert first.status_code == 201
    assert second.status_code == 201
    assert first.json()["id"] == second.json()["id"]

    count = (
        await db_session.execute(select(func.count()).select_from(StoreIntegration))
    ).scalar()
    assert count == 1


async def test_update_uninstalled_app_404(client, admin_headers):
    resp = await client.patch(
        "/api/v1/settings/apps/resend_email",
        json={"settings": {"a": 1}},
        headers=admin_headers,
    )
    assert resp.status_code == 404
    assert resp.json()["detail"] == "App is not installed"


async def test_activate_uninstalled_app_404(client, admin_headers):
    resp = await client.post(
        "/api/v1/settings/apps/resend_email/activate", headers=admin_headers
    )
    assert resp.status_code == 404
    assert resp.json()["detail"] == "App is not installed"


async def test_uninstall_uninstalled_app_404(client, admin_headers):
    resp = await client.post(
        "/api/v1/settings/apps/resend_email/uninstall", headers=admin_headers
    )
    assert resp.status_code == 404
    assert resp.json()["detail"] == "App is not installed"


# ---------------------------------------------------------------------------
# Action dispatch
# ---------------------------------------------------------------------------

async def test_action_unknown_app_400(client, admin_headers):
    resp = await client.post(
        "/api/v1/settings/apps/no_such_app/action",
        json={"action": "send_email", "payload": {}},
        headers=admin_headers,
    )
    assert resp.status_code == 400


async def test_action_unsupported_action_400(client, admin_headers, db_session):
    await _reset_admin_sessions(db_session)
    installed = await client.post(
        "/api/v1/settings/apps/resend_email/install",
        json={"app_code": "resend_email"},
        headers=admin_headers,
    )
    assert installed.status_code == 201

    await _reset_admin_sessions(db_session)
    resp = await client.post(
        "/api/v1/settings/apps/resend_email/action",
        json={"action": "send_sms", "payload": {}},
        headers=admin_headers,
    )
    assert resp.status_code == 400


async def test_action_supported_action_dispatches_payload(client, admin_headers, db_session, monkeypatch):
    """The /action endpoint forward the payload to the registered provider
    adapter and returns the adapter result."""
    async def _fake_send_email(payload: dict) -> dict:
        return {"success": True, "id": "fake-id"}

    monkeypatch.setitem(
        adapters.ADAPTERS["resend_email"], "send_email", _fake_send_email
    )
    await _reset_admin_sessions(db_session)
    installed = await client.post(
        "/api/v1/settings/apps/resend_email/install",
        json={"app_code": "resend_email"},
        headers=admin_headers,
    )
    assert installed.status_code == 201

    await _reset_admin_sessions(db_session)
    resp = await client.post(
        "/api/v1/settings/apps/resend_email/action",
        json={"action": "send_email", "payload": {"to": "a@b.com"}},
        headers=admin_headers,
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["success"] is True
    assert body["action"] == "send_email"
    assert body["data"]["id"] == "fake-id"
