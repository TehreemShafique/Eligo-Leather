"""Tests for app.modules.settings.general.service"""

from app.modules.settings.general import service
from app.modules.settings.general.model import BusinessType
from app.modules.settings.general.schema import (
    BusinessEntityCreate,
    BusinessEntityUpdate,
    StoreBrandUpdate,
    StoreSettingsUpdate,
)


async def test_get_store_settings_creates_singleton(db_session):
    settings = await service.get_store_settings(db_session)
    assert settings.id == 1
    assert settings.store_name == "Eligo Leather"
    assert settings.country == "Pakistan"
    assert settings.currency == "PKR"


async def test_update_store_settings_persists(db_session):
    updated = await service.update_store_settings(
        StoreSettingsUpdate(store_name="Eligo", support_email="support@eligo.pk"),
        db_session,
    )
    assert updated.store_name == "Eligo"
    assert updated.support_email == "support@eligo.pk"

    fetched = await service.get_store_settings(db_session)
    assert fetched.store_name == "Eligo"


async def test_list_entities_empty(db_session):
    assert await service.list_entities(db=db_session) == []


async def test_create_and_get_entity(db_session):
    entity = await service.create_entity(
        BusinessEntityCreate(business_type=BusinessType.individual, nickname="Main", city="Lahore"),
        db_session,
    )
    assert entity.id is not None
    assert entity.business_type == BusinessType.individual
    assert entity.is_active is True
    assert entity.is_archive is False

    fetched = await service.get_entity(entity.id, db_session)
    assert fetched is not None
    assert fetched.nickname == "Main"
    assert await service.get_entity(99999, db_session) is None


async def test_list_entities_filters_by_archive(db_session):
    first = await service.create_entity(
        BusinessEntityCreate(business_type=BusinessType.individual, nickname="A"),
        db_session,
    )
    await service.create_entity(
        BusinessEntityCreate(business_type=BusinessType.individual, nickname="B"),
        db_session,
    )

    await service.archive_entity(first.id, db_session)

    assert len(await service.list_entities(db=db_session)) == 1
    assert len(await service.list_entities(is_archived=True, db=db_session)) == 1


async def test_update_entity(db_session):
    entity = await service.create_entity(
        BusinessEntityCreate(business_type=BusinessType.individual, nickname="A", city="Lahore"),
        db_session,
    )
    updated = await service.update_entity(
        entity.id, BusinessEntityUpdate(nickname="B", city="Karachi"), db_session
    )
    assert updated is not None
    assert updated.nickname == "B"
    assert updated.city == "Karachi"
    assert await service.update_entity(99999, BusinessEntityUpdate(nickname="x"), db_session) is None


async def test_update_entity_active_keeps_single_active(db_session):
    a = await service.create_entity(
        BusinessEntityCreate(business_type=BusinessType.individual, nickname="A"), db_session
    )
    b = await service.create_entity(
        BusinessEntityCreate(business_type=BusinessType.individual, nickname="B"), db_session
    )
    c = await service.create_entity(
        BusinessEntityCreate(business_type=BusinessType.individual, nickname="C"), db_session
    )

    await service.update_entity(b.id, BusinessEntityUpdate(is_active=True), db_session)

    assert (await service.get_entity(a.id, db_session)).is_active is False
    assert (await service.get_entity(b.id, db_session)).is_active is True
    assert (await service.get_entity(c.id, db_session)).is_active is False


async def test_archive_entity(db_session):
    entity = await service.create_entity(
        BusinessEntityCreate(business_type=BusinessType.individual, nickname="A"),
        db_session,
    )
    archived = await service.archive_entity(entity.id, db_session)
    assert archived is not None
    assert archived.is_archive is True
    assert archived.is_active is False
    assert await service.archive_entity(99999, db_session) is None


async def test_get_store_brand_creates_singleton(db_session):
    brand = await service.get_store_brand(db_session)
    assert brand.id == 1


async def test_update_store_brand_persists(db_session):
    updated = await service.update_store_brand(
        StoreBrandUpdate(slogan="Handmade", primary_color="#8B5A2B"),
        db_session,
    )
    assert updated.slogan == "Handmade"
    assert updated.primary_color == "#8B5A2B"

    fetched = await service.get_store_brand(db_session)
    assert fetched.slogan == "Handmade"
