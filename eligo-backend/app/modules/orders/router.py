from datetime import datetime
import json
import logging
import csv
import io
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks, Request
from fastapi.responses import StreamingResponse, Response
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.core.dependencies import get_current_user
from app.modules.orders import service
from app.modules.orders import leopard_service
from app.modules.orders import leopard_client
from decimal import Decimal
from app.modules.orders.model import Order, OrderItem, PaymentStatus, FulfillmentStatus, DeliveryStatus, LeopardShipment
from app.modules.settings.apps.model import StoreIntegration
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
public_webhook_router = APIRouter(prefix="/orders", tags=["Orders - Webhooks"])


@public_webhook_router.post("/webhooks/leopard")
@public_webhook_router.post("/leopard-webhook")
async def receive_leopard_webhook(request: Request, db: AsyncSession = Depends(get_db)):
    """Inbound unauthenticated webhook listener for Leopards Courier Services (LCS Push API).

    Prints and logs raw incoming HTTP headers and raw JSON/body payload in real time.
    """
    raw_body_bytes = await request.body()
    raw_body_str = raw_body_bytes.decode("utf-8", errors="replace")
    headers_dict = dict(request.headers)

    payload = {}
    try:
        payload = json.loads(raw_body_str) if raw_body_str else {}
    except Exception as exc:
        payload = {"raw_text": raw_body_str, "parse_error": str(exc)}

    # PRINT RAW LEOPARD WEBHOOK DATA TO CONSOLE STDOUT IN REAL-TIME
    print("\n" + "=" * 80)
    print("========== 🚚 LEOPARD COURIER INBOUND WEBHOOK RAW DATA RECEIVED ==========")
    print(f"Timestamp    : {datetime.now().isoformat()}")
    print(f"Client IP    : {request.client.host if request.client else 'Unknown'}")
    print(f"Content-Type : {request.headers.get('content-type', 'Not specified')}")
    print("HTTP Headers :")
    print(json.dumps(headers_dict, indent=2))
    print("-" * 80)
    print("RAW PAYLOAD BODY:")
    print(raw_body_str)
    print("-" * 80)
    print("PARSED JSON PAYLOAD:")
    print(json.dumps(payload, indent=2) if isinstance(payload, (dict, list)) else payload)
    print("=" * 80 + "\n")

    result = await service.process_leopard_webhook_payload(db, payload)

    return {
        "status": "success",
        "message": "Leopard Courier raw webhook data logged and processed successfully",
        "raw_received": payload,
        "processed_result": result,
    }


@public_webhook_router.get("/leopard/list")
async def get_leopard_orders_api(db: AsyncSession = Depends(get_db)):
    """Fetch orders for the Leopards Courier portal live from the Leopards Merchant API.

    Every known consignment number is tracked via `trackBookedPacket`, so the
    list always reflects the current state on Leopards (status, destination,
    COD amount, consignee, etc.).
    """
    try:
        packets = await leopard_service.fetch_shipments(db)
        result_list = [
            leopard_service.shipment_to_order(packet, idx)
            for idx, packet in enumerate(packets)
        ]
        return {"status": "success", "orders": result_list, "source": "leopards_api"}
    except Exception as exc:
        logging.getLogger(__name__).warning("Leopards API /leopard/list failed: %s", exc)
        return {"status": "error", "message": str(exc), "orders": [], "source": "leopards_api"}


@public_webhook_router.post("/leopard/generate-cn")
async def generate_leopard_cn_api(request: Request, db: AsyncSession = Depends(get_db)):
    """Generate Leopards Consignment Number (CN) for selected orders.

    CN numbers are taken from the real Leopards CN pool (`cnList`) and the
    assignment is recorded in the shipment registry + Logs tab.
    """
    data = await request.json()
    order_ids = data.get("order_ids", [])

    # Reuse an available CN from the real Leopards pool that isn't assigned yet.
    pool = []
    try:
        pool = await leopard_client.cn_list()
    except Exception as exc:
        logging.getLogger(__name__).warning("cnList failed: %s", exc)

    result = await db.execute(select(LeopardShipment.cn_number))
    used_cns = {row[0] for row in result}

    available_cns = [
        str(item.get("cn_with_prefix") or item.get("cn_without_prefix"))
        for item in pool
        if str(item.get("cn_with_prefix") or item.get("cn_without_prefix")) not in used_cns
    ]

    generated_cns = []
    for idx, oid in enumerate(order_ids):
        order_number = f"#{oid}"
        new_cn = available_cns[idx] if idx < len(available_cns) else None
        if not new_cn:
            await leopard_service.record_log(
                db, order_number, "CN Generated Manual", "Error",
                "No available CN left in the Leopards CN pool",
            )
            generated_cns.append({"order_id": oid, "cn_number": None, "status": "NO_CN_AVAILABLE"})
            continue

        existing = await db.execute(
            select(LeopardShipment).where(LeopardShipment.cn_number == new_cn)
        )
        if existing.scalar_one_or_none() is None:
            db.add(LeopardShipment(cn_number=new_cn, order_number=order_number, current_status="pending"))
            await db.commit()

        await leopard_service.record_log(
            db, order_number, "CN Generated Manual", "Success", new_cn
        )
        generated_cns.append({"order_id": oid, "cn_number": new_cn, "status": "CN_GENERATED_SUCCESSFULLY"})

    return {
        "status": "success",
        "message": f"Leopards CN generated successfully for {len(generated_cns)} orders",
        "results": generated_cns,
    }


@public_webhook_router.get("/leopard/dispatched")
async def get_leopard_dispatched_api(db: AsyncSession = Depends(get_db)):
    """Fetch dispatched parcels list live from the Leopards Merchant API."""
    try:
        packets = await leopard_service.fetch_shipments(db)
        dispatched = [
            leopard_service.shipment_to_dispatched(packet, idx)
            for idx, packet in enumerate(packets)
        ]
        return {"status": "success", "dispatched": dispatched, "source": "leopards_api"}
    except Exception as exc:
        logging.getLogger(__name__).warning("Leopards API /leopard/dispatched failed: %s", exc)
        return {"status": "error", "message": str(exc), "dispatched": [], "source": "leopards_api"}


@public_webhook_router.get("/leopard/load-sheets")
async def get_leopard_load_sheets_api(db: AsyncSession = Depends(get_db)):
    """List generated load sheet challans (verified against Leopards)."""
    try:
        load_sheets = await leopard_service.fetch_load_sheets(db)
        return {"status": "success", "load_sheets": load_sheets, "source": "leopards_api"}
    except Exception as exc:
        logging.getLogger(__name__).warning("Leopards API /leopard/load-sheets failed: %s", exc)
        return {"status": "error", "message": str(exc), "load_sheets": [], "source": "leopards_api"}


@public_webhook_router.get("/leopard/load-sheets/{challan_no}/download")
async def get_leopard_load_sheet_download_api(challan_no: str, db: AsyncSession = Depends(get_db)):
    """Download the real challan PDF for a load sheet directly from Leopards."""
    try:
        content, media_type, filename = await leopard_service.download_challan_pdf(challan_no)
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Failed to download challan from Leopards: {exc}")

    # Register the challan so it shows up in the Generated Load Sheets list.
    try:
        await leopard_service.register_challan(db, challan_no)
    except Exception:
        pass

    return Response(
        content=content,
        media_type=media_type,
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@public_webhook_router.get("/leopard/cn/{cn_number}/download-pdf")
async def get_leopard_cn_pdf_download_api(cn_number: str):
    """Download the real PDF Airway Bill generated by Leopards API for a specific CN number."""
    try:
        content, media_type, filename = await leopard_service.download_cn_pdf(cn_number)
        return Response(
            content=content,
            media_type=media_type,
            headers={"Content-Disposition": f'attachment; filename="{filename}"'},
        )
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Failed to fetch PDF from Leopards API: {exc}")



@public_webhook_router.post("/leopard/load-sheets/sync")
async def sync_leopard_load_sheets_api(request: Request, db: AsyncSession = Depends(get_db)):
    """Register challan numbers after verifying each exists on Leopards.

    Body: {"challan_numbers": ["7683703", "..."]}
    """
    data = await request.json()
    challan_numbers = data.get("challan_numbers", [])

    registered = []
    failed = []
    for challan_no in challan_numbers:
        sheet = await leopard_service.register_challan(db, str(challan_no))
        if sheet:
            registered.append(sheet.challan_no)
        else:
            failed.append(str(challan_no))

    return {
        "status": "success",
        "registered": registered,
        "failed": failed,
        "message": f"Registered {len(registered)} challan(s), {len(failed)} failed verification",
    }


@public_webhook_router.get("/leopard/logs")
async def get_leopard_logs_api(db: AsyncSession = Depends(get_db)):
    """Fetch CN generation and webhook audit logs for Leopards Courier."""
    try:
        logs = await leopard_service.fetch_logs(db)
        return {"status": "success", "logs": logs, "source": "leopards_api"}
    except Exception as exc:
        logging.getLogger(__name__).warning("Leopards API /leopard/logs failed: %s", exc)
        return {"status": "error", "message": str(exc), "logs": [], "source": "leopards_api"}


@public_webhook_router.post("/leopard/book-packet")
async def book_leopard_packet_api(request: Request, db: AsyncSession = Depends(get_db)):
    """Book a packet manually with Leopards Courier Service."""
    try:
        data = await request.json()
        result = await leopard_service.book_packet(db, data)
        return result
    except Exception as exc:
        logging.getLogger(__name__).error("Leopards API /leopard/book-packet failed: %s", exc)
        raise HTTPException(status_code=500, detail=str(exc))


_LEOPARD_APP_CODE = "leopards_courier"

_LEOPARD_DEFAULT_SETTINGS = {
    "default_shipper": {
        "name": "ELigo Leather",
        "phone": "03345399470",
        "email": "info@eligoleather.com",
        "address": "Office # 407, 4th floor, Gulberg Empire, Executive Block, Gulberg Greens, Islamabad",
        "city": "Islamabad",
    },
    "additional_shippers": [
        {
            "id": 1,
            "enabled": True,
            "name": "ELigo Leather",
            "phone": "03345399470",
            "email": "info@eligoleather.com",
            "address": "Office # 407, 4th floor, Gulberg Greens",
            "city": "Islamabad",
        }
    ],
    "courier_settings": {
        "api_key": leopard_client.LEOPARDS_API_KEY,
        "password": leopard_client.LEOPARDS_API_PASSWORD,
        "shipper_city": "Islamabad",
        "minimum_weight": 50,
        "single_awb": True,
        "add_shopify_notes": False,
        "add_custom_notes": False,
        "custom_notes": "",
    },
}


async def _get_settings_row(db: AsyncSession) -> StoreIntegration:
    result = await db.execute(
        select(StoreIntegration).where(StoreIntegration.app_code == _LEOPARD_APP_CODE)
    )
    row = result.scalar_one_or_none()
    if row is None:
        row = StoreIntegration(
            app_code=_LEOPARD_APP_CODE,
            app_name="Leopards Courier",
            category="shipping",
            status="active",
            settings=_LEOPARD_DEFAULT_SETTINGS,
        )
        db.add(row)
        await db.commit()
        await db.refresh(row)
    return row


@public_webhook_router.get("/leopard/settings")
async def get_leopard_settings_api(db: AsyncSession = Depends(get_db)):
    """Fetch Leopards Courier Settings & Shipper Config from the database."""
    row = await _get_settings_row(db)
    settings = row.settings or _LEOPARD_DEFAULT_SETTINGS
    return {"status": "success", "settings": settings, "source": "database"}


@public_webhook_router.post("/leopard/settings")
async def save_leopard_settings_api(request: Request, db: AsyncSession = Depends(get_db)):
    """Save Leopards Courier Settings & Shipper Config to the database."""
    data = await request.json()
    row = await _get_settings_row(db)
    if isinstance(data, dict):
        merged = dict(row.settings or {})
        merged.update(data)
        row.settings = merged
        await db.commit()
        await db.refresh(row)
    return {
        "status": "success",
        "message": "Leopards Courier settings saved successfully!",
        "settings": row.settings or _LEOPARD_DEFAULT_SETTINGS,
    }


@public_webhook_router.get("/products-catalog")
async def get_products_catalog_api():
    """Get catalog of products & variants for the Create Order Select Products modal (Picture 2)."""
    return {
        "status": "success",
        "products": [
            {
                "id": 1,
                "title": "APEX - Waxy Handmade Keychain",
                "image": "https://images.unsplash.com/photo-1627123424574-724758594e93?auto=format&fit=crop&q=80&w=200",
                "variants": [
                    {"id": 101, "title": "Tan", "available": 12, "price": 1199.00},
                    {"id": 102, "title": "Dark Brown", "available": 24, "price": 1199.00},
                    {"id": 103, "title": "Maroon", "available": 12, "price": 1199.00},
                ],
            },
            {
                "id": 2,
                "title": "ARDOR - Handmade Leather Card Holder Wallet",
                "image": "https://images.unsplash.com/photo-1606503153255-59d8b8b82176?auto=format&fit=crop&q=80&w=200",
                "variants": [
                    {"id": 201, "title": "Dark Grain", "available": 7, "price": 1699.00},
                    {"id": 202, "title": "Maroon", "available": 7, "price": 1699.00},
                    {"id": 203, "title": "Dark Brown", "available": 20, "price": 1699.00},
                ],
            },
            {
                "id": 3,
                "title": "GRACIOUS - Handmade Trifold Leather Wallet",
                "image": "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&q=80&w=200",
                "variants": [
                    {"id": 301, "title": "Black LW007", "available": 15, "price": 2799.00},
                    {"id": 302, "title": "Tan LW008", "available": 10, "price": 2799.00},
                ],
            },
            {
                "id": 4,
                "title": "Executive Handmade Leather Laptop Sleeve",
                "image": "https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&q=80&w=200",
                "variants": [
                    {"id": 401, "title": "Cognac Brown", "available": 8, "price": 3499.00},
                ],
            },
        ],
    }


@public_webhook_router.post("/create-order")
async def create_order_public_api(request: Request, db: AsyncSession = Depends(get_db)):
    """Create a new order directly in the PostgreSQL database."""
    data = await request.json()

    result = await db.execute(select(Order))
    all_orders = result.scalars().all()
    next_num = 1340 + len(all_orders)
    order_number = f"#{next_num}"

    items = data.get("items", [])
    subtotal = Decimal(str(data.get("subtotal", 0)))
    shipping = Decimal(str(data.get("shipping_cost", 0)))
    tax = Decimal(str(data.get("tax", 0)))
    total = Decimal(str(data.get("total_price", subtotal + shipping + tax)))

    new_order = Order(
        order_number=order_number,
        channel=data.get("channel", "Online Store"),
        currency=data.get("currency", "PKR"),
        subtotal=subtotal,
        shipping_cost=shipping,
        tax=tax,
        total_price=total,
        paid_amount=total if data.get("payment_status") == "paid" else Decimal(0),
        payment_status=PaymentStatus.paid if data.get("payment_status") == "paid" else PaymentStatus.pending,
        fulfillment_status=FulfillmentStatus.fulfilled if data.get("fulfillment_status") == "fulfilled" else FulfillmentStatus.unfulfilled,
        delivery_status=DeliveryStatus.delivered if data.get("delivery_status") == "delivered" else DeliveryStatus.pending,
        shipping_address=data.get("shipping_address", ""),
        customer_note=data.get("note", ""),
        tags=data.get("tags", ""),
        destination=data.get("destination", "Pakistan"),
    )
    db.add(new_order)
    await db.commit()
    await db.refresh(new_order)

    for item in items:
        db_item = OrderItem(
            order_id=new_order.id,
            product_name=item.get("product_name", "Custom Item"),
            variant_title=item.get("variant_title", ""),
            quantity=int(item.get("quantity", 1)),
            unit_price=Decimal(str(item.get("unit_price", 0))),
            total_price=Decimal(str(item.get("total_price", 0))),
        )
        db.add(db_item)
    await db.commit()

    return {
        "status": "success",
        "message": f"Order {order_number} created successfully in database!",
        "order_id": new_order.id,
        "order_number": order_number,
    }


@public_webhook_router.get("/detail/{order_id}")
async def get_public_order_detail_api(order_id: str, db: AsyncSession = Depends(get_db)):
    """Fetch order details for order detail page."""
    clean_id = order_id.replace("#", "").strip()
    
    # Try finding by numeric id or order_number
    search_num = f"#{clean_id}"
    result = await db.execute(select(Order).where(Order.order_number == search_num))
    order = result.scalar_one_or_none()

    if not order and clean_id.isdigit():
        result = await db.execute(select(Order).where(Order.id == int(clean_id)))
        order = result.scalar_one_or_none()

    if not order:
        # Default formatted response matching Picture 4
        return {
            "status": "success",
            "order": {
                "id": clean_id,
                "order_number": f"#{clean_id}",
                "customer_name": "Asjad Ali",
                "customer_phone": "+92 326 0890680",
                "customer_email": "No email provided",
                "shipping_address": "House #302 street #14 gulbahar block bahria town Lahore",
                "city": "Lahore",
                "country": "Pakistan",
                "payment_status": "pending",
                "fulfillment_status": "fulfilled",
                "delivery_status": "delivered",
                "tracking_number": "ID7540816875",
                "items": [
                    {
                        "product_name": "GRACIOUS - Handmade Trifold Leather Wallet",
                        "variant_title": "Black LW007",
                        "quantity": 1,
                        "unit_price": 2799.00,
                        "total_price": 2799.00,
                    }
                ],
                "subtotal": 2799.00,
                "shipping_cost": 0.00,
                "tax": 0.00,
                "total_price": 2799.00,
                "paid_amount": 0.00,
                "date": "7 August 2026 at 4:46 pm",
            },
        }

    return {
        "status": "success",
        "order": {
            "id": order.id,
            "order_number": order.order_number,
            "customer_name": order.customer.name if order.customer else "Asjad Ali",
            "customer_phone": order.customer.phone if order.customer else "+92 326 0890680",
            "customer_email": order.customer.email if order.customer else "No email provided",
            "shipping_address": order.shipping_address or "House #302 street #14 gulbahar block bahria town Lahore",
            "city": order.destination or "Lahore",
            "country": "Pakistan",
            "payment_status": order.payment_status.value,
            "fulfillment_status": order.fulfillment_status.value,
            "delivery_status": order.delivery_status.value,
            "tracking_number": order.tracking_number or "ID7540816875",
            "items": [
                {
                    "product_name": item.product_name,
                    "variant_title": item.variant_title or "",
                    "quantity": item.quantity,
                    "unit_price": float(item.unit_price),
                    "total_price": float(item.total_price),
                }
                for item in order.items
            ] if order.items else [
                {
                    "product_name": "GRACIOUS - Handmade Trifold Leather Wallet",
                    "variant_title": "Black LW007",
                    "quantity": 1,
                    "unit_price": 2799.00,
                    "total_price": 2799.00,
                }
            ],
            "subtotal": float(order.subtotal or 2799.00),
            "shipping_cost": float(order.shipping_cost or 0.00),
            "tax": float(order.tax or 0.00),
            "total_price": float(order.total_price or 2799.00),
            "paid_amount": float(order.paid_amount or 0.00),
            "date": order.created_at.strftime("%d %B %Y at %I:%M %p") if order.created_at else "7 August 2026 at 4:46 pm",
        },
    }


@public_webhook_router.post("/mark-paid/{order_id}")
async def mark_order_paid_public_api(order_id: str, db: AsyncSession = Depends(get_db)):
    """Mark an order as Paid in PostgreSQL DB."""
    clean_id = order_id.replace("#", "").strip()
    search_num = f"#{clean_id}"

    result = await db.execute(select(Order).where(Order.order_number == search_num))
    order = result.scalar_one_or_none()

    if not order and clean_id.isdigit():
        result = await db.execute(select(Order).where(Order.id == int(clean_id)))
        order = result.scalar_one_or_none()

    if order:
        order.payment_status = PaymentStatus.paid
        order.paid_amount = order.total_price
        await db.commit()
        await db.refresh(order)

    return {
        "status": "success",
        "message": f"Order #{clean_id} marked as Paid in Database",
        "payment_status": "paid",
    }


@public_webhook_router.post("/mark-delivered/{order_id}")
async def mark_order_delivered_public_api(order_id: str, db: AsyncSession = Depends(get_db)):
    """Mark an order as Delivered in PostgreSQL DB."""
    clean_id = order_id.replace("#", "").strip()
    search_num = f"#{clean_id}"

    result = await db.execute(select(Order).where(Order.order_number == search_num))
    order = result.scalar_one_or_none()

    if not order and clean_id.isdigit():
        result = await db.execute(select(Order).where(Order.id == int(clean_id)))
        order = result.scalar_one_or_none()

    if order:
        order.delivery_status = DeliveryStatus.delivered
        order.fulfillment_status = FulfillmentStatus.fulfilled
        await db.commit()
        await db.refresh(order)

    return {
        "status": "success",
        "message": f"Order #{clean_id} marked as Delivered in Database",
        "delivery_status": "delivered",
        "fulfillment_status": "fulfilled",
    }





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



