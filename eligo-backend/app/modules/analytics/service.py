import json
from datetime import datetime, timedelta, timezone

from sqlalchemy import select, func, and_, or_, cast, Date, case, literal_column
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.analytics.model import (
    DailySnapshot, Report, Exploration, LiveVisitor, LiveActivity, CohortRetention,
)
from app.modules.analytics.schema import (
    TopMetrics, SalesBreakdown, TimeSeriesPoint, SalesOverTime,
    ChannelSales, ProductSales, VendorSales,
    ConversionFunnel, DeviceBreakdown, LocationSessions,
    LandingPageStat, SocialReferrerStat, ReferrerStat,
    CohortMonth, CohortAnalysis, AnalyticsOverview,
    ReportCreate, ReportUpdate,
    ExplorationCreate, ExplorationUpdate,
    LiveMetrics, LiveViewSnapshot,
)
from app.modules.orders.model import Order, OrderItem, PaymentStatus, FulfillmentStatus
from app.modules.customers.model import Customer
from app.modules.growth.model import Attribution


# ===========================================================================
# Helper: Date range filter
# ===========================================================================

def _default_date_range(
    start_date: datetime | None,
    end_date: datetime | None,
) -> tuple[datetime, datetime]:
    now = datetime.now(timezone.utc)
    if not end_date:
        end_date = now
    if not start_date:
        start_date = now - timedelta(days=30)
    return start_date, end_date


# ===========================================================================
# Analytics Dashboard
# ===========================================================================

async def get_analytics_overview(
    db: AsyncSession,
    start_date: datetime | None = None,
    end_date: datetime | None = None,
    currency: str = "PKR",
) -> AnalyticsOverview:
    start_date, end_date = _default_date_range(start_date, end_date)

    # --- Top Metrics ---
    top_metrics = await _get_top_metrics(db, start_date, end_date)

    # --- Sales Over Time ---
    sales_over_time = await _get_sales_over_time(db, start_date, end_date)

    # --- Average Order Value Over Time ---
    aov_series = await _get_aov_over_time(db, start_date, end_date)

    # --- Sessions Over Time ---
    sessions_series = await _get_sessions_over_time(db, start_date, end_date)

    # --- Conversion Funnel ---
    conversion_funnel = await _get_conversion_funnel(db, start_date, end_date)

    # --- Channel Sales ---
    channels = await _get_channel_sales(db, start_date, end_date)

    # --- Top Products ---
    top_products = await _get_top_products(db, start_date, end_date)

    # --- Device Breakdown ---
    device_breakdown = await _get_device_breakdown(db, start_date, end_date)

    # --- Locations ---
    locations = await _get_locations(db, start_date, end_date)

    # --- Landing Pages ---
    landing_pages = await _get_landing_pages(db, start_date, end_date)

    # --- Social Referrers ---
    social_referrers = await _get_social_referrers(db, start_date, end_date)

    # --- Referrers ---
    referrers = await _get_referrers(db, start_date, end_date)

    # --- Cohort Analysis ---
    cohort_analysis = await _get_cohort_analysis(db)

    return AnalyticsOverview(
        top_metrics=top_metrics,
        sales_over_time=sales_over_time,
        average_order_value=aov_series,
        sessions_over_time=sessions_series,
        conversion_funnel=conversion_funnel,
        channels=channels,
        top_products=top_products,
        device_breakdown=device_breakdown,
        locations=locations,
        landing_pages=landing_pages,
        social_referrers=social_referrers,
        referrers=referrers,
        cohort_analysis=cohort_analysis,
    )


async def _get_top_metrics(
    db: AsyncSession, start: datetime, end: datetime,
) -> TopMetrics:
    # Gross sales
    sales_q = select(
        func.coalesce(func.sum(Order.total_price), 0),
    ).where(
        and_(Order.created_at >= start, Order.created_at <= end),
        Order.is_archived == False,
    )
    gross_sales = float((await db.execute(sales_q)).scalar() or 0)

    # Total orders
    orders_q = select(func.count(Order.id)).where(
        and_(Order.created_at >= start, Order.created_at <= end),
        Order.is_archived == False,
    )
    total_orders = int((await db.execute(orders_q)).scalar() or 0)

    # Orders fulfilled
    fulfilled_q = select(func.count(Order.id)).where(
        and_(Order.created_at >= start, Order.created_at <= end),
        Order.fulfillment_status == FulfillmentStatus.fulfilled,
        Order.is_archived == False,
    )
    orders_fulfilled = int((await db.execute(fulfilled_q)).scalar() or 0)

    # Returning customer rate
    total_customers_q = select(func.count(Customer.id))
    total_customers = int((await db.execute(total_customers_q)).scalar() or 1)

    returning_q = select(func.count(Customer.id)).where(Customer.total_orders > 1)
    returning_customers = int((await db.execute(returning_q)).scalar() or 0)
    returning_rate = (returning_customers / total_customers * 100) if total_customers > 0 else 0.0

    return TopMetrics(
        gross_sales=round(gross_sales, 2),
        returning_customer_rate=round(returning_rate, 2),
        orders_fulfilled=orders_fulfilled,
        total_orders=total_orders,
    )


async def _get_sales_over_time(
    db: AsyncSession, start: datetime, end: datetime,
) -> SalesOverTime:
    # Aggregate daily sales
    query = select(
        cast(Order.created_at, Date).label("day"),
        func.coalesce(func.sum(Order.total_price), 0).label("total"),
        func.coalesce(
            func.sum(
                case((Order.payment_status == PaymentStatus.refunded, Order.total_price), else_=0)
            ), 0
        ).label("refunds"),
    ).where(
        and_(Order.created_at >= start, Order.created_at <= end),
        Order.is_archived == False,
    ).group_by(
        cast(Order.created_at, Date),
    ).order_by(
        cast(Order.created_at, Date),
    )

    result = await db.execute(query)
    rows = result.all()

    data_points = []
    total_gross = 0.0
    total_refunds = 0.0
    for row in rows:
        val = float(row.total)
        total_gross += val
        total_refunds += float(row.refunds)
        data_points.append(TimeSeriesPoint(date=str(row.day), value=round(val, 2)))

    discounts = total_gross * 0.05  # Placeholder – would need discount table join
    net_sales = total_gross - discounts - total_refunds

    breakdown = SalesBreakdown(
        gross_sales=round(total_gross, 2),
        discounts=round(discounts, 2),
        sales_reversals=round(total_refunds, 2),
        net_sales=round(net_sales, 2),
        shipping_charges=0.0,
        return_fees=0.0,
        taxes=0.0,
        total_sales=round(net_sales, 2),
    )

    return SalesOverTime(data_points=data_points, breakdown=breakdown)


async def _get_aov_over_time(
    db: AsyncSession, start: datetime, end: datetime,
) -> list[TimeSeriesPoint]:
    query = select(
        cast(Order.created_at, Date).label("day"),
        func.coalesce(func.avg(Order.total_price), 0).label("aov"),
    ).where(
        and_(Order.created_at >= start, Order.created_at <= end),
        Order.is_archived == False,
    ).group_by(
        cast(Order.created_at, Date),
    ).order_by(cast(Order.created_at, Date))

    result = await db.execute(query)
    return [TimeSeriesPoint(date=str(r.day), value=round(float(r.aov), 2)) for r in result.all()]


async def _get_sessions_over_time(
    db: AsyncSession, start: datetime, end: datetime,
) -> list[TimeSeriesPoint]:
    query = select(
        DailySnapshot.snapshot_date.label("day"),
        func.sum(DailySnapshot.sessions).label("total"),
    ).where(
        and_(
            DailySnapshot.snapshot_date >= start,
            DailySnapshot.snapshot_date <= end,
            DailySnapshot.metric_type == "sessions",
        )
    ).group_by(DailySnapshot.snapshot_date).order_by(DailySnapshot.snapshot_date)

    result = await db.execute(query)
    return [TimeSeriesPoint(date=str(r.day), value=float(r.total)) for r in result.all()]


async def _get_conversion_funnel(
    db: AsyncSession, start: datetime, end: datetime,
) -> ConversionFunnel:
    q = select(
        func.coalesce(func.sum(DailySnapshot.sessions), 0).label("sessions"),
        func.coalesce(func.sum(DailySnapshot.added_to_cart), 0).label("cart"),
        func.coalesce(func.sum(DailySnapshot.reached_checkout), 0).label("checkout"),
        func.coalesce(func.sum(DailySnapshot.completed_orders), 0).label("completed"),
    ).where(
        and_(
            DailySnapshot.snapshot_date >= start,
            DailySnapshot.snapshot_date <= end,
            DailySnapshot.metric_type == "sessions",
        )
    )
    row = (await db.execute(q)).one()
    sessions = int(row.sessions)
    completed = int(row.completed)
    rate = (completed / sessions * 100) if sessions > 0 else 0.0

    return ConversionFunnel(
        sessions=sessions,
        added_to_cart=int(row.cart),
        reached_checkout=int(row.checkout),
        completed_orders=completed,
        conversion_rate=round(rate, 2),
    )


async def _get_channel_sales(
    db: AsyncSession, start: datetime, end: datetime,
) -> list[ChannelSales]:
    q = select(
        Order.channel,
        func.coalesce(func.sum(Order.total_price), 0).label("sales"),
        func.count(Order.id).label("orders"),
    ).where(
        and_(Order.created_at >= start, Order.created_at <= end),
        Order.is_archived == False,
    ).group_by(Order.channel).order_by(func.sum(Order.total_price).desc())

    result = await db.execute(q)
    return [
        ChannelSales(channel=r.channel, total_sales=round(float(r.sales), 2), order_count=r.orders)
        for r in result.all()
    ]


async def _get_top_products(
    db: AsyncSession, start: datetime, end: datetime, limit: int = 10,
) -> list[ProductSales]:
    q = select(
        OrderItem.product_id,
        OrderItem.product_name,
        func.coalesce(func.sum(OrderItem.total_price), 0).label("sales"),
        func.coalesce(func.sum(OrderItem.quantity), 0).label("qty"),
    ).join(Order, OrderItem.order_id == Order.id).where(
        and_(Order.created_at >= start, Order.created_at <= end),
        Order.is_archived == False,
    ).group_by(
        OrderItem.product_id, OrderItem.product_name,
    ).order_by(func.sum(OrderItem.total_price).desc()).limit(limit)

    result = await db.execute(q)
    return [
        ProductSales(
            product_id=r.product_id,
            product_name=r.product_name,
            total_sales=round(float(r.sales), 2),
            quantity_sold=int(r.qty),
        )
        for r in result.all()
    ]


async def _get_device_breakdown(
    db: AsyncSession, start: datetime, end: datetime,
) -> list[DeviceBreakdown]:
    q = select(
        DailySnapshot.device_type,
        func.coalesce(func.sum(DailySnapshot.sessions), 0).label("sessions"),
    ).where(
        and_(
            DailySnapshot.snapshot_date >= start,
            DailySnapshot.snapshot_date <= end,
            DailySnapshot.metric_type == "sessions",
        )
    ).group_by(DailySnapshot.device_type)

    result = await db.execute(q)
    rows = result.all()
    total = sum(int(r.sessions) for r in rows) or 1
    return [
        DeviceBreakdown(
            device_type=r.device_type,
            sessions=int(r.sessions),
            percentage=round(int(r.sessions) / total * 100, 2),
        )
        for r in rows
    ]


async def _get_locations(
    db: AsyncSession, start: datetime, end: datetime,
) -> list[LocationSessions]:
    q = select(
        DailySnapshot.country,
        DailySnapshot.region,
        DailySnapshot.city,
        func.coalesce(func.sum(DailySnapshot.sessions), 0).label("sessions"),
    ).where(
        and_(
            DailySnapshot.snapshot_date >= start,
            DailySnapshot.snapshot_date <= end,
            DailySnapshot.metric_type == "sessions",
            DailySnapshot.country.isnot(None),
        )
    ).group_by(
        DailySnapshot.country, DailySnapshot.region, DailySnapshot.city,
    ).order_by(func.sum(DailySnapshot.sessions).desc()).limit(20)

    result = await db.execute(q)
    return [
        LocationSessions(
            country=r.country, region=r.region, city=r.city, sessions=int(r.sessions),
        )
        for r in result.all()
    ]


async def _get_landing_pages(
    db: AsyncSession, start: datetime, end: datetime,
) -> list[LandingPageStat]:
    q = select(
        DailySnapshot.landing_page,
        func.coalesce(func.sum(DailySnapshot.sessions), 0).label("sessions"),
    ).where(
        and_(
            DailySnapshot.snapshot_date >= start,
            DailySnapshot.snapshot_date <= end,
            DailySnapshot.metric_type == "sessions",
            DailySnapshot.landing_page.isnot(None),
        )
    ).group_by(DailySnapshot.landing_page).order_by(
        func.sum(DailySnapshot.sessions).desc()
    ).limit(15)

    result = await db.execute(q)
    return [
        LandingPageStat(page_url=r.landing_page, sessions=int(r.sessions))
        for r in result.all()
    ]


async def _get_social_referrers(
    db: AsyncSession, start: datetime, end: datetime,
) -> list[SocialReferrerStat]:
    q = select(
        DailySnapshot.social_referrer,
        func.coalesce(func.sum(DailySnapshot.sessions), 0).label("sessions"),
    ).where(
        and_(
            DailySnapshot.snapshot_date >= start,
            DailySnapshot.snapshot_date <= end,
            DailySnapshot.metric_type == "sessions",
            DailySnapshot.social_referrer.isnot(None),
        )
    ).group_by(DailySnapshot.social_referrer).order_by(
        func.sum(DailySnapshot.sessions).desc()
    ).limit(10)

    result = await db.execute(q)
    return [
        SocialReferrerStat(referrer=r.social_referrer, sessions=int(r.sessions))
        for r in result.all()
    ]


async def _get_referrers(
    db: AsyncSession, start: datetime, end: datetime,
) -> list[ReferrerStat]:
    q = select(
        DailySnapshot.referrer,
        DailySnapshot.city,
        func.coalesce(func.sum(DailySnapshot.sessions), 0).label("sessions"),
    ).where(
        and_(
            DailySnapshot.snapshot_date >= start,
            DailySnapshot.snapshot_date <= end,
            DailySnapshot.metric_type == "sessions",
            DailySnapshot.referrer.isnot(None),
        )
    ).group_by(DailySnapshot.referrer, DailySnapshot.city)

    result = await db.execute(q)
    merged: dict[str, ReferrerStat] = {}
    for r in result.all():
        if r.referrer not in merged:
            merged[r.referrer] = ReferrerStat(referrer=r.referrer, sessions=0, cities=[])
        merged[r.referrer].sessions += int(r.sessions)
        if r.city and r.city not in merged[r.referrer].cities:
            merged[r.referrer].cities.append(r.city)
    return sorted(merged.values(), key=lambda x: x.sessions, reverse=True)[:10]


async def _get_cohort_analysis(db: AsyncSession) -> CohortAnalysis:
    q = select(CohortRetention).order_by(
        CohortRetention.cohort_month, CohortRetention.months_since,
    ).limit(200)
    result = await db.execute(q)
    return CohortAnalysis(
        cohorts=[
            CohortMonth(
                cohort_month=r.cohort_month,
                months_since=r.months_since,
                cohort_size=r.cohort_size,
                active_customers=r.active_customers,
                retention_rate=r.retention_rate,
            )
            for r in result.scalars().all()
        ]
    )


# ===========================================================================
# Reports – CRUD
# ===========================================================================

async def create_report(db: AsyncSession, data: ReportCreate) -> Report:
    report = Report(**data.model_dump())
    db.add(report)
    await db.commit()
    await db.refresh(report)
    return report


async def get_report(db: AsyncSession, report_id: int) -> Report | None:
    return await db.get(Report, report_id)


async def list_reports(
    db: AsyncSession,
    search: str | None = None,
    category: str | None = None,
    created_by: str | None = None,
    skip: int = 0,
    limit: int = 50,
) -> list[Report]:
    query = select(Report)

    if search:
        query = query.where(Report.name.ilike(f"%{search}%"))
    if category:
        query = query.where(Report.category == category)
    if created_by:
        query = query.where(Report.created_by == created_by)

    query = query.order_by(Report.updated_at.desc()).offset(skip).limit(limit)
    result = await db.execute(query)
    return list(result.scalars().all())


async def update_report(db: AsyncSession, report_id: int, data: ReportUpdate) -> Report | None:
    report = await get_report(db, report_id)
    if not report:
        return None
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(report, field, value)
    report.view_count += 1
    await db.commit()
    await db.refresh(report)
    return report


async def delete_report(db: AsyncSession, report_id: int) -> bool:
    report = await get_report(db, report_id)
    if not report:
        return False
    await db.delete(report)
    await db.commit()
    return True


# ===========================================================================
# Explorations – CRUD
# ===========================================================================

async def create_exploration(db: AsyncSession, data: ExplorationCreate) -> Exploration:
    exploration = Exploration(**data.model_dump())
    db.add(exploration)
    await db.commit()
    await db.refresh(exploration)
    return exploration


async def get_exploration(db: AsyncSession, exploration_id: int) -> Exploration | None:
    return await db.get(Exploration, exploration_id)


async def list_explorations(
    db: AsyncSession,
    search: str | None = None,
    created_by: str | None = None,
    skip: int = 0,
    limit: int = 50,
) -> list[Exploration]:
    query = select(Exploration)

    if search:
        query = query.where(Exploration.name.ilike(f"%{search}%"))
    if created_by:
        query = query.where(Exploration.created_by == created_by)

    query = query.order_by(Exploration.updated_at.desc()).offset(skip).limit(limit)
    result = await db.execute(query)
    return list(result.scalars().all())


async def update_exploration(db: AsyncSession, exploration_id: int, data: ExplorationUpdate) -> Exploration | None:
    exploration = await get_exploration(db, exploration_id)
    if not exploration:
        return None
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(exploration, field, value)
    await db.commit()
    await db.refresh(exploration)
    return exploration


async def delete_exploration(db: AsyncSession, exploration_id: int) -> bool:
    exploration = await get_exploration(db, exploration_id)
    if not exploration:
        return False
    await db.delete(exploration)
    await db.commit()
    return True


# ===========================================================================
# Live View
# ===========================================================================

async def get_live_view_snapshot(db: AsyncSession) -> LiveViewSnapshot:
    cutoff = datetime.now(timezone.utc) - timedelta(minutes=30)

    # Active visitors
    visitors_q = select(LiveVisitor).where(
        and_(LiveVisitor.is_active == True, LiveVisitor.last_active_at >= cutoff)
    ).order_by(LiveVisitor.last_active_at.desc()).limit(100)
    visitors_result = await db.execute(visitors_q)
    visitors = list(visitors_result.scalars().all())

    # Metrics
    metrics_q = select(
        func.count(LiveVisitor.id).label("active"),
        func.sum(case((LiveVisitor.has_cart == True, 1), else_=0)).label("carts"),
        func.sum(case((LiveVisitor.is_checkout == True, 1), else_=0)).label("checkouts"),
    ).where(
        and_(LiveVisitor.is_active == True, LiveVisitor.last_active_at >= cutoff)
    )
    metrics_row = (await db.execute(metrics_q)).one()

    # Recent purchases (last 60 seconds)
    purchase_cutoff = datetime.now(timezone.utc) - timedelta(seconds=60)
    purchase_q = select(func.count(LiveActivity.id)).where(
        and_(
            LiveActivity.event_type == "purchase",
            LiveActivity.created_at >= purchase_cutoff,
        )
    )
    recent_purchases = int((await db.execute(purchase_q)).scalar() or 0)

    # Recent activities
    activity_q = select(LiveActivity).order_by(LiveActivity.created_at.desc()).limit(50)
    activities_result = await db.execute(activity_q)
    activities = list(activities_result.scalars().all())

    return LiveViewSnapshot(
        metrics=LiveMetrics(
            active_visitors=int(metrics_row.active or 0),
            active_carts=int(metrics_row.carts or 0),
            checkouts_in_progress=int(metrics_row.checkouts or 0),
            recent_purchases=recent_purchases,
        ),
        visitors=visitors,
        recent_activities=activities,
    )


async def upsert_live_visitor(
    db: AsyncSession,
    session_id: str,
    current_page: str | None = None,
    visitor_ip: str | None = None,
    visitor_city: str | None = None,
    visitor_region: str | None = None,
    visitor_country: str | None = None,
    latitude: float | None = None,
    longitude: float | None = None,
    device_type: str = "unknown",
    browser: str | None = None,
    os: str | None = None,
    landing_page: str | None = None,
    referrer: str | None = None,
    has_cart: bool = False,
    cart_value: float = 0,
    is_checkout: bool = False,
) -> LiveVisitor:
    result = await db.execute(
        select(LiveVisitor).where(LiveVisitor.session_id == session_id)
    )
    visitor = result.scalar_one_or_none()

    if visitor:
        visitor.current_page = current_page or visitor.current_page
        visitor.last_active_at = datetime.now(timezone.utc)
        visitor.is_active = True
        if visitor_city:
            visitor.visitor_city = visitor_city
        if visitor_country:
            visitor.visitor_country = visitor_country
        if latitude is not None:
            visitor.latitude = latitude
        if longitude is not None:
            visitor.longitude = longitude
        if has_cart:
            visitor.has_cart = True
            visitor.cart_value = cart_value
        if is_checkout:
            visitor.is_checkout = True
    else:
        visitor = LiveVisitor(
            session_id=session_id,
            visitor_ip=visitor_ip,
            visitor_country=visitor_country,
            visitor_region=visitor_region,
            visitor_city=visitor_city,
            latitude=latitude,
            longitude=longitude,
            device_type=device_type,
            browser=browser,
            os=os,
            current_page=current_page,
            landing_page=landing_page,
            referrer=referrer,
            has_cart=has_cart,
            cart_value=cart_value,
            is_checkout=is_checkout,
        )
        db.add(visitor)

    await db.commit()
    await db.refresh(visitor)
    return visitor


async def deactivate_visitor(db: AsyncSession, session_id: str) -> None:
    result = await db.execute(
        select(LiveVisitor).where(LiveVisitor.session_id == session_id)
    )
    visitor = result.scalar_one_or_none()
    if visitor:
        visitor.is_active = False
        await db.commit()


async def record_live_activity(
    db: AsyncSession,
    session_id: str | None,
    event_type: str,
    description: str,
    visitor_city: str | None = None,
    visitor_country: str | None = None,
    product_name: str | None = None,
    order_number: str | None = None,
    order_value: float | None = None,
    page_url: str | None = None,
) -> LiveActivity:
    activity = LiveActivity(
        session_id=session_id,
        event_type=event_type,
        visitor_city=visitor_city,
        visitor_country=visitor_country,
        description=description,
        product_name=product_name,
        order_number=order_number,
        order_value=order_value,
        page_url=page_url,
    )
    db.add(activity)
    await db.commit()
    await db.refresh(activity)
    return activity
