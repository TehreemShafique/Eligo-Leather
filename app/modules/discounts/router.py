from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.core.dependencies import get_current_user, require_discount_manager
from app.modules.auth.model import User
from app.modules.discounts import service
from app.modules.discounts.schema import (
    DiscountCreate,
    DiscountUpdate,
    DiscountOut,
    WelcomeDiscountOut,
    WelcomeDiscountUpdate,
)

router = APIRouter(
    prefix="/discounts",
    tags=["Discounts"],
    dependencies=[Depends(get_current_user)],
)


@router.post("/", response_model=DiscountOut, status_code=status.HTTP_201_CREATED)
async def create_discount(
    data: DiscountCreate,
    db: AsyncSession = Depends(get_db),
):
    return await service.create_discount(db, data)


@router.get("/", response_model=list[DiscountOut])
async def list_discounts(
    search: str | None = Query(None),
    status_filter: str | None = Query(None, alias="status"),
    method: str | None = Query(None),
    discount_type: str | None = Query(None, alias="type"),
    eligibility: str | None = Query(None),
    start_date: datetime | None = Query(None),
    end_date: datetime | None = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    db: AsyncSession = Depends(get_db),
):
    return await service.list_discounts(
        db,
        search=search,
        status=status_filter,
        method=method,
        discount_type=discount_type,
        eligibility=eligibility,
        start_date=start_date,
        end_date=end_date,
        skip=skip,
        limit=limit,
    )


# =====================================================================
# Welcome Discount config (admin / staff only)
# =====================================================================

@router.get("/welcome", response_model=WelcomeDiscountOut)
async def get_welcome_discount_settings(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_discount_manager),
):
    return await service.get_welcome_settings(db)


@router.patch("/welcome", response_model=WelcomeDiscountOut)
async def update_welcome_discount_settings(
    data: WelcomeDiscountUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_discount_manager),
):
    return await service.update_welcome_settings(db, data, current_user.id)


@router.get("/{discount_id}", response_model=DiscountOut)
async def get_discount(
    discount_id: int,
    db: AsyncSession = Depends(get_db),
):
    discount = await service.get_discount(db, discount_id)
    if not discount:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Discount not found",
        )
    return discount


@router.patch("/{discount_id}", response_model=DiscountOut)
async def update_discount(
    discount_id: int,
    data: DiscountUpdate,
    db: AsyncSession = Depends(get_db),
):
    discount = await service.update_discount(db, discount_id, data)
    if not discount:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Discount not found",
        )
    return discount


@router.delete("/{discount_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_discount(
    discount_id: int,
    db: AsyncSession = Depends(get_db),
):
    deleted = await service.delete_discount(db, discount_id)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Discount not found",
        )
