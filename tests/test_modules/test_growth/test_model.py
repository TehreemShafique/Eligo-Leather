"""Tests for ``app.modules.growth.model``."""

from app.db.base import Base
from app.modules.growth.model import (
    AttributionChannel,
    TrafficType,
    CampaignStatus,
    Attribution,
    Campaign,
)


def test_growth_tables_registered():
    tables = Base.metadata.tables
    assert "attribution" in tables
    assert "campaigns" in tables


def test_attribution_columns():
    cols = Base.metadata.tables["attribution"].columns.keys()
    for name in [
        "id",
        "channel",
        "type",
        "sessions",
        "sales",
        "orders",
        "conversion_rate",
        "cost",
        "roas",
        "cpa",
        "ctr",
        "aov",
        "orders_from_new_customers",
        "orders_from_returning_customers",
        "referring_category",
        "referring_url",
        "impressions",
        "clicks",
        "created_at",
    ]:
        assert name in cols


def test_campaign_columns():
    cols = Base.metadata.tables["campaigns"].columns.keys()
    for name in [
        "id",
        "campaign_name",
        "status",
        "unassigned_activities_count",
        "target_metrics",
        "created_at",
    ]:
        assert name in cols


def test_attribution_indexes():
    table = Base.metadata.tables["attribution"]
    index_names = {idx.name for idx in table.indexes}
    assert "ix_attribution_channel" in index_names
    assert "ix_attribution_type" in index_names
    assert "ix_attribution_created_at" in index_names


def test_campaign_indexes():
    table = Base.metadata.tables["campaigns"]
    index_names = {idx.name for idx in table.indexes}
    assert "ix_campaigns_status" in index_names
    assert "ix_campaigns_created_at" in index_names


def test_enum_values():
    assert {e.value for e in AttributionChannel} == {
        "Google Search",
        "Direct",
        "Bing",
        "chatgpt.com",
        "Instagram",
        "Yahoo!",
        "Facebook",
        "DuckDuckGo",
    }
    assert {e.value for e in TrafficType} == {"Organic", "Direct", "Unknown"}
    assert {e.value for e in CampaignStatus} == {"Active", "Draft", "Completed", "Paused"}


async def test_attribution_defaults_on_insert(db_session):
    record = Attribution(channel="Google Search", type="Organic")
    db_session.add(record)
    await db_session.commit()
    await db_session.refresh(record)

    assert record.id is not None
    assert record.channel == "Google Search"
    assert record.type == "Organic"
    assert record.sessions == 0
    assert record.sales == 0
    assert record.orders == 0
    assert record.impressions == 0
    assert record.clicks == 0
    assert record.created_at is not None


async def test_campaign_defaults_on_insert(db_session):
    campaign = Campaign(campaign_name="Summer Sale")
    db_session.add(campaign)
    await db_session.commit()
    await db_session.refresh(campaign)

    assert campaign.id is not None
    assert campaign.campaign_name == "Summer Sale"
    assert campaign.status == CampaignStatus.draft
    assert campaign.unassigned_activities_count == 0
    assert campaign.target_metrics is None
    assert campaign.created_at is not None
