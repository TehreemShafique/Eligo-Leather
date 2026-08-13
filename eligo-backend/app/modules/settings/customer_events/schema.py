from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.modules.settings.customer_events.model import (
    PixelDataHealth,
    PixelKind,
    PixelPlacement,
    PixelProvider,
)


class PixelDefinition(BaseModel):
    """A provider in the 'Explore pixel integrations' catalog."""

    provider: PixelProvider
    name: str
    description: str
    kind: PixelKind
    placement: PixelPlacement
    supports_server: bool = False
    supports_custom_events: bool = False


class PixelCreate(BaseModel):
    name: str
    provider: PixelProvider = PixelProvider.custom
    kind: PixelKind = PixelKind.web
    pixel_id: str | None = None
    script_content: str | None = None
    placement: PixelPlacement = PixelPlacement.head
    data_health: PixelDataHealth = PixelDataHealth.always_on
    event_types: list[str] = Field(
        default_factory=lambda: ["PageView", "ViewContent", "AddToCart", "InitiateCheckout", "Purchase"]
    )
    is_active: bool = True
    app_code: str | None = None


class PixelUpdate(BaseModel):
    name: str | None = None
    provider: PixelProvider | None = None
    kind: PixelKind | None = None
    pixel_id: str | None = None
    script_content: str | None = None
    placement: PixelPlacement | None = None
    data_health: PixelDataHealth | None = None
    event_types: list[str] | None = None
    is_active: bool | None = None
    app_code: str | None = None


class PixelOut(BaseModel):
    id: int
    name: str
    provider: PixelProvider
    kind: PixelKind
    pixel_id: str | None
    script_content: str | None
    placement: PixelPlacement
    data_health: PixelDataHealth
    event_types: list | None
    is_active: bool
    app_code: str | None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class PixelScriptOut(BaseModel):
    """A ready-to-inject script for the storefront template engine."""

    id: int
    name: str
    provider: PixelProvider
    kind: PixelKind
    placement: PixelPlacement
    pixel_id: str | None
    script: str


class PixelEventIn(BaseModel):
    """Server-side event payload to dispatch to a provider event API."""

    provider: PixelProvider
    event_type: str
    payload: dict = Field(default_factory=dict)
    pixel_id: str | None = None


class PixelEventOut(BaseModel):
    success: bool
    provider: PixelProvider
    event_type: str
    response: dict


class PixelEventLogOut(BaseModel):
    id: int
    pixel_id: int | None
    provider: str
    event_type: str
    payload: dict | None
    success: bool
    response: str | None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
