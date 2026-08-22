from datetime import datetime
import json
import logging
import csv
import io
import re
import secrets
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks, Request
from fastapi.responses import StreamingResponse, Response
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.core.dependencies import get_current_user
from app.modules.orders import service
from app.modules.orders import leopard_service
from app.modules.orders import leopard_client
from decimal import Decimal
from app.modules.orders.model import (
    Order, OrderItem, OrderAuditLog,
    PaymentStatus, FulfillmentStatus, DeliveryStatus, LeopardShipment,
)
from app.modules.customers.model import Customer, CustomerAddress
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


@public_webhook_router.get("/leopard/all-orders")
async def get_leopard_all_orders_api(db: AsyncSession = Depends(get_db)):
    """Fetch leopard shipments from local DB for the Orders tab.

    Only returns actual Leopards shipments (from CSV import, webhooks,
    manual booking, CN generation). No local-only orders are mixed in.
    """
    try:
        leopard_orders = await leopard_service.fetch_shipments_from_db(db)
        dispatched = await leopard_service.fetch_shipments_from_db_dispatched(db)

        return {
            "status": "success",
            "orders": leopard_orders,
            "dispatched": dispatched,
            "source": "database",
        }
    except Exception as exc:
        logging.getLogger(__name__).warning("Leopard /leopard/all-orders failed: %s", exc)
        return {"status": "error", "message": str(exc), "orders": [], "dispatched": [], "source": "error"}


@public_webhook_router.post("/leopard/import-csv")
async def import_leopard_csv_api(request: Request, db: AsyncSession = Depends(get_db)):
    """Import historical shipment data from a CSV file.

    Expects JSON body: {"csv_content": "..."} where csv_content is the raw
    CSV text. Parses headers flexibly and upserts into leopard_shipments.
    """
    try:
        data = await request.json()
        csv_content = data.get("csv_content", "")
        if not csv_content:
            raise HTTPException(status_code=400, detail="No CSV content provided")

        result = await leopard_service.import_shipments_from_csv(db, csv_content)

        await leopard_service.record_log(
            db,
            order_number=None,
            log_type="Historical CSV Import",
            status="Success" if result["imported"] > 0 else "Warning",
            detail=result["message"],
        )

        # Include debug info so frontend can show CSV headers if no CNs matched
        return {
            "status": "success",
            **result,
            "debug_headers": result.get("headers_found", []),
            "debug_sample_row": result.get("sample_row", {}),
        }
    except HTTPException:
        raise
    except Exception as exc:
        logging.getLogger(__name__).warning("Leopard CSV import failed: %s", exc)
        raise HTTPException(status_code=500, detail=str(exc))


@public_webhook_router.post("/leopard/generate-cn")
async def generate_leopard_cn_api(request: Request, db: AsyncSession = Depends(get_db)):
    """Generate Leopards Consignment Number (CN) and automatically book the shipment.

    Flow:
    1. Fetch CN pool from Leopards API
    2. For each order_id, look up order details from local DB
    3. Assign an available CN and call bookPacket API to register with Leopards
    4. Save booking to leopard_shipments table + cross-link Order.tracking_number
    5. Return results with CN numbers and booking status
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
                db, order_number, "CN Generated + Booked", "Error",
                "No available CN left in the Leopards CN pool",
            )
            generated_cns.append({"order_id": oid, "cn_number": None, "status": "NO_CN_AVAILABLE"})
            continue

        # Look up the order from local DB to get booking details
        clean_id = str(oid).replace("#", "").strip()
        order_row = None
        if clean_id.isdigit():
            order_result = await db.execute(
                select(Order)
                .options(selectinload(Order.customer), selectinload(Order.items))
                .where(Order.id == int(clean_id))
            )
            order_row = order_result.scalar_one_or_none()
        if not order_row:
            order_result = await db.execute(
                select(Order)
                .options(selectinload(Order.customer), selectinload(Order.items))
                .where(Order.order_number == order_number)
            )
            order_row = order_result.scalar_one_or_none()

        # Also check existing shipment to avoid double-booking
        existing = await db.execute(
            select(LeopardShipment).where(LeopardShipment.cn_number == new_cn)
        )
        if existing.scalar_one_or_none() is not None:
            generated_cns.append({"order_id": oid, "cn_number": new_cn, "status": "ALREADY_EXISTS"})
            continue

        if order_row:
            # Extract consignee details from the local order
            customer_name = ""
            customer_phone = ""
            if order_row.customer:
                customer_name = f"{order_row.customer.first_name or ''} {order_row.customer.last_name or ''}".strip()
                customer_phone = order_row.customer.phone or ""

            consignee_name = customer_name or "Customer"
            consignee_phone = customer_phone or "0000000000"
            consignee_address = order_row.shipping_address or ""
            destination_city = order_row.destination or "Islamabad"
            cod_amount = str(order_row.total_price or 0)
            weight = "500"
            pieces = "1"

            # Call the real Leopards bookPacket API
            book_payload = {
                "order_id": order_number,
                "cod_amount": cod_amount,
                "consignee_name": consignee_name,
                "consignee_phone": consignee_phone,
                "consignee_email": "",
                "consignee_address": consignee_address,
                "destination_city": destination_city,
                "special_instructions": "N/A",
                "weight": weight,
                "weight_grams": 500,
                "pieces": 1,
            }

            try:
                book_res = await leopard_client.book_packet_api(book_payload)
                api_status = book_res.get("status")
                live_cn = (
                    book_res.get("track_number")
                    or book_res.get("cn_number")
                    or book_res.get("track_no")
                )

                api_error = book_res.get("error")
                if api_status == 0 or (api_error and api_error != "0"):
                    # API error — still save CN locally as pending
                    now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
                    db.add(LeopardShipment(
                        cn_number=new_cn,
                        order_number=order_number,
                        current_status="pending",
                        booking_date=now_str,
                        destination_city=destination_city,
                        consignee_name=consignee_name,
                        consignee_phone=consignee_phone,
                        consignee_address=consignee_address,
                        collect_amount=cod_amount,
                        weight=weight,
                        pieces=1,
                        raw_json=json.dumps(book_res, default=str),
                    ))
                    await db.commit()
                    await leopard_service.record_log(
                        db, order_number, "CN Generated + Booked", "Partial",
                        f"CN {new_cn} assigned but Leopards booking failed: {api_error}",
                    )
                    generated_cns.append({"order_id": oid, "cn_number": new_cn, "status": "CN_GENERATED_BOOK_FAILED"})
                elif live_cn:
                    # Success — use the CN returned by Leopards (may differ from pool CN)
                    cn_number = str(live_cn).strip()
                    now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
                    booking_date_str = datetime.now().strftime("%Y-%m-%d")

                    # Save/updated shipment with full booking data
                    db.add(LeopardShipment(
                        cn_number=cn_number,
                        order_number=order_number,
                        booking_date=now_str,
                        destination_city=destination_city,
                        consignee_name=consignee_name,
                        consignee_phone=consignee_phone,
                        consignee_address=consignee_address,
                        collect_amount=cod_amount,
                        weight=weight,
                        pieces=1,
                        current_status="Booked",
                        raw_json=json.dumps(book_res, default=str),
                    ))
                    # Cross-link Order.tracking_number + fulfillment sync
                    order_row.tracking_number = cn_number
                    order_row.tracking_company = "Leopards Courier"
                    was_unfulfilled = order_row.fulfillment_status != FulfillmentStatus.fulfilled
                    order_row.fulfillment_status = FulfillmentStatus.fulfilled

                    db.add(OrderAuditLog(
                        order_id=order_row.id,
                        event_type="courier_update",
                        description=(
                            f"Leopards Courier booked shipment CN #{cn_number} for "
                            f"{consignee_name or 'customer'} to {destination_city}. "
                            f"COD: Rs {cod_amount}"
                        ),
                        actor_name="Leopards Courier",
                    ))
                    if was_unfulfilled:
                        db.add(OrderAuditLog(
                            order_id=order_row.id,
                            event_type="fulfillment_updated",
                            description=(
                                f"Leopards Courier marked {len(order_row.items) if order_row.items else 1} item(s) "
                                f"as fulfilled from Office # 407, 4th floor, Gulberg Empire, "
                                f"Executive Block, Gulberg Greens, Islamabad."
                            ),
                            actor_name="Leopards Courier",
                        ))
                    await db.commit()

                    await leopard_service.record_log(
                        db, order_number, "CN Generated + Booked", "Success",
                        f"CN #{cn_number} booked for {consignee_name} to {destination_city}. COD: Rs {cod_amount}",
                    )
                    generated_cns.append({"order_id": oid, "cn_number": cn_number, "status": "CN_GENERATED_SUCCESSFULLY"})
                else:
                    # No CN returned from API
                    now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
                    db.add(LeopardShipment(
                        cn_number=new_cn,
                        order_number=order_number,
                        current_status="pending",
                        booking_date=now_str,
                        raw_json=json.dumps(book_res, default=str),
                    ))
                    await db.commit()
                    await leopard_service.record_log(
                        db, order_number, "CN Generated + Booked", "Partial",
                        f"CN {new_cn} assigned but Leopards did not return a booking CN",
                    )
                    generated_cns.append({"order_id": oid, "cn_number": new_cn, "status": "CN_GENERATED_BOOK_FAILED"})
            except Exception as book_exc:
                # Network error — save CN locally as pending
                now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
                db.add(LeopardShipment(
                    cn_number=new_cn,
                    order_number=order_number,
                    current_status="pending",
                    booking_date=now_str,
                    raw_json=json.dumps({"error": str(book_exc)}, default=str),
                ))
                await db.commit()
                await leopard_service.record_log(
                    db, order_number, "CN Generated + Booked", "Error",
                    f"CN {new_cn} assigned but booking API call failed: {book_exc}",
                )
                generated_cns.append({"order_id": oid, "cn_number": new_cn, "status": "CN_GENERATED_BOOK_FAILED"})
        else:
            # Order not found in local DB — just assign CN without booking
            now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            db.add(LeopardShipment(cn_number=new_cn, order_number=order_number, current_status="pending", booking_date=now_str))
            await db.commit()
            await leopard_service.record_log(
                db, order_number, "CN Generated + Booked", "Warning",
                f"CN {new_cn} assigned but order not found in local DB — manual booking required",
            )
            generated_cns.append({"order_id": oid, "cn_number": new_cn, "status": "CN_GENERATED_NO_ORDER_DATA"})

    return {
        "status": "success",
        "message": f"Leopards CN generated for {len(generated_cns)} order(s)",
        "results": generated_cns,
    }


@public_webhook_router.get("/leopard/dispatched")
async def get_leopard_dispatched_api(db: AsyncSession = Depends(get_db)):
    """Fetch dispatched parcels list from local DB (historical imports + webhooks + bookings)."""
    try:
        dispatched = await leopard_service.fetch_shipments_from_db_dispatched(db)
        return {"status": "success", "dispatched": dispatched, "source": "database"}
    except Exception as exc:
        logging.getLogger(__name__).warning("Leopards API /leopard/dispatched failed: %s", exc)
        return {"status": "error", "message": str(exc), "dispatched": [], "source": "database"}


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


@public_webhook_router.get("/leopard/sync-all")
async def sync_all_leopard_api(db: AsyncSession = Depends(get_db)):
    """Full sync: discover all CNs, track them via Leopards API, upsert locally."""
    try:
        result = await leopard_service.sync_all_from_leopards(db)
        # Build orders + dispatched from tracked packets for the frontend
        packets = result.get("packets", [])
        orders = [
            leopard_service.shipment_to_order(packet, idx)
            for idx, packet in enumerate(packets)
        ]
        dispatched = [
            leopard_service.shipment_to_dispatched(packet, idx)
            for idx, packet in enumerate(packets)
        ]
        return {
            "status": "success",
            "summary": result.get("summary", {}),
            "orders": orders,
            "dispatched": dispatched,
            "new_cns_discovered": result.get("new_cns_discovered", []),
            "not_found_cns": result.get("not_found_cns", []),
        }
    except Exception as exc:
        logging.getLogger(__name__).warning("Leopard /leopard/sync-all failed: %s", exc)
        return {"status": "error", "message": str(exc)}


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
async def get_products_catalog_api(db: AsyncSession = Depends(get_db)):
    """Real product catalog (products + variants) from the database for the Create Order page."""
    from app.modules.catalog.model import Product, ProductVariant, ProductImage

    result = await db.execute(
        select(Product)
        .options(selectinload(Product.variants), selectinload(Product.images))
        .order_by(Product.title)
    )
    products = result.scalars().all()

    catalog = []
    for p in products:
        image = None
        if p.images:
            image = sorted(p.images, key=lambda i: i.position or 0)[0].url
        variants = [
            {
                "id": v.id,
                "title": v.title,
                "available": None,
                "price": float(v.price),
            }
            for v in p.variants
        ]
        catalog.append({
            "id": p.id,
            "title": p.title,
            "image": image,
            "variants": variants,
        })

    return {"status": "success", "products": catalog}


@public_webhook_router.post("/create-order")
async def create_order_public_api(request: Request, db: AsyncSession = Depends(get_db)):
    """Create a new order directly in the PostgreSQL database.

    Called by the storefront (eligo-frontend) checkout. Resolves/creates the
    real Customer record from the checkout contact fields, links it to the
    order and writes the initial timeline (audit log) events so the admin
    panel order page reflects live database data.
    """
    data = await request.json()

    # ---- Resolve customer (structured fields first, legacy string fallback) ----
    first_name = (data.get("first_name") or "").strip()
    last_name = (data.get("last_name") or "").strip()
    email = (data.get("email") or "").strip() or None
    phone = (data.get("phone") or "").strip() or None
    city = (data.get("city") or "").strip()
    postal_code = (data.get("postal_code") or "").strip()
    country = (data.get("country") or "Pakistan").strip()

    shipping_address_str = (data.get("shipping_address") or "").strip()
    address_body = shipping_address_str

    if not (first_name or phone or email):
        # Legacy payload: "Name | Phone: 03xx | addr line" packed into shipping_address
        parts = [p.strip() for p in shipping_address_str.split("|")]
        if parts:
            first_name = parts[0]
            for p in parts[1:]:
                if p.lower().startswith("phone"):
                    phone = p.split(":", 1)[1].strip() if ":" in p else None
                    address_body = ""
                else:
                    address_body = p
        email = (data.get("note") or "").replace("Contact email:", "").strip() or None

    full_name = f"{first_name} {last_name}".strip()

    customer = None
    if phone:
        result = await db.execute(select(Customer).where(Customer.phone == phone))
        customer = result.scalar_one_or_none()
    if customer is None and email:
        result = await db.execute(select(Customer).where(Customer.email == email))
        customer = result.scalar_one_or_none()

    is_new_customer = False
    if customer is None:
        customer = Customer(
            first_name=first_name or None,
            last_name=last_name or None,
            email=email,
            phone=phone,
            location=", ".join(x for x in (city, country) if x) or None,
            postal_code=postal_code or None,
        )
        db.add(customer)
        await db.flush()
        is_new_customer = True

    if address_body and is_new_customer:
        db.add(CustomerAddress(
            customer_id=customer.id,
            first_name=first_name or None,
            last_name=last_name or None,
            address_line1=address_body or "—",
            city=city or "—",
            province=None,
            postal_code=postal_code or None,
            country=country,
            phone=phone,
            is_default=True,
            address_type="shipping",
        ))

    # ---- Order number: max existing numeric suffix + 1 ----
    result = await db.execute(select(Order.order_number))
    max_num = 1339
    for (num,) in result.all():
        match = re.search(r"(\d+)", str(num or ""))
        if match:
            max_num = max(max_num, int(match.group(1)))
    order_number = f"#{max_num + 1}"

    items = data.get("items", [])
    subtotal = Decimal(str(data.get("subtotal", 0)))
    shipping = Decimal(str(data.get("shipping_cost", 0)))
    tax = Decimal(str(data.get("tax", 0)))
    total = Decimal(str(data.get("total_price", subtotal + shipping + tax)))

    new_order = Order(
        order_number=order_number,
        customer_id=customer.id,
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
        destination=data.get("destination", country or "Pakistan"),
    )
    db.add(new_order)
    await db.flush()

    for item in items:
        db_item = OrderItem(
            order_id=new_order.id,
            product_id=item.get("product_id"),
            variant_id=item.get("variant_id"),
            product_name=item.get("product_name", "Custom Item"),
            variant_title=item.get("variant_title", ""),
            quantity=int(item.get("quantity", 1)),
            unit_price=Decimal(str(item.get("unit_price", 0))),
            total_price=Decimal(str(item.get("total_price", 0))),
        )
        db.add(db_item)

    # ---- Customer aggregate metrics stay in sync with real orders ----
    customer.total_orders = (customer.total_orders or 0) + 1
    customer.amount_spent = Decimal(str(customer.amount_spent or 0)) + total
    now = datetime.now()
    customer.last_order_date = now
    if customer.first_order_date is None:
        customer.first_order_date = now

    # ---- Initial timeline events (real, persisted, shown on the admin order page) ----
    placed_by = full_name or customer.email or "Customer"
    db.add(OrderAuditLog(
        order_id=new_order.id,
        event_type="order_created",
        description=f"{placed_by} placed this order on {new_order.channel}.",
        actor_name=placed_by,
    ))
    if new_order.payment_status == PaymentStatus.pending:
        db.add(OrderAuditLog(
            order_id=new_order.id,
            event_type="payment_updated",
            description=(
                f"A Rs{total:,.2f} {new_order.currency} payment is pending on "
                f"Cash on Delivery (COD)."
            ),
        ))
    confirmation_code = secrets.token_urlsafe(6).upper().replace("-", "").replace("_", "")[:10]
    db.add(OrderAuditLog(
        order_id=new_order.id,
        event_type="status_changed",
        description=f"Confirmation #{confirmation_code} was generated for this order.",
        metadata_json=json.dumps({"confirmation_number": confirmation_code}),
    ))

    await db.commit()
    await db.refresh(new_order)

    return {
        "status": "success",
        "message": f"Order {order_number} created successfully in database!",
        "order_id": new_order.id,
        "order_number": order_number,
        "confirmation_number": confirmation_code,
        "customer_id": customer.id,
    }


@public_webhook_router.get("/detail/{order_id}")
async def get_public_order_detail_api(order_id: str, db: AsyncSession = Depends(get_db)):
    """Fetch order details live from the database. 404 when the order does not exist."""
    clean_id = order_id.replace("#", "").strip()

    # Try finding by numeric id or order_number
    search_num = f"#{clean_id}"
    result = await db.execute(
        select(Order)
        .options(selectinload(Order.customer), selectinload(Order.items))
        .where(Order.order_number == search_num)
    )
    order = result.scalar_one_or_none()

    if not order and clean_id.isdigit():
        result = await db.execute(
            select(Order)
            .options(selectinload(Order.customer), selectinload(Order.items))
            .where(Order.id == int(clean_id))
        )
        order = result.scalar_one_or_none()

    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    customer = order.customer
    customer_name = None
    if customer:
        parts = [customer.first_name or "", customer.last_name or ""]
        customer_name = " ".join(p for p in parts if p).strip() or customer.email

    return {
        "status": "success",
        "order": {
            "id": order.id,
            "order_number": order.order_number,
            "customer_name": customer_name,
            "customer_phone": customer.phone if customer else None,
            "customer_email": customer.email if customer else None,
            "shipping_address": order.shipping_address,
            "city": order.destination,
            "country": "Pakistan",
            "payment_status": order.payment_status.value,
            "fulfillment_status": order.fulfillment_status.value,
            "delivery_status": order.delivery_status.value,
            "tracking_number": order.tracking_number,
            "items": [
                {
                    "product_name": item.product_name,
                    "variant_title": item.variant_title or "",
                    "quantity": item.quantity,
                    "unit_price": float(item.unit_price),
                    "total_price": float(item.total_price),
                }
                for item in order.items
            ],
            "subtotal": float(order.subtotal or 0),
            "shipping_cost": float(order.shipping_cost or 0),
            "tax": float(order.tax or 0),
            "total_price": float(order.total_price or 0),
            "paid_amount": float(order.paid_amount or 0),
            "date": order.created_at.strftime("%d %B %Y at %I:%M %p") if order.created_at else None,
        },
    }


@public_webhook_router.post("/mark-paid/{order_id}")
async def mark_order_paid_public_api(
    order_id: str,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
):
    """Mark an order as Paid in PostgreSQL DB and persist a timeline event."""
    clean_id = order_id.replace("#", "").strip()
    search_num = f"#{clean_id}"

    result = await db.execute(
        select(Order)
        .options(selectinload(Order.customer))
        .where(Order.order_number == search_num)
    )
    order = result.scalar_one_or_none()

    if not order and clean_id.isdigit():
        result = await db.execute(
            select(Order)
            .options(selectinload(Order.customer))
            .where(Order.id == int(clean_id))
        )
        order = result.scalar_one_or_none()

    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    customer = order.customer
    parts = [customer.first_name or "", customer.last_name or ""] if customer else []
    customer_name = " ".join(p for p in parts if p).strip() or (customer.email if customer else None)

    already_paid = order.payment_status == PaymentStatus.paid
    order.payment_status = PaymentStatus.paid
    order.paid_amount = order.total_price
    if not already_paid:
        db.add(OrderAuditLog(
            order_id=order.id,
            event_type="payment_updated",
            description=(
                f"A Rs{order.total_price:,.2f} {order.currency} payment was captured "
                f"and the order is marked as Paid."
            ),
            actor_name="Admin",
        ))
    await db.commit()
    await db.refresh(order)

    from app.modules.settings.notifications.service import background_dispatch_event
    background_tasks.add_task(
        background_dispatch_event,
        "order_paid",
        {
            "email": customer.email if customer else None,
            "customer_email": customer.email if customer else None,
            "customer_name": customer_name or "Valued Customer",
            "order_number": order.order_number,
            "total_price": str(order.total_price),
            "paid_amount": str(order.paid_amount),
            "currency": str(order.currency) if hasattr(order, "currency") else "PKR",
        },
    )

    return {
        "status": "success",
        "message": f"Order #{clean_id} marked as Paid in Database",
        "payment_status": "paid",
    }


@public_webhook_router.post("/mark-delivered/{order_id}")
async def mark_order_delivered_public_api(
    order_id: str,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
):
    """Mark an order as Delivered in PostgreSQL DB and persist a timeline event."""
    clean_id = order_id.replace("#", "").strip()
    search_num = f"#{clean_id}"

    result = await db.execute(
        select(Order)
        .options(selectinload(Order.customer), selectinload(Order.items))
        .where(Order.order_number == search_num)
    )
    order = result.scalar_one_or_none()

    if not order and clean_id.isdigit():
        result = await db.execute(
            select(Order)
            .options(selectinload(Order.customer), selectinload(Order.items))
            .where(Order.id == int(clean_id))
        )
        order = result.scalar_one_or_none()

    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    customer = order.customer
    parts = [customer.first_name or "", customer.last_name or ""] if customer else []
    customer_display_name = " ".join(p for p in parts if p).strip() or (customer.email if customer else None)

    already_delivered = order.delivery_status == DeliveryStatus.delivered
    order.delivery_status = DeliveryStatus.delivered
    order.fulfillment_status = FulfillmentStatus.fulfilled
    if not already_delivered:
        items_count = len(order.items or [])
        courier = order.tracking_company or "Leopards Courier"
        db.add(OrderAuditLog(
            order_id=order.id,
            event_type="delivery_updated",
            description=(
                f"{courier} marked {items_count or 1} item(s) as delivered"
                + (f" (Tracking #{order.tracking_number})." if order.tracking_number else ".")
            ),
            actor_name=courier,
        ))
    await db.commit()
    await db.refresh(order)

    from app.modules.settings.notifications.service import background_dispatch_event
    background_tasks.add_task(
        background_dispatch_event,
        "order_delivered",
        {
            "email": customer.email if customer else None,
            "customer_email": customer.email if customer else None,
            "customer_name": customer_display_name or "Valued Customer",
            "order_number": order.order_number,
            "tracking_number": order.tracking_number,
            "tracking_company": order.tracking_company or "Leopards Courier",
            "total_price": str(order.total_price),
            "currency": str(order.currency) if hasattr(order, "currency") else "PKR",
        },
    )

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



