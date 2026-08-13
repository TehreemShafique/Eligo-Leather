"""Tests for the store router in ``app.modules.store.router``."""

import pytest

from app.modules.store.model import StoreHeaderScript


@pytest.mark.asyncio
async def test_public_get_header_scripts_missing_row(client):
    response = await client.get("/api/v1/store/9999/header-scripts")
    assert response.status_code == 200
    body = response.json()
    assert body["user_id"] == 0
    assert body["header_scripts"] == ""


@pytest.mark.asyncio
async def test_public_get_header_scripts_existing_row(client, db_session):
    db_session.add(StoreHeaderScript(user_id=42, header_scripts="<script>ga()</script>"))
    await db_session.commit()

    response = await client.get("/api/v1/store/42/header-scripts")
    assert response.status_code == 200
    body = response.json()
    assert body["user_id"] == 42
    assert body["header_scripts"] == "<script>ga()</script>"


@pytest.mark.asyncio
async def test_get_my_header_scripts_requires_auth(client):
    response = await client.get("/api/v1/store/header-scripts")
    assert response.status_code in (401, 403)


@pytest.mark.asyncio
async def test_get_my_header_scripts_creates_row(client, auth_headers, user):
    response = await client.get(
        "/api/v1/store/header-scripts", headers=auth_headers
    )
    assert response.status_code == 200
    body = response.json()
    assert body["user_id"] == user.id
    assert "disclaimer" in body


@pytest.mark.asyncio
async def test_save_header_scripts(client, auth_headers, user):
    response = await client.post(
        "/api/v1/store/header-scripts",
        headers=auth_headers,
        json={"header_scripts": "<script>analytics()</script>"},
    )
    assert response.status_code == 200
    body = response.json()
    assert body["user_id"] == user.id
    assert body["header_scripts"] == "<script>analytics()</script>"


@pytest.mark.asyncio
async def test_save_header_scripts_too_long_returns_422(client, auth_headers):
    response = await client.post(
        "/api/v1/store/header-scripts",
        headers=auth_headers,
        json={"header_scripts": "x" * 10001},
    )
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_saved_scripts_persist_for_public_read(client, auth_headers, user):
    await client.post(
        "/api/v1/store/header-scripts",
        headers=auth_headers,
        json={"header_scripts": "<meta name='theme'>"},
    )
    public = await client.get(f"/api/v1/store/{user.id}/header-scripts")
    assert public.status_code == 200
    assert public.json()["header_scripts"] == "<meta name='theme'>"
