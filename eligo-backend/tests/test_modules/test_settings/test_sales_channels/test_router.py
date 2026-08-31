"""
Tests for app.modules.settings.sales_channels.router
"""

from sqlalchemy import select

from app.modules.settings.apps.crypto import encrypt_credentials
from app.modules.settings.sales_channels.model import ChannelStatus, SalesChannel


async def _add_connected(
    db_session,
    code,
    name,
    status=ChannelStatus.active,
    tokens=None,
):
    db_session.add(
        SalesChannel(
            channel_code=code,
            channel_name=name,
            status=status,
            auth_tokens=encrypt_credentials(tokens) if tokens else None,
            settings={"currency": "PKR"},
        )
    )
    await db_session.commit()


# ---------------------------------------------------------------------------
# Admin router - auth
# ---------------------------------------------------------------------------

async def test_admin_routes_require_auth(client):
    resp = await client.get("/api/v1/settings/sales-channels")
    assert resp.status_code in (401, 403)


async def test_admin_routes_reject_non_admin(client, auth_headers):
    resp = await client.get("/api/v1/settings/sales-channels", headers=auth_headers)
    assert resp.status_code == 403


# ---------------------------------------------------------------------------
# Admin router - channel catalog
# ---------------------------------------------------------------------------

async def test_list_channels(client, admin_headers):
    resp = await client.get("/api/v1/settings/sales-channels", headers=admin_headers)
    assert resp.status_code == 200
    body = resp.json()
    assert len(body) == 4
    assert {c["code"] for c in body} == {"online_store", "facebook_instagram", "tiktok_shop", "google_shopping"}
    assert all(c["connected"] is False for c in body)


async def test_list_channels_reflects_connected(client, admin_headers, db_session):
    await _add_connected(db_session, "online_store", "Online Store")
    resp = await client.get("/api/v1/settings/sales-channels", headers=admin_headers)
    assert resp.status_code == 200
    online = next(c for c in resp.json() if c["code"] == "online_store")
    assert online["connected"] is True
    assert online["status"] == "active"


async def test_list_connected_channels(client, admin_headers, db_session):
    await _add_connected(db_session, "online_store", "Online Store")
    resp = await client.get("/api/v1/settings/sales-channels/connected", headers=admin_headers)
    assert resp.status_code == 200
    body = resp.json()
    assert len(body) == 1
    assert body[0]["channel_code"] == "online_store"
    assert body[0]["status"] == "active"


async def test_get_channel_unconnected(client, admin_headers):
    resp = await client.get("/api/v1/settings/sales-channels/online_store", headers=admin_headers)
    assert resp.status_code == 200
    body = resp.json()
    assert body["connected"] is False
    assert body["status"] is None


async def test_get_channel_connected(client, admin_headers, db_session):
    await _add_connected(db_session, "online_store", "Online Store")
    resp = await client.get("/api/v1/settings/sales-channels/online_store", headers=admin_headers)
    assert resp.status_code == 200
    body = resp.json()
    assert body["connected"] is True
    assert body["status"] == "active"


async def test_get_channel_unknown_404(client, admin_headers):
    resp = await client.get("/api/v1/settings/sales-channels/etsy", headers=admin_headers)
    assert resp.status_code == 404
    assert resp.json()["detail"] == "Sales channel not found"


# ---------------------------------------------------------------------------
# Admin router - connect / update / status / disconnect
# ---------------------------------------------------------------------------

async def test_connect_channel(client, admin_headers, db_session):
    resp = await client.post(
        "/api/v1/settings/sales-channels/facebook_instagram/connect",
        json={"auth_tokens": {"app_id": "abc", "app_secret": "shh"}, "settings": {"currency": "PKR"}},
        headers=admin_headers,
    )
    assert resp.status_code == 201
    body = resp.json()
    assert body["channel_code"] == "facebook_instagram"
    assert body["status"] == "active"
    assert body["has_auth_tokens"] is True

    row = (
        await db_session.execute(select(SalesChannel).where(SalesChannel.channel_code == "facebook_instagram"))
    ).scalar_one_or_none()
    assert row is not None
    assert row.status == ChannelStatus.active
    assert row.settings == {"currency": "PKR"}


async def test_connect_unknown_channel_404(client, admin_headers):
    resp = await client.post(
        "/api/v1/settings/sales-channels/etsy/connect", json={}, headers=admin_headers
    )
    assert resp.status_code == 404
    assert "Unknown sales channel" in resp.json()["detail"]


async def test_connect_invalid_body_422(client, admin_headers):
    resp = await client.post(
        "/api/v1/settings/sales-channels/online_store/connect",
        json={"auth_tokens": 123},
        headers=admin_headers,
    )
    assert resp.status_code == 422


async def test_update_channel(client, admin_headers, db_session):
    await _add_connected(db_session, "online_store", "Online Store")
    resp = await client.patch(
        "/api/v1/settings/sales-channels/online_store",
        json={"settings": {"theme": "dark"}},
        headers=admin_headers,
    )
    assert resp.status_code == 200
    assert resp.json()["settings"] == {"theme": "dark"}


async def test_update_channel_not_connected_404(client, admin_headers):
    resp = await client.patch(
        "/api/v1/settings/sales-channels/online_store", json={"settings": {}}, headers=admin_headers
    )
    assert resp.status_code == 404
    assert resp.json()["detail"] == "Sales channel is not connected"


async def test_activate_channel(client, admin_headers, db_session):
    await _add_connected(db_session, "online_store", "Online Store", status=ChannelStatus.inactive)
    resp = await client.post(
        "/api/v1/settings/sales-channels/online_store/activate", headers=admin_headers
    )
    assert resp.status_code == 200
    assert resp.json()["status"] == "active"


async def test_deactivate_channel(client, admin_headers, db_session):
    await _add_connected(db_session, "online_store", "Online Store")
    resp = await client.post(
        "/api/v1/settings/sales-channels/online_store/deactivate", headers=admin_headers
    )
    assert resp.status_code == 200
    assert resp.json()["status"] == "inactive"


async def test_activate_channel_not_connected_404(client, admin_headers):
    resp = await client.post(
        "/api/v1/settings/sales-channels/online_store/activate", headers=admin_headers
    )
    assert resp.status_code == 404
    assert resp.json()["detail"] == "Sales channel is not connected"


async def test_disconnect_channel(client, admin_headers, db_session):
    await _add_connected(db_session, "online_store", "Online Store")
    resp = await client.post(
        "/api/v1/settings/sales-channels/online_store/disconnect", headers=admin_headers
    )
    assert resp.status_code == 204

    row = (
        await db_session.execute(select(SalesChannel).where(SalesChannel.channel_code == "online_store"))
    ).scalar_one_or_none()
    assert row is None


async def test_disconnect_channel_not_connected_404(client, admin_headers):
    resp = await client.post(
        "/api/v1/settings/sales-channels/online_store/disconnect", headers=admin_headers
    )
    assert resp.status_code == 404
    assert resp.json()["detail"] == "Sales channel is not connected"


# ---------------------------------------------------------------------------
# Admin router - outbound sync
# ---------------------------------------------------------------------------

async def test_sync_products_unsupported_channel_400(client, admin_headers, db_session):
    await _add_connected(db_session, "online_store", "Online Store")
    resp = await client.post(
        "/api/v1/settings/sales-channels/online_store/sync/products",
        json={},
        headers=admin_headers,
    )
    assert resp.status_code == 400
    assert "does not support product sync" in resp.json()["detail"]


async def test_sync_products_not_connected_400(client, admin_headers):
    resp = await client.post(
        "/api/v1/settings/sales-channels/facebook_instagram/sync/products",
        json={},
        headers=admin_headers,
    )
    assert resp.status_code == 400


async def test_sync_products_meta(client, admin_headers, db_session):
    await _add_connected(
        db_session, "facebook_instagram", "Facebook & Instagram", tokens={"app_id": "abc"}
    )
    resp = await client.post(
        "/api/v1/settings/sales-channels/facebook_instagram/sync/products",
        json={"product_ids": []},
        headers=admin_headers,
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["channel_code"] == "facebook_instagram"
    assert body["success"] is False
    assert body["pushed"] == 0


async def test_sync_inventory_unsupported_channel_400(client, admin_headers, db_session):
    await _add_connected(db_session, "online_store", "Online Store")
    resp = await client.post(
        "/api/v1/settings/sales-channels/online_store/sync/inventory", json={}, headers=admin_headers
    )
    assert resp.status_code == 400
    assert "separate inventory action" in resp.json()["detail"]


async def test_sync_inventory_meta(client, admin_headers, db_session):
    await _add_connected(
        db_session, "facebook_instagram", "Facebook & Instagram", tokens={"app_id": "abc"}
    )
    resp = await client.post(
        "/api/v1/settings/sales-channels/facebook_instagram/sync/inventory",
        json={},
        headers=admin_headers,
    )
    assert resp.status_code == 200
    assert resp.json()["channel_code"] == "facebook_instagram"
    assert resp.json()["success"] is False


# ---------------------------------------------------------------------------
# Public webhook router (no auth required)
# ---------------------------------------------------------------------------

async def test_webhook_endpoints_require_no_auth(client):
    resp = await client.post(
        "/api/v1/settings/sales-channels/webhooks/online_store",
        json={"order_number": "WEB-1", "items": [{"product_name": "Belt", "quantity": 1, "unit_price": 100}]},
    )
    assert resp.status_code == 200
    assert resp.json()["received"] is True


async def test_webhook_records_event_and_processes_order(client, admin_headers):
    resp = await client.post(
        "/api/v1/settings/sales-channels/webhooks/online_store",
        json={
            "event_type": "order_created",
            "order_number": "WEB-100",
            "items": [{"product_name": "Leather Belt", "quantity": 1, "unit_price": 250}],
        },
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["received"] is True
    assert body["status"] == "processed"
    assert body["event_id"] > 0

    events = await client.get("/api/v1/settings/sales-channels/webhooks/events", headers=admin_headers)
    assert events.status_code == 200
    assert len(events.json()) == 1
    assert events.json()[0]["event_type"] == "order_created"


async def test_webhook_unknown_channel_404(client):
    resp = await client.post(
        "/api/v1/settings/sales-channels/webhooks/etsy",
        json={"event_type": "order_created"},
    )
    assert resp.status_code == 404
    assert "Unknown sales channel" in resp.json()["detail"]


async def test_oauth_authorize_url_meta(client, db_session):
    await _add_connected(db_session, "facebook_instagram", "Facebook & Instagram", tokens={"app_id": "abc"})
    resp = await client.get(
        "/api/v1/settings/sales-channels/facebook_instagram/oauth/authorize-url"
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["channel_code"] == "facebook_instagram"
    assert body["authorize_url"].startswith("https://www.facebook.com/v19.0/dialog/oauth?")
    assert "client_id=abc" in body["authorize_url"]


async def test_oauth_authorize_url_non_oauth_channel_400(client):
    resp = await client.get("/api/v1/settings/sales-channels/online_store/oauth/authorize-url")
    assert resp.status_code == 400
    assert "does not use OAuth" in resp.json()["detail"]


async def test_oauth_authorize_url_unknown_channel_400(client):
    resp = await client.get("/api/v1/settings/sales-channels/etsy/oauth/authorize-url")
    assert resp.status_code == 400


async def test_oauth_callback_not_connected_400(client):
    resp = await client.get(
        "/api/v1/settings/sales-channels/facebook_instagram/oauth/callback",
        params={"code": "abc"},
    )
    assert resp.status_code == 400


async def test_oauth_callback_meta_not_wired_502(client, db_session):
    await _add_connected(db_session, "facebook_instagram", "Facebook & Instagram", tokens={"app_id": "abc"})
    resp = await client.get(
        "/api/v1/settings/sales-channels/facebook_instagram/oauth/callback",
        params={"code": "abc"},
    )
    assert resp.status_code == 502
