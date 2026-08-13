"""Tests for ``app.modules.markets.router``."""

from app.modules.catalog.model import Product


async def _seed_market(client, auth_headers, **overrides):
    data = {
        "name": "United States",
        "country_code": "US",
        "country_name": "United States",
        "currency": "USD",
    }
    data.update(overrides)
    response = await client.post("/api/v1/markets/", headers=auth_headers, json=data)
    assert response.status_code == 201
    return response.json()


async def _seed_catalog(client, auth_headers, market_id):
    response = await client.post(
        "/api/v1/catalogs/",
        headers=auth_headers,
        json={"title": "US Catalog", "market_id": market_id},
    )
    assert response.status_code == 201
    return response.json()


async def _seed_product(db_session, title="Leather Belt"):
    product = Product(title=title)
    db_session.add(product)
    await db_session.commit()
    await db_session.refresh(product)
    return product


async def test_markets_endpoints_require_auth(client):
    assert (await client.get("/api/v1/markets/")).status_code in (401, 403)
    assert (await client.post("/api/v1/markets/", json={})).status_code in (401, 403)
    assert (await client.get("/api/v1/markets/overview")).status_code in (401, 403)
    assert (await client.get("/api/v1/catalogs/")).status_code in (401, 403)
    assert (await client.post("/api/v1/catalogs/", json={})).status_code in (401, 403)
    assert (await client.get("/api/v1/rollouts/")).status_code in (401, 403)
    assert (await client.post("/api/v1/rollouts/", json={})).status_code in (401, 403)


async def test_create_market(client, auth_headers):
    response = await client.post(
        "/api/v1/markets/",
        headers=auth_headers,
        json={
            "name": "United States",
            "country_code": "US",
            "country_name": "United States",
            "currency": "USD",
        },
    )
    assert response.status_code == 201
    body = response.json()
    assert body["name"] == "United States"
    assert body["country_code"] == "US"
    assert body["status"] == "Active"
    assert body["currency"] == "USD"


async def test_list_markets(client, auth_headers):
    await _seed_market(client, auth_headers)
    response = await client.get("/api/v1/markets/", headers=auth_headers)
    assert response.status_code == 200
    assert len(response.json()) == 1
    assert response.json()[0]["name"] == "United States"


async def test_list_markets_filters(client, auth_headers):
    await _seed_market(client, auth_headers)
    await _seed_market(
        client, auth_headers, name="Pakistan", country_code="PK",
        country_name="Pakistan", currency="PKR",
    )
    response = await client.get(
        "/api/v1/markets/?country_code=PK", headers=auth_headers
    )
    assert response.status_code == 200
    body = response.json()
    assert len(body) == 1
    assert body[0]["country_code"] == "PK"


async def test_get_market(client, auth_headers):
    created = await _seed_market(client, auth_headers)
    response = await client.get(
        f"/api/v1/markets/{created['id']}", headers=auth_headers
    )
    assert response.status_code == 200
    assert response.json()["name"] == "United States"


async def test_get_market_missing_404(client, auth_headers):
    response = await client.get("/api/v1/markets/999999", headers=auth_headers)
    assert response.status_code == 404
    assert response.json()["detail"] == "Market not found"


async def test_update_market(client, auth_headers):
    created = await _seed_market(client, auth_headers)
    response = await client.patch(
        f"/api/v1/markets/{created['id']}",
        headers=auth_headers,
        json={"country_code": "GB"},
    )
    assert response.status_code == 200
    assert response.json()["country_code"] == "GB"


async def test_update_market_missing_404(client, auth_headers):
    response = await client.patch(
        "/api/v1/markets/999999", headers=auth_headers, json={"country_code": "GB"}
    )
    assert response.status_code == 404
    assert response.json()["detail"] == "Market not found"


async def test_delete_market(client, auth_headers):
    created = await _seed_market(client, auth_headers)
    response = await client.delete(
        f"/api/v1/markets/{created['id']}", headers=auth_headers
    )
    assert response.status_code == 204
    get_response = await client.get(
        f"/api/v1/markets/{created['id']}", headers=auth_headers
    )
    assert get_response.status_code == 404


async def test_delete_market_missing_404(client, auth_headers):
    response = await client.delete("/api/v1/markets/999999", headers=auth_headers)
    assert response.status_code == 404
    assert response.json()["detail"] == "Market not found"


async def test_create_market_validation_422(client, auth_headers):
    response = await client.post("/api/v1/markets/", headers=auth_headers, json={})
    assert response.status_code == 422


async def test_markets_overview_empty(client, auth_headers):
    response = await client.get("/api/v1/markets/overview", headers=auth_headers)
    assert response.status_code == 200
    body = response.json()
    assert body["total_markets"] == 0
    assert body["active_markets"] == 0
    assert body["draft_markets"] == 0
    assert body["total_catalogs"] == 0
    assert body["total_rollouts"] == 0
    assert body["draft_rollouts"] == 0


async def test_markets_overview_with_data(client, auth_headers):
    await _seed_market(client, auth_headers)
    response = await client.get("/api/v1/markets/overview", headers=auth_headers)
    assert response.status_code == 200
    body = response.json()
    assert body["total_markets"] == 1
    assert body["active_markets"] == 1
    assert body["draft_markets"] == 0


async def test_create_catalog(client, auth_headers):
    market = await _seed_market(client, auth_headers)
    response = await client.post(
        "/api/v1/catalogs/",
        headers=auth_headers,
        json={"title": "US Catalog", "market_id": market["id"]},
    )
    assert response.status_code == 201
    body = response.json()
    assert body["title"] == "US Catalog"
    assert body["market_id"] == market["id"]
    assert body["status"] == "Active"
    assert body["price_currency"] == "PKR"


async def test_list_catalogs(client, auth_headers):
    market = await _seed_market(client, auth_headers)
    await _seed_catalog(client, auth_headers, market["id"])
    response = await client.get("/api/v1/catalogs/", headers=auth_headers)
    assert response.status_code == 200
    assert len(response.json()) == 1
    assert response.json()[0]["title"] == "US Catalog"


async def test_get_catalog(client, auth_headers):
    market = await _seed_market(client, auth_headers)
    catalog = await _seed_catalog(client, auth_headers, market["id"])
    response = await client.get(
        f"/api/v1/catalogs/{catalog['id']}", headers=auth_headers
    )
    assert response.status_code == 200
    assert response.json()["title"] == "US Catalog"
    assert response.json()["products"] == []


async def test_get_catalog_missing_404(client, auth_headers):
    response = await client.get("/api/v1/catalogs/999999", headers=auth_headers)
    assert response.status_code == 404
    assert response.json()["detail"] == "Catalog not found"


async def test_update_catalog(client, auth_headers):
    market = await _seed_market(client, auth_headers)
    catalog = await _seed_catalog(client, auth_headers, market["id"])
    response = await client.patch(
        f"/api/v1/catalogs/{catalog['id']}",
        headers=auth_headers,
        json={"title": "US Catalog v2"},
    )
    assert response.status_code == 200
    assert response.json()["title"] == "US Catalog v2"


async def test_update_catalog_missing_404(client, auth_headers):
    response = await client.patch(
        "/api/v1/catalogs/999999", headers=auth_headers, json={"title": "Nope"}
    )
    assert response.status_code == 404
    assert response.json()["detail"] == "Catalog not found"


async def test_delete_catalog(client, auth_headers):
    market = await _seed_market(client, auth_headers)
    catalog = await _seed_catalog(client, auth_headers, market["id"])
    response = await client.delete(
        f"/api/v1/catalogs/{catalog['id']}", headers=auth_headers
    )
    assert response.status_code == 204
    get_response = await client.get(
        f"/api/v1/catalogs/{catalog['id']}", headers=auth_headers
    )
    assert get_response.status_code == 404


async def test_delete_catalog_missing_404(client, auth_headers):
    response = await client.delete("/api/v1/catalogs/999999", headers=auth_headers)
    assert response.status_code == 404
    assert response.json()["detail"] == "Catalog not found"


async def test_create_catalog_validation_422(client, auth_headers):
    response = await client.post("/api/v1/catalogs/", headers=auth_headers, json={})
    assert response.status_code == 422


async def test_add_catalog_product(client, auth_headers, db_session):
    market = await _seed_market(client, auth_headers)
    catalog = await _seed_catalog(client, auth_headers, market["id"])
    product = await _seed_product(db_session)
    response = await client.post(
        f"/api/v1/catalogs/{catalog['id']}/products",
        headers=auth_headers,
        json={"product_id": product.id},
    )
    assert response.status_code == 201
    body = response.json()
    assert body["product_id"] == product.id
    assert body["catalog_id"] == catalog["id"]
    assert body["included"] is True


async def test_add_catalog_product_missing_catalog_404(client, auth_headers):
    response = await client.post(
        "/api/v1/catalogs/999999/products",
        headers=auth_headers,
        json={"product_id": 1},
    )
    assert response.status_code == 404
    assert response.json()["detail"] == "Catalog not found"


async def test_add_catalog_product_validation_422(client, auth_headers):
    market = await _seed_market(client, auth_headers)
    catalog = await _seed_catalog(client, auth_headers, market["id"])
    response = await client.post(
        f"/api/v1/catalogs/{catalog['id']}/products",
        headers=auth_headers,
        json={},
    )
    assert response.status_code == 422


async def test_list_catalog_products(client, auth_headers, db_session):
    market = await _seed_market(client, auth_headers)
    catalog = await _seed_catalog(client, auth_headers, market["id"])
    product = await _seed_product(db_session)
    await client.post(
        f"/api/v1/catalogs/{catalog['id']}/products",
        headers=auth_headers,
        json={"product_id": product.id},
    )
    response = await client.get(
        f"/api/v1/catalogs/{catalog['id']}/products", headers=auth_headers
    )
    assert response.status_code == 200
    assert len(response.json()) == 1
    assert response.json()[0]["product_id"] == product.id


async def test_list_catalog_products_missing_catalog_404(client, auth_headers):
    response = await client.get(
        "/api/v1/catalogs/999999/products", headers=auth_headers
    )
    assert response.status_code == 404
    assert response.json()["detail"] == "Catalog not found"


async def test_update_catalog_product(client, auth_headers, db_session):
    market = await _seed_market(client, auth_headers)
    catalog = await _seed_catalog(client, auth_headers, market["id"])
    product = await _seed_product(db_session)
    created = await client.post(
        f"/api/v1/catalogs/{catalog['id']}/products",
        headers=auth_headers,
        json={"product_id": product.id},
    )
    cp_id = created.json()["id"]
    response = await client.patch(
        f"/api/v1/catalogs/products/{cp_id}",
        headers=auth_headers,
        json={"included": False},
    )
    assert response.status_code == 200
    assert response.json()["included"] is False


async def test_update_catalog_product_missing_404(client, auth_headers):
    response = await client.patch(
        "/api/v1/catalogs/products/999999",
        headers=auth_headers,
        json={"included": False},
    )
    assert response.status_code == 404
    assert response.json()["detail"] == "Catalog product not found"


async def test_delete_catalog_product(client, auth_headers, db_session):
    market = await _seed_market(client, auth_headers)
    catalog = await _seed_catalog(client, auth_headers, market["id"])
    product = await _seed_product(db_session)
    created = await client.post(
        f"/api/v1/catalogs/{catalog['id']}/products",
        headers=auth_headers,
        json={"product_id": product.id},
    )
    cp_id = created.json()["id"]
    response = await client.delete(
        f"/api/v1/catalogs/products/{cp_id}", headers=auth_headers
    )
    assert response.status_code == 204
    list_response = await client.get(
        f"/api/v1/catalogs/{catalog['id']}/products", headers=auth_headers
    )
    assert list_response.status_code == 200
    assert list_response.json() == []


async def test_delete_catalog_product_missing_404(client, auth_headers):
    response = await client.delete(
        "/api/v1/catalogs/products/999999", headers=auth_headers
    )
    assert response.status_code == 404
    assert response.json()["detail"] == "Catalog product not found"


async def test_create_rollout(client, auth_headers):
    response = await client.post(
        "/api/v1/rollouts/",
        headers=auth_headers,
        json={"name": "Summer rollout"},
    )
    assert response.status_code == 201
    body = response.json()
    assert body["name"] == "Summer rollout"
    assert body["status"] == "Draft"
    assert body["scheduled_at"] is None


async def test_create_rollout_with_changes(client, auth_headers):
    response = await client.post(
        "/api/v1/rollouts/",
        headers=auth_headers,
        json={
            "name": "Summer rollout",
            "changes": [
                {"change_type": "Online store theme", "title": "Theme v2"}
            ],
        },
    )
    assert response.status_code == 201
    body = response.json()
    assert body["name"] == "Summer rollout"
    assert body["status"] == "Draft"


async def test_list_rollouts(client, auth_headers):
    await client.post(
        "/api/v1/rollouts/", headers=auth_headers, json={"name": "Summer rollout"}
    )
    response = await client.get("/api/v1/rollouts/", headers=auth_headers)
    assert response.status_code == 200
    assert len(response.json()) == 1
    assert response.json()[0]["name"] == "Summer rollout"


async def test_get_rollout(client, auth_headers):
    created = await client.post(
        "/api/v1/rollouts/", headers=auth_headers, json={"name": "Summer rollout"}
    )
    rollout_id = created.json()["id"]
    response = await client.get(f"/api/v1/rollouts/{rollout_id}", headers=auth_headers)
    assert response.status_code == 200
    assert response.json()["name"] == "Summer rollout"
    assert response.json()["changes"] == []


async def test_get_rollout_missing_404(client, auth_headers):
    response = await client.get("/api/v1/rollouts/999999", headers=auth_headers)
    assert response.status_code == 404
    assert response.json()["detail"] == "Rollout not found"


async def test_update_rollout(client, auth_headers):
    created = await client.post(
        "/api/v1/rollouts/", headers=auth_headers, json={"name": "Summer rollout"}
    )
    rollout_id = created.json()["id"]
    response = await client.patch(
        f"/api/v1/rollouts/{rollout_id}",
        headers=auth_headers,
        json={"status": "Scheduled"},
    )
    assert response.status_code == 200
    assert response.json()["status"] == "Scheduled"


async def test_update_rollout_missing_404(client, auth_headers):
    response = await client.patch(
        "/api/v1/rollouts/999999", headers=auth_headers, json={"status": "Scheduled"}
    )
    assert response.status_code == 404
    assert response.json()["detail"] == "Rollout not found"


async def test_delete_rollout(client, auth_headers):
    created = await client.post(
        "/api/v1/rollouts/", headers=auth_headers, json={"name": "Summer rollout"}
    )
    rollout_id = created.json()["id"]
    response = await client.delete(f"/api/v1/rollouts/{rollout_id}", headers=auth_headers)
    assert response.status_code == 204
    get_response = await client.get(f"/api/v1/rollouts/{rollout_id}", headers=auth_headers)
    assert get_response.status_code == 404


async def test_delete_rollout_missing_404(client, auth_headers):
    response = await client.delete("/api/v1/rollouts/999999", headers=auth_headers)
    assert response.status_code == 404
    assert response.json()["detail"] == "Rollout not found"


async def test_create_rollout_validation_422(client, auth_headers):
    response = await client.post("/api/v1/rollouts/", headers=auth_headers, json={})
    assert response.status_code == 422


async def test_add_rollout_change(client, auth_headers):
    rollout = await client.post(
        "/api/v1/rollouts/", headers=auth_headers, json={"name": "Summer rollout"}
    )
    rollout_id = rollout.json()["id"]
    response = await client.post(
        f"/api/v1/rollouts/{rollout_id}/changes",
        headers=auth_headers,
        json={"change_type": "Online store theme", "title": "Theme v2"},
    )
    assert response.status_code == 201
    body = response.json()
    assert body["change_type"] == "Online store theme"
    assert body["title"] == "Theme v2"
    assert body["status"] == "Pending"


async def test_add_rollout_change_missing_rollout_404(client, auth_headers):
    response = await client.post(
        "/api/v1/rollouts/999999/changes",
        headers=auth_headers,
        json={"change_type": "Online store theme", "title": "Theme v2"},
    )
    assert response.status_code == 404
    assert response.json()["detail"] == "Rollout not found"


async def test_add_rollout_change_validation_422(client, auth_headers):
    rollout = await client.post(
        "/api/v1/rollouts/", headers=auth_headers, json={"name": "Summer rollout"}
    )
    rollout_id = rollout.json()["id"]
    response = await client.post(
        f"/api/v1/rollouts/{rollout_id}/changes",
        headers=auth_headers,
        json={},
    )
    assert response.status_code == 422


async def test_list_rollout_changes(client, auth_headers):
    rollout = await client.post(
        "/api/v1/rollouts/", headers=auth_headers, json={"name": "Summer rollout"}
    )
    rollout_id = rollout.json()["id"]
    await client.post(
        f"/api/v1/rollouts/{rollout_id}/changes",
        headers=auth_headers,
        json={"change_type": "Online store theme", "title": "Theme v2"},
    )
    response = await client.get(
        f"/api/v1/rollouts/{rollout_id}/changes", headers=auth_headers
    )
    assert response.status_code == 200
    assert len(response.json()) == 1
    assert response.json()[0]["title"] == "Theme v2"


async def test_list_rollout_changes_missing_rollout_404(client, auth_headers):
    response = await client.get(
        "/api/v1/rollouts/999999/changes", headers=auth_headers
    )
    assert response.status_code == 404
    assert response.json()["detail"] == "Rollout not found"


async def test_update_rollout_change(client, auth_headers):
    rollout = await client.post(
        "/api/v1/rollouts/", headers=auth_headers, json={"name": "Summer rollout"}
    )
    rollout_id = rollout.json()["id"]
    change = await client.post(
        f"/api/v1/rollouts/{rollout_id}/changes",
        headers=auth_headers,
        json={"change_type": "Online store theme", "title": "Theme v2"},
    )
    change_id = change.json()["id"]
    response = await client.patch(
        f"/api/v1/rollouts/changes/{change_id}",
        headers=auth_headers,
        json={"status": "Applied"},
    )
    assert response.status_code == 200
    assert response.json()["status"] == "Applied"


async def test_update_rollout_change_missing_404(client, auth_headers):
    response = await client.patch(
        "/api/v1/rollouts/changes/999999",
        headers=auth_headers,
        json={"status": "Applied"},
    )
    assert response.status_code == 404
    assert response.json()["detail"] == "Rollout change not found"


async def test_delete_rollout_change(client, auth_headers):
    rollout = await client.post(
        "/api/v1/rollouts/", headers=auth_headers, json={"name": "Summer rollout"}
    )
    rollout_id = rollout.json()["id"]
    change = await client.post(
        f"/api/v1/rollouts/{rollout_id}/changes",
        headers=auth_headers,
        json={"change_type": "Online store theme", "title": "Theme v2"},
    )
    change_id = change.json()["id"]
    response = await client.delete(
        f"/api/v1/rollouts/changes/{change_id}", headers=auth_headers
    )
    assert response.status_code == 204
    list_response = await client.get(
        f"/api/v1/rollouts/{rollout_id}/changes", headers=auth_headers
    )
    assert list_response.status_code == 200
    assert list_response.json() == []


async def test_delete_rollout_change_missing_404(client, auth_headers):
    response = await client.delete(
        "/api/v1/rollouts/changes/999999", headers=auth_headers
    )
    assert response.status_code == 404
    assert response.json()["detail"] == "Rollout change not found"
