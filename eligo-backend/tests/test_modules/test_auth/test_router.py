"""Tests for the auth router in ``app.modules.auth.router``."""

import pytest

from app.core.security import hash_password
from app.modules.auth.model import User


@pytest.mark.asyncio
async def test_register_creates_user(client):
    response = await client.post(
        "/api/v1/auth/register",
        json={"email": "reg@example.com", "password": "secret123", "full_name": "Reg User"},
    )
    assert response.status_code == 201
    body = response.json()
    assert body["email"] == "reg@example.com"
    assert body["full_name"] == "Reg User"
    assert body["is_active"] is True
    assert "id" in body


@pytest.mark.asyncio
async def test_register_duplicate_email_returns_400(client):
    await client.post(
        "/api/v1/auth/register",
        json={"email": "dup@example.com", "password": "secret123"},
    )
    response = await client.post(
        "/api/v1/auth/register",
        json={"email": "dup@example.com", "password": "secret123"},
    )
    assert response.status_code == 400
    assert response.json()["detail"] == "Email Exist Already."


@pytest.mark.asyncio
async def test_register_invalid_email_returns_422(client):
    response = await client.post(
        "/api/v1/auth/register",
        json={"email": "not-an-email", "password": "secret123"},
    )
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_login_returns_token(client):
    await client.post(
        "/api/v1/auth/register",
        json={"email": "login@example.com", "password": "secret123"},
    )
    response = await client.post(
        "/api/v1/auth/login",
        json={"email": "login@example.com", "password": "secret123"},
    )
    assert response.status_code == 200
    body = response.json()
    assert body["access_token"]
    assert body["token_type"] == "bearer"
    assert "show_welcome_discount" in body


@pytest.mark.asyncio
async def test_login_wrong_password_returns_404(client):
    await client.post(
        "/api/v1/auth/register",
        json={"email": "login2@example.com", "password": "secret123"},
    )
    response = await client.post(
        "/api/v1/auth/login",
        json={"email": "login2@example.com", "password": "wrong-pass"},
    )
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_login_unknown_user_returns_404(client):
    response = await client.post(
        "/api/v1/auth/login",
        json={"email": "missing@example.com", "password": "secret123"},
    )
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_me_requires_auth(client):
    response = await client.get("/api/v1/auth/me")
    assert response.status_code in (401, 403)


@pytest.mark.asyncio
async def test_me_with_invalid_token_returns_401(client):
    response = await client.get(
        "/api/v1/auth/me", headers={"Authorization": "Bearer not-a-real-token"}
    )
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_me_returns_current_user(client, db_session):
    db_session.add(
        User(email="me@example.com", hashed_password=hash_password("secret123"))
    )
    await db_session.commit()

    login = await client.post(
        "/api/v1/auth/login",
        json={"email": "me@example.com", "password": "secret123"},
    )
    token = login.json()["access_token"]

    response = await client.get(
        "/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 200
    assert response.json()["email"] == "me@example.com"


@pytest.mark.asyncio
async def test_register_login_me_full_flow(client):
    await client.post(
        "/api/v1/auth/register",
        json={"email": "flow@example.com", "password": "secret123"},
    )
    login = await client.post(
        "/api/v1/auth/login",
        json={"email": "flow@example.com", "password": "secret123"},
    )
    token = login.json()["access_token"]
    response = await client.get(
        "/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 200
    assert response.json()["email"] == "flow@example.com"
