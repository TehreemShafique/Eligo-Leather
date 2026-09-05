from datetime import datetime, timedelta
import json
import logging
import csv
import io
import re
import secrets
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks, Request
from fastapi.responses import StreamingResponse, Response
from sqlalchemy import select, or_, update, func
from sqlalchemy.exc import IntegrityError
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
from app.modules.catalog.model import Product, ProductVariant, ProductStatus
from app.modules.settings.apps.model import StoreIntegration
from app.modules.orders.schema import (
    OrderCreate, OrderUpdate, OrderOut, OrderListOut, OrderNoteCreate, OrderNoteOut,
    OrderAuditLogOut,
    DraftOrderCreate, DraftOrderUpdate, DraftOrderOut, DraftOrderItemCreate, DraftOrderItemOut,
    AbandonedCheckoutCreate, AbandonedCheckoutUpdate, AbandonedCheckoutOut, AbandonedCheckoutListOut,
    SendRecoveryEmailRequest, SendRecoveryEmailResponse,
    ConfirmOrderResponse, OrderConfirmationEmailStatus,
    ExportOrdersRequest, OrdersAnalyticsSummary,
)
from app.modules.settings.notifications.service import (
    background_dispatch_order_placed,
    dispatch_order_confirmation_email,
)

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


@router.get("/leopard/list")
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


@router.get("/leopard/all-orders")
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


@router.post("/leopard/import-csv")
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


@router.post("/leopard/generate-cn")
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
            consignee_name = order_row.customer_name or "Customer"
            consignee_phone = order_row.customer_phone or "0000000000"
            consignee_address = leopard_service.clean_consignee_address(
                order_row.shipping_address
            )
            destination_city = (
                order_row.shipping_city
                or order_row.destination
                or ""
            ).strip()
            if not destination_city or destination_city.lower() == "pakistan":
                generated_cns.append({
                    "order_id": oid,
                    "cn_number": None,
                    "status": "MISSING_CITY",
                    "error": "Order has no consignee city — set one before generating a CN.",
                })
                continue
            cod_amount = str(order_row.total_price or 0)
            weight = "500"
            pieces = "1"

            # Shipper/company info (the business shipping — never the
            # customer/consignee). Source of truth is the admin-configured
            # default_shipper; empty fields fall back to 'self' in the client.
            _shipper = await leopard_service.get_leopard_default_shipper(db)

            # Call the real Leopards bookPacket API
            book_payload = {
                "order_id": order_number,
                "cod_amount": cod_amount,
                "consignee_name": consignee_name,
                "consignee_phone": consignee_phone,
                "consignee_email": "",
                "consignee_address": consignee_address,
                "destination_city": destination_city,
                "shipper_name": _shipper.get("name") or "",
                "shipper_phone": _shipper.get("phone") or "",
                "shipper_email": _shipper.get("email") or "",
                "shipper_address": _shipper.get("address") or "",
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

                    # Auto-register the load-sheet challan so the CN appears
                    # in the Generate Load Sheets tab. Best-effort.
                    try:
                        await leopard_service.ensure_load_sheet_for_cn(db, cn_number)
                    except Exception as sheet_exc:
                        logging.getLogger(__name__).warning(
                            "generate-cn: challan registration failed for CN %s: %s",
                            cn_number,
                            sheet_exc,
                        )
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


@router.get("/leopard/dispatched")
async def get_leopard_dispatched_api(db: AsyncSession = Depends(get_db)):
    """Fetch dispatched parcels list from local DB (historical imports + webhooks + bookings)."""
    try:
        dispatched = await leopard_service.fetch_shipments_from_db_dispatched(db)
        return {"status": "success", "dispatched": dispatched, "source": "database"}
    except Exception as exc:
        logging.getLogger(__name__).warning("Leopards API /leopard/dispatched failed: %s", exc)
        return {"status": "error", "message": str(exc), "dispatched": [], "source": "database"}


@router.get("/leopard/load-sheets")
async def get_leopard_load_sheets_api(db: AsyncSession = Depends(get_db)):
    """List generated load sheet challans (verified against Leopards)."""
    try:
        load_sheets = await leopard_service.fetch_load_sheets(db)
        return {"status": "success", "load_sheets": load_sheets, "source": "leopards_api"}
    except Exception as exc:
        logging.getLogger(__name__).warning("Leopards API /leopard/load-sheets failed: %s", exc)
        return {"status": "error", "message": str(exc), "load_sheets": [], "source": "leopards_api"}


@router.get("/leopard/load-sheets/{challan_no}/download")
async def get_leopard_load_sheet_download_api(challan_no: str, db: AsyncSession = Depends(get_db)):
    """Download the real challan PDF for a load sheet directly from Leopards."""
    try:
        content, media_type, filename = await leopard_service.download_challan_pdf(challan_no)
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Failed to download challan from Leopards: {exc}")

    # Register the challan so it shows up in the Generated Load Sheets list.
    try:
        await leopard_service.register_challan(db, challan_no)
    except Exception:  # nosec B110
        pass

    return Response(
        content=content,
        media_type=media_type,
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.get("/leopard/cn/{cn_number}/download-pdf")
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



@router.post("/leopard/load-sheets/sync")
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


@router.get("/leopard/logs")
async def get_leopard_logs_api(db: AsyncSession = Depends(get_db)):
    """Fetch CN generation and webhook audit logs for Leopards Courier."""
    try:
        logs = await leopard_service.fetch_logs(db)
        return {"status": "success", "logs": logs, "source": "leopards_api"}
    except Exception as exc:
        logging.getLogger(__name__).warning("Leopards API /leopard/logs failed: %s", exc)
        return {"status": "error", "message": str(exc), "logs": [], "source": "leopards_api"}


@router.post("/leopard/book-packet")
async def book_leopard_packet_api(request: Request, db: AsyncSession = Depends(get_db)):
    """Book a packet manually with Leopards Courier Service."""
    try:
        data = await request.json()
        result = await leopard_service.book_packet(db, data)
        return result
    except Exception as exc:
        logging.getLogger(__name__).error("Leopards API /leopard/book-packet failed: %s", exc)
        raise HTTPException(status_code=500, detail=str(exc))


@router.get("/leopard/sync-all")
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


@router.get("/leopard/settings")
async def get_leopard_settings_api(db: AsyncSession = Depends(get_db)):
    """Fetch Leopards Courier Settings & Shipper Config from the database."""
    row = await _get_settings_row(db)
    settings = row.settings or _LEOPARD_DEFAULT_SETTINGS
    return {"status": "success", "settings": settings, "source": "database"}


@router.post("/leopard/settings")
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


async def _auto_book_leopards(db: AsyncSession, order: Order, shipping_settings) -> None:
    """Best-effort Leopards Courier booking after an order is confirmed.

    Uses the admin shipper configuration (Settings -> Shipping) as the parcel
    origin and the customer's delivery-address snapshot as the destination.
    On success the CN is stored against the order and delivery moves to
    `booked`. Any failure is logged but never raised. Guarded so an order that
    already has a tracking number (already booked) is never booked twice.
    Manual CN generation remains available from the admin panel.
    """
    logger = logging.getLogger(__name__)

    # Idempotency guard: an order that already carries a CN has already been
    # booked; do not create a second shipment.
    if order.tracking_number:
        logger.info("Skipping auto Leopards booking for %s: already booked (CN %s)",
                    order.order_number, order.tracking_number)
        return

    consignee_name = order.shipping_name or "Customer"
    consignee_phone = order.shipping_phone or ""
    consignee_address = order.shipping_address_line1 or leopard_service.clean_consignee_address(
        order.shipping_address
    )
    destination_city = (order.shipping_city or order.destination or "").strip()
    if not destination_city or destination_city.lower() == "pakistan":
        logger.info(
            "Skipping auto Leopards booking for %s: no consignee city on the order",
            order.order_number,
        )
        return
    cod_amount = str(order.total_price or 0) if order.payment_status == PaymentStatus.pending else "0"

    # Shipper/company info (the business shipping — never the customer/
    # consignee). Source of truth is the admin-configured default_shipper;
    # empty fields fall back to 'self' in the client.
    _shipper = await leopard_service.get_leopard_default_shipper(db)

    book_payload = {
        "order_id": order.order_number,
        "cod_amount": cod_amount,
        "consignee_name": consignee_name,
        "consignee_phone": consignee_phone,
        "consignee_email": "",
        "consignee_address": consignee_address,
        "destination_city": destination_city,
        # Admin shipper address acts as the origin city on the waybill.
        "origin_city": getattr(shipping_settings, "sender_city", None) or "self",
        "shipper_name": _shipper.get("name") or "",
        "shipper_phone": _shipper.get("phone") or "",
        "shipper_email": _shipper.get("email") or "",
        "shipper_address": _shipper.get("address") or "",
        "special_instructions": f"Return to: {getattr(shipping_settings, 'return_address', '') or 'N/A'}",
        "weight": "500",
        "pieces": 1,
    }

    book_res = await leopard_client.book_packet_api(book_payload)
    api_status = book_res.get("status")
    live_cn = (
        book_res.get("track_number")
        or book_res.get("cn_number")
        or book_res.get("track_no")
    )
    if not live_cn or api_status == 0:
        logger.warning("Leopards auto-booking did not return a CN for %s: %s", order.order_number, book_res)
        await leopard_service.record_log(
            db, order.order_number, "Auto Booking", "Failed",
            f"Automatic booking failed: {book_res.get('error') or book_res.get('message') or 'no CN returned'}",
        )
        return

    cn_number = str(live_cn).strip()
    now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    db.add(LeopardShipment(
        cn_number=cn_number,
        order_number=order.order_number,
        booking_date=now_str,
        destination_city=destination_city,
        consignee_name=consignee_name,
        consignee_phone=consignee_phone,
        consignee_address=consignee_address,
        collect_amount=cod_amount,
        weight="500",
        pieces=1,
        current_status="Booked",
        raw_json=json.dumps(book_res, default=str),
    ))
    order.tracking_number = cn_number
    order.tracking_company = "Leopards Courier"
    order.delivery_status = DeliveryStatus.booked
    db.add(OrderAuditLog(
        order_id=order.id,
        event_type="courier_update",
        description=(
            f"Leopards Courier booked shipment CN #{cn_number} for "
            f"{consignee_name} to {destination_city}. COD: Rs {cod_amount}"
        ),
        actor_name="Leopards Courier (auto)",
    ))
    await db.commit()

    await leopard_service.record_log(
        db, order.order_number, "Auto Booking", "Success",
        f"CN #{cn_number} booked automatically for {consignee_name} to {destination_city}. COD: Rs {cod_amount}",
    )

    # Auto-register the load-sheet challan so the CN shows up in the
    # Generate Load Sheets tab. Best-effort; booking already succeeded.
    try:
        await leopard_service.ensure_load_sheet_for_cn(db, cn_number)
    except Exception as sheet_exc:
        logging.getLogger(__name__).warning(
            "auto-booking: challan registration failed for CN %s: %s",
            cn_number,
            sheet_exc,
        )


MAX_ORDER_LINE_QUANTITY = 99
DUPLICATE_ORDER_WINDOW_HOURS = 24


async def _resolve_and_price_order_items(
    db: AsyncSession, raw_items: list | None
) -> tuple[list[dict], Decimal]:
    """Resolve every submitted cart line against the live catalog and recompute
    all prices server-side.

    Returns ``(resolved_items, subtotal)``. Each resolved item only carries
    values read from the database (product/variant ids, names, SKU, price) plus
    a validated quantity; the browser-supplied ``unit_price``/``total_price``
    are ignored. Raises HTTP 400 for empty carts, unknown/inactive products or
    variants, invalid quantities and out-of-stock lines.
    """
    if not isinstance(raw_items, (list, tuple)) or not raw_items:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Your cart is empty. Add at least one product before checking out.",
        )
    if len(raw_items) > 100:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Too many items in the cart.",
        )

    resolved: list[dict] = []
    subtotal = Decimal("0")

    for raw in raw_items:
        if not isinstance(raw, dict):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="One of your cart items is not valid.",
            )

        # ---- Validate quantity (whole number between 1 and the cap) --------
        try:
            quantity = int(raw.get("quantity", 1))
        except (TypeError, ValueError):
            quantity = 0
        if (
            isinstance(quantity, bool)
            or not 1 <= quantity <= MAX_ORDER_LINE_QUANTITY
        ):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    "Each product quantity must be a whole number between 1 "
                    f"and {MAX_ORDER_LINE_QUANTITY}."
                ),
            )

        # ---- Resolve variant + product from the database -------------------
        variant: ProductVariant | None = None
        product: Product | None = None
        variant_id = raw.get("variant_id")
        product_id = raw.get("product_id")

        if variant_id not in (None, ""):
            vid = variant_id
            if isinstance(vid, str):
                vid = vid.strip()
            try:
                vid = int(vid)
            except (TypeError, ValueError):
                vid = None
            if vid is not None:
                variant = (
                    await db.execute(
                        select(ProductVariant)
                        .options(selectinload(ProductVariant.product))
                        .where(ProductVariant.id == vid)
                    )
                ).scalar_one_or_none()

        if variant is not None:
            product = variant.product
            if product is not None and product_id not in (None, ""):
                try:
                    pid = int(product_id)
                except (TypeError, ValueError):
                    pid = None
                if pid is not None and product.id != pid:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="One of your cart items is not valid.",
                    )
        else:
            pid = product_id
            if isinstance(pid, str):
                pid = pid.strip()
            try:
                pid = int(pid) if pid not in (None, "") else None
            except (TypeError, ValueError):
                pid = None
            if pid is not None:
                product = (
                    await db.execute(
                        select(Product)
                        .options(selectinload(Product.variants))
                        .where(Product.id == pid)
                    )
                ).scalar_one_or_none()
            if product is not None:
                variant = next(
                    (v for v in product.variants if v.is_canonical and v.is_active),
                    None,
                )
                if variant is None:
                    variant = next(
                        (v for v in product.variants if v.is_active), None
                    )

        if product is None or variant is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="One of the products in your cart is no longer available.",
            )
        if product.status != ProductStatus.active:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"“{product.title}” is not available for purchase right now.",
            )
        if not variant.is_active:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"“{variant.title or product.title}” is not available for purchase right now.",
            )

        # ---- Stock check (unless the store chose to sell through) ----------
        if (
            variant.inventory_tracked
            and not variant.continue_selling_out_of_stock
            and quantity > (variant.inventory_quantity or 0)
        ):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    f"Only {(variant.inventory_quantity or 0)} in stock for "
                    f"“{variant.title or product.title}”, but you asked for {quantity}."
                ),
            )

        unit_price = Decimal(str(variant.price or 0))
        line_total = unit_price * quantity
        subtotal += line_total
        resolved.append(
            {
                "product_id": product.id,
                "variant_id": variant.id,
                "product_name": product.title,
                "variant_title": variant.title or "Standard",
                "sku": variant.sku,
                "quantity": quantity,
                "unit_price": unit_price,
                "total_price": line_total,
                "requires_shipping": True,
            }
        )

    if not resolved:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Your cart is empty. Add at least one product before checking out.",
        )
    return resolved, subtotal


async def _is_duplicate_order(
    db: AsyncSession,
    *,
    customer_id: int | None,
    phone: str | None,
    email: str | None,
    visitor_id: str | None,
    items: list[dict],
    subtotal: Decimal,
    total: Decimal,
    payment_method: str | None,
    shipping_address: str | None,
    shipping_city: str | None,
    shipping_country: str | None,
    destination: str | None,
) -> bool:
    """Return True when the same customer/visitor already placed an order with
    the exact same order fingerprint within the last 24 hours.

    Catches the classic double-click / retry-after-timeout duplication without
    requiring a server-side cart token. The window is measured against the
    server-side ``Order.created_at`` (never browser clocks).

    Identity is scoped to the current customer (matched by email/visitor/phone,
    or by the resolved customer row): ``(created_at >= window) AND identity``,
    so an identical basket from a *different* customer is never treated as a
    duplicate. Fingerprint comparison is deterministic regardless of item order
    (line items are sorted) and covers products, variants, quantities, number of
    lines, order total plus the shipping/payment details that distinguish an
    order. Cancelled / voided / delivery-failed orders are ignored so a genuine
    re-order after a failed or cancelled attempt is never blocked.
    """
    identity_conditions = []
    if customer_id:
        identity_conditions.append(Order.customer_id == customer_id)
    if visitor_id:
        identity_conditions.append(Order.visitor_id == visitor_id)
    if phone:
        identity_conditions.append(Customer.phone == phone)
    if email:
        identity_conditions.append(Customer.email == email)
    if not identity_conditions:
        # Nothing to identify the shopper with -> cannot prove it is a duplicate.
        return False

    window_start = datetime.now() - timedelta(hours=DUPLICATE_ORDER_WINDOW_HOURS)
    recent = await db.execute(
        select(Order)
        .options(selectinload(Order.items))
        .outerjoin(Customer, Order.customer_id == Customer.id)
        .where(
            Order.created_at >= window_start,
            or_(*identity_conditions),
        )
    )
    recent_orders = recent.scalars().all()

    incoming_lines = sorted(
        (int(i["product_id"] or 0), int(i["variant_id"] or 0), int(i["quantity"] or 0))
        for i in items
    )
    incoming = (
        Decimal(str(subtotal)),
        Decimal(str(total)),
        str(payment_method or "").strip().lower(),
        (shipping_address or "").strip().lower(),
        (shipping_city or "").strip().lower(),
        (shipping_country or "").strip().lower(),
        (destination or "").strip().lower(),
    )

    for order in recent_orders:
        # A cancelled, voided or delivery-failed order must never block the
        # customer from placing the same order again.
        if order.cancelled_at is not None:
            continue
        if order.payment_status == PaymentStatus.voided:
            continue
        if order.delivery_status == DeliveryStatus.failed:
            continue
        theirs_lines = sorted(
            (int(i.product_id or 0), int(i.variant_id or 0), int(i.quantity or 0))
            for i in order.items
        )
        if theirs_lines != incoming_lines:
            continue
        theirs = (
            Decimal(str(order.subtotal or 0)),
            Decimal(str(order.total_price or 0)),
            str(order.payment_method or "").strip().lower(),
            (order.shipping_address or "").strip().lower(),
            (order.shipping_city or "").strip().lower(),
            (order.shipping_country or "").strip().lower(),
            (order.destination or "").strip().lower(),
        )
        if theirs == incoming:
            return True
    return False


def _order_success_response(order: Order) -> dict:
    """Build the standard created-ok response from an order's *stored* values.

    Used both for a fresh order and for the idempotent replay of an already
    created order (same ``idempotency_key``), so a retry returns the exact same
    server-authoritative amounts instead of creating a duplicate.
    """
    return {
        "status": "success",
        "message": f"Order {order.order_number} created successfully in database!",
        "order_id": order.id,
        "order_number": order.order_number,
        "customer_id": order.customer_id,
        # Server-authoritative amounts actually stored on the order.
        "subtotal": float(order.subtotal or 0),
        "shipping_cost": float(order.shipping_cost or 0),
        "total_price": float(order.total_price or 0),
    }


@public_webhook_router.post("/create-order")
async def create_order_public_api(request: Request, db: AsyncSession = Depends(get_db)):
    """Create a new order directly in the PostgreSQL database.

    Called by the storefront (eligo-frontend) checkout. Resolves/creates the
    real Customer record from the checkout contact fields, links it to the
    order and writes the initial timeline (audit log) events so the admin
    panel order page reflects live database data.

    Security contract: the browser only supplies IDs, quantities, the coupon
    code and customer/shipping info. Every price, subtotal, tax, shipping fee,
    discount, total and status is computed serverside from PostgreSQL — see
    ``_resolve_and_price_order_items``. Product variants and stock are
    validated, stock is deducted atomically under row locks, a DB-unique
    ``idempotency_key`` makes retries idempotent, and COD forces an
    unfulfilled, unpaid initial state.
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
    visitor_id = (data.get("visitor_id") or "").strip() or None

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

    # Whatever a client sends, keep name and phone OUT of the stored location.
    # `shipping_name` / `shipping_phone` carry those; `shipping_address` is
    # the street address only (house/street, city, postal code, country).
    if "|" in address_body:
        address_body = leopard_service.clean_consignee_address(address_body) or address_body
    address_body = address_body.strip() or None
    if address_body:
        # Modern clients already send a fully assembled address string
        # ("house, city, postal code, country"); use it verbatim instead of
        # appending the structured fields a second time.
        clean_location = address_body
    else:
        clean_location = ", ".join(
            p for p in [city, postal_code, country] if p and p.strip()
        ).strip() or None

    full_name = f"{first_name} {last_name}".strip()

    # ---- Resolve customer (identified ONLY by email) ----
    # A customer is looked up purely by their email address, so every order
    # placed with the same email is grouped under one customer record. A new
    # order's checkout details (name, phone, address) are snapshotted onto the
    # order itself (shipping_name/shipping_phone/shipping_address_* below) and
    # are NEVER written back into an existing customer profile — that keeps the
    # original profile intact and lets each order keep its own details.
    customer = None
    if email:
        result = await db.execute(select(Customer).where(Customer.email == email))
        customer = result.scalar_one_or_none()

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

        # New customer only: seed a default shipping address from the first
        # checkout. Existing customers' default addresses are never rewritten
        # by a later order's checkout data.
        if (address_body or city or postal_code or country):
            addr = CustomerAddress(
                customer_id=customer.id,
                first_name=first_name or None,
                last_name=last_name or None,
                address_line1=address_body or "—",
                city=city or "—",
                province=(data.get("province") or "").strip() or None,
                postal_code=postal_code or None,
                country=country,
                phone=phone,
                is_default=True,
                address_type="shipping",
            )
            db.add(addr)
            await db.flush()
            customer.default_address_id = addr.id
    # else: existing customer found by email — the profile (name, phone,
    # location, postal code, default address, etc.) is left untouched.

    # ---- Order number: max existing numeric suffix + 1 ----
    result = await db.execute(select(Order.order_number))
    max_num = 1339
    for (num,) in result.all():
        match = re.search(r"(\d+)", str(num or ""))
        if match:
            max_num = max(max_num, int(match.group(1)))
    order_number = f"#{max_num + 1}"

    # ---- Server-authoritative order validation & pricing ----
    # Every cart line is resolved against the live catalog (see
    # `_resolve_and_price_order_items`): prices, titles and stock come from the
    # database, so browser-supplied prices, quantities, totals and taxes are
    # never trusted.
    resolved_items, subtotal = await _resolve_and_price_order_items(db, data.get("items", []))

    from app.modules.settings.shipping_and_delivery.service import (
        get_settings as get_shipping_settings,
        calculate_shipping,
    )
    shipping_settings = await get_shipping_settings(db)
    # There is no tax engine yet: tax is always zero server-side and the
    # browser-supplied `tax` is explicitly ignored.
    tax = Decimal("0")
    shipping = calculate_shipping(subtotal, shipping_settings)

    # Server-side promo discount. The browser only forwards the code it wants
    # to use; the amount is recomputed here from the live catalog subtotal, so
    # clients can never invent their own discount value.
    discount_code_input = (data.get("discount_code") or "").strip()
    discount_amount = Decimal("0.00")
    welcome_redemption_pending = False
    if discount_code_input:
        from app.modules.discounts.service import (
            validate_promo_code,
            can_redeem_welcome_discount,
            get_welcome_settings,
            _find_welcome_log_by_code,
        )

        normalized = discount_code_input.upper()
        welcome_log = await _find_welcome_log_by_code(db, normalized)
        if welcome_log is not None:
            # One-time unique welcome code — only the visitor it was issued to
            # may use it, and only while it hasn't been redeemed yet. The
            # preview (verify-coupon) is read-only; the permanent redemption is
            # recorded right before the order is persisted (see below).
            settings = await get_welcome_settings(db)
            can_redeem = await can_redeem_welcome_discount(
                db,
                visitor_id=visitor_id,
                user_email=email,
                ip_address=None,
                coupon_code=normalized,
            )
            if can_redeem:
                welcome_pct = Decimal(str(settings.discount_percentage or 0))
                if welcome_pct > 0:
                    discount_amount = (subtotal * welcome_pct / Decimal("100"))
                    discount_amount = discount_amount.quantize(Decimal("0.01"))
                    discount_amount = min(discount_amount, subtotal)
                    welcome_redemption_pending = True
        else:
            # Not a unique welcome code — validate as an admin-created promo.
            # Pass the resolved (server-authoritative) line items so a discount
            # scoped to specific products/variants only applies to those lines.
            promo = await validate_promo_code(
                db,
                discount_code_input,
                subtotal,
                line_items=resolved_items,
            )
            if promo.get("valid"):
                discount_amount = Decimal(str(promo["discount_amount"]))
                discount_amount = min(discount_amount, subtotal)

    total = subtotal - discount_amount + tax + shipping

    # Storefront checkout is Cash on Delivery only. There is no payment
    # gateway that could confirm a pre-payment, so the browser can never
    # declare an order as "paid" (prevents fake paid orders). Statuses are
    # forced to their initial values for the same reason.
    payment_status = PaymentStatus.pending
    payment_method = "COD"
    paid_amount = Decimal("0")
    fulfillment_status = FulfillmentStatus.unfulfilled
    delivery_status = DeliveryStatus.pending

    # ---- Idempotency (DB-enforced unique checkout request key) ----
    # The storefront sends a stable ``idempotency_key`` (e.g. a cart UUID) so
    # that browser/network retries of the *same* checkout never create a second
    # order or double-deduct stock. Checked *before* the heuristic duplicate
    # window below so a genuine retry returns the original order instead of a
    # 409, and enforced again at the PostgreSQL level (unique index) so a race
    # between two identical requests collapses to the single first response.
    idempotency_key = (data.get("idempotency_key") or "").strip() or None
    if idempotency_key:
        existing = (
            await db.execute(
                select(Order)
                .options(selectinload(Order.items))
                .where(Order.idempotency_key == idempotency_key)
            )
        ).scalar_one_or_none()
        if existing is not None:
            return _order_success_response(existing)

    # ---- Duplicate-order protection ----
    # An identical basket from the same customer/visitor within 24 hours is a
    # double-submit: reject it instead of creating a duplicate order (and
    # double-committing stock). The customer row is locked first (SELECT ...
    # FOR UPDATE on PostgreSQL, a no-op on SQLite) so two *simultaneous*
    # identical checkouts serialize: the loser is still blocked on the lock when
    # the winner commits, then the check below sees the committed order inside
    # the window and gets 409 instead of creating a twin.
    await db.execute(
        select(Customer.id).where(Customer.id == customer.id).with_for_update()
    )
    if await _is_duplicate_order(
        db,
        customer_id=customer.id,
        phone=phone,
        email=email,
        visitor_id=visitor_id,
        items=resolved_items,
        subtotal=subtotal,
        total=total,
        payment_method=payment_method,
        shipping_address=clean_location or None,
        shipping_city=city or None,
        shipping_country=country or None,
        destination=data.get("destination") or country or None,
    ):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                "This order has already been placed within the last 24 hours. "
                "You can place the same order again after 24 hours."
            ),
        )

    # Welcome discount is a one-time offer: record the redemption only now,
    # after idempotency/duplicate checks the order is known to be brand new,
    # so a rejected/duplicate attempt can never burn the visitor's code. It is
    # committed atomically with the order by the ``commit()`` below.
    if welcome_redemption_pending:
        from app.modules.discounts.service import redeem_welcome_discount

        await redeem_welcome_discount(
            db,
            visitor_id=visitor_id,
            user_email=email,
            ip_address=None,
            coupon_code=normalized if welcome_log is not None else None,
            commit=False,
        )

    # The welcome coupon is a strict one-time offer for this visitor: consume
    # any outstanding (not-yet-redeemed) welcome log on this brand-new order,
    # regardless of whether the order itself used the welcome code. This stops
    # a visitor who saved the welcome code but checked out with another/no
    # coupon from reusing the saved welcome code on a later order. Idempotent
    # with the redemption above, committed atomically with the order below
    # (a rejected/duplicate/failed checkout rolls back and never consumes it).
    from app.modules.discounts.service import consume_welcome_for_order

    await consume_welcome_for_order(
        db,
        visitor_id=visitor_id,
        user_email=email,
        ip_address=None,
        commit=False,
    )

    new_order = Order(
        order_number=order_number,
        customer_id=customer.id,
        idempotency_key=idempotency_key,
        visitor_id=visitor_id,
        channel=data.get("channel", "Online Store"),
        currency=data.get("currency", "PKR"),
        subtotal=subtotal,
        shipping_cost=shipping,
        tax=tax,
        total_price=total,
        discount=discount_amount,
        paid_amount=paid_amount,
        payment_method=payment_method,
        payment_status=payment_status,
        fulfillment_status=fulfillment_status,
        delivery_status=delivery_status,
        shipping_address=clean_location or None,
        tags=data.get("tags", ""),
        destination=data.get("destination", country or "Pakistan"),
        # Delivery-address snapshot taken now; later edits never rewrite it.
        shipping_name=full_name or None,
        shipping_email=email,
        shipping_phone=phone,
        shipping_address_line1=address_body or None,
        shipping_city=city or None,
        shipping_province=(data.get("province") or "").strip() or None,
        shipping_postal_code=postal_code or None,
        shipping_country=country or None,
    )
    db.add(new_order)
    await db.flush()

    for item in resolved_items:
        db.add(OrderItem(
            order_id=new_order.id,
            product_id=item["product_id"],
            variant_id=item["variant_id"],
            product_name=item["product_name"],
            variant_title=item["variant_title"],
            sku=item["sku"],
            quantity=item["quantity"],
            unit_price=item["unit_price"],
            total_price=item["total_price"],
            requires_shipping=item.get("requires_shipping", True),
        ))

    # ---- Deduct stock for the reserved units (prevents overselling) ----
    # The variants are locked (SELECT ... FOR UPDATE on PostgreSQL) so two
    # concurrent checkouts of the final units cannot both pass the stock check:
    # the second transaction blocks until the first commits, then sees the
    # reduced stock and is rejected. The atomic conditional UPDATE below also
    # guarantees we never write a negative quantity for tracked variants.
    variant_ids = list({item["variant_id"] for item in resolved_items})
    variant_rows = (
        await db.execute(
            select(ProductVariant)
            .where(ProductVariant.id.in_(variant_ids))
            .with_for_update()
        )
    ).scalars().all()
    for variant in variant_rows:
        if not variant.inventory_tracked:
            continue
        ordered_qty = sum(
            item["quantity"]
            for item in resolved_items
            if item["variant_id"] == variant.id
        )
        stock = variant.inventory_quantity or 0
        if variant.continue_selling_out_of_stock:
            variant.inventory_quantity = stock - ordered_qty
        elif stock >= ordered_qty:
            variant.inventory_quantity = stock - ordered_qty
        else:
            # Stock changed between the initial read and the lock (a concurrent
            # order committed first) -> refuse instead of overselling.
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    f"Only {stock} in stock for "
                    f"“{variant.title or ''}”, but you asked for {ordered_qty}."
                ),
            )

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
    order_reference = secrets.token_urlsafe(6).upper().replace("-", "").replace("_", "")[:10]
    db.add(OrderAuditLog(
        order_id=new_order.id,
        event_type="status_changed",
        description=f"An order reference {order_reference} was generated for this order.",
        metadata_json=json.dumps({"order_reference": order_reference}),
    ))

    try:
        await db.commit()
    except IntegrityError as exc:
        # e.g. an order-number collision or a duplicate idempotency_key from two
        # concurrent identical checkouts. Roll back and, for the idempotency
        # case, return the already-created order so the retry is a no-op.
        await db.rollback()
        logging.getLogger(__name__).warning("Order creation commit failed: %s", exc)
        if idempotency_key:
            existing = (
                await db.execute(
                    select(Order)
                    .options(selectinload(Order.items))
                    .where(Order.idempotency_key == idempotency_key)
                )
            ).scalar_one_or_none()
            if existing is not None:
                return _order_success_response(existing)
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Your order could not be placed right now. Please try again in a moment.",
        ) from exc
    await db.refresh(new_order)

    # ---- Order Placed email (background; must never break checkout) ----
    # The order is NOT yet customer-confirmed at this point and does NOT reach
    # the courier. Only the order_placed notification fires now; the
    # order_confirmation email and Leopards booking happen only after an admin
    # manually confirms the order by phone.
    try:
        import asyncio
        asyncio.create_task(background_dispatch_order_placed(new_order.id))
    except Exception as notif_exc:
        logging.getLogger(__name__).warning(
            "Order placed notification failed for %s: %s", order_number, notif_exc
        )

    return {
        "status": "success",
        "message": f"Order {order_number} created successfully in database!",
        "order_id": new_order.id,
        "order_number": order_number,
        "confirmation_number": order_reference,
        "customer_id": customer.id,
        # Server-authoritative amounts actually stored on the order.
        "subtotal": float(subtotal),
        "shipping_cost": float(new_order.shipping_cost),
        "total_price": float(new_order.total_price),
    }


@router.get("/detail/{order_id}")
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

    def _to_grams(weight: Decimal | None, unit: str | None) -> float:
        if not weight:
            return 0.0
        u = (unit or "kg").lower()
        if u == "g":
            return float(weight)
        if u == "kg":
            return float(weight) * 1000
        if u == "lb":
            return float(weight) * 453.592
        if u == "oz":
            return float(weight) * 28.3495
        return 0.0

    # Pull product variant weights so the Leopards courier weight can be
    # calculated automatically from the selected products & quantities.
    variant_ids = [item.variant_id for item in order.items if item.variant_id]
    variants_by_id = {}
    if variant_ids:
        vres = await db.execute(select(ProductVariant).where(ProductVariant.id.in_(variant_ids)))
        variants_by_id = {v.id: v for v in vres.scalars().all()}

    total_weight_grams = 0.0
    items_payload = []
    for item in order.items:
        variant = variants_by_id.get(item.variant_id)
        item_weight_grams = 0.0
        if variant is not None:
            item_weight_grams = _to_grams(variant.weight, variant.weight_unit)
        total_weight_grams += item_weight_grams * item.quantity
        items_payload.append(
            {
                "product_name": item.product_name,
                "variant_title": item.variant_title or "",
                "quantity": item.quantity,
                "unit_price": float(item.unit_price),
                "total_price": float(item.total_price),
                "weight_grams": round(item_weight_grams, 2),
            }
        )

    return {
        "status": "success",
        "order": {
            "id": order.id,
            "order_number": order.order_number,
            "customer_name": order.customer_name,
            "customer_phone": order.customer_phone,
            "customer_email": order.customer_email,
            "shipping_address": order.shipping_address,
            "city": order.destination,
            "country": "Pakistan",
            "payment_status": order.payment_status.value,
            "fulfillment_status": order.fulfillment_status.value,
            "delivery_status": order.delivery_status.value,
            "tracking_number": order.tracking_number,
            "items": items_payload,
            "weight_grams": round(total_weight_grams, 2),
            "subtotal": float(order.subtotal or 0),
            "shipping_cost": float(order.shipping_cost or 0),
            "tax": float(order.tax or 0),
            "total_price": float(order.total_price or 0),
            "paid_amount": float(order.paid_amount or 0),
            "date": order.created_at.strftime("%d %B %Y at %I:%M %p") if order.created_at else None,
        },
    }


@router.post("/mark-paid/{order_id}")
async def mark_order_paid_public_api(
    order_id: str,
    db: AsyncSession = Depends(get_db),
):
    """Mark an order as Paid in PostgreSQL DB and persist a timeline event."""
    clean_id = order_id.replace("#", "").strip()
    search_num = f"#{clean_id}"

    result = await db.execute(
        select(Order)
        .options(selectinload(Order.customer))
        .where(Order.order_number == search_num)
        .with_for_update()
    )
    order = result.scalar_one_or_none()

    if not order and clean_id.isdigit():
        result = await db.execute(
            select(Order)
            .options(selectinload(Order.customer))
            .where(Order.id == int(clean_id))
            .with_for_update()
        )
        order = result.scalar_one_or_none()

    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

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

    return {
        "status": "success",
        "message": f"Order #{clean_id} marked as Paid in Database",
        "payment_status": "paid",
    }


@router.post("/mark-shipped/{order_id}")
async def mark_order_shipped_public_api(
    order_id: str,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
):
    """Mark an order as Shipped for manual (non-Leopards) fulfilment.

    Only allowed from genuine pre-dispatch states (``pending`` or ``booked``).
    Rejects backward/invalid transitions such as ``picked_up``/``in_transit``/
    ``out_for_delivery``/``delivered``/``failed``/``returned`` -> shipped.
    Sets ``delivery_status = in_transit`` and ``fulfillment_status = fulfilled``
    and dispatches the ``order_shipped`` notification only on a genuine
    transition.
    """
    clean_id = order_id.replace("#", "").strip()
    search_num = f"#{clean_id}"

    result = await db.execute(
        select(Order)
        .options(selectinload(Order.customer), selectinload(Order.items))
        .where(Order.order_number == search_num)
        .with_for_update()
    )
    order = result.scalar_one_or_none()

    if not order and clean_id.isdigit():
        result = await db.execute(
            select(Order)
            .options(selectinload(Order.customer), selectinload(Order.items))
            .where(Order.id == int(clean_id))
            .with_for_update()
        )
        order = result.scalar_one_or_none()

    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    if order.delivery_status not in (DeliveryStatus.pending, DeliveryStatus.booked):
        raise HTTPException(
            status_code=409,
            detail=(
                "Order cannot be marked as shipped from its current delivery "
                f"status ('{order.delivery_status.value}'). "
                "Mark as shipped is only available for pending or booked orders."
            ),
        )

    already_shipped = order.delivery_status == DeliveryStatus.in_transit
    order.delivery_status = DeliveryStatus.in_transit
    order.fulfillment_status = FulfillmentStatus.fulfilled
    if not already_shipped:
        items_count = len(order.items or [])
        courier = order.tracking_company or "Leopards Courier"
        db.add(OrderAuditLog(
            order_id=order.id,
            event_type="delivery_updated",
            description=(
                f"{courier} marked {items_count or 1} item(s) as shipped"
                + (f" (Tracking #{order.tracking_number})." if order.tracking_number else ".")
            ),
            actor_name=courier,
        ))
    await db.commit()
    await db.refresh(order)

    if not already_shipped:
        from app.modules.settings.notifications.service import background_dispatch_event
        background_tasks.add_task(
            background_dispatch_event,
            "order_shipped",
            {
                "email": order.customer_email,
                "customer_email": order.customer_email,
                "customer_name": order.customer_name or "Valued Customer",
                "order_number": order.order_number,
                "tracking_number": order.tracking_number,
                "tracking_company": order.tracking_company or "Leopards Courier",
                "total_price": str(order.total_price),
                "currency": str(order.currency) if hasattr(order, "currency") else "PKR",
            },
        )

    return {
        "status": "success",
        "message": f"Order #{clean_id} marked as Shipped in Database",
        "delivery_status": "in_transit",
        "fulfillment_status": "fulfilled",
    }


@router.post("/mark-delivered/{order_id}")
async def mark_order_delivered_public_api(
    order_id: str,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
):
    """Mark an order as Delivered in PostgreSQL DB and persist a timeline event.

    Allowed from any non-pending delivery state. ``failed``/``returned`` are
    permitted so an admin can correct a courier-lifeycle misreport and close
    the order, but an unshipped order (``pending``) cannot jump to delivered.
    The notification is dispatched only on a genuine status transition.
    """
    clean_id = order_id.replace("#", "").strip()
    search_num = f"#{clean_id}"

    result = await db.execute(
        select(Order)
        .options(selectinload(Order.customer), selectinload(Order.items))
        .where(Order.order_number == search_num)
        .with_for_update()
    )
    order = result.scalar_one_or_none()

    if not order and clean_id.isdigit():
        result = await db.execute(
            select(Order)
            .options(selectinload(Order.customer), selectinload(Order.items))
            .where(Order.id == int(clean_id))
            .with_for_update()
        )
        order = result.scalar_one_or_none()

    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    if order.delivery_status == DeliveryStatus.pending:
        raise HTTPException(
            status_code=409,
            detail=(
                "Order cannot be marked as delivered from its current delivery "
                f"status ('{order.delivery_status.value}'). "
                "It must be shipped first."
            ),
        )

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

    if not already_delivered:
        from app.modules.settings.notifications.service import background_dispatch_event
        background_tasks.add_task(
            background_dispatch_event,
            "order_delivered",
            {
                "email": order.customer_email,
                "customer_email": order.customer_email,
                "customer_name": order.customer_name or "Valued Customer",
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



@router.post("/mark-out-for-delivery/{order_id}")
async def mark_order_out_for_delivery_public_api(
    order_id: str,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
):
    """Mark an order as Out for Delivery in PostgreSQL DB, persist a timeline
    event, and email the customer that their parcel is out for delivery today.

    Only allowed from states in which the parcel is already outbound
    (``booked``, ``picked_up``, ``in_transit``). Prevents invalid backward
    transitions such as ``pending``, ``delivered``, ``failed`` or ``returned``
    -> ``out_for_delivery``.
    """
    clean_id = order_id.replace("#", "").strip()
    search_num = f"#{clean_id}"

    result = await db.execute(
        select(Order)
        .options(selectinload(Order.customer), selectinload(Order.items))
        .where(Order.order_number == search_num)
        .with_for_update()
    )
    order = result.scalar_one_or_none()

    if not order and clean_id.isdigit():
        result = await db.execute(
            select(Order)
            .options(selectinload(Order.customer), selectinload(Order.items))
            .where(Order.id == int(clean_id))
            .with_for_update()
        )
        order = result.scalar_one_or_none()

    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    if order.delivery_status not in (
        DeliveryStatus.booked,
        DeliveryStatus.picked_up,
        DeliveryStatus.in_transit,
    ):
        raise HTTPException(
            status_code=409,
            detail=(
                "Order cannot be marked as out for delivery from its current "
                f"delivery status ('{order.delivery_status.value}'). "
                "The parcel must be booked/picked up/in transit first."
            ),
        )

    already_out = order.delivery_status == DeliveryStatus.out_for_delivery
    order.delivery_status = DeliveryStatus.out_for_delivery
    if not already_out:
        courier = order.tracking_company or "Leopards Courier"
        db.add(OrderAuditLog(
            order_id=order.id,
            event_type="delivery_updated",
            description=(
                f"{courier} marked this order as out for delivery today"
                + (f" (Tracking #{order.tracking_number})." if order.tracking_number else ".")
            ),
            actor_name=courier,
        ))
    await db.commit()
    await db.refresh(order)

    if not already_out:
        from app.modules.settings.notifications.service import background_dispatch_event
        background_tasks.add_task(
            background_dispatch_event,
            "order_out_for_delivery",
            {
                "email": order.customer_email,
                "customer_email": order.customer_email,
                "customer_name": order.customer_name or "Valued Customer",
                "order_number": order.order_number,
                "tracking_number": order.tracking_number,
                "tracking_company": order.tracking_company or "Leopards Courier",
                "destination_city": order.shipping_city or order.destination or "",
                "total_price": str(order.total_price),
                "currency": str(order.currency) if hasattr(order, "currency") else "PKR",
            },
        )

    return {
        "status": "success",
        "message": f"Order #{clean_id} marked as Out for Delivery in Database",
        "delivery_status": "out_for_delivery",
    }


# ================================================================
# Analytics
# ================================================================
# Analytics
# ================================================================

@router.get("/analytics", response_model=OrdersAnalyticsSummary)
async def get_orders_analytics(
    date_from: datetime | None = None,
    date_to: datetime | None = None,
    db: AsyncSession = Depends(get_db),
):
    return await service.get_orders_analytics(db, date_from, date_to)


# ================================================================
# Inventory commitments
# ================================================================

@router.get("/inventory-commitments")
async def get_inventory_commitments(db: AsyncSession = Depends(get_db)):
    """Committed units per variant id (open, non-restocked order items).

    Admin inventory uses this to display: available = on_hand - committed.
    """
    return await service.get_variant_commitments(db)


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
    # Orders are not customer-confirmed when created; fire the order_placed
    # notification (if the customer has an email) and let the manual
    # confirmation flow handle the confirmation email + courier later.
    background_tasks.add_task(background_dispatch_order_placed, order.id)
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
    customer_id: int | None = None,
    skip: int = 0,
    limit: int = 50,
    db: AsyncSession = Depends(get_db),
):
    return await service.list_orders(
        db, is_archived, payment_status, fulfillment_status, search,
        date_from, date_to, channel, skip, limit, customer_id,
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
async def get_order(order_id: str, db: AsyncSession = Depends(get_db)):
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
# Customer Confirmation (manual, one-time)
# ================================================================

@router.post("/{order_id}/confirm", response_model=ConfirmOrderResponse)
async def confirm_order(order_id: int, db: AsyncSession = Depends(get_db)):
    """Manually confirm an order with the customer (one-time / idempotent).

    Only after the admin has spoken with the customer by phone does this:
      1. persist ``confirmed_at`` (DB-level, guarded so only the first
         confirmation performs side effects);
      2. record a customer_confirmed audit entry;
      3. AWAIT the ``order_confirmation`` email dispatch and report the REAL
         outcome (sent / failed / unavailable / skipped). The confirmation
         state is already committed and NEVER depends on email success;
      4. book Leopards automatically (best effort; failure logs but does
         not revert the confirmation).
    Retries / concurrent requests after the first confirmation are no-ops.
    """
    from app.modules.settings.shipping_and_delivery.service import (
        get_settings as get_shipping_settings,
    )

    # Load the order (for the 404).
    order = await service.get_order(db, order_id)
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")

    # Atomic claim: only a request that flips confirmed_at from NULL to a
    # timestamp wins the confirmation and may perform side effects. Concurrent
    # or repeated requests see rowcount == 0 and become idempotent no-ops.
    now = func.now()
    result = await db.execute(
        update(Order)
        .where(Order.id == order.id, Order.confirmed_at.is_(None))
        .values(confirmed_at=now)
    )
    if result.rowcount == 0:
        # Already confirmed (or an in-flight concurrent request won). Refresh
        # the confirmation timestamp and return an idempotent success without
        # re-sending emails, re-booking courier, or duplicating audit entries.
        await db.refresh(order)
        return ConfirmOrderResponse(
            order_id=order.id,
            order_number=order.order_number,
            confirmed_at=order.confirmed_at,
            already_confirmed=True,
            email_status=OrderConfirmationEmailStatus.skipped,
            email_message="No email sent - order was already confirmed.",
            courier_booked=False,
        )

    await db.refresh(order)

    # One timeline entry for the confirmation (also serves as the
    # "won the confirmation" marker; retries never reach here).
    db.add(OrderAuditLog(
        order_id=order.id,
        event_type="customer_confirmed",
        description="Admin confirmed this order after customer verification.",
        actor_name="Admin",
        metadata_json=json.dumps({"confirmed_at": order.confirmed_at.isoformat() if order.confirmed_at else None}),
    ))
    await db.commit()

    # Confirmation email is dispatched SYNCHRONOUSLY and its REAL result is
    # reported to the admin. confirmed_at is already committed, so an SMTP
    # failure cannot roll the confirmation back; the failure lands in
    # notification_logs and is surfaced as email_status=failed.
    email_status = OrderConfirmationEmailStatus.skipped
    email_message: str | None = None
    try:
        email_result = await dispatch_order_confirmation_email(db, order.id)
        email_status = OrderConfirmationEmailStatus(email_result)
        if email_result == "sent":
            email_message = "Confirmation email sent."
        elif email_result == "failed":
            email_message = "Confirmation email failed to send."
        elif email_result == "unavailable":
            email_message = "Customer has no email address."
        else:
            email_message = "Confirmation email was not sent (notifications currently unavailable/disabled)."
    except Exception as email_exc:  # noqa: BLE001 - never let email break the confirmation
        email_status = OrderConfirmationEmailStatus.failed
        email_message = "Confirmation email failed to send."
        logging.getLogger(__name__).warning(
            "Confirmation email dispatch raised for order %s: %s",
            order.order_number, email_exc,
        )

    # Courier auto-booking (best effort; a courier outage must NOT revert the
    # confirmation). Load the current shipping settings and book.
    courier_booked = False
    courier_error: str | None = None
    try:
        shipping_settings = await get_shipping_settings(db)
        await _auto_book_leopards(db, order, shipping_settings)
        courier_booked = bool(order.tracking_number)
    except Exception as booking_exc:
        courier_error = str(booking_exc)
        logging.getLogger(__name__).warning(
            "Leopards auto-booking after confirmation failed for %s: %s",
            order.order_number, booking_exc,
        )

    return ConfirmOrderResponse(
        order_id=order.id,
        order_number=order.order_number,
        confirmed_at=order.confirmed_at,
        already_confirmed=False,
        email_status=email_status,
        email_message=email_message,
        courier_booked=courier_booked,
        courier_error=courier_error,
    )


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



