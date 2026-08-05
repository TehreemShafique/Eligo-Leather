"""Tests for app.modules.companies.router."""

import pytest
from fastapi.exceptions import ResponseValidationError

from app.modules.companies.model import Company
from app.modules.companies.schema import CompanyLocationCreate
from app.modules.companies import service


async def _mk_company(db_session, **kwargs):
    company = Company(**{"company_name": "Acme", **kwargs})
    db_session.add(company)
    await db_session.commit()
    await db_session.refresh(company)
    return company


# ===========================================================================
# Company CRUD
# ===========================================================================

async def test_requires_auth(client):
    resp = await client.get("/api/v1/companies/")
    assert resp.status_code == 401


async def test_create_company(client, auth_headers):
    resp = await client.post(
        "/api/v1/companies/", json={"company_name": "Acme"}, headers=auth_headers
    )
    assert resp.status_code == 201
    body = resp.json()
    assert body["id"] > 0
    assert body["company_name"] == "Acme"
    assert body["tax_settings"] == "collect_unless_exempt"
    assert body["billing_address_same_as_shipping"] is True
    assert "created_at" in body
    assert body["locations"] == []


async def test_create_company_requires_name(client, auth_headers):
    resp = await client.post("/api/v1/companies/", json={}, headers=auth_headers)
    assert resp.status_code == 422


async def test_list_companies(client, auth_headers, db_session):
    await _mk_company(db_session, company_name="Acme")
    resp = await client.get("/api/v1/companies/", headers=auth_headers)
    assert resp.status_code == 200
    assert [c["company_name"] for c in resp.json()] == ["Acme"]


async def test_get_company(client, auth_headers, db_session):
    company = await _mk_company(db_session)
    resp = await client.get(f"/api/v1/companies/{company.id}", headers=auth_headers)
    assert resp.status_code == 200
    body = resp.json()
    assert body["company_name"] == "Acme"
    assert body["locations"] == []


async def test_get_company_missing(client, auth_headers):
    resp = await client.get("/api/v1/companies/999999", headers=auth_headers)
    assert resp.status_code == 404
    assert resp.json()["detail"] == "Company not found"


async def test_update_company_pins_refresh_bug(client, auth_headers, db_session):
    """PATCH /companies/{id} 500s: ``update_company``
    (app/modules/companies/service.py:73) refreshes only
    ``["locations", "customers"]``, leaving ``updated_at`` expired, so the
    CompanyOut response fails validation. Pinned so the bug stays visible."""
    company = await _mk_company(db_session)
    with pytest.raises(ResponseValidationError):
        await client.patch(f"/api/v1/companies/{company.id}", json={"note": "x"}, headers=auth_headers)


async def test_update_company_missing(client, auth_headers):
    resp = await client.patch("/api/v1/companies/999999", json={"note": "x"}, headers=auth_headers)
    assert resp.status_code == 404
    assert resp.json()["detail"] == "Company not found"


async def test_delete_company(client, auth_headers, db_session):
    company = await _mk_company(db_session)
    resp = await client.delete(f"/api/v1/companies/{company.id}", headers=auth_headers)
    assert resp.status_code == 204
    resp = await client.get(f"/api/v1/companies/{company.id}", headers=auth_headers)
    assert resp.status_code == 404


async def test_delete_company_missing(client, auth_headers):
    resp = await client.delete("/api/v1/companies/999999", headers=auth_headers)
    assert resp.status_code == 404
    assert resp.json()["detail"] == "Company not found"


# ===========================================================================
# Company locations
# ===========================================================================

async def test_create_location(client, auth_headers, db_session):
    company = await _mk_company(db_session)
    resp = await client.post(
        f"/api/v1/companies/{company.id}/locations",
        json={"location_name": "WH", "city": "Karachi"},
        headers=auth_headers,
    )
    assert resp.status_code == 201
    body = resp.json()
    assert body["company_id"] == company.id
    assert body["location_name"] == "WH"
    assert body["country"] == "Pakistan"


async def test_list_locations(client, auth_headers, db_session):
    company = await _mk_company(db_session)
    await service.create_location(db_session, company.id, CompanyLocationCreate(location_name="WH"))
    resp = await client.get(f"/api/v1/companies/{company.id}/locations", headers=auth_headers)
    assert resp.status_code == 200
    assert len(resp.json()) == 1


async def test_get_location(client, auth_headers, db_session):
    company = await _mk_company(db_session)
    location = await service.create_location(db_session, company.id, CompanyLocationCreate(location_name="WH"))
    resp = await client.get(f"/api/v1/companies/locations/{location.id}", headers=auth_headers)
    assert resp.status_code == 200
    assert resp.json()["location_name"] == "WH"


async def test_get_location_missing(client, auth_headers):
    resp = await client.get("/api/v1/companies/locations/999999", headers=auth_headers)
    assert resp.status_code == 404
    assert resp.json()["detail"] == "Company location not found"


async def test_update_location(client, auth_headers, db_session):
    company = await _mk_company(db_session)
    location = await service.create_location(db_session, company.id, CompanyLocationCreate(location_name="WH"))
    resp = await client.patch(
        f"/api/v1/companies/locations/{location.id}", json={"city": "Lahore"}, headers=auth_headers
    )
    assert resp.status_code == 200
    assert resp.json()["city"] == "Lahore"


async def test_update_location_missing(client, auth_headers):
    resp = await client.patch("/api/v1/companies/locations/999999", json={"city": "X"}, headers=auth_headers)
    assert resp.status_code == 404
    assert resp.json()["detail"] == "Company location not found"


async def test_delete_location(client, auth_headers, db_session):
    company = await _mk_company(db_session)
    location = await service.create_location(db_session, company.id, CompanyLocationCreate(location_name="WH"))
    resp = await client.delete(f"/api/v1/companies/locations/{location.id}", headers=auth_headers)
    assert resp.status_code == 204
    resp = await client.get(f"/api/v1/companies/locations/{location.id}", headers=auth_headers)
    assert resp.status_code == 404


async def test_delete_location_missing(client, auth_headers):
    resp = await client.delete("/api/v1/companies/locations/999999", headers=auth_headers)
    assert resp.status_code == 404
    assert resp.json()["detail"] == "Company location not found"
