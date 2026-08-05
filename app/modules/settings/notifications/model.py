import enum
from datetime import datetime

from sqlalchemy import JSON, Boolean, DateTime, Integer, String, Text, func
from sqlalchemy import Enum as SAEnum
from sqlalchemy import ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class NotificationEventType(str, enum.Enum):
    order_confirmation = "order_confirmation"
    order_shipped = "order_shipped"
    order_delivered = "order_delivered"
    order_cancelled = "order_cancelled"
    return_requested = "return_requested"
    abandoned_checkout = "abandoned_checkout"
    password_reset = "password_reset"
    low_stock = "low_stock"
    admin_notification = "admin_notification"


class NotificationChannel(str, enum.Enum):
    email = "email"
    webhook = "webhook"


class DispatchStatus(str, enum.Enum):
    success = "success"
    failed = "failed"


class SenderConfig(Base):
    """SMTP sender configuration (singleton - single row, id == 1).

    This is the store-wide outbound mail server used for customer and
    admin alerts. The password is stored Fernet-encrypted using the same
    crypto module as Settings -> Apps / Sales Channels.
    """

    __tablename__ = "notification_sender_config"

    id: Mapped[int] = mapped_column(primary_key=True)
    smtp_host: Mapped[str] = mapped_column(String, default="smtp.gmail.com")
    smtp_port: Mapped[int] = mapped_column(Integer, default=587)
    smtp_username: Mapped[str] = mapped_column(String, default="eligoleather9@gmail.com")
    # Fernet-encrypted SMTP password (app password for Gmail). Read/write
    # only through app.modules.settings.apps.crypto.
    smtp_password: Mapped[str | None] = mapped_column(Text, nullable=True)
    use_tls: Mapped[bool] = mapped_column(Boolean, default=True)
    use_ssl: Mapped[bool] = mapped_column(Boolean, default=False)

    from_email: Mapped[str] = mapped_column(String, default="eligoleather9@gmail.com")
    from_name: Mapped[str] = mapped_column(String, default="Eligo Leather")
    # Where staff/admin alerts are sent by default.
    admin_email: Mapped[str] = mapped_column(String, default="eligoleather9@gmail.com")

    is_enabled: Mapped[bool] = mapped_column(Boolean, default=True)

    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    @property
    def has_password(self) -> bool:
        return bool(self.smtp_password)


class EmailTemplate(Base):
    """Customizable HTML email template rendered with Jinja2.

    `html_body` may contain Jinja2 variables such as {{ order_number }},
    {{ customer_name }}, {{ total_price }}, etc. `code` is the stable key
    the dispatch engine looks up (order_confirmation, order_shipped, ...).
    """

    __tablename__ = "email_templates"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    code: Mapped[str] = mapped_column(String, unique=True, index=True, nullable=False)
    name: Mapped[str] = mapped_column(String, nullable=False)
    subject: Mapped[str] = mapped_column(String, nullable=False)
    html_body: Mapped[str] = mapped_column(Text, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    is_built_in: Mapped[bool] = mapped_column(Boolean, default=False)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )


class WebhookEndpoint(Base):
    """Outbound webhook destination for real-time event triggers.

    When an event fires, the notification engine POSTs the payload to
    `url` with an HMAC-SHA256 signature header built from `secret`.
    """

    __tablename__ = "notification_webhooks"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String, nullable=False)
    url: Mapped[str] = mapped_column(String, nullable=False)
    # Fernet-encrypted webhook signing secret.
    secret: Mapped[str | None] = mapped_column(Text, nullable=True)
    # Event codes this endpoint subscribes to ("" or null = all events).
    events: Mapped[list | None] = mapped_column(JSON, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    @property
    def has_secret(self) -> bool:
        return bool(self.secret)


class DispatchRule(Base):
    """Automated dispatch rule: which event goes to whom via which channel.

    Recipient can be "customer" (order's customer email), "admin" (the
    configured admin_email), or a literal email address.
    """

    __tablename__ = "notification_dispatch_rules"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    event_type: Mapped[NotificationEventType] = mapped_column(
        SAEnum(NotificationEventType, name="notification_event_type"),
        nullable=False,
        index=True,
    )
    channel: Mapped[NotificationChannel] = mapped_column(
        SAEnum(NotificationChannel, name="notification_channel"),
        nullable=False,
    )
    recipient: Mapped[str] = mapped_column(String, default="customer")
    template_id: Mapped[int | None] = mapped_column(
        ForeignKey("email_templates.id", ondelete="SET NULL"), nullable=True
    )
    webhook_id: Mapped[int | None] = mapped_column(
        ForeignKey("notification_webhooks.id", ondelete="SET NULL"), nullable=True
    )
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

    template = relationship("EmailTemplate")
    webhook = relationship("WebhookEndpoint")

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )


class NotificationLog(Base):
    """Audit trail of every email / webhook dispatch attempt."""

    __tablename__ = "notification_logs"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    event_type: Mapped[str] = mapped_column(String, nullable=False)
    channel: Mapped[NotificationChannel] = mapped_column(
        SAEnum(NotificationChannel, name="notification_channel"),
        nullable=False,
    )
    recipient: Mapped[str | None] = mapped_column(String, nullable=True)
    subject: Mapped[str | None] = mapped_column(String, nullable=True)
    status: Mapped[DispatchStatus] = mapped_column(
        SAEnum(DispatchStatus, name="dispatch_status"), default=DispatchStatus.success
    )
    error: Mapped[str | None] = mapped_column(Text, nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
