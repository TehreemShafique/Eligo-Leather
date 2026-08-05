from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.core.dependencies import require_admin
from app.modules.settings.metafields_and_metaobjects.model import MetafieldScope
from app.modules.settings.metafields_and_metaobjects.schema import (
    MetafieldDefinitionCreate,
    MetafieldDefinitionOut,
    MetafieldDefinitionUpdate,
    MetafieldValueCreate,
    MetafieldValueOut,
)
from app.modules.settings.metafields_and_metaobjects import service

router = APIRouter(
    prefix="/metafields-and-metaobjects",
    tags=["Settings", "Metafields & Metaobjects"],
    dependencies=[Depends(require_admin)],
)

Db = Annotated[AsyncSession, Depends(get_db)]


@router.get("/overview")
async def overview(db: Db):
    """Landing payload: resource directory + catalog + metaobject summary."""
    resources = await service.list_resources(db)
    metaobjects = await service.list_metaobject_definitions(db)
    return {
        "resources": resources,
        "resource_types": service.list_resource_types(),
        "type_catalog": service.list_type_definitions(),
        "metaobject_definitions_count": len(metaobjects),
    }


@router.get("/resource-types")
async def resource_types():
    return service.list_resource_types()


@router.get("/types")
async def metafield_types():
    return service.list_type_definitions()


# ---------------- Definitions (universal; resource_type is in the payload) ----------------


@router.get("/definitions", response_model=list[MetafieldDefinitionOut])
async def list_definitions(
    db: Db,
    resource_type: str | None = Query(default=None, description="e.g. product, variant, collection"),
    scope: MetafieldScope | None = None,
    search: str | None = None,
    skip: int = 0,
    limit: int = 100,
):
    return await service.list_definitions(db, resource_type, scope, search, skip, limit)


@router.post("/definitions", response_model=MetafieldDefinitionOut, status_code=201)
async def create_definition(data: MetafieldDefinitionCreate, db: Db):
    try:
        return await service.create_definition(data, db)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc))


@router.get("/definitions/{definition_id}", response_model=MetafieldDefinitionOut)
async def get_definition(definition_id: int, db: Db):
    definition = await service.get_definition(definition_id, db)
    if not definition:
        raise HTTPException(status_code=404, detail="Definition not found")
    return definition


@router.patch("/definitions/{definition_id}", response_model=MetafieldDefinitionOut)
async def update_definition(definition_id: int, data: MetafieldDefinitionUpdate, db: Db):
    try:
        definition = await service.update_definition(definition_id, data, db)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc))
    if not definition:
        raise HTTPException(status_code=404, detail="Definition not found")
    return definition


@router.delete("/definitions/{definition_id}", status_code=204)
async def delete_definition(definition_id: int, db: Db):
    deleted = await service.delete_definition(definition_id, db)
    if not deleted:
        raise HTTPException(status_code=404, detail="Definition not found")


@router.post("/definitions/{definition_id}/pin", response_model=MetafieldDefinitionOut)
async def set_pinned(definition_id: int, db: Db, pinned: bool = True):
    definition = await service.set_pinned(definition_id, pinned, db)
    if not definition:
        raise HTTPException(status_code=404, detail="Definition not found")
    return definition


# ---------------- Values ----------------


@router.post("/definitions/{definition_id}/values", response_model=MetafieldValueOut, status_code=201)
async def record_value(definition_id: int, data: MetafieldValueCreate, db: Db):
    value = await service.record_value(definition_id, data, db)
    if not value:
        raise HTTPException(status_code=404, detail="Definition not found")
    return value


@router.get("/definitions/{definition_id}/values", response_model=list[MetafieldValueOut])
async def list_values(definition_id: int, db: Db):
    return await service.list_values(definition_id, db)


# ---------------- Metaobjects dashboard (reuses content module) ----------------


@router.get("/metaobjects")
async def list_metaobjects(db: Db, search: str | None = None, skip: int = 0, limit: int = 100):
    definitions = await service.list_metaobject_definitions(db, search, skip, limit)
    return {
        "definitions": definitions,
        "total": len(definitions),
    }


@router.get("/metaobjects/{definition_id}")
async def get_metaobject(definition_id: int, db: Db):
    definition = await service.get_metaobject_definition(definition_id, db)
    if not definition:
        raise HTTPException(status_code=404, detail="Metaobject definition not found")
    entries = await service.get_metaobject_definition_entries(definition_id, db)
    return {**definition.model_dump(), "entries": entries}


# ---------------- Seed ----------------


@router.post("/seed", status_code=201)
async def seed(db: Db):
    await service.seed_defaults(db)
    return {"status": "ok"}
