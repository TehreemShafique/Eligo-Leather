import secrets
import string
from datetime import datetime
from decimal import Decimal, InvalidOperation

from sqlalchemy import select, or_, func
from sqlalchemy.exc import IntegrityError
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

# Characters used for unique welcome coupon codes (uppercase + digits, no
# ambiguous glyphs like 0/O, 1/I/L).  Format: XXXX-XXXX
_WELCOME_CODE_CHARS = string.ascii_uppercase.replace("O", "").replace("I", "") + string.digits.replace("0", "")


def _generate_unique_welcome_code() -> str:
    """Generate a unique, random welcome promo code in the format XXXX-XXXX."""
    part1 = "".join(secrets.choice(_WELCOME_CODE_CHARS) for _ in range(4))
    part2 = "".join(secrets.choice(_WELCOME_CODE_CHARS) for _ in range(4))
    return f"{part1}-{part2}"


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
    user_email: str | None = None,
    ip_address: str | None = None,
    *,
    visitor_id: str | None = None,
) -> WelcomeDiscountResult:
    """Decide whether an anonymous visitor may be shown the welcome offer.

    The visitor is identified by the persistent ``eligo_visitor_id`` cookie
    and is eligible at most once, ever, and only while the campaign is
    active. Email/IP are kept as a backward-compatible fallback for callers
    that cannot supply a visitor id; they are never the primary mechanism.

    Each eligible visitor receives a unique, server-generated coupon code
    that is persisted on their log row. Returning visitors receive the same
    code they were originally assigned.
    """
    settings = await get_welcome_settings(db)
    if not settings.is_active:
        return WelcomeDiscountResult(show_welcome_discount=False)

    already_claimed = False
    existing_code: str | None = None
    if visitor_id:
        result = await db.execute(
            select(WelcomeDiscountLog)
            .where(WelcomeDiscountLog.visitor_id == visitor_id)
            .limit(1),
        )
        log = result.scalar_one_or_none()
        if log is not None:
            already_claimed = True
            existing_code = log.coupon_code
    elif user_email or ip_address:
        result = await db.execute(
            select(WelcomeDiscountLog).where(
                or_(
                    WelcomeDiscountLog.user_email == user_email,
                    WelcomeDiscountLog.ip_address == ip_address,
                ),
            ).limit(1),
        )
        log = result.scalar_one_or_none()
        if log is not None:
            already_claimed = True
            existing_code = log.coupon_code

    if already_claimed:
        return WelcomeDiscountResult(
            show_welcome_discount=False,
            coupon_code=existing_code,
        )

    # Generate a unique code for this new visitor. Retry on rare collision.
    code = _generate_unique_welcome_code()
    for _attempt in range(5):
        try:
            db.add(WelcomeDiscountLog(
                visitor_id=visitor_id,
                user_email=user_email or None,
                ip_address=ip_address or None,
                coupon_code=code,
            ))
            await db.commit()
            return WelcomeDiscountResult(
                show_welcome_discount=True,
                discount_percentage=float(settings.discount_percentage),
                coupon_code=code,
            )
        except IntegrityError:
            # Unique constraint violation on coupon_code — regenerate and retry.
            await db.rollback()
            code = _generate_unique_welcome_code()
        except Exception:
            await db.rollback()
            return WelcomeDiscountResult(show_welcome_discount=False)

    # All retries exhausted (extremely unlikely).
    return WelcomeDiscountResult(show_welcome_discount=False)


async def _find_welcome_log(
    db: AsyncSession,
    *,
    visitor_id: str | None = None,
    user_email: str | None = None,
    ip_address: str | None = None,
) -> WelcomeDiscountLog | None:
    """Locate the welcome claim row for a visitor, preferring the persistent
    visitor id and falling back to email/IP only for legacy rows."""
    if visitor_id:
        result = await db.execute(
            select(WelcomeDiscountLog)
            .where(WelcomeDiscountLog.visitor_id == visitor_id)
            .limit(1),
        )
        log = result.scalar_one_or_none()
        if log is not None:
            return log
    identity_conditions = []
    if user_email:
        identity_conditions.append(WelcomeDiscountLog.user_email == user_email)
    if ip_address:
        identity_conditions.append(WelcomeDiscountLog.ip_address == ip_address)
    if identity_conditions:
        result = await db.execute(
            select(WelcomeDiscountLog).where(
                or_(*identity_conditions),
            ).limit(1),
        )
        return result.scalar_one_or_none()
    return None


async def _find_welcome_log_by_code(
    db: AsyncSession,
    coupon_code: str,
) -> WelcomeDiscountLog | None:
    """Look up a welcome discount log row by its unique coupon code."""
    result = await db.execute(
        select(WelcomeDiscountLog)
        .where(WelcomeDiscountLog.coupon_code == coupon_code)
        .limit(1),
    )
    return result.scalar_one_or_none()


def _log_matches_identity(
    log: WelcomeDiscountLog,
    visitor_id: str | None = None,
    user_email: str | None = None,
    ip_address: str | None = None,
) -> bool:
    """Return True when the given identity is the same as the log's owner.

    The visitor id is the primary identity; email/IP are used only as a
    fallback for legacy rows that predate the visitor cookie.
    """
    if visitor_id:
        return bool(log.visitor_id) and log.visitor_id == visitor_id
    if user_email:
        return bool(log.user_email) and log.user_email == user_email
    if ip_address:
        return bool(log.ip_address) and log.ip_address == ip_address
    # No identity to compare against — ownership can never be proven.
    return False


async def can_redeem_welcome_discount(
    db: AsyncSession,
    *,
    visitor_id: str | None = None,
    user_email: str | None = None,
    ip_address: str | None = None,
    coupon_code: str | None = None,
) -> bool:
    """Read-only: may this visitor still use the one-time welcome code?

    Returns ``True`` only for an active campaign and a visitor who has not
    already redeemed the code. Does not record anything — the actual
    redemption is committed by :func:`redeem_welcome_discount`.

    When ``coupon_code`` is supplied, the code is looked up in the database
    and must belong to the requesting visitor; a code issued to one visitor
    can never be used by another visitor.
    """
    settings = await get_welcome_settings(db)
    if not settings.is_active:
        return False

    if coupon_code:
        log = await _find_welcome_log_by_code(db, coupon_code)
        if log is None:
            return False
        if not _log_matches_identity(log, visitor_id, user_email, ip_address):
            return False
        return log.redeemed_at is None

    # Legacy identity-based check (backwards compatible; unique codes are the
    # only codes used in the welcome flow today).
    log = await _find_welcome_log(
        db,
        visitor_id=visitor_id,
        user_email=user_email,
        ip_address=ip_address,
    )
    return log is None or log.redeemed_at is None


async def redeem_welcome_discount(
    db: AsyncSession,
    *,
    visitor_id: str | None = None,
    user_email: str | None = None,
    ip_address: str | None = None,
    coupon_code: str | None = None,
    commit: bool = True,
) -> bool:
    """Check-and-claim the one-time welcome code at checkout.

    Returns ``True`` only when the visitor is genuinely a first-time welcome
    recipient and marks the claim as redeemed so a returning visitor can never
    apply the code a second time. The campaign must also be active.

    When ``coupon_code`` is supplied, the code is looked up in the database
    and must belong to the requesting visitor; a code issued to one visitor
    can never be used by another visitor.

    By default the redemption is committed immediately. Pass ``commit=False``
    when the caller wants the redemption persisted atomically with the rest of
    its own transaction (e.g. order creation), in which case the unique-code
    race is resolved by that caller's commit handling.
    """
    settings = await get_welcome_settings(db)
    if not settings.is_active:
        return False

    if coupon_code:
        log = await _find_welcome_log_by_code(db, coupon_code)
        if log is None:
            return False
        if not _log_matches_identity(log, visitor_id, user_email, ip_address):
            return False
        if log.redeemed_at is not None:
            return False
        log.redeemed_at = datetime.utcnow()
        if not commit:
            return True
        try:
            await db.commit()
            return True
        except IntegrityError:
            await db.rollback()
            return False

    # Legacy identity-based path (backwards compatible; not used by the
    # current welcome flow, which always supplies a unique coupon code).
    log = await _find_welcome_log(
        db,
        visitor_id=visitor_id,
        user_email=user_email,
        ip_address=ip_address,
    )
    if log is not None and log.redeemed_at is not None:
        return False

    if log is None:
        log = WelcomeDiscountLog(
            visitor_id=visitor_id,
            user_email=user_email or None,
            ip_address=ip_address or None,
        )
        db.add(log)
    log.redeemed_at = datetime.utcnow()

    if not commit:
        return True

    try:
        await db.commit()
        return True
    except IntegrityError:
        # A concurrent request already claimed this visitor (unique visitor id).
        await db.rollback()
        return False


async def consume_welcome_for_order(
    db: AsyncSession,
    *,
    visitor_id: str | None = None,
    user_email: str | None = None,
    ip_address: str | None = None,
    commit: bool = True,
) -> bool:
    """Expire this visitor's outstanding first-time welcome offer.

    Called after a *successful* order is created so the one-time welcome
    coupon can never be used on a later order, even when the just-placed order
    used a different discount code (or none). This closes the gap where a
    visitor saves the welcome code, checks out with another coupon, and would
    otherwise be able to reuse the saved welcome code afterwards.

    Marks the existing ``WelcomeDiscountLog`` row as redeemed — the same
    consumed state the welcome code itself sets — leaving the historical/audit
    row intact. Idempotent: a log that is missing or already redeemed is left
    untouched, so the welcome-redemption path and this path never conflict.

    Ownership resolution deliberately reuses the same visitor-id / email / IP
    mechanism as the rest of the welcome flow (no new identity shortcuts).
    By default the change is committed immediately; pass ``commit=False`` when
    the caller wants it persisted atomically with its own transaction.
    """
    log = await _find_welcome_log(
        db,
        visitor_id=visitor_id,
        user_email=user_email,
        ip_address=ip_address,
    )
    if log is None or log.redeemed_at is not None:
        return False
    log.redeemed_at = datetime.utcnow()

    if not commit:
        return True

    try:
        await db.commit()
        return True
    except IntegrityError:
        await db.rollback()
        return False


async def list_welcome_logs(
    db: AsyncSession, limit: int = 50,
) -> list[dict]:
    """Return the most recent welcome-offer claims for the admin panel."""
    result = await db.execute(
        select(WelcomeDiscountLog)
        .order_by(WelcomeDiscountLog.claimed_at.desc())
        .limit(limit),
    )
    return [
        {
            "id": log.id,
            "visitor_id": log.visitor_id,
            "email": log.user_email,
            "ip_address": log.ip_address,
            "coupon_code": log.coupon_code,
            "claimed_at": log.claimed_at,
            "redeemed_at": log.redeemed_at,
        }
        for log in result.scalars().all()
    ]


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
