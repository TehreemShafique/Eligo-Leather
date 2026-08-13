from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.core.dependencies import get_current_user
from app.modules.growth import service
from app.modules.growth.schema import (
    AttributionCreate,
    AttributionUpdate,
    AttributionOut,
    CampaignCreate,
    CampaignUpdate,
    CampaignOut,
    GrowthOverview,
)

# ---------------------------------------------------------------------------
# Growth Overview router
# ---------------------------------------------------------------------------

growth_router = APIRouter(
    prefix="/growth",
    tags=["Growth"],
    dependencies=[Depends(get_current_user)],
)


@growth_router.get("/overview", response_model=GrowthOverview)
async def get_growth_overview(
    start_date: datetime | None = Query(None, description="Filter start date"),
    end_date: datetime | None = Query(None, description="Filter end date"),
    db: AsyncSession = Depends(get_db),
):
    return await service.get_growth_overview(
        db, start_date=start_date, end_date=end_date,
    )


# ---------------------------------------------------------------------------
# Attribution CRUD router
# ---------------------------------------------------------------------------

attribution_router = APIRouter(
    prefix="/attribution",
    tags=["Attribution"],
    dependencies=[Depends(get_current_user)],
)


@attribution_router.post(
    "/", response_model=AttributionOut, status_code=status.HTTP_201_CREATED,
)
async def create_attribution(
    data: AttributionCreate,
    db: AsyncSession = Depends(get_db),
):
    return await service.create_attribution(db, data)


@attribution_router.get("/", response_model=list[AttributionOut])
async def list_attributions(
    search: str | None = Query(None),
    channel: str | None = Query(None),
    traffic_type: str | None = Query(None),
    start_date: datetime | None = Query(None),
    end_date: datetime | None = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    db: AsyncSession = Depends(get_db),
):
    return await service.list_attributions(
        db,
        search=search,
        channel=channel,
        traffic_type=traffic_type,
        start_date=start_date,
        end_date=end_date,
        skip=skip,
        limit=limit,
    )


@attribution_router.get("/{record_id}", response_model=AttributionOut)
async def get_attribution(
    record_id: int,
    db: AsyncSession = Depends(get_db),
):
    record = await service.get_attribution(db, record_id)
    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Attribution record not found",
        )
    return record


@attribution_router.patch("/{record_id}", response_model=AttributionOut)
async def update_attribution(
    record_id: int,
    data: AttributionUpdate,
    db: AsyncSession = Depends(get_db),
):
    record = await service.update_attribution(db, record_id, data)
    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Attribution record not found",
        )
    return record


@attribution_router.delete(
    "/{record_id}", status_code=status.HTTP_204_NO_CONTENT,
)
async def delete_attribution(
    record_id: int,
    db: AsyncSession = Depends(get_db),
):
    deleted = await service.delete_attribution(db, record_id)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Attribution record not found",
        )


# ---------------------------------------------------------------------------
# Campaign CRUD router
# ---------------------------------------------------------------------------

campaign_router = APIRouter(
    prefix="/campaigns",
    tags=["Campaigns"],
    dependencies=[Depends(get_current_user)],
)


@campaign_router.post(
    "/", response_model=CampaignOut, status_code=status.HTTP_201_CREATED,
)
async def create_campaign(
    data: CampaignCreate,
    db: AsyncSession = Depends(get_db),
):
    return await service.create_campaign(db, data)


@campaign_router.get("/", response_model=list[CampaignOut])
async def list_campaigns(
    search: str | None = Query(None),
    status_filter: str | None = Query(None, alias="status"),
    start_date: datetime | None = Query(None),
    end_date: datetime | None = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    db: AsyncSession = Depends(get_db),
):
    return await service.list_campaigns(
        db,
        search=search,
        status=status_filter,
        start_date=start_date,
        end_date=end_date,
        skip=skip,
        limit=limit,
    )


@campaign_router.get("/{record_id}", response_model=CampaignOut)
async def get_campaign(
    record_id: int,
    db: AsyncSession = Depends(get_db),
):
    record = await service.get_campaign(db, record_id)
    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Campaign not found",
        )
    return record


@campaign_router.patch("/{record_id}", response_model=CampaignOut)
async def update_campaign(
    record_id: int,
    data: CampaignUpdate,
    db: AsyncSession = Depends(get_db),
):
    record = await service.update_campaign(db, record_id, data)
    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Campaign not found",
        )
    return record


@campaign_router.delete(
    "/{record_id}", status_code=status.HTTP_204_NO_CONTENT,
)
async def delete_campaign(
    record_id: int,
    db: AsyncSession = Depends(get_db),
):
    deleted = await service.delete_campaign(db, record_id)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Campaign not found",
        )
