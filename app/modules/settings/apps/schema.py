from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.modules.settings.apps.model import AppCategory, AppStatus


class CredentialField(BaseModel):
    name: str
    label: str
    type: str = Field("text", description="text | password")


class ConfigField(BaseModel):
    name: str
    label: str
    type: str = Field("text", description="text | boolean | select")
    options: list[str] | None = None


class AppDefinition(BaseModel):
    code: str
    name: str
    category: AppCategory
    description: str
    actions: list[str] = []
    credential_fields: list[CredentialField] = []
    config_fields: list[ConfigField] = []
    installed: bool = False
    status: AppStatus | None = None


class AppInstall(BaseModel):
    app_code: str
    api_credentials: dict[str, str] | None = None
    settings: dict | None = None


class AppUpdate(BaseModel):
    api_credentials: dict[str, str] | None = None
    settings: dict | None = None


class AppOut(BaseModel):
    id: int
    app_code: str
    app_name: str
    category: AppCategory
    status: AppStatus
    has_credentials: bool
    settings: dict | None = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class AppActionRequest(BaseModel):
    action: str
    payload: dict = Field(default_factory=dict)


class AppActionResult(BaseModel):
    success: bool
    action: str
    data: dict
