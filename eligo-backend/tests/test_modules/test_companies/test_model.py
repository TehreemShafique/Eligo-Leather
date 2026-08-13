"""Tests for app.modules.companies.model."""

from app.db.base import Base
from app.modules.companies.model import (
    Company,
    CompanyLocation,
    OrderSubmissionMode,
    PaymentTerms,
    TaxCollectionMode,
)


def test_company_table_registered():
    assert "companies" in Base.metadata.tables
    assert "company_locations" in Base.metadata.tables


def test_company_index_on_name():
    assert any(i.name == "ix_companies_company_name" for i in Company.__table__.indexes)


def test_company_unique_company_id_ref():
    assert Company.__table__.c.company_id_ref.unique is True


async def test_company_defaults(db_session):
    company = Company(company_name="Acme")
    db_session.add(company)
    await db_session.commit()
    await db_session.refresh(company)
    assert company.id is not None
    assert company.billing_address_same_as_shipping is True
    assert company.tax_settings == "collect_unless_exempt"
    assert company.company_id_ref is None
    assert company.tax_id is None


def test_payment_terms_enum_values():
    assert [e.value for e in PaymentTerms] == [
        "none",
        "due_on_fulfillment",
        "net_7",
        "net_15",
        "net_30",
        "net_45",
        "net_60",
        "net_90",
    ]


def test_order_submission_mode_enum_values():
    assert [e.value for e in OrderSubmissionMode] == [
        "automatic",
        "draft_without_address",
        "all_drafts",
    ]


def test_tax_collection_mode_enum_values():
    assert [e.value for e in TaxCollectionMode] == ["collect_unless_exempt", "dont_collect"]


def test_location_index_on_company_id():
    assert any(i.name == "ix_company_locations_company_id" for i in CompanyLocation.__table__.indexes)


async def test_location_defaults(db_session):
    company = Company(company_name="Acme")
    db_session.add(company)
    await db_session.commit()
    await db_session.refresh(company)

    location = CompanyLocation(company_id=company.id, location_name="WH")
    db_session.add(location)
    await db_session.commit()
    await db_session.refresh(location)
    assert location.country == "Pakistan"
    assert location.payment_terms == "none"
    assert location.order_submission == "automatic"
    assert location.ship_to_address is True
    assert location.is_active is True
