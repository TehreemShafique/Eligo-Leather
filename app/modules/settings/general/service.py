from app.modules.settings.general.schema import (
    StoreSettingsUpdate,
    BusinessEntityCreate,
    BusinessEntityUpdate,
    StoreBrandUpdate,
)
from app.modules.settings.general.model import (
    StoreSettings,
    BusinessEntity,
    StoreBrand
)
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException

# ==================================Store Settings==================================

async def get_store_settings(db: AsyncSession) -> StoreSettings:
    result = await db.execute(select(StoreSettings).where(StoreSettings.id == 1))
    settings = result.scalar_one_or_none()
    if settings is None:
        settings = StoreSettings(id=1)
        db.add(settings)
        await db.commit()
        await db.refresh(settings)
    return settings

async def update_store_settings(data: StoreSettingsUpdate, db: AsyncSession) -> StoreSettings:
    settings = await get_store_settings(db)
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(settings, field, value)
    await db.commit()
    await db.refresh(settings)
    return settings

# ==================================Business Entity==================================

async def list_entities(is_archived: bool = False, db: AsyncSession = None) -> list[BusinessEntity]:
    result = await db.execute(
        select(BusinessEntity).where(BusinessEntity.is_archive == is_archived).order_by(BusinessEntity.create_at.desc())
    )
    return list(result.scalars().all())

async def get_entity(entity_id: int, db: AsyncSession) -> BusinessEntity | None:
    return await db.get(BusinessEntity, entity_id)

async def create_entity(data: BusinessEntityCreate, db: AsyncSession) -> BusinessEntity:
    entity = BusinessEntity(**data.model_dump())
    db.add(entity)
    await db.commit()
    await db.refresh(entity)
    return entity

async def update_entity(entity_id: int, data: BusinessEntityUpdate, db: AsyncSession) -> BusinessEntity | None:
    entity = await get_entity(entity_id, db)
    if not entity:
        return None

    if data.is_active is True:
        result = await db.execute(select(BusinessEntity).where(BusinessEntity.is_active == True))
        for other in result.scalars().all():
            if other.id != entity_id:
                other.is_active = False

    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(entity, field, value)

    await db.commit()
    await db.refresh(entity)
    return entity

async def archive_entity(entity_id: int, db: AsyncSession) -> BusinessEntity | None:
    entity = await get_entity(entity_id, db)
    if not entity:
        return None

    entity.is_archive = True
    entity.is_active = False

    await db.commit()
    await db.refresh(entity)
    return entity

# ==================================STORE BRAND==================================

async def get_store_brand(db: AsyncSession) -> StoreBrand:
    result = await db.execute(select(StoreBrand).where(StoreBrand.id == 1))
    brand = result.scalar_one_or_none()

    if brand is None:
        brand = StoreBrand(id=1)
        db.add(brand)
        await db.commit()
        await db.refresh(brand)
    return brand

async def update_store_brand(data: StoreBrandUpdate, db: AsyncSession) -> StoreBrand | None:
    brand = await get_store_brand(db)
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(brand, field, value)
    await db.commit()
    await db.refresh(brand)
    return brand
