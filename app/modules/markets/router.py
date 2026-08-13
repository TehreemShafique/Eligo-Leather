from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.core.dependencies import get_current_user
from app.modules.markets import service
from app.modules.markets.schema import (
    MarketCreate,
    MarketUpdate,
    MarketOut,
    CatalogCreate,
    CatalogUpdate,
    CatalogOut,
    CatalogWithProducts,
    CatalogProductCreate,
    CatalogProductUpdate,
    CatalogProductOut,
    RolloutCreate,
    RolloutUpdate,
    RolloutOut,
    RolloutWithChanges,
    RolloutChangeCreate,
    RolloutChangeUpdate,
    RolloutChangeOut,
    MarketsOverview,
)

# ===========================================================================
# Markets Overview
# ===========================================================================

markets_overview_router = APIRouter(
    prefix="/markets",
    tags=["Markets"],
    dependencies=[Depends(get_current_user)],
)


@markets_overview_router.get("/overview", response_model=MarketsOverview)
async def get_markets_overview(db: AsyncSession = Depends(get_db)):
    return await service.get_markets_overview(db)


# ===========================================================================
# Market CRUD
# ===========================================================================

market_router = APIRouter(
    prefix="/markets",
    tags=["Markets"],
    dependencies=[Depends(get_current_user)],
)


@market_router.post("/", response_model=MarketOut, status_code=status.HTTP_201_CREATED)
async def create_market(
    data: MarketCreate,
    db: AsyncSession = Depends(get_db),
):
    return await service.create_market(db, data)


@market_router.get("/", response_model=list[MarketOut])
async def list_markets(
    search: str | None = Query(None),
    status_filter: str | None = Query(None, alias="status"),
    country_code: str | None = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    db: AsyncSession = Depends(get_db),
):
    return await service.list_markets(
        db,
        search=search,
        status=status_filter,
        country_code=country_code,
        skip=skip,
        limit=limit,
    )


@market_router.get("/{market_id}", response_model=MarketOut)
async def get_market(
    market_id: int,
    db: AsyncSession = Depends(get_db),
):
    obj = await service.get_market(db, market_id)
    if not obj:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Market not found",
        )
    return obj


@market_router.patch("/{market_id}", response_model=MarketOut)
async def update_market(
    market_id: int,
    data: MarketUpdate,
    db: AsyncSession = Depends(get_db),
):
    obj = await service.update_market(db, market_id, data)
    if not obj:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Market not found",
        )
    return obj


@market_router.delete("/{market_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_market(
    market_id: int,
    db: AsyncSession = Depends(get_db),
):
    deleted = await service.delete_market(db, market_id)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Market not found",
        )


# ===========================================================================
# Catalog CRUD
# ===========================================================================

market_catalog_router = APIRouter(
    prefix="/catalogs",
    tags=["Catalogs"],
    dependencies=[Depends(get_current_user)],
)


@market_catalog_router.post("/", response_model=CatalogOut, status_code=status.HTTP_201_CREATED)
async def create_catalog(
    data: CatalogCreate,
    db: AsyncSession = Depends(get_db),
):
    return await service.create_catalog(db, data)


@market_catalog_router.get("/", response_model=list[CatalogOut])
async def list_catalogs(
    search: str | None = Query(None),
    status_filter: str | None = Query(None, alias="status"),
    market_id: int | None = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    db: AsyncSession = Depends(get_db),
):
    return await service.list_catalogs(
        db,
        search=search,
        status=status_filter,
        market_id=market_id,
        skip=skip,
        limit=limit,
    )


@market_catalog_router.get("/{catalog_id}", response_model=CatalogWithProducts)
async def get_catalog(
    catalog_id: int,
    db: AsyncSession = Depends(get_db),
):
    obj = await service.get_catalog(db, catalog_id)
    if not obj:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Catalog not found",
        )
    return obj


@market_catalog_router.patch("/{catalog_id}", response_model=CatalogOut)
async def update_catalog(
    catalog_id: int,
    data: CatalogUpdate,
    db: AsyncSession = Depends(get_db),
):
    obj = await service.update_catalog(db, catalog_id, data)
    if not obj:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Catalog not found",
        )
    return obj


@market_catalog_router.delete("/{catalog_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_catalog(
    catalog_id: int,
    db: AsyncSession = Depends(get_db),
):
    deleted = await service.delete_catalog(db, catalog_id)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Catalog not found",
        )


# --- Catalog Products ---

@market_catalog_router.post(
    "/{catalog_id}/products",
    response_model=CatalogProductOut,
    status_code=status.HTTP_201_CREATED,
)
async def add_catalog_product(
    catalog_id: int,
    data: CatalogProductCreate,
    db: AsyncSession = Depends(get_db),
):
    catalog = await service.get_catalog(db, catalog_id)
    if not catalog:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Catalog not found",
        )
    return await service.add_catalog_product(db, catalog_id, data)


@market_catalog_router.get(
    "/{catalog_id}/products",
    response_model=list[CatalogProductOut],
)
async def list_catalog_products(
    catalog_id: int,
    included_only: bool | None = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    db: AsyncSession = Depends(get_db),
):
    catalog = await service.get_catalog(db, catalog_id)
    if not catalog:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Catalog not found",
        )
    return await service.list_catalog_products(
        db, catalog_id, included_only=included_only, skip=skip, limit=limit,
    )


@market_catalog_router.patch(
    "/products/{cp_id}", response_model=CatalogProductOut,
)
async def update_catalog_product(
    cp_id: int,
    data: CatalogProductUpdate,
    db: AsyncSession = Depends(get_db),
):
    obj = await service.update_catalog_product(db, cp_id, data)
    if not obj:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Catalog product not found",
        )
    return obj


@market_catalog_router.delete(
    "/products/{cp_id}", status_code=status.HTTP_204_NO_CONTENT,
)
async def delete_catalog_product(
    cp_id: int,
    db: AsyncSession = Depends(get_db),
):
    deleted = await service.delete_catalog_product(db, cp_id)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Catalog product not found",
        )


# ===========================================================================
# Rollout CRUD
# ===========================================================================

rollout_router = APIRouter(
    prefix="/rollouts",
    tags=["Rollouts"],
    dependencies=[Depends(get_current_user)],
)


@rollout_router.post("/", response_model=RolloutOut, status_code=status.HTTP_201_CREATED)
async def create_rollout(
    data: RolloutCreate,
    db: AsyncSession = Depends(get_db),
):
    return await service.create_rollout(db, data)


@rollout_router.get("/", response_model=list[RolloutOut])
async def list_rollouts(
    search: str | None = Query(None),
    status_filter: str | None = Query(None, alias="status"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    db: AsyncSession = Depends(get_db),
):
    return await service.list_rollouts(
        db, search=search, status=status_filter, skip=skip, limit=limit,
    )


@rollout_router.get("/{rollout_id}", response_model=RolloutWithChanges)
async def get_rollout(
    rollout_id: int,
    db: AsyncSession = Depends(get_db),
):
    obj = await service.get_rollout(db, rollout_id)
    if not obj:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Rollout not found",
        )
    return obj


@rollout_router.patch("/{rollout_id}", response_model=RolloutOut)
async def update_rollout(
    rollout_id: int,
    data: RolloutUpdate,
    db: AsyncSession = Depends(get_db),
):
    obj = await service.update_rollout(db, rollout_id, data)
    if not obj:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Rollout not found",
        )
    return obj


@rollout_router.delete("/{rollout_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_rollout(
    rollout_id: int,
    db: AsyncSession = Depends(get_db),
):
    deleted = await service.delete_rollout(db, rollout_id)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Rollout not found",
        )


# --- Rollout Changes ---

@rollout_router.post(
    "/{rollout_id}/changes",
    response_model=RolloutChangeOut,
    status_code=status.HTTP_201_CREATED,
)
async def add_rollout_change(
    rollout_id: int,
    data: RolloutChangeCreate,
    db: AsyncSession = Depends(get_db),
):
    rollout = await service.get_rollout(db, rollout_id)
    if not rollout:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Rollout not found",
        )
    return await service.add_rollout_change(db, rollout_id, data)


@rollout_router.get(
    "/{rollout_id}/changes",
    response_model=list[RolloutChangeOut],
)
async def list_rollout_changes(
    rollout_id: int,
    change_type: str | None = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    db: AsyncSession = Depends(get_db),
):
    rollout = await service.get_rollout(db, rollout_id)
    if not rollout:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Rollout not found",
        )
    return await service.list_rollout_changes(
        db, rollout_id, change_type=change_type, skip=skip, limit=limit,
    )


@rollout_router.patch(
    "/changes/{change_id}", response_model=RolloutChangeOut,
)
async def update_rollout_change(
    change_id: int,
    data: RolloutChangeUpdate,
    db: AsyncSession = Depends(get_db),
):
    obj = await service.update_rollout_change(db, change_id, data)
    if not obj:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Rollout change not found",
        )
    return obj


@rollout_router.delete(
    "/changes/{change_id}", status_code=status.HTTP_204_NO_CONTENT,
)
async def delete_rollout_change(
    change_id: int,
    db: AsyncSession = Depends(get_db),
):
    deleted = await service.delete_rollout_change(db, change_id)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Rollout change not found",
        )
