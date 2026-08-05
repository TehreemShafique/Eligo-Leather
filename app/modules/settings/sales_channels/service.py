import json
import uuid
from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.modules.settings.apps.crypto import decrypt_credentials, encrypt_credentials
from app.modules.settings.sales_channels import adapters
from app.modules.settings.sales_channels.adapters import ChannelAdapterError
from app.modules.settings.sales_channels.model import (
    ChannelStatus,
    ChannelWebhookEvent,
    SalesChannel,
    WebhookStatus,
)
from app.modules.settings.sales_channels.schema import (
    ChannelConnect,
    ChannelDefinition,
    ChannelUpdate,
    ProductSyncItem,
    ProductSyncOut,
    VariantSyncItem,
)
from app.modules.catalog.model import Product, ProductVariant
from app.modules.customers.model import Customer
from app.modules.orders.model import Order, OrderItem, PaymentStatus
from app.modules.orders.schema import OrderCreate, OrderItemCreate

# =====================================================================
# CHANNEL REGISTRY
# =====================================================================
# Every channel shown in Settings -> Sales Channels lives in this list.
# `oauth_fields` are what the admin UI asks for before OAuth (or what the
# connect endpoint expects inside auth_tokens).
# =====================================================================

CHANNEL_DEFINITIONS: list[dict] = [
    {
        "code": "online_store",
        "name": "Online Store",
        "description": "Your main Eligo website. Products and orders are native.",
        "requires_oauth": False,
        "can_sync_products": False,
        "can_ingest_orders": True,
        "actions": ["sync_products", "ingest_order"],
        "oauth_fields": [],
    },
    {
        "code": "facebook_instagram",
        "name": "Facebook & Instagram",
        "description": "Sell through your Facebook Shop and Instagram profile via the Meta Commerce API.",
        "requires_oauth": True,
        "can_sync_products": True,
        "can_ingest_orders": True,
        "actions": ["sync_catalog", "sync_inventory", "ingest_order"],
        "oauth_fields": [
            {"name": "app_id", "label": "Meta App ID", "type": "text"},
            {"name": "app_secret", "label": "Meta App Secret", "type": "password"},
        ],
    },
    {
        "code": "tiktok_shop",
        "name": "TikTok Shop",
        "description": "Sell through TikTok Shop using the TikTok Shop Partner API.",
        "requires_oauth": True,
        "can_sync_products": True,
        "can_ingest_orders": True,
        "actions": ["sync_catalog", "ingest_order"],
        "oauth_fields": [
            {"name": "app_key", "label": "App Key", "type": "text"},
            {"name": "app_secret", "label": "App Secret", "type": "password"},
        ],
    },
    {
        "code": "google_shopping",
        "name": "Google Shopping",
        "description": "List products on Google Merchant Center.",
        "requires_oauth": True,
        "can_sync_products": True,
        "can_ingest_orders": True,
        "actions": ["sync_catalog", "ingest_order"],
        "oauth_fields": [
            {"name": "merchant_id", "label": "Merchant Center ID", "type": "text"},
            {"name": "service_account_json", "label": "Service Account JSON", "type": "password"},
        ],
    },
]

_DEFINITIONS_BY_CODE: dict[str, dict] = {ch["code"]: ch for ch in CHANNEL_DEFINITIONS}

# The state token is a CSRF guard. In production persist it per-session
# (e.g. signed cookie / DB) so the callback can verify it matches.
_OAUTH_STATE: str | None = None


def get_definition(channel_code: str) -> dict | None:
    return _DEFINITIONS_BY_CODE.get(channel_code)


# =====================================================================
# Channel catalog / connected rows
# =====================================================================

async def _connected_by_code(db: AsyncSession) -> dict[str, SalesChannel]:
    result = await db.execute(select(SalesChannel))
    return {row.channel_code: row for row in result.scalars().all()}


async def list_channels(db: AsyncSession) -> list[ChannelDefinition]:
    connected = await _connected_by_code(db)
    channels: list[ChannelDefinition] = []
    for definition in CHANNEL_DEFINITIONS:
        row = connected.get(definition["code"])
        channels.append(
            ChannelDefinition(
                **definition,
                connected=row is not None,
                status=row.status if row else None,
            )
        )
    return channels


async def get_channel(channel_code: str, db: AsyncSession) -> ChannelDefinition | None:
    definition = get_definition(channel_code)
    if not definition:
        return None
    row = await get_connected(channel_code, db)
    return ChannelDefinition(**definition, connected=row is not None, status=row.status if row else None)


async def list_connected(db: AsyncSession) -> list[SalesChannel]:
    result = await db.execute(select(SalesChannel).order_by(SalesChannel.channel_name))
    return list(result.scalars().all())


async def get_connected(channel_code: str, db: AsyncSession) -> SalesChannel | None:
    result = await db.execute(select(SalesChannel).where(SalesChannel.channel_code == channel_code))
    return result.scalar_one_or_none()


# =====================================================================
# Connect / update / disconnect
# =====================================================================

async def connect(channel_code: str, data: ChannelConnect, db: AsyncSession) -> SalesChannel:
    definition = get_definition(channel_code)
    if not definition:
        raise ValueError(f"Unknown sales channel: {channel_code}")

    row = await get_connected(channel_code, db)
    if row is None:
        row = SalesChannel(
            channel_code=definition["code"],
            channel_name=definition["name"],
            status=ChannelStatus.not_connected,
        )
        db.add(row)

    if data.auth_tokens is not None:
        row.auth_tokens = encrypt_credentials(data.auth_tokens)
    if data.settings is not None:
        row.settings = data.settings
    row.status = ChannelStatus.active

    await db.commit()
    await db.refresh(row)
    return row


async def update(channel_code: str, data: ChannelUpdate, db: AsyncSession) -> SalesChannel | None:
    row = await get_connected(channel_code, db)
    if not row:
        return None
    if data.settings is not None:
        row.settings = data.settings
    await db.commit()
    await db.refresh(row)
    return row


async def set_status(channel_code: str, status: ChannelStatus, db: AsyncSession) -> SalesChannel | None:
    row = await get_connected(channel_code, db)
    if not row:
        return None
    row.status = status
    await db.commit()
    await db.refresh(row)
    return row


async def disconnect(channel_code: str, db: AsyncSession) -> bool:
    row = await get_connected(channel_code, db)
    if not row:
        return False
    await db.delete(row)
    await db.commit()
    return True


# =====================================================================
# OAuth flow
# =====================================================================

async def get_oauth_authorize_url(channel_code: str, db: AsyncSession) -> str:
    """Build the provider's OAuth authorize URL the merchant is redirected to."""
    definition = get_definition(channel_code)
    row = await get_connected(channel_code, db)
    if not definition or not definition["requires_oauth"]:
        raise ValueError(f"Channel '{channel_code}' does not use OAuth")

    tokens = decrypt_credentials(row.auth_tokens) if row else {}

    if channel_code == "facebook_instagram":
        # =================================================================
        # META OAUTH - how to build the authorize URL
        # -----------------------------------------------------------------
        # 1. Get App ID / Secret from developers.facebook.com (see top of
        #    adapters/__init__.py for the full walkthrough).
        # 2. callback must be registered in the Meta App dashboard and match
        #    the one below.
        # =================================================================
        import urllib.parse

        app_id = tokens.get("app_id") or ""
        redirect_uri = (
            "https://YOUR_DOMAIN/api/v1/settings/sales-channels/webhooks/"
            "facebook_instagram/oauth/callback"
        )
        scope = (
            "email,catalog_management,instagram_basic,instagram_manage_insights,"
            "pages_manage_ads,pages_show_list,business_management"
        )
        global _OAUTH_STATE
        _OAUTH_STATE = uuid.uuid4().hex
        params = urllib.parse.urlencode(
            {
                "client_id": app_id,
                "redirect_uri": redirect_uri,
                "state": _OAUTH_STATE,
                "scope": scope,
                "response_type": "code",
            }
        )
        return f"https://www.facebook.com/v19.0/dialog/oauth?{params}"

    # =================================================================
    # ADD OAUTH FOR OTHER CHANNELS HERE (tiktok_shop, google_shopping)
    # e.g. TikTok:
    #   https://open-api.tiktokglobalshop.com/auth/authorize?app_key=...&state=...&redirect_uri=...
    # =================================================================
    raise ValueError(f"OAuth URL builder not wired for channel '{channel_code}'")


async def handle_oauth_callback(
    channel_code: str,
    code: str,
    state: str | None,
    db: AsyncSession,
) -> SalesChannel:
    """Exchange the OAuth `code` for an access token and store it encrypted."""
    definition = get_definition(channel_code)
    row = await get_connected(channel_code, db)
    if not definition or not row:
        raise ValueError(f"Channel '{channel_code}' is not being connected")

    if state and _OAUTH_STATE and state != _OAUTH_STATE:
        raise ValueError("OAuth state mismatch - possible CSRF attack")

    tokens = decrypt_credentials(row.auth_tokens)

    if channel_code == "facebook_instagram":
        # =================================================================
        # META TOKEN EXCHANGE - server side, NEVER expose app_secret
        # -----------------------------------------------------------------
        # a. Short-lived token:
        #      GET https://graph.facebook.com/v19.0/oauth/access_token
        #          ?client_id={app_id}&client_secret={app_secret}
        #          &redirect_uri={callback}&code={code}
        # b. Long-lived (60 day) token:
        #      GET https://graph.facebook.com/v19.0/oauth/access_token
        #          ?grant_type=fb_exchange_token&client_id={app_id}
        #          &client_secret={app_secret}&fb_exchange_token={short_token}
        # c. Fetch page + business + product catalog ids:
        #      GET /me/accounts                    -> page access token
        #      GET /{page_id}?fields=business      -> business id
        #      GET /{business_id}?fields=owned_product_catalogs -> catalog id
        # -----------------------------------------------------------------
        # import httpx
        # async with httpx.AsyncClient() as client:
        #     r = await client.get(
        #         "https://graph.facebook.com/v19.0/oauth/access_token",
        #         params={
        #             "client_id": tokens["app_id"],
        #             "client_secret": tokens["app_secret"],
        #             "redirect_uri": CALLBACK,
        #             "code": code,
        #         },
        #     )
        #     r.raise_for_status()
        #     short_token = r.json()["access_token"]
        #     ... exchange for long-lived token, then call /me/accounts ...
        # tokens["access_token"] = long_lived_token
        # tokens["page_id"] = ...
        # tokens["business_id"] = ...
        # tokens["product_catalog_id"] = ...
        # =================================================================
        raise ChannelAdapterError(
            "Meta OAuth token exchange not wired yet - add it in "
            "sales_channels/service.py -> handle_oauth_callback()"
        )

    # =================================================================
    # ADD TOKEN EXCHANGE FOR OTHER CHANNELS HERE (tiktok_shop, google_shopping)
    # =================================================================
    raise ChannelAdapterError(
        f"OAuth token exchange not wired for channel '{channel_code}' - add it in "
        "sales_channels/service.py -> handle_oauth_callback()"
    )


# =====================================================================
# Outbound product / inventory sync
# =====================================================================

async def _build_catalog_payload(db: AsyncSession, product_ids: list[int] | None) -> list[ProductSyncItem]:
    query = select(Product).options(
        selectinload(Product.variants),
        selectinload(Product.images),
    )
    if product_ids:
        query = query.where(Product.id.in_(product_ids))
    result = await db.execute(query)
    products = result.scalars().all()

    items: list[ProductSyncItem] = []
    for product in products:
        items.append(
            ProductSyncItem(
                product_id=product.id,
                title=product.title,
                description=product.description,
                status=product.status,
                url_handle=product.url_handle,
                tags=product.tags,
                images=[img.url for img in product.images],
                variants=[
                    VariantSyncItem(
                        variant_id=v.id,
                        sku=v.sku,
                        title=v.title,
                        price=v.price,
                        compare_at_price=v.compare_at_price,
                        inventory_quantity=v.inventory_quantity,
                        weight=v.weight,
                        weight_unit=v.weight_unit,
                    )
                    for v in product.variants
                ],
            )
        )
    return items


async def sync_products(channel_code: str, product_ids: list[int] | None, db: AsyncSession) -> ProductSyncOut:
    row = await get_connected(channel_code, db)
    definition = get_definition(channel_code)
    if not row or not definition:
        raise ValueError(f"Channel not connected: {channel_code}")
    if not definition["can_sync_products"]:
        raise ValueError(f"Channel '{channel_code}' does not support product sync")

    products = await _build_catalog_payload(db, product_ids)
    tokens = decrypt_credentials(row.auth_tokens)

    # Figure out the adapter action name for this channel's catalog push.
    action = "sync_catalog" if channel_code in ("facebook_instagram", "tiktok_shop", "google_shopping") else "sync_products"
    try:
        result = await adapters.run(
            channel_code, action, tokens, row.settings or {},
            {"products": [p.model_dump(mode="json") for p in products]},
        )
    except ChannelAdapterError as exc:
        raise ValueError(str(exc))

    return ProductSyncOut(
        success=result.get("success", False),
        channel_code=channel_code,
        pushed=len(products) if result.get("success") else 0,
        failed=0 if result.get("success") else len(products),
        results=result.get("results", []),
    )


async def sync_inventory(channel_code: str, product_ids: list[int] | None, db: AsyncSession) -> ProductSyncOut:
    row = await get_connected(channel_code, db)
    definition = get_definition(channel_code)
    if not row or not definition:
        raise ValueError(f"Channel not connected: {channel_code}")
    if channel_code != "facebook_instagram":
        raise ValueError(f"Channel '{channel_code}' does not expose a separate inventory action")

    variants: list[dict] = []
    for product in await _build_catalog_payload(db, product_ids):
        variants.extend(p.model_dump(mode="json") for p in product.variants)

    tokens = decrypt_credentials(row.auth_tokens)
    try:
        result = await adapters.run(
            channel_code, "sync_inventory", tokens, row.settings or {},
            {"variants": variants},
        )
    except ChannelAdapterError as exc:
        raise ValueError(str(exc))

    return ProductSyncOut(
        success=result.get("success", False),
        channel_code=channel_code,
        pushed=len(variants) if result.get("success") else 0,
        failed=0 if result.get("success") else len(variants),
        results=result.get("results", []),
    )


# =====================================================================
# Inbound webhook ingestion
# =====================================================================

async def receive_webhook(channel_code: str, raw_payload: dict, db: AsyncSession) -> ChannelWebhookEvent:
    """Log the raw webhook, then try to map it into an order."""
    definition = get_definition(channel_code)
    if not definition:
        raise ValueError(f"Unknown sales channel: {channel_code}")

    event_type = raw_payload.get("event_type") or raw_payload.get("type") or "order_created"
    event = ChannelWebhookEvent(
        channel_code=channel_code,
        event_type=event_type,
        payload=raw_payload,
        status=WebhookStatus.received,
    )
    db.add(event)
    await db.flush()

    try:
        order = await ingest_order(db, channel_code, event, raw_payload)
        event.status = WebhookStatus.processed
        event.processed_order_id = order.id
    except Exception as exc:  # noqa: BLE001 - a bad webhook must not 500
        event.status = WebhookStatus.failed
        event.error = str(exc)[:2000]

    event.processed_at = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(event)
    return event


async def ingest_order(
    db: AsyncSession,
    channel_code: str,
    event: ChannelWebhookEvent,
    raw_payload: dict,
) -> Order:
    """Map a provider webhook payload into a native Order row.

    The adapter (`ingest_order` action) may normalize provider-specific fields;
    here we map the common order shape and create the order.
    """
    row = await get_connected(channel_code, db)
    tokens = decrypt_credentials(row.auth_tokens) if row else {}
    settings = row.settings if row else {}

    adapter_result = await adapters.run(
        channel_code, "ingest_order", tokens, settings or {}, {"order": raw_payload}
    )
    order_data = adapter_result.get("mapped_order", raw_payload)

    order_number = str(order_data.get("order_number") or order_data.get("merchant_order_id") or uuid.uuid4().hex)
    currency = order_data.get("currency", "PKR")

    items = order_data.get("items") or order_data.get("line_items") or []
    mapped_items = [
        OrderItemCreate(
            product_id=item.get("product_id"),
            variant_id=item.get("variant_id"),
            product_name=item.get("product_name") or item.get("title") or "Channel order item",
            sku=item.get("sku"),
            variant_title=item.get("variant_title"),
            quantity=int(item.get("quantity", 1)),
            unit_price=item.get("unit_price", item.get("price", 0)),
        )
        for item in items
    ]

    customer = _find_or_create_customer(db, order_data)

    create = OrderCreate(
        order_number=order_number,
        customer_id=customer.id if customer else None,
        channel=order_data.get("channel") or (row.channel_name if row else channel_code),
        currency=currency,
        shipping_cost=order_data.get("shipping_cost", 0),
        tax=order_data.get("tax", 0),
        paid_amount=order_data.get("paid_amount", 0),
        shipping_address=json.dumps(order_data.get("shipping_address")) if order_data.get("shipping_address") else None,
        billing_address=json.dumps(order_data.get("billing_address")) if order_data.get("billing_address") else None,
        tags=order_data.get("tags") or f"Channel:{channel_code}",
        customer_note=order_data.get("customer_note"),
        tracking_company=order_data.get("tracking_company"),
        tracking_number=order_data.get("tracking_number"),
        items=mapped_items,
    )
    # `create_order` also writes an order_created audit log tagged with channel.
    return await _create_order(db, create)


def _find_or_create_customer(db: AsyncSession, order_data: dict) -> Customer | None:
    """Look up a customer by email/phone, otherwise create one from the payload."""
    email = (order_data.get("email") or "").strip().lower()
    phone = (order_data.get("phone") or "").strip()

    if email:
        result = db.execute(select(Customer).where(Customer.email == email))
        customer = result.scalar_one_or_none()
        if customer:
            return customer

    name = order_data.get("customer_name") or order_data.get("name") or ""
    first, _, last = name.partition(" ")
    if email or phone or name:
        customer = Customer(
            email=email or f"channel-{uuid.uuid4().hex[:12]}@eligo.local",
            first_name=first or None,
            last_name=last or None,
            phone=phone or None,
        )
        db.add(customer)
        return customer
    return None


async def _create_order(db: AsyncSession, data: OrderCreate) -> Order:
    from decimal import Decimal

    subtotal = sum((item.unit_price * item.quantity for item in data.items), Decimal("0"))
    total = subtotal + data.shipping_cost + data.tax

    order = Order(
        order_number=data.order_number,
        customer_id=data.customer_id,
        channel=data.channel,
        currency=data.currency,
        subtotal=subtotal,
        shipping_cost=data.shipping_cost,
        tax=data.tax,
        total_price=total,
        paid_amount=data.paid_amount,
        tags=data.tags,
        shipping_address=data.shipping_address,
        billing_address=data.billing_address,
        customer_note=data.customer_note,
        tracking_company=data.tracking_company,
        tracking_number=data.tracking_number,
        payment_status=PaymentStatus.paid if data.paid_amount > 0 else PaymentStatus.pending,
        items=[
            OrderItem(
                product_id=item.product_id,
                variant_id=item.variant_id,
                product_name=item.product_name,
                sku=item.sku,
                variant_title=item.variant_title,
                quantity=item.quantity,
                unit_price=item.unit_price,
                total_price=item.total_price or (item.unit_price * item.quantity),
                requires_shipping=item.requires_shipping,
                is_gift_card=item.is_gift_card,
            )
            for item in data.items
        ],
    )
    db.add(order)
    await db.flush()

    from app.modules.orders.model import OrderAuditLog

    db.add(
        OrderAuditLog(
            order_id=order.id,
            event_type="order_created",
            description=f"Order {data.order_number} ingested from {data.channel} webhook",
            metadata_json=json.dumps({"channel": data.channel}),
        )
    )
    await db.commit()
    await db.refresh(order, attribute_names=["items", "audit_logs"])
    return order


async def list_webhook_events(db: AsyncSession, skip: int = 0, limit: int = 50) -> list[ChannelWebhookEvent]:
    result = await db.execute(
        select(ChannelWebhookEvent)
        .order_by(ChannelWebhookEvent.created_at.desc())
        .offset(skip)
        .limit(limit)
    )
    return list(result.scalars().all())
