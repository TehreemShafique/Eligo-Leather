"""Tests for app.modules.analytics.model"""

import pytest
from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError

from app.db.base import Base
from app.modules.analytics.model import (
    DailySnapshot,
    Report,
    Exploration,
    LiveVisitor,
    LiveActivity,
    CohortRetention,
    ReportCategory,
    DeviceType,
)


def test_tables_registered():
    tables = set(Base.metadata.tables.keys())
    for name in (
        "daily_snapshots",
        "reports",
        "explorations",
        "live_visitors",
        "live_activities",
        "cohort_retention",
    ):
        assert name in tables


def test_report_category_enum_values():
    assert ReportCategory.sales.value == "Sales"
    assert ReportCategory.orders.value == "Orders"
    assert ReportCategory.acquisition.value == "Acquisition"
    assert ReportCategory.customers.value == "Customers"
    assert ReportCategory.inventory.value == "Inventory"
    assert ReportCategory.profit_margin.value == "Profit Margin"
    assert ReportCategory.store.value == "Store"


def test_device_type_enum_values():
    assert DeviceType.desktop.value == "Desktop"
    assert DeviceType.mobile.value == "Mobile"
    assert DeviceType.tablet.value == "Tablet"
    assert DeviceType.unknown.value == "Unknown"


def test_daily_snapshot_columns_and_indexes():
    table = DailySnapshot.__table__
    columns = table.columns.keys()
    for name in (
        "id",
        "snapshot_date",
        "metric_type",
        "gross_sales",
        "discounts",
        "net_sales",
        "total_sales",
        "total_orders",
        "average_order_value",
        "sessions",
        "sessions_desktop",
        "sessions_mobile",
        "sessions_tablet",
        "added_to_cart",
        "reached_checkout",
        "completed_orders",
        "conversion_rate",
        "country",
        "channel",
        "created_at",
    ):
        assert name in columns
    assert table.c.snapshot_date.nullable is False
    assert table.c.metric_type.nullable is False
    assert table.c.country.nullable is True
    index_names = {ix.name for ix in table.indexes}
    assert "ix_daily_snapshots_date" in index_names
    assert "ix_daily_snapshots_type" in index_names


async def test_daily_snapshot_insert_defaults(db_session):
    from datetime import datetime

    snapshot = DailySnapshot(snapshot_date=datetime.now(), metric_type="sessions")
    db_session.add(snapshot)
    await db_session.commit()
    await db_session.refresh(snapshot)

    assert snapshot.id is not None
    assert snapshot.gross_sales == 0
    assert snapshot.total_orders == 0
    assert snapshot.sessions == 0
    assert snapshot.conversion_rate == 0.0
    assert snapshot.new_customers == 0
    assert snapshot.returning_customer_rate == 0.0
    assert snapshot.created_at is not None


def test_report_columns_and_indexes():
    table = Report.__table__
    for name in (
        "id",
        "name",
        "description",
        "category",
        "report_type",
        "query_params",
        "created_by",
        "is_system",
        "last_viewed_at",
        "view_count",
        "created_at",
        "updated_at",
    ):
        assert name in table.columns.keys()
    assert table.c.name.nullable is False
    index_names = {ix.name for ix in table.indexes}
    assert "ix_reports_category" in index_names
    assert "ix_reports_created_by" in index_names


async def test_report_insert_defaults(db_session):
    report = Report(name="Monthly Sales", category="Sales")
    db_session.add(report)
    await db_session.commit()
    await db_session.refresh(report)

    assert report.id is not None
    assert report.report_type == "standard"
    assert report.created_by == "System"
    assert report.is_system is False
    assert report.view_count == 0
    assert report.last_viewed_at is None
    assert report.created_at is not None
    assert report.updated_at is not None


async def test_exploration_insert_defaults(db_session):
    exploration = Exploration(name="Ad Hoc", query_config="{}")
    db_session.add(exploration)
    await db_session.commit()
    await db_session.refresh(exploration)

    assert exploration.id is not None
    assert exploration.created_by == "staff"
    assert exploration.last_viewed_at is None
    assert exploration.created_at is not None


def test_live_visitor_columns_and_indexes():
    table = LiveVisitor.__table__
    for name in (
        "id",
        "session_id",
        "visitor_ip",
        "device_type",
        "has_cart",
        "cart_value",
        "is_checkout",
        "is_active",
        "last_active_at",
        "created_at",
    ):
        assert name in table.columns.keys()
    assert table.c.session_id.unique is True
    assert table.c.session_id.nullable is False
    index_names = {ix.name for ix in table.indexes}
    assert "ix_live_visitors_session_id" in index_names
    assert "ix_live_visitors_last_active" in index_names


async def test_live_visitor_insert_defaults(db_session):
    visitor = LiveVisitor(session_id="sess-1")
    db_session.add(visitor)
    await db_session.commit()
    await db_session.refresh(visitor)

    assert visitor.device_type == "unknown"
    assert visitor.has_cart is False
    assert visitor.is_checkout is False
    assert visitor.is_active is True
    assert visitor.cart_value == 0
    assert visitor.last_active_at is not None


async def test_live_visitor_session_id_unique(db_session):
    db_session.add(LiveVisitor(session_id="dup"))
    await db_session.commit()

    db_session.add(LiveVisitor(session_id="dup"))
    with pytest.raises(IntegrityError):
        await db_session.commit()
    await db_session.rollback()


def test_live_activity_columns_and_indexes():
    table = LiveActivity.__table__
    for name in (
        "id",
        "session_id",
        "event_type",
        "description",
        "product_name",
        "order_number",
        "order_value",
        "page_url",
        "created_at",
    ):
        assert name in table.columns.keys()
    assert table.c.event_type.nullable is False
    assert table.c.description.nullable is False
    index_names = {ix.name for ix in table.indexes}
    assert "ix_live_activities_created_at" in index_names
    assert "ix_live_activities_event_type" in index_names


async def test_live_activity_insert(db_session):
    activity = LiveActivity(
        session_id="s1",
        event_type="purchase",
        description="Order placed",
        order_value="99.90",
    )
    db_session.add(activity)
    await db_session.commit()
    await db_session.refresh(activity)

    assert activity.id is not None
    assert activity.event_type == "purchase"
    assert float(activity.order_value) == 99.90
    assert activity.created_at is not None


def test_cohort_retention_columns_and_index():
    table = CohortRetention.__table__
    for name in (
        "id",
        "cohort_month",
        "months_since",
        "cohort_size",
        "active_customers",
        "retention_rate",
        "created_at",
    ):
        assert name in table.columns.keys()
    index_names = {ix.name for ix in table.indexes}
    assert "ix_cohort_retention_cohort_month" in index_names


async def test_cohort_retention_insert_defaults(db_session):
    cohort = CohortRetention(cohort_month="2025-01")
    db_session.add(cohort)
    await db_session.commit()
    await db_session.refresh(cohort)

    assert cohort.id is not None
    assert cohort.months_since == 0
    assert cohort.cohort_size == 0
    assert cohort.active_customers == 0
    assert cohort.retention_rate == 0.0


async def test_daily_snapshot_and_report_roundtrip(db_session):
    from datetime import datetime

    snapshot = DailySnapshot(
        snapshot_date=datetime.now(),
        metric_type="sessions",
        gross_sales="1234.50",
        sessions=42,
        sessions_desktop=30,
        sessions_mobile=12,
    )
    report = Report(name="Traffic", category="Acquisition", created_by="alice")
    db_session.add_all([snapshot, report])
    await db_session.commit()

    result = await db_session.execute(select(func.count(DailySnapshot.id)))
    assert result.scalar() == 1
    result = await db_session.execute(select(func.count(Report.id)))
    assert result.scalar() == 1
