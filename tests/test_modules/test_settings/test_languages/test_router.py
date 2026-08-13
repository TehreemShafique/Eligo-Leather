"""Tests for app.modules.settings.languages.router"""

from app.core.security import create_access_token, decode_access_token
from app.modules.settings.account.model import UserSession

BASE = "/api/v1/settings/languages"


async def _admin_headers(db_session, admin):
    token = create_access_token({"sub": admin.email})
    jti = decode_access_token(token)["jti"]
    db_session.add(UserSession(user_id=admin.id, token_id=jti))
    await db_session.commit()
    return {"Authorization": f"Bearer {token}"}


async def test_routes_require_auth(client):
    assert (await client.get(f"{BASE}")).status_code == 401
    assert (await client.get(f"{BASE}/available")).status_code == 401
    assert (await client.post(f"{BASE}/add", json={"language_code": "ur"})).status_code == 401
    assert (await client.post(f"{BASE}/seed")).status_code == 401


async def test_routes_require_admin(client, auth_headers):
    resp = await client.get(f"{BASE}", headers=auth_headers)
    assert resp.status_code == 404
    assert resp.json()["detail"] == "User is Not admin"


async def test_seed_languages(client, db_session, admin):
    resp = await client.post(f"{BASE}/seed", headers=await _admin_headers(db_session, admin))
    assert resp.status_code == 204

    resp = await client.get(f"{BASE}", headers=await _admin_headers(db_session, admin))
    assert resp.status_code == 200
    body = resp.json()
    assert len(body) == 1
    assert body[0]["language_code"] == "en"
    assert body[0]["is_default"] is True
    assert body[0]["status"] == "published"


async def test_list_available_languages(client, db_session, admin):
    resp = await client.get(f"{BASE}/available", headers=await _admin_headers(db_session, admin))
    assert resp.status_code == 200
    codes = [lang["code"] for lang in resp.json()]
    assert "en" in codes
    assert "ur" in codes


async def test_add_language(client, db_session, admin):
    resp = await client.post(
        f"{BASE}/add", json={"language_code": "ur"}, headers=await _admin_headers(db_session, admin)
    )
    assert resp.status_code == 201
    body = resp.json()
    assert body["language_code"] == "ur"
    assert body["language_name"] == "Urdu"
    assert body["status"] == "published"
    assert body["is_default"] is False


async def test_add_language_invalid_code_400(client, db_session, admin):
    resp = await client.post(
        f"{BASE}/add", json={"language_code": "xx"}, headers=await _admin_headers(db_session, admin)
    )
    assert resp.status_code == 400
    assert "not a supported language code" in resp.json()["detail"]


async def test_add_language_duplicate_400(client, db_session, admin):
    await client.post(f"{BASE}/seed", headers=await _admin_headers(db_session, admin))
    resp = await client.post(
        f"{BASE}/add", json={"language_code": "en"}, headers=await _admin_headers(db_session, admin)
    )
    assert resp.status_code == 400
    assert "already added" in resp.json()["detail"]


async def test_add_language_invalid_body_422(client, db_session, admin):
    resp = await client.post(
        f"{BASE}/add", json={}, headers=await _admin_headers(db_session, admin)
    )
    assert resp.status_code == 422


async def test_get_language(client, db_session, admin):
    await client.post(f"{BASE}/seed", headers=await _admin_headers(db_session, admin))
    lang_id = (await client.get(f"{BASE}", headers=await _admin_headers(db_session, admin))).json()[0]["id"]

    resp = await client.get(f"{BASE}/{lang_id}", headers=await _admin_headers(db_session, admin))
    assert resp.status_code == 200
    assert resp.json()["language_code"] == "en"


async def test_get_language_missing_404(client, db_session, admin):
    resp = await client.get(f"{BASE}/99999", headers=await _admin_headers(db_session, admin))
    assert resp.status_code == 404
    assert resp.json()["detail"] == "Language not found"


async def test_update_language(client, db_session, admin):
    await client.post(f"{BASE}/add", json={"language_code": "ur"}, headers=await _admin_headers(db_session, admin))
    lang_id = (await client.get(f"{BASE}", headers=await _admin_headers(db_session, admin))).json()[0]["id"]

    resp = await client.patch(
        f"{BASE}/{lang_id}",
        json={"language_name": "Urdu (Pakistan)"},
        headers=await _admin_headers(db_session, admin),
    )
    assert resp.status_code == 200
    assert resp.json()["language_name"] == "Urdu (Pakistan)"


async def test_update_language_missing_404(client, db_session, admin):
    resp = await client.patch(
        f"{BASE}/99999", json={"language_name": "x"}, headers=await _admin_headers(db_session, admin)
    )
    assert resp.status_code == 404
    assert resp.json()["detail"] == "Language not found"


async def test_set_default_language(client, db_session, admin):
    await client.post(f"{BASE}/seed", headers=await _admin_headers(db_session, admin))
    await client.post(f"{BASE}/add", json={"language_code": "ur"}, headers=await _admin_headers(db_session, admin))
    body = (await client.get(f"{BASE}", headers=await _admin_headers(db_session, admin))).json()
    urdu_id = next(lang["id"] for lang in body if lang["language_code"] == "ur")

    resp = await client.post(f"{BASE}/{urdu_id}/set-default", headers=await _admin_headers(db_session, admin))
    assert resp.status_code == 200
    assert resp.json()["is_default"] is True

    resp = await client.get(f"{BASE}", headers=await _admin_headers(db_session, admin))
    assert [lang["language_code"] for lang in resp.json()] == ["ur", "en"]


async def test_set_default_language_missing_404(client, db_session, admin):
    resp = await client.post(f"{BASE}/99999/set-default", headers=await _admin_headers(db_session, admin))
    assert resp.status_code == 404
    assert resp.json()["detail"] == "Language not found"


async def test_publish_and_unpublish_language(client, db_session, admin):
    await client.post(f"{BASE}/add", json={"language_code": "ur"}, headers=await _admin_headers(db_session, admin))
    body = (await client.get(f"{BASE}", headers=await _admin_headers(db_session, admin))).json()
    urdu_id = next(lang["id"] for lang in body if lang["language_code"] == "ur")

    resp = await client.post(f"{BASE}/{urdu_id}/unpublish", headers=await _admin_headers(db_session, admin))
    assert resp.status_code == 200
    assert resp.json()["status"] == "unpublished"

    resp = await client.post(f"{BASE}/{urdu_id}/publish", headers=await _admin_headers(db_session, admin))
    assert resp.status_code == 200
    assert resp.json()["status"] == "published"


async def test_unpublish_default_language_400(client, db_session, admin):
    await client.post(f"{BASE}/seed", headers=await _admin_headers(db_session, admin))
    en_id = (await client.get(f"{BASE}", headers=await _admin_headers(db_session, admin))).json()[0]["id"]

    resp = await client.post(f"{BASE}/{en_id}/unpublish", headers=await _admin_headers(db_session, admin))
    assert resp.status_code == 400
    assert resp.json()["detail"] == "The default language cannot be unpublished"


async def test_delete_language(client, db_session, admin):
    await client.post(f"{BASE}/add", json={"language_code": "ur"}, headers=await _admin_headers(db_session, admin))
    body = (await client.get(f"{BASE}", headers=await _admin_headers(db_session, admin))).json()
    urdu_id = next(lang["id"] for lang in body if lang["language_code"] == "ur")

    resp = await client.delete(f"{BASE}/{urdu_id}", headers=await _admin_headers(db_session, admin))
    assert resp.status_code == 204

    resp = await client.get(f"{BASE}/{urdu_id}", headers=await _admin_headers(db_session, admin))
    assert resp.status_code == 404


async def test_delete_default_language_400(client, db_session, admin):
    await client.post(f"{BASE}/seed", headers=await _admin_headers(db_session, admin))
    en_id = (await client.get(f"{BASE}", headers=await _admin_headers(db_session, admin))).json()[0]["id"]

    resp = await client.delete(f"{BASE}/{en_id}", headers=await _admin_headers(db_session, admin))
    assert resp.status_code == 400
    assert resp.json()["detail"] == "The default language cannot be deleted"


async def test_delete_language_missing_404(client, db_session, admin):
    resp = await client.delete(f"{BASE}/99999", headers=await _admin_headers(db_session, admin))
    assert resp.status_code == 404
    assert resp.json()["detail"] == "Language not found"
