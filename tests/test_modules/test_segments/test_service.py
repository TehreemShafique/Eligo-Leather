"""Tests for app.modules.segments.service."""

from app.modules.segments.model import Segment
from app.modules.segments.schema import SegmentCreate, SegmentUpdate
from app.modules.segments import service


async def _mk_segment(db_session, **kwargs):
    data = {"name": "VIP", **kwargs}
    return await service.create_segment(db_session, SegmentCreate(**data))


# ===========================================================================
# Segment CRUD
# ===========================================================================

async def test_create_segment(db_session):
    segment = await _mk_segment(db_session, percentage_of_customers=10.0, description="High value")
    assert segment.id is not None
    assert segment.name == "VIP"
    assert segment.percentage_of_customers == 10.0
    assert segment.description == "High value"
    assert segment.is_system is False
    assert segment.created_at is not None


async def test_get_segment(db_session):
    segment = await _mk_segment(db_session)
    found = await service.get_segment(db_session, segment.id)
    assert found is not None
    assert found.id == segment.id
    assert await service.get_segment(db_session, 999999) is None


async def test_list_segments_empty(db_session):
    assert await service.list_segments(db_session) == []


async def test_list_segments_filters_pagination(db_session):
    await _mk_segment(db_session, name="VIP")
    await _mk_segment(db_session, name="All Customers", is_system=True, created_by="admin")

    found = await service.list_segments(db_session, search="vip")
    assert [s.name for s in found] == ["VIP"]

    found = await service.list_segments(db_session, search="admin")
    assert [s.name for s in found] == ["All Customers"]

    found = await service.list_segments(db_session, is_system=True)
    assert [s.name for s in found] == ["All Customers"]

    found = await service.list_segments(db_session, is_system=False)
    assert [s.name for s in found] == ["VIP"]

    assert len(await service.list_segments(db_session, limit=1)) == 1
    assert await service.list_segments(db_session, skip=5) == []


async def test_update_segment(db_session):
    segment = await _mk_segment(db_session)
    updated = await service.update_segment(db_session, segment.id, SegmentUpdate(description="x"))
    assert updated.description == "x"
    assert await service.update_segment(db_session, 999999, SegmentUpdate(name="z")) is None


async def test_delete_segment(db_session):
    segment = await _mk_segment(db_session)
    assert await service.delete_segment(db_session, segment.id) is True
    assert await service.get_segment(db_session, segment.id) is None
    assert await service.delete_segment(db_session, segment.id) is False


async def test_delete_system_segment_refused(db_session):
    segment = await _mk_segment(db_session, is_system=True)
    assert await service.delete_segment(db_session, segment.id) is False
    assert await service.get_segment(db_session, segment.id) is not None
