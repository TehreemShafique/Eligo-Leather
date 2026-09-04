"""Tests for the public (storefront) order-creation contract.

``POST /api/v1/orders/create-order`` must:
  - resolve every line against the live catalog (never trust the browser for
    prices, quantities, totals, taxes or statuses);
  - reject empty carts, unknown/inactive products & variants, invalid
    quantities and out-of-stock lines;
  - deduct variant stock at order time (and restore it on restock);
  - prevent duplicate orders within a 24-hour window (same customer/visitor and
    identical cart, total, shipping and payment — while never blocking different
    variants, quantities, products, shipping details, or failed/cancelled orders);
  - force Cash on Delivery (a browser can never self-declare "paid").
"""

from datetime import datetime, timedelta, timezone
from decimal import Decimal

import pytest
from sqlalchemy import func, select
from sqlalchemy.orm import selectinload

from app.modules.catalog.model import Product, ProductVariant, ProductStatus
from app.modules.orders.model import (
    Order,
    PaymentStatus,
    FulfillmentStatus,
    DeliveryStatus,
)

PRICE = Decimal("2750.00")


@pytest.fixture(autouse=True)
def _no_leopards_auto_booking(monkeypatch):
    """Prevent the create-order happy path from calling the real Leopards
    Courier API or the production notification SMTP/DB session during tests."""

    async def _noop(db, order, shipping_settings):
        return None

    monkeypatch.setattr(
        "app.modules.orders.router._auto_book_leopards", _noop
    )

    async def _noop_dispatch(order_id: int) -> None:
        return None

    monkeypatch.setattr(
        "app.modules.orders.router.background_dispatch_order_placed",
        _noop_dispatch,
    )


async def _seed_product(
    db_session,
    *,
    price: Decimal = PRICE,
    stock: int = 10,
    active: bool = True,
    tracked: bool = True,
    continue_selling: bool = False,
    variant_title: str = "Tan",
    sku: str = "LW-TAN",
) -> tuple[Product, ProductVariant]:
    product = Product(title="Leather Wallet", status=ProductStatus.active)
    db_session.add(product)
    await db_session.flush()
    variant = ProductVariant(
        product_id=product.id,
        title=variant_title,
        sku=sku,
        price=price,
        inventory_quantity=stock,
        inventory_tracked=tracked,
        continue_selling_out_of_stock=continue_selling,
        is_active=active,
        is_canonical=True,
    )
    db_session.add(variant)
    await db_session.commit()
    return product, variant


def _payload(product, variant, quantity=1, **overrides) -> dict:
    """Browser-style payload with tampered prices/totals/tax embedded on
    purpose — every amount here must be ignored by the server."""
    return _payload_ids(int(product.id), int(variant.id), quantity=quantity, **overrides)


def _payload_ids(product_id, variant_id, quantity=1, **overrides) -> dict:
    """Same as :func:`_payload` but takes raw ids, usable after the ORM
    objects have been expired by a ``_load_order`` call."""
    payload = {
        "channel": "Online Store",
        "currency": "PKR",
        "first_name": "Ali",
        "last_name": "Raza",
        "email": "ali@example.com",
        "phone": "03001234567",
        "city": "Lahore",
        "postal_code": "",
        "country": "Pakistan",
        "shipping_address": "Ali Raza | Phone: 03001234567 | 1 Street, Lahore, Pakistan",
        "note": "Contact email: ali@example.com",
        "destination": "Lahore",
        # Fake browser amounts:
        "subtotal": 9999,
        "shipping_cost": 1,
        "tax": 500,
        "total_price": 999999,
        "payment_status": "pending",
        "fulfillment_status": "unfulfilled",
        "delivery_status": "pending",
        "items": [
            {
                "product_id": product_id,
                "variant_id": variant_id,
                "product_name": "Tampered Name",
                "variant_title": "Tampered",
                "quantity": quantity,
                "unit_price": 1.0,
                "total_price": 5.0,
            }
        ],
    }
    payload.update(overrides)
    return payload


async def _load_order(db_session, order_id: int) -> Order:
    db_session.expire_all()
    result = await db_session.execute(
        select(Order).options(selectinload(Order.items)).where(Order.id == order_id)
    )
    return result.scalar_one()


async def test_create_order_uses_server_prices_and_ignores_browser_amounts(
    client, db_session
):
    product, variant = await _seed_product(db_session)
    response = await client.post(
        "/api/v1/orders/create-order", json=_payload(product, variant)
    )
    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "success"
    assert str(body["order_number"]).startswith("#")
    # 2750 < 4000 free-shipping threshold -> 250 shipping; tax forced to 0.
    assert body["subtotal"] == 2750.0
    assert body["shipping_cost"] == 250.0
    assert body["total_price"] == 3000.0

    order = await _load_order(db_session, body["order_id"])
    assert Decimal(str(order.subtotal)) == PRICE
    assert Decimal(str(order.tax)) == Decimal("0")
    assert Decimal(str(order.shipping_cost)) == Decimal("250")
    assert Decimal(str(order.total_price)) == Decimal("3000")
    assert order.payment_method == "COD"
    assert order.payment_status == PaymentStatus.pending
    assert order.fulfillment_status == FulfillmentStatus.unfulfilled
    assert order.delivery_status == DeliveryStatus.pending

    item = order.items[0]
    assert item.unit_price == PRICE
    assert item.quantity == 1
    assert item.total_price == PRICE
    assert item.product_name == "Leather Wallet"
    assert item.variant_title == "Tan"
    assert item.sku == "LW-TAN"


async def test_create_order_rejects_empty_cart(client, db_session):
    response = await client.post(
        "/api/v1/orders/create-order",
        json={"phone": "03001234567", "email": "ali@example.com", "items": []},
    )
    assert response.status_code == 400


async def test_create_order_rejects_unknown_product_variant(client, db_session):
    response = await client.post(
        "/api/v1/orders/create-order",
        json={
            "phone": "03001234567",
            "email": "ali@example.com",
            "items": [
                {"product_id": 999999, "variant_id": 999999, "quantity": 1}
            ],
        },
    )
    assert response.status_code == 400


async def test_create_order_rejects_inactive_variant(client, db_session):
    product, variant = await _seed_product(db_session, active=False)
    response = await client.post(
        "/api/v1/orders/create-order", json=_payload(product, variant)
    )
    assert response.status_code == 400


async def test_create_order_rejects_invalid_quantity(client, db_session):
    product, variant = await _seed_product(db_session)
    for bad_qty in (0, -1, 100):
        response = await client.post(
            "/api/v1/orders/create-order",
            json=_payload(product, variant, quantity=bad_qty),
        )
        assert response.status_code == 400, f"quantity {bad_qty} should fail"


async def test_create_order_rejects_out_of_stock(client, db_session):
    product, variant = await _seed_product(db_session, stock=2)
    response = await client.post(
        "/api/v1/orders/create-order",
        json=_payload(product, variant, quantity=3),
    )
    assert response.status_code == 400
    assert "Only 2 in stock" in response.json()["detail"]


async def test_create_order_continue_selling_out_of_stock(client, db_session):
    product, variant = await _seed_product(db_session, stock=2, continue_selling=True)
    response = await client.post(
        "/api/v1/orders/create-order",
        json=_payload(product, variant, quantity=3),
    )
    assert response.status_code == 200
    variant_pk = variant.id
    db_session.expire_all()
    fresh = await db_session.get(ProductVariant, variant_pk)
    assert fresh.inventory_quantity == -1


async def test_create_order_deducts_stock(client, db_session):
    product, variant = await _seed_product(db_session, stock=10)
    response = await client.post(
        "/api/v1/orders/create-order",
        json=_payload(product, variant, quantity=3),
    )
    assert response.status_code == 200
    variant_pk = variant.id
    db_session.expire_all()
    fresh = await db_session.get(ProductVariant, variant_pk)
    assert fresh.inventory_quantity == 7


async def test_create_order_forces_cod_ignores_paid_declaration(client, db_session):
    product, variant = await _seed_product(db_session)
    response = await client.post(
        "/api/v1/orders/create-order",
        json=_payload(
            product,
            variant,
            payment_status="paid",
            fulfillment_status="fulfilled",
            delivery_status="delivered",
        ),
    )
    assert response.status_code == 200
    order = await _load_order(db_session, response.json()["order_id"])
    assert order.payment_status == PaymentStatus.pending
    assert order.payment_method == "COD"
    assert Decimal(str(order.paid_amount)) == Decimal("0")
    assert order.fulfillment_status == FulfillmentStatus.unfulfilled
    assert order.delivery_status == DeliveryStatus.pending


async def test_duplicate_order_rejected_within_window(client, db_session):
    product, variant = await _seed_product(db_session)
    payload = _payload(product, variant)
    first = await client.post("/api/v1/orders/create-order", json=payload)
    assert first.status_code == 200
    duplicate = await client.post("/api/v1/orders/create-order", json=payload)
    assert duplicate.status_code == 409
    assert duplicate.json()["detail"] == (
        "This order has already been placed within the last 24 hours. "
        "You can place the same order again after 24 hours."
    )


async def test_duplicate_order_allowed_after_24_hours(client, db_session):
    product, variant = await _seed_product(db_session, stock=5)
    payload = _payload(product, variant)
    first = await client.post("/api/v1/orders/create-order", json=payload)
    assert first.status_code == 200

    # Age the placed order past the 24-hour window (server-side created_at).
    order = await _load_order(db_session, first.json()["order_id"])
    order.created_at = datetime.now(timezone.utc) - timedelta(hours=25)
    await db_session.commit()

    retry = await client.post("/api/v1/orders/create-order", json=payload)
    assert retry.status_code == 200


async def test_different_cart_is_not_duplicate(client, db_session):
    product, variant = await _seed_product(db_session)
    first = await client.post(
        "/api/v1/orders/create-order", json=_payload(product, variant, quantity=1)
    )
    assert first.status_code == 200
    different = await client.post(
        "/api/v1/orders/create-order", json=_payload(product, variant, quantity=2)
    )
    assert different.status_code == 200


async def test_same_product_different_variant_not_duplicate(client, db_session):
    product, variant_a = await _seed_product(db_session)
    variant_b = ProductVariant(
        product_id=product.id,
        title="Black",
        sku="LW-BLK",
        price=PRICE,
        inventory_quantity=10,
        inventory_tracked=True,
        continue_selling_out_of_stock=False,
        is_active=True,
        is_canonical=True,
    )
    db_session.add(variant_b)
    await db_session.commit()

    product_id = int(product.id)
    first = await client.post(
        "/api/v1/orders/create-order",
        json=_payload_ids(product_id, int(variant_a.id)),
    )
    assert first.status_code == 200
    second = await client.post(
        "/api/v1/orders/create-order",
        json=_payload_ids(product_id, int(variant_b.id)),
    )
    assert second.status_code == 200


async def test_different_product_not_duplicate(client, db_session):
    product_a, variant_a = await _seed_product(db_session)
    product_b, variant_b = await _seed_product(db_session, variant_title="Black", sku="LW-BLACK")

    first = await client.post(
        "/api/v1/orders/create-order",
        json=_payload_ids(int(product_a.id), int(variant_a.id)),
    )
    assert first.status_code == 200
    second = await client.post(
        "/api/v1/orders/create-order",
        json=_payload_ids(int(product_b.id), int(variant_b.id)),
    )
    assert second.status_code == 200


async def test_different_shipping_details_not_duplicate(client, db_session):
    product, variant = await _seed_product(db_session)
    first = await client.post(
        "/api/v1/orders/create-order",
        json=_payload(product, variant, destination="Lahore"),
    )
    assert first.status_code == 200

    second = await client.post(
        "/api/v1/orders/create-order",
        json=_payload(
            product,
            variant,
            city="Islamabad",
            destination="Islamabad",
            shipping_address="Bilal Khan | Phone: 03001234567 | 2 Avenue, Islamabad, Pakistan",
        ),
    )
    assert second.status_code == 200


async def test_failed_or_cancelled_order_does_not_block_reorder(client, db_session):
    product, variant = await _seed_product(db_session, stock=10)
    payload = _payload(product, variant)

    first = await client.post("/api/v1/orders/create-order", json=payload)
    assert first.status_code == 200
    order = await _load_order(db_session, first.json()["order_id"])
    order.delivery_status = DeliveryStatus.failed
    await db_session.commit()

    # The identical order again must NOT be blocked by the failed one.
    retry = await client.post("/api/v1/orders/create-order", json=payload)
    assert retry.status_code == 200
    second_order = await _load_order(db_session, retry.json()["order_id"])

    # A cancelled order must equally not block a re-order.
    second_order.cancelled_at = datetime.now(timezone.utc)
    await db_session.commit()
    retry2 = await client.post("/api/v1/orders/create-order", json=payload)
    assert retry2.status_code == 200


async def test_concurrent_identical_checkouts_enforced_by_db_unique_index(client, db_session):
    """DB-level backstop for two *simultaneous* identical checkouts (both can
    legitimately pass the in-transaction 24-hour heuristic before either has
    committed): the unique index on ``orders.idempotency_key`` makes it
    impossible for a second order to carry the same checkout-request key, so
    exactly one order row can exist. On PostgreSQL the customer-row lock in
    the endpoint serializes the pair anyway (loser -> 409); this asserts the
    database guarantee that collapses the race if the heuristic is bypassed.

    (The SQLite test harness shares a single connection, so real concurrent
    PostgreSQL transactions cannot be simulated here — instead we prove the
    index physically rejects the duplicate row.)
    """
    from sqlalchemy.exc import IntegrityError

    product, variant = await _seed_product(db_session, stock=5)
    variant_pk = int(variant.id)
    payload = _payload(product, variant, idempotency_key="race-key-1")

    first = await client.post("/api/v1/orders/create-order", json=payload)
    assert first.status_code == 200
    first_order = await _load_order(db_session, first.json()["order_id"])

    # Simulate the losing simultaneous request that slipped past the heuristic
    # before the winner committed: a second order row carrying the same checkout
    # key is rejected by the database itself.
    duplicate_key = Order(
        order_number="#999990",
        customer_id=first_order.customer_id,
        idempotency_key="race-key-1",
        subtotal=first_order.subtotal,
        total_price=first_order.total_price,
    )
    db_session.add(duplicate_key)
    with pytest.raises(IntegrityError):
        await db_session.flush()
    await db_session.rollback()

    count = (
        await db_session.execute(select(func.count()).select_from(Order))
    ).scalar_one()
    assert count == 1

    fresh_variant = await db_session.get(ProductVariant, variant_pk)
    await db_session.refresh(fresh_variant)
    assert fresh_variant.inventory_quantity == 4  # stock deducted exactly once


async def test_create_order_stores_address_only_in_shipping_address(client, db_session):
    product, variant = await _seed_product(db_session)
    # Legacy/malicious clients pack "Name | Phone | address" into shipping_address.
    response = await client.post(
        "/api/v1/orders/create-order",
        json=_payload(product, variant, shipping_address="Ali Raza | Phone: 03001234567 | 1 Street, Lahore, Pakistan"),
    )
    assert response.status_code == 200

    order = await _load_order(db_session, response.json()["order_id"])
    # Name and phone live in their own structured fields, never in the location.
    assert order.shipping_address == "1 Street, Lahore, Pakistan"
    assert str(order.shipping_address) not in ("Ali Raza", "")
    assert order.shipping_name == "Ali Raza"
    assert order.shipping_phone == "03001234567"
    assert "Ali" not in str(order.shipping_address)
    assert "03001234567" not in str(order.shipping_address)


async def test_create_order_applies_valid_promo_discount_server_side(
    client, db_session, admin_headers
):
    product, variant = await _seed_product(db_session)
    await client.post(
        "/api/v1/discounts/",
        headers=admin_headers,
        json={
            "title": "Duo 10%",
            "code": "DUO10",
            "status": "Active",
            "method": "Code",
            "type": "Percentage",
            "percentage_value": 10,
            "value": "10% OFF",
        },
    )
    response = await client.post(
        "/api/v1/orders/create-order",
        json=_payload(product, variant, discount_code="DUO10"),
    )
    assert response.status_code == 200
    body = response.json()
    # 2750 - 275 discount + 250 shipping = 2725.
    assert body["subtotal"] == 2750.0
    assert body["shipping_cost"] == 250.0
    assert body["total_price"] == 2725.0

    order = await _load_order(db_session, body["order_id"])
    assert Decimal(str(order.discount)) == Decimal("275.00")


async def test_create_order_ignores_unusable_promo_code(client, db_session):
    product, variant = await _seed_product(db_session)
    response = await client.post(
        "/api/v1/orders/create-order",
        json=_payload(product, variant, discount_code="DOESNOTEXIST"),
    )
    assert response.status_code == 200
    body = response.json()
    assert body["total_price"] == 2750.0 + 250.0
    order = await _load_order(db_session, body["order_id"])
    assert Decimal(str(order.discount)) == Decimal("0.00")


async def test_create_order_applies_one_time_welcome_discount(client, db_session):
    """Welcome discount is applied server-side on the first order and never
    on a second checkout of the same visitor."""
    from app.modules.discounts.model import WelcomeDiscountSettings

    db_session.add(WelcomeDiscountSettings(discount_percentage=10, is_active=True))
    await db_session.commit()

    # Each eligible visitor receives a unique code via welcome-check.
    check = await client.post(
        "/api/v1/discounts/public/welcome-check",
        json={"visitor_id": "visitor-od-1"},
    )
    unique_code = check.json()["coupon_code"]
    assert unique_code is not None

    product, variant = await _seed_product(db_session)
    product_id = int(product.id)
    variant_id = int(variant.id)
    first = await client.post(
        "/api/v1/orders/create-order",
        json=_payload_ids(product_id, variant_id, discount_code=unique_code, visitor_id="visitor-od-1"),
    )
    assert first.status_code == 200
    first_body = first.json()
    # 2750 - 275 welcome discount + 250 shipping = 2725.
    assert first_body["total_price"] == 2725.0
    first_order = await _load_order(db_session, first_body["order_id"])
    assert Decimal(str(first_order.discount)) == Decimal("275.00")

    # The same visitor places a second (different-basket) order with the same
    # welcome code: the one-time offer was already redeemed and must not apply.
    second = await client.post(
        "/api/v1/orders/create-order",
        json=_payload_ids(
            product_id, variant_id, quantity=2,
            discount_code=unique_code, visitor_id="visitor-od-1",
        ),
    )
    assert second.status_code == 200
    second_body = second.json()
    # 5500 - 0 welcome discount + free shipping (over threshold) = 5500.
    assert second_body["total_price"] == 5500.0
    second_order = await _load_order(db_session, second_body["order_id"])
    assert Decimal(str(second_order.discount)) == Decimal("0.00")


async def test_idempotency_key_reuses_existing_order(client, db_session):
    """Same ``idempotency_key`` twice -> exactly one order, same id, stock
    deducted once (double-submit / network retry safety)."""
    product, variant = await _seed_product(db_session, stock=5)

    first = await client.post(
        "/api/v1/orders/create-order",
        json=_payload(product, variant, quantity=2, idempotency_key="cart-uuid-123"),
    )
    assert first.status_code == 200
    first_id = first.json()["order_id"]

    replay = await client.post(
        "/api/v1/orders/create-order",
        json=_payload(product, variant, quantity=2, idempotency_key="cart-uuid-123"),
    )
    assert replay.status_code == 200
    replay_body = replay.json()
    assert replay_body["order_id"] == first_id
    assert replay_body["order_number"] == first.json()["order_number"]

    rows = await db_session.execute(
        select(Order).where(Order.idempotency_key == "cart-uuid-123")
    )
    orders = rows.scalars().all()
    assert len(orders) == 1

    variant = await db_session.get(ProductVariant, variant.id)
    await db_session.refresh(variant)
    assert variant.inventory_quantity == 3  # deducted exactly once


async def test_returning_customer_keeps_original_profile_under_same_email(client, db_session):
    """A returning customer (same email) keeps their ORIGINAL profile: a later
    order's different name / contact / address must never overwrite it. Both
    orders stay grouped under the SAME customer row/email, and each order
    independently preserves its own checkout details (name/phone/address)."""
    from app.modules.customers.model import Customer, CustomerAddress

    product, variant = await _seed_product(db_session, stock=10)

    first_payload = _payload(
        product,
        variant,
        first_name="Ali",
        last_name="Raza",
        email="returning@example.com",
        phone="03001234567",
        city="Lahore",
        shipping_address="Ali Raza | Phone: 03001234567 | 1 Street, Lahore, Pakistan",
        destination="Lahore",
    )
    second_payload = _payload(
        product,
        variant,
        quantity=2,
        first_name="Bilal",
        last_name="Khan",
        email="returning@example.com",
        phone="03121234567",
        city="Karachi",
        postal_code="75500",
        shipping_address="House 9, Phase 4, Karachi, 75500, Pakistan",
        destination="Karachi",
    )

    first = await client.post("/api/v1/orders/create-order", json=first_payload)
    assert first.status_code == 200
    first_order_id = first.json()["order_id"]

    db_session.expire_all()
    first_order = await _load_order(db_session, first_order_id)
    customer_id = first_order.customer_id
    assert customer_id is not None
    # Read the order's own checkout snapshot BEFORE any later expire_all so the
    # freshly-loaded columns are available synchronously.
    first_order_name = first_order.customer_name
    first_order_phone = first_order.customer_phone

    customer = await db_session.get(Customer, customer_id)
    assert customer.email == "returning@example.com"
    assert customer.first_name == "Ali"
    assert customer.last_name == "Raza"
    assert customer.phone == "03001234567"
    assert customer.default_address_id is not None

    # Second checkout: same email, but changed name, contact and address.
    second = await client.post("/api/v1/orders/create-order", json=second_payload)
    assert second.status_code == 200
    second_order_id = second.json()["order_id"]

    db_session.expire_all()
    second_order = await _load_order(db_session, second_order_id)
    # History stays grouped under the SAME customer / email.
    assert second_order.customer_id == customer_id
    second_order_name = second_order.customer_name
    second_order_phone = second_order.customer_phone

    # Order 1 keeps its own original checkout details -> still Ali / first phone.
    assert first_order_name == "Ali Raza"
    assert first_order_phone == "03001234567"

    # Order 2 keeps its own checkout details -> Bilal / new phone.
    assert second_order_name == "Bilal Khan"
    assert second_order_phone == "03121234567"

    # The shared customer profile is NOT overwritten by the second order.
    fresh = await db_session.get(Customer, customer_id)
    assert fresh.first_name == "Ali"
    assert fresh.last_name == "Raza"
    assert fresh.phone == "03001234567"
    assert fresh.email == "returning@example.com"
    assert fresh.postal_code != "75500"
    assert fresh.total_orders == 2

    # The customer's default address is NOT rewritten by the later checkout.
    default_addr = await db_session.get(CustomerAddress, fresh.default_address_id)
    assert default_addr is not None
    assert default_addr.address_line1 == "1 Street, Lahore, Pakistan"
    assert default_addr.phone == "03001234567"
async def test_create_order_snapshots_shipping_email(client, db_session):
    """Public checkout snapshots the contact email onto the Order as
    `shipping_email` so a later change to the Customer profile never rewrites
    which address each historical order is notified at."""
    from app.modules.customers.model import Customer

    product, variant = await _seed_product(db_session, stock=10)
    response = await client.post(
        "/api/v1/orders/create-order",
        json=_payload(product, variant, email="snapshot@example.com"),
    )
    assert response.status_code == 200
    order_id = response.json()["order_id"]

    db_session.expire_all()
    order = await _load_order(db_session, order_id)
    assert order.shipping_email == "snapshot@example.com"
    assert order.customer_email == "snapshot@example.com"

    # The linked customer matches, and the snapshot survives independently.
    customer = await db_session.get(Customer, order.customer_id)
    assert customer.email == "snapshot@example.com"


async def test_order_detail_returns_order_snapshot_not_customer_profile(client, db_session, auth_headers):
    """``GET /api/v1/orders/detail/{order_id}`` must report the ORDER's own
    checkout snapshot (shipping_name / shipping_phone / shipping_email), not the
    linked Customer profile, when a returning customer places an order with
    different checkout details than their archived profile."""
    from app.modules.customers.model import Customer

    product, variant = await _seed_product(db_session, stock=10)

    response = await client.post(
        "/api/v1/orders/create-order",
        json=_payload(
            product,
            variant,
            first_name="Ali",
            last_name="Raza",
            email="returning-detail@example.com",
            phone="03001234567",
            city="Lahore",
            shipping_address="Ali Raza | Phone: 03001234567 | 1 Street, Lahore, Pakistan",
            destination="Lahore",
        ),
    )
    assert response.status_code == 200

    # Second order, same email -> same customer, but different checkout details.
    second = await client.post(
        "/api/v1/orders/create-order",
        json=_payload(
            product,
            variant,
            quantity=2,
            first_name="Bilal",
            last_name="Khan",
            email="returning-detail@example.com",
            phone="03121234567",
            city="Karachi",
            shipping_address="House 9, Phase 4, Karachi, Pakistan",
            destination="Karachi",
        ),
    )
    assert second.status_code == 200
    second_order_id = second.json()["order_id"]

    # Fetch the order detail as the Leopards UI does.
    detail = await client.get(f"/api/v1/orders/detail/{second_order_id}", headers=auth_headers)
    assert detail.status_code == 200
    order_payload = detail.json()["order"]

    # The order's own checkout snapshot wins over the shared profile.
    assert order_payload["customer_name"] == "Bilal Khan"
    assert order_payload["customer_phone"] == "03121234567"
    assert order_payload["customer_email"] == "returning-detail@example.com"

    # Confirm the shared profile still holds the OLD values.
    db_session.expire_all()
    order = await _load_order(db_session, second_order_id)
    customer = await db_session.get(Customer, order.customer_id)
    assert customer.first_name == "Ali"
    assert customer.last_name == "Raza"
    assert customer.phone == "03001234567"
    assert customer.email == "returning-detail@example.com"


async def test_generate_cn_uses_order_snapshot_not_customer_profile(client, db_session, monkeypatch, auth_headers):
    """``POST /api/v1/orders/leopard/generate-cn`` must book the consignee using
    the ORDER's checkout snapshot (customer_name / customer_phone prefer
    shipping_name / shipping_phone), not the linked Customer profile."""
    from app.modules.customers.model import Customer
    from app.modules.orders import leopard_client

    product, variant = await _seed_product(db_session, stock=10)

    response = await client.post(
        "/api/v1/orders/create-order",
        json=_payload(
            product,
            variant,
            first_name="Ali",
            last_name="Raza",
            email="cn-returning@example.com",
            phone="03001234567",
            city="Lahore",
            shipping_address="Ali Raza | Phone: 03001234567 | 1 Street, Lahore, Pakistan",
            destination="Lahore",
        ),
    )
    assert response.status_code == 200
    second = await client.post(
        "/api/v1/orders/create-order",
        json=_payload(
            product,
            variant,
            quantity=2,
            first_name="Bilal",
            last_name="Khan",
            email="cn-returning@example.com",
            phone="03121234567",
            city="Karachi",
            shipping_address="House 9, Phase 4, Karachi, Pakistan",
            destination="Karachi",
        ),
    )
    assert second.status_code == 200
    second_order_id = second.json()["order_id"]

    captured = {}

    async def _fake_cn_list():
        return [{"cn_with_prefix": "CN-TEST-0001", "cn_without_prefix": "0001"}]

    async def _fake_book_packet_api(payload):
        captured.update(payload)
        return {"status": 1, "track_number": "CN-TEST-0001"}

    monkeypatch.setattr(leopard_client, "cn_list", _fake_cn_list)
    monkeypatch.setattr(leopard_client, "book_packet_api", _fake_book_packet_api)

    response = await client.post(
        "/api/v1/orders/leopard/generate-cn",
        json={"order_ids": [second_order_id]},
        headers=auth_headers,
    )
    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "success"

    # Consignee details must come from the order snapshot (Bilal), NOT the
    # shared profile (Ali).
    assert captured["consignee_name"] == "Bilal Khan"
    assert captured["consignee_phone"] == "03121234567"

    # The shared profile still holds the old values.
    db_session.expire_all()
    order = await _load_order(db_session, second_order_id)
    customer = await db_session.get(Customer, order.customer_id)
    assert customer.first_name == "Ali"
    assert customer.phone == "03001234567"


async def test_mark_paid_updates_payment_state_no_customer_email(client, db_session, monkeypatch, auth_headers):
    """``POST /api/v1/orders/mark-paid/{order_id}`` must mark the order as Paid
    in the database and persist a timeline event WITHOUT sending any customer
    email/notification (the `order_paid` dispatch was intentionally removed)."""
    from app.modules.customers.model import Customer
    from app.modules.settings.notifications import service as notif_service

    product, variant = await _seed_product(db_session, stock=10)

    first = await client.post(
        "/api/v1/orders/create-order",
        json=_payload(
            product,
            variant,
            first_name="Ali",
            last_name="Raza",
            email="paid-returning@example.com",
            phone="03001234567",
            city="Lahore",
            shipping_address="Ali Raza | Phone: 03001234567 | 1 Street, Lahore, Pakistan",
            destination="Lahore",
        ),
    )
    assert first.status_code == 200
    second = await client.post(
        "/api/v1/orders/create-order",
        json=_payload(
            product,
            variant,
            quantity=2,
            first_name="Bilal",
            last_name="Khan",
            email="paid-returning@example.com",
            phone="03121234567",
            city="Karachi",
            shipping_address="House 9, Phase 4, Karachi, Pakistan",
            destination="Karachi",
        ),
    )
    assert second.status_code == 200
    second_order_id = second.json()["order_id"]

    captured = {}

    async def _fake_dispatch(event_type, payload):
        captured["event_type"] = event_type
        captured.update(payload)

    monkeypatch.setattr(notif_service, "background_dispatch_event", _fake_dispatch)

    response = await client.post(f"/api/v1/orders/mark-paid/{second_order_id}", headers=auth_headers)
    assert response.status_code == 200
    assert response.json()["payment_status"] == "paid"

    # Order payment state is actually updated in the database.
    db_session.expire_all()
    order = await _load_order(db_session, second_order_id)
    assert order.payment_status.value == "paid"
    assert order.paid_amount == order.total_price

    # No customer notification/email may be dispatched for Mark as Paid.
    assert captured == {}

    # The shared profile still holds the old values (order used its own snapshot).
    db_session.expire_all()
    order = await _load_order(db_session, second_order_id)
    customer = await db_session.get(Customer, order.customer_id)
    assert customer.first_name == "Ali"
    assert customer.phone == "03001234567"


async def test_mark_delivered_notification_uses_order_snapshot(client, db_session, monkeypatch, auth_headers):
    """``POST /api/v1/orders/mark-delivered/{order_id}`` must notify using the
    ORDER's checkout snapshot (customer_name), not the shared Customer
    profile. The order is first placed in a valid pre-delivery state
    (``in_transit``) because ``pending -> delivered`` is intentionally rejected.
    """
    from app.modules.customers.model import Customer
    from app.modules.orders.model import DeliveryStatus
    from app.modules.settings.notifications import service as notif_service

    product, variant = await _seed_product(db_session, stock=10)

    first = await client.post(
        "/api/v1/orders/create-order",
        json=_payload(
            product,
            variant,
            first_name="Ali",
            last_name="Raza",
            email="del-returning@example.com",
            phone="03001234567",
            city="Lahore",
            shipping_address="Ali Raza | Phone: 03001234567 | 1 Street, Lahore, Pakistan",
            destination="Lahore",
        ),
    )
    assert first.status_code == 200
    second = await client.post(
        "/api/v1/orders/create-order",
        json=_payload(
            product,
            variant,
            quantity=2,
            first_name="Bilal",
            last_name="Khan",
            email="del-returning@example.com",
            phone="03121234567",
            city="Karachi",
            shipping_address="House 9, Phase 4, Karachi, Pakistan",
            destination="Karachi",
        ),
    )
    assert second.status_code == 200
    second_order_id = second.json()["order_id"]

    # Place the order in a valid pre-delivery source state; `pending->delivered`
    # is intentionally disallowed, so move it to in_transit first.
    order = await _load_order(db_session, second_order_id)
    order.delivery_status = DeliveryStatus.in_transit
    await db_session.commit()

    captured = {}

    async def _fake_dispatch(event_type, payload):
        captured["event_type"] = event_type
        captured.update(payload)

    monkeypatch.setattr(notif_service, "background_dispatch_event", _fake_dispatch)

    response = await client.post(f"/api/v1/orders/mark-delivered/{second_order_id}", headers=auth_headers)
    assert response.status_code == 200

    # Notification must use the order's checkout snapshot (Bilal).
    assert captured["event_type"] == "order_delivered"
    assert captured["customer_name"] == "Bilal Khan"
    assert captured["customer_email"] == "del-returning@example.com"

    # The shared profile still holds the old values.
    db_session.expire_all()
    order = await _load_order(db_session, second_order_id)
    customer = await db_session.get(Customer, order.customer_id)
    assert customer.first_name == "Ali"
    assert customer.phone == "03001234567"


async def test_mark_out_for_delivery_uses_order_snapshot_and_emails(client, db_session, monkeypatch, auth_headers):
    """``POST /api/v1/orders/mark-out-for-delivery/{order_id}`` must set the
    delivery status, dispatch the order_out_for_delivery email using the ORDER's
    checkout snapshot, and write an audit-log entry."""
    from app.modules.customers.model import Customer
    from app.modules.orders.model import DeliveryStatus, OrderAuditLog
    from app.modules.settings.notifications import service as notif_service

    product, variant = await _seed_product(db_session, stock=10)

    response = await client.post(
        "/api/v1/orders/create-order",
        json=_payload(
            product,
            variant,
            first_name="Ali",
            last_name="Raza",
            email="ofd-returning@example.com",
            phone="03001234567",
            city="Lahore",
            shipping_address="Ali Raza | Phone: 03001234567 | 1 Street, Lahore, Pakistan",
            destination="Lahore",
        ),
    )
    assert response.status_code == 200
    second = await client.post(
        "/api/v1/orders/create-order",
        json=_payload(
            product,
            variant,
            quantity=2,
            first_name="Bilal",
            last_name="Khan",
            email="ofd-returning@example.com",
            phone="03121234567",
            city="Karachi",
            shipping_address="House 9, Phase 4, Karachi, Pakistan",
            destination="Karachi",
        ),
    )
    assert second.status_code == 200
    second_order_id = second.json()["order_id"]

    # Place the order in a valid source state for "out for delivery"
    # (booked / picked_up / in_transit); `pending -> out_for_delivery` is
    # intentionally disallowed, so move it to in_transit first.
    order = await _load_order(db_session, second_order_id)
    order.delivery_status = DeliveryStatus.in_transit
    await db_session.commit()

    captured = {}

    async def _fake_dispatch(event_type, payload):
        captured["event_type"] = event_type
        captured.update(payload)

    monkeypatch.setattr(notif_service, "background_dispatch_event", _fake_dispatch)

    response = await client.post(f"/api/v1/orders/mark-out-for-delivery/{second_order_id}", headers=auth_headers)
    assert response.status_code == 200
    assert response.json()["delivery_status"] == "out_for_delivery"

    # Notification must use the order's checkout snapshot (Bilal), not the
    # shared profile (Ali).
    assert captured["event_type"] == "order_out_for_delivery"
    assert captured["customer_name"] == "Bilal Khan"
    assert captured["customer_email"] == "ofd-returning@example.com"

    # Delivery status on the order is out_for_delivery.
    db_session.expire_all()
    order = await _load_order(db_session, second_order_id)
    assert order.delivery_status == DeliveryStatus.out_for_delivery

    # An audit-log entry was written.
    log_result = await db_session.execute(
        select(OrderAuditLog).where(OrderAuditLog.order_id == second_order_id)
    )
    logs = log_result.scalars().all()
    assert any(log.event_type == "delivery_updated" for log in logs)

    # The shared profile still holds the old values.
    customer = await db_session.get(Customer, order.customer_id)
    assert customer.first_name == "Ali"
    assert customer.phone == "03001234567"
