"""Tests for app.modules.settings.payment.router"""

from app.core.security import create_access_token, decode_access_token
from app.modules.settings.account.model import UserSession

BASE = "/api/v1/settings/payment"


async def _admin_headers(db_session, admin):
    token = create_access_token({"sub": admin.email})
    jti = decode_access_token(token)["jti"]
    db_session.add(UserSession(user_id=admin.id, token_id=jti))
    await db_session.commit()
    return {"Authorization": f"Bearer {token}"}


# ---------------------------------------------------------------------------
# Auth
# ---------------------------------------------------------------------------

async def test_routes_require_admin(client, auth_headers):
    resp = await client.get(f"{BASE}/settings")
    assert resp.status_code in (401, 403)
    resp = await client.get(f"{BASE}/settings", headers=auth_headers)
    assert resp.status_code == 403


# ---------------------------------------------------------------------------
# Seed / settings
# ---------------------------------------------------------------------------

async def test_seed_default_payment_methods(client, db_session, admin):
    resp = await client.post(f"{BASE}/seed", headers=await _admin_headers(db_session, admin))
    assert resp.status_code == 204

    resp = await client.get(f"{BASE}/methods", headers=await _admin_headers(db_session, admin))
    assert resp.status_code == 200
    body = resp.json()
    assert len(body) == 1
    assert body[0]["name"] == "Cash on Delivery (COD)"
    assert body[0]["is_active"] is True


async def test_get_settings_defaults(client, db_session, admin):
    resp = await client.get(f"{BASE}/settings", headers=await _admin_headers(db_session, admin))
    assert resp.status_code == 200
    body = resp.json()
    assert body["id"] == 1
    assert body["gift_cards_expire"] is False
    assert body["gift_card_validity_years"] is None


async def test_update_settings_gift_card_expiry_logic(client, db_session, admin):
    resp = await client.patch(
        f"{BASE}/settings",
        json={"gift_cards_expire": True},
        headers=await _admin_headers(db_session, admin),
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["gift_cards_expire"] is True
    assert body["gift_card_validity_years"] == 1

    resp = await client.patch(
        f"{BASE}/settings",
        json={"gift_cards_expire": False, "gift_card_validity_years": 5},
        headers=await _admin_headers(db_session, admin),
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["gift_cards_expire"] is False
    assert body["gift_card_validity_years"] is None


async def test_settings_stays_singleton_through_updates(client, db_session, admin):
    await client.patch(
        f"{BASE}/settings",
        json={"payment_capture_method": "manual"},
        headers=await _admin_headers(db_session, admin),
    )
    await client.patch(
        f"{BASE}/settings",
        json={"gift_cards_expire": True},
        headers=await _admin_headers(db_session, admin),
    )
    resp = await client.get(f"{BASE}/settings", headers=await _admin_headers(db_session, admin))
    body = resp.json()
    assert body["id"] == 1
    assert body["gift_cards_expire"] is True


# ---------------------------------------------------------------------------
# Payment methods lifecycle
# ---------------------------------------------------------------------------

async def test_payment_method_full_lifecycle(client, db_session, admin):
    resp = await client.post(
        f"{BASE}/methods", json={"name": "Bank Transfer"}, headers=await _admin_headers(db_session, admin),
    )
    assert resp.status_code == 201
    body = resp.json()
    assert body["name"] == "Bank Transfer"
    assert body["is_active"] is True
    method_id = body["id"]

    resp = await client.get(f"{BASE}/methods/{method_id}", headers=await _admin_headers(db_session, admin))
    assert resp.status_code == 200
    assert resp.json()["name"] == "Bank Transfer"

    resp = await client.patch(
        f"{BASE}/methods/{method_id}",
        json={"payment_instructions": "Transfer via app"},
        headers=await _admin_headers(db_session, admin),
    )
    assert resp.status_code == 200
    assert resp.json()["payment_instructions"] == "Transfer via app"

    resp = await client.post(
        f"{BASE}/methods/{method_id}/deactivate", headers=await _admin_headers(db_session, admin),
    )
    assert resp.status_code == 200
    assert resp.json()["is_active"] is False

    resp = await client.delete(f"{BASE}/methods/{method_id}", headers=await _admin_headers(db_session, admin))
    assert resp.status_code == 204


async def test_list_methods_excludes_inactive(client, db_session, admin):
    cod = await client.post(
        f"{BASE}/methods", json={"name": "COD"}, headers=await _admin_headers(db_session, admin),
    )
    card = await client.post(
        f"{BASE}/methods", json={"name": "Card"}, headers=await _admin_headers(db_session, admin),
    )
    await client.post(
        f"{BASE}/methods/{card.json()['id']}/deactivate", headers=await _admin_headers(db_session, admin),
    )

    resp = await client.get(f"{BASE}/methods", headers=await _admin_headers(db_session, admin))
    assert resp.status_code == 200
    body = resp.json()
    assert len(body) == 1
    assert body[0]["name"] == "COD"
    assert cod.json()["id"] == body[0]["id"]

    resp = await client.get(
        f"{BASE}/methods", params={"include_inactive": "true"}, headers=await _admin_headers(db_session, admin),
    )
    assert resp.status_code == 200
    assert len(resp.json()) == 2


# ---------------------------------------------------------------------------
# Missing records -> 404
# ---------------------------------------------------------------------------

async def test_get_method_missing_404(client, db_session, admin):
    resp = await client.get(f"{BASE}/methods/99999", headers=await _admin_headers(db_session, admin))
    assert resp.status_code == 404
    assert resp.json()["detail"] == "Payment method not found"


async def test_patch_method_missing_404(client, db_session, admin):
    resp = await client.patch(
        f"{BASE}/methods/99999", json={"name": "x"}, headers=await _admin_headers(db_session, admin),
    )
    assert resp.status_code == 404


async def test_deactivate_method_missing_404(client, db_session, admin):
    resp = await client.post(
        f"{BASE}/methods/99999/deactivate", headers=await _admin_headers(db_session, admin),
    )
    assert resp.status_code == 404


async def test_delete_method_missing_404(client, db_session, admin):
    resp = await client.delete(f"{BASE}/methods/99999", headers=await _admin_headers(db_session, admin))
    assert resp.status_code == 404


# ---------------------------------------------------------------------------
# Validation -> 422
# ---------------------------------------------------------------------------

async def test_create_method_missing_name_422(client, db_session, admin):
    resp = await client.post(f"{BASE}/methods", json={}, headers=await _admin_headers(db_session, admin))
    assert resp.status_code == 422


async def test_patch_settings_invalid_capture_method_422(client, db_session, admin):
    resp = await client.patch(
        f"{BASE}/settings",
        json={"payment_capture_method": "never"},
        headers=await _admin_headers(db_session, admin),
    )
    assert resp.status_code == 422
