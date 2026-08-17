from datetime import datetime

from sqlalchemy import select, func, or_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.modules.catalog.model import (
    Product, ProductVariant, ProductImage, Collection,
    Location, InventoryItem,
    PurchaseOrder, PurchaseOrderItem,
    Transfer, GiftCard,
)
from app.modules.catalog.schema import (
    ProductCreate, ProductUpdate, ProductListOut,
    VariantCreate, VariantUpdate,
    ProductImageCreate, ProductImageUpdate,
    CollectionCreate, CollectionUpdate,
    LocationCreate, LocationUpdate,
    InventoryItemCreate, InventoryItemUpdate,
    PurchaseOrderCreate, PurchaseOrderUpdate,
    PurchaseOrderItemCreate, PurchaseOrderItemUpdate,
    TransferCreate, TransferUpdate,
    GiftCardCreate, GiftCardUpdate,
    CatalogOverview,
)


# ===========================================================================
# Product – CRUD
# ===========================================================================

async def create_product(db: AsyncSession, data: ProductCreate) -> Product:
    categories_str = data.categories or (",".join(data.category_list) if data.category_list else None)
    product = Product(
        title=data.title,
        description=data.description,
        status=data.status,
        category=data.category,
        product_type=data.product_type,
        channels=data.channels,
        vendor=data.vendor,
        theme_template=data.theme_template,
        seo_title=data.seo_title,
        seo_description=data.seo_description,
        meta_description=data.meta_description,
        material=data.material,
        dimensions=data.dimensions,
        shipping_return_policy=data.shipping_return_policy,
        url_handle=data.url_handle,
        tags=data.tags,
        categories=categories_str,
        variants=[ProductVariant(**v.model_dump()) for v in data.variants],
        images=[ProductImage(**img.model_dump()) for img in data.images],
    )
    db.add(product)
    await db.commit()
    await db.refresh(product, attribute_names=["variants", "images"])
    return product


async def get_product(db: AsyncSession, product_id: int) -> Product | None:
    result = await db.execute(
        select(Product)
        .options(selectinload(Product.variants), selectinload(Product.images))
        .where(Product.id == product_id),
    )
    return result.scalar_one_or_none()


def to_product_list_out(product: Product) -> ProductListOut:
    active_variants = [v for v in product.variants if v.is_active] or product.variants
    prices = [v.price for v in active_variants]
    compare_prices = [v.compare_at_price for v in active_variants if v.compare_at_price is not None]
    images = sorted(product.images, key=lambda img: img.position)
    cat_list = [c.strip() for c in product.categories.split(",") if c.strip()] if product.categories else []
    return ProductListOut(
        id=product.id,
        title=product.title,
        status=product.status,
        category=product.category,
        product_type=product.product_type,
        vendor=product.vendor,
        tags=product.tags,
        categories=product.categories,
        category_list=cat_list,
        url_handle=product.url_handle,
        price=min(prices) if prices else None,
        compare_at_price=min(compare_prices) if compare_prices else None,
        image_url=images[0].url if images else None,
        created_at=product.created_at,
        updated_at=product.updated_at,
        variants=product.variants,
        images=images,
    )


async def list_products(
    db: AsyncSession,
    status: str | None = None,
    category: str | None = None,
    vendor: str | None = None,
    search: str | None = None,
    skip: int = 0,
    limit: int = 50,
) -> list[ProductListOut]:
    query = (
        select(Product)
        .options(selectinload(Product.variants), selectinload(Product.images))
    )
    if status:
        query = query.where(Product.status == status)
    if category:
        query = query.where(Product.category == category)
    if vendor:
        query = query.where(Product.vendor.ilike(f"%{vendor}%"))
    if search:
        query = query.where(
            or_(
                Product.title.ilike(f"%{search}%"),
                Product.description.ilike(f"%{search}%"),
                Product.tags.ilike(f"%{search}%"),
                Product.url_handle.ilike(f"%{search}%"),
            ),
        )
    query = query.order_by(Product.created_at.desc()).offset(skip).limit(limit)
    result = await db.execute(query)
    products = list(result.scalars().all())
    return [to_product_list_out(p) for p in products]


async def update_product(db: AsyncSession, product_id: int, data: ProductUpdate) -> Product | None:
    product = await get_product(db, product_id)
    if not product:
        return None
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(product, field, value)
    await db.commit()
    await db.refresh(product, attribute_names=["variants", "images"])
    return product


async def delete_product(db: AsyncSession, product_id: int) -> bool:
    product = await get_product(db, product_id)
    if not product:
        return False
    await db.delete(product)
    await db.commit()
    return True


# ===========================================================================
# Variant – CRUD
# ===========================================================================

async def create_variant(db: AsyncSession, product_id: int, data: VariantCreate) -> ProductVariant | None:
    product = await db.get(Product, product_id)
    if not product:
        return None
    variant = ProductVariant(product_id=product_id, **data.model_dump())
    db.add(variant)
    await db.commit()
    await db.refresh(variant)
    return variant


async def get_variant(db: AsyncSession, variant_id: int) -> ProductVariant | None:
    return await db.get(ProductVariant, variant_id)


async def update_variant(db: AsyncSession, variant_id: int, data: VariantUpdate) -> ProductVariant | None:
    variant = await get_variant(db, variant_id)
    if not variant:
        return None
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(variant, field, value)
    await db.commit()
    await db.refresh(variant)
    return variant


async def delete_variant(db: AsyncSession, variant_id: int) -> bool:
    variant = await get_variant(db, variant_id)
    if not variant:
        return False
    await db.delete(variant)
    await db.commit()
    return True


# ===========================================================================
# Product Image – CRUD
# ===========================================================================

async def add_image(db: AsyncSession, product_id: int, data: ProductImageCreate) -> ProductImage | None:
    product = await db.get(Product, product_id)
    if not product:
        return None
    image = ProductImage(product_id=product_id, **data.model_dump())
    db.add(image)
    await db.commit()
    await db.refresh(image)
    return image


async def get_image(db: AsyncSession, image_id: int) -> ProductImage | None:
    return await db.get(ProductImage, image_id)


async def update_image(db: AsyncSession, image_id: int, data: ProductImageUpdate) -> ProductImage | None:
    image = await get_image(db, image_id)
    if not image:
        return None
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(image, field, value)
    await db.commit()
    await db.refresh(image)
    return image


async def delete_image(db: AsyncSession, image_id: int) -> bool:
    image = await get_image(db, image_id)
    if not image:
        return False
    await db.delete(image)
    await db.commit()
    return True


# ===========================================================================
# Collection – CRUD
# ===========================================================================

async def create_collection(db: AsyncSession, data: CollectionCreate) -> Collection:
    obj = Collection(**data.model_dump())
    db.add(obj)
    await db.commit()
    await db.refresh(obj)
    return obj


async def get_collection(db: AsyncSession, col_id: int) -> Collection | None:
    return await db.get(Collection, col_id)


async def list_collections(
    db: AsyncSession,
    search: str | None = None,
    skip: int = 0,
    limit: int = 50,
) -> list[Collection]:
    query = select(Collection)
    if search:
        query = query.where(
            or_(
                Collection.title.ilike(f"%{search}%"),
                Collection.url_handle.ilike(f"%{search}%"),
            ),
        )
    query = query.order_by(Collection.created_at.desc()).offset(skip).limit(limit)
    result = await db.execute(query)
    return list(result.scalars().all())


async def update_collection(db: AsyncSession, col_id: int, data: CollectionUpdate) -> Collection | None:
    obj = await get_collection(db, col_id)
    if not obj:
        return None
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(obj, field, value)
    await db.commit()
    await db.refresh(obj)
    return obj


async def delete_collection(db: AsyncSession, col_id: int) -> bool:
    obj = await get_collection(db, col_id)
    if not obj:
        return False
    await db.delete(obj)
    await db.commit()
    return True


# ===========================================================================
# Location – CRUD
# ===========================================================================

async def create_location(db: AsyncSession, data: LocationCreate) -> Location:
    obj = Location(**data.model_dump())
    db.add(obj)
    await db.commit()
    await db.refresh(obj)
    return obj


async def get_location(db: AsyncSession, loc_id: int) -> Location | None:
    result = await db.execute(
        select(Location)
        .options(selectinload(Location.inventory_items))
        .where(Location.id == loc_id),
    )
    return result.scalar_one_or_none()


async def list_locations(db: AsyncSession) -> list[Location]:
    result = await db.execute(select(Location).order_by(Location.name))
    return list(result.scalars().all())


async def update_location(db: AsyncSession, loc_id: int, data: LocationUpdate) -> Location | None:
    obj = await db.get(Location, loc_id)
    if not obj:
        return None
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(obj, field, value)
    await db.commit()
    await db.refresh(obj)
    return obj


async def delete_location(db: AsyncSession, loc_id: int) -> bool:
    obj = await db.get(Location, loc_id)
    if not obj:
        return False
    await db.delete(obj)
    await db.commit()
    return True


# ===========================================================================
# Inventory Item – CRUD
# ===========================================================================

async def create_inventory_item(db: AsyncSession, data: InventoryItemCreate) -> InventoryItem:
    obj = InventoryItem(**data.model_dump())
    db.add(obj)
    await db.commit()
    await db.refresh(obj)
    return obj


async def get_inventory_item(db: AsyncSession, item_id: int) -> InventoryItem | None:
    return await db.get(InventoryItem, item_id)


async def list_inventory_items(
    db: AsyncSession,
    variant_id: int | None = None,
    location_id: int | None = None,
    skip: int = 0,
    limit: int = 50,
) -> list[InventoryItem]:
    query = select(InventoryItem)
    if variant_id:
        query = query.where(InventoryItem.variant_id == variant_id)
    if location_id:
        query = query.where(InventoryItem.location_id == location_id)
    query = query.order_by(InventoryItem.created_at.desc()).offset(skip).limit(limit)
    result = await db.execute(query)
    return list(result.scalars().all())


async def update_inventory_item(db: AsyncSession, item_id: int, data: InventoryItemUpdate) -> InventoryItem | None:
    obj = await get_inventory_item(db, item_id)
    if not obj:
        return None
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(obj, field, value)
    await db.commit()
    await db.refresh(obj)
    return obj


async def delete_inventory_item(db: AsyncSession, item_id: int) -> bool:
    obj = await get_inventory_item(db, item_id)
    if not obj:
        return False
    await db.delete(obj)
    await db.commit()
    return True


# ===========================================================================
# Purchase Order – CRUD
# ===========================================================================

async def create_purchase_order(db: AsyncSession, data: PurchaseOrderCreate) -> PurchaseOrder:
    items_data = data.items
    po = PurchaseOrder(
        supplier_name=data.supplier_name,
        destination_location_id=data.destination_location_id,
        status=data.status,
        reference_number=data.reference_number,
        note_to_supplier=data.note_to_supplier,
        payment_terms=data.payment_terms,
        currency=data.currency,
        total_amount=data.total_amount,
        expected_arrival_date=data.expected_arrival_date,
    )
    if items_data:
        po.items = [
            PurchaseOrderItem(**item.model_dump()) for item in items_data
        ]
    db.add(po)
    await db.commit()
    await db.refresh(po, attribute_names=["items"])
    return po


async def get_purchase_order(db: AsyncSession, po_id: int) -> PurchaseOrder | None:
    result = await db.execute(
        select(PurchaseOrder)
        .options(selectinload(PurchaseOrder.items))
        .where(PurchaseOrder.id == po_id),
    )
    return result.scalar_one_or_none()


async def list_purchase_orders(
    db: AsyncSession,
    search: str | None = None,
    status: str | None = None,
    skip: int = 0,
    limit: int = 50,
) -> list[PurchaseOrder]:
    query = select(PurchaseOrder)
    if search:
        query = query.where(
            or_(
                PurchaseOrder.supplier_name.ilike(f"%{search}%"),
                PurchaseOrder.reference_number.ilike(f"%{search}%"),
            ),
        )
    if status:
        query = query.where(PurchaseOrder.status == status)
    query = query.order_by(PurchaseOrder.created_at.desc()).offset(skip).limit(limit)
    result = await db.execute(query)
    return list(result.scalars().all())


async def update_purchase_order(db: AsyncSession, po_id: int, data: PurchaseOrderUpdate) -> PurchaseOrder | None:
    obj = await get_purchase_order(db, po_id)
    if not obj:
        return None
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(obj, field, value)
    await db.commit()
    await db.refresh(obj)
    return obj


async def delete_purchase_order(db: AsyncSession, po_id: int) -> bool:
    obj = await get_purchase_order(db, po_id)
    if not obj:
        return False
    await db.delete(obj)
    await db.commit()
    return True


# ===========================================================================
# Purchase Order Item – CRUD
# ===========================================================================

async def add_po_item(db: AsyncSession, po_id: int, data: PurchaseOrderItemCreate) -> PurchaseOrderItem | None:
    po = await db.get(PurchaseOrder, po_id)
    if not po:
        return None
    item = PurchaseOrderItem(purchase_order_id=po_id, **data.model_dump())
    db.add(item)
    await db.commit()
    await db.refresh(item)
    return item


async def get_po_item(db: AsyncSession, item_id: int) -> PurchaseOrderItem | None:
    return await db.get(PurchaseOrderItem, item_id)


async def update_po_item(db: AsyncSession, item_id: int, data: PurchaseOrderItemUpdate) -> PurchaseOrderItem | None:
    obj = await get_po_item(db, item_id)
    if not obj:
        return None
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(obj, field, value)
    await db.commit()
    await db.refresh(obj)
    return obj


async def delete_po_item(db: AsyncSession, item_id: int) -> bool:
    obj = await get_po_item(db, item_id)
    if not obj:
        return False
    await db.delete(obj)
    await db.commit()
    return True


# ===========================================================================
# Transfer – CRUD
# ===========================================================================

async def create_transfer(db: AsyncSession, data: TransferCreate) -> Transfer:
    obj = Transfer(**data.model_dump())
    db.add(obj)
    await db.commit()
    await db.refresh(obj)
    return obj


async def get_transfer(db: AsyncSession, transfer_id: int) -> Transfer | None:
    return await db.get(Transfer, transfer_id)


async def list_transfers(
    db: AsyncSession,
    search: str | None = None,
    status: str | None = None,
    skip: int = 0,
    limit: int = 50,
) -> list[Transfer]:
    query = select(Transfer)
    if search:
        query = query.where(Transfer.reference_name.ilike(f"%{search}%"))
    if status:
        query = query.where(Transfer.status == status)
    query = query.order_by(Transfer.created_at.desc()).offset(skip).limit(limit)
    result = await db.execute(query)
    return list(result.scalars().all())


async def update_transfer(db: AsyncSession, transfer_id: int, data: TransferUpdate) -> Transfer | None:
    obj = await get_transfer(db, transfer_id)
    if not obj:
        return None
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(obj, field, value)
    await db.commit()
    await db.refresh(obj)
    return obj


async def delete_transfer(db: AsyncSession, transfer_id: int) -> bool:
    obj = await get_transfer(db, transfer_id)
    if not obj:
        return False
    await db.delete(obj)
    await db.commit()
    return True


# ===========================================================================
# Gift Card – CRUD
# ===========================================================================

async def create_gift_card(db: AsyncSession, data: GiftCardCreate) -> GiftCard:
    obj = GiftCard(**data.model_dump())
    db.add(obj)
    await db.commit()
    await db.refresh(obj)
    return obj


async def get_gift_card(db: AsyncSession, gc_id: int) -> GiftCard | None:
    return await db.get(GiftCard, gc_id)


async def list_gift_cards(
    db: AsyncSession,
    search: str | None = None,
    status: str | None = None,
    skip: int = 0,
    limit: int = 50,
) -> list[GiftCard]:
    query = select(GiftCard)
    if search:
        query = query.where(GiftCard.code.ilike(f"%{search}%"))
    if status:
        query = query.where(GiftCard.status == status)
    query = query.order_by(GiftCard.created_at.desc()).offset(skip).limit(limit)
    result = await db.execute(query)
    return list(result.scalars().all())


async def update_gift_card(db: AsyncSession, gc_id: int, data: GiftCardUpdate) -> GiftCard | None:
    obj = await get_gift_card(db, gc_id)
    if not obj:
        return None
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(obj, field, value)
    await db.commit()
    await db.refresh(obj)
    return obj


async def delete_gift_card(db: AsyncSession, gc_id: int) -> bool:
    obj = await get_gift_card(db, gc_id)
    if not obj:
        return False
    await db.delete(obj)
    await db.commit()
    return True


# ===========================================================================
# Catalog Overview – Dashboard aggregations
# ===========================================================================

async def get_catalog_overview(db: AsyncSession) -> CatalogOverview:
    # Products breakdown
    prod_counts = await db.execute(
        select(
            func.coalesce(func.count(Product.id), 0).label("total"),
            func.coalesce(func.count(Product.id).filter(Product.status == "Active"), 0).label("active"),
            func.coalesce(func.count(Product.id).filter(Product.status == "Draft"), 0).label("draft"),
            func.coalesce(func.count(Product.id).filter(Product.status == "Archived"), 0).label("archived"),
        ),
    )
    p = prod_counts.one()

    # Variants
    var_result = await db.execute(select(func.coalesce(func.count(ProductVariant.id), 0)))
    total_variants = var_result.scalar() or 0

    low_stock_result = await db.execute(
        select(func.coalesce(func.count(ProductVariant.id), 0)).where(
            ProductVariant.inventory_quantity < 5,
        ),
    )
    low_stock = low_stock_result.scalar() or 0

    # Collections
    col_result = await db.execute(select(func.coalesce(func.count(Collection.id), 0)))
    total_collections = col_result.scalar() or 0

    # Locations
    loc_result = await db.execute(select(func.coalesce(func.count(Location.id), 0)))
    total_locations = loc_result.scalar() or 0

    # Inventory items
    inv_result = await db.execute(select(func.coalesce(func.count(InventoryItem.id), 0)))
    total_inventory = inv_result.scalar() or 0

    # Purchase orders
    po_counts = await db.execute(
        select(
            func.coalesce(func.count(PurchaseOrder.id), 0).label("total"),
            func.coalesce(func.count(PurchaseOrder.id).filter(PurchaseOrder.status == "Open"), 0).label("open"),
        ),
    )
    po = po_counts.one()

    # Transfers
    tr_counts = await db.execute(
        select(
            func.coalesce(func.count(Transfer.id), 0).label("total"),
            func.coalesce(func.count(Transfer.id).filter(Transfer.status == "In Transit"), 0).label("in_transit"),
        ),
    )
    tr = tr_counts.one()

    # Gift cards
    gc_counts = await db.execute(
        select(
            func.coalesce(func.count(GiftCard.id), 0).label("total"),
            func.coalesce(func.count(GiftCard.id).filter(GiftCard.status == "Enabled"), 0).label("active"),
        ),
    )
    gc = gc_counts.one()

    return CatalogOverview(
        total_products=int(p.total),
        active_products=int(p.active),
        draft_products=int(p.draft),
        archived_products=int(p.archived),
        total_variants=int(total_variants),
        total_collections=int(total_collections),
        total_locations=int(total_locations),
        total_inventory_items=int(total_inventory),
        low_stock_variants=int(low_stock),
        total_purchase_orders=int(po.total),
        open_purchase_orders=int(po.open),
        total_transfers=int(tr.total),
        in_transit_transfers=int(tr.in_transit),
        total_gift_cards=int(gc.total),
        active_gift_cards=int(gc.active),
    )
