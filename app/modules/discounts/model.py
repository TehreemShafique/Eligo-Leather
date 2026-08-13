import enum
from datetime import datetime
from decimal import Decimal

from sqlalchemy import (
    String, Integer, Numeric, Boolean, DateTime, Text, Index, ForeignKey,
    Enum as SAEnum, func,
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
    """Tracks which email/IP combinations already claimed the offer. A user
    is ineligible if either their email OR their IP appears here."""

    __tablename__ = "welcome_discount_logs"
    __table_args__ = (
        Index("ix_welcome_discount_logs_user_email", "user_email"),
        Index("ix_welcome_discount_logs_ip_address", "ip_address"),
    )

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    user_email: Mapped[str] = mapped_column(String, nullable=False)
    ip_address: Mapped[str] = mapped_column(String, nullable=False)
    claimed_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(),
    )
