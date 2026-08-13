"""Tests for app.modules.catalog.service."""

from decimal import Decimal

from sqlalchemy import select

from app.modules.catalog.model import (
    Collection,
    GiftCard,
    InventoryItem,
    Location,
    Product,
    ProductImage,
    ProductVariant,
    PurchaseOrder,
    PurchaseOrderItem,
    Transfer,
)
from app.modules.catalog.schema import (
    CollectionCreate,
    CollectionUpdate,
    GiftCardCreate,
    GiftCardUpdate,
    InventoryItemCreate,
    InventoryItemUpdate,
    LocationCreate,
    LocationUpdate,
    ProductCreate,
    ProductImageCreate,
    ProductImageUpdate,
    ProductUpdate,
    PurchaseOrderCreate,
    PurchaseOrderItemCreate,
    PurchaseOrderItemUpdate,
    PurchaseOrderUpdate,
    TransferCreate,
    TransferUpdate,
    VariantCreate,
    VariantUpdate,
)
from app.modules.catalog import service


async def _fresh(db_session, model, obj_id):
    result = await db_session.execute(
        select(model).where(model.id == obj_id).execution_options(populate_existing=True)
    )
    return result.scalar_one()


async def _mk_product(db_session, **kwargs):
    data = {"title": "Tote", **kwargs}
    return await service.create_product(db_session, ProductCreate(**data))


async def _mk_variant(db_session, product_id, **kwargs):
    data = {"title": "Default", **kwargs}
    return await service.create_variant(db_session, product_id, VariantCreate(**data))


async def _mk_location(db_session, name="Main"):
    return await service.create_location(db_session, LocationCreate(name=name))


# ===========================================================================
# Products
# ===========================================================================

async def test_create_product(db_session):
    product = await service.create_product(db_session, ProductCreate(title="Tote"))
    assert product.id is not None
    assert product.title == "Tote"
    assert product.status.value == "Draft"


async def test_create_product_with_variants_and_images(db_session):
    product = await service.create_product(
        db_session,
        ProductCreate(
            title="Tote",
            variants=[VariantCreate(title="Default", sku="TOTE-1", price=Decimal("10.5"))],
            images=[ProductImageCreate(url="https://img/1", alt_text="photo")],
        ),
    )
    assert len(product.variants) == 1
    assert product.variants[0].sku == "TOTE-1"
    assert product.variants[0].price == Decimal("10.50")
    assert len(product.images) == 1
    assert product.images[0].alt_text == "photo"


async def test_get_product(db_session):
    product = await _mk_product(db_session)
    found = await service.get_product(db_session, product.id)
    assert found is not None
    assert found.title == "Tote"


async def test_get_product_missing_returns_none(db_session):
    assert await service.get_product(db_session, 999999) is None


async def test_list_products_empty(db_session):
    assert await service.list_products(db_session) == []


async def test_list_products_filters_and_pagination(db_session):
    await _mk_product(db_session, title="Leather Belt", status="Active", vendor="Eligo")
    await _mk_product(db_session, title="Canvas Belt", status="Draft", vendor="Other Co")
    await _mk_product(db_session, title="Wallet", status="Draft", vendor="Eligo")

    found = await service.list_products(db_session, search="belt")
    assert len(found) == 2

    found = await service.list_products(db_session, vendor="eligo")
    assert len(found) == 2

    found = await service.list_products(db_session, status="Draft")
    assert len(found) == 2

    found = await service.list_products(db_session, limit=1)
    assert len(found) == 1

    found = await service.list_products(db_session, skip=3)
    assert found == []


async def test_update_product(db_session):
    product = await _mk_product(db_session)
    updated = await service.update_product(
        db_session, product.id, ProductUpdate(title="Renamed", tags="new")
    )
    assert updated is not None
    assert updated.title == "Renamed"
    assert (await _fresh(db_session, Product, product.id)).title == "Renamed"


async def test_update_product_missing_returns_none(db_session):
    assert await service.update_product(db_session, 999999, ProductUpdate(title="x")) is None


async def test_delete_product(db_session):
    product = await _mk_product(db_session)
    assert await service.delete_product(db_session, product.id) is True
    assert await service.get_product(db_session, product.id) is None


async def test_delete_product_missing_returns_false(db_session):
    assert await service.delete_product(db_session, 999999) is False


# ===========================================================================
# Variants
# ===========================================================================

async def test_create_variant(db_session):
    product = await _mk_product(db_session)
    variant = await service.create_variant(
        db_session, product.id, VariantCreate(title="Default", sku="SKU-1")
    )
    assert variant.product_id == product.id
    assert variant.sku == "SKU-1"


async def test_create_variant_missing_product_returns_none(db_session):
    assert await service.create_variant(db_session, 999999, VariantCreate(title="V")) is None


async def test_get_variant(db_session):
    product = await _mk_product(db_session)
    variant = await _mk_variant(db_session, product.id)
    assert (await service.get_variant(db_session, variant.id)).id == variant.id


async def test_update_variant(db_session):
    product = await _mk_product(db_session)
    variant = await _mk_variant(db_session, product.id)
    updated = await service.update_variant(db_session, variant.id, VariantUpdate(price=Decimal("9.99")))
    assert updated is not None
    assert updated.price == Decimal("9.99")


async def test_update_variant_missing_returns_none(db_session):
    assert await service.update_variant(db_session, 999999, VariantUpdate(price=Decimal("1"))) is None


async def test_delete_variant(db_session):
    product = await _mk_product(db_session)
    variant = await _mk_variant(db_session, product.id)
    assert await service.delete_variant(db_session, variant.id) is True
    assert await service.get_variant(db_session, variant.id) is None


async def test_delete_variant_missing_returns_false(db_session):
    assert await service.delete_variant(db_session, 999999) is False


# ===========================================================================
# Product images
# ===========================================================================

async def test_add_image(db_session):
    product = await _mk_product(db_session)
    image = await service.add_image(db_session, product.id, ProductImageCreate(url="https://img/1"))
    assert image.product_id == product.id
    assert image.url == "https://img/1"


async def test_add_image_missing_product_returns_none(db_session):
    assert await service.add_image(db_session, 999999, ProductImageCreate(url="https://img/1")) is None


async def test_update_image(db_session):
    product = await _mk_product(db_session)
    image = await service.add_image(db_session, product.id, ProductImageCreate(url="https://img/1"))
    updated = await service.update_image(db_session, image.id, ProductImageUpdate(alt_text="new"))
    assert updated is not None
    assert updated.alt_text == "new"


async def test_update_image_missing_returns_none(db_session):
    assert await service.update_image(db_session, 999999, ProductImageUpdate(alt_text="x")) is None


async def test_delete_image(db_session):
    product = await _mk_product(db_session)
    image = await service.add_image(db_session, product.id, ProductImageCreate(url="https://img/1"))
    assert await service.delete_image(db_session, image.id) is True
    assert await service.get_image(db_session, image.id) is None


async def test_delete_image_missing_returns_false(db_session):
    assert await service.delete_image(db_session, 999999) is False


# ===========================================================================
# Collections
# ===========================================================================

async def test_collection_crud(db_session):
    collection = await service.create_collection(db_session, CollectionCreate(title="Belts"))
    assert collection.id is not None
    assert collection.title == "Belts"

    found = await service.get_collection(db_session, collection.id)
    assert found is not None
    assert await service.get_collection(db_session, 999999) is None

    await service.create_collection(db_session, CollectionCreate(title="Wallets"))
    listed = await service.list_collections(db_session)
    assert len(listed) == 2
    assert len(await service.list_collections(db_session, search="wallet")) == 1

    updated = await service.update_collection(db_session, collection.id, CollectionUpdate(description="d"))
    assert updated.description == "d"
    assert await service.update_collection(db_session, 999999, CollectionUpdate(title="x")) is None

    assert await service.delete_collection(db_session, collection.id) is True
    assert await service.delete_collection(db_session, collection.id) is False
    assert await service.get_collection(db_session, collection.id) is None


# ===========================================================================
# Locations
# ===========================================================================

async def test_location_crud(db_session):
    location = await _mk_location(db_session)
    assert location.name == "Main"
    assert location.country == "Pakistan"

    assert (await service.get_location(db_session, location.id)).id == location.id
    assert await service.get_location(db_session, 999999) is None

    listed = await service.list_locations(db_session)
    assert len(listed) == 1

    updated = await service.update_location(db_session, location.id, LocationUpdate(city="Lahore"))
    assert updated.city == "Lahore"
    assert await service.update_location(db_session, 999999, LocationUpdate(city="x")) is None

    assert await service.delete_location(db_session, location.id) is True
    assert await service.delete_location(db_session, location.id) is False


# ===========================================================================
# Inventory items
# ===========================================================================

async def test_inventory_item_crud(db_session):
    product = await _mk_product(db_session)
    variant = await _mk_variant(db_session, product.id)
    location = await _mk_location(db_session)

    item = await service.create_inventory_item(
        db_session,
        InventoryItemCreate(variant_id=variant.id, location_id=location.id, on_hand=5, available=3),
    )
    assert item.on_hand == 5
    assert item.available == 3

    found = await service.get_inventory_item(db_session, item.id)
    assert found is not None
    assert await service.get_inventory_item(db_session, 999999) is None

    listed = await service.list_inventory_items(db_session)
    assert len(listed) == 1
    assert len(await service.list_inventory_items(db_session, variant_id=variant.id)) == 1
    assert len(await service.list_inventory_items(db_session, location_id=location.id)) == 1
    assert len(await service.list_inventory_items(db_session, location_id=999999)) == 0

    updated = await service.update_inventory_item(db_session, item.id, InventoryItemUpdate(on_hand=2))
    assert updated.on_hand == 2
    assert await service.update_inventory_item(db_session, 999999, InventoryItemUpdate(on_hand=1)) is None

    assert await service.delete_inventory_item(db_session, item.id) is True
    assert await service.delete_inventory_item(db_session, item.id) is False


# ===========================================================================
# Purchase orders
# ===========================================================================

async def test_purchase_order_crud(db_session):
    product = await _mk_product(db_session)
    variant = await _mk_variant(db_session, product.id, sku="PO-SKU")
    location = await _mk_location(db_session)

    po = await service.create_purchase_order(
        db_session,
        PurchaseOrderCreate(
            supplier_name="Acme",
            destination_location_id=location.id,
            items=[PurchaseOrderItemCreate(variant_id=variant.id, quantity=2)],
        ),
    )
    assert po.id is not None
    assert po.supplier_name == "Acme"
    assert po.status.value == "Open"
    assert len(po.items) == 1
    assert po.items[0].quantity == 2

    found = await service.get_purchase_order(db_session, po.id)
    assert found is not None
    assert await service.get_purchase_order(db_session, 999999) is None

    listed = await service.list_purchase_orders(db_session)
    assert len(listed) == 1
    assert len(await service.list_purchase_orders(db_session, search="acme")) == 1
    assert len(await service.list_purchase_orders(db_session, status="Open")) == 1

    updated = await service.update_purchase_order(
        db_session, po.id, PurchaseOrderUpdate(note_to_supplier="hi")
    )
    assert updated.note_to_supplier == "hi"
    assert await service.update_purchase_order(db_session, 999999, PurchaseOrderUpdate()) is None

    assert await service.delete_purchase_order(db_session, po.id) is True
    assert await service.delete_purchase_order(db_session, po.id) is False


async def test_po_item_routes_in_service(db_session):
    product = await _mk_product(db_session)
    variant = await _mk_variant(db_session, product.id)
    location = await _mk_location(db_session)
    po = await service.create_purchase_order(
        db_session,
        PurchaseOrderCreate(supplier_name="Acme", destination_location_id=location.id),
    )

    item = await service.add_po_item(
        db_session, po.id, PurchaseOrderItemCreate(variant_id=variant.id, quantity=3)
    )
    assert item.purchase_order_id == po.id
    assert item.quantity == 3
    assert await service.add_po_item(db_session, 999999, PurchaseOrderItemCreate(variant_id=1)) is None

    found = await service.get_po_item(db_session, item.id)
    assert found is not None
    assert await service.get_po_item(db_session, 999999) is None

    updated = await service.update_po_item(db_session, item.id, PurchaseOrderItemUpdate(quantity=7))
    assert updated.quantity == 7
    assert await service.update_po_item(db_session, 999999, PurchaseOrderItemUpdate(quantity=1)) is None

    assert await service.delete_po_item(db_session, item.id) is True
    assert await service.delete_po_item(db_session, item.id) is False


# ===========================================================================
# Transfers
# ===========================================================================

async def test_transfer_crud(db_session):
    loc1 = await _mk_location(db_session, "A")
    loc2 = await _mk_location(db_session, "B")

    transfer = await service.create_transfer(
        db_session, TransferCreate(origin_location_id=loc1.id, destination_location_id=loc2.id)
    )
    assert transfer.id is not None
    assert transfer.status.value == "Pending"

    found = await service.get_transfer(db_session, transfer.id)
    assert found is not None
    assert await service.get_transfer(db_session, 999999) is None

    await service.create_transfer(
        db_session, TransferCreate(origin_location_id=loc2.id, destination_location_id=loc1.id, reference_name="t2")
    )
    assert len(await service.list_transfers(db_session)) == 2
    assert len(await service.list_transfers(db_session, search="t2")) == 1
    assert len(await service.list_transfers(db_session, status="Pending")) == 2

    updated = await service.update_transfer(db_session, transfer.id, TransferUpdate(reference_name="R1"))
    assert updated.reference_name == "R1"
    assert await service.update_transfer(db_session, 999999, TransferUpdate(reference_name="x")) is None

    assert await service.delete_transfer(db_session, transfer.id) is True
    assert await service.delete_transfer(db_session, transfer.id) is False


# ===========================================================================
# Gift cards
# ===========================================================================

async def test_gift_card_crud(db_session):
    gc = await service.create_gift_card(
        db_session, GiftCardCreate(code="GC-1", initial_value=Decimal("100"), current_balance=Decimal("50"))
    )
    assert gc.code == "GC-1"
    assert gc.initial_value == Decimal("100")

    found = await service.get_gift_card(db_session, gc.id)
    assert found is not None
    assert await service.get_gift_card(db_session, 999999) is None

    await service.create_gift_card(
        db_session, GiftCardCreate(code="GC-2", initial_value=Decimal("25"), current_balance=Decimal("25"))
    )
    assert len(await service.list_gift_cards(db_session)) == 2
    assert len(await service.list_gift_cards(db_session, search="GC-1")) == 1
    assert len(await service.list_gift_cards(db_session, status="Enabled")) == 2

    updated = await service.update_gift_card(db_session, gc.id, GiftCardUpdate(current_balance=Decimal("30")))
    assert updated.current_balance == Decimal("30")
    assert await service.update_gift_card(db_session, 999999, GiftCardUpdate(current_balance=Decimal("1"))) is None

    assert await service.delete_gift_card(db_session, gc.id) is True
    assert await service.delete_gift_card(db_session, gc.id) is False


# ===========================================================================
# Catalog overview
# ===========================================================================

async def test_catalog_overview_empty(db_session):
    overview = await service.get_catalog_overview(db_session)
    assert overview.total_products == 0
    assert overview.total_variants == 0
    assert overview.total_collections == 0
    assert overview.total_locations == 0
    assert overview.total_inventory_items == 0
    assert overview.total_purchase_orders == 0
    assert overview.total_transfers == 0
    assert overview.total_gift_cards == 0


async def test_catalog_overview_counts(db_session):
    product = await _mk_product(db_session, status="Active")
    await _mk_variant(db_session, product.id)
    await _mk_variant(db_session, product.id)
    await _mk_location(db_session)
    await service.create_collection(db_session, CollectionCreate(title="C"))
    await service.create_gift_card(
        db_session, GiftCardCreate(code="GC-1", initial_value=Decimal("10"), current_balance=Decimal("10"))
    )

    overview = await service.get_catalog_overview(db_session)
    assert overview.total_products == 1
    assert overview.active_products == 1
    assert overview.total_variants == 2
    assert overview.total_collections == 1
    assert overview.total_locations == 1
    assert overview.total_gift_cards == 1
    assert overview.active_gift_cards == 1
