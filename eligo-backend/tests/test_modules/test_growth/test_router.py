"""Tests for ``app.modules.growth.router``."""


async def test_growth_endpoints_require_auth(client):
    assert (await client.get("/api/v1/growth/overview")).status_code in (401, 403)
    assert (await client.get("/api/v1/attribution/")).status_code in (401, 403)
    assert (await client.post("/api/v1/attribution/", json={})).status_code in (401, 403)
    assert (await client.get("/api/v1/campaigns/")).status_code in (401, 403)
    assert (await client.post("/api/v1/campaigns/", json={})).status_code in (401, 403)


async def test_create_attribution(client, auth_headers):
    response = await client.post(
        "/api/v1/attribution/",
        headers=auth_headers,
        json={"channel": "Google Search", "type": "Organic"},
    )
    assert response.status_code == 201
    body = response.json()
    assert body["channel"] == "Google Search"
    assert body["type"] == "Organic"
    assert body["sessions"] == 0
    assert body["sales"] == 0.0


async def test_list_attributions(client, auth_headers):
    await client.post(
        "/api/v1/attribution/",
        headers=auth_headers,
        json={"channel": "Google Search", "type": "Organic"},
    )
    response = await client.get("/api/v1/attribution/", headers=auth_headers)
    assert response.status_code == 200
    assert len(response.json()) == 1
    assert response.json()[0]["channel"] == "Google Search"


async def test_list_attributions_filters(client, auth_headers):
    await client.post(
        "/api/v1/attribution/",
        headers=auth_headers,
        json={"channel": "Google Search", "type": "Organic"},
    )
    await client.post(
        "/api/v1/attribution/",
        headers=auth_headers,
        json={"channel": "Facebook", "type": "Organic"},
    )
    response = await client.get(
        "/api/v1/attribution/?channel=Facebook", headers=auth_headers
    )
    assert response.status_code == 200
    body = response.json()
    assert len(body) == 1
    assert body[0]["channel"] == "Facebook"


async def test_get_attribution(client, auth_headers):
    created = await client.post(
        "/api/v1/attribution/",
        headers=auth_headers,
        json={"channel": "Facebook", "type": "Organic"},
    )
    created_id = created.json()["id"]
    response = await client.get(
        f"/api/v1/attribution/{created_id}", headers=auth_headers
    )
    assert response.status_code == 200
    assert response.json()["channel"] == "Facebook"


async def test_get_attribution_missing_404(client, auth_headers):
    response = await client.get("/api/v1/attribution/999999", headers=auth_headers)
    assert response.status_code == 404
    assert response.json()["detail"] == "Attribution record not found"


async def test_update_attribution(client, auth_headers):
    created = await client.post(
        "/api/v1/attribution/",
        headers=auth_headers,
        json={"channel": "Bing", "type": "Organic"},
    )
    created_id = created.json()["id"]
    response = await client.patch(
        f"/api/v1/attribution/{created_id}",
        headers=auth_headers,
        json={"sessions": 5},
    )
    assert response.status_code == 200
    assert response.json()["sessions"] == 5


async def test_update_attribution_missing_404(client, auth_headers):
    response = await client.patch(
        "/api/v1/attribution/999999", headers=auth_headers, json={"sessions": 5}
    )
    assert response.status_code == 404
    assert response.json()["detail"] == "Attribution record not found"


async def test_delete_attribution(client, auth_headers):
    created = await client.post(
        "/api/v1/attribution/",
        headers=auth_headers,
        json={"channel": "Bing", "type": "Organic"},
    )
    created_id = created.json()["id"]
    response = await client.delete(
        f"/api/v1/attribution/{created_id}", headers=auth_headers
    )
    assert response.status_code == 204
    get_response = await client.get(
        f"/api/v1/attribution/{created_id}", headers=auth_headers
    )
    assert get_response.status_code == 404


async def test_delete_attribution_missing_404(client, auth_headers):
    response = await client.delete(
        "/api/v1/attribution/999999", headers=auth_headers
    )
    assert response.status_code == 404
    assert response.json()["detail"] == "Attribution record not found"


async def test_create_attribution_validation_422(client, auth_headers):
    response = await client.post("/api/v1/attribution/", headers=auth_headers, json={})
    assert response.status_code == 422


async def test_create_campaign(client, auth_headers):
    response = await client.post(
        "/api/v1/campaigns/",
        headers=auth_headers,
        json={"campaign_name": "Summer Sale"},
    )
    assert response.status_code == 201
    body = response.json()
    assert body["campaign_name"] == "Summer Sale"
    assert body["status"] == "Draft"


async def test_list_campaigns(client, auth_headers):
    await client.post(
        "/api/v1/campaigns/",
        headers=auth_headers,
        json={"campaign_name": "Summer Sale"},
    )
    response = await client.get("/api/v1/campaigns/", headers=auth_headers)
    assert response.status_code == 200
    assert len(response.json()) == 1
    assert response.json()[0]["campaign_name"] == "Summer Sale"


async def test_get_campaign(client, auth_headers):
    created = await client.post(
        "/api/v1/campaigns/",
        headers=auth_headers,
        json={"campaign_name": "Summer Sale"},
    )
    created_id = created.json()["id"]
    response = await client.get(f"/api/v1/campaigns/{created_id}", headers=auth_headers)
    assert response.status_code == 200
    assert response.json()["campaign_name"] == "Summer Sale"


async def test_get_campaign_missing_404(client, auth_headers):
    response = await client.get("/api/v1/campaigns/999999", headers=auth_headers)
    assert response.status_code == 404
    assert response.json()["detail"] == "Campaign not found"


async def test_update_campaign(client, auth_headers):
    created = await client.post(
        "/api/v1/campaigns/",
        headers=auth_headers,
        json={"campaign_name": "Summer Sale"},
    )
    created_id = created.json()["id"]
    response = await client.patch(
        f"/api/v1/campaigns/{created_id}",
        headers=auth_headers,
        json={"status": "Active"},
    )
    assert response.status_code == 200
    assert response.json()["status"] == "Active"


async def test_update_campaign_missing_404(client, auth_headers):
    response = await client.patch(
        "/api/v1/campaigns/999999", headers=auth_headers, json={"status": "Active"}
    )
    assert response.status_code == 404
    assert response.json()["detail"] == "Campaign not found"


async def test_delete_campaign(client, auth_headers):
    created = await client.post(
        "/api/v1/campaigns/",
        headers=auth_headers,
        json={"campaign_name": "Summer Sale"},
    )
    created_id = created.json()["id"]
    response = await client.delete(
        f"/api/v1/campaigns/{created_id}", headers=auth_headers
    )
    assert response.status_code == 204
    get_response = await client.get(
        f"/api/v1/campaigns/{created_id}", headers=auth_headers
    )
    assert get_response.status_code == 404


async def test_delete_campaign_missing_404(client, auth_headers):
    response = await client.delete("/api/v1/campaigns/999999", headers=auth_headers)
    assert response.status_code == 404
    assert response.json()["detail"] == "Campaign not found"


async def test_create_campaign_validation_422(client, auth_headers):
    response = await client.post("/api/v1/campaigns/", headers=auth_headers, json={})
    assert response.status_code == 422


async def test_growth_overview_empty(client, auth_headers):
    response = await client.get("/api/v1/growth/overview", headers=auth_headers)
    assert response.status_code == 200
    body = response.json()
    assert body["total_store_sales"] == 0.0
    assert body["marketing_attributed_sales"] == 0.0
    assert body["total_sessions"] == 0
    assert body["total_orders"] == 0
    assert body["total_marketing_spend"] == 0.0
    assert body["sessions_by_traffic_type"] == []
    assert body["top_channels"] == []


async def test_growth_overview_with_data(client, auth_headers):
    await client.post(
        "/api/v1/attribution/",
        headers=auth_headers,
        json={
            "channel": "Google Search",
            "type": "Organic",
            "sessions": 100,
            "sales": 1000,
            "orders": 10,
            "cost": 100,
        },
    )
    response = await client.get("/api/v1/growth/overview", headers=auth_headers)
    assert response.status_code == 200
    body = response.json()
    assert body["total_store_sales"] == 1000.0
    assert body["marketing_attributed_sales"] == 1000.0
    assert body["marketing_sales_percentage"] == 100.0
    assert body["total_sessions"] == 100
    assert body["total_orders"] == 10
    assert body["overall_conversion_rate"] == 10.0
    assert body["overall_aov"] == 100.0
    assert body["overall_roas"] == 10.0
    assert body["top_channels"][0]["channel"] == "Google Search"
    assert body["sessions_by_traffic_type"][0]["traffic_type"] == "Organic"
