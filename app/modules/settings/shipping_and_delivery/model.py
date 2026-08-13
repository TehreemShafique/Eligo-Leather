import enum
from datetime import datetime
from decimal import Decimal

from sqlalchemy import (
    String,
    Boolean,
    Integer,
    DateTime,
    JSON,
    Numeric,
    Text,
    Float,
    ForeignKey,
    func,
)
from sqlalchemy import Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class RateType(str, enum.Enum):
    flat = "flat"
    price_based = "price_based"
    weight_based = "weight_based"
    carrier = "carrier"


class RoutingStrategy(str, enum.Enum):
    closest_to_customer = "closest_to_customer"
    primary_stock_first = "primary_stock_first"


class Carrier(Base):
    __tablename__ = "shipping_carriers"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String, nullable=False)
    code: Mapped[str] = mapped_column(String, nullable=False, unique=True)
    api_key: Mapped[str | None] = mapped_column(String, nullable=True)
    api_base_url: Mapped[str | None] = mapped_column(String, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


class ShippingProfile(Base):
    __tablename__ = "shipping_profiles"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String, nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

    zones = relationship(
        "ShippingZone",
        back_populates="profile",
        cascade="all, delete-orphan",
    )

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


class ShippingZone(Base):
    __tablename__ = "shipping_zones"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    profile_id: Mapped[int] = mapped_column(
        ForeignKey("shipping_profiles.id", ondelete="CASCADE"),
        index=True,
    )
    name: Mapped[str] = mapped_column(String, nullable=False)
    countries: Mapped[list | None] = mapped_column(JSON, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

    profile = relationship("ShippingProfile", back_populates="zones")
    rates = relationship(
        "ShippingRate",
        back_populates="zone",
        cascade="all, delete-orphan",
    )

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


class ShippingRate(Base):
    __tablename__ = "shipping_rates"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    zone_id: Mapped[int] = mapped_column(
        ForeignKey("shipping_zones.id", ondelete="CASCADE"),
        index=True,
    )
    carrier_id: Mapped[int | None] = mapped_column(
        ForeignKey("shipping_carriers.id", ondelete="SET NULL"),
        nullable=True,
    )
    title: Mapped[str] = mapped_column(String, nullable=False)
    rate_type: Mapped[RateType] = mapped_column(
        SAEnum(RateType, name="shipping_rate_type"),
        default=RateType.flat,
    )
    amount: Mapped[Decimal | None] = mapped_column(Numeric(12, 2), nullable=True)
    conditions: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

    zone = relationship("ShippingZone", back_populates="rates")
    carrier = relationship("Carrier")

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


class Package(Base):
    __tablename__ = "shipping_packages"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String, nullable=False)
    length_cm: Mapped[float] = mapped_column(Float, nullable=False)
    width_cm: Mapped[float] = mapped_column(Float, nullable=False)
    height_cm: Mapped[float] = mapped_column(Float, nullable=False)
    weight_kg: Mapped[float] = mapped_column(Float, nullable=False)
    is_default: Mapped[bool] = mapped_column(Boolean, default=False)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


class ShippingSettings(Base):
    __tablename__ = "shipping_settings"

    id: Mapped[int] = mapped_column(primary_key=True)

    routing_strategy: Mapped[RoutingStrategy] = mapped_column(
        SAEnum(RoutingStrategy, name="routing_strategy"),
        default=RoutingStrategy.primary_stock_first,
    )
    allow_split_shipments: Mapped[bool] = mapped_column(Boolean, default=True)

    sender_name: Mapped[str | None] = mapped_column(String, nullable=True)
    sender_address: Mapped[str | None] = mapped_column(String, nullable=True)
    sender_city: Mapped[str | None] = mapped_column(String, nullable=True)
    sender_province: Mapped[str | None] = mapped_column(String, nullable=True)
    sender_country: Mapped[str | None] = mapped_column(String, nullable=True)
    sender_postal_code: Mapped[str | None] = mapped_column(String, nullable=True)
    sender_phone: Mapped[str | None] = mapped_column(String, nullable=True)

    packing_slip_show_sku: Mapped[bool] = mapped_column(Boolean, default=True)
    packing_slip_show_variants: Mapped[bool] = mapped_column(Boolean, default=True)
    packing_slip_show_quantity: Mapped[bool] = mapped_column(Boolean, default=True)
    packing_slip_template: Mapped[str | None] = mapped_column(Text, nullable=True)

    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
