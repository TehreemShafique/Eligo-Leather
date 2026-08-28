"""Tests for the discounts router in ``app.modules.discounts.router``."""

import pytest

from app.modules.discounts.model import WelcomeDiscountSettings


@pytest.mark.asyncio
async def test_discounts_require_auth(client):
    response = await client.get("/api/v1/discounts/")
    assert response.status_code in (401, 403)


@pytest.mark.asyncio
async def test_create_discount(client, admin_headers):
    response = await client.post(
        "/api/v1/discounts/",
        headers=admin_headers,
        json={"title": "Welcome Offer", "code": "WELCOME15"},
    )
    assert response.status_code == 201
    body = response.json()
    assert body["title"] == "Welcome Offer"
    assert body["code"] == "WELCOME15"
    assert body["status"] == "Active"


@pytest.mark.asyncio
async def test_list_discounts(client, admin_headers):
    await client.post(
        "/api/v1/discounts/",
        headers=admin_headers,
        json={"title": "First", "code": "FIRST"},
    )
    response = await client.get("/api/v1/discounts/", headers=admin_headers)
    assert response.status_code == 200
    assert len(response.json()) == 1


@pytest.mark.asyncio
async def test_get_discount_by_id(client, admin_headers):
    created = await client.post(
        "/api/v1/discounts/",
        headers=admin_headers,
        json={"title": "By Id", "code": "BYID"},
    )
    discount_id = created.json()["id"]
    response = await client.get(f"/api/v1/discounts/{discount_id}", headers=admin_headers)
    assert response.status_code == 200
    assert response.json()["code"] == "BYID"


@pytest.mark.asyncio
async def test_get_discount_missing_returns_404(client, admin_headers):
    response = await client.get("/api/v1/discounts/99999", headers=admin_headers)
    assert response.status_code == 404
    assert response.json()["detail"] == "Discount not found"


@pytest.mark.asyncio
async def test_update_discount(client, admin_headers):
    created = await client.post(
        "/api/v1/discounts/",
        headers=admin_headers,
        json={"title": "Before", "code": "BEFORE"},
    )
    discount_id = created.json()["id"]
    response = await client.patch(
        f"/api/v1/discounts/{discount_id}",
        headers=admin_headers,
        json={"title": "After"},
    )
    assert response.status_code == 200
    assert response.json()["title"] == "After"


@pytest.mark.asyncio
async def test_delete_discount(client, admin_headers):
    created = await client.post(
        "/api/v1/discounts/",
        headers=admin_headers,
        json={"title": "Delete me", "code": "DEL"},
    )
    discount_id = created.json()["id"]
    response = await client.delete(f"/api/v1/discounts/{discount_id}", headers=admin_headers)
    assert response.status_code == 204


@pytest.mark.asyncio
async def test_delete_discount_missing_returns_404(client, admin_headers):
    response = await client.delete("/api/v1/discounts/99999", headers=admin_headers)
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_welcome_settings_requires_discount_manager(client, auth_headers):
    response = await client.get("/api/v1/discounts/welcome", headers=auth_headers)
    assert response.status_code == 403


@pytest.mark.asyncio
async def test_welcome_settings_admin_can_read(client, admin_headers):
    response = await client.get("/api/v1/discounts/welcome", headers=admin_headers)
    assert response.status_code == 200
    body = response.json()
    assert body["discount_percentage"] == 10
    assert body["is_active"] is False


@pytest.mark.asyncio
async def test_welcome_settings_admin_can_update(client, admin_headers):
    response = await client.patch(
        "/api/v1/discounts/welcome",
        headers=admin_headers,
        json={"discount_percentage": 20, "is_active": True},
    )
    assert response.status_code == 200
    body = response.json()
    assert body["discount_percentage"] == 20
    assert body["is_active"] is True


@pytest.mark.asyncio
async def test_welcome_settings_validation(client, admin_headers):
    response = await client.patch(
        "/api/v1/discounts/welcome",
        headers=admin_headers,
        json={"discount_percentage": 150},
    )
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_login_shows_welcome_discount_when_active(client, db_session):
    db_session.add(WelcomeDiscountSettings(discount_percentage=10, is_active=True))
    await db_session.commit()

    await client.post(
        "/api/v1/auth/register",
        json={"email": "disc@example.com", "password": "secret123"},
    )
    login = await client.post(
        "/api/v1/auth/login",
        json={"email": "disc@example.com", "password": "secret123"},
    )
    assert login.status_code == 200
    body = login.json()
    assert body["show_welcome_discount"] is True
    assert body["welcome_discount_percentage"] == 10.0


# ---------------------------------------------------------------------------
# Public checkout: verify-coupon
# ---------------------------------------------------------------------------

async def _create_promo(client, admin_headers, **overrides):
    payload = {
        "title": "Promo",
        "code": "SAVE10",
        "status": "Active",
        "method": "Code",
        "type": "Percentage",
        "percentage_value": 10,
        "value": "10% OFF",
    }
    payload.update(overrides)
    response = await client.post("/api/v1/discounts/", headers=admin_headers, json=payload)
    assert response.status_code == 201
    return response.json()


@pytest.mark.asyncio
async def test_public_verify_coupon_applies_admin_promo_discount(client, admin_headers):
    await _create_promo(client, admin_headers)

    response = await client.post(
        "/api/v1/discounts/public/verify-coupon",
        json={"code": "SAVE10", "subtotal": 2500},
    )
    assert response.status_code == 200
    body = response.json()
    assert body["valid"] is True
    assert body["discount_type"] == "percentage"
    assert body["discount_percentage"] == 10.0
    assert body["discount_amount"] == 250.0
    assert body["discounted_subtotal"] == 2250.0
    # Codes are matched case-insensitively.
    response_lower = await client.post(
        "/api/v1/discounts/public/verify-coupon",
        json={"code": "save10", "subtotal": 1000},
    )
    assert response_lower.json()["valid"] is True
    assert response_lower.json()["discounted_subtotal"] == 900.0


@pytest.mark.asyncio
async def test_public_verify_coupon_rejects_unknown_code(client):
    response = await client.post(
        "/api/v1/discounts/public/verify-coupon",
        json={"code": "NOPE123", "subtotal": 2500},
    )
    assert response.status_code == 200
    body = response.json()
    assert body["valid"] is False
    assert body["discount_amount"] == 0
    assert body["discounted_subtotal"] == 2500.0


@pytest.mark.asyncio
async def test_public_verify_coupon_rejects_expired_and_disabled_promos(client, admin_headers):
    await _create_promo(client, admin_headers, code="OLDYEAR", end_date="2020-01-01T00:00:00Z")
    await _create_promo(client, admin_headers, code="PAUSED", status="Disabled")

    expired = await client.post(
        "/api/v1/discounts/public/verify-coupon",
        json={"code": "OLDYEAR", "subtotal": 2500},
    )
    assert expired.json()["valid"] is False

    paused = await client.post(
        "/api/v1/discounts/public/verify-coupon",
        json={"code": "PAUSED", "subtotal": 2500},
    )
    assert paused.json()["valid"] is False


@pytest.mark.asyncio
async def test_public_verify_coupon_supports_welcome_code(client, db_session):
    db_session.add(WelcomeDiscountSettings(discount_percentage=10, is_active=True))
    await db_session.commit()

    response = await client.post(
        "/api/v1/discounts/public/verify-coupon",
        json={"code": "WELCOME10", "subtotal": 2500},
    )
    assert response.status_code == 200
    body = response.json()
    assert body["valid"] is True
    assert body["discount_type"] == "welcome_discount"
    assert body["discount_amount"] == 250.0
