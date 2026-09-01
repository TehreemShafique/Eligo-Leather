import enum
from datetime import datetime
from decimal import Decimal

from sqlalchemy import (
    String, Integer, Numeric, Boolean, DateTime, Text, Index, ForeignKey,
    JSON, Enum as SAEnum, func,
)
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class DiscountStatus(str, enum.Enum):
    active = "Active"
    expired = "Expired"
    scheduled = "Scheduled"
    disabled = "Disabled"


class DiscountMethod(str, enum.Enum):
    code = "Code"
    automatic = "Automatic"


class DiscountEligibility(str, enum.Enum):
    all_customers = "All customers"
    specific_customers = "Specific customers"
    specific_segments = "Specific segments"


class DiscountType(str, enum.Enum):
    percentage = "Percentage"
    fixed_amount = "Fixed amount"
    free_shipping = "Free shipping"
    buy_x_get_y = "Buy X get Y"


class Discount(Base):
    __tablename__ = "discounts"
    __table_args__ = (
        Index("ix_discounts_status", "status"),
        Index("ix_discounts_type", "type"),
        Index("ix_discounts_code", "code"),
        Index("ix_discounts_created_at", "created_at"),
    )

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    title: Mapped[str] = mapped_column(String, nullable=False)
    code: Mapped[str | None] = mapped_column(String, nullable=True, unique=True)
    status: Mapped[str] = mapped_column(
        SAEnum(DiscountStatus, name="discount_status"),
        default=DiscountStatus.active,
    )
    method: Mapped[str] = mapped_column(
        SAEnum(DiscountMethod, name="discount_method"),
        default=DiscountMethod.code,
    )
    eligibility: Mapped[str] = mapped_column(
        SAEnum(DiscountEligibility, name="discount_eligibility"),
        default=DiscountEligibility.all_customers,
    )
    type: Mapped[str] = mapped_column(
        SAEnum(DiscountType, name="discount_type"),
        default=DiscountType.percentage,
    )
    combinations: Mapped[str | None] = mapped_column(Text, nullable=True)
    used_count: Mapped[int] = mapped_column(Integer, default=0)
    # Admin-created promo discounts carry their reward here so the public
    # checkout can compute the discount amount without trusting the browser.
    value: Mapped[str | None] = mapped_column(Text, nullable=True)
    percentage_value: Mapped[Decimal | None] = mapped_column(
        Numeric(5, 2), nullable=True,
    )
    value_amount: Mapped[Decimal | None] = mapped_column(
        Numeric(10, 2), nullable=True,
    )
    # Product/variant scoping: when set, the discount only applies to these
    # catalog items (IDs) instead of the whole cart. Null/empty = applies to
    # all items. Persisted as JSON arrays (Postgres) / TEXT (SQLite).
    applies_to_products: Mapped[list[int] | None] = mapped_column(JSON, nullable=True)
    applies_to_variants: Mapped[list[int] | None] = mapped_column(JSON, nullable=True)
    start_date: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True,
    )
    end_date: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(),
    )
    updated_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), onupdate=func.now(), nullable=True,
    )


# ===========================================================================
# Welcome Discount
# ===========================================================================

class WelcomeDiscountSettings(Base):
    """Global welcome-discount configuration. Single active row: the
    percentage shown to first-time users and the enable/disable flag."""

    __tablename__ = "welcome_discount_settings"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    discount_percentage: Mapped[Decimal] = mapped_column(
        Numeric(5, 2), nullable=False, default=10,
    )
    is_active: Mapped[bool] = mapped_column(Boolean, default=False)
    updated_by: Mapped[int | None] = mapped_column(
        ForeignKey("users.id"), nullable=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(),
    )
    updated_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), onupdate=func.now(), nullable=True,
    )


class WelcomeDiscountLog(Base):
    """Tracks which anonymous visitors already received the offer.

    Identity is the persistent ``eligo_visitor_id`` cookie. Email/IP are kept
    only for backward compatibility with legacy claim rows and are never the
    primary identification mechanism.

    Each visitor receives a unique, server-generated ``coupon_code`` that is
    persisted here so the same code is returned on every subsequent visit and
    can be validated at checkout.
    """

    __tablename__ = "welcome_discount_logs"
    __table_args__ = (
        Index("ix_welcome_discount_logs_user_email", "user_email"),
        Index("ix_welcome_discount_logs_ip_address", "ip_address"),
        Index("ix_welcome_discount_logs_visitor_id", "visitor_id", unique=True),
    )

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    visitor_id: Mapped[str | None] = mapped_column(String, nullable=True)
    user_email: Mapped[str | None] = mapped_column(String, nullable=True)
    ip_address: Mapped[str | None] = mapped_column(String, nullable=True)
    # Unique server-generated promo code for this visitor (e.g. "7K4P-X9M2").
    coupon_code: Mapped[str | None] = mapped_column(
        String, nullable=True, unique=True, index=True,
    )
    claimed_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(),
    )
    # Set when the visitor actually uses the welcome code at checkout. The
    # one-time rule is: a visitor may redeem the code only until it has been
    # redeemed once (``claimed_at`` alone just marks that the popup was shown).
    redeemed_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True,
    )
