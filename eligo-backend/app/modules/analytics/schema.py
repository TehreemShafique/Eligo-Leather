from datetime import datetime
from pydantic import BaseModel, ConfigDict

from app.modules.analytics.model import ReportCategory


# ===========================================================================
# Dashboard – Top-Level Metric Cards
# ===========================================================================

class TopMetrics(BaseModel):
    gross_sales: float = 0
    returning_customer_rate: float = 0
    orders_fulfilled: int = 0
    total_orders: int = 0

    model_config = ConfigDict(from_attributes=True)


# ===========================================================================
# Dashboard – Sales Breakdown
# ===========================================================================

class SalesBreakdown(BaseModel):
    gross_sales: float = 0
    discounts: float = 0
    sales_reversals: float = 0
    net_sales: float = 0
    shipping_charges: float = 0
    return_fees: float = 0
    taxes: float = 0
    total_sales: float = 0

    model_config = ConfigDict(from_attributes=True)


class TimeSeriesPoint(BaseModel):
    date: str
    value: float

    model_config = ConfigDict(from_attributes=True)


class SalesOverTime(BaseModel):
    data_points: list[TimeSeriesPoint] = []
    breakdown: SalesBreakdown

    model_config = ConfigDict(from_attributes=True)


# ===========================================================================
# Dashboard – Channel & Product Breakdown
# ===========================================================================

class ChannelSales(BaseModel):
    channel: str
    total_sales: float
    order_count: int

    model_config = ConfigDict(from_attributes=True)


class ProductSales(BaseModel):
    product_id: int | None = None
    product_name: str
    total_sales: float
    quantity_sold: int
    sell_through_rate: float = 0.0

    model_config = ConfigDict(from_attributes=True)


class VendorSales(BaseModel):
    vendor: str
    total_sales: float
    order_count: int

    model_config = ConfigDict(from_attributes=True)


# ===========================================================================
# Dashboard – Traffic & Conversion
# ===========================================================================

class ConversionFunnel(BaseModel):
    sessions: int = 0
    added_to_cart: int = 0
    reached_checkout: int = 0
    completed_orders: int = 0
    conversion_rate: float = 0.0

    model_config = ConfigDict(from_attributes=True)


class DeviceBreakdown(BaseModel):
    device_type: str
    sessions: int
    percentage: float

    model_config = ConfigDict(from_attributes=True)


class LocationSessions(BaseModel):
    country: str
    region: str | None = None
    city: str | None = None
    sessions: int

    model_config = ConfigDict(from_attributes=True)


class LandingPageStat(BaseModel):
    page_url: str
    sessions: int
    bounce_rate: float = 0.0

    model_config = ConfigDict(from_attributes=True)


class SocialReferrerStat(BaseModel):
    referrer: str
    sessions: int

    model_config = ConfigDict(from_attributes=True)


class ReferrerStat(BaseModel):
    referrer: str
    sessions: int
    cities: list[str] = []

    model_config = ConfigDict(from_attributes=True)


# ===========================================================================
# Dashboard – Cohort Analysis
# ===========================================================================

class CohortMonth(BaseModel):
    cohort_month: str
    months_since: int
    cohort_size: int
    active_customers: int
    retention_rate: float

    model_config = ConfigDict(from_attributes=True)


class CohortAnalysis(BaseModel):
    cohorts: list[CohortMonth] = []

    model_config = ConfigDict(from_attributes=True)


# ===========================================================================
# Dashboard – Full Analytics Overview
# ===========================================================================

class AnalyticsOverview(BaseModel):
    top_metrics: TopMetrics
    sales_over_time: SalesOverTime
    average_order_value: list[TimeSeriesPoint] = []
    sessions_over_time: list[TimeSeriesPoint] = []
    conversion_funnel: ConversionFunnel
    channels: list[ChannelSales] = []
    top_products: list[ProductSales] = []
    device_breakdown: list[DeviceBreakdown] = []
    locations: list[LocationSessions] = []
    landing_pages: list[LandingPageStat] = []
    social_referrers: list[SocialReferrerStat] = []
    referrers: list[ReferrerStat] = []
    cohort_analysis: CohortAnalysis

    model_config = ConfigDict(from_attributes=True)


# ===========================================================================
# Reports – CRUD
# ===========================================================================

class ReportCreate(BaseModel):
    name: str
    description: str | None = None
    category: str
    report_type: str = "standard"
    query_params: str | None = None  # JSON
    created_by: str = "System"


class ReportUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    category: str | None = None
    report_type: str | None = None
    query_params: str | None = None
    last_viewed_at: datetime | None = None


class ReportOut(BaseModel):
    id: int
    name: str
    description: str | None
    category: str
    report_type: str
    query_params: str | None
    created_by: str
    is_system: bool
    last_viewed_at: datetime | None
    view_count: int
    created_at: datetime
    updated_at: datetime
    model_config = ConfigDict(from_attributes=True)


# ===========================================================================
# Explorations – CRUD
# ===========================================================================

class ExplorationCreate(BaseModel):
    name: str
    description: str | None = None
    query_config: str  # JSON: {"dimensions": [...], "metrics": [...], "filters": [...], "sort": [...]}
    created_by: str = "staff"


class ExplorationUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    query_config: str | None = None
    last_viewed_at: datetime | None = None


class ExplorationOut(BaseModel):
    id: int
    name: str
    description: str | None
    query_config: str
    created_by: str
    last_viewed_at: datetime | None
    created_at: datetime
    updated_at: datetime
    model_config = ConfigDict(from_attributes=True)


# ===========================================================================
# Live View
# ===========================================================================

class LiveVisitorOut(BaseModel):
    id: int
    session_id: str
    visitor_country: str | None
    visitor_region: str | None
    visitor_city: str | None
    latitude: float | None
    longitude: float | None
    device_type: str
    current_page: str | None
    landing_page: str | None
    referrer: str | None
    has_cart: bool
    cart_value: float
    is_checkout: bool
    last_active_at: datetime
    model_config = ConfigDict(from_attributes=True)


class LiveActivityOut(BaseModel):
    id: int
    session_id: str | None
    event_type: str
    visitor_city: str | None
    visitor_country: str | None
    description: str
    product_name: str | None
    order_number: str | None
    order_value: float | None
    page_url: str | None
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)


class LiveMetrics(BaseModel):
    active_visitors: int = 0
    active_carts: int = 0
    checkouts_in_progress: int = 0
    recent_purchases: int = 0  # purchases in last 60 seconds

    model_config = ConfigDict(from_attributes=True)


class LiveViewSnapshot(BaseModel):
    metrics: LiveMetrics
    visitors: list[LiveVisitorOut] = []
    recent_activities: list[LiveActivityOut] = []

    model_config = ConfigDict(from_attributes=True)
