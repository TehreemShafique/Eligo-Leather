"""Tests for ``app.modules.orders.model``."""

from decimal import Decimal

from app.db.base import Base
from app.modules.orders.model import (
    PaymentStatus,
    FulfillmentStatus,
    DeliveryStatus,
    DeliveryMethod,
    ReturnStatus,
    LabelStatus,
    DraftOrderStatus,
    RecoveryStatus,
    AuditEventType,
    Order,
    OrderItem,
    OrderNote,
    OrderAuditLog,
    DraftOrder,
    DraftOrderItem,
    AbandonedCheckout,
    AbandonedCheckoutItem,
)


def test_order_tables_registered():
    tables = Base.metadata.tables
    for name in [
        "orders",
        "order_items",
        "order_notes",
        "order_audit_logs",
        "draft_orders",
        "draft_order_items",
        "abandoned_checkouts",
        "abandoned_checkout_items",
    ]:
        assert name in tables


def test_order_columns():
    cols = Base.metadata.tables["orders"].columns.keys()
    for name in [
        "id",
        "order_number",
        "customer_id",
        "channel",
        "currency",
        "subtotal",
        "shipping_cost",
        "tax",
        "total_price",
        "paid_amount",
        "payment_status",
        "fulfillment_status",
        "delivery_status",
        "delivery_method",
        "return_status",
        "label_status",
        "is_archived",
        "created_at",
        "updated_at",
    ]:
        assert name in cols


def test_order_number_unique_and_indexed():
    col = Base.metadata.tables["orders"].c["order_number"]
    assert col.unique is True
    assert col.index is True


def test_order_item_columns():
    cols = Base.metadata.tables["order_items"].columns.keys()
    for name in [
        "id",
        "order_id",
        "product_name",
        "quantity",
        "unit_price",
        "total_price",
        "restocked",
    ]:
        assert name in cols


def test_order_note_and_audit_columns():
    note_cols = Base.metadata.tables["order_notes"].columns.keys()
    audit_cols = Base.metadata.tables["order_audit_logs"].columns.keys()
    assert "order_id" in note_cols and "body" in note_cols
    assert "event_type" in audit_cols and "description" in audit_cols


def test_draft_order_and_checkout_tables():
    tables = Base.metadata.tables
    draft_cols = tables["draft_orders"].columns.keys()
    assert "draft_number" in draft_cols
    assert tables["draft_orders"].c["draft_number"].unique is True
    assert tables["abandoned_checkouts"].c["checkout_reference"].unique is True


def test_enum_values():
    assert {e.value for e in PaymentStatus} == {
        "paid", "pending", "voided", "refunded", "partially_paid",
    }
    assert {e.value for e in FulfillmentStatus} == {
        "fulfilled", "unfulfilled", "partial", "scheduled",
    }
    assert {e.value for e in DeliveryStatus} == {
        "pending", "in_transit", "out_for_delivery", "delivered", "failed", "returned",
    }
    assert {e.value for e in DeliveryMethod} == {"standard", "express", "pickup"}
    assert {e.value for e in ReturnStatus} == {
        "none", "requested", "approved", "received", "refunded",
    }
    assert {e.value for e in LabelStatus} == {"not_generated", "generated", "printed"}
    assert {e.value for e in DraftOrderStatus} == {
        "open", "invoice_sent", "completed", "cancelled",
    }
    assert {e.value for e in RecoveryStatus} == {
        "not_sent", "email_sent", "recovered", "lost",
    }
    assert {e.value for e in AuditEventType} >= {
        "order_created", "return_requested", "order_archived",
    }


async def test_order_defaults_on_insert(db_session):
    order = Order(order_number="ORD-DEFAULT")
    db_session.add(order)
    await db_session.commit()
    await db_session.refresh(order)

    assert order.payment_status == PaymentStatus.pending
    assert order.fulfillment_status == FulfillmentStatus.unfulfilled
    assert order.delivery_status == DeliveryStatus.pending
    assert order.delivery_method == DeliveryMethod.standard
    assert order.return_status == ReturnStatus.none
    assert order.label_status == LabelStatus.not_generated
    assert order.is_archived is False
    assert order.channel == "Online Store"
    assert order.currency == "PKR"
    assert order.subtotal == 0
    assert order.shipping_cost == 0
    assert order.tax == 0
    assert order.total_price == 0
    assert order.paid_amount == 0


async def test_order_item_cascade_on_insert(db_session):
    order = Order(
        order_number="ORD-ITEMS",
        items=[
            OrderItem(
                product_name="Leather Belt",
                unit_price=Decimal("10.00"),
                quantity=2,
                total_price=Decimal("20.00"),
            ),
            OrderItem(
                product_name="Leather Wallet",
                unit_price=Decimal("25.00"),
                quantity=1,
                total_price=Decimal("25.00"),
            ),
        ],
    )
    db_session.add(order)
    await db_session.commit()
    await db_session.refresh(order, attribute_names=["items"])

    assert len(order.items) == 2
    assert order.items[0].product_name == "Leather Belt"
    assert order.items[0].quantity == 2
    assert order.items[0].requires_shipping is True


async def test_order_note_insert(db_session):
    order = Order(order_number="ORD-NOTE")
    db_session.add(order)
    await db_session.commit()
    await db_session.refresh(order)

    note = OrderNote(order_id=order.id, body="Please gift wrap", is_customer_visible=True)
    db_session.add(note)
    await db_session.commit()
    await db_session.refresh(note)

    assert note.id is not None
    assert note.body == "Please gift wrap"
    assert note.is_customer_visible is True
    assert note.created_at is not None


async def test_audit_log_insert(db_session):
    order = Order(order_number="ORD-AUDIT")
    db_session.add(order)
    await db_session.commit()
    await db_session.refresh(order)

    log = OrderAuditLog(
        order_id=order.id,
        event_type="order_created",
        description="Order ORD-AUDIT created",
    )
    db_session.add(log)
    await db_session.commit()
    await db_session.refresh(log)

    assert log.event_type == "order_created"
    assert log.description == "Order ORD-AUDIT created"


async def test_draft_order_insert_with_defaults(db_session):
    draft = DraftOrder(
        draft_number="DRAFT-1",
        items=[
            DraftOrderItem(
                product_name="Leather Belt",
                unit_price=Decimal("10.00"),
                quantity=1,
                total_price=Decimal("10.00"),
            )
        ],
    )
    db_session.add(draft)
    await db_session.commit()
    await db_session.refresh(draft, attribute_names=["items"])

    assert draft.status == DraftOrderStatus.open
    assert draft.currency == "PKR"
    assert len(draft.items) == 1
    assert draft.items[0].is_custom is False


async def test_abandoned_checkout_insert_with_defaults(db_session):
    checkout = AbandonedCheckout(
        checkout_reference="CHK-1",
        total_price=Decimal("75.00"),
        items=[
            AbandonedCheckoutItem(
                product_name="Leather Belt",
                unit_price=Decimal("75.00"),
                quantity=1,
                total_price=Decimal("75.00"),
            )
        ],
    )
    db_session.add(checkout)
    await db_session.commit()
    await db_session.refresh(checkout, attribute_names=["items"])

    assert checkout.recovery_status == RecoveryStatus.not_sent
    assert checkout.recovery_attempts == 0
    assert len(checkout.items) == 1
