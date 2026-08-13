"""Tests for app.modules.settings.locations.router"""

from app.core.security import create_access_token, decode_access_token
from app.modules.settings.account.model import UserSession
from app.modules.settings.locations.service import LOCATION_LIMIT

BASE = "/api/v1/settings/locations"


async def _admin_headers(db_session, admin):
    token = create_access_token({"sub": admin.email})
    jti = decode_access_token(token)["jti"]
    db_session.add(UserSession(user_id=admin.id, token_id=jti))
    await db_session.commit()
    return {"Authorization": f"Bearer {token}"}


async def test_routes_require_auth(client):
    assert (await client.get(f"{BASE}/summary")).status_code == 401
    assert (await client.get(f"{BASE}")).status_code == 401
    assert (await client.post(f"{BASE}", json={"name": "Main"})).status_code == 401


async def test_routes_require_admin(client, auth_headers):
    resp = await client.get(f"{BASE}/summary", headers=auth_headers)
    assert resp.status_code == 404
    assert resp.json()["detail"] == "User is Not admin"


async def test_summary_empty(client, db_session, admin):
    resp = await client.get(f"{BASE}/summary", headers=await _admin_headers(db_session, admin))
    assert resp.status_code == 200
    body = resp.json()
    assert body["total"] == 0
    assert body["active"] == 0
    assert body["inactive"] == 0
    assert body["limit"] == LOCATION_LIMIT
    assert body["default_location"] is None


async def test_create_location(client, db_session, admin):
    resp = await client.post(f"{BASE}", json={"name": "Main"}, headers=await _admin_headers(db_session, admin))
    assert resp.status_code == 201
    body = resp.json()
    assert body["name"] == "Main"
    assert body["country"] == "Pakistan"
    assert body["is_active"] is True
    assert body["is_primary"] is False


async def test_create_location_invalid_422(client, db_session, admin):
    resp = await client.post(f"{BASE}", json={}, headers=await _admin_headers(db_session, admin))
    assert resp.status_code == 422


async def test_list_locations(client, db_session, admin):
    await client.post(f"{BASE}", json={"name": "Main"}, headers=await _admin_headers(db_session, admin))

    resp = await client.get(f"{BASE}", headers=await _admin_headers(db_session, admin))
    assert resp.status_code == 200
    body = resp.json()
    assert len(body) == 1
    assert body[0]["name"] == "Main"


async def test_list_locations_status_and_search(client, db_session, admin):
    await client.post(
        f"{BASE}", json={"name": "Lahore Hub", "city": "Lahore"}, headers=await _admin_headers(db_session, admin)
    )
    resp = await client.post(
        f"{BASE}", json={"name": "Karachi Hub", "city": "Karachi"}, headers=await _admin_headers(db_session, admin)
    )
    second_id = resp.json()["id"]
    await client.patch(
        f"{BASE}/{second_id}", json={"is_active": False}, headers=await _admin_headers(db_session, admin)
    )

    resp = await client.get(f"{BASE}", params={"status": "active"}, headers=await _admin_headers(db_session, admin))
    assert len(resp.json()) == 1

    resp = await client.get(f"{BASE}", params={"search": "lahore"}, headers=await _admin_headers(db_session, admin))
    assert len(resp.json()) == 1

    resp = await client.get(
        f"{BASE}", params={"sort_by": "name", "order": "desc"}, headers=await _admin_headers(db_session, admin)
    )
    assert [loc["name"] for loc in resp.json()] == ["Lahore Hub", "Karachi Hub"]


async def test_get_location(client, db_session, admin):
    created = await client.post(f"{BASE}", json={"name": "Main"}, headers=await _admin_headers(db_session, admin))
    loc_id = created.json()["id"]

    resp = await client.get(f"{BASE}/{loc_id}", headers=await _admin_headers(db_session, admin))
    assert resp.status_code == 200
    assert resp.json()["id"] == loc_id


async def test_get_location_missing_404(client, db_session, admin):
    resp = await client.get(f"{BASE}/99999", headers=await _admin_headers(db_session, admin))
    assert resp.status_code == 404
    assert resp.json()["detail"] == "Location not found"


async def test_get_default_missing_404(client, db_session, admin):
    resp = await client.get(f"{BASE}/default", headers=await _admin_headers(db_session, admin))
    assert resp.status_code == 404
    assert resp.json()["detail"] == "No default location set"


async def test_set_default_location(client, db_session, admin):
    first = (await client.post(f"{BASE}", json={"name": "A"}, headers=await _admin_headers(db_session, admin))).json()
    second = (await client.post(f"{BASE}", json={"name": "B"}, headers=await _admin_headers(db_session, admin))).json()

    resp = await client.post(f"{BASE}/{first['id']}/default", headers=await _admin_headers(db_session, admin))
    assert resp.status_code == 200
    assert resp.json()["is_primary"] is True

    await client.post(f"{BASE}/{second['id']}/default", headers=await _admin_headers(db_session, admin))

    resp = await client.get(f"{BASE}/default", headers=await _admin_headers(db_session, admin))
    assert resp.status_code == 200
    assert resp.json()["id"] == second["id"]


async def test_set_default_location_missing_404(client, db_session, admin):
    resp = await client.post(f"{BASE}/99999/default", headers=await _admin_headers(db_session, admin))
    assert resp.status_code == 404
    assert resp.json()["detail"] == "Location not found"


async def test_update_location(client, db_session, admin):
    created = (await client.post(f"{BASE}", json={"name": "Main"}, headers=await _admin_headers(db_session, admin))).json()

    resp = await client.patch(
        f"{BASE}/{created['id']}", json={"city": "Lahore"}, headers=await _admin_headers(db_session, admin)
    )
    assert resp.status_code == 200
    assert resp.json()["city"] == "Lahore"


async def test_update_location_missing_404(client, db_session, admin):
    resp = await client.patch(
        f"{BASE}/99999", json={"city": "x"}, headers=await _admin_headers(db_session, admin)
    )
    assert resp.status_code == 404
    assert resp.json()["detail"] == "Location not found"


async def test_delete_location(client, db_session, admin):
    created = (await client.post(f"{BASE}", json={"name": "Main"}, headers=await _admin_headers(db_session, admin))).json()

    resp = await client.delete(f"{BASE}/{created['id']}", headers=await _admin_headers(db_session, admin))
    assert resp.status_code == 204

    resp = await client.get(f"{BASE}/{created['id']}", headers=await _admin_headers(db_session, admin))
    assert resp.status_code == 404


async def test_delete_location_missing_404(client, db_session, admin):
    resp = await client.delete(f"{BASE}/99999", headers=await _admin_headers(db_session, admin))
    assert resp.status_code == 404
    assert resp.json()["detail"] == "Location not found"
