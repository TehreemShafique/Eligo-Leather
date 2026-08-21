"""Service helpers that bridge the Leopards Courier integration with the local DB.

Tabs in the Leopards Courier admin page are driven by these functions:

- Orders / Fulfilled / Dispatched  -> data from local DB (CSV imports,
                                       webhooks, manual booking, CN generation)
- Generated Load Sheets            -> challans persisted locally and verified
                                       against `downloadLoadSheet`
- Logs                             -> audit trail of app/API operations
"""

from __future__ import annotations

import csv
import io
import json
import logging
from datetime import datetime

from sqlalchemy import select, or_
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.orders import leopard_client
from app.modules.orders.model import LeopardShipment, LeopardLoadSheet, LeopardLog, Order

logger = logging.getLogger(__name__)


# ================================================================
# CN / shipment helpers
# ================================================================

async def _cn_numbers_from_db(db: AsyncSession) -> list[str]:
    """All CN numbers known locally: shipment registry + orders tracking numbers."""
    cn_set: set[str] = set()

    result = await db.execute(select(LeopardShipment.cn_number))
    cn_set.update(row[0] for row in result)

    result = await db.execute(
        select(Order.tracking_number).where(Order.tracking_number.isnot(None))
    )
    cn_set.update(str(row[0]).strip() for row in result if row[0])

    return sorted(cn_set)


async def resolve_cn_numbers(db: AsyncSession) -> list[str]:
    """CNs to track: local registry + orders (DB is the source of truth).

    The cnList API only returns the CN pool (unissued CNs), NOT historical
    shipments. Historical CNs are accumulated via:
    - CSV import (historical data)
    - Webhook auto-accumulation (process_leopard_webhook_payload)
    - Booked packets (cn returned from bookPacket API)
    """
    cn_set = set(await _cn_numbers_from_db(db))
    return sorted(cn_set)


async def upsert_shipments(db: AsyncSession, packets: list[dict]) -> None:
    """Upsert booked-packet records into the local shipment registry.

    Also cross-links Order.tracking_number so webhooks can match CNs back to orders.
    """
    for packet in packets:
        cn = packet.get("track_number")
        if not cn:
            continue
        cn = str(cn).strip()

        result = await db.execute(
            select(LeopardShipment).where(LeopardShipment.cn_number == cn)
        )
        shipment = result.scalar_one_or_none()
        if shipment is None:
            shipment = LeopardShipment(cn_number=cn)
            db.add(shipment)

        shipment.booked_packet_id = packet.get("booked_packet_id")
        shipment.order_number = packet.get("booked_packet_order_id")
        shipment.booking_date = packet.get("booking_date")
        shipment.weight = packet.get("booked_packet_weight")
        shipment.pieces = packet.get("booked_packet_no_piece")
        shipment.collect_amount = packet.get("booked_packet_collect_amount")
        shipment.destination_city = packet.get("destination_city_name")
        shipment.consignee_name = packet.get("consignment_name_eng")
        shipment.consignee_phone = packet.get("consignment_phone")
        shipment.consignee_address = packet.get("consignment_address")
        shipment.invoice_number = packet.get("invoice_number")
        shipment.invoice_date = packet.get("invoice_date")
        shipment.current_status = packet.get("booked_packet_status")
        shipment.raw_json = json.dumps(packet, default=str)

        # Cross-link: if the packet has an order_id, set Order.tracking_number
        pkt_order_id = packet.get("booked_packet_order_id")
        if pkt_order_id:
            for fmt in (str(pkt_order_id), f"#{pkt_order_id}", str(pkt_order_id).lstrip("#")):
                order_result = await db.execute(
                    select(Order).where(Order.order_number == fmt)
                )
                order_row = order_result.scalar_one_or_none()
                if order_row and not order_row.tracking_number:
                    order_row.tracking_number = cn
                    break

    await db.commit()


# ================================================================
# Historical CSV Import
# ================================================================

# Column name mappings: CSV header -> LeopardShipment field
# Based on the actual Leopards Courier CSV export format
_CSV_COLUMN_MAP = {
    "cn #": "cn_number",
    "cn_number": "cn_number",
    "cn number": "cn_number",
    "consignment number": "cn_number",
    "consignment_number": "cn_number",
    "track_number": "cn_number",
    "tracking_number": "cn_number",
    "cn": "cn_number",
    "order id": "order_number",
    "order_number": "order_number",
    "order_id": "order_number",
    "booked_packet_order_id": "order_number",
    "booked packet date #": "booking_date",
    "booked_packet_date": "booking_date",
    "booking_date": "booking_date",
    "booking date": "booking_date",
    "date": "booking_date",
    "weight": "weight",
    "booked_packet_weight": "weight",
    "pieces": "pieces",
    "no_piece": "pieces",
    "no of pieces": "pieces",
    "booked_packet_no_piece": "pieces",
    "cod amount (pkr)": "collect_amount",
    "cod amount": "collect_amount",
    "cod_amount": "collect_amount",
    "collect_amount": "collect_amount",
    "booked_packet_collect_amount": "collect_amount",
    "cod": "collect_amount",
    "destination city": "destination_city",
    "destination_city": "destination_city",
    "destination_city_name": "destination_city",
    "city": "destination_city",
    "consignee name": "consignee_name",
    "consignee_name": "consignee_name",
    "consignment_name_eng": "consignee_name",
    "name": "consignee_name",
    "customer name": "consignee_name",
    "consignee phone": "consignee_phone",
    "consignee_phone": "consignee_phone",
    "consignment_phone": "consignee_phone",
    "phone": "consignee_phone",
    "contact": "consignee_phone",
    "consignee address": "consignee_address",
    "consignee_address": "consignee_address",
    "consignment_address": "consignee_address",
    "address": "consignee_address",
    "invoice cheque #": "invoice_number",
    "invoice_number": "invoice_number",
    "invoice number": "invoice_number",
    "invoice_no": "invoice_number",
    "invoice cheque date": "invoice_date",
    "invoice_date": "invoice_date",
    "invoice date": "invoice_date",
    "status": "current_status",
    "current_status": "current_status",
    "courier status": "current_status",
    "booked_packet_status": "current_status",
    "booked_packet_id": "booked_packet_id",
    "last activity date": "last_activity_date",
    "delivery / return date #": "delivery_return_date",
    "pick date": "pick_date",
    "return address": "return_address",
    "return city": "return_city",
    "comments": "comments",
    "shipper id": "shipper_id",
    "shipper name": "shipper_name",
}


async def import_shipments_from_csv(db: AsyncSession, csv_content: str) -> dict:
    """Parse a CSV string and upsert rows into leopard_shipments.

    Returns a summary dict with counts of imported, skipped, and errors.
    """
    reader = csv.DictReader(io.StringIO(csv_content))
    if not reader.fieldnames:
        return {"imported": 0, "skipped": 0, "errors": 0, "message": "CSV has no headers"}

    # Normalize header names to field names
    normalized_headers = {}
    for header in reader.fieldnames:
        key = header.strip().lower()
        if key in _CSV_COLUMN_MAP:
            normalized_headers[header] = _CSV_COLUMN_MAP[key]

    imported = 0
    skipped = 0
    errors = 0
    new_cns = []
    headers_found = list(reader.fieldnames or [])
    sample_row = {}

    for row_num, row in enumerate(reader, start=2):
        try:
            # Build a normalized dict from the row (only mapped fields)
            data = {}
            for csv_header, field_name in normalized_headers.items():
                val = row.get(csv_header, "").strip()
                if val:
                    data[field_name] = val

            # Also store ALL raw CSV columns in raw_json for full audit trail
            raw_row = {k: v.strip() for k, v in (row or {}).items() if v and v.strip()}

            cn = data.get("cn_number", "").strip()
            if not cn:
                skipped += 1
                if not sample_row and raw_row:
                    sample_row = raw_row
                continue

            # Capture first successful row as sample
            if not sample_row:
                sample_row = raw_row

            # Upsert
            result = await db.execute(
                select(LeopardShipment).where(LeopardShipment.cn_number == cn)
            )
            shipment = result.scalar_one_or_none()
            if shipment is None:
                shipment = LeopardShipment(cn_number=cn)
                db.add(shipment)
                new_cns.append(cn)

            if "order_number" in data:
                shipment.order_number = data["order_number"]
            if "booking_date" in data:
                shipment.booking_date = data["booking_date"]
            if "weight" in data:
                shipment.weight = data["weight"]
            if "pieces" in data:
                try:
                    shipment.pieces = int(data["pieces"])
                except (ValueError, TypeError):
                    pass
            if "collect_amount" in data:
                shipment.collect_amount = data["collect_amount"]
            if "destination_city" in data:
                shipment.destination_city = data["destination_city"]
            if "consignee_name" in data:
                shipment.consignee_name = data["consignee_name"]
            if "consignee_phone" in data:
                shipment.consignee_phone = data["consignee_phone"]
            if "consignee_address" in data:
                shipment.consignee_address = data["consignee_address"]
            if "invoice_number" in data:
                shipment.invoice_number = data["invoice_number"]
            if "invoice_date" in data:
                shipment.invoice_date = data["invoice_date"]
            if "current_status" in data:
                shipment.current_status = data["current_status"]
            if "booked_packet_id" in data:
                try:
                    shipment.booked_packet_id = int(data["booked_packet_id"])
                except (ValueError, TypeError):
                    pass

            shipment.raw_json = json.dumps({"imported_fields": data, "raw_csv": raw_row}, default=str)
            imported += 1
        except Exception as exc:
            logger.warning("CSV import error on row %d: %s", row_num, exc)
            errors += 1

    await db.commit()

    logger.info("CSV import complete: %d imported, %d skipped, %d errors", imported, skipped, errors)
    return {
        "imported": imported,
        "skipped": skipped,
        "errors": errors,
        "new_cns": new_cns,
        "headers_found": headers_found,
        "sample_row": sample_row,
        "message": f"Imported {imported} shipment(s), {skipped} skipped (no CN), {errors} errors",
    }


async def upsert_shipment_from_webhook(db: AsyncSession, cn_number: str, status: str, payload: dict) -> None:
    """Upsert a single shipment record from an inbound webhook payload.

    Called by the webhook handler so new orders automatically appear in the
    Order tab after being booked by Leopards.
    """
    cn = str(cn_number).strip()
    if not cn:
        return

    result = await db.execute(
        select(LeopardShipment).where(LeopardShipment.cn_number == cn)
    )
    shipment = result.scalar_one_or_none()
    if shipment is None:
        shipment = LeopardShipment(cn_number=cn)
        db.add(shipment)

    if status:
        shipment.current_status = status

    # Pull whatever extra fields the webhook provides
    for api_field, db_field in [
        ("booked_packet_id", "booked_packet_id"),
        ("booked_packet_order_id", "order_number"),
        ("booking_date", "booking_date"),
        ("booked_packet_weight", "weight"),
        ("booked_packet_no_piece", "pieces"),
        ("booked_packet_collect_amount", "collect_amount"),
        ("destination_city_name", "destination_city"),
        ("consignment_name_eng", "consignee_name"),
        ("consignment_phone", "consignee_phone"),
        ("consignment_address", "consignee_address"),
        ("invoice_number", "invoice_number"),
        ("invoice_date", "invoice_date"),
    ]:
        val = payload.get(api_field)
        if val is not None:
            if db_field == "pieces":
                try:
                    shipment.pieces = int(val)
                except (ValueError, TypeError):
                    pass
            else:
                setattr(shipment, db_field, str(val))

    # Merge into raw_json
    try:
        existing_raw = json.loads(shipment.raw_json) if shipment.raw_json else {}
    except (json.JSONDecodeError, TypeError):
        existing_raw = {}
    existing_raw.update(payload)
    shipment.raw_json = json.dumps(existing_raw, default=str)

    # Cross-link to Order if we have an order_id
    pkt_order_id = payload.get("booked_packet_order_id") or shipment.order_number
    if pkt_order_id:
        for fmt in (str(pkt_order_id), f"#{pkt_order_id}", str(pkt_order_id).lstrip("#")):
            order_result = await db.execute(
                select(Order).where(Order.order_number == fmt)
            )
            order_row = order_result.scalar_one_or_none()
            if order_row and not order_row.tracking_number:
                order_row.tracking_number = cn
                break

    await db.commit()


async def fetch_shipments_from_db(db: AsyncSession) -> list[dict]:
    """Fetch all leopard shipments from DB and return as normalized dicts.

    This replaces the live Leopards API call for the Order tab.
    Data comes from: CSV import, webhooks, manual booking, CN generation.
    Sorted newest booking date first.
    """
    result = await db.execute(
        select(LeopardShipment).order_by(LeopardShipment.created_at.desc())
    )
    shipments = list(result.scalars().all())

    rows = []
    for idx, s in enumerate(shipments):
        # Try to reconstruct the packet dict format that shipment_to_order expects
        packet = {
            "track_number": s.cn_number,
            "booked_packet_id": s.booked_packet_id,
            "booked_packet_order_id": s.order_number,
            "booking_date": s.booking_date or (s.created_at.strftime("%Y-%m-%d") if s.created_at else ""),
            "booked_packet_weight": s.weight,
            "booked_packet_no_piece": s.pieces,
            "booked_packet_collect_amount": s.collect_amount,
            "destination_city_name": s.destination_city,
            "consignment_name_eng": s.consignee_name,
            "consignment_phone": s.consignee_phone,
            "consignment_address": s.consignee_address,
            "invoice_number": s.invoice_number,
            "invoice_date": s.invoice_date,
            "booked_packet_status": s.current_status,
        }
        row = shipment_to_order(packet, idx)
        # Ensure date_time is set from booking_date for proper date filtering
        if not row.get("date_time"):
            row["date_time"] = s.booking_date or (s.created_at.strftime("%Y-%m-%d %H:%M") if s.created_at else "")
        rows.append(row)

    return rows


async def fetch_shipments_from_db_dispatched(db: AsyncSession) -> list[dict]:
    """Fetch all leopard shipments from DB and return as dispatched-tab rows."""
    result = await db.execute(
        select(LeopardShipment).order_by(LeopardShipment.created_at.desc())
    )
    shipments = list(result.scalars().all())

    rows = []
    for idx, s in enumerate(shipments):
        packet = {
            "track_number": s.cn_number,
            "booked_packet_id": s.booked_packet_id,
            "booked_packet_order_id": s.order_number,
            "booking_date": s.booking_date or (s.created_at.strftime("%Y-%m-%d") if s.created_at else ""),
            "booked_packet_weight": s.weight,
            "booked_packet_no_piece": s.pieces,
            "booked_packet_collect_amount": s.collect_amount,
            "destination_city_name": s.destination_city,
            "consignment_name_eng": s.consignee_name,
            "consignment_phone": s.consignee_phone,
            "consignment_address": s.consignee_address,
            "invoice_number": s.invoice_number,
            "invoice_date": s.invoice_date,
            "booked_packet_status": s.current_status,
        }
        rows.append(shipment_to_dispatched(packet, idx))

    return rows


async def fetch_shipments(db: AsyncSession) -> list[dict]:
    """Fetch live booked-packet records from Leopards for every known CN."""
    cn_numbers = await resolve_cn_numbers(db)
    packets = await leopard_client.track_booked_packets(cn_numbers)
    await upsert_shipments(db, packets)

    # Deterministic order: newest booking first
    packets.sort(
        key=lambda p: p.get("booking_date") or "", reverse=True
    )
    return packets


async def fetch_local_orders_for_leopard(db: AsyncSession) -> list[dict]:
    """Fetch all local DB orders formatted for the Leopard Courier Orders tab.

    Returns orders from the local `orders` table with their tracking/CN info,
    customer details, and booking status. This powers the Generate CN workflow:
    users see their Eligo orders here and can select them for CN generation.
    """
    result = await db.execute(
        select(Order).options(selectinload(Order.customer)).order_by(Order.created_at.desc())
    )
    orders = list(result.scalars().all())

    rows = []
    for idx, o in enumerate(orders):
        customer_name = ""
        customer_phone = ""
        customer_email = ""
        if o.customer:
            first = o.customer.first_name or ""
            last = o.customer.last_name or ""
            customer_name = f"{first} {last}".strip() or "Customer"
            customer_phone = o.customer.phone or ""
            customer_email = o.customer.email or ""

        cn_number = o.tracking_number or ""

        # Determine fulfillment status from leopard_shipments if we have a CN
        fulfillment_status = o.fulfillment_status.value if o.fulfillment_status else "unfulfilled"
        payment_status = o.payment_status.value if o.payment_status else "pending"
        courier_status = "not_available"

        if cn_number:
            # Check if we have a shipment record with live status
            ship_result = await db.execute(
                select(LeopardShipment).where(LeopardShipment.cn_number == cn_number)
            )
            ship = ship_result.scalar_one_or_none()
            if ship:
                courier_status = ship.current_status or "Booked"
                fulfillment_status = "fulfilled" if "deliver" in (courier_status or "").lower() else fulfillment_status

        amount = float(o.total_price or 0)

        rows.append({
            "sr": idx + 1,
            "id": o.id,
            "order_number": o.order_number or f"#{o.id}",
            "customer_name": customer_name,
            "customer_phone": customer_phone,
            "customer_email": customer_email,
            "fulfillment": fulfillment_status,
            "tags": o.tags or "",
            "cn_number": cn_number,
            "phone": customer_phone,
            "location": o.destination or "Pakistan",
            "address": o.shipping_address or "",
            "payment": payment_status,
            "amount": amount,
            "courier_status": courier_status,
            "date_time": o.created_at.strftime("%Y-%m-%d %H:%M") if o.created_at else "",
            "service_type": "Overnight",
        })

    return rows


async def sync_all_from_leopards(db: AsyncSession) -> dict:
    """Full auto-sync: track ALL known CNs via Leopards API, upsert locally.

    Flow:
    1. Collect CNs from DB (shipments + orders + webhooks)
    2. Also try cnList API to discover any new pool CNs that were booked
    3. Track every CN via trackBookedPacket -> get full shipment data
    4. Upsert everything to leopard_shipments table
    5. Cross-link orders via tracking_number
    6. Return comprehensive sync summary

    NOTE: The Leopards Merchant API does NOT have a "list all shipments"
    endpoint. cnList only returns the CN pool (unissued CNs). Historical
    shipments are tracked through the DB (accumulated via webhooks, bookings,
    and manual imports).
    """
    # Step 1: Get already-known CNs from local DB (primary source)
    db_cns = set(await _cn_numbers_from_db(db))

    # Step 2: Try cnList API - this returns POOL CNs (unissued/available),
    # which may include newly allocated CNs not yet in DB
    api_cns = set()
    try:
        api_cn_list = await leopard_client.cn_list()
        for item in api_cn_list:
            # cnList returns cn_with_prefix (e.g. "KI979865556")
            cn = (
                item.get("cn_with_prefix")
                or item.get("cn_number")
                or item.get("track_number")
                or item.get("cn")
                or ""
            )
            cn = str(cn).strip()
            if cn:
                api_cns.add(cn)
    except Exception as exc:
        logger.warning("cnList API call failed: %s", exc)

    # Step 3: Merge - DB is the source of truth, cnList supplements
    all_cns = sorted(db_cns | api_cns)
    new_from_api = api_cns - db_cns

    # Step 4: Track all CNs via Leopards API to get full data
    packets = []
    if all_cns:
        packets = await leopard_client.track_booked_packets(all_cns)

    # Step 5: Upsert all tracked packets to local DB
    await upsert_shipments(db, packets)

    # Step 6: Build summary
    tracked_cns = {p.get("track_number") for p in packets if p.get("track_number")}
    not_found_cns = sorted(set(all_cns) - tracked_cns)

    # Status breakdown
    status_counts: dict[str, int] = {}
    for p in packets:
        st = p.get("booked_packet_status") or "unknown"
        status_counts[st] = status_counts.get(st, 0) + 1

    # Total COD
    total_cod = 0
    for p in packets:
        try:
            total_cod += int(float(p.get("booked_packet_collect_amount") or "0"))
        except (TypeError, ValueError):
            pass

    # Sort by newest first
    packets.sort(key=lambda p: p.get("booking_date") or "", reverse=True)

    return {
        "summary": {
            "total_tracked": len(packets),
            "total_cns_known": len(all_cns),
            "db_cns_count": len(db_cns),
            "new_from_api_pool": len(new_from_api),
            "not_found_on_leopards": len(not_found_cns),
            "api_pool_count": len(api_cns),
            "total_cod": total_cod,
            "status_breakdown": status_counts,
        },
        "new_cns_discovered": sorted(new_from_api),
        "not_found_cns": not_found_cns,
        "packets": packets,
        "api_cn_list_raw": list(api_cn_list) if api_cn_list else [],
    }


def _latest_activity_datetime(packet: dict) -> str | None:
    detail = packet.get("Tracking Detail") or []
    if not detail:
        return None
    times = [
        entry.get("Activity_datetime") or ""
        for entry in detail
        if isinstance(entry, dict) and entry.get("Activity_datetime")
    ]
    return max(times) if times else None


def _derive_payment_status(status: str, cod_amount: str | int | float) -> str:
    """Derive payment status from Leopards courier status and COD amount.

    Leopards statuses: Delivered, Pending, In Transit, Out for Delivery,
    Returned to shipper, Cancelled, etc.
    """
    s = (status or "").lower()
    try:
        cod = int(float(cod_amount or "0"))
    except (TypeError, ValueError):
        cod = 0

    if "deliver" in s:
        return "paid" if cod > 0 else "completed"
    if "return" in s or "cancel" in s:
        return "returned"
    if "transit" in s or "dispatch" in s or "picked" in s:
        return "in_transit"
    return "pending"


def _derive_fulfillment_status(status: str) -> str:
    """Derive fulfillment status from Leopards courier status."""
    s = (status or "").lower()
    if "deliver" in s:
        return "fulfilled"
    if "return" in s or "cancel" in s:
        return "returned"
    if "transit" in s or "dispatch" in s or "picked" in s:
        return "in_transit"
    if "pending" in s or "booked" in s:
        return "pending"
    return "fulfilled"


def shipment_to_order(packet: dict, idx: int) -> dict:
    """Normalize a Leopards booked packet into an Orders-tab row."""
    cn = str(packet.get("track_number") or "")
    amount_raw = packet.get("booked_packet_collect_amount") or "0"
    try:
        amount = int(float(amount_raw))
    except (TypeError, ValueError):
        amount = 0

    destination = packet.get("destination_city_name") or ""
    location = f"{destination} (PK)" if destination else "Pakistan"
    status = packet.get("booked_packet_status") or ""

    return {
        "sr": idx + 1,
        "id": packet.get("booked_packet_id") or idx + 1,
        "order_number": packet.get("booked_packet_order_id") or cn or "#-",
        "customer_name": packet.get("consignment_name_eng") or "Customer",
        "fulfillment": _derive_fulfillment_status(status),
        "tags": "Dispatched, leopards",
        "cn_number": cn,
        "phone": packet.get("consignment_phone") or "",
        "location": location,
        "address": packet.get("consignment_address") or "",
        "payment": _derive_payment_status(status, amount_raw),
        "amount": amount,
        "courier_status": status or "not_available",
    }


def shipment_to_dispatched(packet: dict, idx: int) -> dict:
    """Normalize a Leopards booked packet into a Dispatched-tab row."""
    cn = str(packet.get("track_number") or "")
    amount_raw = packet.get("booked_packet_collect_amount") or "0"
    try:
        amount = int(float(amount_raw))
    except (TypeError, ValueError):
        amount = 0

    booking_date = packet.get("booking_date") or ""
    date_time = _latest_activity_datetime(packet) or booking_date
    destination = packet.get("destination_city_name") or ""
    location = f"{destination} (PK)" if destination else "Pakistan"
    status = packet.get("booked_packet_status") or ""

    return {
        "sr": idx + 1,
        "id": packet.get("booked_packet_id") or idx + 1,
        "order_number": packet.get("booked_packet_order_id") or cn or "#-",
        "cn_number": cn,
        "payment": _derive_payment_status(status, amount_raw),
        "total": amount,
        "cod": amount,
        "date_time": date_time,
        "courier_status": status or "pending",
        "location": location,
        "invoice_no": packet.get("invoice_number") or "---",
        "invoice_date": packet.get("invoice_date") or "---",
        "dispatched_date": booking_date or "---",
    }


# ================================================================
# Load sheets
# ================================================================

async def register_challan(db: AsyncSession, challan_no: str) -> LeopardLoadSheet | None:
    """Register a challan locally after confirming it exists on Leopards."""
    challan_no = str(challan_no).strip()
    if not challan_no:
        return None

    verified = await leopard_client.verify_challan(challan_no)
    if not verified:
        return None

    result = await db.execute(
        select(LeopardLoadSheet).where(LeopardLoadSheet.challan_no == challan_no)
    )
    sheet = result.scalar_one_or_none()
    if sheet is None:
        now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        sheet = LeopardLoadSheet(
            challan_no=challan_no,
            challan_date=now_str,
            pickup_date=now_str,
            printed_on=now_str,
        )
        db.add(sheet)
        await db.commit()
        await db.refresh(sheet)
    return sheet


async def fetch_load_sheets(db: AsyncSession) -> list[dict]:
    """List load sheets from DB. These are registered via:
    - generate_load_sheet API (auto-stores challan)
    - Sync/Add Challans modal (manual registration)
    - Bulk import endpoint
    """
    result = await db.execute(
        select(LeopardLoadSheet).order_by(LeopardLoadSheet.created_at.desc())
    )
    sheets = list(result.scalars().all())

    return [
        {
            "sr": idx + 1,
            "challan_no": sheet.challan_no,
            "challan_date": sheet.challan_date,
            "pickup_date": sheet.pickup_date,
            "printed_on": sheet.printed_on,
            "acc_no": sheet.acc_no,
            "company_name": sheet.company_name,
            "handed_over_to_code": sheet.handed_over_to_code,
            "handed_over_to_name": sheet.handed_over_to_name,
            "items": json.loads(sheet.items_json) if sheet.items_json else [],
            "total_pieces": sheet.total_pieces,
            "total_packets": sheet.total_packets,
            "total_cod": sheet.total_cod,
        }
        for idx, sheet in enumerate(sheets)
    ]


# ================================================================
# Logs
# ================================================================

async def record_log(
    db: AsyncSession,
    order_number: str | None,
    log_type: str,
    status: str,
    detail: str | None,
) -> None:
    """Persist an audit entry for the Logs tab."""
    log = LeopardLog(
        order_number=order_number,
        log_type=log_type,
        status=status,
        detail=detail,
        date=datetime.now().strftime("%d/%m/%Y %H:%M"),
    )
    db.add(log)
    await db.commit()


async def fetch_logs(db: AsyncSession) -> list[dict]:
    """Return persisted Leopard operation logs, newest first."""
    result = await db.execute(
        select(LeopardLog).order_by(LeopardLog.created_at.desc())
    )
    logs = list(result.scalars().all())
    return [
        {
            "sr": idx + 1,
            "order_number": log.order_number or "-",
            "log_type": log.log_type,
            "status": log.status,
            "detail": log.detail or "",
            "date": log.date,
        }
        for idx, log in enumerate(logs)
    ]


# ================================================================
# Live PDF download
# ================================================================

async def download_challan_pdf(challan_no: str):
    """Fetch the real challan PDF from Leopards.

    Returns (content_bytes, media_type, filename) or raises on failure.
    """
    challan_no = str(challan_no).strip()
    resp = await leopard_client.download_load_sheet(challan_no)
    if resp.status_code != 200:
        raise RuntimeError(f"Leopards returned HTTP {resp.status_code}")
    media_type = resp.headers.get("content-type", "application/pdf")
    if not (media_type.startswith("application/pdf") or resp.content.startswith(b"%PDF")):
        raise RuntimeError("Leopards did not return a PDF for this challan")
    return resp.content, "application/pdf", f"bookedPacketSlip_{challan_no}.pdf"


async def download_cn_pdf(cn_number: str):
    """Download the real airway bill PDF for a CN from Leopards.

    Uses the booked_packet_slip_api endpoint which returns the PDF directly
    without needing generateLoadSheet first. Falls back to generateLoadSheet.
    """
    cn_number = str(cn_number).strip()

    # Method 1: Use booked_packet_slip_api (direct PDF endpoint)
    resp = await leopard_client.booked_packet_slip_api(cn_number)
    if resp is not None and resp.status_code == 200:
        ct = resp.headers.get("content-type", "")
        if ct.startswith("application/pdf") or resp.content[:5] == b"%PDF-":
            logger.info("download_cn_pdf: Method 1 (booked_packet_slip_api) succeeded for CN %s", cn_number)
            return resp.content, "application/pdf", f"leopard_airway_bill_{cn_number}.pdf"
        else:
            logger.info(
                "download_cn_pdf: booked_packet_slip_api returned content-type=%s for CN %s (not PDF)",
                ct, cn_number,
            )

    # Method 2: Fallback to generateLoadSheet + downloadLoadSheet
    try:
        res = await leopard_client.generate_load_sheet([cn_number])
        logger.info("download_cn_pdf: generate_load_sheet response for CN %s: %s", cn_number, res)
        challan_id = None
        if isinstance(res, dict):
            # Try all possible field names for the challan/load-sheet ID
            challan_id = (
                res.get("load_sheet_id")
                or res.get("challan_id")
                or res.get("id")
                or res.get("load_sheet_number")
                or res.get("challan_number")
                or res.get("sheet_id")
            )
            # Some Leopards responses wrap in nested structure
            if not challan_id and "data" in res:
                nested = res["data"]
                if isinstance(nested, dict):
                    challan_id = (
                        nested.get("load_sheet_id")
                        or nested.get("challan_id")
                        or nested.get("id")
                    )
        if challan_id:
            resp2 = await leopard_client.download_load_sheet(str(challan_id))
            if resp2.status_code == 200 and (
                resp2.headers.get("content-type", "").startswith("application/pdf")
                or resp2.content[:5] == b"%PDF-"
            ):
                logger.info(
                    "download_cn_pdf: Method 2 (generateLoadSheet) succeeded for CN %s, challan %s",
                    cn_number, challan_id,
                )
                return resp2.content, "application/pdf", f"leopard_airway_bill_{cn_number}.pdf"
        else:
            logger.warning(
                "download_cn_pdf: generate_load_sheet did not return a challan ID for CN %s. Response: %s",
                cn_number, str(res)[:500],
            )
    except Exception as exc:
        logger.warning("generateLoadSheet fallback failed for CN %s: %s", cn_number, exc)

    raise RuntimeError(
        f"Leopards API did not return PDF for CN {cn_number}. "
        f"Method 1 (booked_packet_slip_api) and Method 2 (generateLoadSheet) both failed."
    )



async def book_packet(db: AsyncSession, payload: dict) -> dict:
    """Book a new packet with Leopards Courier Service via the live API.

    Uses 'self' for shipper fields (merchant account defaults) and
    resolves destination city name to an integer city ID for the API.
    """
    order_id = str(payload.get("order_id", "#1339")).strip()
    cod_amount = str(payload.get("cod_amount", "2699.00"))
    consignee_name = str(payload.get("consignee_name", "DANYAL SAJID"))
    consignee_phone = str(payload.get("consignee_phone", "03115133191"))
    consignee_address = str(payload.get("consignee_address", "tarbela ghazi hamlet sobra sector"))
    destination_city = str(payload.get("destination_city", "HARIPUR"))
    special_instructions = str(payload.get("special_instructions", "N/A"))
    weight = str(payload.get("weight", payload.get("weight_grams", "500")))
    pieces = int(payload.get("pieces", 1))

    # Call the live Leopards Merchant API
    api_res = await leopard_client.book_packet_api(payload)
    api_status = api_res.get("status")
    live_cn = (
        api_res.get("track_number")
        or api_res.get("cn_number")
        or api_res.get("track_no")
    )

    # Check for API errors
    api_error = api_res.get("error")
    if api_status == 0 or (api_error and api_error != "0"):
        # API returned an error
        error_msg = str(api_error) if api_error else "Unknown API error"
        await record_log(
            db,
            order_number=order_id,
            log_type="Manual Booking (LCS)",
            status="Error",
            detail=f"Leopards API error: {error_msg} | City: {destination_city}",
        )
        return {
            "status": "error",
            "cn_number": None,
            "message": f"Leopards API error: {error_msg}",
            "api_response": api_res,
        }

    if not live_cn:
        await record_log(
            db,
            order_number=order_id,
            log_type="Manual Booking (LCS)",
            status="Error",
            detail=f"No CN returned from Leopards API for order {order_id}",
        )
        return {
            "status": "error",
            "cn_number": None,
            "message": "Leopards API did not return a CN number. Check city names and try again.",
            "api_response": api_res,
        }

    cn_number = str(live_cn).strip()
    now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    booking_date = datetime.now().strftime("%Y-%m-%d")

    # Check if this CN already exists in our registry
    result = await db.execute(
        select(LeopardShipment).where(LeopardShipment.cn_number == cn_number)
    )
    existing = result.scalar_one_or_none()

    if existing:
        # Update existing record
        existing.order_number = order_id
        existing.booking_date = now_str
        existing.destination_city = destination_city
        existing.consignee_name = consignee_name
        existing.consignee_phone = consignee_phone
        existing.consignee_address = consignee_address
        existing.weight = weight
        existing.pieces = pieces
        existing.collect_amount = cod_amount
        existing.current_status = "Booked"
        existing.raw_json = json.dumps(api_res, default=str)
    else:
        shipment = LeopardShipment(
            cn_number=cn_number,
            order_number=order_id,
            booking_date=now_str,
            destination_city=destination_city,
            consignee_name=consignee_name,
            consignee_phone=consignee_phone,
            consignee_address=consignee_address,
            weight=weight,
            pieces=pieces,
            collect_amount=cod_amount,
            current_status="Booked",
            raw_json=json.dumps(api_res, default=str),
        )
        db.add(shipment)

    # Cross-link: write CN back to Order.tracking_number so webhooks can match it
    clean_order_id = order_id.lstrip("#")
    for fmt in (order_id, f"#{clean_order_id}", clean_order_id):
        order_result = await db.execute(
            select(Order).where(Order.order_number == fmt)
        )
        order_row = order_result.scalar_one_or_none()
        if order_row:
            order_row.tracking_number = cn_number
            break

    await record_log(
        db,
        order_number=order_id,
        log_type="Manual Booking (LCS)",
        status="Success",
        detail=f"Booked packet CN #{cn_number} for {consignee_name} in {destination_city}. COD: Rs {cod_amount}",
    )

    await db.commit()

    return {
        "status": "success",
        "cn_number": cn_number,
        "message": f"Packet #{cn_number} booked successfully with Leopards Courier API!",
        "booking_details": {
            "track_number": cn_number,
            "cn_number": cn_number,
            "order_id": order_id,
            "cod_amount": cod_amount,
            "consignee_name": consignee_name,
            "consignee_phone": consignee_phone,
            "consignee_address": consignee_address,
            "destination_city": destination_city,
            "special_instructions": special_instructions,
            "weight": weight,
            "pieces": pieces,
            "booking_date": booking_date,
            "status": "Booked",
            "shipper_name": "ELIGO LEATHER",
            "shipper_ac": "102620 / ELIGO LEATHER",
            "shipper_contact": "03345399470",
            "shipper_address": "OFFICE # 407, 4TH FLOOR, GULBERG EMPIRE, CIVIC CENTER, EXECUTIVE BLOCK, GULBERG GREENS, ISLAMABAD",
            "return_address": "Office # 407, 4th floor, Gulberg Empire, Civic Center, Executive Block, Gulberg Greens, Islamabad",
            "business_address": "OFFICE#407, 4TH FLOOR, GULBERG EMPIRE, EXECUTIVE BLOCK, GULBERG GREENS, ISB",
            "origin_city": "ISLAMABAD",
        },
    }
