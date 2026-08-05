from datetime import datetime

from sqlalchemy import select, or_
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.discounts.model import (
    Discount,
    WelcomeDiscountLog,
    WelcomeDiscountSettings,
)
from app.modules.discounts.schema import (
    DiscountCreate,
    DiscountUpdate,
    WelcomeDiscountResult,
    WelcomeDiscountUpdate,
)

DEFAULT_WELCOME_DISCOUNT_PERCENTAGE = 10


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


# =====================================================================
# Welcome Discount
# =====================================================================

async def get_welcome_settings(db: AsyncSession) -> WelcomeDiscountSettings:
    """Return the global welcome-discount row, creating a disabled default
    on first access so the table always has exactly one active config."""
    result = await db.execute(
        select(WelcomeDiscountSettings).order_by(WelcomeDiscountSettings.id).limit(1),
    )
    settings = result.scalar_one_or_none()
    if settings is None:
        settings = WelcomeDiscountSettings(
            discount_percentage=DEFAULT_WELCOME_DISCOUNT_PERCENTAGE,
            is_active=False,
        )
        db.add(settings)
        await db.commit()
        await db.refresh(settings)
    return settings


async def update_welcome_settings(
    db: AsyncSession,
    data: WelcomeDiscountUpdate,
    updated_by: int | None,
) -> WelcomeDiscountSettings:
    settings = await get_welcome_settings(db)
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(settings, field, value)
    settings.updated_by = updated_by
    await db.commit()
    await db.refresh(settings)
    return settings


async def evaluate_welcome_discount(
    db: AsyncSession,
    user_email: str,
    ip_address: str,
) -> WelcomeDiscountResult:
    """Run the one-time welcome-discount check on login.

    If the email OR the IP is already in the claim log, the offer is
    suppressed. Otherwise the offer is shown (when globally enabled) and the
    email + IP combination is recorded immediately so it is never shown again.
    """
    already_claimed = await db.execute(
        select(WelcomeDiscountLog.id).where(
            or_(
                WelcomeDiscountLog.user_email == user_email,
                WelcomeDiscountLog.ip_address == ip_address,
            ),
        ).limit(1),
    )
    if already_claimed.scalar_one_or_none() is not None:
        return WelcomeDiscountResult(show_welcome_discount=False)

    settings = await get_welcome_settings(db)
    if not settings.is_active:
        return WelcomeDiscountResult(show_welcome_discount=False)

    db.add(WelcomeDiscountLog(user_email=user_email, ip_address=ip_address))
    await db.commit()
    return WelcomeDiscountResult(
        show_welcome_discount=True,
        discount_percentage=float(settings.discount_percentage),
    )
