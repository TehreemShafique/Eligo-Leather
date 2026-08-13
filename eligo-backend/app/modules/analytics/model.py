import enum
from datetime import datetime

from sqlalchemy import (
    String, Integer, Float, Boolean, Numeric, Text, DateTime,
    Index, Enum as SAEnum, func,
)
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


# ---------------------------------------------------------------------------
# Enums
# ---------------------------------------------------------------------------

class ReportCategory(str, enum.Enum):
    acquisition = "Acquisition"
    behavior = "Behavior"
    customers = "Customers"
    finances = "Finances"
    fraud = "Fraud"
    inventory = "Inventory"
    marketing = "Marketing"
    orders = "Orders"
    performance = "Performance"
    profit_margin = "Profit Margin"
    retail_sales = "Retail Sales"
    sales = "Sales"
    store = "Store"


class DeviceType(str, enum.Enum):
    desktop = "Desktop"
    mobile = "Mobile"
    tablet = "Tablet"
    unknown = "Unknown"


# ---------------------------------------------------------------------------
# Daily Snapshot – Pre-aggregated daily metrics
# ---------------------------------------------------------------------------

class DailySnapshot(Base):
    __tablename__ = "daily_snapshots"
    __table_args__ = (
        Index("ix_daily_snapshots_date", "snapshot_date"),
        Index("ix_daily_snapshots_type", "metric_type"),
    )

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    snapshot_date: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    metric_type: Mapped[str] = mapped_column(String, nullable=False)  # sales, sessions, orders, traffic, conversion

    # Core metrics
    gross_sales: Mapped[float] = mapped_column(Numeric(14, 2), default=0)
    discounts: Mapped[float] = mapped_column(Numeric(14, 2), default=0)
    sales_reversals: Mapped[float] = mapped_column(Numeric(14, 2), default=0)
    net_sales: Mapped[float] = mapped_column(Numeric(14, 2), default=0)
    shipping_charges: Mapped[float] = mapped_column(Numeric(14, 2), default=0)
    return_fees: Mapped[float] = mapped_column(Numeric(14, 2), default=0)
    taxes: Mapped[float] = mapped_column(Numeric(14, 2), default=0)
    total_sales: Mapped[float] = mapped_column(Numeric(14, 2), default=0)

    # Order metrics
    total_orders: Mapped[int] = mapped_column(Integer, default=0)
    orders_fulfilled: Mapped[int] = mapped_column(Integer, default=0)
    average_order_value: Mapped[float] = mapped_column(Numeric(10, 2), default=0)

    # Traffic metrics
    sessions: Mapped[int] = mapped_column(Integer, default=0)
    sessions_desktop: Mapped[int] = mapped_column(Integer, default=0)
    sessions_mobile: Mapped[int] = mapped_column(Integer, default=0)
    sessions_tablet: Mapped[int] = mapped_column(Integer, default=0)

    # Conversion funnel
    added_to_cart: Mapped[int] = mapped_column(Integer, default=0)
    reached_checkout: Mapped[int] = mapped_column(Integer, default=0)
    completed_orders: Mapped[int] = mapped_column(Integer, default=0)
    conversion_rate: Mapped[float] = mapped_column(Float, default=0.0)

    # Customer metrics
    returning_customer_rate: Mapped[float] = mapped_column(Float, default=0.0)
    new_customers: Mapped[int] = mapped_column(Integer, default=0)
    returning_customers: Mapped[int] = mapped_column(Integer, default=0)

    # Geographic
    country: Mapped[str | None] = mapped_column(String, nullable=True)
    region: Mapped[str | None] = mapped_column(String, nullable=True)
    city: Mapped[str | None] = mapped_column(String, nullable=True)

    # Channel / Source
    channel: Mapped[str | None] = mapped_column(String, nullable=True)
    landing_page: Mapped[str | None] = mapped_column(String, nullable=True)
    referrer: Mapped[str | None] = mapped_column(String, nullable=True)
    social_referrer: Mapped[str | None] = mapped_column(String, nullable=True)

    # Product
    product_id: Mapped[int | None] = mapped_column(Integer, nullable=True)
    product_name: Mapped[str | None] = mapped_column(String, nullable=True)
    vendor: Mapped[str | None] = mapped_column(String, nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


# ---------------------------------------------------------------------------
# Report – Saved report definitions
# ---------------------------------------------------------------------------

class Report(Base):
    __tablename__ = "reports"
    __table_args__ = (
        Index("ix_reports_category", "category"),
        Index("ix_reports_created_by", "created_by"),
    )

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String, nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    category: Mapped[str] = mapped_column(String, nullable=False)
    report_type: Mapped[str] = mapped_column(String, nullable=False, default="standard")
    query_params: Mapped[str | None] = mapped_column(Text, nullable=True)  # JSON
    created_by: Mapped[str] = mapped_column(String, nullable=False, default="System")
    is_system: Mapped[bool] = mapped_column(Boolean, default=False)
    last_viewed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    view_count: Mapped[int] = mapped_column(Integer, default=0)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


# ---------------------------------------------------------------------------
# Exploration – Custom ad-hoc queries
# ---------------------------------------------------------------------------

class Exploration(Base):
    __tablename__ = "explorations"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String, nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    query_config: Mapped[str] = mapped_column(Text, nullable=False)  # JSON: dimensions, metrics, filters, sort
    created_by: Mapped[str] = mapped_column(String, nullable=False, default="staff")
    last_viewed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


# ---------------------------------------------------------------------------
# Live Visitor – Active session tracking
# ---------------------------------------------------------------------------

class LiveVisitor(Base):
    __tablename__ = "live_visitors"
    __table_args__ = (
        Index("ix_live_visitors_session_id", "session_id"),
        Index("ix_live_visitors_last_active", "last_active_at"),
    )

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    session_id: Mapped[str] = mapped_column(String, unique=True, nullable=False)
    visitor_ip: Mapped[str | None] = mapped_column(String, nullable=True)
    visitor_country: Mapped[str | None] = mapped_column(String, nullable=True)
    visitor_region: Mapped[str | None] = mapped_column(String, nullable=True)
    visitor_city: Mapped[str | None] = mapped_column(String, nullable=True)
    latitude: Mapped[float | None] = mapped_column(Numeric(9, 6), nullable=True)
    longitude: Mapped[float | None] = mapped_column(Numeric(9, 6), nullable=True)
    device_type: Mapped[str] = mapped_column(String, default="unknown")
    browser: Mapped[str | None] = mapped_column(String, nullable=True)
    os: Mapped[str | None] = mapped_column(String, nullable=True)
    current_page: Mapped[str | None] = mapped_column(String, nullable=True)
    landing_page: Mapped[str | None] = mapped_column(String, nullable=True)
    referrer: Mapped[str | None] = mapped_column(String, nullable=True)
    has_cart: Mapped[bool] = mapped_column(Boolean, default=False)
    cart_value: Mapped[float] = mapped_column(Numeric(10, 2), default=0)
    is_checkout: Mapped[bool] = mapped_column(Boolean, default=False)
    customer_id: Mapped[int | None] = mapped_column(Integer, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

    last_active_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


# ---------------------------------------------------------------------------
# Live Activity – Real-time event stream
# ---------------------------------------------------------------------------

class LiveActivity(Base):
    __tablename__ = "live_activities"
    __table_args__ = (
        Index("ix_live_activities_created_at", "created_at"),
        Index("ix_live_activities_event_type", "event_type"),
    )

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    session_id: Mapped[str | None] = mapped_column(String, nullable=True)
    event_type: Mapped[str] = mapped_column(String, nullable=False)  # page_view, add_to_cart, begin_checkout, purchase, product_view
    visitor_city: Mapped[str | None] = mapped_column(String, nullable=True)
    visitor_country: Mapped[str | None] = mapped_column(String, nullable=True)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    product_name: Mapped[str | None] = mapped_column(String, nullable=True)
    order_number: Mapped[str | None] = mapped_column(String, nullable=True)
    order_value: Mapped[float | None] = mapped_column(Numeric(10, 2), nullable=True)
    page_url: Mapped[str | None] = mapped_column(String, nullable=True)
    metadata_json: Mapped[str | None] = mapped_column(Text, nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


# ---------------------------------------------------------------------------
# Cohort – Customer cohort retention data
# ---------------------------------------------------------------------------

class CohortRetention(Base):
    __tablename__ = "cohort_retention"
    __table_args__ = (
        Index("ix_cohort_retention_cohort_month", "cohort_month"),
    )

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    cohort_month: Mapped[str] = mapped_column(String(7), nullable=False)  # YYYY-MM
    months_since: Mapped[int] = mapped_column(Integer, default=0)
    cohort_size: Mapped[int] = mapped_column(Integer, default=0)
    active_customers: Mapped[int] = mapped_column(Integer, default=0)
    retention_rate: Mapped[float] = mapped_column(Float, default=0.0)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


    