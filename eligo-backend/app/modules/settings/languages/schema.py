from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.modules.settings.languages.model import LanguageStatus


class AvailableLanguage(BaseModel):
    """A selectable world language from the master ISO catalog."""

    code: str
    name: str
    native_name: str | None = None


class LanguageCreate(BaseModel):
    language_code: str = Field(min_length=2, max_length=10)
    domain: str | None = None


class LanguageUpdate(BaseModel):
    language_name: str | None = None
    native_name: str | None = None
    is_default: bool | None = None
    status: LanguageStatus | None = None
    domain: str | None = None


class LanguageOut(BaseModel):
    id: int
    language_code: str
    language_name: str
    native_name: str | None = None
    is_default: bool
    status: LanguageStatus
    domain: str | None = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
