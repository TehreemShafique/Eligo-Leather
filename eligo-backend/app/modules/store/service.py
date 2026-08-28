from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.store.model import StoreHeaderScript, StoreSchema
from app.modules.store.schema import (
    HeaderScriptOut, HeaderScriptUpdate,
    StoreSchemaCreate, StoreSchemaUpdate, StoreSchemaOut, PublicStoreSchemaOut,
)

HEADER_SCRIPTS_WARNING = (
    "Add custom HTML, meta tags, or script tags (like Google Analytics or "
    "Facebook Pixel) to your store's header. Use caution; broken code can "
    "affect your store's layout."
)


# ============================== Header Scripts ==============================


async def get_header_script(
    db: AsyncSession, user_id: int,
) -> StoreHeaderScript | None:
    result = await db.execute(
        select(StoreHeaderScript).where(StoreHeaderScript.user_id == user_id),
    )
    return result.scalar_one_or_none()


async def ensure_header_script(
    db: AsyncSession, user_id: int,
) -> StoreHeaderScript:
    script = await get_header_script(db, user_id)
    if script is None:
        script = StoreHeaderScript(user_id=user_id, header_scripts="")
        db.add(script)
        await db.commit()
        await db.refresh(script)
    return script


async def update_header_script(
    db: AsyncSession,
    user_id: int,
    data: HeaderScriptUpdate,
) -> StoreHeaderScript:
    script = await ensure_header_script(db, user_id)
    script.header_scripts = data.header_scripts
    await db.commit()
    await db.refresh(script)
    return script


def to_out(script: StoreHeaderScript | None) -> HeaderScriptOut:
    if script is None:
        return HeaderScriptOut(
            user_id=0,
            header_scripts="",
            updated_at=None,
            disclaimer=HEADER_SCRIPTS_WARNING,
        )
    return HeaderScriptOut(
        user_id=script.user_id,
        header_scripts=script.header_scripts,
        updated_at=script.updated_at,
        disclaimer=HEADER_SCRIPTS_WARNING,
    )


# ============================== Store Schemas ==============================


async def list_schemas(db: AsyncSession, user_id: int) -> list[StoreSchema]:
    result = await db.execute(
        select(StoreSchema)
        .where(StoreSchema.user_id == user_id)
        .order_by(StoreSchema.created_at.desc())
    )
    return list(result.scalars().all())


async def get_schema(db: AsyncSession, schema_id: int, user_id: int) -> StoreSchema | None:
    result = await db.execute(
        select(StoreSchema).where(
            StoreSchema.id == schema_id,
            StoreSchema.user_id == user_id,
        )
    )
    return result.scalar_one_or_none()


async def create_schema(db: AsyncSession, user_id: int, data: StoreSchemaCreate) -> StoreSchema:
    schema = StoreSchema(
        user_id=user_id,
        name=data.name,
        schema_type=data.schema_type,
        target_pages=data.target_pages,
        schema_json=data.schema_json,
        is_active=data.is_active,
    )
    db.add(schema)
    await db.commit()
    await db.refresh(schema)
    return schema


async def update_schema(
    db: AsyncSession, schema_id: int, user_id: int, data: StoreSchemaUpdate,
) -> StoreSchema | None:
    schema = await get_schema(db, schema_id, user_id)
    if schema is None:
        return None
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(schema, field, value)
    await db.commit()
    await db.refresh(schema)
    return schema


async def delete_schema(db: AsyncSession, schema_id: int, user_id: int) -> bool:
    schema = await get_schema(db, schema_id, user_id)
    if schema is None:
        return False
    await db.delete(schema)
    await db.commit()
    return True


async def get_public_schemas(db: AsyncSession, user_id: int) -> list[PublicStoreSchemaOut]:
    result = await db.execute(
        select(StoreSchema).where(
            StoreSchema.user_id == user_id,
            StoreSchema.is_active == True,  # noqa: E712
        )
    )
    schemas = result.scalars().all()
    return [
        PublicStoreSchemaOut(
            id=s.id,
            name=s.name,
            schema_type=s.schema_type,
            target_pages=s.target_pages,
            schema_json=s.schema_json,
            is_active=s.is_active,
        )
        for s in schemas
    ]


async def list_public_schemas(db: AsyncSession) -> list[PublicStoreSchemaOut]:
    """All active schemas for the single-owner store, consumed by the storefront
    SchemaInjector. The storefront matches these against the current page path
    via ``target_pages`` (e.g. ``/leather``) regardless of the owning user."""
    result = await db.execute(
        select(StoreSchema).where(
            StoreSchema.is_active == True,  # noqa: E712
        )
    )
    schemas = result.scalars().all()
    return [
        PublicStoreSchemaOut(
            id=s.id,
            name=s.name,
            schema_type=s.schema_type,
            target_pages=s.target_pages,
            schema_json=s.schema_json,
            is_active=s.is_active,
        )
        for s in schemas
    ]
