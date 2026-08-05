"""
Tests for app.modules.settings.customer_events.router
"""

from sqlalchemy import select

from app.modules.settings.account.model import UserSession
from app.modules.settings.customer_events.model import (
    PixelEventLog,
    PixelKind,
    PixelPlacement,
    PixelProvider,
    TrackingPixel,
)


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
# Admin auth
# ---------------------------------------------------------------------------

async def test_admin_routes_require_auth(client):
    resp = await client.get("/api/v1/settings/customer-events/pixels")
    assert resp.status_code == 401


async def test_admin_routes_require_admin(client, auth_headers):
    resp = await client.get("/api/v1/settings/customer-events/pixels", headers=auth_headers)
    assert resp.status_code == 404
    assert resp.json()["detail"] == "User is Not admin"


# ---------------------------------------------------------------------------
# Admin pixel management
# ---------------------------------------------------------------------------

async def test_list_pixels_empty(client, admin_headers):
    resp = await client.get("/api/v1/settings/customer-events/pixels", headers=admin_headers)
    assert resp.status_code == 200
    assert resp.json() == []


async def test_list_pixel_definitions(client, admin_headers):
    resp = await client.get(
        "/api/v1/settings/customer-events/pixels/definitions", headers=admin_headers
    )
    assert resp.status_code == 200
    body = resp.json()
    assert len(body) > 0
    assert any(definition["provider"] == "facebook" for definition in body)


async def test_create_get_and_list_pixels(client, admin_headers, db_session):
    await _reset_admin_sessions(db_session)
    resp = await client.post(
        "/api/v1/settings/customer-events/pixels",
        json={"name": "Meta", "provider": "facebook", "pixel_id": "FB-123"},
        headers=admin_headers,
    )
    assert resp.status_code == 201
    body = resp.json()
    assert body["provider"] == "facebook"
    assert "FB-123" in body["script_content"]
    pixel_id = body["id"]

    await _reset_admin_sessions(db_session)
    fetched = await client.get(
        f"/api/v1/settings/customer-events/pixels/{pixel_id}", headers=admin_headers
    )
    assert fetched.status_code == 200
    assert fetched.json()["name"] == "Meta"

    await _reset_admin_sessions(db_session)
    listed = await client.get("/api/v1/settings/customer-events/pixels", headers=admin_headers)
    assert listed.status_code == 200
    assert len(listed.json()) == 1


async def test_create_pixel_invalid_body_422(client, admin_headers):
    resp = await client.post(
        "/api/v1/settings/customer-events/pixels", json={}, headers=admin_headers
    )
    assert resp.status_code == 422


async def test_get_pixel_missing_404(client, admin_headers):
    resp = await client.get(
        "/api/v1/settings/customer-events/pixels/99999", headers=admin_headers
    )
    assert resp.status_code == 404
    assert resp.json()["detail"] == "Pixel not found"


async def test_update_pixel(client, admin_headers, db_session):
    await _reset_admin_sessions(db_session)
    created = await client.post(
        "/api/v1/settings/customer-events/pixels",
        json={"name": "Meta", "provider": "facebook", "pixel_id": "OLD"},
        headers=admin_headers,
    )
    assert created.status_code == 201
    pixel_id = created.json()["id"]

    await _reset_admin_sessions(db_session)
    resp = await client.patch(
        f"/api/v1/settings/customer-events/pixels/{pixel_id}",
        json={"name": "Renamed"},
        headers=admin_headers,
    )
    assert resp.status_code == 200
    assert resp.json()["name"] == "Renamed"

    await _reset_admin_sessions(db_session)
    missing = await client.patch(
        "/api/v1/settings/customer-events/pixels/99999",
        json={"name": "x"},
        headers=admin_headers,
    )
    assert missing.status_code == 404
    assert missing.json()["detail"] == "Pixel not found"


async def test_activate_and_deactivate_pixel(client, admin_headers, db_session):
    await _reset_admin_sessions(db_session)
    created = await client.post(
        "/api/v1/settings/customer-events/pixels",
        json={"name": "Meta", "provider": "facebook", "pixel_id": "FB"},
        headers=admin_headers,
    )
    assert created.status_code == 201
    pixel_id = created.json()["id"]

    await _reset_admin_sessions(db_session)
    deactivated = await client.post(
        f"/api/v1/settings/customer-events/pixels/{pixel_id}/deactivate",
        headers=admin_headers,
    )
    assert deactivated.status_code == 200
    assert deactivated.json()["is_active"] is False

    await _reset_admin_sessions(db_session)
    activated = await client.post(
        f"/api/v1/settings/customer-events/pixels/{pixel_id}/activate",
        headers=admin_headers,
    )
    assert activated.status_code == 200
    assert activated.json()["is_active"] is True

    await _reset_admin_sessions(db_session)
    missing = await client.post(
        "/api/v1/settings/customer-events/pixels/99999/deactivate", headers=admin_headers
    )
    assert missing.status_code == 404


async def test_delete_pixel(client, admin_headers, db_session):
    await _reset_admin_sessions(db_session)
    created = await client.post(
        "/api/v1/settings/customer-events/pixels",
        json={"name": "Meta", "provider": "facebook", "pixel_id": "FB"},
        headers=admin_headers,
    )
    assert created.status_code == 201
    pixel_id = created.json()["id"]

    await _reset_admin_sessions(db_session)
    resp = await client.delete(
        f"/api/v1/settings/customer-events/pixels/{pixel_id}", headers=admin_headers
    )
    assert resp.status_code == 204

    await _reset_admin_sessions(db_session)
    missing = await client.delete(
        "/api/v1/settings/customer-events/pixels/99999", headers=admin_headers
    )
    assert missing.status_code == 404


# ---------------------------------------------------------------------------
# Public storefront routes (no auth)
# ---------------------------------------------------------------------------

async def test_storefront_scripts_public_without_auth(client, db_session):
    db_session.add(
        TrackingPixel(
            name="Meta",
            provider=PixelProvider.facebook,
            kind=PixelKind.web,
            pixel_id="FB",
            script_content="<script>fbq('init','FB');</script>",
            placement=PixelPlacement.head,
            is_active=True,
        )
    )
    await db_session.commit()

    resp = await client.get("/api/v1/settings/customer-events/storefront-scripts")
    assert resp.status_code == 200
    body = resp.json()
    assert len(body) == 1
    assert body[0]["name"] == "Meta"
    assert "FB" in body[0]["script"]


async def test_storefront_scripts_filters_placement(client, db_session):
    db_session.add_all(
        [
            TrackingPixel(
                name="Head",
                provider=PixelProvider.facebook,
                kind=PixelKind.web,
                pixel_id="H",
                script_content="<script>h</script>",
                placement=PixelPlacement.head,
                is_active=True,
            ),
            TrackingPixel(
                name="Tail",
                provider=PixelProvider.custom,
                kind=PixelKind.web,
                pixel_id="T",
                script_content="<script>t</script>",
                placement=PixelPlacement.body_end,
                is_active=True,
            ),
        ]
    )
    await db_session.commit()

    resp = await client.get(
        "/api/v1/settings/customer-events/storefront-scripts",
        params={"placement": "body_end"},
    )
    assert resp.status_code == 200
    body = resp.json()
    assert [script["name"] for script in body] == ["Tail"]


async def test_public_event_dispatch_records_log(client, db_session):
    resp = await client.post(
        "/api/v1/settings/customer-events/events",
        json={"provider": "custom", "event_type": "Purchase", "payload": {"value": 199}},
    )
    assert resp.status_code == 200
    assert resp.json()["success"] is True
    assert resp.json()["event_type"] == "Purchase"

    logs = (await db_session.execute(select(PixelEventLog))).scalars().all()
    assert len(logs) == 1
    assert logs[0].success is True
    assert logs[0].payload == {"value": 199}


async def test_public_event_dispatch_invalid_provider_422(client):
    resp = await client.post(
        "/api/v1/settings/customer-events/events",
        json={"provider": "not_a_provider", "event_type": "Purchase"},
    )
    assert resp.status_code == 422


# ---------------------------------------------------------------------------
# Admin event logs
# ---------------------------------------------------------------------------

async def test_list_event_logs(client, db_session, admin_headers):
    db_session.add(
        PixelEventLog(
            provider="custom",
            event_type="Purchase",
            payload={"v": 1},
            success=True,
            response="{}",
        )
    )
    await db_session.commit()

    resp = await client.get(
        "/api/v1/settings/customer-events/events/logs", headers=admin_headers
    )
    assert resp.status_code == 200
    body = resp.json()
    assert len(body) == 1
    assert body[0]["event_type"] == "Purchase"
    assert body[0]["success"] is True
