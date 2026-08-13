"""Tests for ``app.modules.orders.service``."""

from decimal import Decimal

import pytest

from app.modules.orders.model import (
    Order,
    OrderItem,
    PaymentStatus,
    FulfillmentStatus,
    ReturnStatus,
    RecoveryStatus,
    DraftOrder,
    AbandonedCheckout,
)
from app.modules.orders.schema import (
    OrderCreate,
    OrderItemCreate,
    OrderUpdate,
    OrderNoteCreate,
    DraftOrderCreate,
    DraftOrderItemCreate,
    DraftOrderUpdate,
    AbandonedCheckoutCreate,
    AbandonedCheckoutUpdate,
)
from app.modules.orders import service


async def _seed_order(db_session, order_number="ORD-SEED", **kwargs):
    order = Order(
        order_number=order_number,
        items=[
            OrderItem(
                product_name="Leather Belt",
                unit_price=Decimal("10.00"),
                quantity=2,
                total_price=Decimal("20.00"),
                variant_id=1,
            )
        ],
        **kwargs,
    )
    db_session.add(order)
    await db_session.commit()
    return order


# ---------------------------------------------------------------------------
# create_order (known backend bug: `location_id` is passed to the Order
# constructor but the model has no such column -> TypeError -> 500).
# ---------------------------------------------------------------------------


@pytest.mark.xfail(
    strict=True,
    reason="Backend bug: create_order passes location_id to Order() (service.py:56) but Order has no location_id column",
)
async def test_create_order_computes_totals(db_session):
    data = OrderCreate(
        order_number="ORD-1001",
        channel="Online Store",
        shipping_cost=Decimal("5.00"),
        tax=Decimal("1.00"),
        items=[
            OrderItemCreate(
                product_name="Leather Belt",
                unit_price=Decimal("10.00"),
                quantity=2,
            )
        ],
    )
    order = await service.create_order(db_session, data)
    assert order.order_number == "ORD-1001"
    assert order.subtotal == Decimal("20.00")
    assert order.total_price == Decimal("26.00")
    assert len(order.items) == 1


# ---------------------------------------------------------------------------
# get / list / update / archive
# ---------------------------------------------------------------------------


async def test_get_order_returns_entity(db_session):
    seeded = await _seed_order(db_session, order_number="ORD-GET")
    order = await service.get_order(db_session, seeded.id)
    assert order is not None
    assert order.order_number == "ORD-GET"
    assert len(order.items) == 1


async def test_get_order_missing_returns_none(db_session):
    assert await service.get_order(db_session, 9999) is None


async def test_list_orders_empty(db_session):
    assert await service.list_orders(db_session) == []


async def test_list_orders_filters_by_archived_and_channel(db_session):
    await _seed_order(db_session, order_number="ORD-OPEN", channel="Online Store")
    await _seed_order(db_session, order_number="ORD-ARCHIVED", channel="POS", is_archived=True)

    result = await service.list_orders(db_session, is_archived=False)
    assert [o.order_number for o in result] == ["ORD-OPEN"]

    result = await service.list_orders(db_session, is_archived=True)
    assert [o.order_number for o in result] == ["ORD-ARCHIVED"]

    result = await service.list_orders(db_session, channel="POS")
    assert [o.order_number for o in result] == ["ORD-ARCHIVED"]


async def test_list_orders_search(db_session):
    await _seed_order(db_session, order_number="ORD-1001", tags="priority")
    await _seed_order(db_session, order_number="ORD-1002")

    result = await service.list_orders(db_session, search="priority")
    assert [o.order_number for o in result] == ["ORD-1001"]

    result = await service.list_orders(db_session, search="ORD-1002")
    assert [o.order_number for o in result] == ["ORD-1002"]


async def test_update_order_changes_field_and_logs_audit(db_session):
    seeded = await _seed_order(db_session)
    updated = await service.update_order(
        db_session, seeded.id, OrderUpdate(payment_status=PaymentStatus.paid)
    )
    assert updated.payment_status == PaymentStatus.paid

    logs = await service.list_order_audit_logs(db_session, seeded.id)
    assert any(log.event_type == "status_changed" for log in logs)


async def test_update_order_missing_returns_none(db_session):
    assert await service.update_order(db_session, 9999, OrderUpdate()) is None


async def test_archive_order(db_session):
    seeded = await _seed_order(db_session)
    archived = await service.archive_order(db_session, seeded.id)
    assert archived is not None
    assert archived.is_archived is True


async def test_archive_order_missing_returns_none(db_session):
    assert await service.archive_order(db_session, 9999) is None


async def test_restock_order_items_marks_items_restocked(db_session):
    seeded = await _seed_order(db_session, return_status=ReturnStatus.approved)
    order = await service.restock_order_items(db_session, seeded.id)
    assert order is not None
    assert order.items[0].restocked is True
    assert order.return_status == ReturnStatus.none


async def test_restock_order_items_missing_returns_none(db_session):
    assert await service.restock_order_items(db_session, 9999) is None


# ---------------------------------------------------------------------------
# Returns / RMA
# ---------------------------------------------------------------------------


async def test_return_flow(db_session):
    seeded = await _seed_order(db_session)

    requested = await service.request_return(db_session, seeded.id)
    assert requested.return_status == ReturnStatus.requested

    approved = await service.approve_return(db_session, seeded.id)
    assert approved.return_status == ReturnStatus.approved

    received = await service.receive_return(db_session, seeded.id)
    assert received.return_status == ReturnStatus.received


async def test_return_flow_missing_returns_none(db_session):
    assert await service.request_return(db_session, 9999) is None
    assert await service.approve_return(db_session, 9999) is None
    assert await service.receive_return(db_session, 9999) is None


# ---------------------------------------------------------------------------
# Order notes
# ---------------------------------------------------------------------------


async def test_add_order_note(db_session):
    seeded = await _seed_order(db_session)
    note = await service.add_order_note(
        db_session, seeded.id, OrderNoteCreate(body="Please gift wrap", is_customer_visible=True)
    )
    assert note is not None
    assert note.body == "Please gift wrap"
    assert note.is_customer_visible is True


async def test_add_order_note_missing_order_returns_none(db_session):
    assert await service.add_order_note(db_session, 9999, OrderNoteCreate(body="hi")) is None


async def test_list_order_notes(db_session):
    seeded = await _seed_order(db_session)
    await service.add_order_note(db_session, seeded.id, OrderNoteCreate(body="first"))
    await service.add_order_note(db_session, seeded.id, OrderNoteCreate(body="second"))

    notes = await service.list_order_notes(db_session, seeded.id)
    assert {n.body for n in notes} == {"first", "second"}


async def test_update_order_note(db_session):
    seeded = await _seed_order(db_session)
    note = await service.add_order_note(db_session, seeded.id, OrderNoteCreate(body="old"))
    updated = await service.update_order_note(db_session, note.id, "new body")
    assert updated is not None
    assert updated.body == "new body"


async def test_update_order_note_missing_returns_none(db_session):
    assert await service.update_order_note(db_session, 9999, "x") is None


async def test_delete_order_note(db_session):
    seeded = await _seed_order(db_session)
    note = await service.add_order_note(db_session, seeded.id, OrderNoteCreate(body="temp"))
    assert await service.delete_order_note(db_session, note.id) is True
    assert await service.delete_order_note(db_session, note.id) is False


# ---------------------------------------------------------------------------
# Audit log + analytics
# ---------------------------------------------------------------------------


async def test_list_order_audit_logs(db_session):
    seeded = await _seed_order(db_session)
    await service.archive_order(db_session, seeded.id)
    logs = await service.list_order_audit_logs(db_session, seeded.id)
    assert any(log.event_type == "order_archived" for log in logs)


async def test_orders_analytics_empty(db_session):
    summary = await service.get_orders_analytics(db_session)
    assert summary.total_orders == 0
    assert summary.total_sales == 0
    assert summary.items_ordered == 0


async def test_orders_analytics_aggregates(db_session):
    await _seed_order(
        db_session,
        order_number="ORD-PAID",
        total_price=Decimal("20.00"),
        payment_status=PaymentStatus.paid,
        fulfillment_status=FulfillmentStatus.fulfilled,
    )
    await _seed_order(
        db_session,
        order_number="ORD-REFUNDED",
        total_price=Decimal("20.00"),
        payment_status=PaymentStatus.refunded,
    )

    summary = await service.get_orders_analytics(db_session)
    assert summary.total_orders == 2
    assert summary.items_ordered == 4
    assert summary.orders_fulfilled == 1
    assert summary.total_sales == Decimal("20.00")
    assert summary.sales_reversals == Decimal("20.00")


# ---------------------------------------------------------------------------
# Draft orders
# ---------------------------------------------------------------------------


async def test_create_draft_order_computes_totals(db_session):
    data = DraftOrderCreate(
        draft_number="DRAFT-1",
        discount=Decimal("5.00"),
        shipping_cost=Decimal("3.00"),
        tax=Decimal("2.00"),
        items=[
            DraftOrderItemCreate(
                product_name="Leather Belt",
                unit_price=Decimal("10.00"),
                quantity=2,
            )
        ],
    )
    draft = await service.create_draft_order(db_session, data)
    assert draft.subtotal == Decimal("20.00")
    assert draft.total_price == Decimal("20.00") - Decimal("5.00") + Decimal("3.00") + Decimal("2.00")
    assert draft.status.value == "open"


async def test_get_draft_order(db_session):
    data = DraftOrderCreate(draft_number="DRAFT-GET", items=[])
    draft = await service.create_draft_order(db_session, data)
    fetched = await service.get_draft_order(db_session, draft.id)
    assert fetched is not None
    assert fetched.draft_number == "DRAFT-GET"
    assert await service.get_draft_order(db_session, 9999) is None


async def test_list_draft_orders(db_session):
    await service.create_draft_order(db_session, DraftOrderCreate(draft_number="DRAFT-A"))
    await service.create_draft_order(db_session, DraftOrderCreate(draft_number="DRAFT-B"))

    drafts = await service.list_draft_orders(db_session)
    assert {d.draft_number for d in drafts} == {"DRAFT-A", "DRAFT-B"}


async def test_update_draft_order_recalculates_total(db_session):
    draft = await service.create_draft_order(
        db_session,
        DraftOrderCreate(draft_number="DRAFT-U", shipping_cost=Decimal("0")),
    )
    updated = await service.update_draft_order(
        db_session, draft.id, DraftOrderUpdate(shipping_cost=Decimal("10.00"))
    )
    assert updated is not None
    assert updated.total_price == Decimal("10.00")


async def test_add_and_remove_draft_order_item(db_session):
    draft = await service.create_draft_order(db_session, DraftOrderCreate(draft_number="DRAFT-I"))

    item = await service.add_draft_order_item(
        db_session,
        draft.id,
        DraftOrderItemCreate(product_name="Wallet", unit_price=Decimal("15.00"), quantity=1),
    )
    assert item is not None
    assert item.total_price == Decimal("15.00")

    refreshed = await service.get_draft_order(db_session, draft.id)
    assert refreshed.subtotal == Decimal("15.00")
    assert refreshed.total_price == Decimal("15.00")

    assert await service.remove_draft_order_item(db_session, draft.id, item.id) is True
    assert await service.remove_draft_order_item(db_session, draft.id, item.id) is False
    assert await service.remove_draft_order_item(db_session, 9999, 1) is False


@pytest.mark.xfail(
    strict=True,
    reason="Backend bug: convert_draft_to_order passes location_id=None to Order() (service.py:558) but Order has no location_id column",
)
async def test_convert_draft_to_order(db_session):
    draft = await service.create_draft_order(
        db_session,
        DraftOrderCreate(
            draft_number="DRAFT-C",
            items=[DraftOrderItemCreate(product_name="Belt", unit_price=Decimal("10.00"))],
        ),
    )
    order = await service.convert_draft_to_order(db_session, draft.id, "ORD-CONVERTED")
    assert order is not None
    assert order.order_number == "ORD-CONVERTED"
    assert order.channel == "Draft Order"


# ---------------------------------------------------------------------------
# Abandoned checkouts
# ---------------------------------------------------------------------------


async def test_create_abandoned_checkout_sets_recovery_token(db_session):
    checkout = await service.create_abandoned_checkout(
        db_session,
        AbandonedCheckoutCreate(
            checkout_reference="CHK-1",
            total_price=Decimal("50.00"),
            items=[
                DraftOrderItemCreate(
                    product_name="Leather Belt",
                    unit_price=Decimal("50.00"),
                    quantity=1,
                )
            ],
        ),
    )
    assert checkout.checkout_reference == "CHK-1"
    assert checkout.recovery_token is not None
    assert checkout.recovery_status == RecoveryStatus.not_sent
    assert len(checkout.items) == 1


async def test_get_abandoned_checkout_missing_returns_none(db_session):
    assert await service.get_abandoned_checkout(db_session, 9999) is None


async def test_list_abandoned_checkouts(db_session):
    await service.create_abandoned_checkout(
        db_session, AbandonedCheckoutCreate(checkout_reference="CHK-1")
    )
    checkouts = await service.list_abandoned_checkouts(db_session)
    assert len(checkouts) == 1
    assert checkouts[0].checkout_reference == "CHK-1"


async def test_update_abandoned_checkout(db_session):
    checkout = await service.create_abandoned_checkout(
        db_session, AbandonedCheckoutCreate(checkout_reference="CHK-U")
    )
    updated = await service.update_abandoned_checkout(
        db_session, checkout.id, AbandonedCheckoutUpdate(customer_name="Ayesha")
    )
    assert updated.customer_name == "Ayesha"


async def test_send_recovery_email(db_session):
    checkout = await service.create_abandoned_checkout(
        db_session, AbandonedCheckoutCreate(checkout_reference="CHK-R")
    )
    updated = await service.send_recovery_email(db_session, checkout.id)
    assert updated.recovery_status == RecoveryStatus.email_sent
    assert updated.recovery_attempts == 1
    assert updated.recovery_email_sent_at is not None
    assert await service.send_recovery_email(db_session, 9999) is None


async def test_mark_recovered(db_session):
    checkout = await service.create_abandoned_checkout(
        db_session, AbandonedCheckoutCreate(checkout_reference="CHK-M")
    )
    updated = await service.mark_recovered(db_session, checkout.id)
    assert updated.recovery_status == RecoveryStatus.recovered
    assert updated.recovered_at is not None
    assert await service.mark_recovered(db_session, 9999) is None


async def test_export_abandoned_checkouts_filters(db_session):
    await service.create_abandoned_checkout(
        db_session, AbandonedCheckoutCreate(checkout_reference="CHK-EXPORT")
    )
    exported = await service.export_abandoned_checkouts(db_session)
    assert len(exported) == 1
    assert exported[0].checkout_reference == "CHK-EXPORT"
