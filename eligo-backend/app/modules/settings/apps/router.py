from fastapi import APIRouter, Depends, HTTPException, Query, status, UploadFile, File as FileParam
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.core.dependencies import require_admin

from app.modules.settings.apps import service
from app.modules.settings.apps.adapters import AdapterError
from app.modules.content.service import convert_image_to_webp, save_upload
from app.modules.settings.apps.reviews import (
    create_review as db_create_review,
    list_reviews as db_list_reviews,
    review_summary as db_review_summary,
)
from app.modules.settings.apps.model import AppStatus
from app.modules.settings.apps.schema import (
    AppActionRequest,
    AppActionResult,
    AppDefinition,
    AppInstall,
    AppOut,
    AppUpdate,
)

router = APIRouter(
    prefix="/apps",
    tags=["Settings - Apps"],
    dependencies=[Depends(require_admin)],
)


@router.get("", response_model=list[AppDefinition])
async def list_apps(db: AsyncSession = Depends(get_db)):
    """Full app store catalog with per-app installed/status flags."""
    return await service.list_apps(db)


@router.get("/installed", response_model=list[AppOut])
async def list_installed_apps(db: AsyncSession = Depends(get_db)):
    """Only the apps the store has installed."""
    return await service.list_installed(db)


@router.get("/{app_code}", response_model=AppDefinition)
async def get_app(app_code: str, db: AsyncSession = Depends(get_db)):
    app = await service.get_app(app_code, db)
    if not app:
        raise HTTPException(status_code=404, detail="App not found")
    return app


@router.post("/{app_code}/install", response_model=AppOut, status_code=status.HTTP_201_CREATED)
async def install_app(app_code: str, data: AppInstall, db: AsyncSession = Depends(get_db)):
    data.app_code = app_code
    try:
        return await service.install(data, db)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc))


@router.patch("/{app_code}", response_model=AppOut)
async def update_app(app_code: str, data: AppUpdate, db: AsyncSession = Depends(get_db)):
    app = await service.update(app_code, data, db)
    if not app:
        raise HTTPException(status_code=404, detail="App is not installed")
    return app


@router.post("/{app_code}/activate", response_model=AppOut)
async def activate_app(app_code: str, db: AsyncSession = Depends(get_db)):
    app = await service.set_status(app_code, AppStatus.active, db)
    if not app:
        raise HTTPException(status_code=404, detail="App is not installed")
    return app


@router.post("/{app_code}/deactivate", response_model=AppOut)
async def deactivate_app(app_code: str, db: AsyncSession = Depends(get_db)):
    app = await service.set_status(app_code, AppStatus.inactive, db)
    if not app:
        raise HTTPException(status_code=404, detail="App is not installed")
    return app


@router.post("/{app_code}/uninstall", status_code=status.HTTP_204_NO_CONTENT)
async def uninstall_app(app_code: str, db: AsyncSession = Depends(get_db)):
    deleted = await service.uninstall(app_code, db)
    if not deleted:
        raise HTTPException(status_code=404, detail="App is not installed")


@router.post("/{app_code}/action", response_model=AppActionResult)
async def run_app_action(
    app_code: str,
    data: AppActionRequest,
    db: AsyncSession = Depends(get_db),
):
    """Generic action dispatch - calls the provider adapter for the app."""
    try:
        return await service.run_action(app_code, data.action, data.payload, db)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    except AdapterError as exc:
        raise HTTPException(status_code=502, detail=str(exc))


# =====================================================================
# PROVIDER SPECIFIC APIS
# ---------------------------------------------------------------------
# Add the dedicated SMS / email / payments endpoints BELOW this marker.
# They reuse the generic action dispatcher via
# service.run_action(...) or call a provider adapter directly.
#
# Examples:
#   @router.post("/{app_code}/sms/send", response_model=AppActionResult)
#   async def send_sms(app_code: str, data: SmsSendRequest, db=Depends(get_db)):
#       return await service.run_action(app_code, "send_sms", data.model_dump(), db)
#
#   @router.post("/{app_code}/email/send", response_model=AppActionResult)
#   async def send_email(app_code: str, data: EmailSendRequest, db=Depends(get_db)):
#       return await service.run_action(app_code, "send_email", data.model_dump(), db)
#
#   @router.post("/{app_code}/payments/intent", response_model=AppActionResult)
#   async def create_payment_intent(app_code: str, data: PaymentIntentRequest, db=Depends(get_db)):
#       return await service.run_action(app_code, "create_payment_intent", data.model_dump(), db)
#
#   @router.post("/{app_code}/shipments", response_model=AppActionResult)
#   async def create_shipment(app_code: str, data: ShipmentCreateRequest, db=Depends(get_db)):
#       return await service.run_action(app_code, "create_shipment", data.model_dump(), db)
#
#   @router.get("/{app_code}/tracking/{tracking_number}", response_model=AppActionResult)
#   async def track_shipment(app_code: str, tracking_number: str, db=Depends(get_db)):
#       return await service.run_action(app_code, "track_shipment", {"tracking_number": tracking_number}, db)
# =====================================================================


# =====================================================================
# PUBLIC STOREFRONT ROUTER (no auth) - Supabase product reviews
# ---------------------------------------------------------------------
# Customers can read APPROVED reviews and submit new (pending) ones.
# Approval/moderation stays admin-only via the action endpoint above.
# =====================================================================

REVIEWS_APP_CODE = "supabase_reviews"


class PublicReviewCreate(BaseModel):
    external_id: str | None = Field(
        default=None, description="Product id/handle the review belongs to"
    )
    reviewer_name: str = Field(min_length=1, max_length=120)
    reviewer_email: str | None = Field(default=None, max_length=200)
    rating: int = Field(ge=1, le=5)
    title: str | None = Field(default=None, max_length=200)
    body: str = Field(min_length=1, max_length=4000)
    images: list[str] = Field(
        default_factory=list,
        description="Public URLs of photos the customer uploaded for this review.",
    )


public_router = APIRouter(prefix="/apps", tags=["Apps - Storefront"])


def _ensure_reviews_app(app_code: str) -> None:
    if app_code != REVIEWS_APP_CODE:
        raise HTTPException(status_code=404, detail="App not found")


@public_router.get("/{app_code}/public/reviews/summary")
async def public_review_summary(
    app_code: str,
    product_id: str | None = Query(default=None),
    db: AsyncSession = Depends(get_db),
):
    """Average star rating + review count computed from APPROVED reviews.

    Reviews are read from the store's own database. When product_id is
    provided it returns a single summary for that product; otherwise it
    returns one summary per product across all approved reviews.
    """
    _ensure_reviews_app(app_code)
    result = await db_review_summary(db, product_id)
    if product_id:
        if isinstance(result, dict):
            return result
        return {"product_id": str(product_id), "average_rating": 0, "review_count": 0}
    return result or []


@public_router.get("/{app_code}/public/reviews")
async def public_list_reviews(
    app_code: str,
    product_id: str | None = Query(default=None),
    page: int = Query(default=1, ge=1),
    per_page: int = Query(default=12, ge=1, le=50),
    db: AsyncSession = Depends(get_db),
):
    """Approved reviews only - pending/rejected rows never reach the storefront."""
    _ensure_reviews_app(app_code)
    return await db_list_reviews(
        db, product_id=product_id, status="approved", page=page, per_page=per_page
    )


@public_router.post("/{app_code}/public/reviews/upload")
async def public_upload_review_photos(
    app_code: str,
    files: list[UploadFile] = FileParam(default=[]),
):
    """Upload one or more customer review photos (no auth).

    Each image is converted to WebP and stored under /static/uploads; the
    returned array of public URLs is then submitted with the review so the
    admin and the storefront can display the customer's photos.
    """
    _ensure_reviews_app(app_code)
    if app_code != REVIEWS_APP_CODE:
        raise HTTPException(status_code=404, detail="App not found")
    if not files:
        return {"success": True, "urls": [], "message": "No files provided"}

    MAX_FILES = 6
    if len(files) > MAX_FILES:
        raise HTTPException(
            status_code=400,
            detail=f"Too many images. Maximum is {MAX_FILES}.",
        )

    urls: list[str] = []
    for file in files[:MAX_FILES]:
        if file.size and file.size > 8 * 1024 * 1024:
            raise HTTPException(
                status_code=400,
                detail=f"Image is too large: {file.filename}.",
            )
        content = await file.read()
        if not content:
            continue
        try:
            webp_bytes, webp_filename, _ = convert_image_to_webp(
                content, file.filename or "review.png"
            )
            urls.append(save_upload(webp_bytes, webp_filename, folder="reviews"))
        except Exception:
            raise HTTPException(
                status_code=400,
                detail=f"Could not process image: {file.filename}.",
            )

    if not urls:
        raise HTTPException(status_code=400, detail="No valid images were uploaded.")

    return {"success": True, "urls": urls}


@public_router.post("/{app_code}/public/reviews", status_code=status.HTTP_201_CREATED)
async def public_create_review(
    app_code: str,
    data: PublicReviewCreate,
    db: AsyncSession = Depends(get_db),
):
    """Customer-submitted review; stored as pending for admin moderation."""
    _ensure_reviews_app(app_code)
    return await db_create_review(
        db,
        {
            "external_id": data.external_id,
            "reviewer_name": data.reviewer_name,
            "reviewer_email": data.reviewer_email or "",
            "rating": data.rating,
            "title": data.title or "",
            "body": data.body,
            "images": data.images or [],
        },
    )
