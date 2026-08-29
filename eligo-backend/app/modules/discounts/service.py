from datetime import datetime
from decimal import Decimal, InvalidOperation

from sqlalchemy import select, or_, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.discounts.model import (
    Discount,
    WelcomeDiscountLog,
    WelcomeDiscountSettings,
    DiscountStatus,
    DiscountMethod,
    DiscountType,
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


# =====================================================================
# Admin-created promo codes
# =====================================================================

def _to_decimal(value, fallback: Decimal = Decimal("0")) -> Decimal:
    try:
        return Decimal(str(value))
    except (InvalidOperation, TypeError, ValueError):
        return fallback


def _build_invalid(code: str, message: str) -> dict:
    return {
        "valid": False,
        "code": code,
        "discount_type": None,
        "discount_percentage": None,
        "discount_amount": Decimal("0"),
        "discounted_subtotal": Decimal("0"),
        "message": message,
    }


def _scoped_subtotal(discount, line_items, fallback: Decimal) -> Decimal:
    """Return the dollar base the discount may be applied to.

    If the discount is scoped to specific products/variants, only the line
    items that match those IDs contribute. When no line detail is supplied
    (or the discount is unscoped) the full fallback subtotal is used.
    """
    product_ids = set(discount.applies_to_products or [])
    variant_ids = set(discount.applies_to_variants or [])
    if (not product_ids and not variant_ids) or not line_items:
        return fallback

    total = Decimal("0")
    for item in line_items:
        pid = item.get("product_id")
        vid = item.get("variant_id")
        if pid in product_ids or vid in variant_ids:
            total += _to_decimal(item.get("total_price") or item.get("price") or 0)
    return total.quantize(Decimal("0.01"))


async def validate_promo_code(
    db: AsyncSession,
    code: str,
    subtotal: Decimal | str | float,
    line_items: list[dict] | None = None,
) -> dict:
    """Validate an admin-created promo code (from the ``discounts`` table)
    against the live catalog subtotal.

    Returns a plain dict so both the public ``verify-coupon`` endpoint and
    the order-creation flow share exactly one source of truth. Only codes
    created by the admin are validated here; the welcome scratch-and-win
    code (WELCOME+) stays a separate flow.

    When the discount is scoped to specific products/variants, ``line_items``
    (each with ``product_id``, ``variant_id`` and ``total_price``) restricts
    the discount to the matching line items only.
    """
    normalized = (code or "").strip().upper()
    subtotal_dec = _to_decimal(subtotal)

    if not normalized:
        return _build_invalid(normalized, "Please enter a discount code.")

    result = await db.execute(
        select(Discount).where(func.lower(func.coalesce(Discount.code, "")) == normalized.lower()),
    )
    discount = result.scalar_one_or_none()

    if discount is None:
        return _build_invalid(normalized, f"Discount code '{normalized}' is not valid.")

    if discount.method != DiscountMethod.code:
        return _build_invalid(normalized, f"Discount code '{normalized}' is not valid.")

    if discount.status != DiscountStatus.active:
        return _build_invalid(normalized, f"Discount code '{normalized}' has expired.")

    now = datetime.utcnow()
    if discount.start_date is not None and discount.start_date > now:
        return _build_invalid(normalized, f"Discount code '{normalized}' is not active yet.")
    if discount.end_date is not None and discount.end_date < now:
        return _build_invalid(normalized, f"Discount code '{normalized}' has expired.")

    # Discountable base = only the cart lines in the product/variant scope.
    scope_dec = _scoped_subtotal(discount, line_items, subtotal_dec)
    if scope_dec <= 0:
        return _build_invalid(
            normalized,
            f"Discount code '{normalized}' does not apply to the items in your cart.",
        )

    if discount.type == DiscountType.percentage or discount.percentage_value is not None:
        pct = _to_decimal(discount.percentage_value)
        if pct <= 0:
            return _build_invalid(
                normalized, f"Discount code '{normalized}' has no discount value configured."
            )
        discount_amount = (scope_dec * pct / Decimal("100")).quantize(Decimal("0.01"))
        discounted_subtotal = (subtotal_dec - discount_amount).quantize(Decimal("0.01"))
        return {
            "valid": True,
            "code": normalized,
            "discount_type": "percentage",
            "discount_percentage": float(pct),
            "discount_amount": discount_amount,
            "discounted_subtotal": discounted_subtotal,
            "message": (
                f"{pct}% discount applied with code {normalized}! "
                f"You saved Rs. {discount_amount:,.2f}."
            ),
        }

    if discount.type == DiscountType.fixed_amount or discount.value_amount is not None:
        amount = _to_decimal(discount.value_amount)
        if amount <= 0:
            return _build_invalid(
                normalized, f"Discount code '{normalized}' has no discount value configured."
            )
        discount_amount = min(amount, scope_dec).quantize(Decimal("0.01"))
        discounted_subtotal = (subtotal_dec - discount_amount).quantize(Decimal("0.01"))
        return {
            "valid": True,
            "code": normalized,
            "discount_type": "fixed_amount",
            "discount_percentage": None,
            "discount_amount": discount_amount,
            "discounted_subtotal": discounted_subtotal,
            "message": (
                f"Rs. {discount_amount:,.2f} discount applied with code {normalized}. "
                f"You saved Rs. {discount_amount:,.2f}."
            ),
        }

    return _build_invalid(normalized, f"Discount code '{normalized}' is not valid.")
