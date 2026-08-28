import uuid
import json
from datetime import datetime, timezone
from decimal import Decimal

from sqlalchemy import select, func, and_, or_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.modules.orders.model import (
    Order, OrderItem, OrderNote, OrderAuditLog,
    DraftOrder, DraftOrderItem,
    AbandonedCheckout, AbandonedCheckoutItem,
    PaymentStatus, FulfillmentStatus, ReturnStatus, DeliveryStatus,
)
from app.modules.orders.schema import (
    OrderCreate, OrderUpdate, OrderNoteCreate,
    DraftOrderCreate, DraftOrderUpdate, DraftOrderItemCreate,
    AbandonedCheckoutCreate, AbandonedCheckoutUpdate,
    ExportOrdersRequest, OrdersAnalyticsSummary,
)


# ================================================================
# Audit Log Helper
# ================================================================

async def _log_audit(
    db: AsyncSession,
    order_id: int,
    event_type: str,
    description: str,
    actor_name: str | None = None,
    metadata_json: str | None = None,
):
    log = OrderAuditLog(
        order_id=order_id,
        event_type=event_type,
        description=description,
        actor_name=actor_name,
        metadata_json=metadata_json,
    )
    db.add(log)


# ================================================================
# Orders
# ================================================================

async def create_order(db: AsyncSession, data: OrderCreate) -> Order:
    subtotal = sum((item.unit_price * item.quantity for item in data.items), Decimal("0"))
    total = subtotal + data.shipping_cost + data.tax

    order = Order(
        order_number=data.order_number,
        customer_id=data.customer_id,
        fulfill_by=data.fulfill_by,
        channel=data.channel,
        currency=data.currency,
        subtotal=subtotal,
        shipping_cost=data.shipping_cost,
        tax=data.tax,
        total_price=total,
        paid_amount=data.paid_amount,
        tags=data.tags,
        destination=data.destination,
        po_number=data.po_number,
        shipping_address=data.shipping_address,
        billing_address=data.billing_address,
        customer_note=data.customer_note,
        internal_note=data.internal_note,
        tracking_company=data.tracking_company,
        tracking_number=data.tracking_number,
        items=[
            OrderItem(
                product_id=item.product_id,
                variant_id=item.variant_id,
                product_name=item.product_name,
                sku=item.sku,
                variant_title=item.variant_title,
                quantity=item.quantity,
                unit_price=item.unit_price,
                total_price=item.total_price or (item.unit_price * item.quantity),
                requires_shipping=item.requires_shipping,
                is_gift_card=item.is_gift_card,
            )
            for item in data.items
        ],
    )

    db.add(order)
    await db.flush()

    await _log_audit(db, order.id, "order_created", f"Order {data.order_number} created from {data.channel}")

    await db.commit()
    await db.refresh(order, attribute_names=["items", "audit_logs"])

    return order


async def get_order(
    db: AsyncSession, order_id: int | str
) -> Order | None:
    """Resolve an order by its numeric db id or by its human-friendly
    ``order_number`` string (e.g. "12348")."""
    query = (
        select(Order)
        .options(
            selectinload(Order.items),
            selectinload(Order.audit_logs),
            selectinload(Order.notes),
            selectinload(Order.customer),
        )
    )
    if isinstance(order_id, str) and not order_id.isdigit():
        query = query.where(Order.order_number == order_id)
    else:
        num = int(order_id)
        query = query.where(
            or_(Order.id == num, Order.order_number == str(num))
        )
    result = await db.execute(query)
    return result.scalar_one_or_none()


async def list_orders(
    db: AsyncSession,
    is_archived: bool | None = None,
    payment_status: PaymentStatus | None = None,
    fulfillment_status: FulfillmentStatus | None = None,
    search: str | None = None,
    date_from: datetime | None = None,
    date_to: datetime | None = None,
    channel: str | None = None,
    skip: int = 0,
    limit: int = 50,
    customer_id: int | None = None,
) -> list[Order]:
    query = select(Order).options(selectinload(Order.items), selectinload(Order.customer))

    if is_archived is not None:
        query = query.where(Order.is_archived == is_archived)

    if customer_id is not None:
        query = query.where(Order.customer_id == customer_id)

    if payment_status is not None:
        query = query.where(Order.payment_status == payment_status)

    if fulfillment_status is not None:
        query = query.where(Order.fulfillment_status == fulfillment_status)

    if channel:
        query = query.where(Order.channel == channel)

    if date_from:
        query = query.where(Order.created_at >= date_from)

    if date_to:
        query = query.where(Order.created_at <= date_to)

    if search:
        query = query.where(
            or_(
                Order.order_number.ilike(f"%{search}%"),
                Order.tags.ilike(f"%{search}%"),
                Order.tracking_number.ilike(f"%{search}%"),
            )
        )

    query = query.order_by(Order.created_at.desc()).offset(skip).limit(limit)
    result = await db.execute(query)
    return list(result.scalars().all())


async def update_order(db: AsyncSession, order_id: int, data: OrderUpdate) -> Order | None:
    order = await get_order(db, order_id)
    if not order:
        return None

    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        old_value = getattr(order, field, None)
        setattr(order, field, value)
        if old_value != value:
            await _log_audit(
                db, order.id, "status_changed",
                f"Field '{field}' changed from '{old_value}' to '{value}'"
            )

    await db.commit()
    await db.refresh(order, attribute_names=["items", "audit_logs", "notes"])
    return order


async def archive_order(db: AsyncSession, order_id: int) -> Order | None:
    order = await get_order(db, order_id)
    if not order:
        return None
    order.is_archived = True
    await _log_audit(db, order.id, "order_archived", "Order archived")
    await db.commit()
    await db.refresh(order)
    return order


# ================================================================
# Restock
# ================================================================

async def get_variant_commitments(db: AsyncSession) -> dict[int, int]:
    """Committed units per variant id.

    A unit is "committed" while it belongs to an order that is neither
    cancelled (``orders.cancelled_at`` set) nor restocked. Available stock on
    the storefront/admin side is ``on_hand - committed``.
    """
    result = await db.execute(
        select(OrderItem.variant_id, func.coalesce(func.sum(OrderItem.quantity), 0))
        .join(Order, Order.id == OrderItem.order_id)
        .where(
            OrderItem.variant_id.isnot(None),
            Order.cancelled_at.is_(None),
            OrderItem.restocked.is_(False),
        )
        .group_by(OrderItem.variant_id)
    )
    return {int(variant_id): int(qty) for variant_id, qty in result.all()}


async def restock_order_items(db: AsyncSession, order_id: int) -> Order | None:
    """Return cancelled/returned order items back to inventory."""
    order = await get_order(db, order_id)
    if not order:
        return None

    restocked_count = 0
    for item in order.items:
        if not item.restocked and item.variant_id:
            item.restocked = True
            restocked_count += 1

    if restocked_count > 0:
        order.return_status = ReturnStatus.none
        await _log_audit(
            db, order.id, "restock_completed",
            f"{restocked_count} item(s) restocked to inventory"
        )

    await db.commit()
    await db.refresh(order, attribute_names=["items", "audit_logs"])
    return order


# ================================================================
# Returns / RMA
# ================================================================

async def request_return(db: AsyncSession, order_id: int) -> Order | None:
    order = await get_order(db, order_id)
    if not order:
        return None
    order.return_status = ReturnStatus.requested
    await _log_audit(db, order.id, "return_requested", "Return requested by customer")
    await db.commit()
    await db.refresh(order, attribute_names=["audit_logs"])
    return order


async def approve_return(db: AsyncSession, order_id: int) -> Order | None:
    order = await get_order(db, order_id)
    if not order:
        return None
    order.return_status = ReturnStatus.approved
    await _log_audit(db, order.id, "return_approved", "Return approved by staff")
    await db.commit()
    await db.refresh(order, attribute_names=["audit_logs"])
    return order


async def receive_return(db: AsyncSession, order_id: int) -> Order | None:
    order = await get_order(db, order_id)
    if not order:
        return None
    order.return_status = ReturnStatus.received
    await _log_audit(db, order.id, "return_received", "Returned items received at warehouse")
    await db.commit()
    await db.refresh(order, attribute_names=["audit_logs"])
    return order


# ================================================================
# Order Notes
# ================================================================

async def add_order_note(
    db: AsyncSession, order_id: int, data: OrderNoteCreate,
    author_id: int | None = None, author_name: str | None = None,
) -> OrderNote | None:
    order = await get_order(db, order_id)
    if not order:
        return None

    note = OrderNote(
        order_id=order_id,
        author_id=author_id,
        author_name=author_name,
        body=data.body,
        is_customer_visible=data.is_customer_visible,
    )
    db.add(note)
    await _log_audit(db, order_id, "note_added", f"Note added: {data.body[:80]}...")
    await db.commit()
    await db.refresh(note)
    return note


async def list_order_notes(db: AsyncSession, order_id: int) -> list[OrderNote]:
    result = await db.execute(
        select(OrderNote)
        .where(OrderNote.order_id == order_id)
        .order_by(OrderNote.created_at.desc())
    )
    return list(result.scalars().all())


async def update_order_note(db: AsyncSession, note_id: int, body: str) -> OrderNote | None:
    result = await db.execute(select(OrderNote).where(OrderNote.id == note_id))
    note = result.scalar_one_or_none()
    if not note:
        return None
    note.body = body
    await db.commit()
    await db.refresh(note)
    return note


async def delete_order_note(db: AsyncSession, note_id: int) -> bool:
    result = await db.execute(select(OrderNote).where(OrderNote.id == note_id))
    note = result.scalar_one_or_none()
    if not note:
        return False
    await db.delete(note)
    await db.commit()
    return True


# ================================================================
# Order Audit Log
# ================================================================

async def list_order_audit_logs(db: AsyncSession, order_id: int) -> list[OrderAuditLog]:
    result = await db.execute(
        select(OrderAuditLog)
        .where(OrderAuditLog.order_id == order_id)
        .order_by(OrderAuditLog.created_at.desc())
    )
    return list(result.scalars().all())


# ================================================================
# Analytics Summary
# ================================================================

async def get_orders_analytics(
    db: AsyncSession,
    date_from: datetime | None = None,
    date_to: datetime | None = None,
) -> OrdersAnalyticsSummary:
    query = (
        select(Order)
        .options(selectinload(Order.items))
        .where(Order.is_archived == False)
    )

    if date_from:
        query = query.where(Order.created_at >= date_from)
    if date_to:
        query = query.where(Order.created_at <= date_to)

    result = await db.execute(query)
    orders = list(result.scalars().all())

    total_orders = len(orders)
    items_ordered = sum(sum(item.quantity for item in order.items) for order in orders)
    sales_reversals = sum(
        order.total_price for order in orders
        if order.payment_status in (PaymentStatus.refunded, PaymentStatus.voided)
    )
    orders_fulfilled = sum(
        1 for order in orders
        if order.fulfillment_status == FulfillmentStatus.fulfilled
    )
    total_sales = sum(order.total_price for order in orders if order.payment_status == PaymentStatus.paid)

    return OrdersAnalyticsSummary(
        total_orders=total_orders,
        items_ordered=items_ordered,
        sales_reversals=sales_reversals,
        orders_fulfilled=orders_fulfilled,
        total_sales=total_sales,
        date_from=date_from,
        date_to=date_to,
    )


# ================================================================
# Export
# ================================================================

async def export_orders(
    db: AsyncSession, data: ExportOrdersRequest
) -> list[Order]:
    """Returns the orders matching the export scope. Caller handles CSV serialization."""
    if data.scope == "selected" and data.order_ids:
        query = select(Order).options(selectinload(Order.items)).where(Order.id.in_(data.order_ids))
    elif data.scope == "by_date" and (data.date_from or data.date_to):
        query = select(Order).options(selectinload(Order.items))
        if data.date_from:
            query = query.where(Order.created_at >= data.date_from)
        if data.date_to:
            query = query.where(Order.created_at <= data.date_to)
    elif data.scope == "by_search" and data.search:
        query = (
            select(Order).options(selectinload(Order.items))
            .where(Order.order_number.ilike(f"%{data.search}%"))
        )
    else:
        query = select(Order).options(selectinload(Order.items))

    query = query.order_by(Order.created_at.desc())
    result = await db.execute(query)
    return list(result.scalars().all())


# ================================================================
# Draft Orders
# ================================================================

async def create_draft_order(db: AsyncSession, data: DraftOrderCreate) -> DraftOrder:
    subtotal = sum((item.unit_price * item.quantity for item in data.items), Decimal("0"))
    total = subtotal - data.discount + data.shipping_cost + data.tax

    draft = DraftOrder(
        draft_number=data.draft_number,
        customer_id=data.customer_id,
        customer_email=data.customer_email,
        customer_phone=data.customer_phone,
        discount=data.discount,
        shipping_cost=data.shipping_cost,
        tax=data.tax,
        currency=data.currency,
        market=data.market,
        subtotal=subtotal,
        total_price=total,
        shipping_address=data.shipping_address,
        billing_address=data.billing_address,
        note=data.note,
        tags=data.tags,
        items=[
            DraftOrderItem(
                product_id=item.product_id,
                variant_id=item.variant_id,
                product_name=item.product_name,
                sku=item.sku,
                variant_title=item.variant_title,
                quantity=item.quantity,
                unit_price=item.unit_price,
                total_price=item.total_price or (item.unit_price * item.quantity),
                requires_shipping=item.requires_shipping,
                is_custom=item.is_custom,
            )
            for item in data.items
        ],
    )
    db.add(draft)
    await db.commit()
    await db.refresh(draft, attribute_names=["items"])
    return draft


async def get_draft_order(db: AsyncSession, draft_id: int) -> DraftOrder | None:
    result = await db.execute(
        select(DraftOrder).options(selectinload(DraftOrder.items)).where(DraftOrder.id == draft_id)
    )
    return result.scalar_one_or_none()


async def list_draft_orders(
    db: AsyncSession,
    status: str | None = None,
    search: str | None = None,
    skip: int = 0,
    limit: int = 50,
) -> list[DraftOrder]:
    query = select(DraftOrder).options(selectinload(DraftOrder.items))

    if status:
        query = query.where(DraftOrder.status == status)

    if search:
        query = query.where(
            or_(
                DraftOrder.draft_number.ilike(f"%{search}%"),
                DraftOrder.customer_email.ilike(f"%{search}%"),
                DraftOrder.tags.ilike(f"%{search}%"),
            )
        )

    query = query.order_by(DraftOrder.created_at.desc()).offset(skip).limit(limit)
    result = await db.execute(query)
    return list(result.scalars().all())


async def update_draft_order(db: AsyncSession, draft_id: int, data: DraftOrderUpdate) -> DraftOrder | None:
    draft = await get_draft_order(db, draft_id)
    if not draft:
        return None

    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(draft, field, value)

    # Recalculate totals
    if any(f in data.model_dump(exclude_unset=True) for f in ["discount", "shipping_cost", "tax"]):
        draft.total_price = draft.subtotal - draft.discount + draft.shipping_cost + draft.tax

    await db.commit()
    await db.refresh(draft, attribute_names=["items"])
    return draft


async def add_draft_order_item(
    db: AsyncSession, draft_id: int, data: DraftOrderItemCreate
) -> DraftOrderItem | None:
    draft = await get_draft_order(db, draft_id)
    if not draft:
        return None

    item = DraftOrderItem(
        draft_order_id=draft_id,
        product_id=data.product_id,
        variant_id=data.variant_id,
        product_name=data.product_name,
        sku=data.sku,
        variant_title=data.variant_title,
        quantity=data.quantity,
        unit_price=data.unit_price,
        total_price=data.total_price or (data.unit_price * data.quantity),
        requires_shipping=data.requires_shipping,
        is_custom=data.is_custom,
    )
    db.add(item)

    # Recalculate subtotal
    draft.subtotal += item.total_price
    draft.total_price = draft.subtotal - draft.discount + draft.shipping_cost + draft.tax

    await db.commit()
    await db.refresh(item)
    return item


async def remove_draft_order_item(db: AsyncSession, draft_id: int, item_id: int) -> bool:
    draft = await get_draft_order(db, draft_id)
    if not draft:
        return False

    result = await db.execute(
        select(DraftOrderItem).where(
            DraftOrderItem.id == item_id,
            DraftOrderItem.draft_order_id == draft_id,
        )
    )
    item = result.scalar_one_or_none()
    if not item:
        return False

    draft.subtotal -= item.total_price
    draft.total_price = draft.subtotal - draft.discount + draft.shipping_cost + draft.tax

    await db.delete(item)
    await db.commit()
    return True


async def convert_draft_to_order(db: AsyncSession, draft_id: int, order_number: str) -> Order | None:
    """Turns a completed draft order into a real order."""
    draft = await get_draft_order(db, draft_id)
    if not draft:
        return None

    order = Order(
        order_number=order_number,
        customer_id=draft.customer_id,
        channel="Draft Order",
        currency=draft.currency,
        subtotal=draft.subtotal,
        shipping_cost=draft.shipping_cost,
        tax=draft.tax,
        total_price=draft.total_price,
        shipping_address=draft.shipping_address,
        billing_address=draft.billing_address,
        internal_note=draft.note,
        tags=draft.tags,
        items=[
            OrderItem(
                product_id=item.product_id,
                variant_id=item.variant_id,
                product_name=item.product_name,
                sku=item.sku,
                variant_title=item.variant_title,
                quantity=item.quantity,
                unit_price=item.unit_price,
                total_price=item.total_price,
                requires_shipping=item.requires_shipping,
            )
            for item in draft.items
        ],
    )
    db.add(order)
    await db.flush()

    draft.status = "completed"
    await _log_audit(db, order.id, "order_created", f"Converted from draft {draft.draft_number}")

    await db.commit()
    await db.refresh(order, attribute_names=["items", "audit_logs"])
    return order


# ================================================================
# Abandoned Checkouts
# ================================================================

async def create_abandoned_checkout(db: AsyncSession, data: AbandonedCheckoutCreate) -> AbandonedCheckout:
    checkout = AbandonedCheckout(
        checkout_reference=data.checkout_reference,
        customer_id=data.customer_id,
        customer_name=data.customer_name,
        customer_email=data.customer_email,
        customer_phone=data.customer_phone,
        region=data.region,
        total_price=data.total_price,
        currency=data.currency,
        shipping_address=data.shipping_address,
        ip_address=data.ip_address,
        browser_info=data.browser_info,
        recovery_token=str(uuid.uuid4()),
        items=[
            AbandonedCheckoutItem(
                product_id=item.product_id,
                variant_id=item.variant_id,
                product_name=item.product_name,
                sku=item.sku,
                variant_title=item.variant_title,
                quantity=item.quantity,
                unit_price=item.unit_price,
                total_price=item.total_price or (item.unit_price * item.quantity),
            )
            for item in data.items
        ],
    )
    db.add(checkout)
    await db.commit()
    await db.refresh(checkout, attribute_names=["items"])
    return checkout


async def get_abandoned_checkout(db: AsyncSession, checkout_id: int) -> AbandonedCheckout | None:
    result = await db.execute(
        select(AbandonedCheckout)
        .options(selectinload(AbandonedCheckout.items))
        .where(AbandonedCheckout.id == checkout_id)
    )
    return result.scalar_one_or_none()


async def list_abandoned_checkouts(
    db: AsyncSession,
    recovery_status: str | None = None,
    search: str | None = None,
    skip: int = 0,
    limit: int = 50,
) -> list[AbandonedCheckout]:
    query = select(AbandonedCheckout).options(selectinload(AbandonedCheckout.items))

    if recovery_status:
        query = query.where(AbandonedCheckout.recovery_status == recovery_status)

    if search:
        query = query.where(
            or_(
                AbandonedCheckout.checkout_reference.ilike(f"%{search}%"),
                AbandonedCheckout.customer_name.ilike(f"%{search}%"),
                AbandonedCheckout.customer_email.ilike(f"%{search}%"),
            )
        )

    query = query.order_by(AbandonedCheckout.created_at.desc()).offset(skip).limit(limit)
    result = await db.execute(query)
    return list(result.scalars().all())


async def update_abandoned_checkout(
    db: AsyncSession, checkout_id: int, data: AbandonedCheckoutUpdate
) -> AbandonedCheckout | None:
    checkout = await get_abandoned_checkout(db, checkout_id)
    if not checkout:
        return None
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(checkout, field, value)
    await db.commit()
    await db.refresh(checkout, attribute_names=["items"])
    return checkout


async def send_recovery_email(
    db: AsyncSession, checkout_id: int, recovery_url: str | None = None
) -> AbandonedCheckout | None:
    """Send a recovery email via the notification dispatch engine."""
    checkout = await get_abandoned_checkout(db, checkout_id)
    if not checkout:
        return None

    checkout.recovery_status = "email_sent"
    checkout.recovery_email_sent_at = datetime.now(timezone.utc)
    checkout.recovery_attempts += 1

    from app.modules.settings.notifications.service import background_dispatch_event
    try:
        import asyncio
        asyncio.create_task(background_dispatch_event("abandoned_checkout", {
            "email": checkout.customer_email,
            "customer_email": checkout.customer_email,
            "customer_name": checkout.customer_name or "Valued Customer",
            "order_number": checkout.checkout_reference,
            "total_price": str(checkout.total_price),
            "currency": checkout.currency or "PKR",
            "recovery_url": recovery_url or "http://localhost:3000/cart",
            "store_name": "Eligo Leather",
        }))
    except Exception:
        pass

    await db.commit()
    await db.refresh(checkout, attribute_names=["items"])
    return checkout


async def mark_recovered(db: AsyncSession, checkout_id: int) -> AbandonedCheckout | None:
    """Mark a checkout as recovered (e.g., after customer completes purchase via recovery link)."""
    checkout = await get_abandoned_checkout(db, checkout_id)
    if not checkout:
        return None

    checkout.recovery_status = "recovered"
    checkout.recovered_at = datetime.now(timezone.utc)

    await db.commit()
    await db.refresh(checkout, attribute_names=["items"])
    return checkout


async def export_abandoned_checkouts(
    db: AsyncSession,
    recovery_status: str | None = None,
) -> list[AbandonedCheckout]:
    query = select(AbandonedCheckout).options(selectinload(AbandonedCheckout.items))

    if recovery_status:
        query = query.where(AbandonedCheckout.recovery_status == recovery_status)

    query = query.order_by(AbandonedCheckout.created_at.desc())
    result = await db.execute(query)
    return list(result.scalars().all())


async def process_leopard_webhook_payload(db: AsyncSession, payload: dict) -> dict:
    """Extract consignment ID (cn_number) and status from Leopards Courier Push API payload."""
    items = []
    if isinstance(payload, dict):
        if "data" in payload and isinstance(payload["data"], list):
            items = payload["data"]
        else:
            items = [payload]

    updated_orders = []
    for entry in items:
        if not isinstance(entry, dict):
            continue
        cn_number = (
            entry.get("cn_number")
            or entry.get("tracking_number")
            or entry.get("trackNo")
            or entry.get("consignment_id")
            or entry.get("track_no")
        )
        status_str = (
            entry.get("status")
            or entry.get("track_status")
            or entry.get("delivery_status")
            or ""
        )

        if cn_number:
            cn_str = str(cn_number).strip()
            cn_clean = cn_str.replace("ID", "").strip()

            # Upsert to leopard_shipments so it shows in the Order tab
            from app.modules.orders.leopard_service import upsert_shipment_from_webhook
            await upsert_shipment_from_webhook(db, cn_str, status_str, entry)

            result = await db.execute(
                select(Order).where(
                    or_(
                        Order.tracking_number == cn_str,
                        Order.tracking_number == f"ID{cn_clean}",
                        Order.tracking_number == cn_clean,
                    )
                )
            )
            order = result.scalar_one_or_none()
            if order:
                old_status = order.fulfillment_status
                if "delivered" in status_str.lower():
                    order.fulfillment_status = "Fulfilled (Delivered)"
                elif "dispatch" in status_str.lower() or "transit" in status_str.lower():
                    order.fulfillment_status = f"Fulfilled ({status_str})"
                elif "return" in status_str.lower() or "cancel" in status_str.lower():
                    order.fulfillment_status = f"Returned ({status_str})"

                # Mirror the courier lifecycle onto the structured
                # delivery_status so the storefront and admin track shipping
                # separately from payment/fulfillment.
                lower_status = status_str.lower()
                delivery_mapping = [
                    (("out for delivery", "out-for-delivery"), DeliveryStatus.out_for_delivery),
                    (("return",), DeliveryStatus.returned),
                    (("undeliver", "refuse", "fail", "cancel"), DeliveryStatus.failed),
                    (("deliver",), DeliveryStatus.delivered),
                    (("picked", "pickup", "pick up"), DeliveryStatus.picked_up),
                    (("book",), DeliveryStatus.booked),
                    (("dispatch", "transit", "move", "shift", "on the way", "in process"), DeliveryStatus.in_transit),
                ]
                for keywords, target in delivery_mapping:
                    if any(keyword in lower_status for keyword in keywords):
                        order.delivery_status = target
                        break

                await _log_audit(
                    db,
                    order.id,
                    "leopard_webhook_update",
                    f"Leopard status updated from '{old_status}' to '{order.fulfillment_status}' via webhook.",
                    actor_name="Leopard Courier Webhook",
                    metadata_json=json.dumps(entry),
                )
                updated_orders.append({"order_id": order.id, "cn_number": cn_number, "status": status_str})

                from app.modules.settings.notifications.service import background_dispatch_event
                status_lower = status_str.lower()
                if "delivered" in status_lower:
                    _notif_payload = {
                        "email": getattr(order, "customer_email", None) or entry.get("email"),
                        "customer_email": getattr(order, "customer_email", None) or entry.get("email"),
                        "customer_name": getattr(order, "customer_name", None) or "Valued Customer",
                        "order_number": order.order_number,
                        "tracking_number": str(cn_number),
                        "tracking_company": "Leopards Courier",
                        "currency": str(order.currency) if hasattr(order, "currency") else "PKR",
                        "total_price": str(order.total_price),
                    }
                    try:
                        import asyncio
                        asyncio.create_task(background_dispatch_event("order_delivered", _notif_payload))
                    except Exception:
                        pass
                elif "dispatch" in status_lower or "transit" in status_lower:
                    _notif_payload = {
                        "email": getattr(order, "customer_email", None) or entry.get("email"),
                        "customer_email": getattr(order, "customer_email", None) or entry.get("email"),
                        "customer_name": getattr(order, "customer_name", None) or "Valued Customer",
                        "order_number": order.order_number,
                        "tracking_number": str(cn_number),
                        "tracking_company": "Leopards Courier",
                        "currency": str(order.currency) if hasattr(order, "currency") else "PKR",
                        "total_price": str(order.total_price),
                    }
                    try:
                        import asyncio
                        asyncio.create_task(background_dispatch_event("order_shipped", _notif_payload))
                    except Exception:
                        pass

    await db.commit()
    return {"matched_updated": len(updated_orders), "updated": updated_orders}

