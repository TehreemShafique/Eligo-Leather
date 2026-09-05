"""Tests for app.modules.catalog.model."""

from decimal import Decimal

import pytest
from app.db.base import Base
from app.modules.catalog.model import (
    Collection,
    GiftCard,
    GiftCardStatus,
    InventoryItem,
    Location,
    Product,
    ProductCategory,
    ProductImage,
    ProductStatus,
    ProductVariant,
    PurchaseOrder,
    PurchaseOrderItem,
    PurchaseOrderStatus,
    Transfer,
    TransferStatus,
    WeightUnit,
)


# ---------------------------------------------------------------------------
# Products
# ---------------------------------------------------------------------------

def test_product_table_registered():
    assert "products" in Base.metadata.tables


def test_product_required_columns():
    table = Product.__table__
    assert table.c.title.nullable is False


def test_product_unique_columns():
    assert Product.__table__.c.url_handle.unique is True


def test_product_status_enum_values():
    assert [s.value for s in ProductStatus] == ["Active", "Draft", "Archived"]


def test_product_category_enum_values():
    assert ProductCategory.belts.value == "belts"
    assert ProductCategory.other.value == "other"


async def test_product_defaults(db_session):
    product = Product(title="Tote")
    db_session.add(product)
    await db_session.commit()
    await db_session.refresh(product)
    assert product.status == ProductStatus.draft
    assert product.status.value == "Draft"
    assert product.category == ProductCategory.other
    assert product.vendor == "Eligo Leather"
    assert product.theme_template == "Default product"


async def test_product_duplicate_url_handle_rejected(db_session):
    from sqlalchemy.exc import IntegrityError

    db_session.add(Product(title="A", url_handle="same"))
    await db_session.commit()
    db_session.add(Product(title="B", url_handle="same"))
    with pytest.raises(IntegrityError):
        await db_session.commit()


# ---------------------------------------------------------------------------
# Variants
# ---------------------------------------------------------------------------

def test_variant_table_registered():
    assert "product_variants" in Base.metadata.tables


def test_variant_sku_unique():
    assert ProductVariant.__table__.c.sku.unique is True


async def test_variant_defaults(db_session):
    product = Product(title="Tote")
    db_session.add(product)
    await db_session.commit()
    await db_session.refresh(product)

    variant = ProductVariant(product_id=product.id, title="Default")
    db_session.add(variant)
    await db_session.commit()
    await db_session.refresh(variant)
    assert variant.price == 0
    assert variant.inventory_quantity == 0
    assert variant.weight_unit == WeightUnit.kg
    assert variant.inventory_tracked is True
    assert variant.is_active is True
    assert variant.continue_selling_out_of_stock is False


def test_weight_unit_enum_values():
    assert [w.value for w in WeightUnit] == ["kg", "g", "lb", "oz"]


# ---------------------------------------------------------------------------
# Product images
# ---------------------------------------------------------------------------

def test_image_table_registered():
    assert "product_images" in Base.metadata.tables


async def test_image_defaults(db_session):
    product = Product(title="Tote")
    db_session.add(product)
    await db_session.commit()
    await db_session.refresh(product)

    image = ProductImage(product_id=product.id, url="https://img/1")
    db_session.add(image)
    await db_session.commit()
    await db_session.refresh(image)
    assert image.position == 0
    assert image.alt_text is None


# ---------------------------------------------------------------------------
# Collections
# ---------------------------------------------------------------------------

def test_collection_table_registered():
    assert "collections" in Base.metadata.tables


async def test_collection_defaults(db_session):
    collection = Collection(title="Belts")
    db_session.add(collection)
    await db_session.commit()
    await db_session.refresh(collection)
    assert collection.collection_type == "wallets"


# ---------------------------------------------------------------------------
# Locations
# ---------------------------------------------------------------------------

def test_location_table_registered():
    assert "locations" in Base.metadata.tables


async def test_location_defaults(db_session):
    location = Location(name="Main")
    db_session.add(location)
    await db_session.commit()
    await db_session.refresh(location)
    assert location.country == "Pakistan"
    assert location.is_active is True
    assert location.is_primary is False
    assert location.fulfills_online_orders is True
    assert location.allows_local_pickup is False


# ---------------------------------------------------------------------------
# Inventory items
# ---------------------------------------------------------------------------

def test_inventory_item_table_registered():
    assert "inventory_items" in Base.metadata.tables


async def test_inventory_item_defaults(db_session):
    product = Product(title="Tote")
    db_session.add(product)
    await db_session.commit()
    await db_session.refresh(product)
    variant = ProductVariant(product_id=product.id, title="Default")
    location = Location(name="Main")
    db_session.add_all([variant, location])
    await db_session.commit()

    item = InventoryItem(variant_id=variant.id, location_id=location.id)
    db_session.add(item)
    await db_session.commit()
    await db_session.refresh(item)
    assert item.on_hand == 0
    assert item.available == 0
    assert item.committed == 0
    assert item.unavailable == 0
    assert item.incoming == 0


# ---------------------------------------------------------------------------
# Purchase orders
# ---------------------------------------------------------------------------

def test_purchase_order_tables_registered():
    assert "purchase_orders" in Base.metadata.tables
    assert "purchase_order_items" in Base.metadata.tables


async def test_purchase_order_defaults(db_session):
    location = Location(name="Main")
    db_session.add(location)
    await db_session.commit()
    await db_session.refresh(location)

    po = PurchaseOrder(supplier_name="Acme", destination_location_id=location.id)
    db_session.add(po)
    await db_session.commit()
    await db_session.refresh(po)
    assert po.status == PurchaseOrderStatus.open
    assert po.currency == "PKR"
    assert po.total_amount == 0


def test_purchase_order_status_enum_values():
    assert [s.value for s in PurchaseOrderStatus] == ["Open", "Received", "Cancelled"]


async def test_purchase_order_item_defaults(db_session):
    location = Location(name="Main")
    db_session.add(location)
    await db_session.commit()
    await db_session.refresh(location)
    po = PurchaseOrder(supplier_name="Acme", destination_location_id=location.id)
    db_session.add(po)
    await db_session.commit()
    await db_session.refresh(po)

    item = PurchaseOrderItem(purchase_order_id=po.id, variant_id=1)
    db_session.add(item)
    await db_session.commit()
    await db_session.refresh(item)
    assert item.quantity == 0
    assert item.unit_cost == 0
    assert item.total_cost == 0


# ---------------------------------------------------------------------------
# Transfers
# ---------------------------------------------------------------------------

def test_transfer_table_registered():
    assert "transfers" in Base.metadata.tables


async def test_transfer_defaults(db_session):
    loc1 = Location(name="A")
    loc2 = Location(name="B")
    db_session.add_all([loc1, loc2])
    await db_session.commit()
    await db_session.refresh(loc1)
    await db_session.refresh(loc2)

    transfer = Transfer(origin_location_id=loc1.id, destination_location_id=loc2.id)
    db_session.add(transfer)
    await db_session.commit()
    await db_session.refresh(transfer)
    assert transfer.status == TransferStatus.pending


def test_transfer_status_enum_values():
    assert [s.value for s in TransferStatus] == ["Pending", "In Transit", "Received"]


# ---------------------------------------------------------------------------
# Gift cards
# ---------------------------------------------------------------------------

def test_gift_card_table_registered():
    assert "gift_cards" in Base.metadata.tables


async def test_gift_card_defaults(db_session):
    gc = GiftCard(code="GC-1", initial_value=Decimal("100"), current_balance=Decimal("50"))
    db_session.add(gc)
    await db_session.commit()
    await db_session.refresh(gc)
    assert gc.status == GiftCardStatus.enabled
    assert gc.initial_value == Decimal("100")
    assert gc.current_balance == Decimal("50")


def test_gift_card_status_enum_values():
    assert [s.value for s in GiftCardStatus] == ["Enabled", "Disabled", "Expired"]
