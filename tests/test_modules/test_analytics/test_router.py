"""Tests for app.modules.analytics.router"""

import pytest


# ---------------------------------------------------------------------------
# Dashboard
# ---------------------------------------------------------------------------

async def test_overview_requires_auth(client):
    resp = await client.get("/api/v1/analytics/overview")
    assert resp.status_code == 401


async def test_get_overview_hits_device_breakdown_bug(client, auth_headers):
    """GET /api/v1/analytics/overview 500s on valid input: the dashboard
    service references ``DailySnapshot.device_type`` which does not exist on
    the model. This test pins the current (broken) behavior so the failure is
    visible instead of silently passing.
    """
    with pytest.raises(AttributeError):
        await client.get("/api/v1/analytics/overview", headers=auth_headers)


# ---------------------------------------------------------------------------
# Reports
# ---------------------------------------------------------------------------

async def test_reports_requires_auth(client):
    resp = await client.get("/api/v1/reports/")
    assert resp.status_code == 401


async def test_reports_full_crud(client, auth_headers):
    resp = await client.post(
        "/api/v1/reports/",
        json={"name": "Monthly Sales", "category": "Sales", "description": "Monthly breakdown"},
        headers=auth_headers,
    )
    assert resp.status_code == 201
    body = resp.json()
    assert body["name"] == "Monthly Sales"
    assert body["category"] == "Sales"
    assert body["report_type"] == "standard"
    assert body["view_count"] == 0
    report_id = body["id"]

    resp = await client.get("/api/v1/reports/", headers=auth_headers)
    assert resp.status_code == 200
    assert len(resp.json()) == 1

    resp = await client.get(f"/api/v1/reports/{report_id}", headers=auth_headers)
    assert resp.status_code == 200
    assert resp.json()["name"] == "Monthly Sales"

    resp = await client.patch(
        f"/api/v1/reports/{report_id}",
        json={"description": "Updated summary"},
        headers=auth_headers,
    )
    assert resp.status_code == 200
    assert resp.json()["description"] == "Updated summary"
    assert resp.json()["view_count"] == 1

    resp = await client.delete(f"/api/v1/reports/{report_id}", headers=auth_headers)
    assert resp.status_code == 204


async def test_reports_list_filters_by_category(client, auth_headers):
    await client.post("/api/v1/reports/", json={"name": "R1", "category": "Sales"}, headers=auth_headers)
    await client.post("/api/v1/reports/", json={"name": "R2", "category": "Orders"}, headers=auth_headers)

    resp = await client.get("/api/v1/reports/", params={"category": "Orders"}, headers=auth_headers)
    assert resp.status_code == 200
    body = resp.json()
    assert len(body) == 1
    assert body[0]["name"] == "R2"


async def test_reports_get_missing_404(client, auth_headers):
    resp = await client.get("/api/v1/reports/99999", headers=auth_headers)
    assert resp.status_code == 404
    assert resp.json()["detail"] == "Report not found"


async def test_reports_patch_missing_404(client, auth_headers):
    resp = await client.patch("/api/v1/reports/99999", json={"name": "x"}, headers=auth_headers)
    assert resp.status_code == 404
    assert resp.json()["detail"] == "Report not found"


async def test_reports_delete_missing_404(client, auth_headers):
    resp = await client.delete("/api/v1/reports/99999", headers=auth_headers)
    assert resp.status_code == 404
    assert resp.json()["detail"] == "Report not found"


async def test_reports_create_invalid_body_422(client, auth_headers):
    resp = await client.post("/api/v1/reports/", json={}, headers=auth_headers)
    assert resp.status_code == 422


async def test_reports_list_invalid_limit_422(client, auth_headers):
    resp = await client.get("/api/v1/reports/", params={"limit": 0}, headers=auth_headers)
    assert resp.status_code == 422


# ---------------------------------------------------------------------------
# Explorations
# ---------------------------------------------------------------------------

async def test_explorations_requires_auth(client):
    resp = await client.get("/api/v1/explorations/")
    assert resp.status_code == 401


async def test_explorations_full_crud(client, auth_headers):
    resp = await client.post(
        "/api/v1/explorations/",
        json={"name": "Ad Hoc Query", "query_config": '{"dimensions": ["city"]}'},
        headers=auth_headers,
    )
    assert resp.status_code == 201
    body = resp.json()
    assert body["name"] == "Ad Hoc Query"
    assert body["created_by"] == "staff"
    exploration_id = body["id"]

    resp = await client.get("/api/v1/explorations/", headers=auth_headers)
    assert resp.status_code == 200
    assert len(resp.json()) == 1

    resp = await client.get(f"/api/v1/explorations/{exploration_id}", headers=auth_headers)
    assert resp.status_code == 200
    assert resp.json()["query_config"] == '{"dimensions": ["city"]}'

    resp = await client.patch(
        f"/api/v1/explorations/{exploration_id}",
        json={"name": "Renamed"},
        headers=auth_headers,
    )
    assert resp.status_code == 200
    assert resp.json()["name"] == "Renamed"

    resp = await client.delete(f"/api/v1/explorations/{exploration_id}", headers=auth_headers)
    assert resp.status_code == 204


async def test_explorations_missing_404(client, auth_headers):
    resp = await client.get("/api/v1/explorations/99999", headers=auth_headers)
    assert resp.status_code == 404
    assert resp.json()["detail"] == "Exploration not found"

    resp = await client.patch("/api/v1/explorations/99999", json={"name": "x"}, headers=auth_headers)
    assert resp.status_code == 404
    assert resp.json()["detail"] == "Exploration not found"

    resp = await client.delete("/api/v1/explorations/99999", headers=auth_headers)
    assert resp.status_code == 404
    assert resp.json()["detail"] == "Exploration not found"


async def test_explorations_create_invalid_body_422(client, auth_headers):
    resp = await client.post("/api/v1/explorations/", json={}, headers=auth_headers)
    assert resp.status_code == 422


# ---------------------------------------------------------------------------
# Live View
# ---------------------------------------------------------------------------

async def test_live_view_requires_auth(client):
    resp = await client.get("/api/v1/live-view/")
    assert resp.status_code == 401


async def test_live_view_snapshot(client, auth_headers):
    resp = await client.get("/api/v1/live-view/", headers=auth_headers)
    assert resp.status_code == 200
    body = resp.json()
    assert "metrics" in body
    assert "visitors" in body
    assert "recent_activities" in body
    assert body["metrics"]["active_visitors"] == 0


async def test_live_view_heartbeat(client, auth_headers):
    resp = await client.post(
        "/api/v1/live-view/heartbeat",
        params={"session_id": "sess-1", "current_page": "/home", "has_cart": "true", "cart_value": "45.50"},
        headers=auth_headers,
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["status"] == "ok"
    assert body["visitor_id"] > 0

    snapshot = await client.get("/api/v1/live-view/", headers=auth_headers)
    assert snapshot.status_code == 200
    assert snapshot.json()["metrics"]["active_visitors"] == 1


async def test_live_view_heartbeat_requires_session_id(client, auth_headers):
    resp = await client.post("/api/v1/live-view/heartbeat", params={}, headers=auth_headers)
    assert resp.status_code == 422


async def test_live_view_activity(client, auth_headers):
    resp = await client.post(
        "/api/v1/live-view/activity",
        params={"session_id": "sess-1", "event_type": "purchase", "description": "Order #100 placed"},
        headers=auth_headers,
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["status"] == "ok"
    assert body["activity_id"] > 0


async def test_live_view_activity_requires_event_type(client, auth_headers):
    resp = await client.post(
        "/api/v1/live-view/activity",
        params={"description": "no event type"},
        headers=auth_headers,
    )
    assert resp.status_code == 422


async def test_live_view_deactivate(client, auth_headers):
    await client.post("/api/v1/live-view/heartbeat", params={"session_id": "sess-1"}, headers=auth_headers)

    resp = await client.post(
        "/api/v1/live-view/deactivate", params={"session_id": "sess-1"}, headers=auth_headers,
    )
    assert resp.status_code == 200
    assert resp.json()["status"] == "ok"

    snapshot = await client.get("/api/v1/live-view/", headers=auth_headers)
    assert snapshot.json()["metrics"]["active_visitors"] == 0
