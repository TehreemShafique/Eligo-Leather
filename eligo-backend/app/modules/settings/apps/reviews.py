"""Product reviews stored directly in the eligo-backend database.

These functions replace the old Supabase-backed review adapters. Reviews are
written to the `reviews` table (see app/modules/settings/apps/model.py) on the
store's own PostgreSQL instance. Customers submit rows that start as
'pending'; an admin approves them in Settings -> Apps -> Supabase Reviews,
after which they become visible on the storefront.
"""

from sqlalchemy import Select, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.settings.apps.model import Review, ReviewStatus


def _serialize(review: Review) -> dict:
    images = review.images or []
    status = (
        review.status.value
        if isinstance(review.status, ReviewStatus)
        else review.status
    )
    created_at = (
        review.created_at.isoformat() if review.created_at else None
    )
    return {
        "id": review.id,
        "product_id": review.product_id,
        "reviewer_name": review.reviewer_name,
        "reviewer_email": review.reviewer_email or "",
        "rating": review.rating,
        "title": review.title,
        "body": review.body,
        "status": status,
        "avatar_url": None,
        "images": images,
        "photo_urls": images,
        "created_at": created_at,
    }


def _base_query() -> Select:
    return select(Review).order_by(Review.created_at.desc(), Review.id.desc())


async def create_review(db: AsyncSession, payload: dict) -> dict:
    """Insert a customer review as 'pending' for admin moderation."""
    review = Review(
        product_id=payload.get("external_id") or payload.get("product_id"),
        reviewer_name=payload["reviewer_name"],
        reviewer_email=payload.get("reviewer_email") or None,
        rating=payload["rating"],
        title=payload.get("title") or None,
        body=payload["body"],
        images=payload.get("images") or [],
        status=ReviewStatus.pending,
    )
    db.add(review)
    await db.commit()
    await db.refresh(review)
    return {"success": True, "review": _serialize(review)}


async def list_reviews(
    db: AsyncSession,
    product_id: str | None = None,
    status: str | None = None,
    page: int = 1,
    per_page: int = 20,
) -> list[dict]:
    """Return reviews filtered by product and/or approval status, newest first."""
    query = _base_query()
    if product_id is not None:
        query = query.where(Review.product_id == str(product_id))
    if status is not None:
        query = query.where(Review.status == ReviewStatus(status))
    offset = (page - 1) * per_page
    query = query.limit(per_page).offset(offset)
    result = await db.execute(query)
    return [_serialize(r) for r in result.scalars().all()]


async def review_summary(
    db: AsyncSession,
    product_id: str | None = None,
) -> list[dict] | dict | None:
    """Average rating + count computed from APPROVED reviews.

    With product_id: returns {product_id, average_rating, review_count} or the
    all-zero summary dict. Without: returns a list of per-product summaries.
    """
    if product_id is not None:
        rows = await list_reviews(
            db, product_id=product_id, status="approved", page=1, per_page=10000
        )
        count = len(rows)
        avg = round(sum(r["rating"] for r in rows) / count, 2) if count else 0
        return {
            "product_id": str(product_id),
            "average_rating": avg,
            "review_count": count,
        }
    return await all_summaries(db)


async def all_summaries(db: AsyncSession) -> list[dict]:
    """Per-product approved summaries keyed for the whole catalog."""
    approved = await list_reviews(db, status="approved", page=1, per_page=100000)
    per_product: dict[str, list[int]] = {}
    for r in approved:
        pid = str(r["product_id"]) if r["product_id"] is not None else ""
        per_product.setdefault(pid, []).append(r["rating"])
    summaries = []
    for pid, ratings in per_product.items():
        summaries.append(
            {
                "product_id": pid,
                "average_rating": round(sum(ratings) / len(ratings), 2),
                "review_count": len(ratings),
            }
        )
    return summaries


async def update_review_status(
    db: AsyncSession,
    review_id: int,
    status: str,
) -> dict | None:
    """Set a review's moderation status (approved / rejected / pending)."""
    result = await db.execute(select(Review).where(Review.id == review_id))
    review = result.scalar_one_or_none()
    if review is None:
        return None
    review.status = ReviewStatus(status)
    await db.commit()
    await db.refresh(review)
    return {"success": True, "review": _serialize(review)}


async def delete_review(db: AsyncSession, review_id: int) -> bool:
    """Permanently delete a review row."""
    result = await db.execute(select(Review).where(Review.id == review_id))
    review = result.scalar_one_or_none()
    if review is None:
        return False
    await db.delete(review)
    await db.commit()
    return True
