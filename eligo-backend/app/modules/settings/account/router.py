from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import oauth2_scheme, require_admin
from app.core.security import decode_access_token
from app.db.session import get_db
from app.modules.auth.model import User
from app.modules.settings.account import service
from app.modules.settings.account.model import LoginProvider
from app.modules.settings.account.schema import (
    AccountProfileOut,
    AccountProfileUpdate,
    AccountResourcesOut,
    ChangePasswordIn,
    LanguageOptionOut,
    LoginServiceConnectIn,
    LoginServiceOut,
    PasswordStatusOut,
    RecoveryCodesOut,
    RegionalFormatOut,
    SecondaryEmailOut,
    SecondaryEmailUpdateIn,
    SessionOut,
    SessionRevokedOut,
    TimezoneOut,
    TotpSetupOut,
    TotpVerifyIn,
    TwoFactorStatusOut,
)

router = APIRouter(
    prefix="/account",
    tags=["Settings - Account"],
    dependencies=[Depends(require_admin)],
)


def _current_jti(credentials=Depends(oauth2_scheme)) -> str | None:
    try:
        return decode_access_token(credentials.credentials).get("jti")
    except Exception:
        return None


# =====================================================================
# General: profile
# =====================================================================


@router.get("/profile", response_model=AccountProfileOut)
async def get_profile(current_user: User = Depends(require_admin)):
    return service._profile_out(current_user)


@router.patch("/profile", response_model=AccountProfileOut)
async def update_profile(
    data: AccountProfileUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    try:
        return await service.update_profile(db, current_user, data)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc))


@router.get("/languages", response_model=list[LanguageOptionOut])
async def list_languages():
    from app.modules.settings.languages.service import get_available_languages

    return [
        LanguageOptionOut(code=l["code"], name=l["name"], native_name=l.get("native_name"))
        for l in get_available_languages()
    ]


@router.get("/regional-formats", response_model=list[RegionalFormatOut])
async def list_regional_formats():
    return service.list_regional_formats()


@router.get("/timezones", response_model=list[TimezoneOut])
async def list_timezones():
    return service.list_timezones()


@router.get("/resources", response_model=AccountResourcesOut)
async def get_resources():
    return service.ACCOUNT_RESOURCES


# =====================================================================
# General: login services (SSO)
# =====================================================================


@router.get("/login-services", response_model=list[LoginServiceOut])
async def list_login_services(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    return await service.list_login_services(db, current_user)


@router.post("/login-services", response_model=LoginServiceOut, status_code=status.HTTP_201_CREATED)
async def connect_login_service(
    data: LoginServiceConnectIn,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    try:
        return await service.connect_login_service(db, current_user, data.provider, data.external_id)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc))


@router.delete("/login-services/{service_id}", status_code=status.HTTP_204_NO_CONTENT)
async def disconnect_login_service(
    service_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    removed = await service.disconnect_login_service(db, current_user, service_id)
    if not removed:
        raise HTTPException(status_code=404, detail="Login service not found")


# =====================================================================
# Security: password
# =====================================================================


@router.get("/security/password-status", response_model=PasswordStatusOut)
async def password_status(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    return await service.password_status(db, current_user)


@router.post("/security/change-password", status_code=status.HTTP_204_NO_CONTENT)
async def change_password(
    data: ChangePasswordIn,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin),
    current_jti: str | None = Depends(_current_jti),
):
    try:
        await service.change_password(db, current_user, data.current_password, data.new_password, current_jti)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc))


@router.get("/security/secondary-email", response_model=SecondaryEmailOut)
async def get_secondary_email(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    return await service.get_secondary_email(db, current_user)


@router.put("/security/secondary-email", response_model=SecondaryEmailOut)
async def set_secondary_email(
    data: SecondaryEmailUpdateIn,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    return await service.set_secondary_email(db, current_user, data)


@router.delete("/security/secondary-email", response_model=SecondaryEmailOut)
async def remove_secondary_email(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    return await service.remove_secondary_email(db, current_user)


# =====================================================================
# Security: two-factor
# =====================================================================


@router.get("/security/two-factor", response_model=TwoFactorStatusOut)
async def two_factor_status(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    return await service.two_factor_status(db, current_user)


@router.post("/security/two-factor/setup", response_model=TotpSetupOut)
async def start_totp_setup(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    try:
        return await service.start_totp_setup(db, current_user)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc))


@router.post("/security/two-factor/verify", response_model=TwoFactorStatusOut)
async def verify_totp_setup(
    data: TotpVerifyIn,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    try:
        return await service.verify_totp_setup(db, current_user, data)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc))


@router.post("/security/two-factor/disable", response_model=TwoFactorStatusOut)
async def disable_two_factor(
    data: TotpVerifyIn,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    try:
        return await service.disable_two_factor(db, current_user, data)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc))


@router.post("/security/two-factor/recovery-codes", response_model=RecoveryCodesOut)
async def generate_recovery_codes(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    return await service.generate_recovery_codes(db, current_user)


# =====================================================================
# Security: active sessions ledger
# =====================================================================


@router.get("/security/sessions", response_model=list[SessionOut])
async def list_sessions(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin),
    current_jti: str | None = Depends(_current_jti),
):
    return await service.list_sessions(db, current_user, current_jti)


@router.post("/security/sessions/{session_id}/revoke", response_model=SessionRevokedOut)
async def revoke_session(
    session_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin),
    current_jti: str | None = Depends(_current_jti),
):
    result = await service.revoke_session(db, current_user, session_id, current_jti)
    if not result:
        raise HTTPException(status_code=404, detail="Session not found")
    return result


# =====================================================================
# Seed (demo ledger data)
# =====================================================================


@router.post("/seed", status_code=status.HTTP_201_CREATED)
async def seed(db: AsyncSession = Depends(get_db)):
    await service.seed_defaults(db)
    return {"status": "ok"}
