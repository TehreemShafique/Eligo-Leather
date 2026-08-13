from datetime import datetime

from pydantic import BaseModel, ConfigDict, field_validator


class CustomerAccountSettingsUpdate(BaseModel):
    show_sign_in_links: bool | None = None
    allow_registration: bool | None = None
    require_email_verification: bool | None = None
    session_duration_days: int | None = None
    allow_self_returns: bool | None = None
    allow_self_cancellations: bool | None = None
    return_window_days: int | None = None
    allow_store_credit: bool | None = None
    account_domain: str | None = None

    @field_validator("session_duration_days", "return_window_days")
    @classmethod
    def validate_positive(cls, value):
        if value is not None and value < 1:
            raise ValueError("Value must be at least 1")
        return value

    @field_validator("account_domain")
    @classmethod
    def validate_domain(cls, value):
        if value is not None:
            value = value.strip()
            if value and "://" not in value:
                raise ValueError("Domain must include a protocol, e.g. https://")
        return value


class CustomerAccountSettingsOut(BaseModel):
    id: int
    show_sign_in_links: bool
    allow_registration: bool
    require_email_verification: bool
    session_duration_days: int
    allow_self_returns: bool
    allow_self_cancellations: bool
    return_window_days: int
    allow_store_credit: bool
    account_domain: str
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
