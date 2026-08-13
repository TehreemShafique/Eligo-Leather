"""Tests for app.modules.settings.legal_privacy.router"""

from app.core.security import create_access_token, decode_access_token
from app.modules.settings.account.model import UserSession

ADMIN = "/api/v1/settings/legal-privacy"
PUBLIC = "/api/v1/settings/legal-privacy/public"


async def _admin_headers(db_session, admin):
    token = create_access_token({"sub": admin.email})
    jti = decode_access_token(token)["jti"]
    db_session.add(UserSession(user_id=admin.id, token_id=jti))
    await db_session.commit()
    return {"Authorization": f"Bearer {token}"}


# ---------------------------------------------------------------------------
# Public (storefront) routes - no auth required
# ---------------------------------------------------------------------------

async def test_public_settings_no_auth(client):
    resp = await client.get(f"{PUBLIC}/settings")
    assert resp.status_code == 200
    body = resp.json()
    assert body["cookie_banner_enabled"] is True
    assert body["cookie_banner_theme"] == "light"
    assert body["opt_out_url"] == "/pages/opt-out"


async def test_public_policies_no_auth(client):
    resp = await client.get(f"{PUBLIC}/policies")
    assert resp.status_code == 200
    assert resp.json() == []


async def test_public_settings_reflect_admin_updates(client, db_session, admin):
    resp = await client.post(
        f"{ADMIN}/privacy-settings",
        json={"network_intelligence_enabled": True, "show_in_checkout": True},
        headers=await _admin_headers(db_session, admin),
    )
    assert resp.status_code == 200

    resp = await client.get(f"{PUBLIC}/settings")
    assert resp.status_code == 200
    body = resp.json()
    assert body["network_intelligence_enabled"] is True
    assert body["show_in_checkout"] is True


async def test_public_policies_reflect_seeded_policies(client, db_session, admin):
    await client.post(f"{ADMIN}/seed", headers=await _admin_headers(db_session, admin))
    resp = await client.get(f"{PUBLIC}/policies")
    assert resp.status_code == 200
    body = resp.json()
    assert len(body) == 5
    assert body[0]["policy_type"] in {
        "privacy_policy", "refund_policy", "terms_of_service", "shipping_policy", "legal_notice",
    }


# ---------------------------------------------------------------------------
# Admin routes require admin
# ---------------------------------------------------------------------------

async def test_admin_routes_require_admin(client, auth_headers):
    resp = await client.get(f"{ADMIN}/policies")
    assert resp.status_code in (401, 403)
    resp = await client.get(f"{ADMIN}/policies", headers=auth_headers)
    assert resp.status_code == 404


# ---------------------------------------------------------------------------
# Seed / policies
# ---------------------------------------------------------------------------

async def test_seed_defaults(client, db_session, admin):
    resp = await client.post(f"{ADMIN}/seed", headers=await _admin_headers(db_session, admin))
    assert resp.status_code == 201
    assert resp.json() == {"status": "ok"}

    resp = await client.get(f"{ADMIN}/policies", headers=await _admin_headers(db_session, admin))
    assert resp.status_code == 200
    assert len(resp.json()) == 5


async def test_list_policies_empty_by_default(client, db_session, admin):
    resp = await client.get(f"{ADMIN}/policies", headers=await _admin_headers(db_session, admin))
    assert resp.status_code == 200
    assert resp.json() == []


async def test_get_policy_missing_404(client, db_session, admin):
    resp = await client.get(
        f"{ADMIN}/policies/privacy_policy", headers=await _admin_headers(db_session, admin),
    )
    assert resp.status_code == 404
    assert resp.json()["detail"] == "Policy not found"


async def test_upsert_and_get_policy(client, db_session, admin):
    resp = await client.put(
        f"{ADMIN}/policies",
        json={"policy_type": "privacy_policy", "title": "Custom Privacy", "content": "<p>My policy</p>"},
        headers=await _admin_headers(db_session, admin),
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["title"] == "Custom Privacy"
    assert body["content"] == "<p>My policy</p>"
    assert body["is_automated"] is False

    resp = await client.get(
        f"{ADMIN}/policies/privacy_policy", headers=await _admin_headers(db_session, admin),
    )
    assert resp.status_code == 200
    assert resp.json()["content"] == "<p>My policy</p>"


async def test_upsert_policy_automated_uses_template(client, db_session, admin):
    resp = await client.put(
        f"{ADMIN}/policies",
        json={"policy_type": "refund_policy", "is_automated": True},
        headers=await _admin_headers(db_session, admin),
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["title"] == "Refund Policy"
    assert body["is_automated"] is True
    assert "Return window" in body["content"]


async def test_put_policy_invalid_type_422(client, db_session, admin):
    resp = await client.put(
        f"{ADMIN}/policies",
        json={"policy_type": "teleportation_policy"},
        headers=await _admin_headers(db_session, admin),
    )
    assert resp.status_code == 422


async def test_regenerate_policy(client, db_session, admin):
    await client.put(
        f"{ADMIN}/policies",
        json={"policy_type": "shipping_policy", "content": "<p>Custom shipping</p>"},
        headers=await _admin_headers(db_session, admin),
    )
    resp = await client.post(
        f"{ADMIN}/policies/shipping_policy/regenerate", headers=await _admin_headers(db_session, admin),
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["is_automated"] is True
    assert body["title"] == "Shipping Policy"
    assert "<p>Custom shipping</p>" not in body["content"]


# ---------------------------------------------------------------------------
# Privacy settings
# ---------------------------------------------------------------------------

async def test_get_privacy_settings_defaults(client, db_session, admin):
    resp = await client.get(f"{ADMIN}/privacy-settings", headers=await _admin_headers(db_session, admin))
    assert resp.status_code == 200
    body = resp.json()
    assert body["id"] == 1
    assert body["cookie_banner_enabled"] is True
    assert body["network_intelligence_enabled"] is False


async def test_save_privacy_settings_with_opt_out_menu(client, db_session, admin):
    resp = await client.post(
        f"{ADMIN}/privacy-settings",
        json={"cookie_banner_enabled": False, "opt_out_menu_target": "Footer"},
        headers=await _admin_headers(db_session, admin),
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["settings"]["cookie_banner_enabled"] is False
    assert body["settings"]["opt_out_menu_target"] == "Footer"
    assert body["opt_out_menu"]["title"] == "Footer"
    assert body["opt_out_menu"]["label"] == "Do Not Sell My Info"

    resp = await client.get(f"{PUBLIC}/settings")
    assert resp.json()["cookie_banner_enabled"] is False


async def test_save_privacy_settings_invalid_theme_422(client, db_session, admin):
    resp = await client.post(
        f"{ADMIN}/privacy-settings",
        json={"cookie_banner_theme": "neon"},
        headers=await _admin_headers(db_session, admin),
    )
    assert resp.status_code == 422
