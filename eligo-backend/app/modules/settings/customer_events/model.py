import enum
from datetime import datetime

from sqlalchemy import JSON, Boolean, DateTime, Integer, String, Text, func
from sqlalchemy import Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class PixelProvider(str, enum.Enum):
    facebook = "facebook"
    instagram = "instagram"
    google_analytics = "google_analytics"
    microsoft_clarity = "microsoft_clarity"
    judge_me = "judge_me"
    tiktok = "tiktok"
    pinterest = "pinterest"
    snapchat = "snapchat"
    custom = "custom"
    other = "other"


class PixelKind(str, enum.Enum):
    web = "web"
    server = "server"


class PixelPlacement(str, enum.Enum):
    head = "head"
    body_start = "body_start"
    body_end = "body_end"
    checkout = "checkout"


class PixelDataHealth(str, enum.Enum):
    always_on = "always_on"
    optimized = "optimized"


class TrackingPixel(Base):
    """A tracking script / pixel injected into the storefront.

    `provider` identifies the analytics platform (facebook, clarity, custom...).
    `pixel_id` holds the platform tracking id (e.g. Meta Pixel ID).
    `script_content` holds raw JS for custom pixels.
    `kind` is the badge shown in the admin table: web (client-side JS) or
    server (backend event API). `data_health` is the status badge
    (always_on / optimized). `app_code` links this pixel to an app row in
    store_integrations (e.g. facebook_instagram) so both managers stay in sync.
    """

    __tablename__ = "tracking_pixels"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String, nullable=False)
    provider: Mapped[PixelProvider] = mapped_column(
        SAEnum(PixelProvider, name="pixel_provider"), nullable=False
    )
    kind: Mapped[PixelKind] = mapped_column(
        SAEnum(PixelKind, name="pixel_kind"), default=PixelKind.web, nullable=False
    )
    pixel_id: Mapped[str | None] = mapped_column(String, nullable=True)
    script_content: Mapped[str | None] = mapped_column(Text, nullable=True)
    placement: Mapped[PixelPlacement] = mapped_column(
        SAEnum(PixelPlacement, name="pixel_placement"),
        default=PixelPlacement.head,
        nullable=False,
    )
    data_health: Mapped[PixelDataHealth] = mapped_column(
        SAEnum(PixelDataHealth, name="pixel_data_health"),
        default=PixelDataHealth.always_on,
        nullable=False,
    )
    # Standard e-commerce events this pixel tracks, e.g.
    # ["PageView", "ViewContent", "AddToCart", "InitiateCheckout", "Purchase"].
    event_types: Mapped[list | None] = mapped_column(JSON, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    # Optional link to a store_integrations.app_code (e.g. "facebook_instagram").
    app_code: Mapped[str | None] = mapped_column(String, nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )


class PixelEventLog(Base):
    """Audit trail of server-side events dispatched to provider event APIs.

    Lets admins see what conversions were sent and whether the provider
    accepted them (Meta Conversions API, GA4 Measurement Protocol, ...).
    """

    __tablename__ = "pixel_event_logs"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    pixel_id: Mapped[int | None] = mapped_column(Integer, nullable=True)
    provider: Mapped[str] = mapped_column(String, nullable=False)
    event_type: Mapped[str] = mapped_column(String, nullable=False)
    payload: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    success: Mapped[bool] = mapped_column(Boolean, default=False)
    response: Mapped[str | None] = mapped_column(Text, nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
