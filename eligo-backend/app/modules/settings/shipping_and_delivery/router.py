from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.db.session import get_db
from app.core.dependencies import require_admin

from app.modules.settings.shipping_and_delivery import service
from app.modules.settings.shipping_and_delivery.model import (
    ShippingProfile,
    ShippingZone,
    ShippingRate,
    RateType,
)
from app.modules.settings.shipping_and_delivery.schema import (
    CarrierCreate,
    CarrierUpdate,
    CarrierOut,
    ShippingProfileCreate,
    ShippingProfileUpdate,
    ShippingProfileOut,
    ShippingProfileDetailOut,
    ShippingZoneCreate,
    ShippingZoneUpdate,
    ShippingZoneOut,
    ShippingRateCreate,
    ShippingRateUpdate,
    ShippingRateOut,
    FulfillmentLocationCreate,
    FulfillmentLocationUpdate,
    FulfillmentLocationOut,
    PackageCreate,
    PackageUpdate,
    PackageOut,
    ShippingSettingsUpdate,
    ShippingSettingsOut,
)

router = APIRouter(
    prefix="/shipping-and-delivery",
    tags=["Settings - Shipping and Delivery"],
    dependencies=[Depends(require_admin)],
)

public_shipping_router = APIRouter(prefix="/shipping", tags=["Settings - Shipping - Public"])


@router.post("/seed", status_code=status.HTTP_204_NO_CONTENT)
async def seed_shipping_defaults(db: AsyncSession = Depends(get_db)):
    return await service.seed_defaults(db)


# ============================== Settings ==============================


@router.get("/settings", response_model=ShippingSettingsOut)
async def get_shipping_settings(db: AsyncSession = Depends(get_db)):
    return await service.get_settings(db)


@router.patch("/settings", response_model=ShippingSettingsOut)
async def update_shipping_settings(data: ShippingSettingsUpdate, db: AsyncSession = Depends(get_db)):
    return await service.update_settings(data, db)


# ============================== Carriers ==============================


@router.get("/carriers", response_model=list[CarrierOut])
async def list_carriers(include_inactive: bool = False, db: AsyncSession = Depends(get_db)):
    return await service.list_carriers(db, include_inactive)


@router.post("/carriers", response_model=CarrierOut, status_code=status.HTTP_201_CREATED)
async def create_carrier(data: CarrierCreate, db: AsyncSession = Depends(get_db)):
    return await service.create_carrier(data, db)


@router.get("/carriers/{carrier_id}", response_model=CarrierOut)
async def get_carrier(carrier_id: int, db: AsyncSession = Depends(get_db)):
    carrier = await service.get_carrier(carrier_id, db)
    if not carrier:
        raise HTTPException(status_code=404, detail="Carrier not found")
    return carrier


@router.patch("/carriers/{carrier_id}", response_model=CarrierOut)
async def update_carrier(carrier_id: int, data: CarrierUpdate, db: AsyncSession = Depends(get_db)):
    carrier = await service.update_carrier(carrier_id, data, db)
    if not carrier:
        raise HTTPException(status_code=404, detail="Carrier not found")
    return carrier


@router.delete("/carriers/{carrier_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_carrier(carrier_id: int, db: AsyncSession = Depends(get_db)):
    deleted = await service.delete_carrier(carrier_id, db)
    if not deleted:
        raise HTTPException(status_code=404, detail="Carrier not found")


# ============================== Profiles ==============================


@router.get("/profiles", response_model=list[ShippingProfileOut])
async def list_profiles(include_inactive: bool = False, db: AsyncSession = Depends(get_db)):
    return await service.list_profiles(db, include_inactive)


@router.post("/profiles", response_model=ShippingProfileOut, status_code=status.HTTP_201_CREATED)
async def create_profile(data: ShippingProfileCreate, db: AsyncSession = Depends(get_db)):
    return await service.create_profile(data, db)


@router.get("/profiles/{profile_id}", response_model=ShippingProfileDetailOut)
async def get_profile(profile_id: int, db: AsyncSession = Depends(get_db)):
    profile = await service.get_profile(profile_id, db)
    if not profile:
        raise HTTPException(status_code=404, detail="Shipping profile not found")
    return profile


@router.patch("/profiles/{profile_id}", response_model=ShippingProfileOut)
async def update_profile(profile_id: int, data: ShippingProfileUpdate, db: AsyncSession = Depends(get_db)):
    profile = await service.update_profile(profile_id, data, db)
    if not profile:
        raise HTTPException(status_code=404, detail="Shipping profile not found")
    return profile


@router.delete("/profiles/{profile_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_profile(profile_id: int, db: AsyncSession = Depends(get_db)):
    deleted = await service.delete_profile(profile_id, db)
    if not deleted:
        raise HTTPException(status_code=404, detail="Shipping profile not found")


# ============================== Zones ==============================


@router.post("/profiles/{profile_id}/zones", response_model=ShippingZoneOut, status_code=status.HTTP_201_CREATED)
async def create_zone(profile_id: int, data: ShippingZoneCreate, db: AsyncSession = Depends(get_db)):
    zone = await service.create_zone(profile_id, data, db)
    if not zone:
        raise HTTPException(status_code=404, detail="Shipping profile not found")
    return zone


@router.get("/zones/{zone_id}", response_model=ShippingZoneOut)
async def get_zone(zone_id: int, db: AsyncSession = Depends(get_db)):
    zone = await service.get_zone(zone_id, db)
    if not zone:
        raise HTTPException(status_code=404, detail="Shipping zone not found")
    return zone


@router.patch("/zones/{zone_id}", response_model=ShippingZoneOut)
async def update_zone(zone_id: int, data: ShippingZoneUpdate, db: AsyncSession = Depends(get_db)):
    zone = await service.update_zone(zone_id, data, db)
    if not zone:
        raise HTTPException(status_code=404, detail="Shipping zone not found")
    return zone


@router.delete("/zones/{zone_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_zone(zone_id: int, db: AsyncSession = Depends(get_db)):
    deleted = await service.delete_zone(zone_id, db)
    if not deleted:
        raise HTTPException(status_code=404, detail="Shipping zone not found")


# ============================== Rates ==============================


@router.post("/zones/{zone_id}/rates", response_model=ShippingRateOut, status_code=status.HTTP_201_CREATED)
async def create_rate(zone_id: int, data: ShippingRateCreate, db: AsyncSession = Depends(get_db)):
    rate = await service.create_rate(zone_id, data, db)
    if not rate:
        raise HTTPException(status_code=404, detail="Shipping zone not found")
    return rate


@router.get("/rates/{rate_id}", response_model=ShippingRateOut)
async def get_rate(rate_id: int, db: AsyncSession = Depends(get_db)):
    rate = await service.get_rate(rate_id, db)
    if not rate:
        raise HTTPException(status_code=404, detail="Shipping rate not found")
    return rate


@router.patch("/rates/{rate_id}", response_model=ShippingRateOut)
async def update_rate(rate_id: int, data: ShippingRateUpdate, db: AsyncSession = Depends(get_db)):
    rate = await service.update_rate(rate_id, data, db)
    if not rate:
        raise HTTPException(status_code=404, detail="Shipping rate not found")
    return rate


@router.delete("/rates/{rate_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_rate(rate_id: int, db: AsyncSession = Depends(get_db)):
    deleted = await service.delete_rate(rate_id, db)
    if not deleted:
        raise HTTPException(status_code=404, detail="Shipping rate not found")


# ============================== Locations ==============================


@router.get("/locations", response_model=list[FulfillmentLocationOut])
async def list_locations(include_inactive: bool = False, db: AsyncSession = Depends(get_db)):
    return await service.list_locations(db, include_inactive)


@router.post("/locations", response_model=FulfillmentLocationOut, status_code=status.HTTP_201_CREATED)
async def create_location(data: FulfillmentLocationCreate, db: AsyncSession = Depends(get_db)):
    return await service.create_location(data, db)


@router.get("/locations/{location_id}", response_model=FulfillmentLocationOut)
async def get_location(location_id: int, db: AsyncSession = Depends(get_db)):
    location = await service.get_location(location_id, db)
    if not location:
        raise HTTPException(status_code=404, detail="Fulfillment location not found")
    return location


@router.patch("/locations/{location_id}", response_model=FulfillmentLocationOut)
async def update_location(location_id: int, data: FulfillmentLocationUpdate, db: AsyncSession = Depends(get_db)):
    location = await service.update_location(location_id, data, db)
    if not location:
        raise HTTPException(status_code=404, detail="Fulfillment location not found")
    return location


@router.delete("/locations/{location_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_location(location_id: int, db: AsyncSession = Depends(get_db)):
    deleted = await service.delete_location(location_id, db)
    if not deleted:
        raise HTTPException(status_code=404, detail="Fulfillment location not found")


# ============================== Packages ==============================


@router.get("/packages", response_model=list[PackageOut])
async def list_packages(db: AsyncSession = Depends(get_db)):
    return await service.list_packages(db)


@router.post("/packages", response_model=PackageOut, status_code=status.HTTP_201_CREATED)
async def create_package(data: PackageCreate, db: AsyncSession = Depends(get_db)):
    return await service.create_package(data, db)


@router.get("/packages/{package_id}", response_model=PackageOut)
async def get_package(package_id: int, db: AsyncSession = Depends(get_db)):
    package = await service.get_package(package_id, db)
    if not package:
        raise HTTPException(status_code=404, detail="Package not found")
    return package


@router.patch("/packages/{package_id}", response_model=PackageOut)
async def update_package(package_id: int, data: PackageUpdate, db: AsyncSession = Depends(get_db)):
    package = await service.update_package(package_id, data, db)
    if not package:
        raise HTTPException(status_code=404, detail="Package not found")
    return package


@router.delete("/packages/{package_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_package(package_id: int, db: AsyncSession = Depends(get_db)):
    deleted = await service.delete_package(package_id, db)
    if not deleted:
        raise HTTPException(status_code=404, detail="Package not found")


# ============================== Public (Storefront) ==============================


class ShippingRateCalculationRequest(BaseModel):
    subtotal: float
    weight_kg: float = 0.0
    country: str = "PK"


class CalculatedRate(BaseModel):
    rate_id: int
    title: str
    profile_name: str
    zone_name: str
    amount: float
    rate_type: str
    is_free: bool


@public_shipping_router.post("/calculate-rates", response_model=list[CalculatedRate])
async def calculate_shipping_rates(payload: ShippingRateCalculationRequest, db: AsyncSession = Depends(get_db)):
    """Calculate applicable shipping rates for the storefront based on cart details."""
    result = await db.execute(
        select(ShippingProfile)
        .where(ShippingProfile.is_active == True)  # noqa: E712
        .options(selectinload(ShippingProfile.zones).selectinload(ShippingZone.rates))
    )
    profiles = list(result.scalars().all())

    calculated: list[CalculatedRate] = []
    country_upper = payload.country.upper()

    for profile in profiles:
        for zone in (profile.zones or []):
            if not zone.is_active:
                continue

            zone_countries = zone.countries
            country_matches = (
                zone_countries is None
                or len(zone_countries) == 0
                or country_upper in [c.upper() for c in zone_countries]
            )
            if not country_matches:
                continue

            for rate in (zone.rates or []):
                if not rate.is_active:
                    continue

                amount = _compute_rate_amount(rate, payload.subtotal, payload.weight_kg)
                calculated.append(CalculatedRate(
                    rate_id=rate.id,
                    title=rate.title,
                    profile_name=profile.name,
                    zone_name=zone.name,
                    amount=float(amount),
                    rate_type=rate.rate_type.value if rate.rate_type else "flat",
                    is_free=amount == 0,
                ))

    calculated.sort(key=lambda r: r.amount)
    return calculated


def _compute_rate_amount(rate: ShippingRate, subtotal: float, weight_kg: float) -> float:
    amount = float(rate.amount or 0)
    conditions = rate.conditions or {}

    if rate.rate_type == RateType.flat:
        return amount

    if rate.rate_type == RateType.price_based:
        min_price = conditions.get("min_price", 0)
        if subtotal >= min_price:
            return 0.0
        return amount

    if rate.rate_type == RateType.weight_based:
        min_weight = conditions.get("min_weight_kg", 0)
        per_kg = conditions.get("per_kg", amount)
        if weight_kg <= min_weight:
            return amount
        extra_kg = weight_kg - min_weight
        return amount + (extra_kg * per_kg)

    return amount


@public_shipping_router.get("/public/zones")
async def get_public_shipping_zones(db: AsyncSession = Depends(get_db)):
    """Return active shipping zones with rates for the storefront."""
    result = await db.execute(
        select(ShippingProfile)
        .where(ShippingProfile.is_active == True)  # noqa: E712
        .options(selectinload(ShippingProfile.zones).selectinload(ShippingZone.rates))
    )
    profiles = list(result.scalars().all())

    output = []
    for profile in profiles:
        zones_data = []
        for zone in (profile.zones or []):
            if not zone.is_active:
                continue
            rates_data = [
                {
                    "id": r.id,
                    "title": r.title,
                    "rate_type": r.rate_type.value if r.rate_type else "flat",
                    "amount": float(r.amount or 0),
                    "conditions": r.conditions,
                }
                for r in (zone.rates or [])
                if r.is_active
            ]
            zones_data.append({
                "id": zone.id,
                "name": zone.name,
                "countries": zone.countries,
                "rates": rates_data,
            })
        output.append({
            "id": profile.id,
            "name": profile.name,
            "description": profile.description,
            "zones": zones_data,
        })
    return output
