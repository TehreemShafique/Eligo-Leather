"""Tests for ``app.modules.growth.service``."""

import pytest

from app.modules.growth import service
from app.modules.growth.model import CampaignStatus
from app.modules.growth.schema import (
    AttributionCreate,
    AttributionUpdate,
    CampaignCreate,
    CampaignUpdate,
)


async def test_create_attribution_returns_record(db_session):
    record = await service.create_attribution(
        db_session, AttributionCreate(channel="Google Search", type="Organic")
    )
    assert record.id is not None
    assert record.channel == "Google Search"
    assert record.type == "Organic"
    assert record.sessions == 0
    assert record.sales == 0


async def test_get_attribution_found(db_session):
    created = await service.create_attribution(
        db_session, AttributionCreate(channel="Facebook", type="Organic")
    )
    fetched = await service.get_attribution(db_session, created.id)
    assert fetched is not None
    assert fetched.id == created.id
    assert fetched.channel == "Facebook"


async def test_get_attribution_missing_returns_none(db_session):
    assert await service.get_attribution(db_session, 999999) is None


async def test_list_attributions_filters(db_session):
    await service.create_attribution(
        db_session,
        AttributionCreate(channel="Google Search", type="Organic", referring_url="google.com"),
    )
    await service.create_attribution(
        db_session,
        AttributionCreate(channel="Facebook", type="Organic", referring_url="facebook.com"),
    )
    await service.create_attribution(
        db_session,
        AttributionCreate(channel="Instagram", type="Direct", referring_url="instagram.com"),
    )

    by_channel = await service.list_attributions(db_session, channel="Facebook")
    assert len(by_channel) == 1
    assert by_channel[0].channel == "Facebook"

    by_type = await service.list_attributions(db_session, traffic_type="Direct")
    assert len(by_type) == 1
    assert by_type[0].channel == "Instagram"

    by_search = await service.list_attributions(db_session, search="facebook")
    assert len(by_search) == 1
    assert by_search[0].channel == "Facebook"

    all_records = await service.list_attributions(db_session)
    assert len(all_records) == 3


async def test_update_attribution(db_session):
    created = await service.create_attribution(
        db_session, AttributionCreate(channel="Bing", type="Organic")
    )
    updated = await service.update_attribution(
        db_session, created.id, AttributionUpdate(sessions=5, sales=150.0)
    )
    assert updated is not None
    assert updated.sessions == 5
    assert updated.sales == 150.0
    assert updated.channel == "Bing"


async def test_update_attribution_missing_returns_none(db_session):
    assert (
        await service.update_attribution(
            db_session, 999999, AttributionUpdate(sessions=1)
        )
        is None
    )


async def test_delete_attribution(db_session):
    created = await service.create_attribution(
        db_session, AttributionCreate(channel="Bing", type="Organic")
    )
    assert await service.delete_attribution(db_session, created.id) is True
    assert await service.get_attribution(db_session, created.id) is None


async def test_delete_attribution_missing_returns_false(db_session):
    assert await service.delete_attribution(db_session, 999999) is False


async def test_create_campaign_defaults(db_session):
    campaign = await service.create_campaign(
        db_session, CampaignCreate(campaign_name="Summer Sale")
    )
    assert campaign.id is not None
    assert campaign.campaign_name == "Summer Sale"
    assert campaign.status == CampaignStatus.draft
    assert campaign.unassigned_activities_count == 0


async def test_get_campaign_missing_returns_none(db_session):
    assert await service.get_campaign(db_session, 999999) is None


async def test_list_campaigns_search(db_session):
    await service.create_campaign(db_session, CampaignCreate(campaign_name="Summer Sale"))
    await service.create_campaign(db_session, CampaignCreate(campaign_name="Winter Sale"))
    results = await service.list_campaigns(db_session, search="Summer")
    assert len(results) == 1
    assert results[0].campaign_name == "Summer Sale"


async def test_update_campaign(db_session):
    created = await service.create_campaign(
        db_session, CampaignCreate(campaign_name="Summer Sale")
    )
    updated = await service.update_campaign(
        db_session, created.id, CampaignUpdate(status="Active")
    )
    assert updated is not None
    assert updated.status == CampaignStatus.active


async def test_update_campaign_missing_returns_none(db_session):
    assert (
        await service.update_campaign(
            db_session, 999999, CampaignUpdate(campaign_name="Nope")
        )
        is None
    )


async def test_delete_campaign(db_session):
    created = await service.create_campaign(
        db_session, CampaignCreate(campaign_name="Summer Sale")
    )
    assert await service.delete_campaign(db_session, created.id) is True
    assert await service.get_campaign(db_session, created.id) is None


async def test_delete_campaign_missing_returns_false(db_session):
    assert await service.delete_campaign(db_session, 999999) is False


async def test_growth_overview_empty(db_session):
    overview = await service.get_growth_overview(db_session)
    assert overview.total_store_sales == 0.0
    assert overview.marketing_attributed_sales == 0.0
    assert overview.total_sessions == 0
    assert overview.total_orders == 0
    assert overview.total_marketing_spend == 0.0
    assert overview.overall_roas == 0.0
    assert overview.sessions_by_traffic_type == []
    assert overview.top_channels == []


async def test_growth_overview_with_data(db_session):
    await service.create_attribution(
        db_session,
        AttributionCreate(
            channel="Google Search",
            type="Organic",
            sessions=100,
            sales=1000,
            orders=10,
            cost=100,
        ),
    )
    await service.create_attribution(
        db_session,
        AttributionCreate(channel="Direct", type="Direct", sales=500),
    )

    overview = await service.get_growth_overview(db_session)
    assert overview.total_store_sales == 1500.0
    assert overview.marketing_attributed_sales == 1000.0
    assert overview.marketing_sales_percentage == 66.67
    assert overview.total_sessions == 100
    assert overview.total_orders == 10
    assert overview.overall_conversion_rate == 10.0
    assert overview.overall_aov == 150.0
    assert overview.total_marketing_spend == 100.0
    assert overview.overall_roas == 15.0

    assert len(overview.sessions_by_traffic_type) == 2
    by_type = {row.traffic_type: row for row in overview.sessions_by_traffic_type}
    assert by_type["Organic"].sessions == 100
    assert by_type["Organic"].percentage == 100.0
    assert by_type["Direct"].sessions == 0

    assert len(overview.top_channels) == 2
    assert overview.top_channels[0].channel == "Google Search"
    assert overview.top_channels[0].sales == 1000.0
