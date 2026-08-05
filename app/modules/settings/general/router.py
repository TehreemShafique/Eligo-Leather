from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.core.dependencies import require_admin

from app.modules.settings.general import service
from app.modules.settings.general.schema import (
    StoreSettingsUpdate,
    StoreSettingOut, 
    StoreBrandUpdate,
    StoreBrandOut, 
    BusinessEntityUpdate,
    BusinessEntityCreate,
    BusinessEntityOut
)

# ==================================Store Settings==================================

router = APIRouter(prefix="/general", tags=["Settings - General"], dependencies=[Depends(require_admin)])

@router.get("/store-settings", response_model=StoreSettingOut)
async def get_store_settings(db: AsyncSession = Depends(get_db)):
    return await service.get_store_settings(db)

@router.patch("/store-settings", response_model=StoreSettingOut)
async def update_store_setting(data: StoreSettingsUpdate, db:AsyncSession = Depends(get_db)):
    return await service.update_store_settings(data, db)

# ==================================Business Entity==================================

@router.get("/business-entities", response_model=list[BusinessEntityOut])
async def list_entities(is_archive: bool = False, db: AsyncSession = Depends(get_db)):
    entity = await service.list_entities(is_archive, db)
    if not entity:
        raise HTTPException(status_code=404, detail="Business entity not found.")
    return entity

@router.get("/business-entities/{entity_id}", response_model=BusinessEntityOut)
async def get_entity(entity_id: int, db: AsyncSession = Depends(get_db)):
    entity = await service.get_entity(entity_id, db)
    if not entity:
        raise HTTPException(status_code=404, detail="entity not found.")
    return entity

@router.post("/business-entities", response_model=BusinessEntityOut)
async def create_entity(data: BusinessEntityCreate, db: AsyncSession = Depends(get_db)):
    return await service.create_entity(data, db)

@router.patch("/business-entities/{entity_id}", response_model=BusinessEntityOut)
async def update_entity(entity_id: int, data: BusinessEntityUpdate, db: AsyncSession = Depends(get_db)):
    entity = await service.update_entity(entity_id, data, db)
    if not entity:
        raise HTTPException(status_code=404, detail="Entity not found to update.")
    return entity

@router.post("/business-entities/{entity_id}/archive", response_model=BusinessEntityOut)
async def archive_the_entities(entity_id: int, db: AsyncSession = Depends(get_db)):
    entity = await service.archive_entity(entity_id, db)
    if not entity:
        HTTPException(status_code=404, detail="Business entity not found.")
    return entity

# ==================================STORE BRAND==================================

@router.get("/store-brand", response_model=StoreBrandOut)
async def get_store_brand(db: AsyncSession = Depends(get_db)):
    brand = await service.get_store_brand(db)
    if not brand:
        raise HTTPException(status_code=404, detail="Brand not found.")
    return brand

@router.patch("/store-brand", response_model=StoreBrandOut)
async def update_store_brand(data: StoreBrandUpdate, db : AsyncSession = Depends(get_db)):
    brand = await service.update_store_brand(data, db)
    if not brand:
        raise HTTPException(status_code=404, detail="Business Brand not found.")
    return brand