from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.core.dependencies import get_current_user
from app.modules.segments import service
from app.modules.segments.schema import SegmentCreate, SegmentUpdate, SegmentOut, SegmentListOut

router = APIRouter(prefix="/segments", tags=["Segments"], dependencies=[Depends(get_current_user)])


@router.post("/", response_model=SegmentOut, status_code=status.HTTP_201_CREATED)
async def create_segment(data: SegmentCreate, db: AsyncSession = Depends(get_db)):
    return await service.create_segment(db, data)


@router.get("/", response_model=list[SegmentListOut])
async def list_segments(
    search: str | None = None,
    is_system: bool | None = None,
    skip: int = 0,
    limit: int = 50,
    db: AsyncSession = Depends(get_db),
):
    return await service.list_segments(db, search, is_system, skip, limit)


@router.get("/{segment_id}", response_model=SegmentOut)
async def get_segment(segment_id: int, db: AsyncSession = Depends(get_db)):
    segment = await service.get_segment(db, segment_id)
    if not segment:
        raise HTTPException(status_code=404, detail="Segment not found")
    return segment


@router.patch("/{segment_id}", response_model=SegmentOut)
async def update_segment(segment_id: int, data: SegmentUpdate, db: AsyncSession = Depends(get_db)):
    segment = await service.update_segment(db, segment_id, data)
    if not segment:
        raise HTTPException(status_code=404, detail="Segment not found")
    return segment


@router.delete("/{segment_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_segment(segment_id: int, db: AsyncSession = Depends(get_db)):
    deleted = await service.delete_segment(db, segment_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Segment not found or is a system segment")
