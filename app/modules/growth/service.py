import json
from datetime import datetime, timedelta, timezone

from sqlalchemy import select, func, cast, Date, or_
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.growth.model import Attribution, Campaign
from app.modules.growth.schema import (
    AttributionCreate,
    AttributionUpdate,
    CampaignCreate,
    CampaignUpdate,
    GrowthOverview,
    TrafficTypeBreakdown,
    ChannelPerformance,
)


# ---------------------------------------------------------------------------
# Attribution – CRUD
# ---------------------------------------------------------------------------

async def create_attribution(
    db: AsyncSession, data: AttributionCreate,
) -> Attribution:
    record = Attribution(**data.model_dump())
    db.add(record)
    await db.commit()
    await db.refresh(record)
    return record


async def get_attribution(
    db: AsyncSession, record_id: int,
) -> Attribution | None:
    result = await db.execute(
        select(Attribution).where(Attribution.id == record_id),
    )
    return result.scalar_one_or_none()


async def list_attributions(
    db: AsyncSession,
    search: str | None = None,
    channel: str | None = None,
    traffic_type: str | None = None,
    start_date: datetime | None = None,
    end_date: datetime | None = None,
    skip: int = 0,
    limit: int = 50,
) -> list[Attribution]:
    query = select(Attribution)

    if search:
        query = query.where(
            or_(
                Attribution.channel.ilike(f"%{search}%"),
                Attribution.referring_url.ilike(f"%{search}%"),
                Attribution.referring_category.ilike(f"%{search}%"),
            ),
        )
    if channel:
        query = query.where(Attribution.channel == channel)
    if traffic_type:
        query = query.where(Attribution.type == traffic_type)
    if start_date:
        query = query.where(Attribution.created_at >= start_date)
    if end_date:
        query = query.where(Attribution.created_at <= end_date)

    query = query.order_by(Attribution.created_at.desc()).offset(skip).limit(limit)
    result = await db.execute(query)
    return list(result.scalars().all())


async def update_attribution(
    db: AsyncSession, record_id: int, data: AttributionUpdate,
) -> Attribution | None:
    record = await get_attribution(db, record_id)
    if not record:
        return None
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(record, field, value)
    await db.commit()
    await db.refresh(record)
    return record


async def delete_attribution(db: AsyncSession, record_id: int) -> bool:
    record = await get_attribution(db, record_id)
    if not record:
        return False
    await db.delete(record)
    await db.commit()
    return True


# ---------------------------------------------------------------------------
# Campaign – CRUD
# ---------------------------------------------------------------------------

async def create_campaign(
    db: AsyncSession, data: CampaignCreate,
) -> Campaign:
    record = Campaign(**data.model_dump())
    db.add(record)
    await db.commit()
    await db.refresh(record)
    return record


async def get_campaign(
    db: AsyncSession, record_id: int,
) -> Campaign | None:
    result = await db.execute(
        select(Campaign).where(Campaign.id == record_id),
    )
    return result.scalar_one_or_none()


async def list_campaigns(
    db: AsyncSession,
    search: str | None = None,
    status: str | None = None,
    start_date: datetime | None = None,
    end_date: datetime | None = None,
    skip: int = 0,
    limit: int = 50,
) -> list[Campaign]:
    query = select(Campaign)

    if search:
        query = query.where(
            Campaign.campaign_name.ilike(f"%{search}%"),
        )
    if status:
        query = query.where(Campaign.status == status)
    if start_date:
        query = query.where(Campaign.created_at >= start_date)
    if end_date:
        query = query.where(Campaign.created_at <= end_date)

    query = query.order_by(Campaign.created_at.desc()).offset(skip).limit(limit)
    result = await db.execute(query)
    return list(result.scalars().all())


async def update_campaign(
    db: AsyncSession, record_id: int, data: CampaignUpdate,
) -> Campaign | None:
    record = await get_campaign(db, record_id)
    if not record:
        return None
    dump = data.model_dump(exclude_unset=True)
    if "target_metrics" in dump and isinstance(dump["target_metrics"], dict):
        dump["target_metrics"] = json.dumps(dump["target_metrics"])
    for field, value in dump.items():
        setattr(record, field, value)
    await db.commit()
    await db.refresh(record)
    return record


async def delete_campaign(db: AsyncSession, record_id: int) -> bool:
    record = await get_campaign(db, record_id)
    if not record:
        return False
    await db.delete(record)
    await db.commit()
    return True


# ---------------------------------------------------------------------------
# Growth Overview – Analytics aggregations
# ---------------------------------------------------------------------------

async def get_growth_overview(
    db: AsyncSession,
    start_date: datetime | None = None,
    end_date: datetime | None = None,
) -> GrowthOverview:
    base_filter = []
    if start_date:
        base_filter.append(Attribution.created_at >= start_date)
    if end_date:
        base_filter.append(Attribution.created_at <= end_date)

    # --- Aggregate totals from attribution table ---
    agg_query = select(
        func.coalesce(func.sum(Attribution.sales), 0).label("total_sales"),
        func.coalesce(func.sum(Attribution.sessions), 0).label("total_sessions"),
        func.coalesce(func.sum(Attribution.orders), 0).label("total_orders"),
        func.coalesce(func.sum(Attribution.cost), 0).label("total_cost"),
        func.coalesce(func.sum(Attribution.orders_from_new_customers), 0).label("new_orders"),
        func.coalesce(func.sum(Attribution.orders_from_returning_customers), 0).label("returning_orders"),
    )
    if base_filter:
        agg_query = agg_query.where(*base_filter)

    agg_result = await db.execute(agg_query)
    row = agg_result.one()

    total_sales = float(row.total_sales)
    total_sessions = int(row.total_sessions)
    total_orders = int(row.total_orders)
    total_cost = float(row.total_cost)
    new_orders = int(row.new_orders)
    returning_orders = int(row.returning_orders)

    overall_conversion = (
        (total_orders / total_sessions * 100) if total_sessions > 0 else 0.0
    )
    overall_aov = (total_sales / total_orders) if total_orders > 0 else 0.0
    overall_roas = (total_sales / total_cost) if total_cost > 0 else 0.0

    # --- Marketing-attributed sales (exclude "Direct" type) ---
    mktg_query = select(
        func.coalesce(func.sum(Attribution.sales), 0),
    ).where(Attribution.type != "Direct")
    if base_filter:
        mktg_query = mktg_query.where(*base_filter)

    mktg_result = await db.execute(mktg_query)
    marketing_sales = float(mktg_result.scalar())
    marketing_pct = (
        (marketing_sales / total_sales * 100) if total_sales > 0 else 0.0
    )

    # --- Sessions by traffic type ---
    traffic_query = select(
        Attribution.type.label("traffic_type"),
        func.coalesce(func.sum(Attribution.sessions), 0).label("sessions"),
    )
    if base_filter:
        traffic_query = traffic_query.where(*base_filter)
    traffic_query = traffic_query.group_by(Attribution.type)

    traffic_result = await db.execute(traffic_query)
    sessions_by_type: list[TrafficTypeBreakdown] = []
    for trow in traffic_result.all():
        sessions_val = int(trow.sessions)
        pct = (sessions_val / total_sessions * 100) if total_sessions > 0 else 0.0
        sessions_by_type.append(
            TrafficTypeBreakdown(
                traffic_type=trow.traffic_type,
                sessions=sessions_val,
                percentage=round(pct, 2),
            ),
        )

    # --- Top channel performance ---
    channel_query = select(
        Attribution.channel,
        func.coalesce(func.sum(Attribution.sessions), 0).label("sessions"),
        func.coalesce(func.sum(Attribution.sales), 0).label("sales"),
        func.coalesce(func.sum(Attribution.orders), 0).label("orders"),
        func.coalesce(func.avg(Attribution.conversion_rate), 0).label("conversion_rate"),
        func.coalesce(func.avg(Attribution.roas), 0).label("roas"),
    )
    if base_filter:
        channel_query = channel_query.where(*base_filter)
    channel_query = (
        channel_query
        .group_by(Attribution.channel)
        .order_by(func.sum(Attribution.sales).desc())
        .limit(10)
    )

    channel_result = await db.execute(channel_query)
    top_channels: list[ChannelPerformance] = []
    for crow in channel_result.all():
        top_channels.append(
            ChannelPerformance(
                channel=crow.channel,
                sessions=int(crow.sessions),
                sales=float(crow.sales),
                orders=int(crow.orders),
                conversion_rate=round(float(crow.conversion_rate), 2),
                roas=round(float(crow.roas), 4),
            ),
        )

    return GrowthOverview(
        total_store_sales=round(total_sales, 2),
        marketing_attributed_sales=round(marketing_sales, 2),
        marketing_sales_percentage=round(marketing_pct, 2),
        total_sessions=total_sessions,
        total_orders=total_orders,
        total_new_customer_orders=new_orders,
        total_returning_customer_orders=returning_orders,
        overall_conversion_rate=round(overall_conversion, 2),
        overall_aov=round(overall_aov, 2),
        total_marketing_spend=round(total_cost, 2),
        overall_roas=round(overall_roas, 4),
        sessions_by_traffic_type=sessions_by_type,
        top_channels=top_channels,
    )
