"""Tests for ``app.modules.markets.service``."""

from app.modules.catalog.model import Product
from app.modules.markets import service
from app.modules.markets.model import (
    MarketStatus,
    PriceAdjustmentDirection,
    RolloutStatus,
    ChangeType,
    ChangeStatus,
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
)


async def _seed_market(db_session, **overrides):
    data = {
        "name": "United States",
        "country_code": "US",
        "country_name": "United States",
        "currency": "USD",
    }
    data.update(overrides)
    return await service.create_market(db_session, MarketCreate(**data))


async def _seed_product(db_session, title="Leather Belt"):
    product = Product(title=title)
    db_session.add(product)
    await db_session.commit()
    await db_session.refresh(product)
    return product


async def test_create_market(db_session):
    market = await _seed_market(db_session)
    assert market.id is not None
    assert market.name == "United States"
    assert market.country_code == "US"
    assert market.currency == "USD"
    assert market.status == MarketStatus.active


async def test_get_market_found(db_session):
    created = await _seed_market(db_session)
    fetched = await service.get_market(db_session, created.id)
    assert fetched is not None
    assert fetched.id == created.id
    assert fetched.name == "United States"


async def test_get_market_missing_returns_none(db_session):
    assert await service.get_market(db_session, 999999) is None


async def test_list_markets_filters(db_session):
    await _seed_market(db_session)
    await _seed_market(
        db_session,
        name="Pakistan",
        country_code="PK",
        country_name="Pakistan",
        currency="PKR",
    )

    by_search = await service.list_markets(db_session, search="Pakistan")
    assert len(by_search) == 1
    assert by_search[0].country_code == "PK"

    by_country = await service.list_markets(db_session, country_code="US")
    assert len(by_country) == 1
    assert by_country[0].name == "United States"

    assert len(await service.list_markets(db_session)) == 2


async def test_update_market(db_session):
    created = await _seed_market(db_session)
    updated = await service.update_market(
        db_session, created.id, MarketUpdate(country_code="GB")
    )
    assert updated is not None
    assert updated.country_code == "GB"
    assert updated.name == "United States"


async def test_update_market_missing_returns_none(db_session):
    assert (
        await service.update_market(
            db_session, 999999, MarketUpdate(name="Nope")
        )
        is None
    )


async def test_delete_market(db_session):
    created = await _seed_market(db_session)
    assert await service.delete_market(db_session, created.id) is True
    assert await service.get_market(db_session, created.id) is None


async def test_delete_market_missing_returns_false(db_session):
    assert await service.delete_market(db_session, 999999) is False


async def test_delete_market_cascades_catalog(db_session):
    market = await _seed_market(db_session)
    catalog = await service.create_catalog(
        db_session, CatalogCreate(title="US Catalog", market_id=market.id)
    )
    await service.delete_market(db_session, market.id)
    assert await service.get_catalog(db_session, catalog.id) is None


async def test_create_catalog(db_session):
    market = await _seed_market(db_session)
    catalog = await service.create_catalog(
        db_session, CatalogCreate(title="US Catalog", market_id=market.id)
    )
    assert catalog.id is not None
    assert catalog.title == "US Catalog"
    assert catalog.market_id == market.id
    assert catalog.status == MarketStatus.active
    assert catalog.price_currency == "PKR"
    assert catalog.price_adjustment_direction == PriceAdjustmentDirection.increase
    assert catalog.price_adjustment_value == 0.0


async def test_get_catalog_missing_returns_none(db_session):
    assert await service.get_catalog(db_session, 999999) is None


async def test_list_catalogs_filters(db_session):
    market = await _seed_market(db_session)
    await service.create_catalog(
        db_session, CatalogCreate(title="US Catalog", market_id=market.id)
    )
    await service.create_catalog(
        db_session, CatalogCreate(title="EU Catalog", market_id=market.id)
    )

    by_search = await service.list_catalogs(db_session, search="EU")
    assert len(by_search) == 1
    assert by_search[0].title == "EU Catalog"

    by_market = await service.list_catalogs(db_session, market_id=market.id)
    assert len(by_market) == 2


async def test_update_catalog(db_session):
    market = await _seed_market(db_session)
    created = await service.create_catalog(
        db_session, CatalogCreate(title="US Catalog", market_id=market.id)
    )
    updated = await service.update_catalog(
        db_session, created.id, CatalogUpdate(title="US Catalog v2")
    )
    assert updated is not None
    assert updated.title == "US Catalog v2"


async def test_update_catalog_missing_returns_none(db_session):
    assert (
        await service.update_catalog(db_session, 999999, CatalogUpdate(title="Nope"))
        is None
    )


async def test_delete_catalog(db_session):
    market = await _seed_market(db_session)
    created = await service.create_catalog(
        db_session, CatalogCreate(title="US Catalog", market_id=market.id)
    )
    assert await service.delete_catalog(db_session, created.id) is True
    assert await service.get_catalog(db_session, created.id) is None


async def test_delete_catalog_missing_returns_false(db_session):
    assert await service.delete_catalog(db_session, 999999) is False


async def test_add_catalog_product(db_session):
    market = await _seed_market(db_session)
    catalog = await service.create_catalog(
        db_session, CatalogCreate(title="US Catalog", market_id=market.id)
    )
    product = await _seed_product(db_session)
    cp = await service.add_catalog_product(
        db_session,
        catalog.id,
        CatalogProductCreate(product_id=product.id, price_override=10.0),
    )
    assert cp.id is not None
    assert cp.catalog_id == catalog.id
    assert cp.product_id == product.id
    assert cp.price_override == 10.0
    assert cp.included is True


async def test_list_catalog_products_included_only(db_session):
    market = await _seed_market(db_session)
    catalog = await service.create_catalog(
        db_session, CatalogCreate(title="US Catalog", market_id=market.id)
    )
    product_a = await _seed_product(db_session, title="Leather Belt")
    product_b = await _seed_product(db_session, title="Leather Wallet")
    await service.add_catalog_product(
        db_session, catalog.id, CatalogProductCreate(product_id=product_a.id)
    )
    await service.add_catalog_product(
        db_session,
        catalog.id,
        CatalogProductCreate(product_id=product_b.id, included=False),
    )

    included = await service.list_catalog_products(
        db_session, catalog.id, included_only=True
    )
    assert len(included) == 1
    assert included[0].product_id == product_a.id

    excluded = await service.list_catalog_products(
        db_session, catalog.id, included_only=False
    )
    assert len(excluded) == 1
    assert excluded[0].product_id == product_b.id


async def test_update_catalog_product(db_session):
    market = await _seed_market(db_session)
    catalog = await service.create_catalog(
        db_session, CatalogCreate(title="US Catalog", market_id=market.id)
    )
    product = await _seed_product(db_session)
    cp = await service.add_catalog_product(
        db_session, catalog.id, CatalogProductCreate(product_id=product.id)
    )
    updated = await service.update_catalog_product(
        db_session,
        cp.id,
        CatalogProductUpdate(included=False, price_override=15.0),
    )
    assert updated is not None
    assert updated.included is False
    assert updated.price_override == 15.0


async def test_update_catalog_product_missing_returns_none(db_session):
    assert (
        await service.update_catalog_product(
            db_session, 999999, CatalogProductUpdate(included=False)
        )
        is None
    )


async def test_delete_catalog_product(db_session):
    market = await _seed_market(db_session)
    catalog = await service.create_catalog(
        db_session, CatalogCreate(title="US Catalog", market_id=market.id)
    )
    product = await _seed_product(db_session)
    cp = await service.add_catalog_product(
        db_session, catalog.id, CatalogProductCreate(product_id=product.id)
    )
    assert await service.delete_catalog_product(db_session, cp.id) is True
    assert await service.get_catalog_product(db_session, cp.id) is None


async def test_delete_catalog_product_missing_returns_false(db_session):
    assert await service.delete_catalog_product(db_session, 999999) is False


async def test_create_rollout_with_changes(db_session):
    rollout = await service.create_rollout(
        db_session,
        RolloutCreate(
            name="Summer rollout",
            changes=[
                RolloutChangeCreate(
                    change_type=ChangeType.online_store_theme, title="Theme v2"
                )
            ],
        ),
    )
    assert rollout.id is not None
    assert rollout.name == "Summer rollout"
    assert rollout.status == RolloutStatus.draft
    assert len(rollout.changes) == 1
    assert rollout.changes[0].change_type == ChangeType.online_store_theme


async def test_get_rollout_missing_returns_none(db_session):
    assert await service.get_rollout(db_session, 999999) is None


async def test_list_rollouts_search(db_session):
    await service.create_rollout(db_session, RolloutCreate(name="Summer rollout"))
    await service.create_rollout(db_session, RolloutCreate(name="Winter rollout"))
    results = await service.list_rollouts(db_session, search="Summer")
    assert len(results) == 1
    assert results[0].name == "Summer rollout"


async def test_update_rollout(db_session):
    created = await service.create_rollout(db_session, RolloutCreate(name="Summer rollout"))
    updated = await service.update_rollout(
        db_session, created.id, RolloutUpdate(status="Scheduled")
    )
    assert updated is not None
    assert updated.status == RolloutStatus.scheduled


async def test_update_rollout_missing_returns_none(db_session):
    assert (
        await service.update_rollout(db_session, 999999, RolloutUpdate(name="Nope"))
        is None
    )


async def test_delete_rollout(db_session):
    created = await service.create_rollout(db_session, RolloutCreate(name="Summer rollout"))
    assert await service.delete_rollout(db_session, created.id) is True
    assert await service.get_rollout(db_session, created.id) is None


async def test_delete_rollout_missing_returns_false(db_session):
    assert await service.delete_rollout(db_session, 999999) is False


async def test_add_rollout_change(db_session):
    rollout = await service.create_rollout(db_session, RolloutCreate(name="Summer rollout"))
    change = await service.add_rollout_change(
        db_session,
        rollout.id,
        RolloutChangeCreate(
            change_type=ChangeType.checkout_and_accounts, title="New checkout"
        ),
    )
    assert change.id is not None
    assert change.rollout_id == rollout.id
    assert change.change_type == ChangeType.checkout_and_accounts
    assert change.status == ChangeStatus.pending


async def test_list_rollout_changes_filter(db_session):
    rollout = await service.create_rollout(db_session, RolloutCreate(name="Summer rollout"))
    await service.add_rollout_change(
        db_session,
        rollout.id,
        RolloutChangeCreate(change_type=ChangeType.online_store_theme, title="Theme v2"),
    )
    await service.add_rollout_change(
        db_session,
        rollout.id,
        RolloutChangeCreate(change_type=ChangeType.checkout_and_accounts, title="Checkout v2"),
    )
    theme_changes = await service.list_rollout_changes(
        db_session, rollout.id, change_type="online_store_theme"
    )
    assert len(theme_changes) == 1
    assert theme_changes[0].title == "Theme v2"
    assert len(await service.list_rollout_changes(db_session, rollout.id)) == 2


async def test_update_rollout_change(db_session):
    rollout = await service.create_rollout(db_session, RolloutCreate(name="Summer rollout"))
    change = await service.add_rollout_change(
        db_session,
        rollout.id,
        RolloutChangeCreate(change_type=ChangeType.online_store_theme, title="Theme v2"),
    )
    updated = await service.update_rollout_change(
        db_session, change.id, RolloutChangeUpdate(status="Applied")
    )
    assert updated is not None
    assert updated.status == ChangeStatus.applied


async def test_update_rollout_change_missing_returns_none(db_session):
    assert (
        await service.update_rollout_change(
            db_session, 999999, RolloutChangeUpdate(title="Nope")
        )
        is None
    )


async def test_delete_rollout_change(db_session):
    rollout = await service.create_rollout(db_session, RolloutCreate(name="Summer rollout"))
    change = await service.add_rollout_change(
        db_session,
        rollout.id,
        RolloutChangeCreate(change_type=ChangeType.online_store_theme, title="Theme v2"),
    )
    assert await service.delete_rollout_change(db_session, change.id) is True
    assert await service.get_rollout_change(db_session, change.id) is None


async def test_delete_rollout_change_missing_returns_false(db_session):
    assert await service.delete_rollout_change(db_session, 999999) is False


async def test_markets_overview_empty(db_session):
    overview = await service.get_markets_overview(db_session)
    assert overview.total_markets == 0
    assert overview.active_markets == 0
    assert overview.draft_markets == 0
    assert overview.total_catalogs == 0
    assert overview.active_catalogs == 0
    assert overview.total_rollouts == 0
    assert overview.draft_rollouts == 0
    assert overview.scheduled_rollouts == 0


async def test_markets_overview_with_data(db_session):
    market = await _seed_market(db_session)
    await _seed_market(
        db_session,
        name="Pakistan",
        country_code="PK",
        country_name="Pakistan",
        currency="PKR",
        status=MarketStatus.draft,
    )
    await service.create_catalog(
        db_session, CatalogCreate(title="US Catalog", market_id=market.id)
    )
    await service.create_catalog(
        db_session, CatalogCreate(title="Draft Catalog", market_id=market.id, status="Draft")
    )
    await service.create_rollout(db_session, RolloutCreate(name="Summer rollout"))
    await service.create_rollout(
        db_session, RolloutCreate(name="Scheduled rollout", status="Scheduled")
    )

    overview = await service.get_markets_overview(db_session)
    assert overview.total_markets == 2
    assert overview.active_markets == 1
    assert overview.draft_markets == 1
    assert overview.total_catalogs == 2
    assert overview.active_catalogs == 1
    assert overview.total_rollouts == 2
    assert overview.draft_rollouts == 1
    assert overview.scheduled_rollouts == 1
