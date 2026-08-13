from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.core.dependencies import get_current_user
from app.modules.analytics import service
from app.modules.analytics.schema import (
    AnalyticsOverview,
    ReportCreate, ReportUpdate, ReportOut,
    ExplorationCreate, ExplorationUpdate, ExplorationOut,
    LiveViewSnapshot,
)

# ---------------------------------------------------------------------------
# Dashboard Router
# ---------------------------------------------------------------------------

analytics_router = APIRouter(
    prefix="/analytics",
    tags=["Analytics"],
    dependencies=[Depends(get_current_user)],
)


@analytics_router.get("/overview", response_model=AnalyticsOverview)
async def get_analytics_overview(
    start_date: datetime | None = Query(None, description="Filter start date"),
    end_date: datetime | None = Query(None, description="Filter end date"),
    currency: str = Query("PKR", description="Currency code"),
    db: AsyncSession = Depends(get_db),
):
    return await service.get_analytics_overview(db, start_date, end_date, currency)


# ---------------------------------------------------------------------------
# Reports Router
# ---------------------------------------------------------------------------

reports_router = APIRouter(
    prefix="/reports",
    tags=["Reports"],
    dependencies=[Depends(get_current_user)],
)


@reports_router.post("/", response_model=ReportOut, status_code=status.HTTP_201_CREATED)
async def create_report(data: ReportCreate, db: AsyncSession = Depends(get_db)):
    return await service.create_report(db, data)


@reports_router.get("/", response_model=list[ReportOut])
async def list_reports(
    search: str | None = Query(None),
    category: str | None = Query(None),
    created_by: str | None = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    db: AsyncSession = Depends(get_db),
):
    return await service.list_reports(db, search, category, created_by, skip, limit)


@reports_router.get("/{report_id}", response_model=ReportOut)
async def get_report(report_id: int, db: AsyncSession = Depends(get_db)):
    report = await service.get_report(db, report_id)
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    return report


@reports_router.patch("/{report_id}", response_model=ReportOut)
async def update_report(report_id: int, data: ReportUpdate, db: AsyncSession = Depends(get_db)):
    report = await service.update_report(db, report_id, data)
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    return report


@reports_router.delete("/{report_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_report(report_id: int, db: AsyncSession = Depends(get_db)):
    deleted = await service.delete_report(db, report_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Report not found")


# ---------------------------------------------------------------------------
# Explorations Router
# ---------------------------------------------------------------------------

explorations_router = APIRouter(
    prefix="/explorations",
    tags=["Explorations"],
    dependencies=[Depends(get_current_user)],
)


@explorations_router.post("/", response_model=ExplorationOut, status_code=status.HTTP_201_CREATED)
async def create_exploration(data: ExplorationCreate, db: AsyncSession = Depends(get_db)):
    return await service.create_exploration(db, data)


@explorations_router.get("/", response_model=list[ExplorationOut])
async def list_explorations(
    search: str | None = Query(None),
    created_by: str | None = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    db: AsyncSession = Depends(get_db),
):
    return await service.list_explorations(db, search, created_by, skip, limit)


@explorations_router.get("/{exploration_id}", response_model=ExplorationOut)
async def get_exploration(exploration_id: int, db: AsyncSession = Depends(get_db)):
    exploration = await service.get_exploration(db, exploration_id)
    if not exploration:
        raise HTTPException(status_code=404, detail="Exploration not found")
    return exploration


@explorations_router.patch("/{exploration_id}", response_model=ExplorationOut)
async def update_exploration(exploration_id: int, data: ExplorationUpdate, db: AsyncSession = Depends(get_db)):
    exploration = await service.update_exploration(db, exploration_id, data)
    if not exploration:
        raise HTTPException(status_code=404, detail="Exploration not found")
    return exploration


@explorations_router.delete("/{exploration_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_exploration(exploration_id: int, db: AsyncSession = Depends(get_db)):
    deleted = await service.delete_exploration(db, exploration_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Exploration not found")


# ---------------------------------------------------------------------------
# Live View Router
# ---------------------------------------------------------------------------

live_view_router = APIRouter(
    prefix="/live-view",
    tags=["Live View"],
    dependencies=[Depends(get_current_user)],
)


@live_view_router.get("/", response_model=LiveViewSnapshot)
async def get_live_view(db: AsyncSession = Depends(get_db)):
    return await service.get_live_view_snapshot(db)


@live_view_router.post("/heartbeat")
async def visitor_heartbeat(
    session_id: str = Query(...),
    current_page: str | None = Query(None),
    visitor_city: str | None = Query(None),
    visitor_region: str | None = Query(None),
    visitor_country: str | None = Query(None),
    latitude: float | None = Query(None),
    longitude: float | None = Query(None),
    device_type: str = Query("unknown"),
    browser: str | None = Query(None),
    os: str | None = Query(None),
    landing_page: str | None = Query(None),
    referrer: str | None = Query(None),
    has_cart: bool = Query(False),
    cart_value: float = Query(0),
    is_checkout: bool = Query(False),
    db: AsyncSession = Depends(get_db),
):
    visitor = await service.upsert_live_visitor(
        db, session_id, current_page=current_page,
        visitor_city=visitor_city, visitor_region=visitor_region,
        visitor_country=visitor_country, latitude=latitude, longitude=longitude,
        device_type=device_type, browser=browser, os=os,
        landing_page=landing_page, referrer=referrer,
        has_cart=has_cart, cart_value=cart_value, is_checkout=is_checkout,
    )
    return {"status": "ok", "visitor_id": visitor.id}


@live_view_router.post("/activity")
async def record_activity(
    session_id: str | None = Query(None),
    event_type: str = Query(...),
    description: str = Query(...),
    visitor_city: str | None = Query(None),
    visitor_country: str | None = Query(None),
    product_name: str | None = Query(None),
    order_number: str | None = Query(None),
    order_value: float | None = Query(None),
    page_url: str | None = Query(None),
    db: AsyncSession = Depends(get_db),
):
    activity = await service.record_live_activity(
        db, session_id=session_id, event_type=event_type, description=description,
        visitor_city=visitor_city, visitor_country=visitor_country,
        product_name=product_name, order_number=order_number,
        order_value=order_value, page_url=page_url,
    )
    return {"status": "ok", "activity_id": activity.id}


@live_view_router.post("/deactivate")
async def deactivate_visitor(
    session_id: str = Query(...),
    db: AsyncSession = Depends(get_db),
):
    await service.deactivate_visitor(db, session_id)
    return {"status": "ok"}
