"""Tests for app.modules.companies.service."""

from sqlalchemy import select

from app.modules.companies.model import Company, CompanyLocation
from app.modules.companies.schema import (
    CompanyCreate,
    CompanyLocationCreate,
    CompanyLocationUpdate,
    CompanyUpdate,
)
from app.modules.companies import service


async def _fresh(db_session, model, obj_id):
    result = await db_session.execute(
        select(model).where(model.id == obj_id).execution_options(populate_existing=True)
    )
    return result.scalar_one()


async def _mk_company(db_session, **kwargs):
    data = {"company_name": "Acme", **kwargs}
    return await service.create_company(db_session, CompanyCreate(**data))


# ===========================================================================
# Company CRUD
# ===========================================================================

async def test_create_company(db_session):
    company = await _mk_company(db_session, company_name="Acme", tax_settings="dont_collect")
    assert company.id is not None
    assert company.company_name == "Acme"
    assert company.tax_settings == "dont_collect"
    assert company.billing_address_same_as_shipping is True
    assert company.created_at is not None
    assert company.updated_at is not None


async def test_create_company_with_locations(db_session):
    company = await service.create_company(
        db_session,
        CompanyCreate(
            company_name="Acme",
            locations=[CompanyLocationCreate(location_name="WH", city="Karachi")],
        ),
    )
    assert len(company.locations) == 1
    assert company.locations[0].location_name == "WH"
    assert company.locations[0].country == "Pakistan"


async def test_get_company(db_session):
    company = await _mk_company(db_session)
    found = await service.get_company(db_session, company.id)
    assert found is not None
    assert found.id == company.id
    assert await service.get_company(db_session, 999999) is None


async def test_list_companies_empty(db_session):
    assert await service.list_companies(db_session) == []


async def test_list_companies_search_filters_pagination(db_session):
    await _mk_company(db_session, company_name="Acme", company_id_ref="ref-1", net_payment_terms="net_30")
    await _mk_company(db_session, company_name="Globex", net_payment_terms="net_60")

    found = await service.list_companies(db_session, search="acme")
    assert [c.company_name for c in found] == ["Acme"]

    found = await service.list_companies(db_session, search="ref-1")
    assert len(found) == 1
    assert found[0].company_name == "Acme"

    found = await service.list_companies(db_session, payment_terms="net_30")
    assert len(found) == 1
    assert found[0].company_name == "Acme"

    assert len(await service.list_companies(db_session, limit=1)) == 1
    assert await service.list_companies(db_session, skip=5) == []


async def test_update_company(db_session):
    company = await _mk_company(db_session, company_name="Acme")
    updated = await service.update_company(
        db_session, company.id, CompanyUpdate(company_name="Renamed", note="hi")
    )
    assert updated.company_name == "Renamed"
    assert updated.note == "hi"
    fresh = await _fresh(db_session, Company, company.id)
    assert fresh.company_name == "Renamed"
    assert fresh.note == "hi"


async def test_update_company_missing_returns_none(db_session):
    assert await service.update_company(db_session, 999999, CompanyUpdate(note="x")) is None


async def test_delete_company(db_session):
    company = await _mk_company(db_session)
    assert await service.delete_company(db_session, company.id) is True
    assert await service.get_company(db_session, company.id) is None
    assert await service.delete_company(db_session, company.id) is False


# ===========================================================================
# Company locations
# ===========================================================================

async def test_create_location(db_session):
    company = await _mk_company(db_session)
    location = await service.create_location(
        db_session, company.id, CompanyLocationCreate(location_name="WH", city="Karachi")
    )
    assert location.company_id == company.id
    assert location.location_name == "WH"
    assert location.country == "Pakistan"
    assert location.payment_terms == "none"
    assert location.order_submission == "automatic"
    assert location.is_active is True
    assert location.ship_to_address is True


async def test_list_locations(db_session):
    company = await _mk_company(db_session)
    await service.create_location(db_session, company.id, CompanyLocationCreate(location_name="WH"))
    locations = await service.list_locations(db_session, company.id)
    assert len(locations) == 1
    assert locations[0].location_name == "WH"
    assert await service.list_locations(db_session, 999999) == []


async def test_get_location(db_session):
    company = await _mk_company(db_session)
    location = await service.create_location(db_session, company.id, CompanyLocationCreate(location_name="WH"))
    assert (await service.get_location(db_session, location.id)).id == location.id
    assert await service.get_location(db_session, 999999) is None


async def test_update_location(db_session):
    company = await _mk_company(db_session)
    location = await service.create_location(db_session, company.id, CompanyLocationCreate(location_name="WH"))
    updated = await service.update_location(db_session, location.id, CompanyLocationUpdate(city="Lahore"))
    assert updated.city == "Lahore"
    assert await service.update_location(db_session, 999999, CompanyLocationUpdate(city="X")) is None


async def test_delete_location(db_session):
    company = await _mk_company(db_session)
    location = await service.create_location(db_session, company.id, CompanyLocationCreate(location_name="WH"))
    assert await service.delete_location(db_session, location.id) is True
    assert await service.get_location(db_session, location.id) is None
    assert await service.delete_location(db_session, location.id) is False
