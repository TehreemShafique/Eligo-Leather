from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field

from app.modules.settings.sales_channels.model import ChannelStatus, WebhookStatus


class OAuthField(BaseModel):
    name: str
    label: str
    type: str = Field("text", description="text | password")
    help_text: str | None = None


class ChannelDefinition(BaseModel):
    code: str
    name: str
    description: str
    requires_oauth: bool = False
    can_sync_products: bool = False
    can_ingest_orders: bool = False
    actions: list[str] = []
    oauth_fields: list[OAuthField] = []
    connected: bool = False
    status: ChannelStatus | None = None


class ChannelConnect(BaseModel):
    """Credentials / tokens supplied when connecting a channel."""

    auth_tokens: dict[str, str] | None = None
    settings: dict | None = None


class ChannelUpdate(BaseModel):
    settings: dict | None = None


class ChannelOut(BaseModel):
    id: int
    channel_code: str
    channel_name: str
    status: ChannelStatus
    has_auth_tokens: bool
    settings: dict | None = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class OAuthAuthorizeURLOut(BaseModel):
    channel_code: str
    authorize_url: str


class OAuthCallbackIn(BaseModel):
    code: str
    state: str | None = None
    error: str | None = None


# =====================================================================
# Outbound product / inventory sync
# =====================================================================

class VariantSyncItem(BaseModel):
    variant_id: int
    sku: str | None = None
    title: str
    price: Decimal
    compare_at_price: Decimal | None = None
    inventory_quantity: int
    weight: Decimal | None = None
    weight_unit: str | None = None


class ProductSyncItem(BaseModel):
    product_id: int
    title: str
    description: str | None = None
    status: str
    url_handle: str | None = None
    tags: str | None = None
    images: list[str] = []
    variants: list[VariantSyncItem] = []


class ProductSyncRequest(BaseModel):
    product_ids: list[int] | None = None
    full_sync: bool = True


class ProductSyncOut(BaseModel):
    success: bool
    channel_code: str
    pushed: int
    failed: int
    results: list[dict]


# =====================================================================
# Inbound webhook ingestion
# =====================================================================

class WebhookEventOut(BaseModel):
    id: int
    channel_code: str
    event_type: str
    status: WebhookStatus
    payload: dict | None
    error: str | None
    processed_order_id: int | None
    created_at: datetime
    processed_at: datetime | None

    model_config = ConfigDict(from_attributes=True)
