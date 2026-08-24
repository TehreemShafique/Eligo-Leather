from decimal import Decimal

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.modules.catalog.model import Location
from app.modules.settings.shipping_and_delivery.model import (
    Carrier,
    ShippingProfile,
    ShippingZone,
    ShippingRate,
    Package,
    ShippingSettings,
    RateType,
    RoutingStrategy,
)
from app.modules.settings.shipping_and_delivery.schema import (
    CarrierCreate,
    CarrierUpdate,
    ShippingProfileCreate,
    ShippingProfileUpdate,
    ShippingZoneCreate,
    ShippingZoneUpdate,
    ShippingRateCreate,
    ShippingRateUpdate,
    FulfillmentLocationCreate,
    FulfillmentLocationUpdate,
    PackageCreate,
    PackageUpdate,
    ShippingSettingsUpdate,
)

DEFAULT_CARRIERS = [
    {"name": "Leopards Courier", "code": "leopards"},
    {"name": "Sonic-Trax", "code": "sonic_trax"},
]

DEFAULT_PACKAGE = {
    "name": "Store default",
    "length_cm": 22.0,
    "width_cm": 13.7,
    "height_cm": 4.2,
    "weight_kg": 0.0,
}

#  change according to sir danish req

# ============================== Settings ==============================


async def get_settings(db: AsyncSession) -> ShippingSettings:
    result = await db.execute(select(ShippingSettings).where(ShippingSettings.id == 1))
    settings = result.scalar_one_or_none()
    if settings is None:
        settings = ShippingSettings(id=1)
        db.add(settings)
        await db.commit()
        await db.refresh(settings)
    return settings


async def update_settings(data: ShippingSettingsUpdate, db: AsyncSession) -> ShippingSettings:
    settings = await get_settings(db)
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(settings, field, value)
    await db.commit()
    await db.refresh(settings)
    return settings


def calculate_shipping(subtotal, settings: ShippingSettings) -> Decimal:
    """Single source of truth for the storewide shipping charge (PKR).

    Returns ``shipping_charge`` when ``subtotal`` is below
    ``free_shipping_threshold`` and ``Decimal("0")`` otherwise. Used by the
    public checkout calculation endpoint AND re-applied authoritatively when
    an order is created so browser-supplied shipping amounts are never
    trusted. Historical orders keep the amount snapshotted at creation.
    """
    subtotal_amount = Decimal(str(subtotal or 0))
    threshold = Decimal(str(settings.free_shipping_threshold or 0))
    charge = Decimal(str(settings.shipping_charge or 0))
    return Decimal("0") if subtotal_amount >= threshold else charge


async def calculate_public_shipping(subtotal, db: AsyncSession) -> dict:
    """Load settings and build the public checkout calculation payload."""
    settings = await get_settings(db)
    subtotal_amount = Decimal(str(subtotal or 0))
    cost = calculate_shipping(subtotal_amount, settings)
    threshold = Decimal(str(settings.free_shipping_threshold or 0))
    is_free = subtotal_amount >= threshold
    return {
        "currency": "PKR",
        "subtotal": float(subtotal_amount),
        "shipping_charge": float(Decimal(str(settings.shipping_charge or 0))),
        "free_shipping_threshold": float(threshold),
        "shipping_cost": float(cost),
        "is_free_shipping": is_free,
        # How much more the customer needs to spend to unlock free shipping.
        "amount_to_free_shipping": None if is_free else float(max(threshold - subtotal_amount, Decimal(0))),
    }


async def seed_defaults(db: AsyncSession) -> None:
    await get_settings(db)

    result = await db.execute(select(Carrier.code))
    existing_codes = {row[0] for row in result.all()}
    for carrier in DEFAULT_CARRIERS:
        if carrier["code"] not in existing_codes:
            db.add(Carrier(**carrier, is_active=True))
    await db.commit()

    result = await db.execute(select(Package.id).limit(1))
    if result.scalar_one_or_none() is None:
        db.add(Package(**DEFAULT_PACKAGE, is_default=True))
        await db.commit()

    result = await db.execute(select(ShippingProfile.id).limit(1))
    if result.scalar_one_or_none() is None:
        await _seed_default_profiles(db)

    result = await db.execute(select(Location.id).limit(1))
    if result.scalar_one_or_none() is None:
        db.add(
            Location(
                name="Gulberg Empire",
                is_primary=True,
                address="Main Boulevard, Gulberg",
                city="Islamabad",
                country="Pakistan",
            )
        )
        await db.commit()


async def _seed_default_profiles(db: AsyncSession) -> None:
    domestic = ShippingProfile(name="Domestic", description="Shipping within Pakistan")
    db.add(domestic)
    await db.flush()

    pk_zone = ShippingZone(name="Pakistan Domestic", profile_id=domestic.id, countries=["PK"])
    db.add(pk_zone)
    await db.flush()

    db.add_all(
        [
            ShippingRate(
                zone_id=pk_zone.id,
                title="Standard Delivery",
                rate_type=RateType.flat,
                amount=250,
            ),
            ShippingRate(
                zone_id=pk_zone.id,
                title="Free Shipping",
                rate_type=RateType.price_based,
                amount=0,
                conditions={"min_price": 2000},
            ),
        ]
    )

    international = ShippingProfile(name="International", description="Shipping worldwide")
    db.add(international)
    await db.flush()

    world_zone = ShippingZone(name="Worldwide", profile_id=international.id, countries=None)
    db.add(world_zone)
    await db.flush()

    db.add(
        ShippingRate(
            zone_id=world_zone.id,
            title="Standard International",
            rate_type=RateType.flat,
            amount=1500,
        )
    )

    await db.commit()


# ============================== Carriers ==============================


async def list_carriers(db: AsyncSession, include_inactive: bool = False) -> list[Carrier]:
    query = select(Carrier).order_by(Carrier.created_at.desc())
    if not include_inactive:
        query = query.where(Carrier.is_active == True)  # noqa: E712
    result = await db.execute(query)
    return list(result.scalars().all())


async def get_carrier(carrier_id: int, db: AsyncSession) -> Carrier | None:
    return await db.get(Carrier, carrier_id)


async def create_carrier(data: CarrierCreate, db: AsyncSession) -> Carrier:
    carrier = Carrier(**data.model_dump(), is_active=True)
    db.add(carrier)
    await db.commit()
    await db.refresh(carrier)
    return carrier


async def update_carrier(carrier_id: int, data: CarrierUpdate, db: AsyncSession) -> Carrier | None:
    carrier = await get_carrier(carrier_id, db)
    if not carrier:
        return None
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(carrier, field, value)
    await db.commit()
    await db.refresh(carrier)
    return carrier


async def delete_carrier(carrier_id: int, db: AsyncSession) -> bool:
    carrier = await get_carrier(carrier_id, db)
    if not carrier:
        return False
    await db.delete(carrier)
    await db.commit()
    return True


# ============================== Profiles ==============================

async def list_profiles(db: AsyncSession, include_inactive: bool = False) -> list[ShippingProfile]:
    query = select(ShippingProfile).order_by(ShippingProfile.created_at.desc())
    if not include_inactive:
        query = query.where(ShippingProfile.is_active == True)  # noqa: E712
    result = await db.execute(query)
    return list(result.scalars().all())


async def get_profile(profile_id: int, db: AsyncSession) -> ShippingProfile | None:
    result = await db.execute(
        select(ShippingProfile)
        .where(ShippingProfile.id == profile_id)
        .options(selectinload(ShippingProfile.zones).selectinload(ShippingZone.rates))
    )
    return result.scalar_one_or_none()


async def create_profile(data: ShippingProfileCreate, db: AsyncSession) -> ShippingProfile:
    profile = ShippingProfile(**data.model_dump(), is_active=True)
    db.add(profile)
    await db.commit()
    await db.refresh(profile)
    return profile


async def update_profile(profile_id: int, data: ShippingProfileUpdate, db: AsyncSession) -> ShippingProfile | None:
    profile = await db.get(ShippingProfile, profile_id)
    if not profile:
        return None
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(profile, field, value)
    await db.commit()
    await db.refresh(profile)
    return profile


async def delete_profile(profile_id: int, db: AsyncSession) -> bool:
    profile = await db.get(ShippingProfile, profile_id)
    if not profile:
        return False
    await db.delete(profile)
    await db.commit()
    return True


# ============================== Zones ==============================


async def get_zone(zone_id: int, db: AsyncSession) -> ShippingZone | None:
    result = await db.execute(
        select(ShippingZone)
        .where(ShippingZone.id == zone_id)
        .options(selectinload(ShippingZone.rates))
    )
    return result.scalar_one_or_none()


async def create_zone(profile_id: int, data: ShippingZoneCreate, db: AsyncSession) -> ShippingZone | None:
    profile = await db.get(ShippingProfile, profile_id)
    if not profile:
        return None
    zone = ShippingZone(profile_id=profile_id, **data.model_dump(), is_active=True)
    db.add(zone)
    await db.commit()
    return await get_zone(zone.id, db)


async def update_zone(zone_id: int, data: ShippingZoneUpdate, db: AsyncSession) -> ShippingZone | None:
    zone = await get_zone(zone_id, db)
    if not zone:
        return None
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(zone, field, value)
    await db.commit()
    await db.refresh(zone)
    return zone


async def delete_zone(zone_id: int, db: AsyncSession) -> bool:
    zone = await get_zone(zone_id, db)
    if not zone:
        return False
    await db.delete(zone)
    await db.commit()
    return True


# ============================== Rates ==============================


async def get_rate(rate_id: int, db: AsyncSession) -> ShippingRate | None:
    return await db.get(ShippingRate, rate_id)


async def create_rate(zone_id: int, data: ShippingRateCreate, db: AsyncSession) -> ShippingRate | None:
    zone = await db.get(ShippingZone, zone_id)
    if not zone:
        return None
    rate = ShippingRate(zone_id=zone_id, **data.model_dump(), is_active=True)
    db.add(rate)
    await db.commit()
    await db.refresh(rate)
    return rate


async def update_rate(rate_id: int, data: ShippingRateUpdate, db: AsyncSession) -> ShippingRate | None:
    rate = await get_rate(rate_id, db)
    if not rate:
        return None
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(rate, field, value)
    await db.commit()
    await db.refresh(rate)
    return rate


async def delete_rate(rate_id: int, db: AsyncSession) -> bool:
    rate = await get_rate(rate_id, db)
    if not rate:
        return False
    await db.delete(rate)
    await db.commit()
    return True


# ============================== Locations ==============================


async def list_locations(db: AsyncSession, include_inactive: bool = False) -> list[Location]:
    query = select(Location).order_by(Location.is_primary.desc(), Location.created_at.desc())
    if not include_inactive:
        query = query.where(Location.is_active == True)  # noqa: E712
    result = await db.execute(query)
    return list(result.scalars().all())


async def get_location(location_id: int, db: AsyncSession) -> Location | None:
    return await db.get(Location, location_id)


async def create_location(data: FulfillmentLocationCreate, db: AsyncSession) -> Location:
    location = Location(**data.model_dump(), is_active=True)
    if location.is_primary:
        await db.execute(
            update(Location).where(Location.is_primary == True).values(is_primary=False)  # noqa: E712
        )
    db.add(location)
    await db.commit()
    await db.refresh(location)
    return location


async def update_location(location_id: int, data: FulfillmentLocationUpdate, db: AsyncSession) -> Location | None:
    location = await get_location(location_id, db)
    if not location:
        return None
    if data.is_primary is True:
        await db.execute(
            update(Location).where(Location.is_primary == True).values(is_primary=False)  # noqa: E712
        )
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(location, field, value)
    await db.commit()
    await db.refresh(location)
    return location


async def delete_location(location_id: int, db: AsyncSession) -> bool:
    location = await get_location(location_id, db)
    if not location:
        return False
    await db.delete(location)
    await db.commit()
    return True


# ============================== Packages ==============================


async def list_packages(db: AsyncSession) -> list[Package]:
    result = await db.execute(
        select(Package).order_by(Package.is_default.desc(), Package.created_at.desc())
    )
    return list(result.scalars().all())


async def get_package(package_id: int, db: AsyncSession) -> Package | None:
    return await db.get(Package, package_id)


async def create_package(data: PackageCreate, db: AsyncSession) -> Package:
    payload = data.model_dump()
    if payload.get("is_default"):
        await db.execute(update(Package).where(Package.is_default == True).values(is_default=False))  # noqa: E712
    package = Package(**payload)
    db.add(package)
    await db.commit()
    await db.refresh(package)
    return package


async def update_package(package_id: int, data: PackageUpdate, db: AsyncSession) -> Package | None:
    package = await get_package(package_id, db)
    if not package:
        return None
    if data.is_default is True:
        await db.execute(update(Package).where(Package.is_default == True).values(is_default=False))  # noqa: E712
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(package, field, value)
    await db.commit()
    await db.refresh(package)
    return package


async def delete_package(package_id: int, db: AsyncSession) -> bool:
    package = await get_package(package_id, db)
    if not package:
        return False
    await db.delete(package)
    await db.commit()
    return True
