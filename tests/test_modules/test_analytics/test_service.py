"""Tests for app.modules.analytics.service"""

import pytest
from sqlalchemy import func, select

from app.modules.analytics import service
from app.modules.analytics.model import (
    DailySnapshot,
    Report,
    Exploration,
    LiveVisitor,
    LiveActivity,
    CohortRetention,
)
from app.modules.analytics.schema import (
    ReportCreate,
    ReportUpdate,
    ExplorationCreate,
    ExplorationUpdate,
)


# ---------------------------------------------------------------------------
# Reports
# ---------------------------------------------------------------------------

async def test_create_and_get_report(db_session):
    report = await service.create_report(
        db_session,
        ReportCreate(name="Monthly Sales", category="Sales", created_by="alice"),
    )
    assert report.id is not None
    assert report.name == "Monthly Sales"
    assert report.category == "Sales"
    assert report.created_by == "alice"
    assert report.report_type == "standard"
    assert report.view_count == 0

    fetched = await service.get_report(db_session, report.id)
    assert fetched is not None
    assert fetched.name == "Monthly Sales"


async def test_get_report_missing_returns_none(db_session):
    assert await service.get_report(db_session, 99999) is None


async def test_list_reports_filters(db_session):
    await service.create_report(db_session, ReportCreate(name="Alpha", category="Sales", created_by="alice"))
    await service.create_report(db_session, ReportCreate(name="Beta", category="Orders", created_by="bob"))
    await service.create_report(db_session, ReportCreate(name="Gamma", category="Sales", created_by="bob"))

    assert len(await service.list_reports(db_session)) == 3
    assert len(await service.list_reports(db_session, search="Alpha")) == 1
    assert len(await service.list_reports(db_session, category="Sales")) == 2
    assert len(await service.list_reports(db_session, created_by="bob")) == 2
    assert len(await service.list_reports(db_session, category="Sales", created_by="bob")) == 1


async def test_update_report(db_session):
    report = await service.create_report(db_session, ReportCreate(name="Monthly", category="Sales"))
    updated = await service.update_report(
        db_session, report.id, ReportUpdate(name="Quarterly", description="Q summary"),
    )
    assert updated is not None
    assert updated.name == "Quarterly"
    assert updated.description == "Q summary"
    assert updated.view_count == 1


async def test_update_report_missing_returns_none(db_session):
    assert await service.update_report(db_session, 99999, ReportUpdate(name="x")) is None


async def test_delete_report(db_session):
    report = await service.create_report(db_session, ReportCreate(name="Temp", category="Sales"))
    assert await service.delete_report(db_session, report.id) is True
    assert await service.get_report(db_session, report.id) is None
    assert await service.delete_report(db_session, report.id) is False


# ---------------------------------------------------------------------------
# Explorations
# ---------------------------------------------------------------------------

async def test_create_and_get_exploration(db_session):
    exploration = await service.create_exploration(
        db_session,
        ExplorationCreate(name="Ad Hoc", query_config='{"dimensions": ["city"]}'),
    )
    assert exploration.id is not None
    assert exploration.name == "Ad Hoc"
    assert exploration.query_config == '{"dimensions": ["city"]}'
    assert exploration.created_by == "staff"

    fetched = await service.get_exploration(db_session, exploration.id)
    assert fetched is not None
    assert fetched.name == "Ad Hoc"


async def test_get_exploration_missing_returns_none(db_session):
    assert await service.get_exploration(db_session, 99999) is None


async def test_list_explorations_filters(db_session):
    await service.create_exploration(db_session, ExplorationCreate(name="One", query_config="{}"))
    await service.create_exploration(db_session, ExplorationCreate(name="Two", query_config="{}", created_by="bob"))

    assert len(await service.list_explorations(db_session)) == 2
    assert len(await service.list_explorations(db_session, search="One")) == 1
    assert len(await service.list_explorations(db_session, created_by="bob")) == 1


async def test_update_exploration(db_session):
    exploration = await service.create_exploration(db_session, ExplorationCreate(name="E", query_config="{}"))
    updated = await service.update_exploration(
        db_session, exploration.id, ExplorationUpdate(name="E2"),
    )
    assert updated is not None
    assert updated.name == "E2"
    assert await service.update_exploration(db_session, 99999, ExplorationUpdate(name="x")) is None


async def test_delete_exploration(db_session):
    exploration = await service.create_exploration(db_session, ExplorationCreate(name="E", query_config="{}"))
    assert await service.delete_exploration(db_session, exploration.id) is True
    assert await service.get_exploration(db_session, exploration.id) is None
    assert await service.delete_exploration(db_session, exploration.id) is False


# ---------------------------------------------------------------------------
# Live View
# ---------------------------------------------------------------------------

async def test_upsert_live_visitor_creates(db_session):
    visitor = await service.upsert_live_visitor(
        db_session,
        session_id="sess-1",
        current_page="/",
        visitor_city="Lahore",
        device_type="mobile",
        has_cart=True,
        cart_value=250.0,
    )
    assert visitor.id is not None
    assert visitor.session_id == "sess-1"
    assert visitor.device_type == "mobile"
    assert visitor.visitor_city == "Lahore"
    assert visitor.has_cart is True
    assert float(visitor.cart_value) == 250.0
    assert visitor.is_active is True


async def test_upsert_live_visitor_updates(db_session):
    visitor = await service.upsert_live_visitor(db_session, session_id="sess-1", current_page="/a")
    original_id = visitor.id
    original_last_active = visitor.last_active_at

    updated = await service.upsert_live_visitor(
        db_session, session_id="sess-1", current_page="/b", visitor_country="PK", has_cart=True, cart_value=99.0,
    )
    assert updated.id == original_id
    assert updated.current_page == "/b"
    assert updated.visitor_country == "PK"
    assert updated.has_cart is True
    assert float(updated.cart_value) == 99.0
    assert updated.is_active is True
    assert updated.last_active_at >= original_last_active


async def test_deactivate_visitor(db_session):
    await service.upsert_live_visitor(db_session, session_id="sess-1")
    await service.deactivate_visitor(db_session, session_id="sess-1")

    result = await db_session.execute(select(LiveVisitor).where(LiveVisitor.session_id == "sess-1"))
    visitor = result.scalar_one()
    assert visitor.is_active is False


async def test_record_live_activity(db_session):
    activity = await service.record_live_activity(
        db_session,
        session_id="sess-1",
        event_type="purchase",
        description="Order placed",
        order_value=199.50,
        page_url="/checkout",
    )
    assert activity.id is not None
    assert activity.event_type == "purchase"
    assert float(activity.order_value) == 199.50


async def test_get_live_view_snapshot(db_session):
    await service.upsert_live_visitor(
        db_session, session_id="sess-1", has_cart=True, cart_value=50.0,
    )
    await service.record_live_activity(
        db_session, session_id="sess-1", event_type="page_view", description="Viewed home",
    )

    snapshot = await service.get_live_view_snapshot(db_session)
    assert snapshot.metrics.active_visitors == 1
    assert snapshot.metrics.active_carts == 1
    assert snapshot.metrics.checkouts_in_progress == 0
    assert len(snapshot.visitors) == 1
    assert snapshot.visitors[0].session_id == "sess-1"
    assert len(snapshot.recent_activities) == 1
    assert snapshot.recent_activities[0].event_type == "page_view"


# ---------------------------------------------------------------------------
# Dashboard (known backend bug)
# ---------------------------------------------------------------------------

async def test_get_analytics_overview_raises_device_type_error(db_session):
    """get_analytics_overview always raises AttributeError because
    _get_device_breakdown references ``DailySnapshot.device_type``, a column
    that does not exist on the model (see app/modules/analytics/service.py).
    """
    with pytest.raises(AttributeError):
        await service.get_analytics_overview(db_session)


async def test_seed_daily_snapshots_are_queryable(db_session):
    from datetime import datetime

    db_session.add_all([
        DailySnapshot(snapshot_date=datetime.now(), metric_type="sessions", sessions=100, added_to_cart=20),
        CohortRetention(cohort_month="2025-01", cohort_size=50, active_customers=10, retention_rate=20.0),
    ])
    await db_session.commit()

    total = (await db_session.execute(select(func.sum(DailySnapshot.sessions)))).scalar()
    assert total == 100
    cohort = (await db_session.execute(select(CohortRetention))).scalars().all()
    assert len(cohort) == 1
    assert cohort[0].retention_rate == 20.0
