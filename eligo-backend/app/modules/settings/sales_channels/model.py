import enum
from datetime import datetime

from sqlalchemy import JSON, DateTime, Integer, String, Text, func
from sqlalchemy import Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class ChannelStatus(str, enum.Enum):
    active = "active"
    inactive = "inactive"
    not_connected = "not_connected"


class WebhookStatus(str, enum.Enum):
    received = "received"
    processed = "processed"
    failed = "failed"


class SalesChannel(Base):
    """A connected external storefront (Online Store, FB/IG, TikTok, Google)."""

    __tablename__ = "sales_channels"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    channel_code: Mapped[str] = mapped_column(String, unique=True, index=True, nullable=False)
    channel_name: Mapped[str] = mapped_column(String, nullable=False)
    status: Mapped[ChannelStatus] = mapped_column(
        SAEnum(ChannelStatus, name="channel_status"),
        default=ChannelStatus.not_connected,
        nullable=False,
    )
    # Encrypted JSON blob (Fernet) holding OAuth access tokens (e.g. Meta Graph API token).
    # NEVER read this directly outside app.modules.settings.apps.crypto.
    auth_tokens: Mapped[str | None] = mapped_column(Text, nullable=True)
    # Channel-specific configuration (e.g. default product collection mapping, currency, tax).
    settings: Mapped[dict | None] = mapped_column(JSON, nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    @property
    def has_auth_tokens(self) -> bool:
        return bool(self.auth_tokens)


class ChannelWebhookEvent(Base):
    """Audit log of every inbound webhook received from a sales channel.

    Lets admins debug order ingestion (failed webhooks, payloads, mapped orders).
    """

    __tablename__ = "channel_webhook_events"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    channel_code: Mapped[str] = mapped_column(String, index=True, nullable=False)
    event_type: Mapped[str] = mapped_column(String, nullable=False)
    payload: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    status: Mapped[WebhookStatus] = mapped_column(
        SAEnum(WebhookStatus, name="webhook_status"),
        default=WebhookStatus.received,
        nullable=False,
    )
    error: Mapped[str | None] = mapped_column(Text, nullable=True)
    # Order created from this webhook, if the ingestion succeeded.
    processed_order_id: Mapped[int | None] = mapped_column(Integer, nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    processed_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
