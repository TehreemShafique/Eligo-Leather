from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.settings.customer_accounts.model import CustomerAccountSettings
from app.modules.settings.customer_accounts.schema import CustomerAccountSettingsUpdate


async def get_settings(db: AsyncSession) -> CustomerAccountSettings:
    result = await db.execute(
        select(CustomerAccountSettings).where(CustomerAccountSettings.id == 1)
    )
    settings = result.scalar_one_or_none()
    if settings is None:
        settings = CustomerAccountSettings(id=1)
        db.add(settings)
        await db.commit()
        await db.refresh(settings)
    return settings


async def seed_default_settings(db: AsyncSession) -> None:
    await get_settings(db)


async def update_settings(data: CustomerAccountSettingsUpdate, db: AsyncSession) -> CustomerAccountSettings:
    settings = await get_settings(db)
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(settings, field, value)
    await db.commit()
    await db.refresh(settings)
    return settings
