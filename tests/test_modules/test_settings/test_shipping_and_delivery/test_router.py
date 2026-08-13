"""Tests for app.modules.settings.shipping_and_delivery.router"""

from datetime import datetime, timezone

import pytest

import app.core.dependencies as dependencies
from app.modules.settings.shipping_and_delivery import service


@pytest.fixture(autouse=True)
def _naive_utc_now(monkeypatch):
    """SQLite drops timezone info, so the 2nd admin request of a test reads
    ``UserSession.last_seen_at`` back as naive and get_current_user raises
    ``TypeError`` subtracting an aware ``now``. Make ``now`` naive too."""

    class _NaiveDatetime(datetime):
        @classmethod
        def now(cls, tz=None):
            return datetime.now(timezone.utc).replace(tzinfo=None)

    monkeypatch.setattr(dependencies, "datetime", _NaiveDatetime)


# ---------------------------------------------------------------------------
# Auth
# ---------------------------------------------------------------------------

async def test_admin_routes_require_auth(client):
    resp = await client.get("/api/v1/settings/shipping-and-delivery/settings")
    assert resp.status_code in (401, 403)


async def test_admin_routes_reject_non_admin(client, auth_headers):
    resp = await client.get("/api/v1/settings/shipping-and-delivery/settings", headers=auth_headers)
    assert resp.status_code == 404


# ---------------------------------------------------------------------------
# Settings
# ---------------------------------------------------------------------------

async def test_get_settings_defaults(client, admin_headers):
    resp = await client.get("/api/v1/settings/shipping-and-delivery/settings", headers=admin_headers)
    assert resp.status_code == 200
    body = resp.json()
    assert body["id"] == 1
    assert body["routing_strategy"] == "primary_stock_first"
    assert body["allow_split_shipments"] is True


async def test_update_settings(client, admin_headers):
    resp = await client.patch(
        "/api/v1/settings/shipping-and-delivery/settings",
        json={"sender_name": "Eligo Leather", "allow_split_shipments": False},
        headers=admin_headers,
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["sender_name"] == "Eligo Leather"
    assert body["allow_split_shipments"] is False


async def test_update_settings_invalid_strategy_422(client, admin_headers):
    resp = await client.patch(
        "/api/v1/settings/shipping-and-delivery/settings",
        json={"routing_strategy": "bogus"},
        headers=admin_headers,
    )
    assert resp.status_code == 422


# ---------------------------------------------------------------------------
# Seed
# ---------------------------------------------------------------------------

async def test_seed_defaults(client, admin_headers):
    resp = await client.post("/api/v1/settings/shipping-and-delivery/seed", headers=admin_headers)
    assert resp.status_code == 204

    resp = await client.get("/api/v1/settings/shipping-and-delivery/carriers", headers=admin_headers)
    assert resp.status_code == 200
    assert len(resp.json()) == len(service.DEFAULT_CARRIERS)


# ---------------------------------------------------------------------------
# Carriers
# ---------------------------------------------------------------------------

async def test_carriers_full_crud(client, admin_headers):
    resp = await client.post(
        "/api/v1/settings/shipping-and-delivery/carriers",
        json={"name": "TCS", "code": "tcs"},
        headers=admin_headers,
    )
    assert resp.status_code == 201
    body = resp.json()
    assert body["name"] == "TCS"
    assert body["code"] == "tcs"
    assert body["is_active"] is True
    carrier_id = body["id"]

    resp = await client.get("/api/v1/settings/shipping-and-delivery/carriers", headers=admin_headers)
    assert resp.status_code == 200
    assert len(resp.json()) == 1

    resp = await client.get(f"/api/v1/settings/shipping-and-delivery/carriers/{carrier_id}", headers=admin_headers)
    assert resp.status_code == 200
    assert resp.json()["name"] == "TCS"

    resp = await client.patch(
        f"/api/v1/settings/shipping-and-delivery/carriers/{carrier_id}",
        json={"name": "TCS Express"},
        headers=admin_headers,
    )
    assert resp.status_code == 200
    assert resp.json()["name"] == "TCS Express"

    resp = await client.delete(f"/api/v1/settings/shipping-and-delivery/carriers/{carrier_id}", headers=admin_headers)
    assert resp.status_code == 204


async def test_carriers_create_invalid_body_422(client, admin_headers):
    resp = await client.post("/api/v1/settings/shipping-and-delivery/carriers", json={}, headers=admin_headers)
    assert resp.status_code == 422


async def test_carriers_missing_404(client, admin_headers):
    resp = await client.get("/api/v1/settings/shipping-and-delivery/carriers/99999", headers=admin_headers)
    assert resp.status_code == 404
    assert resp.json()["detail"] == "Carrier not found"

    resp = await client.patch("/api/v1/settings/shipping-and-delivery/carriers/99999", json={"name": "x"}, headers=admin_headers)
    assert resp.status_code == 404

    resp = await client.delete("/api/v1/settings/shipping-and-delivery/carriers/99999", headers=admin_headers)
    assert resp.status_code == 404


async def test_carriers_list_filters_inactive(client, admin_headers):
    resp = await client.post(
        "/api/v1/settings/shipping-and-delivery/carriers",
        json={"name": "TCS", "code": "tcs"},
        headers=admin_headers,
    )
    carrier_id = resp.json()["id"]
    await client.patch(
        f"/api/v1/settings/shipping-and-delivery/carriers/{carrier_id}",
        json={"is_active": False},
        headers=admin_headers,
    )

    resp = await client.get("/api/v1/settings/shipping-and-delivery/carriers", headers=admin_headers)
    assert resp.status_code == 200
    assert resp.json() == []

    resp = await client.get(
        "/api/v1/settings/shipping-and-delivery/carriers",
        params={"include_inactive": "true"},
        headers=admin_headers,
    )
    assert resp.status_code == 200
    assert len(resp.json()) == 1


# ---------------------------------------------------------------------------
# Profiles
# ---------------------------------------------------------------------------

async def test_profiles_full_crud(client, admin_headers):
    resp = await client.post(
        "/api/v1/settings/shipping-and-delivery/profiles",
        json={"name": "Domestic", "description": "PK only"},
        headers=admin_headers,
    )
    assert resp.status_code == 201
    body = resp.json()
    assert body["name"] == "Domestic"
    assert body["is_active"] is True
    profile_id = body["id"]

    resp = await client.get("/api/v1/settings/shipping-and-delivery/profiles", headers=admin_headers)
    assert resp.status_code == 200
    assert len(resp.json()) == 1

    resp = await client.get(f"/api/v1/settings/shipping-and-delivery/profiles/{profile_id}", headers=admin_headers)
    assert resp.status_code == 200
    assert resp.json()["name"] == "Domestic"

    resp = await client.patch(
        f"/api/v1/settings/shipping-and-delivery/profiles/{profile_id}",
        json={"name": "Local"},
        headers=admin_headers,
    )
    assert resp.status_code == 200
    assert resp.json()["name"] == "Local"

    resp = await client.delete(f"/api/v1/settings/shipping-and-delivery/profiles/{profile_id}", headers=admin_headers)
    assert resp.status_code == 204


async def test_profiles_create_invalid_body_422(client, admin_headers):
    resp = await client.post("/api/v1/settings/shipping-and-delivery/profiles", json={}, headers=admin_headers)
    assert resp.status_code == 422


async def test_profiles_missing_404(client, admin_headers):
    resp = await client.get("/api/v1/settings/shipping-and-delivery/profiles/99999", headers=admin_headers)
    assert resp.status_code == 404
    assert resp.json()["detail"] == "Shipping profile not found"

    resp = await client.patch("/api/v1/settings/shipping-and-delivery/profiles/99999", json={"name": "x"}, headers=admin_headers)
    assert resp.status_code == 404

    resp = await client.delete("/api/v1/settings/shipping-and-delivery/profiles/99999", headers=admin_headers)
    assert resp.status_code == 404


# ---------------------------------------------------------------------------
# Zones
# ---------------------------------------------------------------------------

async def test_zones_full_crud(client, admin_headers):
    profile = await client.post(
        "/api/v1/settings/shipping-and-delivery/profiles",
        json={"name": "Domestic"},
        headers=admin_headers,
    )
    profile_id = profile.json()["id"]

    resp = await client.post(
        f"/api/v1/settings/shipping-and-delivery/profiles/{profile_id}/zones",
        json={"name": "PK", "countries": ["PK"]},
        headers=admin_headers,
    )
    assert resp.status_code == 201
    body = resp.json()
    assert body["name"] == "PK"
    assert body["countries"] == ["PK"]
    assert body["profile_id"] == profile_id
    zone_id = body["id"]

    resp = await client.get(f"/api/v1/settings/shipping-and-delivery/zones/{zone_id}", headers=admin_headers)
    assert resp.status_code == 200
    assert resp.json()["name"] == "PK"

    resp = await client.patch(
        f"/api/v1/settings/shipping-and-delivery/zones/{zone_id}",
        json={"name": "Pakistan"},
        headers=admin_headers,
    )
    assert resp.status_code == 200
    assert resp.json()["name"] == "Pakistan"

    resp = await client.delete(f"/api/v1/settings/shipping-and-delivery/zones/{zone_id}", headers=admin_headers)
    assert resp.status_code == 204


async def test_zones_create_missing_profile_404(client, admin_headers):
    resp = await client.post(
        "/api/v1/settings/shipping-and-delivery/profiles/99999/zones",
        json={"name": "PK"},
        headers=admin_headers,
    )
    assert resp.status_code == 404
    assert resp.json()["detail"] == "Shipping profile not found"


async def test_zones_create_invalid_body_422(client, admin_headers):
    resp = await client.post(
        "/api/v1/settings/shipping-and-delivery/profiles/1/zones",
        json={},
        headers=admin_headers,
    )
    assert resp.status_code == 422


async def test_zones_missing_404(client, admin_headers):
    resp = await client.get("/api/v1/settings/shipping-and-delivery/zones/99999", headers=admin_headers)
    assert resp.status_code == 404
    assert resp.json()["detail"] == "Shipping zone not found"

    resp = await client.patch("/api/v1/settings/shipping-and-delivery/zones/99999", json={"name": "x"}, headers=admin_headers)
    assert resp.status_code == 404

    resp = await client.delete("/api/v1/settings/shipping-and-delivery/zones/99999", headers=admin_headers)
    assert resp.status_code == 404


# ---------------------------------------------------------------------------
# Rates
# ---------------------------------------------------------------------------

async def test_rates_full_crud(client, admin_headers):
    profile = await client.post(
        "/api/v1/settings/shipping-and-delivery/profiles",
        json={"name": "Domestic"},
        headers=admin_headers,
    )
    profile_id = profile.json()["id"]
    zone = await client.post(
        f"/api/v1/settings/shipping-and-delivery/profiles/{profile_id}/zones",
        json={"name": "PK"},
        headers=admin_headers,
    )
    zone_id = zone.json()["id"]

    resp = await client.post(
        f"/api/v1/settings/shipping-and-delivery/zones/{zone_id}/rates",
        json={"title": "Standard", "amount": 250},
        headers=admin_headers,
    )
    assert resp.status_code == 201
    body = resp.json()
    assert body["title"] == "Standard"
    assert body["rate_type"] == "flat"
    assert body["is_active"] is True
    rate_id = body["id"]

    resp = await client.get(f"/api/v1/settings/shipping-and-delivery/rates/{rate_id}", headers=admin_headers)
    assert resp.status_code == 200
    assert resp.json()["title"] == "Standard"

    resp = await client.patch(
        f"/api/v1/settings/shipping-and-delivery/rates/{rate_id}",
        json={"amount": 300, "is_active": False},
        headers=admin_headers,
    )
    assert resp.status_code == 200
    assert resp.json()["is_active"] is False

    resp = await client.delete(f"/api/v1/settings/shipping-and-delivery/rates/{rate_id}", headers=admin_headers)
    assert resp.status_code == 204


async def test_rates_create_missing_zone_404(client, admin_headers):
    resp = await client.post(
        "/api/v1/settings/shipping-and-delivery/zones/99999/rates",
        json={"title": "Standard"},
        headers=admin_headers,
    )
    assert resp.status_code == 404
    assert resp.json()["detail"] == "Shipping zone not found"


async def test_rates_create_invalid_body_422(client, admin_headers):
    resp = await client.post(
        "/api/v1/settings/shipping-and-delivery/zones/1/rates",
        json={},
        headers=admin_headers,
    )
    assert resp.status_code == 422


async def test_rates_missing_404(client, admin_headers):
    resp = await client.get("/api/v1/settings/shipping-and-delivery/rates/99999", headers=admin_headers)
    assert resp.status_code == 404
    assert resp.json()["detail"] == "Shipping rate not found"

    resp = await client.patch("/api/v1/settings/shipping-and-delivery/rates/99999", json={"amount": 10}, headers=admin_headers)
    assert resp.status_code == 404

    resp = await client.delete("/api/v1/settings/shipping-and-delivery/rates/99999", headers=admin_headers)
    assert resp.status_code == 404


# ---------------------------------------------------------------------------
# Locations
# ---------------------------------------------------------------------------

async def test_locations_full_crud(client, admin_headers):
    resp = await client.post(
        "/api/v1/settings/shipping-and-delivery/locations",
        json={"name": "Warehouse A", "city": "Lahore", "is_primary": True},
        headers=admin_headers,
    )
    assert resp.status_code == 201
    body = resp.json()
    assert body["name"] == "Warehouse A"
    assert body["is_active"] is True
    assert body["is_primary"] is True
    location_id = body["id"]

    resp = await client.get("/api/v1/settings/shipping-and-delivery/locations", headers=admin_headers)
    assert resp.status_code == 200
    assert len(resp.json()) == 1

    resp = await client.get(f"/api/v1/settings/shipping-and-delivery/locations/{location_id}", headers=admin_headers)
    assert resp.status_code == 200
    assert resp.json()["name"] == "Warehouse A"

    resp = await client.patch(
        f"/api/v1/settings/shipping-and-delivery/locations/{location_id}",
        json={"name": "Warehouse B"},
        headers=admin_headers,
    )
    assert resp.status_code == 200
    assert resp.json()["name"] == "Warehouse B"

    resp = await client.delete(f"/api/v1/settings/shipping-and-delivery/locations/{location_id}", headers=admin_headers)
    assert resp.status_code == 204


async def test_locations_create_invalid_body_422(client, admin_headers):
    resp = await client.post("/api/v1/settings/shipping-and-delivery/locations", json={}, headers=admin_headers)
    assert resp.status_code == 422


async def test_locations_missing_404(client, admin_headers):
    resp = await client.get("/api/v1/settings/shipping-and-delivery/locations/99999", headers=admin_headers)
    assert resp.status_code == 404
    assert resp.json()["detail"] == "Fulfillment location not found"

    resp = await client.patch("/api/v1/settings/shipping-and-delivery/locations/99999", json={"name": "x"}, headers=admin_headers)
    assert resp.status_code == 404

    resp = await client.delete("/api/v1/settings/shipping-and-delivery/locations/99999", headers=admin_headers)
    assert resp.status_code == 404


# ---------------------------------------------------------------------------
# Packages
# ---------------------------------------------------------------------------

async def test_packages_full_crud(client, admin_headers):
    resp = await client.post(
        "/api/v1/settings/shipping-and-delivery/packages",
        json={"name": "Small box", "length_cm": 10, "width_cm": 10, "height_cm": 10, "weight_kg": 0.5},
        headers=admin_headers,
    )
    assert resp.status_code == 201
    body = resp.json()
    assert body["name"] == "Small box"
    assert body["is_default"] is False
    package_id = body["id"]

    resp = await client.get("/api/v1/settings/shipping-and-delivery/packages", headers=admin_headers)
    assert resp.status_code == 200
    assert len(resp.json()) == 1

    resp = await client.get(f"/api/v1/settings/shipping-and-delivery/packages/{package_id}", headers=admin_headers)
    assert resp.status_code == 200
    assert resp.json()["name"] == "Small box"

    resp = await client.patch(
        f"/api/v1/settings/shipping-and-delivery/packages/{package_id}",
        json={"name": "Large box", "is_default": True},
        headers=admin_headers,
    )
    assert resp.status_code == 200
    assert resp.json()["name"] == "Large box"
    assert resp.json()["is_default"] is True

    resp = await client.delete(f"/api/v1/settings/shipping-and-delivery/packages/{package_id}", headers=admin_headers)
    assert resp.status_code == 204


async def test_packages_create_invalid_body_422(client, admin_headers):
    resp = await client.post("/api/v1/settings/shipping-and-delivery/packages", json={}, headers=admin_headers)
    assert resp.status_code == 422


async def test_packages_create_negative_dimension_422(client, admin_headers):
    resp = await client.post(
        "/api/v1/settings/shipping-and-delivery/packages",
        json={"name": "Bad", "length_cm": -1, "width_cm": 10, "height_cm": 10, "weight_kg": 0.5},
        headers=admin_headers,
    )
    assert resp.status_code == 422


async def test_packages_missing_404(client, admin_headers):
    resp = await client.get("/api/v1/settings/shipping-and-delivery/packages/99999", headers=admin_headers)
    assert resp.status_code == 404
    assert resp.json()["detail"] == "Package not found"

    resp = await client.patch("/api/v1/settings/shipping-and-delivery/packages/99999", json={"name": "x"}, headers=admin_headers)
    assert resp.status_code == 404

    resp = await client.delete("/api/v1/settings/shipping-and-delivery/packages/99999", headers=admin_headers)
    assert resp.status_code == 404
