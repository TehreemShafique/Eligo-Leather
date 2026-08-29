import enum
from datetime import datetime, date
from decimal import Decimal

from sqlalchemy import (
    String, Boolean, DateTime, Numeric, Text, ForeignKey,
    Integer, Date, Index, func, Enum as SAEnum,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


# ===========================================================================
# Enums
# ===========================================================================

class ProductStatus(str, enum.Enum):
    active = "Active"
    draft = "Draft"
    archived = "Archived"


class ProductCategory(str, enum.Enum):
    belts = "belts"
    wallets = "wallets"
    bags = "bags"
    jackets = "jackets"
    shoes = "shoes"
    accessories = "accessories"
    other = "other"


class SalesChannel(str, enum.Enum):
    online_store = "Online Store"
    whatsapp = "WhatsApp"
    facebook_instagram = "Facebook & Instagram"
    agentic = "Agentic"
    pos = "POS"


class WeightUnit(str, enum.Enum):
    kg = "kg"
    g = "g"
    lb = "lb"
    oz = "oz"


class CollectionType(str, enum.Enum):
    wallets = "wallets"
    belts = "belts"
    cases = "cases"
    keychains = "keychains"


class CollectionRuleCondition(str, enum.Enum):
    tag = "tag"
    title = "title"
    type = "type"
    vendor = "vendor"
    price = "price"
    compare_at_price = "compare_at_price"
    variant_title = "variant_title"
    variant_sku = "variant_sku"
    product_vendor = "product_vendor"
    product_type = "product_type"


class PurchaseOrderStatus(str, enum.Enum):
    open = "Open"
    received = "Received"
    cancelled = "Cancelled"


class TransferStatus(str, enum.Enum):
    pending = "Pending"
    in_transit = "In Transit"
    received = "Received"


class GiftCardStatus(str, enum.Enum):
    enabled = "Enabled"
    disabled = "Disabled"
    expired = "Expired"


# ===========================================================================
# Product
# ===========================================================================

class Product(Base):
    __tablename__ = "products"
    __table_args__ = (
        Index("ix_products_status", "status"),
        Index("ix_products_category", "category"),
        Index("ix_products_vendor", "vendor"),
        Index("ix_products_url_handle", "url_handle"),
    )

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    title: Mapped[str] = mapped_column(String, nullable=False, index=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(
        SAEnum(ProductStatus, name="product_status"),
        default=ProductStatus.draft,
    )
    category: Mapped[str] = mapped_column(
        SAEnum(ProductCategory, name="product_category"),
        default=ProductCategory.other,
    )
    product_type: Mapped[str | None] = mapped_column(String, nullable=True)
    channels: Mapped[str | None] = mapped_column(Text, nullable=True)
    vendor: Mapped[str] = mapped_column(String, default="Eligo Leather")
    theme_template: Mapped[str] = mapped_column(String, default="Default product")
    seo_title: Mapped[str | None] = mapped_column(String(70), nullable=True)
    seo_description: Mapped[str | None] = mapped_column(String(160), nullable=True)
    meta_description: Mapped[str | None] = mapped_column(Text, nullable=True)
    material: Mapped[str | None] = mapped_column(String, nullable=True)
    dimensions: Mapped[str | None] = mapped_column(String, nullable=True)
    shipping_return_policy: Mapped[str | None] = mapped_column(Text, nullable=True)
    url_handle: Mapped[str | None] = mapped_column(String, nullable=True, unique=True)
    tags: Mapped[str | None] = mapped_column(String, nullable=True)
    categories: Mapped[str | None] = mapped_column(String, nullable=True)

    @property
    def category_list(self) -> list[str]:
        if not self.categories:
            return []
        return [c.strip() for c in self.categories.split(",") if c.strip()]

    variants = relationship(
        "ProductVariant", back_populates="product",
        cascade="all, delete-orphan",
    )
    images = relationship(
        "ProductImage", back_populates="product",
        cascade="all, delete-orphan",
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(),
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(),
        onupdate=func.now(),
    )


# ===========================================================================
# Product Variant
# ===========================================================================

class ProductVariant(Base):
    __tablename__ = "product_variants"
    __table_args__ = (
        Index("ix_variants_sku", "sku"),
        Index("ix_variants_product_id", "product_id"),
    )

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    product_id: Mapped[int] = mapped_column(
        ForeignKey("products.id", ondelete="CASCADE"), nullable=False,
    )
    title: Mapped[str] = mapped_column(String, nullable=False)
    color_name: Mapped[str | None] = mapped_column(String, nullable=True)
    color_hex: Mapped[str | None] = mapped_column(String, nullable=True)
    # Links the variant to a reusable metaobject entry (e.g. a Color entry
    # whose `code` was used to build the variant SKU: base SKU + "-" + code).
    # Nullable so existing variants without a metaobject link keep working.
    metaobject_entry_id: Mapped[int | None] = mapped_column(
        ForeignKey("metaobject_entries.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    is_canonical: Mapped[bool] = mapped_column(Boolean, default=False)
    image_url: Mapped[str | None] = mapped_column(String, nullable=True)
    sku: Mapped[str | None] = mapped_column(String, nullable=True, unique=True)
    price: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False, default=0)
    compare_at_price: Mapped[Decimal | None] = mapped_column(Numeric(10, 2), nullable=True)
    cost_per_item: Mapped[Decimal | None] = mapped_column(Numeric(10, 2), nullable=True)
    barcode: Mapped[str | None] = mapped_column(String, nullable=True)
    inventory_quantity: Mapped[int] = mapped_column(Integer, default=0)
    weight: Mapped[Decimal | None] = mapped_column(Numeric(8, 2), nullable=True)
    weight_unit: Mapped[str] = mapped_column(
        SAEnum(WeightUnit, name="weight_unit"),
        default=WeightUnit.kg,
    )
    inventory_tracked: Mapped[bool] = mapped_column(Boolean, default=True)
    continue_selling_out_of_stock: Mapped[bool] = mapped_column(Boolean, default=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

    product = relationship("Product", back_populates="variants")
    metaobject_entry = relationship(
        "MetaobjectEntry", foreign_keys=[metaobject_entry_id],
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(),
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(),
        onupdate=func.now(),
    )


# ===========================================================================
# Product Image
# ===========================================================================

class ProductImage(Base):
    __tablename__ = "product_images"
    __table_args__ = (
        Index("ix_product_images_product_id", "product_id"),
    )

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    product_id: Mapped[int] = mapped_column(
        ForeignKey("products.id", ondelete="CASCADE"), nullable=False,
    )
    url: Mapped[str] = mapped_column(String, nullable=False)
    alt_text: Mapped[str | None] = mapped_column(String, nullable=True)
    color_tag: Mapped[str | None] = mapped_column(String, nullable=True)
    focal_point_x: Mapped[float | None] = mapped_column(Numeric(5, 2), nullable=True)
    focal_point_y: Mapped[float | None] = mapped_column(Numeric(5, 2), nullable=True)
    position: Mapped[int] = mapped_column(Integer, default=0)

    product = relationship("Product", back_populates="images")

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(),
    )


# ===========================================================================
# Collection
# ===========================================================================

class Collection(Base):
    __tablename__ = "collections"
    __table_args__ = (
        Index("ix_collections_url_handle", "url_handle"),
    )

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    title: Mapped[str] = mapped_column(String, nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    image_url: Mapped[str | None] = mapped_column(String, nullable=True)
    conditions: Mapped[str | None] = mapped_column(Text, nullable=True)
    channels: Mapped[str | None] = mapped_column(Text, nullable=True)
    collection_type: Mapped[str] = mapped_column(
        SAEnum(CollectionType, name="collection_type"),
        default=CollectionType.wallets,
    )
    seo_title: Mapped[str | None] = mapped_column(String(70), nullable=True)
    seo_description: Mapped[str | None] = mapped_column(String(160), nullable=True)
    meta_description: Mapped[str | None] = mapped_column(Text, nullable=True)
    url_handle: Mapped[str | None] = mapped_column(String, nullable=True, unique=True)

    # Optional parent collection powering the storefront category tree
    # (top-level row = collection, child rows = its categories).
    parent_id: Mapped[int | None] = mapped_column(
        ForeignKey("collections.id", ondelete="SET NULL"), nullable=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(),
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(),
    )


# ===========================================================================
# Product <-> Collection link
# ===========================================================================

class ProductCollection(Base):
    __tablename__ = "product_collections"

    product_id: Mapped[int] = mapped_column(
        ForeignKey("products.id", ondelete="CASCADE"), primary_key=True,
    )
    collection_id: Mapped[int] = mapped_column(
        ForeignKey("collections.id", ondelete="CASCADE"), primary_key=True,
    )


# ===========================================================================
# Location
# ===========================================================================

class Location(Base):
    __tablename__ = "locations"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String, nullable=False)
    address: Mapped[str | None] = mapped_column(String, nullable=True)
    suite: Mapped[str | None] = mapped_column(String, nullable=True)
    city: Mapped[str | None] = mapped_column(String, nullable=True)
    province: Mapped[str | None] = mapped_column(String, nullable=True)
    country: Mapped[str] = mapped_column(String, default="Pakistan")
    postal_code: Mapped[str | None] = mapped_column(String, nullable=True)
    phone: Mapped[str | None] = mapped_column(String, nullable=True)

    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    is_primary: Mapped[bool] = mapped_column(Boolean, default=False)
    fulfills_online_orders: Mapped[bool] = mapped_column(Boolean, default=True)
    allows_local_pickup: Mapped[bool] = mapped_column(Boolean, default=False)

    inventory_items = relationship(
        "InventoryItem", back_populates="location",
        cascade="all, delete-orphan",
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(),
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(),
        onupdate=func.now(),
    )


# ===========================================================================
# Inventory Item
# ===========================================================================

class InventoryItem(Base):
    __tablename__ = "inventory_items"
    __table_args__ = (
        Index("ix_inventory_items_variant_id", "variant_id"),
        Index("ix_inventory_items_location_id", "location_id"),
    )

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    variant_id: Mapped[int] = mapped_column(
        ForeignKey("product_variants.id", ondelete="CASCADE"),
    )
    location_id: Mapped[int] = mapped_column(
        ForeignKey("locations.id", ondelete="CASCADE"),
    )
    sku: Mapped[str | None] = mapped_column(String, nullable=True)
    bin_name: Mapped[str | None] = mapped_column(String, nullable=True)
    on_hand: Mapped[int] = mapped_column(Integer, default=0)
    available: Mapped[int] = mapped_column(Integer, default=0)
    committed: Mapped[int] = mapped_column(Integer, default=0)
    unavailable: Mapped[int] = mapped_column(Integer, default=0)
    incoming: Mapped[int] = mapped_column(Integer, default=0)

    variant = relationship("ProductVariant")
    location = relationship("Location", back_populates="inventory_items")

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(),
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(),
        onupdate=func.now(),
    )


# ===========================================================================
# Purchase Order
# ===========================================================================

class PurchaseOrder(Base):
    __tablename__ = "purchase_orders"
    __table_args__ = (
        Index("ix_purchase_orders_status", "status"),
    )

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    supplier_name: Mapped[str] = mapped_column(String, nullable=False)
    destination_location_id: Mapped[int] = mapped_column(
        ForeignKey("locations.id"),
    )
    status: Mapped[str] = mapped_column(
        SAEnum(PurchaseOrderStatus, name="purchase_order_status"),
        default=PurchaseOrderStatus.open,
    )
    reference_number: Mapped[str | None] = mapped_column(String(255), nullable=True)
    note_to_supplier: Mapped[str | None] = mapped_column(Text, nullable=True)
    payment_terms: Mapped[str | None] = mapped_column(String, nullable=True)
    currency: Mapped[str] = mapped_column(String(3), default="PKR")
    total_amount: Mapped[Decimal] = mapped_column(Numeric(12, 2), default=0)
    expected_arrival_date: Mapped[date | None] = mapped_column(Date, nullable=True)

    items = relationship(
        "PurchaseOrderItem", back_populates="purchase_order",
        cascade="all, delete-orphan",
    )
    destination_location = relationship("Location")

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(),
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(),
        onupdate=func.now(),
    )


class PurchaseOrderItem(Base):
    __tablename__ = "purchase_order_items"
    __table_args__ = (
        Index("ix_po_items_po_id", "purchase_order_id"),
    )

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    purchase_order_id: Mapped[int] = mapped_column(
        ForeignKey("purchase_orders.id", ondelete="CASCADE"),
    )
    variant_id: Mapped[int] = mapped_column(
        ForeignKey("product_variants.id"),
    )
    quantity: Mapped[int] = mapped_column(Integer, default=0)
    unit_cost: Mapped[Decimal] = mapped_column(Numeric(10, 2), default=0)
    total_cost: Mapped[Decimal] = mapped_column(Numeric(12, 2), default=0)

    purchase_order = relationship("PurchaseOrder", back_populates="items")
    variant = relationship("ProductVariant")

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(),
    )


# ===========================================================================
# Transfer
# ===========================================================================

class Transfer(Base):
    __tablename__ = "transfers"
    __table_args__ = (
        Index("ix_transfers_status", "status"),
    )

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    origin_location_id: Mapped[int] = mapped_column(
        ForeignKey("locations.id"),
    )
    destination_location_id: Mapped[int] = mapped_column(
        ForeignKey("locations.id"),
    )
    status: Mapped[str] = mapped_column(
        SAEnum(TransferStatus, name="transfer_status"),
        default=TransferStatus.pending,
    )
    reference_name: Mapped[str | None] = mapped_column(String, nullable=True)
    note: Mapped[str | None] = mapped_column(Text, nullable=True)
    expected_arrival_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    linked_purchase_order_id: Mapped[int | None] = mapped_column(
        ForeignKey("purchase_orders.id"), nullable=True,
    )
    tags: Mapped[str | None] = mapped_column(Text, nullable=True)

    origin_location = relationship("Location", foreign_keys=[origin_location_id])
    destination_location = relationship("Location", foreign_keys=[destination_location_id])
    linked_purchase_order = relationship("PurchaseOrder")

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(),
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(),
        onupdate=func.now(),
    )


# ===========================================================================
# Gift Card
# ===========================================================================

class GiftCard(Base):
    __tablename__ = "gift_cards"
    __table_args__ = (
        Index("ix_gift_cards_code", "code"),
        Index("ix_gift_cards_status", "status"),
    )

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    code: Mapped[str] = mapped_column(String, nullable=False, unique=True)
    initial_value: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    current_balance: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    expiry_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    customer_id: Mapped[int | None] = mapped_column(Integer, nullable=True)
    status: Mapped[str] = mapped_column(
        SAEnum(GiftCardStatus, name="gift_card_status"),
        default=GiftCardStatus.enabled,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(),
    )


# ===========================================================================
# Gift Card Product (product listing for gift cards)
# ===========================================================================

class GiftCardProduct(Base):
    __tablename__ = "gift_card_products"
    __table_args__ = (
        Index("ix_gift_card_products_url_handle", "url_handle"),
    )

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    code: Mapped[str | None] = mapped_column(String, nullable=True)
    title: Mapped[str] = mapped_column(String, nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(
        SAEnum(ProductStatus, name="gift_card_product_status"),
        default=ProductStatus.draft,
    )
    base_price: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False, default=0)
    compare_at_price: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False, default=0)
    seo_title: Mapped[str | None] = mapped_column(String(70), nullable=True)
    seo_description: Mapped[str | None] = mapped_column(String(160), nullable=True)
    meta_description: Mapped[str | None] = mapped_column(Text, nullable=True)
    url_handle: Mapped[str | None] = mapped_column(String, nullable=True, unique=True)
    product_ids: Mapped[str | None] = mapped_column(Text, nullable=True)

    images = relationship(
        "GiftCardProductImage", back_populates="gift_card_product",
        cascade="all, delete-orphan",
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(),
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(),
        onupdate=func.now(),
    )


class GiftCardProductImage(Base):
    __tablename__ = "gift_card_product_images"
    __table_args__ = (
        Index("ix_gc_product_images_gc_product_id", "gift_card_product_id"),
    )

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    gift_card_product_id: Mapped[int] = mapped_column(
        ForeignKey("gift_card_products.id", ondelete="CASCADE"), nullable=False,
    )
    url: Mapped[str] = mapped_column(String, nullable=False)
    alt_text: Mapped[str | None] = mapped_column(String, nullable=True)
    position: Mapped[int] = mapped_column(Integer, default=0)

    gift_card_product = relationship("GiftCardProduct", back_populates="images")

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(),
    )
