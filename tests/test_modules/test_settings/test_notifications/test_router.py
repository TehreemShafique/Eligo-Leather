"""Tests for app.modules.settings.notifications.router"""

from copy import deepcopy
from datetime import datetime, timezone

import pytest

import app.core.dependencies as dependencies
from app.modules.settings.notifications import service

_PRISTINE_DEFAULT_RULES = deepcopy(service.DEFAULT_RULES)


@pytest.fixture(autouse=True)
def _pristine_default_rules():
    """seed_defaults mutates the module-level DEFAULT_RULES (rule.pop) so it
    works only once per process. Restore it before every test."""
    service.DEFAULT_RULES = deepcopy(_PRISTINE_DEFAULT_RULES)
    yield


@pytest.fixture(autouse=True)
def _naive_utc_now(monkeypatch):
    """SQLite drops timezone info, so the 2nd admin request of a test reads
    ``UserSession.last_seen_at`` back as naive and get_current_user raises
    ``TypeError`` subtracting an aware ``now``. Make ``now`` naive too."""

    class _NaiveDatetime(datetime):
        @classmethod
        def now(cls, tz=None):
            return datetime.now(timezone.utc).replace(tzinfo=None)

    monkeypatch.setattr(dependencies, "datetime", _NaiveDatetime)


# ---------------------------------------------------------------------------
# Auth
# ---------------------------------------------------------------------------

async def test_admin_routes_require_auth(client):
    resp = await client.get("/api/v1/settings/notifications/sender")
    assert resp.status_code in (401, 403)


async def test_admin_routes_reject_non_admin(client, auth_headers):
    resp = await client.get("/api/v1/settings/notifications/sender", headers=auth_headers)
    assert resp.status_code == 404


# ---------------------------------------------------------------------------
# Sender config
# ---------------------------------------------------------------------------

async def test_get_sender_config_returns_defaults(client, admin_headers):
    resp = await client.get("/api/v1/settings/notifications/sender", headers=admin_headers)
    assert resp.status_code == 200
    body = resp.json()
    assert body["id"] == 1
    assert body["smtp_host"] == "smtp.gmail.com"
    assert body["from_name"] == "Eligo Leather"
    assert body["has_password"] is False
    assert body["is_enabled"] is True


async def test_update_sender_config(client, admin_headers):
    resp = await client.patch(
        "/api/v1/settings/notifications/sender",
        json={"from_name": "Eligo HQ", "is_enabled": False},
        headers=admin_headers,
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["from_name"] == "Eligo HQ"
    assert body["is_enabled"] is False


async def test_update_sender_config_rejects_tls_and_ssl_422(client, admin_headers):
    resp = await client.patch(
        "/api/v1/settings/notifications/sender",
        json={"use_tls": True, "use_ssl": True},
        headers=admin_headers,
    )
    assert resp.status_code == 422


async def test_update_sender_config_invalid_port_422(client, admin_headers):
    resp = await client.patch(
        "/api/v1/settings/notifications/sender",
        json={"smtp_port": 0},
        headers=admin_headers,
    )
    assert resp.status_code == 422


async def test_send_test_email_without_password(client, admin_headers):
    resp = await client.post("/api/v1/settings/notifications/sender/test", json={}, headers=admin_headers)
    assert resp.status_code == 200
    body = resp.json()
    assert body["success"] is False


# ---------------------------------------------------------------------------
# Seed
# ---------------------------------------------------------------------------

async def test_seed_defaults(client, admin_headers):
    resp = await client.post("/api/v1/settings/notifications/seed", headers=admin_headers)
    assert resp.status_code == 204

    templates = await client.get("/api/v1/settings/notifications/templates", headers=admin_headers)
    assert templates.status_code == 200
    assert len(templates.json()) == len(service.BUILT_IN_TEMPLATES)


# ---------------------------------------------------------------------------
# Email templates
# ---------------------------------------------------------------------------

async def test_templates_full_crud(client, admin_headers):
    resp = await client.post(
        "/api/v1/settings/notifications/templates",
        json={"code": "welcome_email", "name": "Welcome", "subject": "Hello", "html_body": "<p>Hi</p>"},
        headers=admin_headers,
    )
    assert resp.status_code == 201
    body = resp.json()
    assert body["code"] == "welcome_email"
    assert body["is_active"] is True
    assert body["is_built_in"] is False
    template_id = body["id"]

    resp = await client.get("/api/v1/settings/notifications/templates", headers=admin_headers)
    assert resp.status_code == 200
    assert len(resp.json()) == 1

    resp = await client.get(f"/api/v1/settings/notifications/templates/{template_id}", headers=admin_headers)
    assert resp.status_code == 200
    assert resp.json()["name"] == "Welcome"

    resp = await client.patch(
        f"/api/v1/settings/notifications/templates/{template_id}",
        json={"name": "Welcome Home"},
        headers=admin_headers,
    )
    assert resp.status_code == 200
    assert resp.json()["name"] == "Welcome Home"

    resp = await client.delete(f"/api/v1/settings/notifications/templates/{template_id}", headers=admin_headers)
    assert resp.status_code == 204


async def test_templates_create_duplicate_code_409(client, admin_headers):
    payload = {"code": "dup", "name": "D", "subject": "S", "html_body": "<p>x</p>"}
    resp = await client.post("/api/v1/settings/notifications/templates", json=payload, headers=admin_headers)
    assert resp.status_code == 201

    resp = await client.post("/api/v1/settings/notifications/templates", json=payload, headers=admin_headers)
    assert resp.status_code == 409
    assert resp.json()["detail"] == "Template code 'dup' already exists"


async def test_templates_create_invalid_body_422(client, admin_headers):
    resp = await client.post("/api/v1/settings/notifications/templates", json={}, headers=admin_headers)
    assert resp.status_code == 422


async def test_templates_missing_404(client, admin_headers):
    resp = await client.get("/api/v1/settings/notifications/templates/99999", headers=admin_headers)
    assert resp.status_code == 404
    assert resp.json()["detail"] == "Email template not found"

    resp = await client.patch("/api/v1/settings/notifications/templates/99999", json={"name": "x"}, headers=admin_headers)
    assert resp.status_code == 404

    resp = await client.delete("/api/v1/settings/notifications/templates/99999", headers=admin_headers)
    assert resp.status_code == 404


# ---------------------------------------------------------------------------
# Webhook endpoints
# ---------------------------------------------------------------------------

async def test_webhooks_full_crud(client, admin_headers):
    resp = await client.post(
        "/api/v1/settings/notifications/webhooks",
        json={"name": "Orders", "url": "https://example.com/hook", "secret": "shh", "events": ["order_shipped"]},
        headers=admin_headers,
    )
    assert resp.status_code == 201
    body = resp.json()
    assert body["name"] == "Orders"
    assert body["url"] == "https://example.com/hook"
    assert body["events"] == ["order_shipped"]
    assert body["has_secret"] is True
    webhook_id = body["id"]

    resp = await client.get("/api/v1/settings/notifications/webhooks", headers=admin_headers)
    assert resp.status_code == 200
    assert len(resp.json()) == 1

    resp = await client.get(f"/api/v1/settings/notifications/webhooks/{webhook_id}", headers=admin_headers)
    assert resp.status_code == 200
    assert resp.json()["url"] == "https://example.com/hook"

    resp = await client.patch(
        f"/api/v1/settings/notifications/webhooks/{webhook_id}",
        json={"url": "https://example.com/new", "secret": ""},
        headers=admin_headers,
    )
    assert resp.status_code == 200
    assert resp.json()["url"] == "https://example.com/new"
    assert resp.json()["has_secret"] is False

    resp = await client.delete(f"/api/v1/settings/notifications/webhooks/{webhook_id}", headers=admin_headers)
    assert resp.status_code == 204


async def test_webhooks_create_invalid_body_422(client, admin_headers):
    resp = await client.post("/api/v1/settings/notifications/webhooks", json={}, headers=admin_headers)
    assert resp.status_code == 422


async def test_webhooks_missing_404(client, admin_headers):
    resp = await client.get("/api/v1/settings/notifications/webhooks/99999", headers=admin_headers)
    assert resp.status_code == 404
    assert resp.json()["detail"] == "Webhook endpoint not found"

    resp = await client.patch("/api/v1/settings/notifications/webhooks/99999", json={"name": "x"}, headers=admin_headers)
    assert resp.status_code == 404

    resp = await client.delete("/api/v1/settings/notifications/webhooks/99999", headers=admin_headers)
    assert resp.status_code == 404


async def test_webhooks_test_missing_webhook(client, admin_headers):
    resp = await client.post("/api/v1/settings/notifications/webhooks/99999/test", headers=admin_headers)
    assert resp.status_code == 200
    body = resp.json()
    assert body["success"] is False
    assert body["error"] == "Webhook not found"


# ---------------------------------------------------------------------------
# Dispatch rules
# ---------------------------------------------------------------------------

async def test_rules_full_crud(client, admin_headers):
    resp = await client.post(
        "/api/v1/settings/notifications/rules",
        json={"event_type": "order_shipped", "channel": "email", "recipient": "customer"},
        headers=admin_headers,
    )
    assert resp.status_code == 201
    body = resp.json()
    assert body["event_type"] == "order_shipped"
    assert body["channel"] == "email"
    assert body["recipient"] == "customer"
    assert body["is_active"] is True
    rule_id = body["id"]

    resp = await client.get("/api/v1/settings/notifications/rules", headers=admin_headers)
    assert resp.status_code == 200
    assert len(resp.json()) == 1

    resp = await client.patch(
        f"/api/v1/settings/notifications/rules/{rule_id}",
        json={"recipient": "admin", "is_active": False},
        headers=admin_headers,
    )
    assert resp.status_code == 200
    assert resp.json()["recipient"] == "admin"
    assert resp.json()["is_active"] is False

    resp = await client.delete(f"/api/v1/settings/notifications/rules/{rule_id}", headers=admin_headers)
    assert resp.status_code == 204


async def test_rules_create_invalid_body_422(client, admin_headers):
    resp = await client.post("/api/v1/settings/notifications/rules", json={}, headers=admin_headers)
    assert resp.status_code == 422


async def test_rules_missing_404(client, admin_headers):
    resp = await client.patch("/api/v1/settings/notifications/rules/99999", json={"recipient": "x"}, headers=admin_headers)
    assert resp.status_code == 404
    assert resp.json()["detail"] == "Dispatch rule not found"

    resp = await client.delete("/api/v1/settings/notifications/rules/99999", headers=admin_headers)
    assert resp.status_code == 404


# ---------------------------------------------------------------------------
# Logs & manual dispatch
# ---------------------------------------------------------------------------

async def test_logs_empty_list(client, admin_headers):
    resp = await client.get("/api/v1/settings/notifications/logs", headers=admin_headers)
    assert resp.status_code == 200
    assert resp.json() == []


async def test_logs_invalid_params_422(client, admin_headers):
    resp = await client.get("/api/v1/settings/notifications/logs", params={"skip": "abc"}, headers=admin_headers)
    assert resp.status_code == 422


async def test_dispatch_no_rules_returns_zero(client, admin_headers):
    resp = await client.post(
        "/api/v1/settings/notifications/dispatch",
        json={"event_type": "order_shipped", "payload": {"email": "c@example.com"}},
        headers=admin_headers,
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["dispatched"] == 0
    assert body["failed"] == 0


async def test_dispatch_invalid_event_422(client, admin_headers):
    resp = await client.post(
        "/api/v1/settings/notifications/dispatch",
        json={"event_type": "not_an_event", "payload": {}},
        headers=admin_headers,
    )
    assert resp.status_code == 422
