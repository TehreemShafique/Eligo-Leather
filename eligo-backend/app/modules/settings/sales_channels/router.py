from fastapi import APIRouter, Depends, HTTPException, status
from fastapi import Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.core.dependencies import require_admin

from app.modules.settings.sales_channels import service
from app.modules.settings.sales_channels.adapters import ChannelAdapterError
from app.modules.settings.sales_channels.model import ChannelStatus
from app.modules.settings.sales_channels.schema import (
    ChannelConnect,
    ChannelDefinition,
    ChannelOut,
    ChannelUpdate,
    OAuthAuthorizeURLOut,
    OAuthCallbackIn,
    ProductSyncOut,
    ProductSyncRequest,
    WebhookEventOut,
)

# =====================================================================
# ADMIN ROUTER (Settings -> Sales Channels management)
# =====================================================================

router = APIRouter(
    prefix="/sales-channels",
    tags=["Settings - Sales Channels"],
    dependencies=[Depends(require_admin)],
)


@router.get("", response_model=list[ChannelDefinition])
async def list_channels(db: AsyncSession = Depends(get_db)):
    """Channel store catalog with per-channel connected/status flags."""
    return await service.list_channels(db)


@router.get("/connected", response_model=list[ChannelOut])
async def list_connected_channels(db: AsyncSession = Depends(get_db)):
    return await service.list_connected(db)


@router.get("/webhooks/events", response_model=list[WebhookEventOut])
async def list_webhook_events(skip: int = 0, limit: int = 50, db: AsyncSession = Depends(get_db)):
    """Inbound webhook activity log (useful for debugging order ingestion)."""
    return await service.list_webhook_events(db, skip, limit)


@router.get("/{channel_code}", response_model=ChannelDefinition)
async def get_channel(channel_code: str, db: AsyncSession = Depends(get_db)):
    channel = await service.get_channel(channel_code, db)
    if not channel:
        raise HTTPException(status_code=404, detail="Sales channel not found")
    return channel


@router.post("/{channel_code}/connect", response_model=ChannelOut, status_code=status.HTTP_201_CREATED)
async def connect_channel(channel_code: str, data: ChannelConnect, db: AsyncSession = Depends(get_db)):
    try:
        return await service.connect(channel_code, data, db)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc))


@router.patch("/{channel_code}", response_model=ChannelOut)
async def update_channel(channel_code: str, data: ChannelUpdate, db: AsyncSession = Depends(get_db)):
    channel = await service.update(channel_code, data, db)
    if not channel:
        raise HTTPException(status_code=404, detail="Sales channel is not connected")
    return channel


@router.post("/{channel_code}/activate", response_model=ChannelOut)
async def activate_channel(channel_code: str, db: AsyncSession = Depends(get_db)):
    channel = await service.set_status(channel_code, ChannelStatus.active, db)
    if not channel:
        raise HTTPException(status_code=404, detail="Sales channel is not connected")
    return channel


@router.post("/{channel_code}/deactivate", response_model=ChannelOut)
async def deactivate_channel(channel_code: str, db: AsyncSession = Depends(get_db)):
    channel = await service.set_status(channel_code, ChannelStatus.inactive, db)
    if not channel:
        raise HTTPException(status_code=404, detail="Sales channel is not connected")
    return channel


@router.post("/{channel_code}/disconnect", status_code=status.HTTP_204_NO_CONTENT)
async def disconnect_channel(channel_code: str, db: AsyncSession = Depends(get_db)):
    deleted = await service.disconnect(channel_code, db)
    if not deleted:
        raise HTTPException(status_code=404, detail="Sales channel is not connected")


# =====================================================================
# Outbound sync endpoints
# =====================================================================

@router.post("/{channel_code}/sync/products", response_model=ProductSyncOut)
async def sync_products(
    channel_code: str,
    data: ProductSyncRequest,
    db: AsyncSession = Depends(get_db),
):
    """Push products to the channel (Meta Commerce, TikTok, Google...)."""
    try:
        return await service.sync_products(channel_code, data.product_ids, db)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))


@router.post("/{channel_code}/sync/inventory", response_model=ProductSyncOut)
async def sync_inventory(
    channel_code: str,
    data: ProductSyncRequest,
    db: AsyncSession = Depends(get_db),
):
    """Push live stock levels to the channel."""
    try:
        return await service.sync_inventory(channel_code, data.product_ids, db)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))


# =====================================================================
# PUBLIC ROUTER (no auth - providers redirect / POST here)
# =====================================================================

webhook_router = APIRouter(
    prefix="/sales-channels",
    tags=["Settings - Sales Channels Webhooks"],
)


@webhook_router.get("/{channel_code}/oauth/authorize-url", response_model=OAuthAuthorizeURLOut)
async def get_authorize_url(channel_code: str, db: AsyncSession = Depends(get_db)):
    """Build the provider OAuth URL to send the merchant to (browser redirect)."""
    try:
        url = await service.get_oauth_authorize_url(channel_code, db)
        return OAuthAuthorizeURLOut(channel_code=channel_code, authorize_url=url)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))


@webhook_router.get("/{channel_code}/oauth/callback", response_model=ChannelOut)
async def oauth_callback(
    channel_code: str,
    code: str,
    state: str | None = None,
    db: AsyncSession = Depends(get_db),
):
    """Provider redirects the merchant's browser here with ?code=..."""
    try:
        return await service.handle_oauth_callback(channel_code, code, state, db)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    except ChannelAdapterError as exc:
        raise HTTPException(status_code=502, detail=str(exc))


@webhook_router.post("/webhooks/{channel_code}")
async def receive_channel_webhook(
    channel_code: str,
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    """Inbound order/product webhooks from external platforms (public).

    IMPORTANT - production hardening:
    - Verify the provider signature (e.g. Meta `X-Hub-Signature-256`, HMAC of
      the raw body with your app secret) before trusting the payload.
    - Return 200 fast; heavy processing should go into a background queue.
    """
    try:
        raw = await request.json()
    except Exception:  # noqa: BLE001 - non-JSON webhooks
        raw = {"raw": (await request.body()).decode("utf-8", errors="replace")}

    try:
        event = await service.receive_webhook(channel_code, raw, db)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc))

    return {"received": True, "event_id": event.id, "status": event.status}
