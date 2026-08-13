"""Tests for app.modules.customers.service."""

from sqlalchemy import select

from app.modules.companies.model import Company
from app.modules.customers.model import Customer, CustomerAddress
from app.modules.customers.schema import (
    CustomerAddressCreate,
    CustomerAddressUpdate,
    CustomerCreate,
    CustomerUpdate,
    ImportCustomerRow,
)
from app.modules.customers import service
from app.modules.segments.model import Segment


async def _fresh(db_session, model, obj_id):
    result = await db_session.execute(
        select(model).where(model.id == obj_id).execution_options(populate_existing=True)
    )
    return result.scalar_one()


async def _mk_customer(db_session, **kwargs):
    data = {"email": "c@example.com", **kwargs}
    return await service.create_customer(db_session, CustomerCreate(**data))


# ===========================================================================
# Customer CRUD
# ===========================================================================

async def test_create_customer(db_session):
    customer = await _mk_customer(db_session, email="a@b.com", first_name="Ali")
    assert customer.id is not None
    assert customer.email == "a@b.com"
    assert customer.first_name == "Ali"
    assert customer.tax_settings == "collect"


async def test_create_customer_with_address(db_session):
    customer = await service.create_customer(
        db_session,
        CustomerCreate(
            email="a@b.com",
            address=CustomerAddressCreate(address_line1="1 Main St", city="Lahore"),
        ),
    )
    assert customer.default_address_id is not None
    assert len(customer.addresses) == 1
    assert customer.addresses[0].is_default is True
    assert customer.location == "Lahore, Pakistan"


async def test_get_by_email(db_session):
    customer = await _mk_customer(db_session, email="a@b.com")
    assert (await service.get_by_email(db_session, "a@b.com")).id == customer.id
    assert await service.get_by_email(db_session, "nope@x.com") is None


async def test_get_customer(db_session):
    customer = await _mk_customer(db_session)
    found = await service.get_customer(db_session, customer.id)
    assert found is not None
    assert found.email == "c@example.com"
    assert await service.get_customer(db_session, 999999) is None


async def test_list_customers_empty(db_session):
    assert await service.list_customers(db_session) == []


async def test_list_customers_filters_sort_pagination(db_session):
    await _mk_customer(db_session, email="ali@b.com", first_name="Ali", email_subscription=True)
    await _mk_customer(db_session, email="sara@b.com", first_name="Sara", sms_subscription=True)
    await _mk_customer(db_session, email="zara@b.com", first_name="Zara")

    found = await service.list_customers(db_session, search="ali")
    assert len(found) == 1
    assert found[0].email == "ali@b.com"

    found = await service.list_customers(db_session, email_subscription=True)
    assert len(found) == 1

    found = await service.list_customers(db_session, sms_subscription=True)
    assert len(found) == 1

    found = await service.list_customers(db_session, sort_by="email", sort_order="asc")
    assert [c.email for c in found] == ["ali@b.com", "sara@b.com", "zara@b.com"]

    found = await service.list_customers(db_session, limit=2)
    assert len(found) == 2

    found = await service.list_customers(db_session, skip=3)
    assert found == []


async def test_update_customer(db_session):
    customer = await _mk_customer(db_session)
    updated = await service.update_customer(db_session, customer.id, CustomerUpdate(first_name="Z", tags="vip"))
    assert updated.first_name == "Z"
    assert updated.tags == "vip"
    fresh = await _fresh(db_session, Customer, customer.id)
    assert fresh.first_name == "Z"
    assert fresh.tags == "vip"


async def test_update_customer_with_company_ids(db_session):
    customer = await _mk_customer(db_session)
    company = Company(company_name="Acme")
    db_session.add(company)
    await db_session.commit()
    await db_session.refresh(company)

    updated = await service.update_customer(
        db_session, customer.id, CustomerUpdate(company_ids=[company.id])
    )
    assert len(updated.companies) == 1
    assert updated.companies[0].company_name == "Acme"


async def test_update_customer_missing_returns_none(db_session):
    assert await service.update_customer(db_session, 999999, CustomerUpdate(first_name="x")) is None


async def test_delete_customer(db_session):
    customer = await _mk_customer(db_session)
    assert await service.delete_customer(db_session, customer.id) is True
    assert await service.get_customer(db_session, customer.id) is None


async def test_delete_customer_missing_returns_false(db_session):
    assert await service.delete_customer(db_session, 999999) is False


# ===========================================================================
# Customer addresses
# ===========================================================================

async def test_create_address_sets_default(db_session):
    customer = await _mk_customer(db_session)
    address = await service.create_address(
        db_session, customer.id, CustomerAddressCreate(address_line1="2 Main St", city="Karachi")
    )
    assert address.customer_id == customer.id
    fresh = await _fresh(db_session, Customer, customer.id)
    assert fresh.default_address_id == address.id
    assert fresh.location == "Karachi, Pakistan"


async def test_list_addresses(db_session):
    customer = await _mk_customer(db_session)
    await service.create_address(db_session, customer.id, CustomerAddressCreate(address_line1="1 St", city="X"))
    addresses = await service.list_addresses(db_session, customer.id)
    assert len(addresses) == 1
    assert await service.list_addresses(db_session, 999999) == []


async def test_get_address(db_session):
    customer = await _mk_customer(db_session)
    address = await service.create_address(db_session, customer.id, CustomerAddressCreate(address_line1="1 St", city="X"))
    assert (await service.get_address(db_session, address.id)).id == address.id
    assert await service.get_address(db_session, 999999) is None


async def test_update_address(db_session):
    customer = await _mk_customer(db_session)
    address = await service.create_address(db_session, customer.id, CustomerAddressCreate(address_line1="1 St", city="X"))
    updated = await service.update_address(db_session, address.id, CustomerAddressUpdate(city="Y"))
    assert updated.city == "Y"
    assert await service.update_address(db_session, 999999, CustomerAddressUpdate(city="Z")) is None


async def test_delete_address(db_session):
    customer = await _mk_customer(db_session)
    address = await service.create_address(db_session, customer.id, CustomerAddressCreate(address_line1="1 St", city="X"))
    assert await service.delete_address(db_session, address.id) is True
    assert await service.get_address(db_session, address.id) is None
    assert await service.delete_address(db_session, address.id) is False


# ===========================================================================
# Export & import
# ===========================================================================

async def test_export_customers_all_and_selected(db_session):
    c1 = await _mk_customer(db_session, email="a@b.com")
    await _mk_customer(db_session, email="c@d.com")

    all_rows = await service.export_customers(db_session, scope="all")
    assert {c.email for c in all_rows} == {"a@b.com", "c@d.com"}

    selected = await service.export_customers(db_session, scope="selected", customer_ids=[c1.id])
    assert [c.email for c in selected] == ["a@b.com"]


async def test_export_customers_by_segment(db_session):
    customer = await _mk_customer(db_session, email="a@b.com")
    segment = Segment(name="VIP")
    db_session.add(segment)
    await db_session.commit()
    await db_session.refresh(segment)
    await service.assign_segments(db_session, customer.id, [segment.id])

    rows = await service.export_customers(db_session, scope="segment", segment_id=segment.id)
    assert [c.email for c in rows] == ["a@b.com"]


async def test_import_customers_skip_duplicates(db_session):
    await _mk_customer(db_session, email="a@b.com")
    rows = [
        ImportCustomerRow(email="a@b.com", first_name="Ali"),
        ImportCustomerRow(email="new@b.com", first_name="New"),
    ]
    imported, skipped, errors = await service.import_customers(db_session, rows, skip_duplicates=True)
    assert imported == 1
    assert skipped == 1
    assert errors == []


async def test_import_customers_no_skip_duplicates(db_session):
    await _mk_customer(db_session, email="a@b.com")
    rows = [ImportCustomerRow(email="a@b.com")]
    imported, skipped, errors = await service.import_customers(db_session, rows, skip_duplicates=False)
    assert imported == 0
    assert skipped == 0
    assert errors == ["Duplicate email: a@b.com"]


# ===========================================================================
# Company / Segment assignment
# ===========================================================================

async def test_assign_and_remove_companies(db_session):
    customer = await _mk_customer(db_session)
    company = Company(company_name="Acme")
    db_session.add(company)
    await db_session.commit()
    await db_session.refresh(company)

    updated = await service.assign_companies(db_session, customer.id, [company.id])
    assert len(updated.companies) == 1

    updated = await service.assign_companies(db_session, customer.id, [company.id])
    assert len(updated.companies) == 1

    removed = await service.remove_companies(db_session, customer.id, [company.id])
    assert removed.companies == []

    assert await service.assign_companies(db_session, 999999, [company.id]) is None
    assert await service.remove_companies(db_session, 999999, [company.id]) is None


async def test_assign_and_remove_segments(db_session):
    customer = await _mk_customer(db_session)
    segment = Segment(name="VIP")
    db_session.add(segment)
    await db_session.commit()
    await db_session.refresh(segment)

    updated = await service.assign_segments(db_session, customer.id, [segment.id])
    assert len(updated.segments) == 1

    removed = await service.remove_segments(db_session, customer.id, [segment.id])
    assert removed.segments == []

    assert await service.assign_segments(db_session, 999999, [segment.id]) is None
    assert await service.remove_segments(db_session, 999999, [segment.id]) is None
