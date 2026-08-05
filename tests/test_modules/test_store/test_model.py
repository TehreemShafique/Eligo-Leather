"""Tests for ``StoreHeaderScript`` in ``app.modules.store.model``."""

from app.db.base import Base
from app.modules.store.model import StoreHeaderScript


def test_table_registered():
    assert "store_header_scripts" in Base.metadata.tables


def test_user_id_unique():
    assert StoreHeaderScript.__table__.c.user_id.unique is True


async def test_default_header_scripts_empty(db_session):
    row = StoreHeaderScript(user_id=1)
    db_session.add(row)
    await db_session.commit()
    await db_session.refresh(row)
    assert row.header_scripts == ""
    assert row.id is not None
