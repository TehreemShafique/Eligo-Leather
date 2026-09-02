import warnings as _warnings
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

MAX_HEADER_SCRIPT_CHARS = 10000


class HeaderScriptUpdate(BaseModel):
    header_scripts: str = Field(
        default="",
        max_length=MAX_HEADER_SCRIPT_CHARS,
    )


class HeaderScriptOut(BaseModel):
    user_id: int
    header_scripts: str
    updated_at: datetime | None
    disclaimer: str


# ============================== Store Schemas ==============================


# ``schema_json`` intentionally shadows a deprecated attribute exposed by
# Pydantic's BaseModel (the ``schema_json`` field name is the app's stable
# public API / DB column). Suppress Pydantic's cosmetic "shadows an attribute
# in parent BaseModel" warning during class creation only.
with _warnings.catch_warnings():
    _warnings.filterwarnings(
        "ignore",
        message=r"Field name \"schema_json\" in \".*\" shadows an attribute in parent \"BaseModel\"",
        category=UserWarning,
        module=r"app\.modules\.store\.schema",
    )

    class StoreSchemaCreate(BaseModel):
        model_config = ConfigDict(protected_namespaces=())
        name: str = Field(..., min_length=1, max_length=255)
        schema_type: str = Field(default="custom", max_length=50)
        target_pages: str = Field(default="/*", max_length=500)
        schema_json: str = Field(default="", max_length=50000)
        is_active: bool = True

    class StoreSchemaUpdate(BaseModel):
        model_config = ConfigDict(protected_namespaces=())
        name: str | None = Field(None, min_length=1, max_length=255)
        schema_type: str | None = Field(None, max_length=50)
        target_pages: str | None = Field(None, max_length=500)
        schema_json: str | None = Field(None, max_length=50000)
        is_active: bool | None = None

    class StoreSchemaOut(BaseModel):
        model_config = ConfigDict(from_attributes=True, protected_namespaces=())
        id: int
        user_id: int
        name: str
        schema_type: str
        target_pages: str
        schema_json: str
        is_active: bool
        created_at: datetime
        updated_at: datetime

    class PublicStoreSchemaOut(BaseModel):
        model_config = ConfigDict(protected_namespaces=())
        id: int
        name: str
        schema_type: str
        target_pages: str
        schema_json: str
        is_active: bool
