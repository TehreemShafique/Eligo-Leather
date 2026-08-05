"""Tests for app.modules.settings.locations.service"""

from app.modules.settings.locations import service
from app.modules.settings.locations.schema import LocationCreate, LocationUpdate


async def _mk(db_session, **kwargs):
    data = {"name": "Main", **kwargs}
    return await service.create_location(LocationCreate(**data), db_session)


async def test_get_default_location_none_when_missing(db_session):
    assert await service.get_default_location(db_session) is None


async def test_create_and_get_location(db_session):
    location = await _mk(db_session)
    assert location.id is not None
    assert location.country == "Pakistan"
    assert location.is_active is True
    assert location.is_primary is False

    fetched = await service.get_location(location.id, db_session)
    assert fetched is not None
    assert fetched.name == "Main"
    assert await service.get_location(99999, db_session) is None


async def test_create_primary_demotes_others(db_session):
    first = await service.create_location(LocationCreate(name="A", is_primary=True), db_session)
    second = await service.create_location(LocationCreate(name="B", is_primary=True), db_session)

    assert (await service.get_location(first.id, db_session)).is_primary is False
    assert second.is_primary is True
    assert (await service.get_default_location(db_session)).id == second.id


async def test_list_locations_empty(db_session):
    assert await service.list_locations(db_session) == []


async def test_list_locations_status_filter(db_session):
    await service.create_location(LocationCreate(name="A"), db_session)
    second = await service.create_location(LocationCreate(name="B"), db_session)
    await service.update_location(second.id, LocationUpdate(is_active=False), db_session)

    assert len(await service.list_locations(db_session)) == 2
    assert len(await service.list_locations(db_session, status="active")) == 1
    assert len(await service.list_locations(db_session, status="inactive")) == 1


async def test_list_locations_search(db_session):
    await service.create_location(LocationCreate(name="Lahore Hub", city="Lahore"), db_session)
    await service.create_location(LocationCreate(name="Karachi Hub", city="Karachi"), db_session)

    assert len(await service.list_locations(db_session, search="lahore")) == 1
    assert len(await service.list_locations(db_session, search="Hub")) == 2


async def test_list_locations_sort_by_name_order(db_session):
    await service.create_location(LocationCreate(name="Bravo"), db_session)
    await service.create_location(LocationCreate(name="Alpha"), db_session)

    asc = await service.list_locations(db_session, sort_by="name", order="asc")
    assert [loc.name for loc in asc] == ["Alpha", "Bravo"]

    desc = await service.list_locations(db_session, sort_by="name", order="desc")
    assert [loc.name for loc in desc] == ["Bravo", "Alpha"]


async def test_update_location(db_session):
    location = await _mk(db_session)
    updated = await service.update_location(location.id, LocationUpdate(city="Lahore"), db_session)
    assert updated is not None
    assert updated.city == "Lahore"
    assert await service.update_location(99999, LocationUpdate(city="x"), db_session) is None


async def test_update_primary_demotes_others(db_session):
    first = await _mk(db_session)
    second = await service.create_location(LocationCreate(name="B"), db_session)

    await service.update_location(first.id, LocationUpdate(is_primary=True), db_session)

    assert (await service.get_location(first.id, db_session)).is_primary is True
    assert (await service.get_location(second.id, db_session)).is_primary is False


async def test_set_default_location(db_session):
    first = await _mk(db_session)
    second = await service.create_location(LocationCreate(name="B"), db_session)

    defaulted = await service.set_default_location(first.id, db_session)
    assert defaulted.is_primary is True

    await service.set_default_location(second.id, db_session)
    assert (await service.get_location(first.id, db_session)).is_primary is False
    assert (await service.get_location(second.id, db_session)).is_primary is True


async def test_set_default_location_missing_returns_none(db_session):
    assert await service.set_default_location(99999, db_session) is None


async def test_delete_location(db_session):
    location = await _mk(db_session)
    assert await service.delete_location(location.id, db_session) is True
    assert await service.get_location(location.id, db_session) is None
    assert await service.delete_location(location.id, db_session) is False


async def test_get_summary_empty(db_session):
    summary = await service.get_summary(db_session)
    assert summary["total"] == 0
    assert summary["active"] == 0
    assert summary["inactive"] == 0
    assert summary["limit"] == service.LOCATION_LIMIT
    assert summary["default_location"] is None


async def test_get_summary_counts(db_session):
    first = await service.create_location(LocationCreate(name="A", is_primary=True), db_session)
    second = await service.create_location(LocationCreate(name="B"), db_session)
    await service.update_location(second.id, LocationUpdate(is_active=False), db_session)

    summary = await service.get_summary(db_session)
    assert summary["total"] == 2
    assert summary["active"] == 1
    assert summary["inactive"] == 1
    assert summary["default_location"].id == first.id


async def test_create_beyond_limit_is_not_enforced(db_session):
    for i in range(service.LOCATION_LIMIT + 1):
        await service.create_location(LocationCreate(name=f"Loc {i}"), db_session)

    assert len(await service.list_locations(db_session)) == service.LOCATION_LIMIT + 1
