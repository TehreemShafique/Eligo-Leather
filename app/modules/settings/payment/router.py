from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.core.dependencies import require_admin

from app.modules.settings.payment import service
from app.modules.settings.payment.schema import (
    PaymentMethodCreate,
    PaymentMethodUpdate,
    PaymentMethodOut,
    PaymentSettingsUpdate,
    PaymentSettingsOut,
)

router = APIRouter(prefix="/payment", tags=["Settings - Payments"], dependencies=[Depends(require_admin)])


@router.post("/seed", status_code=status.HTTP_204_NO_CONTENT)
async def seed_default_payment_methods(db: AsyncSession = Depends(get_db)):
    return await service.seed_default_payment_methods(db)


@router.get("/methods", response_model=list[PaymentMethodOut])
async def list_payment_methods(include_inactive: bool = False, db: AsyncSession = Depends(get_db)):
    return await service.list_payment_methods(db, include_inactive)


@router.post("/methods", response_model=PaymentMethodOut, status_code=status.HTTP_201_CREATED)
async def create_payment_method(data: PaymentMethodCreate, db: AsyncSession = Depends(get_db)):
    return await service.create_payment_method(data, db)


@router.get("/methods/{method_id}", response_model=PaymentMethodOut)
async def get_payment_method(method_id: int, db: AsyncSession = Depends(get_db)):
    method = await service.get_payment_method(method_id, db)
    if not method:
        raise HTTPException(status_code=404, detail="Payment method not found")
    return method


@router.patch("/methods/{method_id}", response_model=PaymentMethodOut)
async def update_payment_method(method_id: int, data: PaymentMethodUpdate, db: AsyncSession = Depends(get_db)):
    method = await service.update_payment_method(method_id, data, db)
    if not method:
        raise HTTPException(status_code=404, detail="Payment method not found")
    return method


@router.post("/methods/{method_id}/deactivate", response_model=PaymentMethodOut)
async def deactivate_payment_method(method_id: int, db: AsyncSession = Depends(get_db)):
    method = await service.deactivate_payment_method(method_id, db)
    if not method:
        raise HTTPException(status_code=404, detail="Payment method not found")
    return method


@router.delete("/methods/{method_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_payment_method(method_id: int, db: AsyncSession = Depends(get_db)):
    deleted = await service.delete_payment_method(method_id, db)
    if not deleted:
        raise HTTPException(status_code=404, detail="Payment method not found")


@router.get("/settings", response_model=PaymentSettingsOut)
async def get_payment_settings(db: AsyncSession = Depends(get_db)):
    return await service.get_payment_settings(db)


@router.patch("/settings", response_model=PaymentSettingsOut)
async def update_payment_settings(data: PaymentSettingsUpdate, db: AsyncSession = Depends(get_db)):
    return await service.update_payment_settings(data, db)
