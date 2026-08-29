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
)


@router.post("/", response_model=DiscountOut, status_code=status.HTTP_201_CREATED)
async def create_discount(
    data: DiscountCreate,
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(require_discount_manager),
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
    _user2: User = Depends(require_discount_manager),
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
    _user3: User = Depends(require_discount_manager),
):
    return await service.get_welcome_settings(db)


@router.patch("/welcome", response_model=WelcomeDiscountOut)
async def update_welcome_discount_settings(
    data: WelcomeDiscountUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_discount_manager),
):
    return await service.update_welcome_settings(
        db, data, updated_by=current_user.id
    )


@router.get("/welcome/logs")
async def list_welcome_discount_logs(
    limit: int = Query(50, ge=1, le=200),
    db: AsyncSession = Depends(get_db),
    _user7: User = Depends(require_discount_manager),
):
    """Return the most recent welcome-offer claims (tracked by visitor id)."""
    return await service.list_welcome_logs(db, limit=limit)


@router.get("/{discount_id}", response_model=DiscountOut)
async def get_discount(
    discount_id: int,
    db: AsyncSession = Depends(get_db),
    _user4: User = Depends(require_discount_manager),
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
    _user5: User = Depends(require_discount_manager),
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
    _user6: User = Depends(require_discount_manager),
):
    deleted = await service.delete_discount(db, discount_id)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Discount not found",
        )


# =====================================================================
# Public Endpoints (Customer Storefront Welcome Scratch & Win)
# =====================================================================

public_discounts_router = APIRouter(
    prefix="/discounts/public",
    tags=["Discounts (Public)"],
)


@public_discounts_router.post("/welcome-check")
async def check_welcome_discount(
    payload: dict,
    db: AsyncSession = Depends(get_db),
):
    """Decide whether an anonymous visitor is eligible for the Welcome
    Scratch & Win offer.

    The visitor is identified by the persistent ``eligo_visitor_id`` cookie
    (never by IP/email). A visitor is eligible at most once, and only while
    the admin campaign is active. Any failure to identify the visitor or to
    reach the settings/config results in ``eligibility: false``.
    """
    visitor_id = (payload.get("visitor_id") or "").strip() or None
    email = (payload.get("email") or "").strip() or None
    ip_address = (payload.get("ip_address") or "").strip() or None

    if not visitor_id and not email and not ip_address:
        return {
            "eligible": False,
            "discount_percentage": None,
            "coupon_code": None,
            "is_active": None,
        }

    res = await service.evaluate_welcome_discount(
        db,
        user_email=email,
        ip_address=ip_address,
        visitor_id=visitor_id,
    )
    settings = await service.get_welcome_settings(db)
    pct = int(float(settings.discount_percentage))

    return {
        "eligible": bool(res.show_welcome_discount),
        "discount_percentage": float(settings.discount_percentage),
        "coupon_code": f"WELCOME{pct}",
        "is_active": bool(settings.is_active),
    }


@public_discounts_router.post("/verify-coupon")
async def verify_coupon(
    payload: dict,
    db: AsyncSession = Depends(get_db),
):
    """Verify a discount code entered at checkout and compute the discounted
    subtotal.

    Two families of codes are supported:
    - the admin-created store promos (rows in the ``discounts`` table), and
    - the welcome scratch-and-win code (``WELCOME<n>`` backed by the global
      welcome settings).
    """
    code = (payload.get("code") or "").strip().upper()
    subtotal = float(payload.get("subtotal") or 0)
    # Optional cart line detail (product_id / variant_id / total_price) so a
    # discount scoped to specific products/variants is previewed correctly.
    line_items = payload.get("items") if isinstance(payload.get("items"), list) else None

    settings = await service.get_welcome_settings(db)
    pct = int(float(settings.discount_percentage))
    welcome_code = f"WELCOME{pct}"

    if code.startswith("WELCOME") or code == "WELCOME":
        discount_pct = float(settings.discount_percentage or 5)
        discount_amount = round((subtotal * discount_pct) / 100.0, 2)
        discounted_subtotal = round(subtotal - discount_amount, 2)
        return {
            "valid": True,
            "code": code,
            "discount_type": "welcome_discount",
            "discount_percentage": discount_pct,
            "discount_amount": discount_amount,
            "discounted_subtotal": discounted_subtotal,
            "message": f"{discount_pct}% Welcome discount applied! You saved Rs. {discount_amount}.",
        }

    promo = await service.validate_promo_code(db, code, subtotal, line_items=line_items)
    result = {
        "valid": promo["valid"],
        "code": promo["code"] or code,
        "discount_type": promo["discount_type"],
        "discount_percentage": promo["discount_percentage"],
        "discount_amount": float(promo["discount_amount"]),
        "discounted_subtotal": float(promo["discounted_subtotal"]),
        "message": promo["message"],
    }
    if result["valid"]:
        return result

    # Backwards-compatible shape when the code is unknown or unusable.
    result["discount_amount"] = 0
    result["discounted_subtotal"] = subtotal
    return result
