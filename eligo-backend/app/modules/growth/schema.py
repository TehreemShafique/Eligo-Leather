from datetime import datetime
from pydantic import BaseModel, ConfigDict

from app.modules.growth.model import CampaignStatus


# ---------------------------------------------------------------------------
# Attribution – Create / Update / Response
# ---------------------------------------------------------------------------

class AttributionCreate(BaseModel):
    channel: str
    type: str
    sessions: int = 0
    sales: float = 0
    orders: int = 0
    conversion_rate: float = 0.0
    cost: float = 0
    roas: float = 0
    cpa: float = 0
    ctr: float = 0
    aov: float = 0
    orders_from_new_customers: int = 0
    orders_from_returning_customers: int = 0
    referring_category: str | None = None
    referring_url: str | None = None
    impressions: int = 0
    clicks: int = 0


class AttributionUpdate(BaseModel):
    channel: str | None = None
    type: str | None = None
    sessions: int | None = None
    sales: float | None = None
    orders: int | None = None
    conversion_rate: float | None = None
    cost: float | None = None
    roas: float | None = None
    cpa: float | None = None
    ctr: float | None = None
    aov: float | None = None
    orders_from_new_customers: int | None = None
    orders_from_returning_customers: int | None = None
    referring_category: str | None = None
    referring_url: str | None = None
    impressions: int | None = None
    clicks: int | None = None


class AttributionOut(BaseModel):
    id: int
    channel: str
    type: str
    sessions: int
    sales: float
    orders: int
    conversion_rate: float
    cost: float
    roas: float
    cpa: float
    ctr: float
    aov: float
    orders_from_new_customers: int
    orders_from_returning_customers: int
    referring_category: str | None
    referring_url: str | None
    impressions: int
    clicks: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ---------------------------------------------------------------------------
# Campaign – Create / Update / Response
# ---------------------------------------------------------------------------

class CampaignCreate(BaseModel):
    campaign_name: str
    status: CampaignStatus = CampaignStatus.draft
    unassigned_activities_count: int = 0
    target_metrics: str | None = None


class CampaignUpdate(BaseModel):
    campaign_name: str | None = None
    status: CampaignStatus | None = None
    unassigned_activities_count: int | None = None
    target_metrics: str | None = None


class CampaignOut(BaseModel):
    id: int
    campaign_name: str
    status: CampaignStatus
    unassigned_activities_count: int
    target_metrics: str | None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ---------------------------------------------------------------------------
# Growth Overview – Analytics / Summary schemas
# ---------------------------------------------------------------------------

class TrafficTypeBreakdown(BaseModel):
    traffic_type: str
    sessions: int
    percentage: float

    model_config = ConfigDict(from_attributes=True)


class ChannelPerformance(BaseModel):
    channel: str
    sessions: int
    sales: float
    orders: int
    conversion_rate: float
    roas: float

    model_config = ConfigDict(from_attributes=True)


class GrowthOverview(BaseModel):
    total_store_sales: float
    marketing_attributed_sales: float
    marketing_sales_percentage: float
    total_sessions: int
    total_orders: int
    total_new_customer_orders: int
    total_returning_customer_orders: int
    overall_conversion_rate: float
    overall_aov: float
    total_marketing_spend: float
    overall_roas: float
    sessions_by_traffic_type: list[TrafficTypeBreakdown]
    top_channels: list[ChannelPerformance]

    model_config = ConfigDict(from_attributes=True)
