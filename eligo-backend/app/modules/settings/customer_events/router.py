from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.core.dependencies import require_admin

from app.modules.settings.customer_events import service
from app.modules.settings.customer_events.model import PixelPlacement
from app.modules.settings.customer_events.schema import (
    PixelCreate,
    PixelDefinition,
    PixelEventIn,
    PixelEventLogOut,
    PixelEventOut,
    PixelOut,
    PixelScriptOut,
    PixelUpdate,
)

# =====================================================================
# ADMIN ROUTER (Settings -> Customer Events / Pixels manager)
# =====================================================================

router = APIRouter(
    prefix="/customer-events",
    tags=["Settings - Customer Events"],
    dependencies=[Depends(require_admin)],
)


@router.get("/pixels", response_model=list[PixelOut])
async def list_pixels(include_inactive: bool = False, db: AsyncSession = Depends(get_db)):
    return await service.list_pixels(db, include_inactive)


@router.get("/pixels/definitions", response_model=list[PixelDefinition])
async def list_pixel_definitions():
    """The 'Explore pixel integrations' catalog."""
    return service.list_definitions()


@router.post("/pixels", response_model=PixelOut, status_code=status.HTTP_201_CREATED)
async def create_pixel(data: PixelCreate, db: AsyncSession = Depends(get_db)):
    return await service.create_pixel(data, db)


@router.get("/pixels/{pixel_id}", response_model=PixelOut)
async def get_pixel(pixel_id: int, db: AsyncSession = Depends(get_db)):
    pixel = await service.get_pixel(pixel_id, db)
    if not pixel:
        raise HTTPException(status_code=404, detail="Pixel not found")
    return pixel


@router.patch("/pixels/{pixel_id}", response_model=PixelOut)
async def update_pixel(pixel_id: int, data: PixelUpdate, db: AsyncSession = Depends(get_db)):
    pixel = await service.update_pixel(pixel_id, data, db)
    if not pixel:
        raise HTTPException(status_code=404, detail="Pixel not found")
    return pixel


@router.post("/pixels/{pixel_id}/activate", response_model=PixelOut)
async def activate_pixel(pixel_id: int, db: AsyncSession = Depends(get_db)):
    pixel = await service.set_active(pixel_id, True, db)
    if not pixel:
        raise HTTPException(status_code=404, detail="Pixel not found")
    return pixel


@router.post("/pixels/{pixel_id}/deactivate", response_model=PixelOut)
async def deactivate_pixel(pixel_id: int, db: AsyncSession = Depends(get_db)):
    pixel = await service.set_active(pixel_id, False, db)
    if not pixel:
        raise HTTPException(status_code=404, detail="Pixel not found")
    return pixel


@router.delete("/pixels/{pixel_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_pixel(pixel_id: int, db: AsyncSession = Depends(get_db)):
    deleted = await service.delete_pixel(pixel_id, db)
    if not deleted:
        raise HTTPException(status_code=404, detail="Pixel not found")


@router.get("/events/logs", response_model=list[PixelEventLogOut])
async def list_event_logs(skip: int = 0, limit: int = 50, db: AsyncSession = Depends(get_db)):
    """Server-side event dispatch audit trail."""
    return await service.list_event_logs(db, skip, limit)


# =====================================================================
# PUBLIC ROUTER (storefront template + server-side events - no auth)
# =====================================================================

public_router = APIRouter(
    prefix="/customer-events",
    tags=["Customer Events - Storefront"],
)


@public_router.get("/storefront-scripts", response_model=list[PixelScriptOut])
async def get_storefront_scripts(
    placement: PixelPlacement | None = None,
    db: AsyncSession = Depends(get_db),
):
    """Active tracking scripts for the storefront template engine.

    Call this from the layout renderer and inject each script into the HTML
    slot matching its `placement` (head / body_start / body_end / checkout).
    """
    return await service.get_storefront_scripts(db, placement)


@public_router.post("/events", response_model=PixelEventOut)
async def dispatch_server_event(data: PixelEventIn, db: AsyncSession = Depends(get_db)):
    """Fire a server-side conversion event (e.g. on order completion).

    Used by server pixels (Meta Conversions API, GA4 Measurement Protocol).
    """
    return await service.dispatch_event(data, db)
