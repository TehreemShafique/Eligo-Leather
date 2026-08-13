import re

from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.settings.metafields_and_metaobjects.model import (
    MetafieldDefinition,
    MetafieldScope,
    MetafieldValue,
)
from app.modules.settings.metafields_and_metaobjects.schema import (
    MetaobjectDashboardEntryOut,
    MetaobjectDefinitionDashboardOut,
    MetafieldDefinitionCreate,
    MetafieldDefinitionOut,
    MetafieldDefinitionUpdate,
    MetafieldValueCreate,
    ResourceSummary,
)

# =====================================================================
# CATALOGS
# =====================================================================
# These are the single source of truth for the Settings UI:
#  - RESOURCE_TYPES   -> Metafield definitions directory rows
#  - METAFIELD_TYPES  -> the categorized "Add definition" type dropdown
# =====================================================================

RESOURCE_TYPES: list[dict] = [
    {"resource_type": "product", "name": "Products"},
    {"resource_type": "variant", "name": "Variants"},
    {"resource_type": "collection", "name": "Collections"},
    {"resource_type": "customer", "name": "Customers"},
    {"resource_type": "order", "name": "Orders"},
    {"resource_type": "draft_order", "name": "Draft orders"},
    {"resource_type": "company", "name": "Companies"},
    {"resource_type": "company_location", "name": "Company locations"},
    {"resource_type": "location", "name": "Locations"},
    {"resource_type": "transfer", "name": "Transfers"},
    {"resource_type": "page", "name": "Pages"},
    {"resource_type": "blog", "name": "Blogs"},
    {"resource_type": "blog_post", "name": "Blog posts"},
    {"resource_type": "market", "name": "Markets"},
    {"resource_type": "shop", "name": "Shop"},
]

RESOURCE_NAMES: dict[str, str] = {r["resource_type"]: r["name"] for r in RESOURCE_TYPES}

METAFIELD_TYPES: list[dict] = [
    # Recommended
    {"code": "single_line_text", "label": "Single line text", "category": "Recommended"},
    {"code": "multi_line_text", "label": "Multi-line text", "category": "Recommended"},
    {"code": "integer", "label": "Integer", "category": "Recommended", "icon": "# Integer"},
    {"code": "image_file", "label": "Image (File)", "category": "Recommended"},
    {"code": "metaobject", "label": "Metaobject", "category": "Recommended"},
    {"code": "text", "label": "Text", "category": "Recommended"},
    {"code": "rich_text", "label": "Rich text", "category": "Recommended"},
    {"code": "choice_list", "label": "Choice list", "category": "Recommended"},
    {"code": "email", "label": "Email", "category": "Recommended"},
    # Media
    {"code": "file", "label": "File", "category": "Media"},
    {"code": "image", "label": "Image", "category": "Media"},
    {"code": "video", "label": "Video", "category": "Media"},
    # Reference
    {"code": "blog_post_reference", "label": "Blog post", "category": "Reference"},
    {"code": "collection_reference", "label": "Collection", "category": "Reference"},
    {"code": "company_reference", "label": "Company", "category": "Reference"},
    {"code": "customer_reference", "label": "Customer", "category": "Reference"},
    {"code": "metaobject_reference", "label": "Metaobject", "category": "Reference"},
    {"code": "order_reference", "label": "Order", "category": "Reference"},
    {"code": "page_reference", "label": "Page", "category": "Reference"},
    {"code": "product_reference", "label": "Product", "category": "Reference"},
    {"code": "variant_reference", "label": "Product variant", "category": "Reference"},
    # Number
    {"code": "id", "label": "ID", "category": "Number"},
    {"code": "money", "label": "Money", "category": "Number"},
    {"code": "decimal", "label": "Decimal", "category": "Number"},
    {"code": "rating", "label": "Rating", "category": "Number", "icon": "☆ Rating"},
    {"code": "measurement", "label": "Measurement", "category": "Number"},
    # Link
    {"code": "link", "label": "Link", "category": "Link"},
    {"code": "url", "label": "URL", "category": "Link"},
    # Date and time
    {"code": "date", "label": "Date", "category": "Date and time"},
    {"code": "date_time", "label": "Date and time", "category": "Date and time"},
    # Other
    {"code": "boolean", "label": "True or false", "category": "Other"},
    {"code": "color", "label": "Color", "category": "Other"},
    {"code": "language", "label": "Language", "category": "Other"},
    # Advanced
    {"code": "json", "label": "JSON", "category": "Advanced"},
    {"code": "mixed_reference", "label": "Mixed reference", "category": "Advanced"},
]

TYPE_BY_CODE: dict[str, dict] = {t["code"]: t for t in METAFIELD_TYPES}


def list_resource_types() -> list[dict]:
    return RESOURCE_TYPES


def list_type_definitions() -> list[dict]:
    return METAFIELD_TYPES


def get_type(code: str) -> dict | None:
    return TYPE_BY_CODE.get(code)


def _slugify(name: str) -> str:
    slug = re.sub(r"[^a-z0-9]+", "_", name.lower()).strip("_")
    return slug or "field"


# =====================================================================
# RESOURCE DIRECTORY
# =====================================================================


async def list_resources(db: AsyncSession) -> list[ResourceSummary]:
    result = await db.execute(
        select(
            MetafieldDefinition.resource_type,
            func.count(MetafieldDefinition.id),
        ).group_by(MetafieldDefinition.resource_type)
    )
    def_counts = dict(result.all())

    result = await db.execute(
        select(
            MetafieldValue.owner_resource_type,
            func.count(MetafieldValue.id),
        ).group_by(MetafieldValue.owner_resource_type)
    )
    value_counts = dict(result.all())

    return [
        ResourceSummary(
            resource_type=r["resource_type"],
            name=r["name"],
            definition_count=def_counts.get(r["resource_type"], 0),
            value_count=value_counts.get(r["resource_type"], 0),
        )
        for r in RESOURCE_TYPES
    ]


# =====================================================================
# METAFIELD DEFINITIONS - universal CRUD
# =====================================================================


async def _usage_counts(db: AsyncSession) -> dict[int, int]:
    result = await db.execute(
        select(MetafieldValue.definition_id, func.count(MetafieldValue.id)).group_by(
            MetafieldValue.definition_id
        )
    )
    return dict(result.all())


async def list_definitions(
    db: AsyncSession,
    resource_type: str | None = None,
    scope: MetafieldScope | None = None,
    search: str | None = None,
    skip: int = 0,
    limit: int = 50,
) -> list[MetafieldDefinitionOut]:
    query = select(MetafieldDefinition)
    if resource_type:
        query = query.where(MetafieldDefinition.resource_type == resource_type)
    if scope:
        query = query.where(MetafieldDefinition.scope == scope)
    if search:
        query = query.where(
            or_(
                MetafieldDefinition.name.ilike(f"%{search}%"),
                MetafieldDefinition.key.ilike(f"%{search}%"),
            )
        )
    query = query.order_by(
        MetafieldDefinition.is_pinned.desc(),
        MetafieldDefinition.created_at.desc(),
    ).offset(skip).limit(limit)
    result = await db.execute(query)
    definitions = list(result.scalars().all())

    counts = await _usage_counts(db)
    return [_to_out(definition, counts.get(definition.id, 0)) for definition in definitions]


async def get_definition(def_id: int, db: AsyncSession) -> MetafieldDefinitionOut | None:
    definition = await db.get(MetafieldDefinition, def_id)
    if not definition:
        return None
    counts = await _usage_counts(db)
    return _to_out(definition, counts.get(definition.id, 0))


async def create_definition(data: MetafieldDefinitionCreate, db: AsyncSession) -> MetafieldDefinitionOut:
    if data.resource_type not in RESOURCE_NAMES:
        raise ValueError(f"Unknown resource_type '{data.resource_type}'")
    if get_type(data.type) is None:
        raise ValueError(f"Unknown metafield type '{data.type}'")

    key = _slugify(data.name)
    result = await db.execute(
        select(MetafieldDefinition).where(
            MetafieldDefinition.resource_type == data.resource_type,
            MetafieldDefinition.key == key,
        )
    )
    if result.scalar_one_or_none() is not None:
        raise ValueError(
            f"A definition named '{data.name}' already exists for "
            f"{RESOURCE_NAMES[data.resource_type]}"
        )

    definition = MetafieldDefinition(
        resource_type=data.resource_type,
        name=data.name,
        key=key,
        type=data.type,
        is_list=data.is_list,
        description=data.description,
        storefront_api_access=data.storefront_api_access,
        scope=data.scope,
        category_ids=data.category_ids,
    )
    db.add(definition)
    await db.commit()
    await db.refresh(definition)
    return _to_out(definition, 0)


async def update_definition(
    def_id: int, data: MetafieldDefinitionUpdate, db: AsyncSession
) -> MetafieldDefinitionOut | None:
    definition = await db.get(MetafieldDefinition, def_id)
    if not definition:
        return None

    payload = data.model_dump(exclude_unset=True)
    if "name" in payload and payload["name"] and payload["name"] != definition.name:
        new_key = _slugify(payload["name"])
        result = await db.execute(
            select(MetafieldDefinition).where(
                MetafieldDefinition.resource_type == definition.resource_type,
                MetafieldDefinition.key == new_key,
                MetafieldDefinition.id != definition.id,
            )
        )
        if result.scalar_one_or_none() is not None:
            raise ValueError(f"A definition named '{payload['name']}' already exists")
        definition.key = new_key
    if "type" in payload and payload["type"] is not None and get_type(payload["type"]) is None:
        raise ValueError(f"Unknown metafield type '{payload['type']}'")

    for field, value in payload.items():
        setattr(definition, field, value)

    await db.commit()
    await db.refresh(definition)
    counts = await _usage_counts(db)
    return _to_out(definition, counts.get(definition.id, 0))


async def delete_definition(def_id: int, db: AsyncSession) -> bool:
    definition = await db.get(MetafieldDefinition, def_id)
    if not definition:
        return False
    await db.delete(definition)
    await db.commit()
    return True


async def set_pinned(def_id: int, pinned: bool, db: AsyncSession) -> MetafieldDefinitionOut | None:
    definition = await db.get(MetafieldDefinition, def_id)
    if not definition:
        return None
    definition.is_pinned = pinned
    await db.commit()
    await db.refresh(definition)
    counts = await _usage_counts(db)
    return _to_out(definition, counts.get(definition.id, 0))


def _to_out(definition: MetafieldDefinition, usage_count: int) -> MetafieldDefinitionOut:
    type_def = get_type(definition.type)
    return MetafieldDefinitionOut(
        id=definition.id,
        resource_type=definition.resource_type,
        name=definition.name,
        key=definition.key,
        type=definition.type,
        type_label=type_def["label"] if type_def else None,
        is_list=definition.is_list,
        description=definition.description,
        storefront_api_access=definition.storefront_api_access,
        scope=definition.scope,
        category_ids=definition.category_ids,
        is_pinned=definition.is_pinned,
        usage_count=usage_count,
        created_at=definition.created_at,
        updated_at=definition.updated_at,
    )


# =====================================================================
# METAFIELD VALUES ("Used in N ...")
# =====================================================================


async def record_value(
    def_id: int, data: MetafieldValueCreate, db: AsyncSession
) -> MetafieldValue | None:
    definition = await db.get(MetafieldDefinition, def_id)
    if not definition:
        return None
    value = MetafieldValue(
        definition_id=def_id,
        owner_resource_type=data.owner_resource_type,
        owner_id=data.owner_id,
        value=data.value,
    )
    db.add(value)
    await db.commit()
    await db.refresh(value)
    return value


async def list_values(def_id: int, db: AsyncSession) -> list[MetafieldValue]:
    result = await db.execute(
        select(MetafieldValue)
        .where(MetafieldValue.definition_id == def_id)
        .order_by(MetafieldValue.updated_at.desc())
    )
    return list(result.scalars().all())


# =====================================================================
# METAOBJECT DASHBOARD (reuses the content module's models)
# =====================================================================


async def list_metaobject_definitions(
    db: AsyncSession,
    search: str | None = None,
    skip: int = 0,
    limit: int = 50,
) -> list[MetaobjectDefinitionDashboardOut]:
    from app.modules.content.model import MetaobjectDefinition, MetaobjectEntry

    query = (
        select(
            MetaobjectDefinition,
            func.count(MetaobjectEntry.id).label("entries_count"),
            func.max(MetaobjectEntry.added_by).label("added_by"),
        )
        .outerjoin(MetaobjectEntry, MetaobjectEntry.definition_id == MetaobjectDefinition.id)
        .group_by(MetaobjectDefinition.id)
    )
    if search:
        query = query.where(
            or_(
                MetaobjectDefinition.name.ilike(f"%{search}%"),
                MetaobjectDefinition.type_key.ilike(f"%{search}%"),
            )
        )
    query = query.order_by(MetaobjectDefinition.created_at.desc()).offset(skip).limit(limit)
    result = await db.execute(query)
    return [
        MetaobjectDefinitionDashboardOut(
            id=defn.id,
            name=defn.name,
            type_key=defn.type_key,
            available_on_storefront=defn.available_on_storefront,
            display_name=defn.display_name,
            added_by=added_by or "System",
            entries_count=entries_count,
        )
        for defn, entries_count, added_by in result.all()
    ]


async def get_metaobject_definition(
    def_id: int, db: AsyncSession
) -> MetaobjectDefinitionDashboardOut | None:
    from app.modules.content.model import MetaobjectDefinition, MetaobjectEntry

    result = await db.execute(
        select(
            MetaobjectDefinition,
            func.count(MetaobjectEntry.id).label("entries_count"),
            func.max(MetaobjectEntry.added_by).label("added_by"),
        )
        .outerjoin(MetaobjectEntry, MetaobjectEntry.definition_id == MetaobjectDefinition.id)
        .where(MetaobjectDefinition.id == def_id)
        .group_by(MetaobjectDefinition.id)
    )
    row = result.first()
    if row is None:
        return None
    defn, entries_count, added_by = row
    return MetaobjectDefinitionDashboardOut(
        id=defn.id,
        name=defn.name,
        type_key=defn.type_key,
        available_on_storefront=defn.available_on_storefront,
        display_name=defn.display_name,
        added_by=added_by or "System",
        entries_count=entries_count,
    )


async def get_metaobject_definition_entries(
    def_id: int, db: AsyncSession
) -> list[MetaobjectDashboardEntryOut]:
    from app.modules.content.model import MetaobjectEntry

    result = await db.execute(
        select(MetaobjectEntry)
        .where(MetaobjectEntry.definition_id == def_id)
        .order_by(MetaobjectEntry.created_at.desc())
    )
    return [
        MetaobjectDashboardEntryOut(
            id=entry.id,
            display_name=entry.display_name,
            handle=entry.handle,
            status=entry.status,
            tags=entry.tags,
            references_count=entry.references_count,
            created_at=entry.created_at,
        )
        for entry in result.scalars().all()
    ]


# =====================================================================
# SEED - sample metafield definitions so the directory is populated
# =====================================================================

SAMPLE_DEFINITIONS = [
    {"resource_type": "product", "name": "Material", "type": "single_line_text"},
    {"resource_type": "product", "name": "Size", "type": "choice_list"},
    {"resource_type": "product", "name": "Color", "type": "color"},
    {"resource_type": "product", "name": "Rating", "type": "rating"},
    {"resource_type": "product", "name": "Care Instructions", "type": "multi_line_text", "storefront_api_access": True},
    {"resource_type": "product", "name": "Weight", "type": "measurement"},
    {"resource_type": "product", "name": "Story", "type": "rich_text", "storefront_api_access": True},
    {"resource_type": "variant", "name": "Barcode", "type": "single_line_text"},
    {"resource_type": "collection", "name": "Hero Image", "type": "image"},
]


async def seed_defaults(db: AsyncSession) -> None:
    result = await db.execute(select(MetafieldDefinition.id).limit(1))
    if result.scalar_one_or_none() is not None:
        return

    for sample in SAMPLE_DEFINITIONS:
        create = MetafieldDefinitionCreate(
            resource_type=sample["resource_type"],
            name=sample["name"],
            type=sample["type"],
            storefront_api_access=sample.get("storefront_api_access", False),
        )
        try:
            await create_definition(create, db)
        except ValueError:
            continue
