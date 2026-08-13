from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.core.dependencies import require_admin

from app.modules.settings.customer_accounts import service
from app.modules.settings.customer_accounts.schema import (
    CustomerAccountSettingsUpdate,
    CustomerAccountSettingsOut,
)

router = APIRouter(
    prefix="/customer-accounts",
    tags=["Settings - Customer Accounts"],
    dependencies=[Depends(require_admin)],
)


@router.post("/seed", status_code=status.HTTP_204_NO_CONTENT)
async def seed_customer_account_settings(db: AsyncSession = Depends(get_db)):
    return await service.seed_default_settings(db)


@router.get("/settings", response_model=CustomerAccountSettingsOut)
async def get_customer_account_settings(db: AsyncSession = Depends(get_db)):
    return await service.get_settings(db)


@router.patch("/settings", response_model=CustomerAccountSettingsOut)
async def update_customer_account_settings(
    data: CustomerAccountSettingsUpdate,
    db: AsyncSession = Depends(get_db),
):
    return await service.update_settings(data, db)
