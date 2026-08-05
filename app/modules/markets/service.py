from datetime import datetime

from sqlalchemy import select, func, or_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.modules.markets.model import (
    Market,
    Catalog,
    CatalogProduct,
    Rollout,
    RolloutChange,
)
from app.modules.markets.schema import (
    MarketCreate,
    MarketUpdate,
    CatalogCreate,
    CatalogUpdate,
    CatalogProductCreate,
    CatalogProductUpdate,
    RolloutCreate,
    RolloutUpdate,
    RolloutChangeCreate,
    RolloutChangeUpdate,
    MarketsOverview,
)


# ===========================================================================
# Market – CRUD
# ===========================================================================

async def create_market(
    db: AsyncSession, data: MarketCreate,
) -> Market:
    obj = Market(**data.model_dump())
    db.add(obj)
    await db.commit()
    await db.refresh(obj)
    return obj


async def get_market(
    db: AsyncSession, market_id: int,
) -> Market | None:
    result = await db.execute(
        select(Market).where(Market.id == market_id),
    )
    return result.scalar_one_or_none()


async def list_markets(
    db: AsyncSession,
    search: str | None = None,
    status: str | None = None,
    country_code: str | None = None,
    skip: int = 0,
    limit: int = 50,
) -> list[Market]:
    query = select(Market)
    if search:
        query = query.where(
            or_(
                Market.name.ilike(f"%{search}%"),
                Market.country_name.ilike(f"%{search}%"),
            ),
        )
    if status:
        query = query.where(Market.status == status)
    if country_code:
        query = query.where(Market.country_code == country_code)
    query = query.order_by(Market.created_at.desc()).offset(skip).limit(limit)
    result = await db.execute(query)
    return list(result.scalars().all())


async def update_market(
    db: AsyncSession, market_id: int, data: MarketUpdate,
) -> Market | None:
    obj = await get_market(db, market_id)
    if not obj:
        return None
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(obj, field, value)
    await db.commit()
    await db.refresh(obj)
    return obj


async def delete_market(db: AsyncSession, market_id: int) -> bool:
    obj = await get_market(db, market_id)
    if not obj:
        return False
    await db.delete(obj)
    await db.commit()
    return True


# ===========================================================================
# Catalog – CRUD
# ===========================================================================

async def create_catalog(
    db: AsyncSession, data: CatalogCreate,
) -> Catalog:
    products_data = data.products
    catalog = Catalog(
        title=data.title,
        status=data.status,
        market_id=data.market_id,
        price_currency=data.price_currency,
        price_adjustment_direction=data.price_adjustment_direction,
        price_adjustment_value=data.price_adjustment_value,
        include_compare_at=data.include_compare_at,
        auto_include_new_products=data.auto_include_new_products,
    )
    if products_data:
        catalog.products = [
            CatalogProduct(
                product_id=p.product_id,
                price_override=p.price_override,
                compare_at_price=p.compare_at_price,
                included=p.included,
            )
            for p in products_data
        ]
    db.add(catalog)
    await db.commit()
    await db.refresh(catalog, attribute_names=["products"])
    return catalog


async def get_catalog(
    db: AsyncSession, catalog_id: int,
) -> Catalog | None:
    result = await db.execute(
        select(Catalog)
        .options(selectinload(Catalog.products))
        .where(Catalog.id == catalog_id),
    )
    return result.scalar_one_or_none()


async def list_catalogs(
    db: AsyncSession,
    search: str | None = None,
    status: str | None = None,
    market_id: int | None = None,
    skip: int = 0,
    limit: int = 50,
) -> list[Catalog]:
    query = select(Catalog)
    if search:
        query = query.where(Catalog.title.ilike(f"%{search}%"))
    if status:
        query = query.where(Catalog.status == status)
    if market_id:
        query = query.where(Catalog.market_id == market_id)
    query = query.order_by(Catalog.created_at.desc()).offset(skip).limit(limit)
    result = await db.execute(query)
    return list(result.scalars().all())


async def update_catalog(
    db: AsyncSession, catalog_id: int, data: CatalogUpdate,
) -> Catalog | None:
    obj = await get_catalog(db, catalog_id)
    if not obj:
        return None
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(obj, field, value)
    await db.commit()
    await db.refresh(obj)
    return obj


async def delete_catalog(db: AsyncSession, catalog_id: int) -> bool:
    obj = await get_catalog(db, catalog_id)
    if not obj:
        return False
    await db.delete(obj)
    await db.commit()
    return True


# ===========================================================================
# Catalog Product – CRUD
# ===========================================================================

async def add_catalog_product(
    db: AsyncSession, catalog_id: int, data: CatalogProductCreate,
) -> CatalogProduct:
    obj = CatalogProduct(catalog_id=catalog_id, **data.model_dump())
    db.add(obj)
    await db.commit()
    await db.refresh(obj)
    return obj


async def get_catalog_product(
    db: AsyncSession, cp_id: int,
) -> CatalogProduct | None:
    result = await db.execute(
        select(CatalogProduct).where(CatalogProduct.id == cp_id),
    )
    return result.scalar_one_or_none()


async def list_catalog_products(
    db: AsyncSession,
    catalog_id: int,
    included_only: bool | None = None,
    skip: int = 0,
    limit: int = 50,
) -> list[CatalogProduct]:
    query = select(CatalogProduct).where(CatalogProduct.catalog_id == catalog_id)
    if included_only is not None:
        query = query.where(CatalogProduct.included == included_only)
    query = query.order_by(CatalogProduct.created_at.desc()).offset(skip).limit(limit)
    result = await db.execute(query)
    return list(result.scalars().all())


async def update_catalog_product(
    db: AsyncSession, cp_id: int, data: CatalogProductUpdate,
) -> CatalogProduct | None:
    obj = await get_catalog_product(db, cp_id)
    if not obj:
        return None
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(obj, field, value)
    await db.commit()
    await db.refresh(obj)
    return obj


async def delete_catalog_product(db: AsyncSession, cp_id: int) -> bool:
    obj = await get_catalog_product(db, cp_id)
    if not obj:
        return False
    await db.delete(obj)
    await db.commit()
    return True


# ===========================================================================
# Rollout – CRUD
# ===========================================================================

async def create_rollout(
    db: AsyncSession, data: RolloutCreate,
) -> Rollout:
    changes_data = data.changes
    rollout = Rollout(
        name=data.name,
        status=data.status,
        scheduled_at=data.scheduled_at,
    )
    if changes_data:
        rollout.changes = [
            RolloutChange(
                change_type=c.change_type,
                title=c.title,
                description=c.description,
                configuration=c.configuration,
                status=c.status,
            )
            for c in changes_data
        ]
    db.add(rollout)
    await db.commit()
    await db.refresh(rollout, attribute_names=["changes"])
    return rollout


async def get_rollout(
    db: AsyncSession, rollout_id: int,
) -> Rollout | None:
    result = await db.execute(
        select(Rollout)
        .options(selectinload(Rollout.changes))
        .where(Rollout.id == rollout_id),
    )
    return result.scalar_one_or_none()


async def list_rollouts(
    db: AsyncSession,
    search: str | None = None,
    status: str | None = None,
    skip: int = 0,
    limit: int = 50,
) -> list[Rollout]:
    query = select(Rollout)
    if search:
        query = query.where(Rollout.name.ilike(f"%{search}%"))
    if status:
        query = query.where(Rollout.status == status)
    query = query.order_by(Rollout.created_at.desc()).offset(skip).limit(limit)
    result = await db.execute(query)
    return list(result.scalars().all())


async def update_rollout(
    db: AsyncSession, rollout_id: int, data: RolloutUpdate,
) -> Rollout | None:
    obj = await get_rollout(db, rollout_id)
    if not obj:
        return None
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(obj, field, value)
    await db.commit()
    await db.refresh(obj)
    return obj


async def delete_rollout(db: AsyncSession, rollout_id: int) -> bool:
    obj = await get_rollout(db, rollout_id)
    if not obj:
        return False
    await db.delete(obj)
    await db.commit()
    return True


# ===========================================================================
# Rollout Change – CRUD
# ===========================================================================

async def add_rollout_change(
    db: AsyncSession, rollout_id: int, data: RolloutChangeCreate,
) -> RolloutChange:
    obj = RolloutChange(rollout_id=rollout_id, **data.model_dump())
    db.add(obj)
    await db.commit()
    await db.refresh(obj)
    return obj


async def get_rollout_change(
    db: AsyncSession, change_id: int,
) -> RolloutChange | None:
    result = await db.execute(
        select(RolloutChange).where(RolloutChange.id == change_id),
    )
    return result.scalar_one_or_none()


async def list_rollout_changes(
    db: AsyncSession,
    rollout_id: int,
    change_type: str | None = None,
    skip: int = 0,
    limit: int = 50,
) -> list[RolloutChange]:
    query = select(RolloutChange).where(RolloutChange.rollout_id == rollout_id)
    if change_type:
        query = query.where(RolloutChange.change_type == change_type)
    query = query.order_by(RolloutChange.created_at.desc()).offset(skip).limit(limit)
    result = await db.execute(query)
    return list(result.scalars().all())


async def update_rollout_change(
    db: AsyncSession, change_id: int, data: RolloutChangeUpdate,
) -> RolloutChange | None:
    obj = await get_rollout_change(db, change_id)
    if not obj:
        return None
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(obj, field, value)
    await db.commit()
    await db.refresh(obj)
    return obj


async def delete_rollout_change(db: AsyncSession, change_id: int) -> bool:
    obj = await get_rollout_change(db, change_id)
    if not obj:
        return False
    await db.delete(obj)
    await db.commit()
    return True


# ===========================================================================
# Markets Overview – Dashboard aggregations
# ===========================================================================

async def get_markets_overview(db: AsyncSession) -> MarketsOverview:
    # Markets counts
    market_counts = await db.execute(
        select(
            func.coalesce(func.count(Market.id), 0).label("total"),
            func.coalesce(
                func.count(Market.id).filter(Market.status == "Active"), 0,
            ).label("active"),
            func.coalesce(
                func.count(Market.id).filter(Market.status == "Draft"), 0,
            ).label("draft"),
        ),
    )
    m = market_counts.one()

    # Catalog counts
    catalog_counts = await db.execute(
        select(
            func.coalesce(func.count(Catalog.id), 0).label("total"),
            func.coalesce(
                func.count(Catalog.id).filter(Catalog.status == "Active"), 0,
            ).label("active"),
        ),
    )
    c = catalog_counts.one()

    # Rollout counts
    rollout_counts = await db.execute(
        select(
            func.coalesce(func.count(Rollout.id), 0).label("total"),
            func.coalesce(
                func.count(Rollout.id).filter(Rollout.status == "Draft"), 0,
            ).label("draft"),
            func.coalesce(
                func.count(Rollout.id).filter(Rollout.status == "Scheduled"), 0,
            ).label("scheduled"),
        ),
    )
    r = rollout_counts.one()

    return MarketsOverview(
        total_markets=int(m.total),
        active_markets=int(m.active),
        draft_markets=int(m.draft),
        total_catalogs=int(c.total),
        active_catalogs=int(c.active),
        total_rollouts=int(r.total),
        draft_rollouts=int(r.draft),
        scheduled_rollouts=int(r.scheduled),
    )
