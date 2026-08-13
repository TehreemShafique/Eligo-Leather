from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field

from app.modules.settings.account.model import LoginProvider


# ============================== General: profile ==============================


class AccountProfileUpdate(BaseModel):
    email: EmailStr | None = Field(default=None)
    first_name: str | None = Field(default=None, max_length=100)
    last_name: str | None = Field(default=None, max_length=100)
    avatar_url: str | None = Field(default=None, max_length=500)
    phone: str | None = Field(default=None, max_length=30)
    preferred_language: str | None = Field(default=None, max_length=10)
    regional_format: str | None = Field(default=None, max_length=20)
    timezone: str | None = Field(default=None, max_length=60)


class AccountProfileOut(BaseModel):
    id: int
    email: EmailStr
    email_verified: bool
    full_name: str | None
    first_name: str | None
    last_name: str | None
    avatar_url: str | None
    initials: str = ""
    phone: str | None
    preferred_language: str
    regional_format: str
    timezone: str
    created_at: datetime


class LanguageOptionOut(BaseModel):
    code: str
    name: str
    native_name: str | None = None


class RegionalFormatOut(BaseModel):
    code: str
    label: str
    language: str
    country: str
    formats: dict


class TimezoneOut(BaseModel):
    code: str
    label: str
    utc_offset_minutes: int


class AccountResourcesOut(BaseModel):
    stores_url: str
    documentation_url: str
    help_center_url: str
    app_store_url: str


# ============================== General: login services ==============================


class LoginServiceConnectIn(BaseModel):
    provider: LoginProvider
    external_id: str = Field(min_length=1, max_length=255)


class LoginServiceOut(BaseModel):
    id: int
    provider: LoginProvider
    external_id: str
    connected_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ============================== Security: password ==============================


class ChangePasswordIn(BaseModel):
    current_password: str
    new_password: str = Field(min_length=8, max_length=128)


class PasswordStatusOut(BaseModel):
    last_changed_at: datetime | None
    days_ago: int | None
    message: str


class SecondaryEmailUpdateIn(BaseModel):
    email: EmailStr


class SecondaryEmailOut(BaseModel):
    email: str | None
    verified: bool


# ============================== Security: two-factor ==============================


class TwoFactorStatusOut(BaseModel):
    enabled: bool
    primary_method: str | None
    recovery_codes_count: int
    recovery_codes_last_generated_at: datetime | None


class TotpSetupOut(BaseModel):
    secret: str
    otpauth_url: str


class TotpVerifyIn(BaseModel):
    code: str = Field(min_length=6, max_length=16)


class RecoveryCodesOut(BaseModel):
    codes: list[str]
    last_generated_at: datetime


# ============================== Security: sessions ==============================


class SessionOut(BaseModel):
    id: int
    device_name: str | None
    browser: str | None
    os: str | None
    ip_address: str | None
    location_name: str | None
    is_current: bool
    created_at: datetime
    last_seen_at: datetime | None
    revoked_at: datetime | None


class SessionRevokedOut(BaseModel):
    session_id: int
    revoked: bool
    was_current: bool
