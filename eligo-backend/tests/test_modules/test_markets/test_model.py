"""Tests for ``app.modules.markets.model``."""

from app.db.base import Base
from app.modules.markets.model import (
    MarketStatus,
    PriceAdjustmentDirection,
    RolloutStatus,
    ChangeType,
    ChangeStatus,
    Market,
    Catalog,
    CatalogProduct,
    Rollout,
    RolloutChange,
)


def test_markets_tables_registered():
    tables = Base.metadata.tables
    for name in [
        "markets",
        "catalogs",
        "catalog_products",
        "rollouts",
        "rollout_changes",
    ]:
        assert name in tables


def test_market_columns():
    cols = Base.metadata.tables["markets"].columns.keys()
    for name in [
        "id",
        "name",
        "status",
        "country_code",
        "country_name",
        "currency",
        "includes",
        "customizations",
        "created_at",
        "updated_at",
    ]:
        assert name in cols


def test_catalog_columns():
    cols = Base.metadata.tables["catalogs"].columns.keys()
    for name in [
        "id",
        "title",
        "status",
        "market_id",
        "price_currency",
        "price_adjustment_direction",
        "price_adjustment_value",
        "include_compare_at",
        "auto_include_new_products",
        "created_at",
        "updated_at",
    ]:
        assert name in cols


def test_catalog_product_columns():
    cols = Base.metadata.tables["catalog_products"].columns.keys()
    for name in [
        "id",
        "catalog_id",
        "product_id",
        "price_override",
        "compare_at_price",
        "included",
        "created_at",
    ]:
        assert name in cols


def test_rollout_columns():
    cols = Base.metadata.tables["rollouts"].columns.keys()
    for name in ["id", "name", "status", "scheduled_at", "created_at", "updated_at"]:
        assert name in cols


def test_rollout_change_columns():
    cols = Base.metadata.tables["rollout_changes"].columns.keys()
    for name in [
        "id",
        "rollout_id",
        "change_type",
        "title",
        "description",
        "configuration",
        "status",
        "created_at",
    ]:
        assert name in cols


def test_market_indexes():
    table = Base.metadata.tables["markets"]
    index_names = {idx.name for idx in table.indexes}
    assert "ix_markets_status" in index_names
    assert "ix_markets_country_code" in index_names


def test_catalog_indexes():
    table = Base.metadata.tables["catalogs"]
    index_names = {idx.name for idx in table.indexes}
    assert "ix_catalogs_status" in index_names
    assert "ix_catalogs_market_id" in index_names


def test_catalog_product_indexes():
    table = Base.metadata.tables["catalog_products"]
    index_names = {idx.name for idx in table.indexes}
    assert "ix_catalog_products_catalog_id" in index_names
    assert "ix_catalog_products_product_id" in index_names


def test_rollout_indexes():
    table = Base.metadata.tables["rollouts"]
    index_names = {idx.name for idx in table.indexes}
    assert "ix_rollouts_status" in index_names


def test_rollout_change_indexes():
    table = Base.metadata.tables["rollout_changes"]
    index_names = {idx.name for idx in table.indexes}
    assert "ix_rollout_changes_rollout_id" in index_names


def test_enum_values():
    assert {e.value for e in MarketStatus} == {"Active", "Draft"}
    assert {e.value for e in PriceAdjustmentDirection} == {"Increase", "Decrease"}
    assert {e.value for e in RolloutStatus} == {
        "Draft",
        "Scheduled",
        "Active",
        "Completed",
    }
    assert {e.value for e in ChangeType} == {
        "Online store theme",
        "Checkout and accounts",
    }
    assert {e.value for e in ChangeStatus} == {"Pending", "Applied", "Reverted"}


async def test_market_defaults_on_insert(db_session):
    market = Market(
        name="United States",
        country_code="US",
        country_name="United States",
        currency="USD",
    )
    db_session.add(market)
    await db_session.commit()
    await db_session.refresh(market)

    assert market.id is not None
    assert market.status == MarketStatus.active
    assert market.created_at is not None
    assert market.updated_at is None


async def test_catalog_defaults_on_insert(db_session):
    market = Market(
        name="United States",
        country_code="US",
        country_name="United States",
        currency="USD",
    )
    db_session.add(market)
    await db_session.commit()
    await db_session.refresh(market)

    catalog = Catalog(title="US Catalog", market_id=market.id)
    db_session.add(catalog)
    await db_session.commit()
    await db_session.refresh(catalog)

    assert catalog.status == MarketStatus.active
    assert catalog.price_currency == "PKR"
    assert catalog.price_adjustment_direction == PriceAdjustmentDirection.increase
    assert catalog.price_adjustment_value == 0.0
    assert catalog.include_compare_at is False
    assert catalog.auto_include_new_products is False


async def test_rollout_defaults_on_insert(db_session):
    rollout = Rollout(name="Summer rollout")
    db_session.add(rollout)
    await db_session.commit()
    await db_session.refresh(rollout)

    assert rollout.id is not None
    assert rollout.status == RolloutStatus.draft
    assert rollout.scheduled_at is None


async def test_rollout_change_defaults_on_insert(db_session):
    rollout = Rollout(name="Summer rollout")
    db_session.add(rollout)
    await db_session.commit()
    await db_session.refresh(rollout)

    change = RolloutChange(
        rollout_id=rollout.id,
        change_type=ChangeType.online_store_theme,
        title="Theme v2",
    )
    db_session.add(change)
    await db_session.commit()
    await db_session.refresh(change)

    assert change.id is not None
    assert change.status == ChangeStatus.pending
    assert change.description is None
    assert change.configuration is None
