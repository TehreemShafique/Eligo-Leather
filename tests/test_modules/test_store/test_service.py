"""Tests for the store service in ``app.modules.store.service``."""

import pytest

from app.modules.store import service
from app.modules.store.model import StoreHeaderScript
from app.modules.store.schema import HeaderScriptUpdate


@pytest.mark.asyncio
async def test_get_header_script_missing_returns_none(db_session):
    assert await service.get_header_script(db_session, 999) is None


@pytest.mark.asyncio
async def test_ensure_header_script_creates_row(db_session):
    row = await service.ensure_header_script(db_session, 7)
    assert row.user_id == 7
    assert row.header_scripts == ""
    assert await service.get_header_script(db_session, 7) is not None


@pytest.mark.asyncio
async def test_ensure_header_script_is_idempotent(db_session):
    first = await service.ensure_header_script(db_session, 8)
    second = await service.ensure_header_script(db_session, 8)
    assert first.id == second.id


@pytest.mark.asyncio
async def test_update_header_script_saves_content(db_session):
    row = await service.update_header_script(
        db_session, 9, HeaderScriptUpdate(header_scripts="<script>ga()</script>")
    )
    assert row.header_scripts == "<script>ga()</script>"
    assert row.id is not None


@pytest.mark.asyncio
async def test_update_header_script_creates_if_missing(db_session):
    row = await service.update_header_script(
        db_session, 10, HeaderScriptUpdate(header_scripts="<meta>")
    )
    assert row.user_id == 10


def test_to_out_missing_row():
    out = service.to_out(None)
    assert out.user_id == 0
    assert out.header_scripts == ""
    assert out.updated_at is None
    assert service.HEADER_SCRIPTS_WARNING in out.disclaimer


def test_to_out_existing_row():
    row = StoreHeaderScript(user_id=11, header_scripts="<script>x</script>")
    out = service.to_out(row)
    assert out.user_id == 11
    assert out.header_scripts == "<script>x</script>"
