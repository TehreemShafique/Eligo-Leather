"""Tests for app.modules.settings.customer_accounts.router"""

BASE = "/api/v1/settings/customer-accounts"


async def test_routes_require_auth(client):
    assert (await client.get(f"{BASE}/settings")).status_code == 401
    assert (await client.patch(f"{BASE}/settings", json={"allow_registration": False})).status_code == 401
    assert (await client.post(f"{BASE}/seed")).status_code == 401


async def test_routes_require_admin(client, auth_headers):
    resp = await client.get(f"{BASE}/settings", headers=auth_headers)
    assert resp.status_code == 403
    assert resp.json()["detail"] == "User is Not admin"


async def test_seed_default_settings(client, admin_headers):
    resp = await client.post(f"{BASE}/seed", headers=admin_headers)
    assert resp.status_code == 204


async def test_get_settings_returns_defaults(client, admin_headers):
    resp = await client.get(f"{BASE}/settings", headers=admin_headers)
    assert resp.status_code == 200
    body = resp.json()
    assert body["id"] == 1
    assert body["show_sign_in_links"] is True
    assert body["session_duration_days"] == 30
    assert body["return_window_days"] == 14
    assert body["account_domain"] == "https://eligoleather.com/account"


async def test_update_settings(client, admin_headers):
    resp = await client.patch(
        f"{BASE}/settings",
        json={"show_sign_in_links": False, "session_duration_days": 90},
        headers=admin_headers,
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["show_sign_in_links"] is False
    assert body["session_duration_days"] == 90


async def test_update_settings_rejects_zero_session_duration(client, admin_headers):
    resp = await client.patch(f"{BASE}/settings", json={"session_duration_days": 0}, headers=admin_headers)
    assert resp.status_code == 422


async def test_update_settings_rejects_zero_return_window(client, admin_headers):
    resp = await client.patch(f"{BASE}/settings", json={"return_window_days": 0}, headers=admin_headers)
    assert resp.status_code == 422


async def test_update_settings_rejects_domain_without_protocol(client, admin_headers):
    resp = await client.patch(f"{BASE}/settings", json={"account_domain": "eligoleather.com"}, headers=admin_headers)
    assert resp.status_code == 422
