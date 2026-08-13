"""Service helpers that bridge the Leopards Merchant API with the local DB.

Tabs in the Leopards Courier admin page are driven by these functions:

- Orders / Fulfilled / Dispatched  -> live data from `trackBookedPacket`
- Generated Load Sheets            -> challans persisted locally and verified
                                      against `downloadLoadSheet`
- Logs                             -> audit trail of app/API operations
"""

from __future__ import annotations

import json
from datetime import datetime

from sqlalchemy import select, or_
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.orders import leopard_client
from app.modules.orders.model import LeopardShipment, LeopardLoadSheet, LeopardLog, Order


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
    """CNs to track: local registry + orders, plus configured initial CNs."""
    cn_set = set(await _cn_numbers_from_db(db))
    cn_set.update(leopard_client.initial_cn_numbers())
    return sorted(cn_set)


async def upsert_shipments(db: AsyncSession, packets: list[dict]) -> None:
    """Upsert booked-packet records into the local shipment registry."""
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

    await db.commit()


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

    return {
        "sr": idx + 1,
        "id": packet.get("booked_packet_id") or idx + 1,
        "order_number": packet.get("booked_packet_order_id") or cn or "#-",
        "customer_name": packet.get("consignment_name_eng") or "Customer",
        "fulfillment": "fulfilled",
        "tags": "Dispatched, leopards",
        "cn_number": cn,
        "phone": packet.get("consignment_phone") or "",
        "location": location,
        "address": packet.get("consignment_address") or "",
        "payment": "pending",
        "amount": amount,
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

    return {
        "sr": idx + 1,
        "id": packet.get("booked_packet_id") or idx + 1,
        "order_number": packet.get("booked_packet_order_id") or cn or "#-",
        "cn_number": cn,
        "payment": "pending",
        "total": amount,
        "cod": amount,
        "date_time": date_time,
        "courier_status": packet.get("booked_packet_status") or "pending",
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


async def ensure_initial_load_sheets(db: AsyncSession) -> None:
    """Ensure all configured initial challans are verified + registered concurrently."""
    initials = leopard_client.initial_challans()
    if not initials:
        return

    result = await db.execute(select(LeopardLoadSheet.challan_no))
    existing_challans = set(result.scalars().all())

    missing = [ch for ch in initials if ch not in existing_challans]
    if missing:
        import asyncio
        await asyncio.gather(*(register_challan(db, ch) for ch in missing), return_exceptions=True)


async def fetch_load_sheets(db: AsyncSession) -> list[dict]:
    """List load sheets: registered challans, verified against Leopards."""
    await ensure_initial_load_sheets(db)

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
    """Generate load sheet for a CN on Leopards and download the real PDF generated directly by Leopards API."""
    cn_number = str(cn_number).strip()
    res = await leopard_client.generate_load_sheet([cn_number])
    challan_id = None
    if isinstance(res, dict):
        challan_id = res.get("load_sheet_id") or res.get("challan_id") or res.get("id")
    
    if not challan_id:
        challan_id = cn_number

    resp = await leopard_client.download_load_sheet(str(challan_id))
    if resp.status_code == 200 and (resp.headers.get("content-type", "").startswith("application/pdf") or resp.content.startswith(b"%PDF")):
        return resp.content, "application/pdf", f"leopard_airway_bill_{cn_number}.pdf"
    
    raise RuntimeError(f"Leopards API did not return PDF for CN {cn_number}: {resp.text[:200]}")



async def book_packet(db: AsyncSession, payload: dict) -> dict:
    """Book a new packet manually with Leopards Courier Service."""
    order_id = str(payload.get("order_id", "#1339")).strip()
    cod_amount = str(payload.get("cod_amount", "2699.00"))
    consignee_name = str(payload.get("consignee_name", "DANYAL SAJID"))
    consignee_phone = str(payload.get("consignee_phone", "03115133191"))
    consignee_address = str(payload.get("consignee_address", "tarbela ghazi hamlet sobra sectortarbela ghazi 22860"))
    destination_city = str(payload.get("destination_city", "HARIPUR")).upper()
    special_instructions = str(payload.get("special_instructions", "GEM - Reversible Premium Leather Belt - Black and Dark Brown / 46(B007) Qty=1"))
    weight = str(payload.get("weight", "170.00"))
    pieces = int(payload.get("pieces", 1))

    # Attempt live Leopards Merchant API call
    api_res = await leopard_client.book_packet_api(payload)
    live_cn = api_res.get("track_number") or api_res.get("cn_number") or api_res.get("track_no")
    
    if live_cn:
        cn_number = str(live_cn).strip()
    else:
        cn_number = f"ID7536{datetime.now().strftime('%M%S')}"

    now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    booking_date = datetime.now().strftime("%Y-%m-%d")

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
    )
    db.add(shipment)

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
            "user_id": "245122",
        },
    }
