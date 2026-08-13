from datetime import datetime

from pydantic import BaseModel, ConfigDict


class LocationCreate(BaseModel):
    name: str
    address: str | None = None
    suite: str | None = None
    city: str | None = None
    province: str | None = None
    country: str = "Pakistan"
    postal_code: str | None = None
    phone: str | None = None
    is_primary: bool = False
    fulfills_online_orders: bool = True
    allows_local_pickup: bool = False


class LocationUpdate(BaseModel):
    name: str | None = None
    address: str | None = None
    suite: str | None = None
    city: str | None = None
    province: str | None = None
    country: str | None = None
    postal_code: str | None = None
    phone: str | None = None
    is_active: bool | None = None
    is_primary: bool | None = None
    fulfills_online_orders: bool | None = None
    allows_local_pickup: bool | None = None


class LocationOut(BaseModel):
    id: int
    name: str
    address: str | None = None
    suite: str | None = None
    city: str | None = None
    province: str | None = None
    country: str
    postal_code: str | None = None
    phone: str | None = None
    is_active: bool
    is_primary: bool
    fulfills_online_orders: bool
    allows_local_pickup: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class LocationsSummary(BaseModel):
    total: int
    active: int
    inactive: int
    limit: int
    default_location: LocationOut | None = None
