from datetime import datetime

from sqlalchemy import select, or_
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.discounts.model import Discount
from app.modules.discounts.schema import DiscountCreate, DiscountUpdate


async def create_discount(
    db: AsyncSession, data: DiscountCreate,
) -> Discount:
    discount = Discount(**data.model_dump())
    db.add(discount)
    await db.commit()
    await db.refresh(discount)
    return discount


async def get_discount(
    db: AsyncSession, discount_id: int,
) -> Discount | None:
    result = await db.execute(
        select(Discount).where(Discount.id == discount_id),
    )
    return result.scalar_one_or_none()


async def list_discounts(
    db: AsyncSession,
    search: str | None = None,
    status: str | None = None,
    method: str | None = None,
    discount_type: str | None = None,
    eligibility: str | None = None,
    start_date: datetime | None = None,
    end_date: datetime | None = None,
    skip: int = 0,
    limit: int = 50,
) -> list[Discount]:
    query = select(Discount)

    if search:
        query = query.where(
            or_(
                Discount.title.ilike(f"%{search}%"),
                Discount.code.ilike(f"%{search}%"),
            ),
        )
    if status:
        query = query.where(Discount.status == status)
    if method:
        query = query.where(Discount.method == method)
    if discount_type:
        query = query.where(Discount.type == discount_type)
    if eligibility:
        query = query.where(Discount.eligibility == eligibility)
    if start_date:
        query = query.where(Discount.created_at >= start_date)
    if end_date:
        query = query.where(Discount.created_at <= end_date)

    query = query.order_by(Discount.created_at.desc()).offset(skip).limit(limit)
    result = await db.execute(query)
    return list(result.scalars().all())


async def update_discount(
    db: AsyncSession, discount_id: int, data: DiscountUpdate,
) -> Discount | None:
    discount = await get_discount(db, discount_id)
    if not discount:
        return None
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(discount, field, value)
    await db.commit()
    await db.refresh(discount)
    return discount


async def delete_discount(db: AsyncSession, discount_id: int) -> bool:
    discount = await get_discount(db, discount_id)
    if not discount:
        return False
    await db.delete(discount)
    await db.commit()
    return True
