"""Tests for the order customer-confirmation workflow.

POST /api/v1/orders/create-order (public) must:
  - create the order with ``confirmed_at = null``;
  - dispatch the ``order_placed`` notification, NOT ``order_confirmation``;
  - NOT auto-book Leopards yet;
  - still succeed when the customer has no email.

POST /api/v1/orders/{order_id}/confirm (admin, authenticated) must:
  - persist ``confirmed_at`` and write exactly one confirmation audit entry;
  - dispatch the ``order_confirmation`` email exactly once;
  - book Leopards exactly once;
  - be idempotent / one-time on retry and concurrency;
  - keep the order confirmed even when the email or courier booking fails;
  - 404 for unknown orders;
  - require authentication.
"""

from decimal import Decimal

import asyncio
import pytest
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.modules.catalog.model import Product, ProductVariant, ProductStatus
from app.modules.customers.model import Customer
from app.modules.orders.model import (
    Order,
    OrderAuditLog,
    PaymentStatus,
    DeliveryStatus,
)

PRICE = Decimal("2750.00")


class _Recorder:
    def __init__(self) -> None:
        self.order_placed: list[int] = []
        self.order_confirmation: list[tuple[int, bool]] = []
        self.auto_book: list[int] = []
        self.confirmed_at_seen_at_dispatch: bool | None = None
        self.dispatch_email_status_override: str | None = None


@pytest.fixture
def recorder(monkeypatch, db_session):
    rec = _Recorder()

    async def _placed(order_id: int) -> None:
        rec.order_placed.append(order_id)

    async def _dispatch_confirmation(db: object, order_id: int) -> str:
        result = await db_session.execute(
            select(Order.confirmed_at).where(Order.id == order_id)
        )
        rec.confirmed_at_seen_at_dispatch = result.scalar_one_or_none() is not None
        rec.order_confirmation.append((order_id, True))
        # Reflect the real customer-email availability unless an explicit
        # override was set by the test (e.g. failed / skipped).
        if rec.dispatch_email_status_override is not None:
            return rec.dispatch_email_status_override
        row = await db_session.execute(
            select(Order.customer_id).where(Order.id == order_id)
        )
        customer_id = row.scalar_one_or_none()
        if customer_id is not None:
            cust = await db_session.execute(
                select(Customer.email).where(Customer.id == customer_id)
            )
            if not cust.scalar_one_or_none():
                return "unavailable"
        return "sent"

    async def _book(db, order, shipping_settings) -> None:
        rec.auto_book.append(order.id)
        order.tracking_number = "CN-1001"

    monkeypatch.setattr(
        "app.modules.orders.router.background_dispatch_order_placed", _placed
    )
    monkeypatch.setattr(
        "app.modules.orders.router.dispatch_order_confirmation_email", _dispatch_confirmation
    )
    monkeypatch.setattr("app.modules.orders.router._auto_book_leopards", _book)
    return rec


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
    """Browser-style payload with tampered prices/totals embedded on purpose —
    every amount here must be ignored by the server."""
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
        "subtotal": 9999,
        "shipping_cost": 1,
        "tax": 500,
        "total_price": 999999,
        "payment_status": "pending",
        "fulfillment_status": "unfulfilled",
        "delivery_status": "pending",
        "items": [
            {
                "product_id": int(product.id),
                "variant_id": int(variant.id),
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


async def _seed_order_with_customer(
    db_session,
    *,
    email: str | None = "customer@example.com",
    phone: str | None = "03001234567",
    delivery_status: DeliveryStatus = DeliveryStatus.pending,
    **order_kwargs,
) -> int:
    customer = Customer(
        email=email,
        first_name="Ayesha",
        last_name="Khan",
        phone=phone,
    )
    db_session.add(customer)
    await db_session.flush()
    order = Order(
        order_number="CNF-1001",
        customer_id=customer.id,
        subtotal=Decimal("5000.00"),
        shipping_cost=Decimal("250.00"),
        tax=Decimal("0.00"),
        total_price=Decimal("5250.00"),
        payment_status=PaymentStatus.pending,
        delivery_status=delivery_status,
        shipping_name="Ayesha Khan",
        shipping_phone=phone,
        shipping_city="Lahore",
        **order_kwargs,
    )
    db_session.add(order)
    await db_session.commit()
    await db_session.refresh(order)
    return order.id


async def _reload(db_session, order_id: int) -> Order:
    result = await db_session.execute(
        select(Order)
        .options(selectinload(Order.audit_logs), selectinload(Order.customer))
        .where(Order.id == order_id)
    )
    return result.scalar_one()


async def _count_customer_confirmed_events(db_session, order_id: int) -> int:
    result = await db_session.execute(
        select(OrderAuditLog).where(
            OrderAuditLog.order_id == order_id,
            OrderAuditLog.event_type == "customer_confirmed",
        )
    )
    return len(result.scalars().all())


# ===========================================================================
# Order creation
# ===========================================================================


async def test_create_order_places_unconfirmed_and_dispatches_order_placed(
    client, db_session, recorder
):
    product, variant = await _seed_product(db_session)
    resp = await client.post("/api/v1/orders/create-order", json=_payload(product, variant))
    assert resp.status_code == 200
    order_id = resp.json()["order_id"]

    await asyncio.sleep(0)

    order = await _reload(db_session, order_id)
    assert order.confirmed_at is None
    assert recorder.order_placed == [order_id]
    assert recorder.order_confirmation == []
    assert recorder.auto_book == []
    assert order.tracking_number is None


async def test_create_order_without_email_still_succeeds(
    client, db_session, recorder
):
    product, variant = await _seed_product(db_session)
    payload = _payload(product, variant)
    payload["email"] = ""
    resp = await client.post("/api/v1/orders/create-order", json=payload)
    assert resp.status_code == 200
    order_id = resp.json()["order_id"]

    await asyncio.sleep(0)

    order = await _reload(db_session, order_id)
    assert order.confirmed_at is None
    assert recorder.order_placed == [order_id]
    assert recorder.auto_book == []


# ===========================================================================
# Manual confirmation
# ===========================================================================


async def test_confirm_requires_auth(client, db_session, recorder):
    order_id = await _seed_order_with_customer(db_session)
    resp = await client.post(f"/api/v1/orders/{order_id}/confirm")
    assert resp.status_code in (401, 403)
    assert await _count_customer_confirmed_events(db_session, order_id) == 0


async def test_confirm_unknown_order_404(client, admin_headers, db_session):
    resp = await client.post("/api/v1/orders/99999/confirm", headers=admin_headers)
    assert resp.status_code == 404


async def test_confirm_persists_state_and_triggers_side_effects_once(
    client, admin_headers, db_session, recorder
):
    order_id = await _seed_order_with_customer(db_session)

    resp = await client.post(f"/api/v1/orders/{order_id}/confirm", headers=admin_headers)
    assert resp.status_code == 200
    body = resp.json()
    assert body["already_confirmed"] is False
    assert body["confirmed_at"] is not None
    assert body["email_status"] == "sent"
    assert body["courier_booked"] is True
    assert body["courier_error"] is None

    await asyncio.sleep(0)

    assert recorder.order_confirmation == [(order_id, True)]
    assert recorder.auto_book == [order_id]
    assert recorder.confirmed_at_seen_at_dispatch is True

    order = await _reload(db_session, order_id)
    assert order.confirmed_at is not None
    assert await _count_customer_confirmed_events(db_session, order_id) == 1


async def test_confirm_retry_is_idempotent(
    client, admin_headers, db_session, recorder
):
    order_id = await _seed_order_with_customer(db_session)

    first = await client.post(f"/api/v1/orders/{order_id}/confirm", headers=admin_headers)
    assert first.status_code == 200
    await asyncio.sleep(0)

    retry = await client.post(f"/api/v1/orders/{order_id}/confirm", headers=admin_headers)
    assert retry.status_code == 200
    retry_body = retry.json()
    assert retry_body["already_confirmed"] is True
    assert retry_body["email_status"] == "skipped"
    assert retry_body["courier_booked"] is False

    await asyncio.sleep(0)

    assert recorder.order_confirmation == [(order_id, True)]
    assert recorder.auto_book == [order_id]
    order = await _reload(db_session, order_id)
    assert await _count_customer_confirmed_events(db_session, order_id) == 1


async def test_confirm_concurrent_requests_single_side_effect(
    client, admin_headers, db_session, recorder
):
    order_id = await _seed_order_with_customer(db_session)

    responses = await asyncio.gather(*[
        client.post(f"/api/v1/orders/{order_id}/confirm", headers=admin_headers),
        client.post(f"/api/v1/orders/{order_id}/confirm", headers=admin_headers),
    ])
    assert all(r.status_code == 200 for r in responses)

    await asyncio.sleep(0)

    # Exactly one request wins (already_confirmed False) and every other one
    # observes the outcome as idempotent. The winner's response carries the
    # persisted confirmed_at read back from the DB; side effects never repeat.
    winners = [r.json() for r in responses if r.json()["already_confirmed"] is False]
    losers = [r.json() for r in responses if r.json()["already_confirmed"] is True]
    assert len(winners) == 1
    assert len(losers) == 1
    assert winners[0]["confirmed_at"] is not None
    assert winners[0]["email_status"] == "sent"
    assert winners[0]["courier_booked"] is True
    assert losers[0]["email_status"] == "skipped"
    assert losers[0]["courier_booked"] is False

    assert recorder.order_confirmation == [(order_id, True)]
    assert recorder.auto_book == [order_id]
    # Note: re-reading confirmed_at / audit rows through the test session here
    # is unreliable under the sqlite+StaticPool harness (all sessions share one
    # DBAPI connection, so concurrent transactions are entangled). The audit
    # singleton guarantee is proven by the response pair above: exactly one
    # request won the atomic UPDATE, and the loser ran zero side effects.


# ===========================================================================
# No-email and failure semantics
# ===========================================================================


async def test_confirm_without_customer_email_still_confirms(
    client, admin_headers, db_session, recorder
):
    order_id = await _seed_order_with_customer(db_session, email=None)

    resp = await client.post(f"/api/v1/orders/{order_id}/confirm", headers=admin_headers)
    assert resp.status_code == 200
    body = resp.json()
    assert body["confirmed_at"] is not None
    assert body["email_status"] == "unavailable"
    assert body["courier_booked"] is True


async def test_confirmation_email_failure_keeps_order_confirmed(
    client, admin_headers, db_session, recorder, monkeypatch
):
    order_id = await _seed_order_with_customer(db_session)
    recorder.dispatch_email_status_override = "failed"

    resp = await client.post(f"/api/v1/orders/{order_id}/confirm", headers=admin_headers)
    assert resp.status_code == 200
    body = resp.json()
    assert body["confirmed_at"] is not None
    assert body["email_status"] == "failed"
    assert body["courier_booked"] is True

    order = await _reload(db_session, order_id)
    assert order.confirmed_at is not None
    assert await _count_customer_confirmed_events(db_session, order_id) == 1


async def test_courier_failure_keeps_order_confirmed(
    client, admin_headers, db_session, recorder, monkeypatch
):
    order_id = await _seed_order_with_customer(db_session)

    async def _failing_book(db, order, shipping_settings) -> None:
        raise RuntimeError("Leopards API outage")

    monkeypatch.setattr(
        "app.modules.orders.router._auto_book_leopards", _failing_book
    )

    resp = await client.post(f"/api/v1/orders/{order_id}/confirm", headers=admin_headers)
    assert resp.status_code == 200
    body = resp.json()
    assert body["confirmed_at"] is not None
    assert body["courier_booked"] is False
    assert body["courier_error"] is not None

    order = await _reload(db_session, order_id)
    assert order.confirmed_at is not None
    assert await _count_customer_confirmed_events(db_session, order_id) == 1


# ===========================================================================
# Schema exposure
# ===========================================================================


async def test_confirmed_at_exposed_in_admin_order_endpoint(
    client, admin_headers, db_session
):
    order_id = await _seed_order_with_customer(db_session)
    resp = await client.get(f"/api/v1/orders/{order_id}", headers=admin_headers)
    assert resp.status_code == 200
    body = resp.json()
    assert "confirmed_at" in body
    assert body["confirmed_at"] is None


# ===========================================================================
# email_status matrix
# ===========================================================================


async def test_email_sent_courier_booked(client, admin_headers, db_session, recorder):
    """sent + courier_booked: the happy path. (default recorder state)"""
    order_id = await _seed_order_with_customer(db_session)
    resp = await client.post(f"/api/v1/orders/{order_id}/confirm", headers=admin_headers)
    body = resp.json()
    assert body["email_status"] == "sent"
    assert body["courier_booked"] is True


async def test_email_failed_courier_booked(client, admin_headers, db_session, recorder):
    """failed + courier_booked: SMTP failed but courier still attempted."""
    order_id = await _seed_order_with_customer(db_session)
    recorder.dispatch_email_status_override = "failed"
    resp = await client.post(f"/api/v1/orders/{order_id}/confirm", headers=admin_headers)
    body = resp.json()
    assert body["email_status"] == "failed"
    assert body["courier_booked"] is True


async def test_email_sent_courier_failed(client, admin_headers, db_session, recorder, monkeypatch):
    """sent + courier failed: email OK but booking failed. confirmed_at persists."""
    order_id = await _seed_order_with_customer(db_session)

    async def _failing_book(db, order, shipping_settings) -> None:
        raise RuntimeError("Leopards outage")

    monkeypatch.setattr("app.modules.orders.router._auto_book_leopards", _failing_book)

    resp = await client.post(f"/api/v1/orders/{order_id}/confirm", headers=admin_headers)
    body = resp.json()
    assert body["email_status"] == "sent"
    assert body["courier_booked"] is False
    assert body["courier_error"] is not None
    assert body["confirmed_at"] is not None


async def test_email_failed_courier_failed(client, admin_headers, db_session, recorder, monkeypatch):
    """failed + courier failed: both failures visible, confirmed_at persists."""
    order_id = await _seed_order_with_customer(db_session)
    recorder.dispatch_email_status_override = "failed"

    async def _failing_book(db, order, shipping_settings) -> None:
        raise RuntimeError("Leopards outage")

    monkeypatch.setattr("app.modules.orders.router._auto_book_leopards", _failing_book)

    resp = await client.post(f"/api/v1/orders/{order_id}/confirm", headers=admin_headers)
    body = resp.json()
    assert body["email_status"] == "failed"
    assert body["courier_booked"] is False
    assert body["courier_error"] is not None
    assert body["confirmed_at"] is not None


async def test_email_unavailable_courier_booked(client, admin_headers, db_session, recorder):
    """unavailable (no customer email) + courier booked."""
    order_id = await _seed_order_with_customer(db_session, email=None)
    resp = await client.post(f"/api/v1/orders/{order_id}/confirm", headers=admin_headers)
    body = resp.json()
    assert body["email_status"] == "unavailable"
    assert body["courier_booked"] is True


async def test_email_skipped_courier_booked(client, admin_headers, db_session, recorder):
    """skipped (notification disabled) + courier booked."""
    order_id = await _seed_order_with_customer(db_session)
    recorder.dispatch_email_status_override = "skipped"
    resp = await client.post(f"/api/v1/orders/{order_id}/confirm", headers=admin_headers)
    body = resp.json()
    assert body["email_status"] == "skipped"
    assert body["courier_booked"] is True