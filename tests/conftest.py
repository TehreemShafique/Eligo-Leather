"""Shared pytest fixtures for the Eligo backend test-suite.

Every test gets a completely fresh in-memory SQLite database. The
`client` fixture replaces the production ``get_db`` dependency with a
session bound to that test database so routers never touch Neon during
tests.
"""

from typing import AsyncIterator

import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from sqlalchemy.pool import StaticPool

from app.core.config import settings
from app.core.security import create_access_token, decode_access_token, hash_password
from app.db import models_registry  # noqa: F401  (registers all models)
from app.db.base import Base
from app.db.session import get_db
from app.main import app
from app.modules.auth.model import User
from app.modules.settings.account.model import UserSession

# One engine shared by the whole suite. StaticPool keeps a single
# in-memory connection alive so ``create_all`` / ``drop_all`` below can
# reset it between tests.
engine = create_async_engine(
    settings.TEST_DATABASE_URL,
    echo=False,
    future=True,
    poolclass=StaticPool,
)

TestingSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


async def override_get_db() -> AsyncIterator[AsyncSession]:
    """Test replacement for the production ``get_db`` dependency."""
    async with TestingSessionLocal() as session:
        yield session

# fixture tells python: Before running my test, prepare something for me and give it to the test."
@pytest_asyncio.fixture(autouse=True)
async def _setup_database() -> AsyncIterator[None]:
    """Re-create the full schema for every test so tests never share data."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)
    yield
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


@pytest_asyncio.fixture
async def db_session(_setup_database) -> AsyncIterator[AsyncSession]:
    """A single ``AsyncSession`` against the fresh test database."""
    async with TestingSessionLocal() as session:
        try:
            yield session
        finally:
            await session.rollback()
            await session.close()


@pytest_asyncio.fixture
async def client(_setup_database) -> AsyncIterator[AsyncClient]:
    """FastAPI test client with ``get_db`` pointing at the test database."""
    app.dependency_overrides[get_db] = override_get_db
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as c:
        yield c
    app.dependency_overrides.clear()


async def _make_user(
    session: AsyncSession,
    email: str,
    password: str = "password123",
    is_admin: bool = False,
    **kwargs,
) -> User:
    user = User(
        email=email,
        hashed_password=hash_password(password),
        is_admin=is_admin,
        is_active=True,
        **kwargs,
    )
    session.add(user)
    await session.commit()
    await session.refresh(user)
    return user


@pytest_asyncio.fixture
async def user(db_session) -> User:
    """A regular (non-admin) user in the test database."""
    return await _make_user(db_session, "user@example.com")


@pytest_asyncio.fixture
async def admin(db_session) -> User:
    """An admin user plus a matching active session ledger row, which
    ``get_current_user`` requires for admin tokens."""
    user = await _make_user(db_session, "admin@example.com", is_admin=True)
    token = create_access_token({"sub": user.email})
    jti = decode_access_token(token)["jti"]
    db_session.add(UserSession(user_id=user.id, token_id=jti))
    await db_session.commit()
    return user


@pytest_asyncio.fixture
async def auth_headers(db_session, user) -> dict[str, str]:
    """Authorization header for ``user`` (non-admin)."""
    token = create_access_token({"sub": user.email})
    return {"Authorization": f"Bearer {token}"}


@pytest_asyncio.fixture
async def admin_headers(db_session, admin) -> dict[str, str]:
    """Authorization header for an admin user with a live session."""
    token = create_access_token({"sub": admin.email})
    jti = decode_access_token(token)["jti"]
    db_session.add(UserSession(user_id=admin.id, token_id=jti))
    await db_session.commit()
    return {"Authorization": f"Bearer {token}"}


async def register_and_login(
    client: AsyncClient, email: str, password: str = "password123"
) -> dict:
    """Register a user through the API and return the login token body."""
    reg = await client.post(
        "/api/v1/auth/register",
        json={"email": email, "password": password, "full_name": "Test User"},
    )
    reg.raise_for_status()
    login = await client.post(
        "/api/v1/auth/login",
        json={"email": email, "password": password},
    )
    login.raise_for_status()
    return login.json()
