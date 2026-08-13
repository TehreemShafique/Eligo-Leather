from datetime import datetime, timezone
from sqlalchemy import select, or_, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.modules.segments.model import Segment
from app.modules.segments.schema import SegmentCreate, SegmentUpdate


async def create_segment(db: AsyncSession, data: SegmentCreate) -> Segment:
    segment = Segment(**data.model_dump())
    db.add(segment)
    await db.commit()
    await db.refresh(segment)
    return segment


async def get_segment(db: AsyncSession, segment_id: int) -> Segment | None:
    result = await db.execute(
        select(Segment).options(selectinload(Segment.customers)).where(Segment.id == segment_id)
    )
    return result.scalar_one_or_none()


async def list_segments(
    db: AsyncSession,
    search: str | None = None,
    is_system: bool | None = None,
    skip: int = 0,
    limit: int = 50,
) -> list[Segment]:
    query = select(Segment)

    if search:
        query = query.where(
            or_(
                Segment.name.ilike(f"%{search}%"),
                Segment.created_by.ilike(f"%{search}%"),
                Segment.description.ilike(f"%{search}%"),
            )
        )

    if is_system is not None:
        query = query.where(Segment.is_system == is_system)

    query = query.order_by(Segment.created_at.desc()).offset(skip).limit(limit)
    result = await db.execute(query)
    return list(result.scalars().all())


async def update_segment(db: AsyncSession, segment_id: int, data: SegmentUpdate) -> Segment | None:
    segment = await db.get(Segment, segment_id)
    if not segment:
        return None
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(segment, field, value)
    await db.commit()
    await db.refresh(segment)
    return segment


async def delete_segment(db: AsyncSession, segment_id: int) -> bool:
    segment = await db.get(Segment, segment_id)
    if not segment:
        return False
    if segment.is_system:
        return False  # Cannot delete system segments
    await db.delete(segment)
    await db.commit()
    return True
