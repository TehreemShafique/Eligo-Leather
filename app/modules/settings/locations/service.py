from sqlalchemy import func, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.catalog.model import Location
from app.modules.settings.locations.schema import LocationCreate, LocationUpdate

LOCATION_LIMIT = 10


async def get_default_location(db: AsyncSession) -> Location | None:
    result = await db.execute(
        select(Location).where(Location.is_primary == True).order_by(Location.id)  # noqa: E712
    )
    return result.scalars().first()


async def get_summary(db: AsyncSession) -> dict:
    total = (await db.execute(select(func.count(Location.id)))).scalar() or 0
    active = (
        await db.execute(select(func.count(Location.id)).where(Location.is_active == True))  # noqa: E712
    ).scalar() or 0
    default_location = await get_default_location(db)
    return {
        "total": total,
        "active": active,
        "inactive": total - active,
        "limit": LOCATION_LIMIT,
        "default_location": default_location,
    }


async def list_locations(
    db: AsyncSession,
    status: str = "all",
    search: str | None = None,
    sort_by: str = "name",
    order: str = "asc",
) -> list[Location]:
    query = select(Location)

    if status == "active":
        query = query.where(Location.is_active == True)  # noqa: E712
    elif status == "inactive":
        query = query.where(Location.is_active == False)  # noqa: E712

    if search:
        pattern = f"%{search}%"
        query = query.where(
            Location.name.ilike(pattern)
            | Location.address.ilike(pattern)
            | Location.city.ilike(pattern)
            | Location.country.ilike(pattern)
        )

    sort_col = {
        "name": Location.name,
        "created_at": Location.created_at,
        "updated_at": Location.updated_at,
    }.get(sort_by, Location.name)

    query = query.order_by(
        sort_col.asc() if order == "asc" else sort_col.desc()
    )

    result = await db.execute(query)
    return list(result.scalars().all())


async def get_location(location_id: int, db: AsyncSession) -> Location | None:
    return await db.get(Location, location_id)


async def create_location(data: LocationCreate, db: AsyncSession) -> Location:
    payload = data.model_dump()
    if payload.get("is_primary"):
        await _demote_primaries(db)
    location = Location(**payload)
    if payload.get("is_primary"):
        location.is_primary = True
    db.add(location)
    await db.commit()
    await db.refresh(location)
    return location


async def update_location(
    location_id: int, data: LocationUpdate, db: AsyncSession
) -> Location | None:
    location = await get_location(location_id, db)
    if not location:
        return None
    if data.is_primary is True:
        await _demote_primaries(db)
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(location, field, value)
    await db.commit()
    await db.refresh(location)
    return location


async def set_default_location(location_id: int, db: AsyncSession) -> Location | None:
    location = await get_location(location_id, db)
    if not location:
        return None
    await _demote_primaries(db)
    location.is_primary = True
    await db.commit()
    await db.refresh(location)
    return location


async def delete_location(location_id: int, db: AsyncSession) -> bool:
    location = await get_location(location_id, db)
    if not location:
        return False
    await db.delete(location)
    await db.commit()
    return True


async def _demote_primaries(db: AsyncSession) -> None:
    await db.execute(
        update(Location).where(Location.is_primary == True).values(is_primary=False)  # noqa: E712
    )
