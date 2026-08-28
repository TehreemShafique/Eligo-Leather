from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_current_user
from app.db.session import get_db
from app.modules.auth.model import User
from app.modules.store import service
from app.modules.store.schema import (
    HeaderScriptOut, HeaderScriptUpdate,
    StoreSchemaCreate, StoreSchemaUpdate, StoreSchemaOut, PublicStoreSchemaOut,
)

router = APIRouter(
    prefix="/store",
    tags=["Store"],
)


# ============================== Header Scripts ==============================


@router.get("/header-scripts", response_model=HeaderScriptOut)
async def get_my_header_scripts(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    script = await service.ensure_header_script(db, current_user.id)
    return service.to_out(script)


@router.post("/header-scripts", response_model=HeaderScriptOut)
async def save_header_scripts(
    data: HeaderScriptUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    script = await service.update_header_script(db, current_user.id, data)
    return service.to_out(script)


@router.get("/{user_id}/header-scripts", response_model=HeaderScriptOut)
async def get_public_header_scripts(
    user_id: int,
    db: AsyncSession = Depends(get_db),
):
    """Public read used by the storefront renderer to inject the owner's
    custom code into the page <head>. Scripts are public-facing content."""
    script = await service.get_header_script(db, user_id)
    return service.to_out(script)


# ============================== Store Schemas (JSON-LD) ==============================


@router.get("/schemas", response_model=list[StoreSchemaOut])
async def list_my_schemas(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await service.list_schemas(db, current_user.id)


@router.post("/schemas", response_model=StoreSchemaOut, status_code=status.HTTP_201_CREATED)
async def create_my_schema(
    data: StoreSchemaCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await service.create_schema(db, current_user.id, data)


@router.patch("/schemas/{schema_id}", response_model=StoreSchemaOut)
async def update_my_schema(
    schema_id: int,
    data: StoreSchemaUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    schema = await service.update_schema(db, schema_id, current_user.id, data)
    if not schema:
        raise HTTPException(status_code=404, detail="Schema not found")
    return schema


@router.delete("/schemas/{schema_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_my_schema(
    schema_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    deleted = await service.delete_schema(db, schema_id, current_user.id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Schema not found")


@router.get("/public/schemas", response_model=list[PublicStoreSchemaOut])
async def get_all_public_schemas(
    db: AsyncSession = Depends(get_db),
):
    """Public read used by the storefront SchemaInjector. Returns all active
    schemas for the single-owner store so the renderer can match them against
    each page's path without needing to know the owner's user id."""
    return await service.list_public_schemas(db)


@router.get("/{user_id}/schemas", response_model=list[PublicStoreSchemaOut])
async def get_public_schemas(
    user_id: int,
    db: AsyncSession = Depends(get_db),
):
    """Public read used by the storefront renderer to inject active
    JSON-LD schemas into matching pages."""
    return await service.get_public_schemas(db, user_id)
