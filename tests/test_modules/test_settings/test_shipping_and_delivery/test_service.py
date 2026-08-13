"""Tests for app.modules.settings.shipping_and_delivery.service"""

import pytest

from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.modules.settings.shipping_and_delivery import service
from app.modules.settings.shipping_and_delivery.model import (
    RateType,
    RoutingStrategy,
    ShippingZone,
)
from app.modules.settings.shipping_and_delivery.schema import (
    CarrierCreate,
    CarrierUpdate,
    FulfillmentLocationCreate,
    FulfillmentLocationUpdate,
    PackageCreate,
    PackageUpdate,
    ShippingProfileCreate,
    ShippingProfileUpdate,
    ShippingRateCreate,
    ShippingRateUpdate,
    ShippingSettingsUpdate,
    ShippingZoneCreate,
    ShippingZoneUpdate,
)


# ---------------------------------------------------------------------------
# Settings
# ---------------------------------------------------------------------------

async def test_get_settings_creates_defaults(db_session):
    settings = await service.get_settings(db_session)
    assert settings.id == 1
    assert settings.routing_strategy == RoutingStrategy.primary_stock_first
    assert settings.allow_split_shipments is True
    assert settings.packing_slip_show_sku is True


async def test_get_settings_is_singleton(db_session):
    first = await service.get_settings(db_session)
    second = await service.get_settings(db_session)
    assert first.id == second.id == 1


async def test_update_settings(db_session):
    settings = await service.update_settings(
        ShippingSettingsUpdate(sender_name="Eligo Leather", sender_city="Lahore", allow_split_shipments=False),
        db_session,
    )
    assert settings.sender_name == "Eligo Leather"
    assert settings.sender_city == "Lahore"
    assert settings.allow_split_shipments is False


async def test_update_settings_partial_preserves_others(db_session):
    await service.update_settings(ShippingSettingsUpdate(sender_name="Eligo"), db_session)
    settings = await service.update_settings(ShippingSettingsUpdate(sender_city="Karachi"), db_session)
    assert settings.sender_name == "Eligo"
    assert settings.sender_city == "Karachi"


# ---------------------------------------------------------------------------
# Seed
# ---------------------------------------------------------------------------

async def test_seed_defaults_creates_carriers_package_profiles_and_location(db_session):
    await service.seed_defaults(db_session)

    carriers = await service.list_carriers(db_session)
    assert {c.code for c in carriers} == {"leopards", "sonic_trax"}
    assert {c.name for c in carriers} == {"Leopards Courier", "Sonic-Trax"}

    packages = await service.list_packages(db_session)
    assert len(packages) == 1
    assert packages[0].name == service.DEFAULT_PACKAGE["name"]
    assert packages[0].is_default is True

    profiles = await service.list_profiles(db_session)
    assert {p.name for p in profiles} == {"Domestic", "International"}

    domestic = next(p for p in profiles if p.name == "Domestic")
    detail = await service.get_profile(domestic.id, db_session)
    assert len(detail.zones) == 1
    assert len(detail.zones[0].rates) == 2

    locations = await service.list_locations(db_session)
    assert len(locations) == 1
    assert locations[0].name == "Gulberg Empire"
    assert locations[0].is_primary is True


async def test_seed_defaults_is_idempotent(db_session):
    await service.seed_defaults(db_session)
    await service.seed_defaults(db_session)

    assert len(await service.list_carriers(db_session)) == 2
    assert len(await service.list_packages(db_session)) == 1
    assert len(await service.list_profiles(db_session)) == 2
    assert len(await service.list_locations(db_session)) == 1


# ---------------------------------------------------------------------------
# Carriers
# ---------------------------------------------------------------------------

async def test_create_and_get_carrier(db_session):
    carrier = await service.create_carrier(CarrierCreate(name="TCS", code="tcs"), db_session)
    assert carrier.id is not None
    assert carrier.name == "TCS"
    assert carrier.code == "tcs"
    assert carrier.is_active is True

    fetched = await service.get_carrier(carrier.id, db_session)
    assert fetched is not None
    assert fetched.name == "TCS"


async def test_get_carrier_missing_returns_none(db_session):
    assert await service.get_carrier(99999, db_session) is None


async def test_list_carriers_filters_inactive(db_session):
    active = await service.create_carrier(CarrierCreate(name="TCS", code="tcs"), db_session)
    await service.create_carrier(CarrierCreate(name="Old", code="old"), db_session)
    await service.update_carrier(active.id, CarrierUpdate(is_active=False), db_session)

    active_list = await service.list_carriers(db_session)
    assert [c.code for c in active_list] == ["old"]

    all_list = await service.list_carriers(db_session, include_inactive=True)
    assert {c.code for c in all_list} == {"old", "tcs"}


async def test_update_carrier(db_session):
    carrier = await service.create_carrier(CarrierCreate(name="TCS", code="tcs"), db_session)
    updated = await service.update_carrier(carrier.id, CarrierUpdate(name="TCS Express"), db_session)
    assert updated is not None
    assert updated.name == "TCS Express"


async def test_update_carrier_missing_returns_none(db_session):
    assert await service.update_carrier(99999, CarrierUpdate(name="x"), db_session) is None


async def test_delete_carrier(db_session):
    carrier = await service.create_carrier(CarrierCreate(name="TCS", code="tcs"), db_session)
    assert await service.delete_carrier(carrier.id, db_session) is True
    assert await service.get_carrier(carrier.id, db_session) is None
    assert await service.delete_carrier(carrier.id, db_session) is False


# ---------------------------------------------------------------------------
# Profiles
# ---------------------------------------------------------------------------

async def test_create_and_get_profile(db_session):
    profile = await service.create_profile(ShippingProfileCreate(name="Domestic", description="PK only"), db_session)
    assert profile.id is not None
    assert profile.name == "Domestic"
    assert profile.description == "PK only"
    assert profile.is_active is True

    fetched = await service.get_profile(profile.id, db_session)
    assert fetched is not None
    assert fetched.name == "Domestic"


async def test_get_profile_missing_returns_none(db_session):
    assert await service.get_profile(99999, db_session) is None


async def test_list_profiles_filters_inactive(db_session):
    profile = await service.create_profile(ShippingProfileCreate(name="Domestic"), db_session)
    await service.create_profile(ShippingProfileCreate(name="International"), db_session)
    await service.update_profile(profile.id, ShippingProfileUpdate(is_active=False), db_session)

    assert len(await service.list_profiles(db_session)) == 1
    assert len(await service.list_profiles(db_session, include_inactive=True)) == 2


async def test_get_profile_includes_zones(db_session):
    profile = await service.create_profile(ShippingProfileCreate(name="Domestic"), db_session)
    zone = await service.create_zone(profile.id, ShippingZoneCreate(name="PK", countries=["PK"]), db_session)
    assert zone is not None

    fetched = await service.get_profile(profile.id, db_session)
    assert fetched is not None
    assert [z.id for z in fetched.zones] == [zone.id]


async def test_update_profile(db_session):
    profile = await service.create_profile(ShippingProfileCreate(name="Domestic"), db_session)
    updated = await service.update_profile(
        profile.id, ShippingProfileUpdate(name="Local", is_active=False), db_session,
    )
    assert updated is not None
    assert updated.name == "Local"
    assert updated.is_active is False


async def test_update_profile_missing_returns_none(db_session):
    assert await service.update_profile(99999, ShippingProfileUpdate(name="x"), db_session) is None


async def test_delete_profile(db_session):
    profile = await service.create_profile(ShippingProfileCreate(name="Domestic"), db_session)
    assert await service.delete_profile(profile.id, db_session) is True
    assert await service.get_profile(profile.id, db_session) is None
    assert await service.delete_profile(profile.id, db_session) is False


# ---------------------------------------------------------------------------
# Zones
# ---------------------------------------------------------------------------

async def test_create_and_get_zone(db_session):
    profile = await service.create_profile(ShippingProfileCreate(name="Domestic"), db_session)
    zone = await service.create_zone(profile.id, ShippingZoneCreate(name="PK", countries=["PK"]), db_session)
    assert zone is not None
    assert zone.profile_id == profile.id
    assert zone.name == "PK"
    assert zone.countries == ["PK"]
    assert zone.is_active is True

    fetched = await service.get_zone(zone.id, db_session)
    assert fetched is not None
    assert fetched.name == "PK"


async def test_create_zone_missing_profile_returns_none(db_session):
    assert await service.create_zone(99999, ShippingZoneCreate(name="PK"), db_session) is None


async def test_get_zone_missing_returns_none(db_session):
    assert await service.get_zone(99999, db_session) is None


async def test_get_zone_includes_rates(db_session):
    profile = await service.create_profile(ShippingProfileCreate(name="Domestic"), db_session)
    zone = await service.create_zone(profile.id, ShippingZoneCreate(name="PK"), db_session)
    await service.create_rate(zone.id, ShippingRateCreate(title="Standard", amount=250), db_session)

    result = await db_session.execute(
        select(ShippingZone)
        .where(ShippingZone.id == zone.id)
        .options(selectinload(ShippingZone.rates))
        .execution_options(populate_existing=True)
    )
    fetched = result.scalar_one()
    assert len(fetched.rates) == 1
    assert fetched.rates[0].title == "Standard"


async def test_update_zone(db_session):
    profile = await service.create_profile(ShippingProfileCreate(name="Domestic"), db_session)
    zone = await service.create_zone(profile.id, ShippingZoneCreate(name="PK", countries=["PK"]), db_session)
    updated = await service.update_zone(
        zone.id, ShippingZoneUpdate(name="Pakistan", countries=["PK", "IN"]), db_session,
    )
    assert updated is not None
    assert updated.name == "Pakistan"
    assert updated.countries == ["PK", "IN"]


async def test_update_zone_missing_returns_none(db_session):
    assert await service.update_zone(99999, ShippingZoneUpdate(name="x"), db_session) is None


async def test_delete_zone(db_session):
    profile = await service.create_profile(ShippingProfileCreate(name="Domestic"), db_session)
    zone = await service.create_zone(profile.id, ShippingZoneCreate(name="PK"), db_session)
    assert await service.delete_zone(zone.id, db_session) is True
    assert await service.get_zone(zone.id, db_session) is None
    assert await service.delete_zone(zone.id, db_session) is False


# ---------------------------------------------------------------------------
# Rates
# ---------------------------------------------------------------------------

async def test_create_and_get_rate(db_session):
    profile = await service.create_profile(ShippingProfileCreate(name="Domestic"), db_session)
    zone = await service.create_zone(profile.id, ShippingZoneCreate(name="PK"), db_session)
    rate = await service.create_rate(zone.id, ShippingRateCreate(title="Standard", amount=250), db_session)
    assert rate is not None
    assert rate.zone_id == zone.id
    assert rate.title == "Standard"
    assert rate.rate_type == RateType.flat
    assert float(rate.amount) == 250.0
    assert rate.is_active is True

    fetched = await service.get_rate(rate.id, db_session)
    assert fetched is not None
    assert fetched.title == "Standard"


async def test_create_rate_missing_zone_returns_none(db_session):
    assert await service.create_rate(99999, ShippingRateCreate(title="Standard"), db_session) is None


async def test_create_rate_with_carrier(db_session):
    profile = await service.create_profile(ShippingProfileCreate(name="Domestic"), db_session)
    zone = await service.create_zone(profile.id, ShippingZoneCreate(name="PK"), db_session)
    carrier = await service.create_carrier(CarrierCreate(name="TCS", code="tcs"), db_session)
    rate = await service.create_rate(
        zone.id, ShippingRateCreate(title="TCS", rate_type=RateType.carrier, carrier_id=carrier.id), db_session,
    )
    assert rate is not None
    assert rate.carrier_id == carrier.id
    assert rate.rate_type == RateType.carrier


async def test_get_rate_missing_returns_none(db_session):
    assert await service.get_rate(99999, db_session) is None


async def test_update_rate(db_session):
    profile = await service.create_profile(ShippingProfileCreate(name="Domestic"), db_session)
    zone = await service.create_zone(profile.id, ShippingZoneCreate(name="PK"), db_session)
    rate = await service.create_rate(zone.id, ShippingRateCreate(title="Standard", amount=250), db_session)
    updated = await service.update_rate(rate.id, ShippingRateUpdate(amount=300, is_active=False), db_session)
    assert updated is not None
    assert float(updated.amount) == 300.0
    assert updated.is_active is False


async def test_update_rate_missing_returns_none(db_session):
    assert await service.update_rate(99999, ShippingRateUpdate(amount=10), db_session) is None


async def test_delete_rate(db_session):
    profile = await service.create_profile(ShippingProfileCreate(name="Domestic"), db_session)
    zone = await service.create_zone(profile.id, ShippingZoneCreate(name="PK"), db_session)
    rate = await service.create_rate(zone.id, ShippingRateCreate(title="Standard"), db_session)
    assert await service.delete_rate(rate.id, db_session) is True
    assert await service.get_rate(rate.id, db_session) is None
    assert await service.delete_rate(rate.id, db_session) is False


# ---------------------------------------------------------------------------
# Locations
# ---------------------------------------------------------------------------

async def test_create_and_get_location(db_session):
    location = await service.create_location(FulfillmentLocationCreate(name="Warehouse A", city="Lahore"), db_session)
    assert location.id is not None
    assert location.name == "Warehouse A"
    assert location.is_active is True

    fetched = await service.get_location(location.id, db_session)
    assert fetched is not None
    assert fetched.name == "Warehouse A"


async def test_get_location_missing_returns_none(db_session):
    assert await service.get_location(99999, db_session) is None


async def test_list_locations_filters_inactive(db_session):
    location = await service.create_location(FulfillmentLocationCreate(name="A"), db_session)
    await service.create_location(FulfillmentLocationCreate(name="B"), db_session)
    await service.update_location(location.id, FulfillmentLocationUpdate(is_active=False), db_session)

    assert len(await service.list_locations(db_session)) == 1
    assert len(await service.list_locations(db_session, include_inactive=True)) == 2


async def test_create_location_primary_unsets_others(db_session):
    first = await service.create_location(FulfillmentLocationCreate(name="A", is_primary=True), db_session)
    second = await service.create_location(FulfillmentLocationCreate(name="B", is_primary=True), db_session)

    await db_session.refresh(first)
    assert first.is_primary is False
    assert second.is_primary is True


async def test_update_location_promotes_primary(db_session):
    first = await service.create_location(FulfillmentLocationCreate(name="A", is_primary=True), db_session)
    second = await service.create_location(FulfillmentLocationCreate(name="B"), db_session)
    updated = await service.update_location(second.id, FulfillmentLocationUpdate(is_primary=True), db_session)

    await db_session.refresh(first)
    assert updated.is_primary is True
    assert first.is_primary is False


async def test_update_location_missing_returns_none(db_session):
    assert await service.update_location(99999, FulfillmentLocationUpdate(name="x"), db_session) is None


async def test_delete_location(db_session):
    location = await service.create_location(FulfillmentLocationCreate(name="A"), db_session)
    assert await service.delete_location(location.id, db_session) is True
    assert await service.get_location(location.id, db_session) is None
    assert await service.delete_location(location.id, db_session) is False


# ---------------------------------------------------------------------------
# Packages
# ---------------------------------------------------------------------------

async def test_create_and_get_package(db_session):
    package = await service.create_package(
        PackageCreate(name="Small box", length_cm=10, width_cm=10, height_cm=10, weight_kg=0.5), db_session,
    )
    assert package.id is not None
    assert package.name == "Small box"
    assert package.length_cm == 10.0
    assert package.is_default is False

    fetched = await service.get_package(package.id, db_session)
    assert fetched is not None
    assert fetched.name == "Small box"


async def test_get_package_missing_returns_none(db_session):
    assert await service.get_package(99999, db_session) is None


async def test_list_packages_orders_default_first(db_session):
    await service.create_package(
        PackageCreate(name="A", length_cm=1, width_cm=1, height_cm=1, weight_kg=1), db_session,
    )
    default = await service.create_package(
        PackageCreate(name="B", length_cm=2, width_cm=2, height_cm=2, weight_kg=2, is_default=True), db_session,
    )
    packages = await service.list_packages(db_session)
    assert packages[0].id == default.id


async def test_create_package_default_unsets_others(db_session):
    first = await service.create_package(
        PackageCreate(name="A", length_cm=1, width_cm=1, height_cm=1, weight_kg=1, is_default=True), db_session,
    )
    second = await service.create_package(
        PackageCreate(name="B", length_cm=2, width_cm=2, height_cm=2, weight_kg=2, is_default=True), db_session,
    )

    await db_session.refresh(first)
    assert first.is_default is False
    assert second.is_default is True


async def test_update_package_promotes_default(db_session):
    first = await service.create_package(
        PackageCreate(name="A", length_cm=1, width_cm=1, height_cm=1, weight_kg=1, is_default=True), db_session,
    )
    second = await service.create_package(
        PackageCreate(name="B", length_cm=2, width_cm=2, height_cm=2, weight_kg=2), db_session,
    )
    updated = await service.update_package(second.id, PackageUpdate(is_default=True), db_session)

    await db_session.refresh(first)
    assert updated is not None
    assert updated.is_default is True
    assert first.is_default is False


async def test_update_package_missing_returns_none(db_session):
    assert await service.update_package(99999, PackageUpdate(name="x"), db_session) is None


async def test_delete_package(db_session):
    package = await service.create_package(
        PackageCreate(name="A", length_cm=1, width_cm=1, height_cm=1, weight_kg=1), db_session,
    )
    assert await service.delete_package(package.id, db_session) is True
    assert await service.get_package(package.id, db_session) is None
    assert await service.delete_package(package.id, db_session) is False


async def test_create_package_rejects_negative_dimensions(db_session):
    with pytest.raises(ValueError):
        await service.create_package(
            PackageCreate(name="Bad", length_cm=-1, width_cm=1, height_cm=1, weight_kg=1), db_session,
        )
