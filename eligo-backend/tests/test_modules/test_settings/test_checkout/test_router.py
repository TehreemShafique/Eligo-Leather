"""Tests for app.modules.settings.checkout.router"""

from app.core.security import create_access_token, decode_access_token
from app.modules.settings.account.model import UserSession

BASE = "/api/v1/settings/checkout"


async def _admin_headers(db_session, admin):
    token = create_access_token({"sub": admin.email})
    jti = decode_access_token(token)["jti"]
    db_session.add(UserSession(user_id=admin.id, token_id=jti))
    await db_session.commit()
    return {"Authorization": f"Bearer {token}"}


# ---------------------------------------------------------------------------
# Auth
# ---------------------------------------------------------------------------

async def test_configs_require_admin(client, auth_headers):
    resp = await client.get(f"{BASE}/configs")
    assert resp.status_code in (401, 403)
    resp = await client.get(f"{BASE}/configs", headers=auth_headers)
    assert resp.status_code == 403


# ---------------------------------------------------------------------------
# Seed / list / active
# ---------------------------------------------------------------------------

async def test_seed_default_config(client, db_session, admin):
    resp = await client.post(f"{BASE}/seed", headers=await _admin_headers(db_session, admin))
    assert resp.status_code == 204

    resp = await client.get(f"{BASE}/configs", headers=await _admin_headers(db_session, admin))
    assert resp.status_code == 200
    body = resp.json()
    assert len(body) == 1
    assert body[0]["name"] == "My Store configuration"
    assert body[0]["is_active"] is True


async def test_list_and_active_configs(client, db_session, admin):
    resp = await client.get(f"{BASE}/configs", headers=await _admin_headers(db_session, admin))
    assert resp.status_code == 200
    assert len(resp.json()) == 1

    resp = await client.get(f"{BASE}/configs/active", headers=await _admin_headers(db_session, admin))
    assert resp.status_code == 200
    body = resp.json()
    assert body["name"] == "My Store configuration"
    assert body["is_active"] is True


# ---------------------------------------------------------------------------
# Full lifecycle
# ---------------------------------------------------------------------------

async def test_config_full_lifecycle(client, db_session, admin):
    resp = await client.post(
        f"{BASE}/configs", json={"name": "Draft"}, headers=await _admin_headers(db_session, admin),
    )
    assert resp.status_code == 201
    body = resp.json()
    assert body["name"] == "Draft"
    assert body["is_active"] is False
    config_id = body["id"]

    resp = await client.get(f"{BASE}/configs/{config_id}", headers=await _admin_headers(db_session, admin))
    assert resp.status_code == 200
    assert resp.json()["name"] == "Draft"

    resp = await client.patch(
        f"{BASE}/configs/{config_id}",
        json={"contact_method": "email", "show_tipping": True},
        headers=await _admin_headers(db_session, admin),
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["contact_method"] == "email"
    assert body["show_tipping"] is True

    resp = await client.post(
        f"{BASE}/configs/{config_id}/rename",
        json={"name": "Renamed"},
        headers=await _admin_headers(db_session, admin),
    )
    assert resp.status_code == 200
    assert resp.json()["name"] == "Renamed"

    resp = await client.post(
        f"{BASE}/configs/{config_id}/duplicate", headers=await _admin_headers(db_session, admin),
    )
    assert resp.status_code == 201
    copy = resp.json()
    assert copy["id"] != config_id
    assert copy["name"] == "Renamed (copy)"

    resp = await client.post(
        f"{BASE}/configs/{config_id}/activate", headers=await _admin_headers(db_session, admin),
    )
    assert resp.status_code == 200
    assert resp.json()["is_active"] is True

    resp = await client.delete(
        f"{BASE}/configs/{config_id}", headers=await _admin_headers(db_session, admin),
    )
    assert resp.status_code == 204


async def test_create_config_uses_default_name(client, db_session, admin):
    resp = await client.post(
        f"{BASE}/configs", json={}, headers=await _admin_headers(db_session, admin),
    )
    assert resp.status_code == 201
    body = resp.json()
    assert body["name"] == "My Store configuration"
    assert body["is_active"] is False


# ---------------------------------------------------------------------------
# Missing records -> 404
# ---------------------------------------------------------------------------

async def test_get_config_missing_404(client, db_session, admin):
    resp = await client.get(f"{BASE}/configs/99999", headers=await _admin_headers(db_session, admin))
    assert resp.status_code == 404
    assert resp.json()["detail"] == "Checkout configuration not found"


async def test_update_config_missing_404(client, db_session, admin):
    resp = await client.patch(
        f"{BASE}/configs/99999", json={"name": "x"}, headers=await _admin_headers(db_session, admin),
    )
    assert resp.status_code == 404


async def test_rename_config_missing_404(client, db_session, admin):
    resp = await client.post(
        f"{BASE}/configs/99999/rename", json={"name": "x"}, headers=await _admin_headers(db_session, admin),
    )
    assert resp.status_code == 404


async def test_duplicate_config_missing_404(client, db_session, admin):
    resp = await client.post(
        f"{BASE}/configs/99999/duplicate", headers=await _admin_headers(db_session, admin),
    )
    assert resp.status_code == 404


async def test_activate_config_missing_404(client, db_session, admin):
    resp = await client.post(
        f"{BASE}/configs/99999/activate", headers=await _admin_headers(db_session, admin),
    )
    assert resp.status_code == 404


async def test_delete_config_missing_404(client, db_session, admin):
    resp = await client.delete(
        f"{BASE}/configs/99999", headers=await _admin_headers(db_session, admin),
    )
    assert resp.status_code == 404


# ---------------------------------------------------------------------------
# Validation -> 422
# ---------------------------------------------------------------------------

async def test_patch_invalid_cart_limit_422(client, db_session, admin):
    resp = await client.patch(
        f"{BASE}/configs/1", json={"cart_item_limit": 0}, headers=await _admin_headers(db_session, admin),
    )
    assert resp.status_code == 422


async def test_patch_invalid_enum_422(client, db_session, admin):
    resp = await client.patch(
        f"{BASE}/configs/1",
        json={"contact_method": "carrier_pigeon"},
        headers=await _admin_headers(db_session, admin),
    )
    assert resp.status_code == 422
