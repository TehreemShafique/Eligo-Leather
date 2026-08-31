"""Tests for app.modules.customers.model."""

from app.db.base import Base
from app.modules.customers.model import Customer, CustomerAddress


def test_customer_table_registered():
    assert "customers" in Base.metadata.tables


def test_customer_email_unique_and_optional():
    column = Customer.__table__.c.email
    assert column.unique is True
    assert column.nullable is True


async def test_customer_defaults(db_session):
    customer = Customer(email="c@example.com")
    db_session.add(customer)
    await db_session.commit()
    await db_session.refresh(customer)
    assert customer.id is not None
    assert customer.customer_language == "en"
    assert customer.email_subscription is False
    assert customer.sms_subscription is False
    assert customer.whatsapp_subscription is False
    assert customer.total_orders == 0
    assert customer.amount_spent == 0
    assert customer.tax_exempt is False
    assert customer.tax_settings == "collect"
    assert customer.deletable is True
    assert customer.mergeable is True
    assert customer.default_address_id is None


def test_address_table_registered():
    assert "customer_addresses" in Base.metadata.tables


def test_address_required_columns():
    table = CustomerAddress.__table__
    assert table.c.customer_id.nullable is False
    assert table.c.address_line1.nullable is False
    assert table.c.city.nullable is False


async def test_address_defaults(db_session):
    customer = Customer(email="c@example.com")
    db_session.add(customer)
    await db_session.commit()
    await db_session.refresh(customer)

    address = CustomerAddress(
        customer_id=customer.id,
        address_line1="1 Main St",
        city="Lahore",
    )
    db_session.add(address)
    await db_session.commit()
    await db_session.refresh(address)
    assert address.country == "Pakistan"
    assert address.is_default is False
    assert address.address_type == "both"


def test_association_tables_registered():
    assert "customer_company" in Base.metadata.tables
    assert "customer_segment" in Base.metadata.tables
