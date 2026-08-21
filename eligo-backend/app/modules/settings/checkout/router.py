from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.core.dependencies import require_admin

from app.modules.settings.checkout import service
from app.modules.settings.checkout.schema import (
    CheckoutConfigCreate,
    CheckoutConfigRename,
    CheckoutConfigUpdate,
    CheckoutConfigOut,
)

router = APIRouter(prefix="/checkout", tags=["Settings - Checkout"], dependencies=[Depends(require_admin)])

public_checkout_router = APIRouter(prefix="/checkout", tags=["Settings - Checkout - Public"])


@router.post("/seed", status_code=status.HTTP_204_NO_CONTENT)
async def seed_default_checkout_config(db: AsyncSession = Depends(get_db)):
    return await service.seed_default_config(db)


@router.get("/configs", response_model=list[CheckoutConfigOut])
async def list_checkout_configs(db: AsyncSession = Depends(get_db)):
    return await service.list_configs(db)


@router.get("/configs/active", response_model=CheckoutConfigOut)
async def get_active_checkout_config(db: AsyncSession = Depends(get_db)):
    return await service.get_active_config(db)


@router.post("/configs", response_model=CheckoutConfigOut, status_code=status.HTTP_201_CREATED)
async def create_checkout_config(data: CheckoutConfigCreate, db: AsyncSession = Depends(get_db)):
    return await service.create_config(data, db)


@router.get("/configs/{config_id}", response_model=CheckoutConfigOut)
async def get_checkout_config(config_id: int, db: AsyncSession = Depends(get_db)):
    config = await service.get_config(config_id, db)
    if not config:
        raise HTTPException(status_code=404, detail="Checkout configuration not found")
    return config


@router.patch("/configs/{config_id}", response_model=CheckoutConfigOut)
async def update_checkout_config(config_id: int, data: CheckoutConfigUpdate, db: AsyncSession = Depends(get_db)):
    config = await service.update_config(config_id, data, db)
    if not config:
        raise HTTPException(status_code=404, detail="Checkout configuration not found")
    return config


@router.post("/configs/{config_id}/rename", response_model=CheckoutConfigOut)
async def rename_checkout_config(config_id: int, data: CheckoutConfigRename, db: AsyncSession = Depends(get_db)):
    config = await service.rename_config(config_id, data.name, db)
    if not config:
        raise HTTPException(status_code=404, detail="Checkout configuration not found")
    return config


@router.post("/configs/{config_id}/duplicate", response_model=CheckoutConfigOut, status_code=status.HTTP_201_CREATED)
async def duplicate_checkout_config(config_id: int, db: AsyncSession = Depends(get_db)):
    config = await service.duplicate_config(config_id, db)
    if not config:
        raise HTTPException(status_code=404, detail="Checkout configuration not found")
    return config


@router.post("/configs/{config_id}/activate", response_model=CheckoutConfigOut)
async def activate_checkout_config(config_id: int, db: AsyncSession = Depends(get_db)):
    config = await service.activate_config(config_id, db)
    if not config:
        raise HTTPException(status_code=404, detail="Checkout configuration not found")
    return config


@router.delete("/configs/{config_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_checkout_config(config_id: int, db: AsyncSession = Depends(get_db)):
    deleted = await service.delete_config(config_id, db)
    if not deleted:
        raise HTTPException(status_code=404, detail="Checkout configuration not found")


# ============================== Public (Storefront) ==============================


@public_checkout_router.get("/config", response_model=CheckoutConfigOut)
async def get_public_checkout_config(db: AsyncSession = Depends(get_db)):
    """Return the active checkout config for the storefront (no auth required)."""
    return await service.get_active_config(db)
