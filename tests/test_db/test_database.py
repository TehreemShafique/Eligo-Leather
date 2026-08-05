"""Tests for the SQLAlchemy async database session machinery.

These tests deliberately use the TEST engine/session factory from
``tests.conftest`` instead of ``app.db.session`` (which binds to the
production DATABASE_URL and must never be touched by the suite).
"""

import pytest
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from tests.conftest import TestingSessionLocal, engine, override_get_db

from app.db.base import Base


@pytest.mark.asyncio
async def test_engine_is_async():
    assert engine is not None
    assert engine.dialect is not None


def test_session_factory_produces_async_session():
    assert TestingSessionLocal is not None


@pytest.mark.asyncio
async def test_async_session_context_manager():
    async with TestingSessionLocal() as session:
        assert isinstance(session, AsyncSession)


@pytest.mark.asyncio
async def test_get_db_yields_async_session():
    generator = override_get_db()
    session = await anext(generator)
    assert isinstance(session, AsyncSession)
    await generator.aclose()


@pytest.mark.asyncio
async def test_db_connection_executes_query():
    async with TestingSessionLocal() as session:
        result = await session.execute(text("SELECT 1"))
        assert result.scalar() == 1


@pytest.mark.asyncio
async def test_session_close_does_not_raise():
    session = TestingSessionLocal()
    await session.close()  # idempotent, should not raise
    await session.close()


@pytest.mark.asyncio
async def test_metadata_includes_expected_tables():
    table_names = set(Base.metadata.tables.keys())
    for name in (
        "users",
        "roles",
        "customers",
        "companies",
        "orders",
        "products",
        "store_header_scripts",
    ):
        assert name in table_names
