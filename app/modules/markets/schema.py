from datetime import datetime
from pydantic import BaseModel, ConfigDict

from app.modules.markets.model import (
    MarketStatus,
    PriceAdjustmentDirection,
    RolloutStatus,
    ChangeType,
    ChangeStatus,
)


# ===========================================================================
# Market
# ===========================================================================

class MarketCreate(BaseModel):
    name: str
    status: MarketStatus = MarketStatus.active
    country_code: str
    country_name: str
    currency: str
    includes: str | None = None
    customizations: str | None = None


class MarketUpdate(BaseModel):
    name: str | None = None
    status: MarketStatus | None = None
    country_code: str | None = None
    country_name: str | None = None
    currency: str | None = None
    includes: str | None = None
    customizations: str | None = None


class MarketOut(BaseModel):
    id: int
    name: str
    status: MarketStatus
    country_code: str
    country_name: str
    currency: str
    includes: str | None
    customizations: str | None
    created_at: datetime
    updated_at: datetime | None

    model_config = ConfigDict(from_attributes=True)


# ===========================================================================
# Catalog Product
# ===========================================================================

class CatalogProductCreate(BaseModel):
    product_id: int
    price_override: float | None = None
    compare_at_price: float | None = None
    included: bool = True


class CatalogProductUpdate(BaseModel):
    price_override: float | None = None
    compare_at_price: float | None = None
    included: bool | None = None


class CatalogProductOut(BaseModel):
    id: int
    catalog_id: int
    product_id: int
    price_override: float | None
    compare_at_price: float | None
    included: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ===========================================================================
# Catalog
# ===========================================================================

class CatalogCreate(BaseModel):
    title: str
    status: MarketStatus = MarketStatus.active
    market_id: int
    price_currency: str = "PKR"
    price_adjustment_direction: PriceAdjustmentDirection = PriceAdjustmentDirection.increase
    price_adjustment_value: float = 0.0
    include_compare_at: bool = False
    auto_include_new_products: bool = False
    products: list[CatalogProductCreate] = []


class CatalogUpdate(BaseModel):
    title: str | None = None
    status: MarketStatus | None = None
    market_id: int | None = None
    price_currency: str | None = None
    price_adjustment_direction: PriceAdjustmentDirection | None = None
    price_adjustment_value: float | None = None
    include_compare_at: bool | None = None
    auto_include_new_products: bool | None = None


class CatalogOut(BaseModel):
    id: int
    title: str
    status: MarketStatus
    market_id: int
    price_currency: str
    price_adjustment_direction: PriceAdjustmentDirection
    price_adjustment_value: float
    include_compare_at: bool
    auto_include_new_products: bool
    created_at: datetime
    updated_at: datetime | None

    model_config = ConfigDict(from_attributes=True)


class CatalogWithProducts(CatalogOut):
    products: list[CatalogProductOut] = []


# ===========================================================================
# Rollout Change
# ===========================================================================

class RolloutChangeCreate(BaseModel):
    change_type: ChangeType
    title: str
    description: str | None = None
    configuration: str | None = None
    status: ChangeStatus = ChangeStatus.pending


class RolloutChangeUpdate(BaseModel):
    change_type: ChangeType | None = None
    title: str | None = None
    description: str | None = None
    configuration: str | None = None
    status: ChangeStatus | None = None


class RolloutChangeOut(BaseModel):
    id: int
    rollout_id: int
    change_type: ChangeType
    title: str
    description: str | None
    configuration: str | None
    status: ChangeStatus
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ===========================================================================
# Rollout
# ===========================================================================

class RolloutCreate(BaseModel):
    name: str
    status: RolloutStatus = RolloutStatus.draft
    scheduled_at: datetime | None = None
    changes: list[RolloutChangeCreate] = []


class RolloutUpdate(BaseModel):
    name: str | None = None
    status: RolloutStatus | None = None
    scheduled_at: datetime | None = None


class RolloutOut(BaseModel):
    id: int
    name: str
    status: RolloutStatus
    scheduled_at: datetime | None
    created_at: datetime
    updated_at: datetime | None

    model_config = ConfigDict(from_attributes=True)


class RolloutWithChanges(RolloutOut):
    changes: list[RolloutChangeOut] = []


# ===========================================================================
# Markets Overview (dashboard)
# ===========================================================================

class MarketsOverview(BaseModel):
    total_markets: int
    active_markets: int
    draft_markets: int
    total_catalogs: int
    active_catalogs: int
    total_rollouts: int
    draft_rollouts: int
    scheduled_rollouts: int

    model_config = ConfigDict(from_attributes=True)
