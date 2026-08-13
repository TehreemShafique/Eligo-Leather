import enum
from datetime import datetime

from sqlalchemy import (
    String, Integer, Boolean, Float, DateTime, Text, Index, ForeignKey,
    Numeric, Enum as SAEnum, func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


# ---------------------------------------------------------------------------
# Enums
# ---------------------------------------------------------------------------

class MarketStatus(str, enum.Enum):
    active = "Active"
    draft = "Draft"


class PriceAdjustmentDirection(str, enum.Enum):
    increase = "Increase"
    decrease = "Decrease"


class RolloutStatus(str, enum.Enum):
    draft = "Draft"
    scheduled = "Scheduled"
    active = "Active"
    completed = "Completed"


class ChangeType(str, enum.Enum):
    online_store_theme = "Online store theme"
    checkout_and_accounts = "Checkout and accounts"


class ChangeStatus(str, enum.Enum):
    pending = "Pending"
    applied = "Applied"
    reverted = "Reverted"


# ---------------------------------------------------------------------------
# Market
# ---------------------------------------------------------------------------

class Market(Base):
    __tablename__ = "markets"
    __table_args__ = (
        Index("ix_markets_status", "status"),
        Index("ix_markets_country_code", "country_code"),
    )

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String, nullable=False)
    status: Mapped[str] = mapped_column(
        SAEnum(MarketStatus, name="market_status"),
        default=MarketStatus.active,
    )
    country_code: Mapped[str] = mapped_column(String(2), nullable=False)
    country_name: Mapped[str] = mapped_column(String, nullable=False)
    currency: Mapped[str] = mapped_column(String(3), nullable=False)
    includes: Mapped[str | None] = mapped_column(Text, nullable=True)
    customizations: Mapped[str | None] = mapped_column(Text, nullable=True)

    catalogs = relationship(
        "Catalog", back_populates="market",
        cascade="all, delete-orphan",
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(),
    )
    updated_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), onupdate=func.now(), nullable=True,
    )


# ---------------------------------------------------------------------------
# Catalog
# ---------------------------------------------------------------------------

class Catalog(Base):
    __tablename__ = "catalogs"
    __table_args__ = (
        Index("ix_catalogs_status", "status"),
        Index("ix_catalogs_market_id", "market_id"),
    )

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    status: Mapped[str] = mapped_column(
        SAEnum(MarketStatus, name="catalog_status"),
        default=MarketStatus.active,
    )
    market_id: Mapped[int] = mapped_column(
        ForeignKey("markets.id", ondelete="CASCADE"),
    )
    price_currency: Mapped[str] = mapped_column(String(3), default="PKR")
    price_adjustment_direction: Mapped[str] = mapped_column(
        SAEnum(PriceAdjustmentDirection, name="price_adjustment_direction"),
        default=PriceAdjustmentDirection.increase,
    )
    price_adjustment_value: Mapped[float] = mapped_column(Float, default=0.0)
    include_compare_at: Mapped[bool] = mapped_column(Boolean, default=False)
    auto_include_new_products: Mapped[bool] = mapped_column(Boolean, default=False)

    market = relationship("Market", back_populates="catalogs")
    products = relationship(
        "CatalogProduct", back_populates="catalog",
        cascade="all, delete-orphan",
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(),
    )
    updated_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), onupdate=func.now(), nullable=True,
    )


# ---------------------------------------------------------------------------
# Catalog Product (join table with price overrides)
# ---------------------------------------------------------------------------

class CatalogProduct(Base):
    __tablename__ = "catalog_products"
    __table_args__ = (
        Index("ix_catalog_products_catalog_id", "catalog_id"),
        Index("ix_catalog_products_product_id", "product_id"),
    )

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    catalog_id: Mapped[int] = mapped_column(
        ForeignKey("catalogs.id", ondelete="CASCADE"),
    )
    product_id: Mapped[int] = mapped_column(
        ForeignKey("products.id", ondelete="CASCADE"),
    )
    price_override: Mapped[float | None] = mapped_column(
        Numeric(12, 2), nullable=True,
    )
    compare_at_price: Mapped[float | None] = mapped_column(
        Numeric(12, 2), nullable=True,
    )
    included: Mapped[bool] = mapped_column(Boolean, default=True)

    catalog = relationship("Catalog", back_populates="products")

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(),
    )


# ---------------------------------------------------------------------------
# Rollout
# ---------------------------------------------------------------------------

class Rollout(Base):
    __tablename__ = "rollouts"
    __table_args__ = (
        Index("ix_rollouts_status", "status"),
    )

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    status: Mapped[str] = mapped_column(
        SAEnum(RolloutStatus, name="rollout_status"),
        default=RolloutStatus.draft,
    )
    scheduled_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True,
    )

    changes = relationship(
        "RolloutChange", back_populates="rollout",
        cascade="all, delete-orphan",
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(),
    )
    updated_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), onupdate=func.now(), nullable=True,
    )


# ---------------------------------------------------------------------------
# Rollout Change
# ---------------------------------------------------------------------------

class RolloutChange(Base):
    __tablename__ = "rollout_changes"
    __table_args__ = (
        Index("ix_rollout_changes_rollout_id", "rollout_id"),
    )

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    rollout_id: Mapped[int] = mapped_column(
        ForeignKey("rollouts.id", ondelete="CASCADE"),
    )
    change_type: Mapped[str] = mapped_column(
        SAEnum(ChangeType, name="change_type"),
    )
    title: Mapped[str] = mapped_column(String, nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    configuration: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(
        SAEnum(ChangeStatus, name="rollout_change_status"),
        default=ChangeStatus.pending,
    )

    rollout = relationship("Rollout", back_populates="changes")

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(),
    )
