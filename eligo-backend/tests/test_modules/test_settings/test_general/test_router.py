"""Tests for app.modules.settings.general.router"""

import pytest
from fastapi.exceptions import ResponseValidationError

from app.core.security import create_access_token, decode_access_token
from app.modules.settings.account.model import UserSession

BASE = "/api/v1/settings/general"


async def _admin_headers(db_session, admin):
    token = create_access_token({"sub": admin.email})
    jti = decode_access_token(token)["jti"]
    db_session.add(UserSession(user_id=admin.id, token_id=jti))
    await db_session.commit()
    return {"Authorization": f"Bearer {token}"}


async def test_routes_require_auth(client):
    assert (await client.get(f"{BASE}/store-settings")).status_code == 401
    assert (await client.get(f"{BASE}/business-entities")).status_code == 401
    assert (await client.get(f"{BASE}/store-brand")).status_code == 401


async def test_routes_require_admin(client, auth_headers):
    resp = await client.get(f"{BASE}/store-settings", headers=auth_headers)
    assert resp.status_code == 403
    assert resp.json()["detail"] == "User is Not admin"


async def test_get_store_settings_pins_auto_archive_response_bug(client, db_session, admin):
    """GET /store-settings 500s on valid input: StoreSettings.auto_archive_on_fulfillment
    is a Boolean column while StoreSettingOut types it as the FulfillmentPolicy enum
    (app/modules/settings/general/model.py + schema.py), so response validation always
    fails. Pinned so the bug stays visible."""
    with pytest.raises(ResponseValidationError):
        await client.get(f"{BASE}/store-settings", headers=await _admin_headers(db_session, admin))


async def test_update_store_settings_pins_auto_archive_response_bug(client, db_session, admin):
    """PATCH /store-settings 500s for the same bool-vs-enum reason as GET
    /store-settings. Pinned so the bug stays visible."""
    with pytest.raises(ResponseValidationError):
        await client.patch(
            f"{BASE}/store-settings",
            json={"store_name": "Eligo Store", "support_email": "support@eligo.pk"},
            headers=await _admin_headers(db_session, admin),
        )


async def test_list_business_entities_empty_404(client, db_session, admin):
    resp = await client.get(f"{BASE}/business-entities", headers=await _admin_headers(db_session, admin))
    assert resp.status_code == 404
    assert resp.json()["detail"] == "Business entity not found."


async def test_business_entity_crud(client, db_session, admin):
    resp = await client.post(
        f"{BASE}/business-entities",
        json={"business_type": "individual", "nickname": "Main", "city": "Lahore"},
        headers=await _admin_headers(db_session, admin),
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["business_type"] == "individual"
    assert body["is_active"] is True
    entity_id = body["id"]

    resp = await client.get(f"{BASE}/business-entities", headers=await _admin_headers(db_session, admin))
    assert resp.status_code == 200
    assert len(resp.json()) == 1

    resp = await client.get(f"{BASE}/business-entities/{entity_id}", headers=await _admin_headers(db_session, admin))
    assert resp.status_code == 200
    assert resp.json()["nickname"] == "Main"

    resp = await client.patch(
        f"{BASE}/business-entities/{entity_id}",
        json={"nickname": "Renamed"},
        headers=await _admin_headers(db_session, admin),
    )
    assert resp.status_code == 200
    assert resp.json()["nickname"] == "Renamed"

    resp = await client.post(
        f"{BASE}/business-entities/{entity_id}/archive", headers=await _admin_headers(db_session, admin)
    )
    assert resp.status_code == 200
    assert resp.json()["is_archive"] is True

    resp = await client.get(f"{BASE}/business-entities", headers=await _admin_headers(db_session, admin))
    assert resp.status_code == 404
    assert resp.json()["detail"] == "Business entity not found."


async def test_create_entity_invalid_business_type_422(client, db_session, admin):
    resp = await client.post(
        f"{BASE}/business-entities",
        json={"business_type": "bogus"},
        headers=await _admin_headers(db_session, admin),
    )
    assert resp.status_code == 422


async def test_get_entity_missing_404(client, db_session, admin):
    resp = await client.get(f"{BASE}/business-entities/99999", headers=await _admin_headers(db_session, admin))
    assert resp.status_code == 404
    assert resp.json()["detail"] == "entity not found."


async def test_update_entity_missing_404(client, db_session, admin):
    resp = await client.patch(
        f"{BASE}/business-entities/99999", json={"nickname": "x"}, headers=await _admin_headers(db_session, admin)
    )
    assert resp.status_code == 404
    assert resp.json()["detail"] == "Entity not found to update."


async def test_archive_entity_missing_pins_missing_raise_bug(client, db_session, admin):
    """POST /business-entities/99999/archive 500s: the route builds but never
    ``raise``s the 404 HTTPException (app/modules/settings/general/router.py), so
    the HTTPException object is returned and response validation fails. Pinned so
    the bug stays visible."""
    with pytest.raises(ResponseValidationError):
        await client.post(
            f"{BASE}/business-entities/99999/archive", headers=await _admin_headers(db_session, admin)
        )


async def test_get_store_brand_defaults(client, db_session, admin):
    resp = await client.get(f"{BASE}/store-brand", headers=await _admin_headers(db_session, admin))
    assert resp.status_code == 200
    assert resp.json()["id"] == 1


async def test_update_store_brand(client, db_session, admin):
    resp = await client.patch(
        f"{BASE}/store-brand",
        json={"slogan": "Handmade", "primary_color": "#8B5A2B"},
        headers=await _admin_headers(db_session, admin),
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["slogan"] == "Handmade"
    assert body["primary_color"] == "#8B5A2B"
