"""Tests for app.modules.segments.model."""

from app.db.base import Base
from app.modules.segments.model import Segment


def test_segment_table_registered():
    assert "segments" in Base.metadata.tables


def test_segment_index_on_name():
    assert any(i.name == "ix_segments_name" for i in Segment.__table__.indexes)


def test_segment_name_required():
    assert Segment.__table__.c.name.nullable is False


async def test_segment_defaults(db_session):
    segment = Segment(name="VIP")
    db_session.add(segment)
    await db_session.commit()
    await db_session.refresh(segment)
    assert segment.id is not None
    assert segment.percentage_of_customers == 0.0
    assert segment.is_system is False
    assert segment.description is None
    assert segment.created_by is None
    assert segment.query_definition is None


async def test_segment_system_flag(db_session):
    segment = Segment(name="All Customers", is_system=True)
    db_session.add(segment)
    await db_session.commit()
    await db_session.refresh(segment)
    assert segment.is_system is True
