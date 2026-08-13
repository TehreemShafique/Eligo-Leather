from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.modules.settings.metafields_and_metaobjects.model import MetafieldScope


# ============================== Catalogs ==============================


class TypeDefinition(BaseModel):
    """One entry of the categorized metafield type dropdown."""

    code: str
    label: str
    category: str
    icon: str | None = None


class ResourceSummary(BaseModel):
    """A row in the Metafield definitions directory."""

    resource_type: str
    name: str
    definition_count: int = 0
    value_count: int = 0


# ============================== Metafield definitions ==============================


class MetafieldDefinitionCreate(BaseModel):
    resource_type: str = Field(min_length=1, max_length=50)
    name: str = Field(min_length=1, max_length=100)
    type: str = Field(min_length=1, max_length=50)
    is_list: bool = False
    description: str | None = None
    storefront_api_access: bool = False
    scope: MetafieldScope = MetafieldScope.all
    category_ids: list[int] | None = None


class MetafieldDefinitionUpdate(BaseModel):
    name: str | None = None
    type: str | None = None
    is_list: bool | None = None
    description: str | None = None
    storefront_api_access: bool | None = None
    scope: MetafieldScope | None = None
    category_ids: list[int] | None = None
    is_pinned: bool | None = None


class MetafieldDefinitionOut(BaseModel):
    id: int
    resource_type: str
    name: str
    key: str
    type: str
    type_label: str | None = None
    is_list: bool
    description: str | None = None
    storefront_api_access: bool
    scope: MetafieldScope
    category_ids: list[int] | None = None
    is_pinned: bool
    usage_count: int = 0
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ============================== Metafield values ==============================


class MetafieldValueCreate(BaseModel):
    owner_resource_type: str
    owner_id: int
    value: str | None = None


class MetafieldValueOut(BaseModel):
    id: int
    definition_id: int
    owner_resource_type: str
    owner_id: int
    value: str | None = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ============================== Metaobject dashboard ==============================
# The dashboard is a read view over the content module's metaobject
# definitions + entries (reused - not duplicated).


class MetaobjectDefinitionDashboardOut(BaseModel):
    id: int
    name: str
    type_key: str
    available_on_storefront: bool
    display_name: str | None = None
    added_by: str | None = None
    entries_count: int = 0

    model_config = ConfigDict(from_attributes=True)


class MetaobjectDashboardEntryOut(BaseModel):
    id: int
    display_name: str
    handle: str | None = None
    status: str | None = None
    tags: str | None = None
    references_count: int = 0
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class MetaobjectDefinitionDashboardDetail(MetaobjectDefinitionDashboardOut):
    entries: list[MetaobjectDashboardEntryOut] = []
