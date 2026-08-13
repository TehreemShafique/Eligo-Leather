from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
import csv
import io

from app.db.session import get_db
from app.core.dependencies import get_current_user
from app.modules.orders import service
from app.modules.orders.model import PaymentStatus, FulfillmentStatus
from app.modules.orders.schema import (
    OrderCreate, OrderUpdate, OrderOut, OrderListOut, OrderNoteCreate, OrderNoteOut,
    OrderAuditLogOut,
    DraftOrderCreate, DraftOrderUpdate, DraftOrderOut, DraftOrderItemCreate, DraftOrderItemOut,
    AbandonedCheckoutCreate, AbandonedCheckoutUpdate, AbandonedCheckoutOut, AbandonedCheckoutListOut,
    SendRecoveryEmailRequest, SendRecoveryEmailResponse,
    ExportOrdersRequest, OrdersAnalyticsSummary,
)
from app.modules.settings.notifications.service import background_dispatch_order_confirmation

router = APIRouter(prefix="/orders", tags=["Orders"], dependencies=[Depends(get_current_user)])


# ================================================================
# Analytics
# ================================================================

@router.get("/analytics", response_model=OrdersAnalyticsSummary)
async def get_orders_analytics(
    date_from: datetime | None = None,
    date_to: datetime | None = None,
    location_id: int | None = None,
    db: AsyncSession = Depends(get_db),
):
    return await service.get_orders_analytics(db, date_from, date_to, location_id)


# ================================================================
# Export
# ================================================================

@router.post("/export")
async def export_orders(data: ExportOrdersRequest, db: AsyncSession = Depends(get_db)):
    orders = await service.export_orders(db, data)

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "Order Number", "Date", "Channel", "Customer ID", "Subtotal",
        "Shipping", "Tax", "Total", "Paid", "Payment Status",
        "Fulfillment Status", "Delivery Status", "Tags", "Items",
    ])

    for order in orders:
        items_str = "; ".join(
            f"{item.product_name} x{item.quantity}" for item in order.items
        )
        writer.writerow([
            order.order_number,
            order.created_at.isoformat() if order.created_at else "",
            order.channel,
            order.customer_id or "",
            str(order.subtotal),
            str(order.shipping_cost),
            str(order.tax),
            str(order.total_price),
            str(order.paid_amount),
            order.payment_status.value,
            order.fulfillment_status.value,
            order.delivery_status.value,
            order.tags or "",
            items_str,
        ])

    output.seek(0)
    filename = f"orders_export_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"

    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


# ================================================================
# Active Orders
# ================================================================

@router.post("/", response_model=OrderOut, status_code=status.HTTP_201_CREATED)
async def create_order(
    data: OrderCreate,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
):
    order = await service.create_order(db, data)
    # Fire the order confirmation email in the background so the SMTP
    # handshake can never block the create response.
    background_tasks.add_task(background_dispatch_order_confirmation, order.id)
    return order


@router.get("/", response_model=list[OrderListOut])
async def list_orders(
    is_archived: bool | None = None,
    payment_status: PaymentStatus | None = None,
    fulfillment_status: FulfillmentStatus | None = None,
    search: str | None = None,
    channel: str | None = None,
    date_from: datetime | None = None,
    date_to: datetime | None = None,
    skip: int = 0,
    limit: int = 50,
    db: AsyncSession = Depends(get_db),
):
    return await service.list_orders(
        db, is_archived, payment_status, fulfillment_status, search,
        date_from, date_to, channel, skip, limit,
    )


@router.get("/{order_id}", response_model=OrderOut)
async def get_order(order_id: int, db: AsyncSession = Depends(get_db)):
    order = await service.get_order(db, order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return order


@router.patch("/{order_id}", response_model=OrderOut)
async def update_order(order_id: int, data: OrderUpdate, db: AsyncSession = Depends(get_db)):
    order = await service.update_order(db, order_id, data)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return order


@router.post("/{order_id}/archive", response_model=OrderOut)
async def archive_order(order_id: int, db: AsyncSession = Depends(get_db)):
    order = await service.archive_order(db, order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return order


# ================================================================
# Restock & Return
# ================================================================

@router.post("/{order_id}/restock", response_model=OrderOut)
async def restock_order(order_id: int, db: AsyncSession = Depends(get_db)):
    order = await service.restock_order_items(db, order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return order


@router.post("/{order_id}/return/request", response_model=OrderOut)
async def request_order_return(order_id: int, db: AsyncSession = Depends(get_db)):
    order = await service.request_return(db, order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return order


@router.post("/{order_id}/return/approve", response_model=OrderOut)
async def approve_order_return(order_id: int, db: AsyncSession = Depends(get_db)):
    order = await service.approve_return(db, order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return order


@router.post("/{order_id}/return/receive", response_model=OrderOut)
async def receive_order_return(order_id: int, db: AsyncSession = Depends(get_db)):
    order = await service.receive_return(db, order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return order


# ================================================================
# Order Notes
# ================================================================

@router.post("/{order_id}/notes", response_model=OrderNoteOut, status_code=status.HTTP_201_CREATED)
async def add_note(order_id: int, data: OrderNoteCreate, db: AsyncSession = Depends(get_db)):
    note = await service.add_order_note(db, order_id, data)
    if not note:
        raise HTTPException(status_code=404, detail="Order not found")
    return note


@router.get("/{order_id}/notes", response_model=list[OrderNoteOut])
async def list_notes(order_id: int, db: AsyncSession = Depends(get_db)):
    return await service.list_order_notes(db, order_id)


@router.patch("/notes/{note_id}", response_model=OrderNoteOut)
async def update_note(note_id: int, body: str, db: AsyncSession = Depends(get_db)):
    note = await service.update_order_note(db, note_id, body)
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    return note


@router.delete("/notes/{note_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_note(note_id: int, db: AsyncSession = Depends(get_db)):
    deleted = await service.delete_order_note(db, note_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Note not found")


# ================================================================
# Order Audit Log
# ================================================================

@router.get("/{order_id}/audit-log", response_model=list[OrderAuditLogOut])
async def list_audit_logs(order_id: int, db: AsyncSession = Depends(get_db)):
    return await service.list_order_audit_logs(db, order_id)


# ================================================================
# Draft Orders
# ================================================================

@router.post("/drafts", response_model=DraftOrderOut, status_code=status.HTTP_201_CREATED)
async def create_draft_order(data: DraftOrderCreate, db: AsyncSession = Depends(get_db)):
    return await service.create_draft_order(db, data)


@router.get("/drafts", response_model=list[DraftOrderOut])
async def list_draft_orders(
    status_filter: str | None = None,
    search: str | None = None,
    skip: int = 0,
    limit: int = 50,
    db: AsyncSession = Depends(get_db),
):
    return await service.list_draft_orders(db, status_filter, search, skip, limit)


@router.get("/drafts/{draft_id}", response_model=DraftOrderOut)
async def get_draft_order(draft_id: int, db: AsyncSession = Depends(get_db)):
    draft = await service.get_draft_order(db, draft_id)
    if not draft:
        raise HTTPException(status_code=404, detail="Draft order not found")
    return draft


@router.patch("/drafts/{draft_id}", response_model=DraftOrderOut)
async def update_draft_order(draft_id: int, data: DraftOrderUpdate, db: AsyncSession = Depends(get_db)):
    draft = await service.update_draft_order(db, draft_id, data)
    if not draft:
        raise HTTPException(status_code=404, detail="Draft order not found")
    return draft


@router.post("/drafts/{draft_id}/items", response_model=DraftOrderItemOut, status_code=status.HTTP_201_CREATED)
async def add_draft_item(draft_id: int, data: DraftOrderItemCreate, db: AsyncSession = Depends(get_db)):
    item = await service.add_draft_order_item(db, draft_id, data)
    if not item:
        raise HTTPException(status_code=404, detail="Draft order not found")
    return item


@router.delete("/drafts/{draft_id}/items/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_draft_item(draft_id: int, item_id: int, db: AsyncSession = Depends(get_db)):
    removed = await service.remove_draft_order_item(db, draft_id, item_id)
    if not removed:
        raise HTTPException(status_code=404, detail="Draft order or item not found")


@router.post("/drafts/{draft_id}/convert", response_model=OrderOut)
async def convert_draft_order(draft_id: int, order_number: str, db: AsyncSession = Depends(get_db)):
    order = await service.convert_draft_to_order(db, draft_id, order_number)
    if not order:
        raise HTTPException(status_code=404, detail="Draft order not found")
    return order


# ================================================================
# Abandoned Checkouts
# ================================================================

@router.post("/abandoned-checkouts", response_model=AbandonedCheckoutOut, status_code=status.HTTP_201_CREATED)
async def create_abandoned_checkout(data: AbandonedCheckoutCreate, db: AsyncSession = Depends(get_db)):
    return await service.create_abandoned_checkout(db, data)


@router.get("/abandoned-checkouts", response_model=list[AbandonedCheckoutListOut])
async def list_abandoned_checkouts(
    recovery_status: str | None = None,
    search: str | None = None,
    skip: int = 0,
    limit: int = 50,
    db: AsyncSession = Depends(get_db),
):
    return await service.list_abandoned_checkouts(db, recovery_status, search, skip, limit)


@router.get("/abandoned-checkouts/{checkout_id}", response_model=AbandonedCheckoutOut)
async def get_abandoned_checkout(checkout_id: int, db: AsyncSession = Depends(get_db)):
    checkout = await service.get_abandoned_checkout(db, checkout_id)
    if not checkout:
        raise HTTPException(status_code=404, detail="Abandoned checkout not found")
    return checkout


@router.patch("/abandoned-checkouts/{checkout_id}", response_model=AbandonedCheckoutOut)
async def update_abandoned_checkout(checkout_id: int, data: AbandonedCheckoutUpdate, db: AsyncSession = Depends(get_db)):
    checkout = await service.update_abandoned_checkout(db, checkout_id, data)
    if not checkout:
        raise HTTPException(status_code=404, detail="Abandoned checkout not found")
    return checkout


@router.post("/abandoned-checkouts/{checkout_id}/send-recovery-email", response_model=AbandonedCheckoutOut)
async def send_recovery_email(checkout_id: int, db: AsyncSession = Depends(get_db)):
    checkout = await service.send_recovery_email(db, checkout_id)
    if not checkout:
        raise HTTPException(status_code=404, detail="Abandoned checkout not found")
    return checkout


@router.post("/abandoned-checkouts/{checkout_id}/mark-recovered", response_model=AbandonedCheckoutOut)
async def mark_checkout_recovered(checkout_id: int, db: AsyncSession = Depends(get_db)):
    checkout = await service.mark_recovered(db, checkout_id)
    if not checkout:
        raise HTTPException(status_code=404, detail="Abandoned checkout not found")
    return checkout


@router.post("/abandoned-checkouts/export")
async def export_abandoned_checkouts(
    recovery_status: str | None = None,
    db: AsyncSession = Depends(get_db),
):
    checkouts = await service.export_abandoned_checkouts(db, recovery_status)

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "Checkout Reference", "Customer Name", "Customer Email",
        "Region", "Recovery Status", "Total", "Created At",
    ])

    for c in checkouts:
        writer.writerow([
            c.checkout_reference,
            c.customer_name or "",
            c.customer_email or "",
            c.region or "",
            c.recovery_status.value,
            str(c.total_price),
            c.created_at.isoformat() if c.created_at else "",
        ])

    output.seek(0)
    filename = f"abandoned_checkouts_export_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"

    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )
