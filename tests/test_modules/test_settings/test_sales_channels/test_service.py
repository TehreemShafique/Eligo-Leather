"""
Tests for app.modules.settings.sales_channels.service
"""

import pytest

from app.modules.orders.model import Order
from app.modules.settings.sales_channels import service
from app.modules.settings.sales_channels.adapters import ChannelAdapterError
from app.modules.settings.sales_channels.model import ChannelStatus, ChannelWebhookEvent, WebhookStatus
from app.modules.settings.sales_channels.schema import ChannelConnect, ChannelUpdate


# ---------------------------------------------------------------------------
# Channel catalog / connected rows
# ---------------------------------------------------------------------------

async def test_list_channels_returns_all_definitions_unconnected(db_session):
    channels = await service.list_channels(db_session)
    assert len(channels) == len(service.CHANNEL_DEFINITIONS)
    assert {c.code for c in channels} == {"online_store", "facebook_instagram", "tiktok_shop", "google_shopping"}
    assert all(c.connected is False for c in channels)
    assert all(c.status is None for c in channels)


async def test_list_channels_reflects_connected_channel(db_session):
    await service.connect("online_store", ChannelConnect(), db_session)
    channels = await service.list_channels(db_session)
    online = next(c for c in channels if c.code == "online_store")
    assert online.connected is True
    assert online.status == ChannelStatus.active


async def test_get_channel_known(db_session):
    channel = await service.get_channel("online_store", db_session)
    assert channel is not None
    assert channel.code == "online_store"
    assert channel.connected is False


async def test_get_channel_unknown_returns_none(db_session):
    assert await service.get_channel("etsy", db_session) is None


async def test_list_connected_sorted_by_name(db_session):
    await service.connect("online_store", ChannelConnect(), db_session)
    await service.connect("facebook_instagram", ChannelConnect(), db_session)
    connected = await service.list_connected(db_session)
    assert [c.channel_code for c in connected] == ["facebook_instagram", "online_store"]


async def test_get_connected_unknown_returns_none(db_session):
    assert await service.get_connected("etsy", db_session) is None


# ---------------------------------------------------------------------------
# Connect / update / disconnect
# ---------------------------------------------------------------------------

async def test_connect_creates_channel_with_encrypted_tokens(db_session):
    row = await service.connect(
        "facebook_instagram",
        ChannelConnect(auth_tokens={"app_id": "abc", "app_secret": "shh"}, settings={"currency": "PKR"}),
        db_session,
    )
    assert row.channel_code == "facebook_instagram"
    assert row.status == ChannelStatus.active
    assert row.has_auth_tokens is True
    assert row.settings == {"currency": "PKR"}
    assert await service.get_connected("facebook_instagram", db_session) is not None


async def test_connect_unknown_channel_raises(db_session):
    with pytest.raises(ValueError, match="Unknown sales channel"):
        await service.connect("etsy", ChannelConnect(), db_session)


async def test_connect_updates_existing_channel(db_session):
    first = await service.connect("online_store", ChannelConnect(settings={"a": 1}), db_session)
    second = await service.connect("online_store", ChannelConnect(settings={"b": 2}), db_session)
    assert second.id == first.id
    assert second.settings == {"b": 2}


async def test_update_channel_settings(db_session):
    await service.connect("online_store", ChannelConnect(), db_session)
    updated = await service.update("online_store", ChannelUpdate(settings={"theme": "dark"}), db_session)
    assert updated is not None
    assert updated.settings == {"theme": "dark"}


async def test_update_channel_missing_returns_none(db_session):
    assert await service.update("online_store", ChannelUpdate(settings={}), db_session) is None


async def test_set_status(db_session):
    await service.connect("online_store", ChannelConnect(), db_session)
    assert (await service.set_status("online_store", ChannelStatus.inactive, db_session)).status == ChannelStatus.inactive
    assert (await service.set_status("online_store", ChannelStatus.active, db_session)).status == ChannelStatus.active


async def test_set_status_missing_returns_none(db_session):
    assert await service.set_status("online_store", ChannelStatus.active, db_session) is None


async def test_disconnect(db_session):
    await service.connect("online_store", ChannelConnect(), db_session)
    assert await service.disconnect("online_store", db_session) is True
    assert await service.get_connected("online_store", db_session) is None


async def test_disconnect_missing_returns_false(db_session):
    assert await service.disconnect("online_store", db_session) is False


# ---------------------------------------------------------------------------
# OAuth flow
# ---------------------------------------------------------------------------

async def test_get_oauth_authorize_url_meta(db_session):
    await service.connect("facebook_instagram", ChannelConnect(auth_tokens={"app_id": "abc123"}), db_session)
    url = await service.get_oauth_authorize_url("facebook_instagram", db_session)
    assert url.startswith("https://www.facebook.com/v19.0/dialog/oauth?")
    assert "client_id=abc123" in url
    assert "response_type=code" in url


async def test_get_oauth_authorize_url_requires_oauth_channel(db_session):
    with pytest.raises(ValueError, match="does not use OAuth"):
        await service.get_oauth_authorize_url("online_store", db_session)


async def test_get_oauth_authorize_url_unknown_channel_raises(db_session):
    with pytest.raises(ValueError):
        await service.get_oauth_authorize_url("etsy", db_session)


async def test_handle_oauth_callback_not_connected_raises(db_session):
    with pytest.raises(ValueError, match="not being connected"):
        await service.handle_oauth_callback("facebook_instagram", "code123", None, db_session)


async def test_handle_oauth_callback_meta_not_wired(db_session):
    await service.connect("facebook_instagram", ChannelConnect(auth_tokens={"app_id": "abc"}), db_session)
    with pytest.raises(ChannelAdapterError):
        await service.handle_oauth_callback("facebook_instagram", "code123", None, db_session)


# ---------------------------------------------------------------------------
# Outbound sync
# ---------------------------------------------------------------------------

async def test_sync_products_requires_connected_channel(db_session):
    with pytest.raises(ValueError, match="not connected"):
        await service.sync_products("facebook_instagram", None, db_session)


async def test_sync_products_unsupported_channel_raises(db_session):
    await service.connect("online_store", ChannelConnect(), db_session)
    with pytest.raises(ValueError, match="does not support product sync"):
        await service.sync_products("online_store", None, db_session)


async def test_sync_products_meta_returns_adapter_result(db_session):
    await service.connect("facebook_instagram", ChannelConnect(auth_tokens={"app_id": "abc"}), db_session)
    result = await service.sync_products("facebook_instagram", None, db_session)
    assert result.channel_code == "facebook_instagram"
    assert result.success is False
    assert result.pushed == 0


async def test_sync_inventory_requires_meta_channel(db_session):
    await service.connect("online_store", ChannelConnect(), db_session)
    with pytest.raises(ValueError, match="separate inventory action"):
        await service.sync_inventory("online_store", None, db_session)


async def test_sync_inventory_meta_returns_adapter_result(db_session):
    await service.connect("facebook_instagram", ChannelConnect(auth_tokens={"app_id": "abc"}), db_session)
    result = await service.sync_inventory("facebook_instagram", None, db_session)
    assert result.channel_code == "facebook_instagram"
    assert result.success is False


# ---------------------------------------------------------------------------
# Inbound webhook ingestion
# ---------------------------------------------------------------------------

async def test_receive_webhook_unknown_channel_raises(db_session):
    with pytest.raises(ValueError, match="Unknown sales channel"):
        await service.receive_webhook("etsy", {"event_type": "order_created"}, db_session)


async def test_receive_webhook_records_and_processes_order(db_session):
    event = await service.receive_webhook(
        "online_store",
        {
            "event_type": "order_created",
            "order_number": "WEB-1001",
            "channel": "Online Store",
            "items": [{"product_name": "Leather Belt", "quantity": 1, "unit_price": 250}],
        },
        db_session,
    )
    assert event.id is not None
    assert event.channel_code == "online_store"
    assert event.event_type == "order_created"
    assert event.status == WebhookStatus.processed
    assert event.processed_order_id is not None

    order = await db_session.get(Order, event.processed_order_id)
    assert order is not None
    assert order.order_number == "WEB-1001"


async def test_receive_webhook_marks_failed_event(db_session):
    """_find_or_create_customer calls the async ``db.execute`` without awaiting
    it, so any webhook payload carrying an email crashes during ingestion.
    The event must still be persisted with status=failed instead of 500ing.
    """
    event = await service.receive_webhook(
        "online_store",
        {
            "event_type": "order_created",
            "email": "buyer@example.com",
            "items": [{"product_name": "Leather Belt", "quantity": 1, "unit_price": 250}],
        },
        db_session,
    )
    assert event.status == WebhookStatus.failed
    assert event.error is not None


async def test_list_webhook_events(db_session):
    for n in range(3):
        await service.receive_webhook(
            "online_store",
            {"order_number": f"WEB-{n}", "items": [{"product_name": "Belt", "quantity": 1, "unit_price": 100}]},
            db_session,
        )
    events = await service.list_webhook_events(db_session)
    assert len(events) == 3
    assert all(isinstance(e, ChannelWebhookEvent) for e in events)
    assert [e.event_type for e in events] == ["order_created"] * 3

    paged = await service.list_webhook_events(db_session, skip=1, limit=1)
    assert len(paged) == 1
