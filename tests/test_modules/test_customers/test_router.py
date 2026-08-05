"""Tests for app.modules.customers.router."""

import pytest
from fastapi.exceptions import ResponseValidationError
from pydantic_core import PydanticSerializationError


async def _mk_customer_via_api(client, auth_headers, email="c@example.com", **extra):
    payload = {"email": email, **extra}
    resp = await client.post("/api/v1/customers/", json=payload, headers=auth_headers)
    assert resp.status_code == 201
    return resp.json()


# ===========================================================================
# Auth
# ===========================================================================

async def test_requires_auth(client):
    assert (await client.get("/api/v1/customers/")).status_code == 401
    assert (await client.post("/api/v1/customers/", json={"email": "a@b.com"})).status_code == 401
    assert (await client.get("/api/v1/customers/1/addresses")).status_code == 401
    assert (await client.post("/api/v1/customers/export", json={"scope": "all"})).status_code == 401
    assert (await client.post("/api/v1/customers/import", json={"customers": []})).status_code == 401
    assert (await client.post("/api/v1/customers/1/companies", json=[1])).status_code == 401
    assert (await client.post("/api/v1/customers/1/segments", json=[1])).status_code == 401


# ===========================================================================
# Customer CRUD
# ===========================================================================

async def test_create_customer(client, auth_headers):
    resp = await client.post(
        "/api/v1/customers/", json={"email": "a@b.com", "first_name": "Ali"}, headers=auth_headers
    )
    assert resp.status_code == 201
    body = resp.json()
    assert body["email"] == "a@b.com"
    assert body["first_name"] == "Ali"
    assert body["customer_language"] == "en"
    assert body["companies"] == []
    assert body["segments"] == []


async def test_create_customer_duplicate_email(client, auth_headers):
    await _mk_customer_via_api(client, auth_headers, email="a@b.com")
    resp = await client.post("/api/v1/customers/", json={"email": "a@b.com"}, headers=auth_headers)
    assert resp.status_code == 400
    assert resp.json()["detail"] == "Customer with this email already exists"


async def test_create_customer_invalid_body(client, auth_headers):
    resp = await client.post("/api/v1/customers/", json={}, headers=auth_headers)
    assert resp.status_code == 422
    resp = await client.post(
        "/api/v1/customers/", json={"email": "not-an-email"}, headers=auth_headers
    )
    assert resp.status_code == 422


async def test_create_customer_with_address_pins_bug(client, auth_headers):
    """POST /customers/ with a nested ``address`` 500s on valid input:
    create_customer (app/modules/customers/service.py:152) refreshes only
    ["companies", "segments", "addresses"] after the flush that set the
    default address, leaving ``updated_at`` expired and the response
    serialization raises ResponseValidationError. Pinned so the bug stays
    visible."""
    with pytest.raises(ResponseValidationError):
        await client.post(
            "/api/v1/customers/",
            json={"email": "a@b.com", "address": {"address_line1": "1 St", "city": "Lahore"}},
            headers=auth_headers,
        )


async def test_create_customer_with_company_ids_pins_bug(client, auth_headers, db_session):
    """POST /customers/ with ``company_ids`` 500s on valid input: CustomerOut
    (app/modules/customers/schema.py:133) types ``companies``/``segments`` as
    plain ``list``, which cannot serialize ORM objects. Pinned."""
    from app.modules.companies.model import Company

    company = Company(company_name="Acme")
    db_session.add(company)
    await db_session.commit()
    await db_session.refresh(company)

    with pytest.raises(PydanticSerializationError):
        await client.post(
            "/api/v1/customers/",
            json={"email": "a@b.com", "company_ids": [company.id]},
            headers=auth_headers,
        )


async def test_create_customer_with_segment_ids_pins_bug(client, auth_headers, db_session):
    from app.modules.segments.model import Segment

    segment = Segment(name="VIP")
    db_session.add(segment)
    await db_session.commit()
    await db_session.refresh(segment)

    with pytest.raises(PydanticSerializationError):
        await client.post(
            "/api/v1/customers/",
            json={"email": "a@b.com", "segment_ids": [segment.id]},
            headers=auth_headers,
        )


async def test_list_customers(client, auth_headers):
    await _mk_customer_via_api(client, auth_headers, email="a@b.com")
    resp = await client.get("/api/v1/customers/", headers=auth_headers)
    assert resp.status_code == 200
    assert len(resp.json()) == 1


async def test_get_customer(client, auth_headers):
    created = await _mk_customer_via_api(client, auth_headers)
    resp = await client.get(f"/api/v1/customers/{created['id']}", headers=auth_headers)
    assert resp.status_code == 200
    assert resp.json()["email"] == "c@example.com"


async def test_get_customer_missing(client, auth_headers):
    resp = await client.get("/api/v1/customers/999999", headers=auth_headers)
    assert resp.status_code == 404
    assert resp.json()["detail"] == "Customer not found"


async def test_update_customer_pins_refresh_bug(client, auth_headers):
    """PATCH /customers/{id} 500s on valid input: update_customer
    (app/modules/customers/service.py:179) refreshes only
    ["companies", "segments", "addresses"], leaving the server-updated
    ``updated_at`` expired. Pinned so the bug stays visible."""
    created = await _mk_customer_via_api(client, auth_headers)
    with pytest.raises(ResponseValidationError):
        await client.patch(
            f"/api/v1/customers/{created['id']}",
            json={"first_name": "Z"},
            headers=auth_headers,
        )


async def test_update_customer_missing(client, auth_headers):
    resp = await client.patch(
        "/api/v1/customers/999999", json={"first_name": "x"}, headers=auth_headers
    )
    assert resp.status_code == 404
    assert resp.json()["detail"] == "Customer not found"


async def test_delete_customer(client, auth_headers):
    created = await _mk_customer_via_api(client, auth_headers)
    resp = await client.delete(f"/api/v1/customers/{created['id']}", headers=auth_headers)
    assert resp.status_code == 204
    resp = await client.get(f"/api/v1/customers/{created['id']}", headers=auth_headers)
    assert resp.status_code == 404


async def test_delete_customer_missing(client, auth_headers):
    resp = await client.delete("/api/v1/customers/999999", headers=auth_headers)
    assert resp.status_code == 404
    assert resp.json()["detail"] == "Customer not found"


# ===========================================================================
# Addresses
# ===========================================================================

async def test_address_crud(client, auth_headers):
    created = await _mk_customer_via_api(client, auth_headers)
    customer_id = created["id"]

    resp = await client.post(
        f"/api/v1/customers/{customer_id}/addresses",
        json={"address_line1": "1 St", "city": "Lahore"},
        headers=auth_headers,
    )
    assert resp.status_code == 201
    body = resp.json()
    assert body["address_line1"] == "1 St"
    assert body["city"] == "Lahore"
    assert body["country"] == "Pakistan"
    address_id = body["id"]

    resp = await client.get(f"/api/v1/customers/{customer_id}/addresses", headers=auth_headers)
    assert resp.status_code == 200
    assert len(resp.json()) == 1

    resp = await client.get(f"/api/v1/customers/addresses/{address_id}", headers=auth_headers)
    assert resp.status_code == 200
    assert resp.json()["id"] == address_id

    resp = await client.get("/api/v1/customers/addresses/999999", headers=auth_headers)
    assert resp.status_code == 404
    assert resp.json()["detail"] == "Address not found"

    resp = await client.patch(
        f"/api/v1/customers/addresses/{address_id}", json={"city": "Karachi"}, headers=auth_headers
    )
    assert resp.status_code == 200
    assert resp.json()["city"] == "Karachi"

    resp = await client.patch(
        "/api/v1/customers/addresses/999999", json={"city": "x"}, headers=auth_headers
    )
    assert resp.status_code == 404
    assert resp.json()["detail"] == "Address not found"

    resp = await client.delete(f"/api/v1/customers/addresses/{address_id}", headers=auth_headers)
    assert resp.status_code == 204

    resp = await client.delete("/api/v1/customers/addresses/999999", headers=auth_headers)
    assert resp.status_code == 404
    assert resp.json()["detail"] == "Address not found"


async def test_create_address_invalid(client, auth_headers):
    created = await _mk_customer_via_api(client, auth_headers)
    resp = await client.post(
        f"/api/v1/customers/{created['id']}/addresses", json={}, headers=auth_headers
    )
    assert resp.status_code == 422


# ===========================================================================
# Export / Import
# ===========================================================================

async def test_export_customers(client, auth_headers):
    await _mk_customer_via_api(client, auth_headers, email="a@b.com")
    resp = await client.post("/api/v1/customers/export", json={"scope": "all"}, headers=auth_headers)
    assert resp.status_code == 200
    assert resp.headers["content-type"].startswith("text/csv")
    assert "ID,Email,First Name" in resp.text
    assert "a@b.com" in resp.text


async def test_import_customers(client, auth_headers):
    resp = await client.post(
        "/api/v1/customers/import",
        json={"customers": [{"email": "new@b.com", "first_name": "New"}], "skip_duplicates": True},
        headers=auth_headers,
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["imported"] == 1
    assert body["skipped"] == 0
    assert body["errors"] == []


async def test_import_customers_skips_duplicates(client, auth_headers):
    await _mk_customer_via_api(client, auth_headers, email="a@b.com")
    resp = await client.post(
        "/api/v1/customers/import",
        json={
            "customers": [{"email": "a@b.com"}, {"email": "fresh@b.com"}],
            "skip_duplicates": True,
        },
        headers=auth_headers,
    )
    assert resp.status_code == 200
    assert resp.json()["imported"] == 1
    assert resp.json()["skipped"] == 1


async def test_import_customers_duplicates_not_skipped(client, auth_headers):
    await _mk_customer_via_api(client, auth_headers, email="a@b.com")
    resp = await client.post(
        "/api/v1/customers/import",
        json={"customers": [{"email": "a@b.com"}], "skip_duplicates": False},
        headers=auth_headers,
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["imported"] == 0
    assert body["errors"] == ["Duplicate email: a@b.com"]


async def test_import_customers_invalid(client, auth_headers):
    resp = await client.post(
        "/api/v1/customers/import",
        json={"customers": [{"email": "not-an-email"}]},
        headers=auth_headers,
    )
    assert resp.status_code == 422


# ===========================================================================
# Company / Segment assignment
# ===========================================================================

async def test_assign_companies_pins_bug(client, auth_headers, db_session):
    """POST /customers/{id}/companies 500s on valid input: CustomerOut
    (app/modules/customers/schema.py:133) types ``companies``/``segments`` as
    plain ``list``, which cannot serialize ORM Company objects. Pinned so the
    bug stays visible."""
    from app.modules.companies.model import Company

    company = Company(company_name="Acme")
    db_session.add(company)
    await db_session.commit()
    await db_session.refresh(company)
    created = await _mk_customer_via_api(client, auth_headers)

    with pytest.raises(PydanticSerializationError):
        await client.post(
            f"/api/v1/customers/{created['id']}/companies",
            json=[company.id],
            headers=auth_headers,
        )


async def test_remove_companies_pins_bug(client, auth_headers, db_session):
    """DELETE /customers/{id}/companies 500s when companies remain after
    removal: CustomerOut (app/modules/customers/schema.py:133) types
    ``companies``/``segments`` as plain ``list``, which cannot serialize ORM
    Company objects. Pinned so the bug stays visible."""
    from app.modules.companies.model import Company
    from app.modules.customers import service
    from app.modules.customers.schema import CustomerCreate

    company1 = Company(company_name="Acme")
    company2 = Company(company_name="Globex")
    db_session.add_all([company1, company2])
    await db_session.commit()
    await db_session.refresh(company1)
    await db_session.refresh(company2)

    customer = await service.create_customer(db_session, CustomerCreate(email="rm@b.com"))
    await service.assign_companies(db_session, customer.id, [company1.id, company2.id])

    with pytest.raises(PydanticSerializationError):
        await client.request(
            "DELETE",
            f"/api/v1/customers/{customer.id}/companies",
            json=[company1.id],
            headers=auth_headers,
        )


async def test_assign_segments_pins_bug(client, auth_headers, db_session):
    from app.modules.segments.model import Segment

    segment = Segment(name="VIP")
    db_session.add(segment)
    await db_session.commit()
    await db_session.refresh(segment)
    created = await _mk_customer_via_api(client, auth_headers)

    with pytest.raises(PydanticSerializationError):
        await client.post(
            f"/api/v1/customers/{created['id']}/segments",
            json=[segment.id],
            headers=auth_headers,
        )


async def test_assign_companies_missing_customer(client, auth_headers):
    resp = await client.post("/api/v1/customers/999999/companies", json=[1], headers=auth_headers)
    assert resp.status_code == 404
    assert resp.json()["detail"] == "Customer not found"


async def test_remove_companies_missing_customer(client, auth_headers):
    resp = await client.request(
        "DELETE", "/api/v1/customers/999999/companies", json=[1], headers=auth_headers
    )
    assert resp.status_code == 404
    assert resp.json()["detail"] == "Customer not found"


async def test_assign_segments_missing_customer(client, auth_headers):
    resp = await client.post("/api/v1/customers/999999/segments", json=[1], headers=auth_headers)
    assert resp.status_code == 404
    assert resp.json()["detail"] == "Customer not found"


async def test_remove_segments_missing_customer(client, auth_headers):
    resp = await client.request(
        "DELETE", "/api/v1/customers/999999/segments", json=[1], headers=auth_headers
    )
    assert resp.status_code == 404
    assert resp.json()["detail"] == "Customer not found"
