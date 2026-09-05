from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.core.dependencies import get_current_user
from app.modules.catalog import service
from app.modules.catalog.schema import (
    ProductCreate, ProductUpdate, ProductOut, ProductListOut,
    VariantCreate, VariantUpdate, VariantOut,
    ProductImageCreate, ProductImageUpdate, ProductImageOut,
    CollectionCreate, CollectionUpdate, CollectionOut, CollectionType,
    LocationCreate, LocationUpdate, LocationOut,
    InventoryItemCreate, InventoryItemUpdate, InventoryItemOut,
    PurchaseOrderCreate, PurchaseOrderUpdate, PurchaseOrderOut, PurchaseOrderWithItems,
    PurchaseOrderItemCreate, PurchaseOrderItemUpdate, PurchaseOrderItemOut,
    TransferCreate, TransferUpdate, TransferOut,
    GiftCardCreate, GiftCardUpdate, GiftCardOut,
    GiftCardProductCreate, GiftCardProductUpdate, GiftCardProductOut, GiftCardProductListOut,
    CatalogOverview,
)

from app.core.cache import cache_response, invalidate_cache
from app.modules.catalog.revalidation import purge_catalog_cache

# ===========================================================================
# Catalog Overview
# ===========================================================================

catalog_overview_router = APIRouter(
    prefix="/catalog",
    tags=["Catalog"],
    dependencies=[Depends(get_current_user)],
)


@catalog_overview_router.get("/overview", response_model=CatalogOverview)
@cache_response(ttl=60, prefix="catalog")
async def get_catalog_overview(db: AsyncSession = Depends(get_db)):
    return await service.get_catalog_overview(db)


# ===========================================================================
# Products
# ===========================================================================

product_router = APIRouter(
    prefix="/catalog/products",
    tags=["Products"],
)


@product_router.post("/", response_model=ProductOut, status_code=status.HTTP_201_CREATED)
async def create_product(data: ProductCreate, db: AsyncSession = Depends(get_db)):
    res = await service.create_product(db, data)
    invalidate_cache("catalog")
    await purge_catalog_cache()
    return res


@product_router.get("/", response_model=list[ProductListOut])
@cache_response(ttl=60, prefix="catalog")
async def list_products(
    status_filter: str | None = Query(None, alias="status"),
    category: str | None = Query(None),
    vendor: str | None = Query(None),
    search: str | None = Query(None),
    collection: str | None = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    db: AsyncSession = Depends(get_db),
):
    return await service.list_products(
        db, status=status_filter, category=category,
        vendor=vendor, search=search, collection=collection,
        skip=skip, limit=limit,
    )


@product_router.get("/{product_id}", response_model=ProductOut)
async def get_product(product_id: int, db: AsyncSession = Depends(get_db)):
    product = await service.get_product(db, product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product


@product_router.patch("/{product_id}", response_model=ProductOut)
async def update_product(product_id: int, data: ProductUpdate, db: AsyncSession = Depends(get_db)):
    product = await service.update_product(db, product_id, data)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    invalidate_cache("catalog")
    await purge_catalog_cache()
    return product


@product_router.delete("/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_product(product_id: int, db: AsyncSession = Depends(get_db)):
    deleted = await service.delete_product(db, product_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Product not found")
    invalidate_cache("catalog")
    await purge_catalog_cache()


# --- Variants ---

@product_router.post("/{product_id}/variants", response_model=VariantOut, status_code=status.HTTP_201_CREATED, dependencies=[Depends(get_current_user)])
async def create_variant(product_id: int, data: VariantCreate, db: AsyncSession = Depends(get_db)):
    variant = await service.create_variant(db, product_id, data)
    if not variant:
        raise HTTPException(status_code=404, detail="Product not found")
    return variant


@product_router.patch("/variants/{variant_id}", response_model=VariantOut, dependencies=[Depends(get_current_user)])
async def update_variant(variant_id: int, data: VariantUpdate, db: AsyncSession = Depends(get_db)):
    variant = await service.update_variant(db, variant_id, data)
    if not variant:
        raise HTTPException(status_code=404, detail="Variant not found")
    return variant


@product_router.delete("/variants/{variant_id}", status_code=status.HTTP_204_NO_CONTENT, dependencies=[Depends(get_current_user)])
async def delete_variant(variant_id: int, db: AsyncSession = Depends(get_db)):
    deleted = await service.delete_variant(db, variant_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Variant not found")


# --- Product Images ---

@product_router.post("/{product_id}/images", response_model=ProductImageOut, status_code=status.HTTP_201_CREATED, dependencies=[Depends(get_current_user)])
async def add_image(product_id: int, data: ProductImageCreate, db: AsyncSession = Depends(get_db)):
    image = await service.add_image(db, product_id, data)
    if not image:
        raise HTTPException(status_code=404, detail="Product not found")
    return image


@product_router.patch("/images/{image_id}", response_model=ProductImageOut, dependencies=[Depends(get_current_user)])
async def update_image(image_id: int, data: ProductImageUpdate, db: AsyncSession = Depends(get_db)):
    image = await service.update_image(db, image_id, data)
    if not image:
        raise HTTPException(status_code=404, detail="Image not found")
    return image


@product_router.delete("/images/{image_id}", status_code=status.HTTP_204_NO_CONTENT, dependencies=[Depends(get_current_user)])
async def delete_image(image_id: int, db: AsyncSession = Depends(get_db)):
    deleted = await service.delete_image(db, image_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Image not found")


# ===========================================================================
# Collections
# ===========================================================================

collection_router = APIRouter(
    prefix="/catalog/collections",
    tags=["Collections"],
)


@collection_router.post("/", response_model=CollectionOut, status_code=status.HTTP_201_CREATED)
async def create_collection(data: CollectionCreate, db: AsyncSession = Depends(get_db)):
    return await service.create_collection(db, data)


@collection_router.get("/", response_model=list[CollectionOut])
async def list_collections(
    search: str | None = Query(None),
    collection_type: str | None = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    db: AsyncSession = Depends(get_db),
):
    return await service.list_collections(
        db, search=search, collection_type=collection_type,
        skip=skip, limit=limit,
    )


@collection_router.get("/{col_id}", response_model=CollectionOut)
async def get_collection(col_id: int, db: AsyncSession = Depends(get_db)):
    obj = await service.get_collection(db, col_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Collection not found")
    return obj


@collection_router.patch("/{col_id}", response_model=CollectionOut)
async def update_collection(col_id: int, data: CollectionUpdate, db: AsyncSession = Depends(get_db)):
    obj = await service.update_collection(db, col_id, data)
    if not obj:
        raise HTTPException(status_code=404, detail="Collection not found")
    return obj


@collection_router.delete("/{col_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_collection(col_id: int, db: AsyncSession = Depends(get_db)):
    deleted = await service.delete_collection(db, col_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Collection not found")


# ===========================================================================
# Locations
# ===========================================================================

location_router = APIRouter(
    prefix="/catalog/locations",
    tags=["Locations"],
    dependencies=[Depends(get_current_user)],
)


@location_router.post("/", response_model=LocationOut, status_code=status.HTTP_201_CREATED)
async def create_location(data: LocationCreate, db: AsyncSession = Depends(get_db)):
    return await service.create_location(db, data)


@location_router.get("/", response_model=list[LocationOut])
async def list_locations(db: AsyncSession = Depends(get_db)):
    return await service.list_locations(db)


@location_router.get("/{loc_id}", response_model=LocationOut)
async def get_location(loc_id: int, db: AsyncSession = Depends(get_db)):
    obj = await service.get_location(db, loc_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Location not found")
    return obj


@location_router.patch("/{loc_id}", response_model=LocationOut)
async def update_location(loc_id: int, data: LocationUpdate, db: AsyncSession = Depends(get_db)):
    obj = await service.update_location(db, loc_id, data)
    if not obj:
        raise HTTPException(status_code=404, detail="Location not found")
    return obj


@location_router.delete("/{loc_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_location(loc_id: int, db: AsyncSession = Depends(get_db)):
    deleted = await service.delete_location(db, loc_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Location not found")


# ===========================================================================
# Inventory Items
# ===========================================================================

inventory_router = APIRouter(
    prefix="/catalog/inventory",
    tags=["Inventory"],
    dependencies=[Depends(get_current_user)],
)


@inventory_router.post("/", response_model=InventoryItemOut, status_code=status.HTTP_201_CREATED)
async def create_inventory_item(data: InventoryItemCreate, db: AsyncSession = Depends(get_db)):
    return await service.create_inventory_item(db, data)


@inventory_router.get("/", response_model=list[InventoryItemOut])
async def list_inventory_items(
    variant_id: int | None = Query(None),
    location_id: int | None = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    db: AsyncSession = Depends(get_db),
):
    return await service.list_inventory_items(
        db, variant_id=variant_id, location_id=location_id,
        skip=skip, limit=limit,
    )


@inventory_router.get("/{item_id}", response_model=InventoryItemOut)
async def get_inventory_item(item_id: int, db: AsyncSession = Depends(get_db)):
    obj = await service.get_inventory_item(db, item_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Inventory item not found")
    return obj


@inventory_router.patch("/{item_id}", response_model=InventoryItemOut)
async def update_inventory_item(item_id: int, data: InventoryItemUpdate, db: AsyncSession = Depends(get_db)):
    obj = await service.update_inventory_item(db, item_id, data)
    if not obj:
        raise HTTPException(status_code=404, detail="Inventory item not found")
    return obj


@inventory_router.delete("/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_inventory_item(item_id: int, db: AsyncSession = Depends(get_db)):
    deleted = await service.delete_inventory_item(db, item_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Inventory item not found")


# ===========================================================================
# Purchase Orders
# ===========================================================================

purchase_order_router = APIRouter(
    prefix="/catalog/purchase-orders",
    tags=["Purchase Orders"],
    dependencies=[Depends(get_current_user)],
)


@purchase_order_router.post("/", response_model=PurchaseOrderOut, status_code=status.HTTP_201_CREATED)
async def create_purchase_order(data: PurchaseOrderCreate, db: AsyncSession = Depends(get_db)):
    return await service.create_purchase_order(db, data)


@purchase_order_router.get("/", response_model=list[PurchaseOrderOut])
async def list_purchase_orders(
    search: str | None = Query(None),
    status_filter: str | None = Query(None, alias="status"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    db: AsyncSession = Depends(get_db),
):
    return await service.list_purchase_orders(
        db, search=search, status=status_filter, skip=skip, limit=limit,
    )


@purchase_order_router.get("/{po_id}", response_model=PurchaseOrderWithItems)
async def get_purchase_order(po_id: int, db: AsyncSession = Depends(get_db)):
    obj = await service.get_purchase_order(db, po_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Purchase order not found")
    return obj


@purchase_order_router.patch("/{po_id}", response_model=PurchaseOrderOut)
async def update_purchase_order(po_id: int, data: PurchaseOrderUpdate, db: AsyncSession = Depends(get_db)):
    obj = await service.update_purchase_order(db, po_id, data)
    if not obj:
        raise HTTPException(status_code=404, detail="Purchase order not found")
    return obj


@purchase_order_router.delete("/{po_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_purchase_order(po_id: int, db: AsyncSession = Depends(get_db)):
    deleted = await service.delete_purchase_order(db, po_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Purchase order not found")


# --- PO Items ---

@purchase_order_router.post("/{po_id}/items", response_model=PurchaseOrderItemOut, status_code=status.HTTP_201_CREATED)
async def add_po_item(po_id: int, data: PurchaseOrderItemCreate, db: AsyncSession = Depends(get_db)):
    item = await service.add_po_item(db, po_id, data)
    if not item:
        raise HTTPException(status_code=404, detail="Purchase order not found")
    return item


@purchase_order_router.patch("/items/{item_id}", response_model=PurchaseOrderItemOut)
async def update_po_item(item_id: int, data: PurchaseOrderItemUpdate, db: AsyncSession = Depends(get_db)):
    obj = await service.update_po_item(db, item_id, data)
    if not obj:
        raise HTTPException(status_code=404, detail="PO item not found")
    return obj


@purchase_order_router.delete("/items/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_po_item(item_id: int, db: AsyncSession = Depends(get_db)):
    deleted = await service.delete_po_item(db, item_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="PO item not found")


# ===========================================================================
# Transfers
# ===========================================================================

transfer_router = APIRouter(
    prefix="/catalog/transfers",
    tags=["Transfers"],
    dependencies=[Depends(get_current_user)],
)


@transfer_router.post("/", response_model=TransferOut, status_code=status.HTTP_201_CREATED)
async def create_transfer(data: TransferCreate, db: AsyncSession = Depends(get_db)):
    return await service.create_transfer(db, data)


@transfer_router.get("/", response_model=list[TransferOut])
async def list_transfers(
    search: str | None = Query(None),
    status_filter: str | None = Query(None, alias="status"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    db: AsyncSession = Depends(get_db),
):
    return await service.list_transfers(
        db, search=search, status=status_filter, skip=skip, limit=limit,
    )


@transfer_router.get("/{transfer_id}", response_model=TransferOut)
async def get_transfer(transfer_id: int, db: AsyncSession = Depends(get_db)):
    obj = await service.get_transfer(db, transfer_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Transfer not found")
    return obj


@transfer_router.patch("/{transfer_id}", response_model=TransferOut)
async def update_transfer(transfer_id: int, data: TransferUpdate, db: AsyncSession = Depends(get_db)):
    obj = await service.update_transfer(db, transfer_id, data)
    if not obj:
        raise HTTPException(status_code=404, detail="Transfer not found")
    return obj


@transfer_router.delete("/{transfer_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_transfer(transfer_id: int, db: AsyncSession = Depends(get_db)):
    deleted = await service.delete_transfer(db, transfer_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Transfer not found")


# ===========================================================================
# Gift Cards
# ===========================================================================

gift_card_router = APIRouter(
    prefix="/catalog/gift-cards",
    tags=["Gift Cards"],
    dependencies=[Depends(get_current_user)],
)


@gift_card_router.post("/", response_model=GiftCardOut, status_code=status.HTTP_201_CREATED)
async def create_gift_card(data: GiftCardCreate, db: AsyncSession = Depends(get_db)):
    return await service.create_gift_card(db, data)


@gift_card_router.get("/", response_model=list[GiftCardOut])
async def list_gift_cards(
    search: str | None = Query(None),
    status_filter: str | None = Query(None, alias="status"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    db: AsyncSession = Depends(get_db),
):
    return await service.list_gift_cards(
        db, search=search, status=status_filter, skip=skip, limit=limit,
    )


@gift_card_router.get("/{gc_id}", response_model=GiftCardOut)
async def get_gift_card(gc_id: int, db: AsyncSession = Depends(get_db)):
    obj = await service.get_gift_card(db, gc_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Gift card not found")
    return obj


@gift_card_router.patch("/{gc_id}", response_model=GiftCardOut)
async def update_gift_card(gc_id: int, data: GiftCardUpdate, db: AsyncSession = Depends(get_db)):
    obj = await service.update_gift_card(db, gc_id, data)
    if not obj:
        raise HTTPException(status_code=404, detail="Gift card not found")
    return obj


@gift_card_router.delete("/{gc_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_gift_card(gc_id: int, db: AsyncSession = Depends(get_db)):
    deleted = await service.delete_gift_card(db, gc_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Gift card not found")


# ===========================================================================
# Gift Card Products
# ===========================================================================

gift_card_product_router = APIRouter(
    prefix="/catalog/gift-card-products",
    tags=["Gift Card Products"],
    dependencies=[Depends(get_current_user)],
)


@gift_card_product_router.post("/", response_model=GiftCardProductOut, status_code=status.HTTP_201_CREATED)
async def create_gift_card_product(data: GiftCardProductCreate, db: AsyncSession = Depends(get_db)):
    return await service.create_gift_card_product(db, data)


@gift_card_product_router.get("/", response_model=list[GiftCardProductListOut])
async def list_gift_card_products(
    search: str | None = Query(None),
    status_filter: str | None = Query(None, alias="status"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    db: AsyncSession = Depends(get_db),
):
    return await service.list_gift_card_products(
        db, search=search, status=status_filter, skip=skip, limit=limit,
    )


@gift_card_product_router.get("/{gcp_id}", response_model=GiftCardProductOut)
async def get_gift_card_product(gcp_id: int, db: AsyncSession = Depends(get_db)):
    obj = await service.get_gift_card_product(db, gcp_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Gift card product not found")
    return obj


@gift_card_product_router.patch("/{gcp_id}", response_model=GiftCardProductOut)
async def update_gift_card_product(gcp_id: int, data: GiftCardProductUpdate, db: AsyncSession = Depends(get_db)):
    obj = await service.update_gift_card_product(db, gcp_id, data)
    if not obj:
        raise HTTPException(status_code=404, detail="Gift card product not found")
    return obj


@gift_card_product_router.delete("/{gcp_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_gift_card_product(gcp_id: int, db: AsyncSession = Depends(get_db)):
    deleted = await service.delete_gift_card_product(db, gcp_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Gift card product not found")
