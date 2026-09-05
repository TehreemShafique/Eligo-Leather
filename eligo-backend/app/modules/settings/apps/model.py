import enum
from datetime import datetime

from sqlalchemy import JSON, DateTime, Integer, String, Text, func
from sqlalchemy import Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class AppCategory(str, enum.Enum):
    shipping = "shipping"
    tracking = "tracking"
    analytics = "analytics"
    marketing = "marketing"
    reviews = "reviews"
    email = "email"
    sms = "sms"
    payments = "payments"
    other = "other"


class AppStatus(str, enum.Enum):
    installed = "installed"
    active = "active"
    inactive = "inactive"


class StoreIntegration(Base):
    __tablename__ = "store_integrations"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    app_code: Mapped[str] = mapped_column(String, unique=True, index=True, nullable=False)
    app_name: Mapped[str] = mapped_column(String, nullable=False)
    category: Mapped[AppCategory] = mapped_column(
        SAEnum(AppCategory, name="app_category"), nullable=False
    )
    status: Mapped[AppStatus] = mapped_column(
        SAEnum(AppStatus, name="app_status"), default=AppStatus.installed, nullable=False
    )
    # Encrypted JSON blob (Fernet) holding the provider's API keys / tokens.
    # NEVER read this directly outside app.modules.settings.apps.crypto.
    api_credentials: Mapped[str | None] = mapped_column(Text, nullable=True)
    # Plugin-specific configuration (e.g. default pickup city, service type).
    settings: Mapped[dict | None] = mapped_column(JSON, nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    @property
    def has_credentials(self) -> bool:
        return bool(self.api_credentials)


class ReviewStatus(str, enum.Enum):
    pending = "pending"
    approved = "approved"
    rejected = "rejected"


class Review(Base):
    """Customer product review stored directly in the eligo-backend database.

    Customers submit reviews with an optional set of photo URLs (stored on
    disk under /static/uploads). New reviews land as 'pending' until an admin
    approves them via the Settings -> Apps -> Supabase Reviews moderation UI.
    Only 'approved' reviews are returned to the storefront.
    """

    __tablename__ = "reviews"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    product_id: Mapped[str | None] = mapped_column(String, index=True, nullable=True)
    reviewer_name: Mapped[str] = mapped_column(String(120), nullable=False)
    reviewer_email: Mapped[str | None] = mapped_column(String(200), nullable=True)
    rating: Mapped[int] = mapped_column(Integer, nullable=False)
    title: Mapped[str | None] = mapped_column(String(200), nullable=True)
    body: Mapped[str] = mapped_column(Text, nullable=False)
    images: Mapped[list] = mapped_column(
        JSON, default=list, nullable=False
    )
    status: Mapped[ReviewStatus] = mapped_column(
        SAEnum(ReviewStatus, name="review_status"),
        default=ReviewStatus.pending,
        nullable=False,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )
