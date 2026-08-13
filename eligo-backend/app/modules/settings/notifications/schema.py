from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.modules.settings.notifications.model import (
    DispatchStatus,
    NotificationChannel,
    NotificationEventType,
)


# ============================== Sender config ==============================


class SenderConfigOut(BaseModel):
    id: int
    smtp_host: str
    smtp_port: int
    smtp_username: str
    has_password: bool
    use_tls: bool
    use_ssl: bool
    from_email: str
    from_name: str
    admin_email: str
    is_enabled: bool
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class SenderConfigUpdate(BaseModel):
    smtp_host: str | None = None
    smtp_port: int | None = Field(None, ge=1, le=65535)
    smtp_username: str | None = None
    smtp_password: str | None = None
    use_tls: bool | None = None
    use_ssl: bool | None = None
    from_email: str | None = None
    from_name: str | None = None
    admin_email: str | None = None
    is_enabled: bool | None = None

    @field_validator("use_ssl")
    @classmethod
    def _ssl_and_tls_are_exclusive(cls, value, info):
        if value and info.data.get("use_tls"):
            raise ValueError("use_tls and use_ssl cannot both be True")
        return value


class TestEmailRequest(BaseModel):
    to: str | None = None


class TestEmailResponse(BaseModel):
    success: bool
    message: str
    recipient: str


# ============================== Email templates ==============================


class EmailTemplateCreate(BaseModel):
    code: str
    name: str
    subject: str
    html_body: str
    is_active: bool = True


class EmailTemplateUpdate(BaseModel):
    name: str | None = None
    subject: str | None = None
    html_body: str | None = None
    is_active: bool | None = None


class EmailTemplateOut(BaseModel):
    id: int
    code: str
    name: str
    subject: str
    html_body: str
    is_active: bool
    is_built_in: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ============================== Webhook endpoints ==============================


class WebhookEndpointCreate(BaseModel):
    name: str
    url: str
    secret: str | None = None
    events: list[str] | None = None
    is_active: bool = True


class WebhookEndpointUpdate(BaseModel):
    name: str | None = None
    url: str | None = None
    secret: str | None = None
    events: list[str] | None = None
    is_active: bool | None = None


class WebhookEndpointOut(BaseModel):
    id: int
    name: str
    url: str
    has_secret: bool
    events: list[str] | None = None
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class WebhookTestResponse(BaseModel):
    success: bool
    status_code: int | None = None
    error: str | None = None


# ============================== Dispatch rules ==============================


class DispatchRuleCreate(BaseModel):
    event_type: NotificationEventType
    channel: NotificationChannel
    recipient: str = "customer"
    template_id: int | None = None
    webhook_id: int | None = None
    is_active: bool = True


class DispatchRuleUpdate(BaseModel):
    recipient: str | None = None
    template_id: int | None = None
    webhook_id: int | None = None
    is_active: bool | None = None


class DispatchRuleOut(BaseModel):
    id: int
    event_type: NotificationEventType
    channel: NotificationChannel
    recipient: str
    template_id: int | None = None
    webhook_id: int | None = None
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ============================== Logs & dispatch ==============================


class NotificationLogOut(BaseModel):
    id: int
    event_type: str
    channel: NotificationChannel
    recipient: str | None = None
    subject: str | None = None
    status: DispatchStatus
    error: str | None = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class DispatchRequest(BaseModel):
    event_type: NotificationEventType
    payload: dict = Field(default_factory=dict)


class DispatchResponse(BaseModel):
    event_type: str
    dispatched: int
    failed: int
