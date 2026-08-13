from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, field_validator

from app.modules.settings.shipping_and_delivery.model import RateType, RoutingStrategy


# ============================== Carrier ==============================


class CarrierCreate(BaseModel):
    name: str
    code: str
    api_key: str | None = None
    api_base_url: str | None = None


class CarrierUpdate(BaseModel):
    name: str | None = None
    api_key: str | None = None
    api_base_url: str | None = None
    is_active: bool | None = None


class CarrierOut(BaseModel):
    id: int
    name: str
    code: str
    api_key: str | None = None
    api_base_url: str | None = None
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ============================== Rates ==============================


class ShippingRateCreate(BaseModel):
    title: str
    rate_type: RateType = RateType.flat
    amount: Decimal | None = None
    conditions: dict | None = None
    carrier_id: int | None = None


class ShippingRateUpdate(BaseModel):
    title: str | None = None
    rate_type: RateType | None = None
    amount: Decimal | None = None
    conditions: dict | None = None
    carrier_id: int | None = None
    is_active: bool | None = None


class ShippingRateOut(BaseModel):
    id: int
    zone_id: int
    carrier_id: int | None = None
    title: str
    rate_type: RateType
    amount: Decimal | None = None
    conditions: dict | None = None
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ============================== Zones ==============================


class ShippingZoneCreate(BaseModel):
    name: str
    countries: list[str] | None = None


class ShippingZoneUpdate(BaseModel):
    name: str | None = None
    countries: list[str] | None = None
    is_active: bool | None = None


class ShippingZoneOut(BaseModel):
    id: int
    profile_id: int
    name: str
    countries: list[str] | None = None
    is_active: bool
    rates: list[ShippingRateOut] = []
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ============================== Profiles ==============================


class ShippingProfileCreate(BaseModel):
    name: str
    description: str | None = None


class ShippingProfileUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    is_active: bool | None = None


class ShippingProfileOut(BaseModel):
    id: int
    name: str
    description: str | None = None
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ShippingProfileDetailOut(ShippingProfileOut):
    zones: list[ShippingZoneOut] = []


# ============================== Locations ==============================
# Unified Location entity lives in Settings -> Locations. Re-export the
# schemas here so the shipping module keeps a compatible public surface.

from app.modules.settings.locations.schema import (  # noqa: E402, F401
    LocationCreate as FulfillmentLocationCreate,
    LocationUpdate as FulfillmentLocationUpdate,
    LocationOut as FulfillmentLocationOut,
)


# ============================== Packages ==============================


class PackageCreate(BaseModel):
    name: str
    length_cm: float
    width_cm: float
    height_cm: float
    weight_kg: float
    is_default: bool = False

    @field_validator("length_cm", "width_cm", "height_cm", "weight_kg")
    @classmethod
    def validate_positive(cls, value):
        if value < 0:
            raise ValueError("Value must be zero or greater")
        return value


class PackageUpdate(BaseModel):
    name: str | None = None
    length_cm: float | None = None
    width_cm: float | None = None
    height_cm: float | None = None
    weight_kg: float | None = None
    is_default: bool | None = None


class PackageOut(BaseModel):
    id: int
    name: str
    length_cm: float
    width_cm: float
    height_cm: float
    weight_kg: float
    is_default: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ============================== Settings ==============================


class ShippingSettingsUpdate(BaseModel):
    routing_strategy: RoutingStrategy | None = None
    allow_split_shipments: bool | None = None
    sender_name: str | None = None
    sender_address: str | None = None
    sender_city: str | None = None
    sender_province: str | None = None
    sender_country: str | None = None
    sender_postal_code: str | None = None
    sender_phone: str | None = None
    packing_slip_show_sku: bool | None = None
    packing_slip_show_variants: bool | None = None
    packing_slip_show_quantity: bool | None = None
    packing_slip_template: str | None = None


class ShippingSettingsOut(BaseModel):
    id: int
    routing_strategy: RoutingStrategy
    allow_split_shipments: bool
    sender_name: str | None = None
    sender_address: str | None = None
    sender_city: str | None = None
    sender_province: str | None = None
    sender_country: str | None = None
    sender_postal_code: str | None = None
    sender_phone: str | None = None
    packing_slip_show_sku: bool
    packing_slip_show_variants: bool
    packing_slip_show_quantity: bool
    packing_slip_template: str | None = None
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
