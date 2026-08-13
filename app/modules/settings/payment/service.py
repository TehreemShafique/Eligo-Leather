from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.settings.payment.model import PaymentMethod, PaymentSettings
from app.modules.settings.payment.schema import (
    PaymentMethodCreate,
    PaymentMethodUpdate,
    PaymentSettingsUpdate,
)

DEFAULT_PAYMENT_METHODS = [
    {
        "name": "Cash on Delivery (COD)",
        "additional_details": "Free Shipping On Above 2000/ Order",
        "payment_instructions": "Please keep the exact amount ready for the delivery agent.",
    },
]

CAPTURE_METHOD_DESCRIPTIONS = {
    "automatically_at_checkout": "Captures payment immediately when an order is placed.",
    "automatically_on_fulfillment": "Authorizes at checkout and captures once the entire order is fulfilled.",
    "manual": "Authorizes at checkout and leaves funds pending until manually captured.",
}


async def get_payment_settings(db: AsyncSession) -> PaymentSettings:
    result = await db.execute(select(PaymentSettings).where(PaymentSettings.id == 1))
    settings = result.scalar_one_or_none()
    if settings is None:
        settings = PaymentSettings(id=1)
        db.add(settings)
        await db.commit()
        await db.refresh(settings)
    return settings


async def update_payment_settings(data: PaymentSettingsUpdate, db: AsyncSession) -> PaymentSettings:
    settings = await get_payment_settings(db)
    payload = data.model_dump(exclude_unset=True)

    if payload.get("gift_cards_expire") is False:
        payload["gift_card_validity_years"] = None
    elif payload.get("gift_cards_expire") is True and payload.get("gift_card_validity_years") is None:
        payload["gift_card_validity_years"] = 1

    for field, value in payload.items():
        setattr(settings, field, value)

    await db.commit()
    await db.refresh(settings)
    return settings


async def list_payment_methods(db: AsyncSession, include_inactive: bool = False) -> list[PaymentMethod]:
    query = select(PaymentMethod).order_by(PaymentMethod.created_at.desc())
    if not include_inactive:
        query = query.where(PaymentMethod.is_active == True)  # noqa: E712
    result = await db.execute(query)
    return list(result.scalars().all())


async def get_payment_method(method_id: int, db: AsyncSession) -> PaymentMethod | None:
    return await db.get(PaymentMethod, method_id)


async def create_payment_method(data: PaymentMethodCreate, db: AsyncSession) -> PaymentMethod:
    method = PaymentMethod(**data.model_dump())
    db.add(method)
    await db.commit()
    await db.refresh(method)
    return method


async def update_payment_method(method_id: int, data: PaymentMethodUpdate, db: AsyncSession) -> PaymentMethod | None:
    method = await get_payment_method(method_id, db)
    if not method:
        return None

    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(method, field, value)

    await db.commit()
    await db.refresh(method)
    return method


async def deactivate_payment_method(method_id: int, db: AsyncSession) -> PaymentMethod | None:
    method = await get_payment_method(method_id, db)
    if not method:
        return None

    method.is_active = False
    await db.commit()
    await db.refresh(method)
    return method


async def delete_payment_method(method_id: int, db: AsyncSession) -> bool:
    method = await get_payment_method(method_id, db)
    if not method:
        return False

    await db.delete(method)
    await db.commit()
    return True


async def seed_default_payment_methods(db: AsyncSession) -> None:
    result = await db.execute(select(PaymentMethod.name))
    existing_names = {row[0] for row in result.all()}

    for method in DEFAULT_PAYMENT_METHODS:
        if method["name"] not in existing_names:
            db.add(PaymentMethod(**method, is_active=True))

    await db.commit()
