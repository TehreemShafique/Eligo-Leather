from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.core.dependencies import require_admin
from app.modules.settings.legal_privacy import service
from app.modules.settings.legal_privacy.model import PolicyType
from app.modules.settings.legal_privacy.schema import (
    PrivacySettingsOut,
    PrivacySettingsSaveResponse,
    PrivacySettingsUpdate,
    PublicPolicyOut,
    PublicPrivacySettingsOut,
    StorePolicyOut,
    StorePolicyUpdate,
)

# =====================================================================
# ADMIN ROUTER (Settings -> Legal, Privacy & Policies)
# =====================================================================

router = APIRouter(
    prefix="/legal-privacy",
    tags=["Settings - Legal & Privacy"],
    dependencies=[Depends(require_admin)],
)


@router.get("/policies", response_model=list[StorePolicyOut])
async def list_policies(db: AsyncSession = Depends(get_db)):
    return await service.list_policies(db)


@router.get("/policies/{policy_type}", response_model=StorePolicyOut)
async def get_policy(policy_type: PolicyType, db: AsyncSession = Depends(get_db)):
    policy = await service.get_policy(db, policy_type)
    if not policy:
        raise HTTPException(status_code=404, detail="Policy not found")
    return policy


@router.put("/policies", response_model=StorePolicyOut)
async def update_policy(data: StorePolicyUpdate, db: AsyncSession = Depends(get_db)):
    try:
        return await service.upsert_policy(data, db)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc))


@router.post("/policies/{policy_type}/regenerate", response_model=StorePolicyOut)
async def regenerate_policy(policy_type: PolicyType, db: AsyncSession = Depends(get_db)):
    try:
        return await service.regenerate_policy(policy_type, db)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc))


@router.get("/privacy-settings", response_model=PrivacySettingsOut)
async def get_privacy_settings(db: AsyncSession = Depends(get_db)):
    return await service.get_privacy_settings(db)


@router.post("/privacy-settings", response_model=PrivacySettingsSaveResponse)
async def save_privacy_settings(
    data: PrivacySettingsUpdate, db: AsyncSession = Depends(get_db)
):
    """Save cookie banner / tracking preferences and (re)sync the automated
    "Do Not Sell My Info" footer-menu link for the chosen target.
    """
    return await service.update_privacy_settings(data, db)


@router.post("/seed", status_code=status.HTTP_201_CREATED)
async def seed(db: AsyncSession = Depends(get_db)):
    await service.seed_defaults(db)
    return {"status": "ok"}


# =====================================================================
# PUBLIC ROUTER (storefront - no auth)
# =====================================================================

public_router = APIRouter(
    prefix="/legal-privacy/public",
    tags=["Legal & Privacy - Storefront"],
)


@public_router.get("/settings", response_model=PublicPrivacySettingsOut)
async def public_settings(db: AsyncSession = Depends(get_db)):
    """Cookie banner config + tracking gate for the storefront layout JS."""
    return await service.get_public_settings(db)


@public_router.get("/policies", response_model=list[PublicPolicyOut])
async def public_policies(db: AsyncSession = Depends(get_db)):
    """Policy pages rendered as live links in the footer."""
    return await service.get_public_policies(db)
