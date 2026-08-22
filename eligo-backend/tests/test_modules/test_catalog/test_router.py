"""Tests for app.modules.catalog.router."""

import pytest
from fastapi.exceptions import ResponseValidationError

from app.modules.catalog.model import Location, Product, ProductVariant


async def _mk_product(db_session, **kwargs):
    data = {"title": "Tote", **kwargs}
    product = Product(**data)
    db_session.add(product)
    await db_session.commit()
    await db_session.refresh(product)
    return product


async def _mk_variant(db_session, product_id, title="Default", sku=None):
    variant = ProductVariant(product_id=product_id, title=title, sku=sku)
    db_session.add(variant)
    await db_session.commit()
    await db_session.refresh(variant)
    return variant


async def _mk_location(db_session, name="Main"):
    location = Location(name=name)
    db_session.add(location)
    await db_session.commit()
    await db_session.refresh(location)
    return location


# ===========================================================================
# Auth
# ===========================================================================

async def test_all_routers_require_auth(client):
    assert (await client.get("/api/v1/catalog/overview")).status_code == 401
    assert (await client.get("/api/v1/catalog/locations/")).status_code == 401
    assert (await client.get("/api/v1/catalog/inventory/")).status_code == 401
    assert (await client.get("/api/v1/catalog/purchase-orders/")).status_code == 401
    assert (await client.get("/api/v1/catalog/transfers/")).status_code == 401
    assert (await client.get("/api/v1/catalog/gift-cards/")).status_code == 401


# ===========================================================================
# Catalog overview
# ===========================================================================

async def test_catalog_overview(client, auth_headers):
    resp = await client.get("/api/v1/catalog/overview", headers=auth_headers)
    assert resp.status_code == 200
    body = resp.json()
    assert body["total_products"] == 0
    assert body["active_products"] == 0
    assert body["total_variants"] == 0
    assert body["total_collections"] == 0
    assert body["total_locations"] == 0
    assert body["total_inventory_items"] == 0
    assert body["total_purchase_orders"] == 0
    assert body["total_transfers"] == 0
    assert body["total_gift_cards"] == 0


async def test_catalog_overview_counts_data(client, auth_headers, db_session):
    from app.core.cache import invalidate_cache
    invalidate_cache("catalog")
    await _mk_product(db_session)
    resp = await client.get("/api/v1/catalog/overview", headers=auth_headers)
    assert resp.status_code == 200
    assert resp.json()["total_products"] == 1


# ===========================================================================
# Products
# ===========================================================================

async def test_create_product(client, auth_headers):
    resp = await client.post("/api/v1/catalog/products/", json={"title": "Tote"}, headers=auth_headers)
    assert resp.status_code == 201
    body = resp.json()
    assert body["title"] == "Tote"
    assert body["status"] == "Draft"
    assert body["variants"] == []
    assert body["images"] == []


async def test_create_product_invalid_body(client, auth_headers):
    resp = await client.post("/api/v1/catalog/products/", json={}, headers=auth_headers)
    assert resp.status_code == 422


async def test_list_products(client, auth_headers):
    await client.post("/api/v1/catalog/products/", json={"title": "Tote"}, headers=auth_headers)
    resp = await client.get("/api/v1/catalog/products/", headers=auth_headers)
    assert resp.status_code == 200
    assert len(resp.json()) == 1


async def test_get_product(client, auth_headers):
    created = await client.post("/api/v1/catalog/products/", json={"title": "Tote"}, headers=auth_headers)
    pid = created.json()["id"]
    resp = await client.get(f"/api/v1/catalog/products/{pid}", headers=auth_headers)
    assert resp.status_code == 200
    assert resp.json()["title"] == "Tote"


async def test_get_product_missing(client, auth_headers):
    resp = await client.get("/api/v1/catalog/products/999999", headers=auth_headers)
    assert resp.status_code == 404
    assert resp.json()["detail"] == "Product not found"


async def test_update_product_pins_refresh_bug(client, auth_headers):
    """PATCH /catalog/products/{id} 500s on valid input: update_product
    (app/modules/catalog/service.py:101) refreshes only ``["variants",
    "images"]`` after the UPDATE, which leaves the server-updated
    ``updated_at`` column expired; response serialization then raises
    ResponseValidationError. Pinned so the bug stays visible."""
    created = await client.post("/api/v1/catalog/products/", json={"title": "Tote"}, headers=auth_headers)
    pid = created.json()["id"]
    with pytest.raises(ResponseValidationError):
        await client.patch(
            f"/api/v1/catalog/products/{pid}", json={"title": "Renamed"}, headers=auth_headers
        )


async def test_update_product_missing(client, auth_headers):
    resp = await client.patch(
        "/api/v1/catalog/products/999999", json={"title": "x"}, headers=auth_headers
    )
    assert resp.status_code == 404
    assert resp.json()["detail"] == "Product not found"


async def test_delete_product(client, auth_headers):
    created = await client.post("/api/v1/catalog/products/", json={"title": "Tote"}, headers=auth_headers)
    pid = created.json()["id"]
    resp = await client.delete(f"/api/v1/catalog/products/{pid}", headers=auth_headers)
    assert resp.status_code == 204
    resp = await client.get(f"/api/v1/catalog/products/{pid}", headers=auth_headers)
    assert resp.status_code == 404


async def test_delete_product_missing(client, auth_headers):
    resp = await client.delete("/api/v1/catalog/products/999999", headers=auth_headers)
    assert resp.status_code == 404
    assert resp.json()["detail"] == "Product not found"


# ===========================================================================
# Variants
# ===========================================================================

async def test_variant_crud(client, auth_headers, db_session):
    product = await _mk_product(db_session)
    resp = await client.post(
        f"/api/v1/catalog/products/{product.id}/variants",
        json={"title": "Default", "sku": "SKU-1"},
        headers=auth_headers,
    )
    assert resp.status_code == 201
    body = resp.json()
    assert body["title"] == "Default"
    assert body["sku"] == "SKU-1"
    vid = body["id"]

    resp = await client.patch(
        f"/api/v1/catalog/products/variants/{vid}", json={"price": 9.99}, headers=auth_headers
    )
    assert resp.status_code == 200
    assert resp.json()["id"] == vid

    resp = await client.delete(f"/api/v1/catalog/products/variants/{vid}", headers=auth_headers)
    assert resp.status_code == 204

    resp = await client.get(f"/api/v1/catalog/products/{product.id}", headers=auth_headers)
    assert resp.status_code == 200
    assert resp.json()["variants"] == []


async def test_create_variant_missing_product(client, auth_headers):
    resp = await client.post(
        "/api/v1/catalog/products/999999/variants", json={"title": "V"}, headers=auth_headers
    )
    assert resp.status_code == 404
    assert resp.json()["detail"] == "Product not found"


async def test_update_variant_missing(client, auth_headers):
    resp = await client.patch(
        "/api/v1/catalog/products/variants/999999", json={"title": "V"}, headers=auth_headers
    )
    assert resp.status_code == 404
    assert resp.json()["detail"] == "Variant not found"


async def test_delete_variant_missing(client, auth_headers):
    resp = await client.delete("/api/v1/catalog/products/variants/999999", headers=auth_headers)
    assert resp.status_code == 404
    assert resp.json()["detail"] == "Variant not found"


# ===========================================================================
# Images
# ===========================================================================

async def test_image_crud(client, auth_headers, db_session):
    product = await _mk_product(db_session)
    resp = await client.post(
        f"/api/v1/catalog/products/{product.id}/images",
        json={"url": "https://img/1"},
        headers=auth_headers,
    )
    assert resp.status_code == 201
    body = resp.json()
    assert body["url"] == "https://img/1"
    iid = body["id"]

    resp = await client.patch(
        f"/api/v1/catalog/products/images/{iid}", json={"alt_text": "photo"}, headers=auth_headers
    )
    assert resp.status_code == 200
    assert resp.json()["alt_text"] == "photo"

    resp = await client.delete(f"/api/v1/catalog/products/images/{iid}", headers=auth_headers)
    assert resp.status_code == 204


async def test_image_missing_404s(client, auth_headers):
    resp = await client.patch(
        "/api/v1/catalog/products/images/999999", json={"alt_text": "x"}, headers=auth_headers
    )
    assert resp.status_code == 404
    assert resp.json()["detail"] == "Image not found"

    resp = await client.delete("/api/v1/catalog/products/images/999999", headers=auth_headers)
    assert resp.status_code == 404
    assert resp.json()["detail"] == "Image not found"


async def test_add_image_missing_product(client, auth_headers):
    resp = await client.post(
        "/api/v1/catalog/products/999999/images", json={"url": "https://img/1"}, headers=auth_headers
    )
    assert resp.status_code == 404
    assert resp.json()["detail"] == "Product not found"


# ===========================================================================
# Collections
# ===========================================================================

async def test_collection_crud(client, auth_headers):
    resp = await client.post("/api/v1/catalog/collections/", json={"title": "Belts"}, headers=auth_headers)
    assert resp.status_code == 201
    assert resp.json()["title"] == "Belts"
    col_id = resp.json()["id"]

    resp = await client.get("/api/v1/catalog/collections/", headers=auth_headers)
    assert resp.status_code == 200
    assert len(resp.json()) == 1

    resp = await client.get(f"/api/v1/catalog/collections/{col_id}", headers=auth_headers)
    assert resp.status_code == 200

    resp = await client.get("/api/v1/catalog/collections/999999", headers=auth_headers)
    assert resp.status_code == 404
    assert resp.json()["detail"] == "Collection not found"

    resp = await client.patch(
        f"/api/v1/catalog/collections/{col_id}", json={"description": "desc"}, headers=auth_headers
    )
    assert resp.status_code == 200
    assert resp.json()["description"] == "desc"

    resp = await client.patch("/api/v1/catalog/collections/999999", json={"title": "x"}, headers=auth_headers)
    assert resp.status_code == 404
    assert resp.json()["detail"] == "Collection not found"

    resp = await client.delete(f"/api/v1/catalog/collections/{col_id}", headers=auth_headers)
    assert resp.status_code == 204

    resp = await client.delete("/api/v1/catalog/collections/999999", headers=auth_headers)
    assert resp.status_code == 404
    assert resp.json()["detail"] == "Collection not found"


async def test_create_collection_invalid(client, auth_headers):
    resp = await client.post("/api/v1/catalog/collections/", json={}, headers=auth_headers)
    assert resp.status_code == 422


# ===========================================================================
# Locations
# ===========================================================================

async def test_location_crud(client, auth_headers):
    resp = await client.post("/api/v1/catalog/locations/", json={"name": "Main"}, headers=auth_headers)
    assert resp.status_code == 201
    assert resp.json()["name"] == "Main"
    loc_id = resp.json()["id"]

    resp = await client.get("/api/v1/catalog/locations/", headers=auth_headers)
    assert resp.status_code == 200
    assert len(resp.json()) == 1

    resp = await client.get(f"/api/v1/catalog/locations/{loc_id}", headers=auth_headers)
    assert resp.status_code == 200

    resp = await client.get("/api/v1/catalog/locations/999999", headers=auth_headers)
    assert resp.status_code == 404
    assert resp.json()["detail"] == "Location not found"

    resp = await client.patch(f"/api/v1/catalog/locations/{loc_id}", json={"city": "Lahore"}, headers=auth_headers)
    assert resp.status_code == 200
    assert resp.json()["city"] == "Lahore"

    resp = await client.delete(f"/api/v1/catalog/locations/{loc_id}", headers=auth_headers)
    assert resp.status_code == 204

    resp = await client.delete("/api/v1/catalog/locations/999999", headers=auth_headers)
    assert resp.status_code == 404
    assert resp.json()["detail"] == "Location not found"


async def test_create_location_invalid(client, auth_headers):
    resp = await client.post("/api/v1/catalog/locations/", json={}, headers=auth_headers)
    assert resp.status_code == 422


# ===========================================================================
# Inventory
# ===========================================================================

async def test_inventory_crud(client, auth_headers, db_session):
    product = await _mk_product(db_session)
    variant = await _mk_variant(db_session, product.id)
    location = await _mk_location(db_session)

    resp = await client.post(
        "/api/v1/catalog/inventory/",
        json={"variant_id": variant.id, "location_id": location.id, "on_hand": 5},
        headers=auth_headers,
    )
    assert resp.status_code == 201
    body = resp.json()
    assert body["on_hand"] == 5
    item_id = body["id"]

    resp = await client.get("/api/v1/catalog/inventory/", headers=auth_headers)
    assert resp.status_code == 200
    assert len(resp.json()) == 1

    resp = await client.get(f"/api/v1/catalog/inventory/{item_id}", headers=auth_headers)
    assert resp.status_code == 200

    resp = await client.get("/api/v1/catalog/inventory/999999", headers=auth_headers)
    assert resp.status_code == 404
    assert resp.json()["detail"] == "Inventory item not found"

    resp = await client.patch(f"/api/v1/catalog/inventory/{item_id}", json={"on_hand": 3}, headers=auth_headers)
    assert resp.status_code == 200
    assert resp.json()["on_hand"] == 3

    resp = await client.delete(f"/api/v1/catalog/inventory/{item_id}", headers=auth_headers)
    assert resp.status_code == 204

    resp = await client.delete("/api/v1/catalog/inventory/999999", headers=auth_headers)
    assert resp.status_code == 404
    assert resp.json()["detail"] == "Inventory item not found"


async def test_create_inventory_invalid(client, auth_headers):
    resp = await client.post("/api/v1/catalog/inventory/", json={}, headers=auth_headers)
    assert resp.status_code == 422


# ===========================================================================
# Purchase orders
# ===========================================================================

async def test_purchase_order_crud(client, auth_headers, db_session):
    location = await _mk_location(db_session)
    resp = await client.post(
        "/api/v1/catalog/purchase-orders/",
        json={"supplier_name": "Acme", "destination_location_id": location.id},
        headers=auth_headers,
    )
    assert resp.status_code == 201
    body = resp.json()
    assert body["supplier_name"] == "Acme"
    assert body["status"] == "Open"
    po_id = body["id"]

    resp = await client.get("/api/v1/catalog/purchase-orders/", headers=auth_headers)
    assert resp.status_code == 200
    assert len(resp.json()) == 1

    resp = await client.get(f"/api/v1/catalog/purchase-orders/{po_id}", headers=auth_headers)
    assert resp.status_code == 200
    assert resp.json()["id"] == po_id

    resp = await client.get("/api/v1/catalog/purchase-orders/999999", headers=auth_headers)
    assert resp.status_code == 404
    assert resp.json()["detail"] == "Purchase order not found"

    resp = await client.patch(
        f"/api/v1/catalog/purchase-orders/{po_id}", json={"note_to_supplier": "hi"}, headers=auth_headers
    )
    assert resp.status_code == 200
    assert resp.json()["note_to_supplier"] == "hi"

    resp = await client.patch(
        "/api/v1/catalog/purchase-orders/999999", json={"supplier_name": "x"}, headers=auth_headers
    )
    assert resp.status_code == 404
    assert resp.json()["detail"] == "Purchase order not found"

    resp = await client.delete(f"/api/v1/catalog/purchase-orders/{po_id}", headers=auth_headers)
    assert resp.status_code == 204

    resp = await client.delete("/api/v1/catalog/purchase-orders/999999", headers=auth_headers)
    assert resp.status_code == 404
    assert resp.json()["detail"] == "Purchase order not found"


async def test_purchase_order_invalid(client, auth_headers):
    resp = await client.post("/api/v1/catalog/purchase-orders/", json={}, headers=auth_headers)
    assert resp.status_code == 422


async def test_purchase_order_item_routes(client, auth_headers, db_session):
    product = await _mk_product(db_session)
    variant = await _mk_variant(db_session, product.id)
    location = await _mk_location(db_session)
    po_resp = await client.post(
        "/api/v1/catalog/purchase-orders/",
        json={"supplier_name": "Acme", "destination_location_id": location.id},
        headers=auth_headers,
    )
    po_id = po_resp.json()["id"]

    resp = await client.post(
        f"/api/v1/catalog/purchase-orders/{po_id}/items",
        json={"variant_id": variant.id, "quantity": 2},
        headers=auth_headers,
    )
    assert resp.status_code == 201
    body = resp.json()
    assert body["quantity"] == 2
    item_id = body["id"]

    resp = await client.patch(
        f"/api/v1/catalog/purchase-orders/items/{item_id}", json={"quantity": 5}, headers=auth_headers
    )
    assert resp.status_code == 200
    assert resp.json()["quantity"] == 5

    resp = await client.patch(
        "/api/v1/catalog/purchase-orders/items/999999", json={"quantity": 1}, headers=auth_headers
    )
    assert resp.status_code == 404
    assert resp.json()["detail"] == "PO item not found"

    resp = await client.delete(f"/api/v1/catalog/purchase-orders/items/{item_id}", headers=auth_headers)
    assert resp.status_code == 204

    resp = await client.delete("/api/v1/catalog/purchase-orders/items/999999", headers=auth_headers)
    assert resp.status_code == 404
    assert resp.json()["detail"] == "PO item not found"

    resp = await client.post(
        "/api/v1/catalog/purchase-orders/999999/items",
        json={"variant_id": variant.id},
        headers=auth_headers,
    )
    assert resp.status_code == 404
    assert resp.json()["detail"] == "Purchase order not found"


# ===========================================================================
# Transfers
# ===========================================================================

async def test_transfer_crud(client, auth_headers, db_session):
    loc1 = await _mk_location(db_session, "A")
    loc2 = await _mk_location(db_session, "B")

    resp = await client.post(
        "/api/v1/catalog/transfers/",
        json={"origin_location_id": loc1.id, "destination_location_id": loc2.id},
        headers=auth_headers,
    )
    assert resp.status_code == 201
    body = resp.json()
    assert body["status"] == "Pending"
    t_id = body["id"]

    resp = await client.get("/api/v1/catalog/transfers/", headers=auth_headers)
    assert resp.status_code == 200
    assert len(resp.json()) == 1

    resp = await client.get(f"/api/v1/catalog/transfers/{t_id}", headers=auth_headers)
    assert resp.status_code == 200

    resp = await client.get("/api/v1/catalog/transfers/999999", headers=auth_headers)
    assert resp.status_code == 404
    assert resp.json()["detail"] == "Transfer not found"

    resp = await client.patch(f"/api/v1/catalog/transfers/{t_id}", json={"reference_name": "R1"}, headers=auth_headers)
    assert resp.status_code == 200
    assert resp.json()["reference_name"] == "R1"

    resp = await client.patch(
        "/api/v1/catalog/transfers/999999", json={"reference_name": "x"}, headers=auth_headers
    )
    assert resp.status_code == 404
    assert resp.json()["detail"] == "Transfer not found"

    resp = await client.delete(f"/api/v1/catalog/transfers/{t_id}", headers=auth_headers)
    assert resp.status_code == 204

    resp = await client.delete("/api/v1/catalog/transfers/999999", headers=auth_headers)
    assert resp.status_code == 404
    assert resp.json()["detail"] == "Transfer not found"


async def test_create_transfer_invalid(client, auth_headers):
    resp = await client.post("/api/v1/catalog/transfers/", json={}, headers=auth_headers)
    assert resp.status_code == 422


# ===========================================================================
# Gift cards
# ===========================================================================

async def test_gift_card_crud(client, auth_headers):
    resp = await client.post(
        "/api/v1/catalog/gift-cards/",
        json={"code": "GC-1", "initial_value": 100, "current_balance": 50},
        headers=auth_headers,
    )
    assert resp.status_code == 201
    body = resp.json()
    assert body["code"] == "GC-1"
    assert body["status"] == "Enabled"
    gc_id = body["id"]

    resp = await client.get("/api/v1/catalog/gift-cards/", headers=auth_headers)
    assert resp.status_code == 200
    assert len(resp.json()) == 1

    resp = await client.get(f"/api/v1/catalog/gift-cards/{gc_id}", headers=auth_headers)
    assert resp.status_code == 200
    assert resp.json()["code"] == "GC-1"

    resp = await client.get("/api/v1/catalog/gift-cards/999999", headers=auth_headers)
    assert resp.status_code == 404
    assert resp.json()["detail"] == "Gift card not found"

    resp = await client.patch(
        f"/api/v1/catalog/gift-cards/{gc_id}", json={"status": "Disabled"}, headers=auth_headers
    )
    assert resp.status_code == 200
    assert resp.json()["status"] == "Disabled"

    resp = await client.patch(
        "/api/v1/catalog/gift-cards/999999", json={"status": "Disabled"}, headers=auth_headers
    )
    assert resp.status_code == 404
    assert resp.json()["detail"] == "Gift card not found"

    resp = await client.delete(f"/api/v1/catalog/gift-cards/{gc_id}", headers=auth_headers)
    assert resp.status_code == 204

    resp = await client.delete("/api/v1/catalog/gift-cards/999999", headers=auth_headers)
    assert resp.status_code == 404
    assert resp.json()["detail"] == "Gift card not found"


async def test_create_gift_card_invalid(client, auth_headers):
    resp = await client.post("/api/v1/catalog/gift-cards/", json={}, headers=auth_headers)
    assert resp.status_code == 422
