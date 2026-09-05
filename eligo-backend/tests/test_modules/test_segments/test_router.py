"""Tests for app.modules.segments.router."""

from app.modules.segments.model import Segment


async def _mk_segment(db_session, **kwargs):
    segment = Segment(**{"name": "VIP", **kwargs})
    db_session.add(segment)
    await db_session.commit()
    await db_session.refresh(segment)
    return segment


# ===========================================================================
# Segment CRUD
# ===========================================================================

async def test_public_access(client):
    resp = await client.get("/api/v1/segments/")
    assert resp.status_code == 200
    assert resp.json() == []


async def test_create_segment(client, auth_headers):
    resp = await client.post(
        "/api/v1/segments/",
        json={"name": "VIP", "percentage_of_customers": 10.0},
        headers=auth_headers,
    )
    assert resp.status_code == 201
    body = resp.json()
    assert body["id"] > 0
    assert body["name"] == "VIP"
    assert body["percentage_of_customers"] == 10.0
    assert body["is_system"] is False
    assert "created_at" in body


async def test_create_segment_requires_name(client, auth_headers):
    resp = await client.post("/api/v1/segments/", json={}, headers=auth_headers)
    assert resp.status_code == 422


async def test_list_segments(client, auth_headers, db_session):
    await _mk_segment(db_session, name="VIP")
    resp = await client.get("/api/v1/segments/", headers=auth_headers)
    assert resp.status_code == 200
    assert [s["name"] for s in resp.json()] == ["VIP"]


async def test_list_segments_is_system_filter(client, auth_headers, db_session):
    await _mk_segment(db_session, name="VIP")
    resp = await client.get("/api/v1/segments/?is_system=false", headers=auth_headers)
    assert resp.status_code == 200
    assert [s["name"] for s in resp.json()] == ["VIP"]

    resp = await client.get("/api/v1/segments/?is_system=true", headers=auth_headers)
    assert resp.status_code == 200
    assert resp.json() == []


async def test_get_segment(client, auth_headers, db_session):
    segment = await _mk_segment(db_session)
    resp = await client.get(f"/api/v1/segments/{segment.id}", headers=auth_headers)
    assert resp.status_code == 200
    body = resp.json()
    assert body["name"] == "VIP"
    assert body["is_system"] is False


async def test_get_segment_missing(client, auth_headers):
    resp = await client.get("/api/v1/segments/999999", headers=auth_headers)
    assert resp.status_code == 404
    assert resp.json()["detail"] == "Segment not found"


async def test_update_segment(client, auth_headers, db_session):
    segment = await _mk_segment(db_session)
    resp = await client.patch(
        f"/api/v1/segments/{segment.id}", json={"description": "y"}, headers=auth_headers
    )
    assert resp.status_code == 200
    assert resp.json()["description"] == "y"


async def test_update_segment_missing(client, auth_headers):
    resp = await client.patch("/api/v1/segments/999999", json={"name": "z"}, headers=auth_headers)
    assert resp.status_code == 404
    assert resp.json()["detail"] == "Segment not found"


async def test_delete_segment(client, auth_headers, db_session):
    segment = await _mk_segment(db_session)
    resp = await client.delete(f"/api/v1/segments/{segment.id}", headers=auth_headers)
    assert resp.status_code == 204
    resp = await client.get(f"/api/v1/segments/{segment.id}", headers=auth_headers)
    assert resp.status_code == 404


async def test_delete_system_segment_refused(client, auth_headers, db_session):
    segment = await _mk_segment(db_session, is_system=True)
    resp = await client.delete(f"/api/v1/segments/{segment.id}", headers=auth_headers)
    assert resp.status_code == 404
    assert resp.json()["detail"] == "Segment not found or is a system segment"


async def test_delete_segment_missing(client, auth_headers):
    resp = await client.delete("/api/v1/segments/999999", headers=auth_headers)
    assert resp.status_code == 404
    assert resp.json()["detail"] == "Segment not found or is a system segment"
