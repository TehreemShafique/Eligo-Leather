from datetime import datetime, date
from decimal import Decimal
from pydantic import BaseModel, ConfigDict, Field

from app.modules.catalog.model import (
    ProductStatus, ProductCategory, SalesChannel,
    WeightUnit, PurchaseOrderStatus, TransferStatus, GiftCardStatus,
    CollectionType,
)


# ===========================================================================
# Product Variant
# ===========================================================================

class VariantCreate(BaseModel):
    title: str
    color_name: str | None = None
    color_hex: str | None = None
    is_canonical: bool = False
    image_url: str | None = None
    sku: str | None = None
    price: Decimal = Decimal("0")
    compare_at_price: Decimal | None = None
    cost_per_item: Decimal | None = None
    barcode: str | None = None
    inventory_quantity: int = 0
    weight: Decimal | None = None
    weight_unit: WeightUnit = WeightUnit.kg
    inventory_tracked: bool = True
    continue_selling_out_of_stock: bool = False
    is_active: bool = True


class VariantUpdate(BaseModel):
    title: str | None = None
    color_name: str | None = None
    color_hex: str | None = None
    is_canonical: bool | None = None
    image_url: str | None = None
    sku: str | None = None
    price: Decimal | None = None
    compare_at_price: Decimal | None = None
    cost_per_item: Decimal | None = None
    barcode: str | None = None
    inventory_quantity: int | None = None
    weight: Decimal | None = None
    weight_unit: WeightUnit | None = None
    inventory_tracked: bool | None = None
    continue_selling_out_of_stock: bool | None = None
    is_active: bool | None = None


class VariantOut(BaseModel):
    id: int
    product_id: int
    title: str
    color_name: str | None = None
    color_hex: str | None = None
    is_canonical: bool = False
    image_url: str | None = None
    sku: str | None = None
    price: Decimal
    compare_at_price: Decimal | None = None
    cost_per_item: Decimal | None = None
    barcode: str | None = None
    inventory_quantity: int
    weight: Decimal | None = None
    weight_unit: WeightUnit
    inventory_tracked: bool
    continue_selling_out_of_stock: bool
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ===========================================================================
# Product Image
# ===========================================================================

class ProductImageCreate(BaseModel):
    url: str
    alt_text: str | None = None
    color_tag: str | None = None
    focal_point_x: float | None = None
    focal_point_y: float | None = None
    position: int = 0


class ProductImageUpdate(BaseModel):
    url: str | None = None
    alt_text: str | None = None
    color_tag: str | None = None
    focal_point_x: float | None = None
    focal_point_y: float | None = None
    position: int | None = None


class ProductImageOut(BaseModel):
    id: int
    product_id: int
    url: str
    alt_text: str | None = None
    color_tag: str | None = None
    focal_point_x: float | None = None
    focal_point_y: float | None = None
    position: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ===========================================================================
# Product
# ===========================================================================

class ProductCreate(BaseModel):
    title: str
    description: str | None = None
    status: ProductStatus = ProductStatus.draft
    category: ProductCategory = ProductCategory.other
    product_type: str | None = None
    channels: str | None = None
    vendor: str = "Eligo Leather"
    theme_template: str = "Default product"
    seo_title: str | None = Field(None, max_length=70)
    seo_description: str | None = Field(None, max_length=160)
    meta_description: str | None = None
    material: str | None = None
    dimensions: str | None = None
    shipping_return_policy: str | None = None
    url_handle: str | None = None
    tags: str | None = None
    categories: str | None = None
    category_list: list[str] = []
    variants: list[VariantCreate] = []
    images: list[ProductImageCreate] = []


class ProductUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    status: ProductStatus | None = None
    category: ProductCategory | None = None
    product_type: str | None = None
    channels: str | None = None
    vendor: str | None = None
    theme_template: str | None = None
    seo_title: str | None = Field(None, max_length=70)
    seo_description: str | None = Field(None, max_length=160)
    meta_description: str | None = None
    material: str | None = None
    dimensions: str | None = None
    shipping_return_policy: str | None = None
    url_handle: str | None = None
    tags: str | None = None
    categories: str | None = None
    category_list: list[str] = []


class ProductOut(BaseModel):
    id: int
    title: str
    description: str | None
    status: ProductStatus
    category: ProductCategory
    product_type: str | None
    channels: str | None
    vendor: str
    theme_template: str
    seo_title: str | None
    seo_description: str | None
    meta_description: str | None = None
    material: str | None = None
    dimensions: str | None = None
    shipping_return_policy: str | None = None
    url_handle: str | None
    tags: str | None
    categories: str | None = None
    category_list: list[str] = []
    created_at: datetime
    updated_at: datetime
    variants: list[VariantOut] = []
    images: list[ProductImageOut] = []

    model_config = ConfigDict(from_attributes=True)


class ProductListOut(BaseModel):
    id: int
    title: str
    status: ProductStatus
    category: ProductCategory
    product_type: str | None
    vendor: str
    tags: str | None
    categories: str | None = None
    category_list: list[str] = []
    url_handle: str | None = None
    price: Decimal | None = None
    compare_at_price: Decimal | None = None
    image_url: str | None = None
    created_at: datetime
    updated_at: datetime
    variants: list[VariantOut] = []
    images: list[ProductImageOut] = []

    model_config = ConfigDict(from_attributes=True)


# ===========================================================================
# Collection
# ===========================================================================

class CollectionCreate(BaseModel):
    title: str
    description: str | None = None
    image_url: str | None = None
    conditions: str | None = None
    channels: str | None = None
    collection_type: CollectionType = CollectionType.wallets
    seo_title: str | None = Field(None, max_length=70)
    seo_description: str | None = Field(None, max_length=160)
    meta_description: str | None = None
    url_handle: str | None = None


class CollectionUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    image_url: str | None = None
    conditions: str | None = None
    channels: str | None = None
    collection_type: CollectionType | None = None
    seo_title: str | None = Field(None, max_length=70)
    seo_description: str | None = Field(None, max_length=160)
    meta_description: str | None = None
    url_handle: str | None = None


class CollectionOut(BaseModel):
    id: int
    title: str
    description: str | None
    image_url: str | None
    conditions: str | None
    channels: str | None
    collection_type: CollectionType
    seo_title: str | None
    seo_description: str | None
    meta_description: str | None = None
    url_handle: str | None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ===========================================================================
# Location
# ===========================================================================

class LocationCreate(BaseModel):
    name: str
    address: str | None = None
    suite: str | None = None
    city: str | None = None
    province: str | None = None
    country: str = "Pakistan"
    postal_code: str | None = None
    phone: str | None = None
    is_primary: bool = False
    fulfills_online_orders: bool = True
    allows_local_pickup: bool = False


class LocationUpdate(BaseModel):
    name: str | None = None
    address: str | None = None
    suite: str | None = None
    city: str | None = None
    province: str | None = None
    country: str | None = None
    postal_code: str | None = None
    phone: str | None = None
    is_active: bool | None = None
    is_primary: bool | None = None
    fulfills_online_orders: bool | None = None
    allows_local_pickup: bool | None = None


class LocationOut(BaseModel):
    id: int
    name: str
    address: str | None
    suite: str | None
    city: str | None
    province: str | None
    country: str
    postal_code: str | None
    phone: str | None
    is_active: bool
    is_primary: bool
    fulfills_online_orders: bool
    allows_local_pickup: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ===========================================================================
# Inventory Item
# ===========================================================================

class InventoryItemCreate(BaseModel):
    variant_id: int
    location_id: int
    sku: str | None = None
    bin_name: str | None = None
    on_hand: int = 0
    available: int = 0
    committed: int = 0
    unavailable: int = 0
    incoming: int = 0


class InventoryItemUpdate(BaseModel):
    sku: str | None = None
    bin_name: str | None = None
    on_hand: int | None = None
    available: int | None = None
    committed: int | None = None
    unavailable: int | None = None
    incoming: int | None = None


class InventoryItemOut(BaseModel):
    id: int
    variant_id: int
    location_id: int
    sku: str | None
    bin_name: str | None
    on_hand: int
    available: int
    committed: int
    unavailable: int
    incoming: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ===========================================================================
# Purchase Order Item
# ===========================================================================

class PurchaseOrderItemCreate(BaseModel):
    variant_id: int
    quantity: int = 0
    unit_cost: Decimal = Decimal("0")
    total_cost: Decimal = Decimal("0")


class PurchaseOrderItemUpdate(BaseModel):
    variant_id: int | None = None
    quantity: int | None = None
    unit_cost: Decimal | None = None
    total_cost: Decimal | None = None


class PurchaseOrderItemOut(BaseModel):
    id: int
    purchase_order_id: int
    variant_id: int
    quantity: int
    unit_cost: Decimal
    total_cost: Decimal
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ===========================================================================
# Purchase Order
# ===========================================================================

class PurchaseOrderCreate(BaseModel):
    supplier_name: str
    destination_location_id: int
    status: PurchaseOrderStatus = PurchaseOrderStatus.open
    reference_number: str | None = Field(None, max_length=255)
    note_to_supplier: str | None = Field(None, max_length=5000)
    payment_terms: str | None = None
    currency: str = "PKR"
    total_amount: Decimal = Decimal("0")
    expected_arrival_date: date | None = None
    items: list[PurchaseOrderItemCreate] = []


class PurchaseOrderUpdate(BaseModel):
    supplier_name: str | None = None
    destination_location_id: int | None = None
    status: PurchaseOrderStatus | None = None
    reference_number: str | None = Field(None, max_length=255)
    note_to_supplier: str | None = Field(None, max_length=5000)
    payment_terms: str | None = None
    currency: str | None = None
    total_amount: Decimal | None = None
    expected_arrival_date: date | None = None


class PurchaseOrderOut(BaseModel):
    id: int
    supplier_name: str
    destination_location_id: int
    status: PurchaseOrderStatus
    reference_number: str | None
    note_to_supplier: str | None
    payment_terms: str | None
    currency: str
    total_amount: Decimal
    expected_arrival_date: date | None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class PurchaseOrderWithItems(PurchaseOrderOut):
    items: list[PurchaseOrderItemOut] = []


# ===========================================================================
# Transfer
# ===========================================================================

class TransferCreate(BaseModel):
    origin_location_id: int
    destination_location_id: int
    status: TransferStatus = TransferStatus.pending
    reference_name: str | None = None
    note: str | None = Field(None, max_length=5000)
    expected_arrival_date: date | None = None
    linked_purchase_order_id: int | None = None
    tags: str | None = None


class TransferUpdate(BaseModel):
    origin_location_id: int | None = None
    destination_location_id: int | None = None
    status: TransferStatus | None = None
    reference_name: str | None = None
    note: str | None = Field(None, max_length=5000)
    expected_arrival_date: date | None = None
    linked_purchase_order_id: int | None = None
    tags: str | None = None


class TransferOut(BaseModel):
    id: int
    origin_location_id: int
    destination_location_id: int
    status: TransferStatus
    reference_name: str | None
    note: str | None
    expected_arrival_date: date | None
    linked_purchase_order_id: int | None
    tags: str | None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ===========================================================================
# Gift Card
# ===========================================================================

class GiftCardCreate(BaseModel):
    code: str
    initial_value: Decimal
    current_balance: Decimal
    expiry_date: date | None = None
    customer_id: int | None = None
    status: GiftCardStatus = GiftCardStatus.enabled


class GiftCardUpdate(BaseModel):
    code: str | None = None
    initial_value: Decimal | None = None
    current_balance: Decimal | None = None
    expiry_date: date | None = None
    customer_id: int | None = None
    status: GiftCardStatus | None = None


class GiftCardOut(BaseModel):
    id: int
    code: str
    initial_value: Decimal
    current_balance: Decimal
    expiry_date: date | None
    customer_id: int | None
    status: GiftCardStatus
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ===========================================================================
# Catalog Overview (dashboard)
# ===========================================================================

class CatalogOverview(BaseModel):
    total_products: int
    active_products: int
    draft_products: int
    archived_products: int
    total_variants: int
    total_collections: int
    total_locations: int
    total_inventory_items: int
    low_stock_variants: int
    total_purchase_orders: int
    open_purchase_orders: int
    total_transfers: int
    in_transit_transfers: int
    total_gift_cards: int
    active_gift_cards: int

    model_config = ConfigDict(from_attributes=True)
