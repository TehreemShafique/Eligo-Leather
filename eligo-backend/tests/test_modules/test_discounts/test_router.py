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

    # Each eligible visitor receives a unique code via welcome-check.
    check = await client.post(
        "/api/v1/discounts/public/welcome-check",
        json={"visitor_id": "visitor-w1"},
    )
    unique_code = check.json()["coupon_code"]
    assert unique_code is not None

    response = await client.post(
        "/api/v1/discounts/public/verify-coupon",
        json={"code": unique_code, "subtotal": 2500, "visitor_id": "visitor-w1"},
    )
    assert response.status_code == 200
    body = response.json()
    assert body["valid"] is True
    assert body["discount_type"] == "welcome_discount"
    assert body["discount_amount"] == 250.0


@pytest.mark.asyncio
async def test_public_verify_coupon_rejects_foreign_welcome_code(client, db_session):
    """A visitor may only use their own unique welcome code."""
    db_session.add(WelcomeDiscountSettings(discount_percentage=10, is_active=True))
    await db_session.commit()

    check_a = await client.post(
        "/api/v1/discounts/public/welcome-check",
        json={"visitor_id": "visitor-a"},
    )
    code_a = check_a.json()["coupon_code"]

    # Visitor B tries to use visitor A's code -> invalid.
    response = await client.post(
        "/api/v1/discounts/public/verify-coupon",
        json={"code": code_a, "subtotal": 2500, "visitor_id": "visitor-b"},
    )
    body = response.json()
    assert body["valid"] is False
    assert body["discount_amount"] == 0


@pytest.mark.asyncio
async def test_public_verify_coupon_welcome_rejected_after_redemption(client, db_session):
    """The welcome code must only work on the first checkout: after the code
    has been redeemed (an order was placed with it) the preview is refused."""
    db_session.add(WelcomeDiscountSettings(discount_percentage=10, is_active=True))
    await db_session.commit()

    check = await client.post(
        "/api/v1/discounts/public/welcome-check",
        json={"visitor_id": "visitor-w2"},
    )
    code = check.json()["coupon_code"]

    first = await client.post(
        "/api/v1/discounts/public/verify-coupon",
        json={"code": code, "subtotal": 2500, "visitor_id": "visitor-w2"},
    )
    assert first.json()["valid"] is True

    # Simulate the order having been placed with the welcome code: the
    # redemption is now recorded against the visitor.
    from app.modules.discounts import service

    await service.redeem_welcome_discount(
        db_session, visitor_id="visitor-w2", coupon_code=code,
    )

    returning = await client.post(
        "/api/v1/discounts/public/verify-coupon",
        json={"code": code, "subtotal": 2500, "visitor_id": "visitor-w2"},
    )
    assert returning.json()["valid"] is False
    assert "already been applied" in returning.json()["message"]


@pytest.mark.asyncio
async def test_public_verify_coupon_welcome_rejected_when_campaign_inactive(
    client, db_session
):
    db_session.add(WelcomeDiscountSettings(discount_percentage=10, is_active=False))
    await db_session.commit()

    response = await client.post(
        "/api/v1/discounts/public/verify-coupon",
        json={"code": "WELCOME10", "subtotal": 2500, "visitor_id": "visitor-w3"},
    )
    body = response.json()
    assert body["valid"] is False
    assert body["discount_amount"] == 0


@pytest.mark.asyncio
async def test_public_verify_coupon_welcome_differs_per_visitor(client, db_session):
    """Each visitor gets a distinct code, and one visitor's redemption never
    blocks another visitor."""
    db_session.add(WelcomeDiscountSettings(discount_percentage=10, is_active=True))
    await db_session.commit()

    check_a = await client.post(
        "/api/v1/discounts/public/welcome-check",
        json={"visitor_id": "visitor-a"},
    )
    code_a = check_a.json()["coupon_code"]
    check_b = await client.post(
        "/api/v1/discounts/public/welcome-check",
        json={"visitor_id": "visitor-b"},
    )
    code_b = check_b.json()["coupon_code"]

    # The two visitors must never receive the same code.
    assert code_a != code_b

    await client.post(
        "/api/v1/discounts/public/verify-coupon",
        json={"code": code_a, "subtotal": 1000, "visitor_id": "visitor-a"},
    )
    from app.modules.discounts import service

    await service.redeem_welcome_discount(db_session, visitor_id="visitor-a", coupon_code=code_a)

    other = await client.post(
        "/api/v1/discounts/public/verify-coupon",
        json={"code": code_b, "subtotal": 1000, "visitor_id": "visitor-b"},
    )
    assert other.json()["valid"] is True


# ------------------------------------------------------------------------
# Public welcome-check (visitor_id based eligibility)
# ------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_welcome_check_visitor_eligible_when_active(client, db_session):
    db_session.add(WelcomeDiscountSettings(discount_percentage=10, is_active=True))
    await db_session.commit()

    response = await client.post(
        "/api/v1/discounts/public/welcome-check",
        json={"visitor_id": "visitor-1"},
    )
    assert response.status_code == 200
    body = response.json()
    assert body["eligible"] is True
    assert body["discount_percentage"] == 10.0
    # A unique, server-generated code is returned (format: XXXX-XXXX).
    assert body["coupon_code"] is not None
    assert len(body["coupon_code"]) == 9
    assert body["coupon_code"][4] == "-"
    assert body["is_active"] is True


@pytest.mark.asyncio
async def test_welcome_check_returning_visitor_not_eligible(client, db_session):
    db_session.add(WelcomeDiscountSettings(discount_percentage=10, is_active=True))
    await db_session.commit()

    first = await client.post(
        "/api/v1/discounts/public/welcome-check",
        json={"visitor_id": "visitor-1"},
    )
    assert first.json()["eligible"] is True

    returning = await client.post(
        "/api/v1/discounts/public/welcome-check",
        json={"visitor_id": "visitor-1"},
    )
    assert returning.json()["eligible"] is False


@pytest.mark.asyncio
async def test_welcome_check_inactive_campaign_not_eligible(client, db_session):
    db_session.add(WelcomeDiscountSettings(discount_percentage=10, is_active=False))
    await db_session.commit()

    response = await client.post(
        "/api/v1/discounts/public/welcome-check",
        json={"visitor_id": "visitor-1"},
    )
    assert response.status_code == 200
    assert response.json()["eligible"] is False


@pytest.mark.asyncio
async def test_welcome_check_without_visitor_id_not_eligible(client, db_session):
    db_session.add(WelcomeDiscountSettings(discount_percentage=10, is_active=True))
    await db_session.commit()

    response = await client.post(
        "/api/v1/discounts/public/welcome-check",
        json={},
    )
    assert response.status_code == 200
    assert response.json()["eligible"] is False


@pytest.mark.asyncio
async def test_welcome_check_does_not_require_email(client, db_session):
    """The visitor flow works with an empty payload email/IP — no identity
    fields are required and none are used to decide eligibility."""
    db_session.add(WelcomeDiscountSettings(discount_percentage=15, is_active=True))
    await db_session.commit()

    response = await client.post(
        "/api/v1/discounts/public/welcome-check",
        json={"visitor_id": "visitor-b", "email": "", "ip_address": ""},
    )
    assert response.json()["eligible"] is True
    assert response.json()["coupon_code"] is not None


@pytest.mark.asyncio
async def test_welcome_check_returning_visitor_reuses_same_code(client, db_session):
    """A returning visitor keeps receiving their originally assigned code —
    a fresh code is never generated on subsequent page loads."""
    db_session.add(WelcomeDiscountSettings(discount_percentage=10, is_active=True))
    await db_session.commit()

    first = await client.post(
        "/api/v1/discounts/public/welcome-check",
        json={"visitor_id": "visitor-persist"},
    )
    assert first.json()["eligible"] is True
    first_code = first.json()["coupon_code"]

    # The visitor is no longer eligible to see the popup, but the coupon code
    # returned remains the originally assigned code (it has already been
    # claimed, so evaluate returns the stored code).
    returning = await client.post(
        "/api/v1/discounts/public/welcome-check",
        json={"visitor_id": "visitor-persist"},
    )
    assert returning.json()["eligible"] is False
    assert returning.json()["coupon_code"] == first_code
