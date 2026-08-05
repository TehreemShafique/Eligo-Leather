import base64
import hashlib
import hmac
import ipaddress
import os
import secrets
import struct
import time
from datetime import datetime, timedelta, timezone
from zoneinfo import ZoneInfo, available_timezones

import httpx
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import decode_access_token, hash_password, verify_password
from app.modules.auth.model import User
from app.modules.settings.account.model import (
    LoginProvider,
    UserLoginService,
    UserRecoveryCode,
    UserSession,
)
from app.modules.settings.account.schema import (
    AccountProfileOut,
    AccountProfileUpdate,
    PasswordStatusOut,
    RecoveryCodesOut,
    SecondaryEmailOut,
    SecondaryEmailUpdateIn,
    SessionOut,
    SessionRevokedOut,
    TotpSetupOut,
    TotpVerifyIn,
    TwoFactorStatusOut,
)
from app.modules.settings.apps.crypto import decrypt_credentials, encrypt_credentials
from app.modules.settings.security.service import log_activity

# =====================================================================
# CONSTANTS / CATALOGS
# =====================================================================

TOTP_ISSUER = "Eligo Leather"
TOTP_PERIOD = 30
TOTP_DIGITS = 6

REGIONAL_FORMATS: list[dict] = [
    {"code": "en-PK", "label": "English (Pakistan)", "language": "English", "country": "Pakistan",
     "formats": {"date": "DD/MM/YYYY", "time": "hh:mm", "currency": "PKR", "numbers": "1,234.56"}},
    {"code": "en-US", "label": "English (United States)", "language": "English", "country": "United States",
     "formats": {"date": "MM/DD/YYYY", "time": "hh:mm AM/PM", "currency": "USD", "numbers": "1,234.56"}},
    {"code": "en-GB", "label": "English (United Kingdom)", "language": "English", "country": "United Kingdom",
     "formats": {"date": "DD/MM/YYYY", "time": "hh:mm", "currency": "GBP", "numbers": "1,234.56"}},
    {"code": "ur-PK", "label": "Urdu (Pakistan)", "language": "Urdu", "country": "Pakistan",
     "formats": {"date": "DD/MM/YYYY", "time": "hh:mm", "currency": "PKR", "numbers": "1,234.56"}},
    {"code": "ar-SA", "label": "Arabic (Saudi Arabia)", "language": "Arabic", "country": "Saudi Arabia",
     "formats": {"date": "DD/MM/YYYY", "time": "hh:mm", "currency": "SAR", "numbers": "1,234.56"}},
    {"code": "es-ES", "label": "Spanish (Spain)", "language": "Spanish", "country": "Spain",
     "formats": {"date": "DD/MM/YYYY", "time": "hh:mm", "currency": "EUR", "numbers": "1.234,56"}},
    {"code": "de-DE", "label": "German (Germany)", "language": "German", "country": "Germany",
     "formats": {"date": "DD.MM.YYYY", "time": "hh:mm", "currency": "EUR", "numbers": "1.234,56"}},
    {"code": "fr-FR", "label": "French (France)", "language": "French", "country": "France",
     "formats": {"date": "DD/MM/YYYY", "time": "hh:mm", "currency": "EUR", "numbers": "1 234,56"}},
    {"code": "zh-CN", "label": "Chinese (China)", "language": "Chinese", "country": "China",
     "formats": {"date": "YYYY/MM/DD", "time": "HH:mm", "currency": "CNY", "numbers": "1,234.56"}},
    {"code": "hi-IN", "label": "Hindi (India)", "language": "Hindi", "country": "India",
     "formats": {"date": "DD/MM/YYYY", "time": "hh:mm", "currency": "INR", "numbers": "1,23,456.78"}},
]

ACCOUNT_RESOURCES = {
    "stores_url": "/settings/stores",
    "documentation_url": "https://help.eligoleather.example/docs",
    "help_center_url": "https://support.eligoleather.example",
    "app_store_url": "https://apps.eligoleather.example",
}


def list_regional_formats() -> list[dict]:
    return REGIONAL_FORMATS


def list_timezones() -> list[dict]:
    """All IANA timezones with their current UTC offset, e.g.
    (GMT+05:00) Asia/Karachi. Sorted by offset then label."""
    zones = []
    now = datetime.now(timezone.utc)
    for zone in sorted(available_timezones()):
        if "/" not in zone:
            continue
        try:
            tz = ZoneInfo(zone)
            offset = now.astimezone(tz).utcoffset() or timedelta(0)
            total_minutes = int(offset.total_seconds() // 60)
        except Exception:
            continue
        sign = "+" if total_minutes >= 0 else "-"
        abs_m = abs(total_minutes)
        label = (
            f"(GMT{sign}{abs_m // 60:02d}:{abs_m % 60:02d}) "
            f"{zone.replace('_', ' ')}"
        )
        zones.append({"code": zone, "label": label, "utc_offset_minutes": total_minutes})
    return sorted(zones, key=lambda z: (z["utc_offset_minutes"], z["label"]))


# =====================================================================
# GENERAL: profile
# =====================================================================


def _initials(user: User) -> str:
    first = (user.first_name or "").strip()
    last = (user.last_name or "").strip()
    if first and last:
        return (first[0] + last[0]).upper()
    if first:
        return first[:2].upper()
    if last:
        return last[:2].upper()
    return (user.email[:2].upper()) if user.email else "?"


def _profile_out(user: User) -> AccountProfileOut:
    return AccountProfileOut(
        id=user.id,
        email=user.email,
        email_verified=user.email_verified,
        full_name=user.full_name,
        first_name=user.first_name,
        last_name=user.last_name,
        avatar_url=user.avatar_url,
        initials=_initials(user),
        phone=user.phone,
        preferred_language=user.preferred_language,
        regional_format=user.regional_format,
        timezone=user.timezone,
        created_at=user.created_at,
    )


async def update_profile(
    db: AsyncSession, user: User, data: AccountProfileUpdate
) -> AccountProfileOut:
    payload = data.model_dump(exclude_unset=True)

    # Changing the account email must keep it unique and require re-verification
    # (a real deployment emails a code to the new address).
    new_email = payload.get("email")
    if new_email and new_email.lower() != (user.email or "").lower():
        result = await db.execute(select(User).where(User.email == new_email))
        if result.scalar_one_or_none() is not None:
            raise ValueError("That email address is already in use.")
        user.email = new_email
        user.email_verified = False

    # Keep `full_name` (used across the admin UI) in sync with the parts.
    if "first_name" in payload or "last_name" in payload:
        first = payload.get("first_name", user.first_name) or ""
        last = payload.get("last_name", user.last_name) or ""
        user.full_name = " ".join(filter(None, [first, last]))
    for field, value in payload.items():
        if field == "email":
            continue
        setattr(user, field, value)
    await db.commit()
    await db.refresh(user)
    return _profile_out(user)


# =====================================================================
# GENERAL: login services (SSO)
# =====================================================================


async def list_login_services(db: AsyncSession, user: User) -> list[UserLoginService]:
    result = await db.execute(
        select(UserLoginService)
        .where(UserLoginService.user_id == user.id)
        .order_by(UserLoginService.provider)
    )
    return list(result.scalars().all())


async def connect_login_service(
    db: AsyncSession, user: User, provider: LoginProvider, external_id: str
) -> UserLoginService:
    result = await db.execute(
        select(UserLoginService).where(
            UserLoginService.user_id == user.id,
            UserLoginService.provider == provider,
        )
    )
    if result.scalar_one_or_none() is not None:
        raise ValueError(f"{provider.value.capitalize()} is already connected")
    service = UserLoginService(user_id=user.id, provider=provider, external_id=external_id)
    db.add(service)
    await db.commit()
    await db.refresh(service)
    return service


async def disconnect_login_service(
    db: AsyncSession, user: User, service_id: int
) -> bool:
    service = await db.get(UserLoginService, service_id)
    if service is None or service.user_id != user.id:
        return False
    await db.delete(service)
    await db.commit()
    return True


# =====================================================================
# SECURITY: password
# =====================================================================


def _friendly_ago(dt: datetime) -> str:
    days = (datetime.now(timezone.utc) - dt).days
    if days < 1:
        return "today"
    if days < 30:
        return f"{days} days"
    if days < 365:
        months = max(1, days // 30)
        return f"about {months} month{'s' if months > 1 else ''}"
    years = max(1, days // 365)
    return f"about {years} year{'s' if years > 1 else ''}"


async def password_status(db: AsyncSession, user: User) -> PasswordStatusOut:
    if user.password_changed_at is None:
        return PasswordStatusOut(
            last_changed_at=None,
            days_ago=None,
            message="You have not changed your password yet.",
        )
    days = (datetime.now(timezone.utc) - user.password_changed_at).days
    return PasswordStatusOut(
        last_changed_at=user.password_changed_at,
        days_ago=days,
        message=f"You last changed your password {_friendly_ago(user.password_changed_at)} ago.",
    )


async def change_password(
    db: AsyncSession, user: User, current_password: str, new_password: str, current_jti: str | None
) -> None:
    if not verify_password(current_password, user.hashed_password):
        raise ValueError("Current password is incorrect.")
    if verify_password(new_password, user.hashed_password):
        raise ValueError("New password must be different from your current password.")
    if len(new_password) < 8:
        raise ValueError("New password must be at least 8 characters.")

    user.hashed_password = hash_password(new_password)
    user.password_changed_at = datetime.now(timezone.utc)

    # Security: changing the password logs out every other active session.
    result = await db.execute(
        select(UserSession).where(
            UserSession.user_id == user.id,
            UserSession.revoked_at.is_(None),
        )
    )
    for session in result.scalars().all():
        if session.token_id != current_jti:
            session.revoked_at = datetime.now(timezone.utc)

    await db.commit()
    await log_activity(db, event="Account password changed.", resource_type="Account", actor_user_id=user.id)


# =====================================================================
# SECURITY: secondary email
# =====================================================================


async def get_secondary_email(db: AsyncSession, user: User) -> SecondaryEmailOut:
    return SecondaryEmailOut(
        email=user.secondary_email,
        verified=user.secondary_email_verified,
    )


async def set_secondary_email(
    db: AsyncSession, user: User, data: SecondaryEmailUpdateIn
) -> SecondaryEmailOut:
    user.secondary_email = str(data.email)
    # A new address must be re-verified (a real deployment emails a code;
    # the backend only persists the pending state).
    user.secondary_email_verified = False
    await db.commit()
    await db.refresh(user)
    return SecondaryEmailOut(
        email=user.secondary_email,
        verified=user.secondary_email_verified,
    )


async def remove_secondary_email(db: AsyncSession, user: User) -> SecondaryEmailOut:
    user.secondary_email = None
    user.secondary_email_verified = False
    await db.commit()
    await db.refresh(user)
    return SecondaryEmailOut(email=None, verified=False)


# =====================================================================
# SECURITY: two-factor (TOTP - RFC 6238, stdlib only)
# =====================================================================


def generate_totp_secret() -> str:
    return base64.b32encode(os.urandom(20)).decode().rstrip("=")


def _b32decode(secret: str) -> bytes:
    padding = "=" * ((8 - len(secret) % 8) % 8)
    return base64.b32decode(secret.upper() + padding)


def _totp_code(secret: bytes, counter: int) -> str:
    digest = hmac.new(secret, struct.pack(">Q", counter), hashlib.sha1).digest()
    offset = digest[-1] & 0x0F
    code = (
        struct.unpack(">I", digest[offset : offset + 4])[0] & 0x7FFFFFFF
    ) % (10**TOTP_DIGITS)
    return f"{code:0{TOTP_DIGITS}d}"


def verify_totp(secret_b32: str, code: str, window: int = 1) -> bool:
    if not code or not code.isdigit():
        return False
    try:
        secret = _b32decode(secret_b32)
    except Exception:
        return False
    counter = int(time.time()) // TOTP_PERIOD
    for delta in range(-window, window + 1):
        if hmac.compare_digest(_totp_code(secret, counter + delta), code):
            return True
    return False


def build_otpauth_url(secret_b32: str, account_name: str) -> str:
    return (
        f"otpauth://totp/{TOTP_ISSUER}:{account_name}"
        f"?secret={secret_b32}&issuer={TOTP_ISSUER}"
        f"&algorithm=SHA1&digits={TOTP_DIGITS}&period={TOTP_PERIOD}"
    )


def _encrypt_totp(secret_b32: str) -> str:
    return encrypt_credentials({"totp_secret": secret_b32})


def _decrypt_totp(user: User) -> str | None:
    return decrypt_credentials(user.totp_secret).get("totp_secret")


async def two_factor_status(db: AsyncSession, user: User) -> TwoFactorStatusOut:
    result = await db.execute(
        select(UserRecoveryCode.id).where(
            UserRecoveryCode.user_id == user.id,
            UserRecoveryCode.is_active == True,  # noqa: E712
        )
    )
    recovery_count = len(result.all())
    return TwoFactorStatusOut(
        enabled=user.totp_enabled,
        primary_method="authenticator_app" if user.totp_enabled else None,
        recovery_codes_count=recovery_count,
        recovery_codes_last_generated_at=user.recovery_codes_last_generated_at,
    )


async def start_totp_setup(db: AsyncSession, user: User) -> TotpSetupOut:
    if user.totp_enabled:
        raise ValueError("Two-step authentication is already enabled.")
    secret = generate_totp_secret()
    user.totp_secret = _encrypt_totp(secret)
    await db.commit()
    return TotpSetupOut(secret=secret, otpauth_url=build_otpauth_url(secret, user.email))


async def verify_totp_setup(db: AsyncSession, user: User, data: TotpVerifyIn) -> TwoFactorStatusOut:
    secret = _decrypt_totp(user)
    if not secret:
        raise ValueError("Start two-step setup first.")
    if not verify_totp(secret, data.code):
        raise ValueError("Invalid authentication code.")
    user.totp_enabled = True
    await db.commit()
    await log_activity(db, event="Two-step authentication enabled.", resource_type="Account", actor_user_id=user.id)
    return await two_factor_status(db, user)


async def disable_two_factor(db: AsyncSession, user: User, data: TotpVerifyIn) -> TwoFactorStatusOut:
    if not user.totp_enabled:
        raise ValueError("Two-step authentication is not enabled.")
    secret = _decrypt_totp(user)
    verified = bool(secret) and verify_totp(secret, data.code)
    if not verified and not await _consume_recovery_code(db, user, data.code):
        raise ValueError("Invalid authentication code.")
    user.totp_secret = None
    user.totp_enabled = False
    await db.commit()
    await log_activity(db, event="Two-step authentication disabled.", resource_type="Account", actor_user_id=user.id)
    return await two_factor_status(db, user)


# =====================================================================
# SECURITY: recovery codes (stored hashed, one-time use)
# =====================================================================

_RECOVERY_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"


def _generate_recovery_codes(count: int = 10) -> list[str]:
    return [
        "-".join(
            "".join(secrets.choice(_RECOVERY_ALPHABET) for _ in range(4))
            for _ in range(3)
        )
        for _ in range(count)
    ]


def _normalize_recovery_code(code: str) -> str:
    return "".join(ch for ch in code.upper() if ch.isalnum())


def _recovery_code_hash(code: str) -> str:
    return hashlib.sha256(_normalize_recovery_code(code).encode()).hexdigest()


async def generate_recovery_codes(db: AsyncSession, user: User) -> RecoveryCodesOut:
    # Regenerating invalidates every previously issued unused code.
    result = await db.execute(
        select(UserRecoveryCode).where(
            UserRecoveryCode.user_id == user.id,
            UserRecoveryCode.is_active == True,  # noqa: E712
        )
    )
    for code in result.scalars().all():
        code.is_active = False

    codes = _generate_recovery_codes()
    for code in codes:
        db.add(UserRecoveryCode(user_id=user.id, code_hash=_recovery_code_hash(code)))

    user.recovery_codes_last_generated_at = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(user)
    return RecoveryCodesOut(
        codes=codes,
        last_generated_at=user.recovery_codes_last_generated_at,
    )


async def _consume_recovery_code(db: AsyncSession, user: User, code: str) -> bool:
    result = await db.execute(
        select(UserRecoveryCode).where(
            UserRecoveryCode.user_id == user.id,
            UserRecoveryCode.code_hash == _recovery_code_hash(code),
        )
    )
    row = result.scalar_one_or_none()
    if row is None or not row.is_active:
        return False
    row.is_active = False
    row.used_at = datetime.now(timezone.utc)
    return True


# =====================================================================
# SECURITY: active sessions ledger
# =====================================================================


def _parse_user_agent(user_agent: str | None) -> dict:
    ua = (user_agent or "").lower()
    if "edg/" in ua:
        browser = "Edge"
    elif "chrome/" in ua:
        browser = "Chrome"
    elif "firefox/" in ua:
        browser = "Firefox"
    elif "safari/" in ua:
        browser = "Safari"
    elif "opera" in ua or "opr/" in ua:
        browser = "Opera"
    else:
        browser = "Other"

    if "windows" in ua:
        os_ = "Windows"
    elif "android" in ua:
        os_ = "Android"
    elif "iphone" in ua or "ipad" in ua or "ios" in ua:
        os_ = "iOS"
    elif "mac os" in ua:
        os_ = "macOS"
    elif "linux" in ua:
        os_ = "Linux"
    else:
        os_ = "Unknown"

    return {"browser": browser, "os": os_, "device_name": f"{browser} on {os_}"}


def _client_ip(request) -> str | None:
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else None


# Free, no-key IP geolocation service. Returns JSON with city/region/country.
GEO_LOOKUP_URL = "https://ipwho.is/{ip}"


def _is_private_ip(ip: str | None) -> bool:
    """Private, loopback and link-local addresses are never resolvable, so
    skip the network call for them (dev machines, LAN, proxy-internal IPs)."""
    if not ip:
        return True
    try:
        return ipaddress.ip_address(ip.strip()).is_private
    except ValueError:
        return True


async def _lookup_location(ip: str | None) -> str | None:
    """Resolve an IP to a human-friendly location string. Never raises -
    a failed lookup simply leaves `location_name` empty so login is never
    blocked by geo resolution."""
    if _is_private_ip(ip):
        return None
    try:
        async with httpx.AsyncClient(timeout=5) as client:
            resp = await client.get(
                GEO_LOOKUP_URL.format(ip=ip),
                headers={"User-Agent": "eligo-backend/0.1"},
            )
            resp.raise_for_status()
            data = resp.json()
            if data.get("success") is False:
                return None
            parts = [
                p
                for p in (
                    data.get("city"),
                    data.get("region"),
                    data.get("country"),
                )
                if p
            ]
            return ", ".join(parts) or None
    except Exception:
        return None


async def record_login_session(db: AsyncSession, user: User, token: str, request) -> UserSession:
    """Create a ledger entry for a fresh login. Never raises - a broken
    session write must not block the sign-in itself."""
    payload = decode_access_token(token)
    info = _parse_user_agent(request.headers.get("user-agent"))
    ip = _client_ip(request)
    session = UserSession(
        user_id=user.id,
        token_id=payload.get("jti"),
        browser=info["browser"],
        os=info["os"],
        device_name=info["device_name"],
        ip_address=ip,
        location_name=await _lookup_location(ip),
        last_seen_at=datetime.now(timezone.utc),
    )
    db.add(session)
    await db.commit()
    await db.refresh(session)
    return session


async def list_sessions(db: AsyncSession, user: User, current_jti: str | None) -> list[SessionOut]:
    result = await db.execute(
        select(UserSession)
        .where(UserSession.user_id == user.id, UserSession.revoked_at.is_(None))
        .order_by(UserSession.last_seen_at.desc(), UserSession.created_at.desc())
    )
    return [
        SessionOut(
            id=s.id,
            device_name=s.device_name,
            browser=s.browser,
            os=s.os,
            ip_address=s.ip_address,
            location_name=s.location_name,
            is_current=(s.token_id == current_jti),
            created_at=s.created_at,
            last_seen_at=s.last_seen_at,
            revoked_at=s.revoked_at,
        )
        for s in result.scalars().all()
    ]


async def revoke_session(
    db: AsyncSession, user: User, session_id: int, current_jti: str | None
) -> SessionRevokedOut | None:
    session = await db.get(UserSession, session_id)
    if session is None or session.user_id != user.id:
        return None
    session.revoked_at = datetime.now(timezone.utc)
    await db.commit()
    await log_activity(db, event="Admin session terminated.", resource_type="Session", actor_user_id=user.id)
    return SessionRevokedOut(
        session_id=session_id,
        revoked=True,
        was_current=(session.token_id == current_jti),
    )


# =====================================================================
# SEED (profile defaults)
# =====================================================================


async def seed_defaults(db: AsyncSession) -> None:
    """Ensure profile defaults for admin users. The Active devices ledger
    only ever contains real login sessions recorded by `record_login_session`."""
    result = await db.execute(select(User).where(User.is_admin == True))  # noqa: E712
    admins = list(result.scalars().all())
    for user in admins:
        if not user.preferred_language:
            user.preferred_language = "en"
        if not user.regional_format:
            user.regional_format = "en-PK"
        if not user.timezone:
            user.timezone = "Asia/Karachi"

    await db.commit()
