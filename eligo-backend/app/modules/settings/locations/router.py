from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.core.dependencies import require_admin

from app.modules.settings.locations import service
from app.modules.settings.locations.schema import (
    LocationCreate,
    LocationUpdate,
    LocationOut,
    LocationsSummary,
)

router = APIRouter(
    prefix="/locations",
    tags=["Settings - Locations"],
    dependencies=[Depends(require_admin)],
)


@router.get("/summary", response_model=LocationsSummary)
async def get_locations_summary(db: AsyncSession = Depends(get_db)):
    return await service.get_summary(db)


@router.get("", response_model=list[LocationOut])
async def list_locations(
    status: str = "all",
    search: str | None = None,
    sort_by: str = "name",
    order: str = "asc",
    db: AsyncSession = Depends(get_db),
):
    return await service.list_locations(db, status, search, sort_by, order)


@router.post("", response_model=LocationOut, status_code=status.HTTP_201_CREATED)
async def create_location(data: LocationCreate, db: AsyncSession = Depends(get_db)):
    return await service.create_location(data, db)


@router.get("/default", response_model=LocationOut)
async def get_default(db: AsyncSession = Depends(get_db)):
    location = await service.get_default_location(db)
    if not location:
        raise HTTPException(status_code=404, detail="No default location set")
    return location


@router.post("/{location_id}/default", response_model=LocationOut)
async def set_default(location_id: int, db: AsyncSession = Depends(get_db)):
    location = await service.set_default_location(location_id, db)
    if not location:
        raise HTTPException(status_code=404, detail="Location not found")
    return location


@router.get("/{location_id}", response_model=LocationOut)
async def get_location(location_id: int, db: AsyncSession = Depends(get_db)):
    location = await service.get_location(location_id, db)
    if not location:
        raise HTTPException(status_code=404, detail="Location not found")
    return location


@router.patch("/{location_id}", response_model=LocationOut)
async def update_location(
    location_id: int, data: LocationUpdate, db: AsyncSession = Depends(get_db)
):
    location = await service.update_location(location_id, data, db)
    if not location:
        raise HTTPException(status_code=404, detail="Location not found")
    return location


@router.delete("/{location_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_location(location_id: int, db: AsyncSession = Depends(get_db)):
    deleted = await service.delete_location(location_id, db)
    if not deleted:
        raise HTTPException(status_code=404, detail="Location not found")
