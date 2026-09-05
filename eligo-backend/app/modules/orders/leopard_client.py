"""Thin async client for the Leopards Courier Merchant API.

All calls authenticate with the merchant `api_key` / `api_password` taken from
environment variables. Confirmed working live endpoints (2026-08):

- POST /api/trackBookedPacket/format/json/  -> booked packet tracking data
- POST /api/downloadLoadSheet/format/json/  -> returns the real challan PDF
- POST /api/generateLoadSheet/format/json/  -> generate a load sheet for CNs
- GET  /api/cnList/                         -> pool of allocated CN numbers
- POST /api/getAllCities/format/json/       -> supported city list
- POST /api/bookPacket/format/json/         -> book a new packet (returns CN)
- GET  /api/booked_packet_slip_api/{CN}     -> real airway bill PDF
"""

from __future__ import annotations

import os
import logging
import json as json_mod
import re

import httpx

logger = logging.getLogger(__name__)

LEOPARDS_API_BASE_URL = os.getenv(
    "LEOPARDS_API_BASE_URL", "https://merchantapi.leopardscourier.com"
).rstrip("/")

LEOPARDS_API_KEY = os.getenv("LEOPARDS_API_KEY", "")
LEOPARDS_API_PASSWORD = os.getenv("LEOPARDS_API_PASSWORD", "")

_TIMEOUT = httpx.Timeout(90.0, connect=30.0)

# Lazy-loaded city cache: name -> id
_city_cache: dict[str, int] = {}


async def _post(path: str, **fields) -> httpx.Response:
    data = {"api_key": LEOPARDS_API_KEY, "api_password": LEOPARDS_API_PASSWORD}
    data.update({k: v for k, v in fields.items() if v is not None})
    async with httpx.AsyncClient(timeout=_TIMEOUT) as client:
        resp = await client.post(f"{LEOPARDS_API_BASE_URL}{path}", data=data)
        resp.raise_for_status()
        return resp


async def _track_batch(cn_numbers: list[str]) -> list[dict] | None:
    """Track a batch of CNs. Returns packet_list or None if API returns no data."""
    if not cn_numbers:
        return []
    resp = await _post(
        "/api/trackBookedPacket/format/json/",
        track_numbers=",".join(cn_numbers),
    )
    try:
        payload = resp.json()
    except Exception:
        logger.warning("trackBookedPacket returned non-JSON: %s", resp.text[:200])
        return []
    if isinstance(payload, dict) and isinstance(payload.get("packet_list"), list):
        return payload["packet_list"]
    return None


async def track_booked_packets(cn_numbers: list[str]) -> list[dict]:
    """Return the full booked-packet records for the given consignment numbers.

    The Leopards API returns ``packet_list: None`` when *any* CN in the batch
    is not found.  We first try the full batch, and if that returns None we
    fall back to smaller sub-batches so that valid CNs are still returned.
    """
    if not cn_numbers:
        return []

    BATCH_SIZE = 10
    all_packets: list[dict] = []

    # Try the full batch first (fast path when all CNs are valid)
    full_result = await _track_batch(cn_numbers)
    if full_result is not None:
        return full_result

    # Full batch returned None – retry in smaller chunks
    logger.info(
        "trackBookedPacket full batch (%d CNs) returned None, retrying in batches of %d",
        len(cn_numbers), BATCH_SIZE,
    )
    for i in range(0, len(cn_numbers), BATCH_SIZE):
        chunk = cn_numbers[i : i + BATCH_SIZE]
        result = await _track_batch(chunk)
        if result:
            all_packets.extend(result)

    return all_packets


async def download_load_sheet(challan_no: str) -> httpx.Response:
    """Download the real challan PDF bytes for a load-sheet challan number."""
    return await _post(
        "/api/downloadLoadSheet/format/json/",
        load_sheet_id=challan_no,
    )


async def verify_challan(challan_no: str) -> bool:
    """Verify a challan exists on Leopards by attempting to download its PDF."""
    try:
        resp = await download_load_sheet(challan_no)
        content_type = resp.headers.get("content-type", "")
        is_pdf = resp.status_code == 200 and (
            content_type.startswith("application/pdf") or resp.content.startswith(b"%PDF")
        )
        return is_pdf
    except Exception as exc:
        logger.warning("Challan %s verification failed: %s", challan_no, exc)
        return False


async def generate_load_sheet(
    cn_numbers: list[str],
    courier_name: str | None = None,
    courier_code: str | None = None,
) -> dict:
    """Generate a load sheet on Leopards for the given CNs.

    Returns the parsed JSON response (contains the new challan number in
    ``load_sheet_id``). Verified live (2026-08): the API requires a JSON body
    with ``cn_numbers`` sent as a *list* plus the courier name/code — the older
    form-encoded ``cn_number`` (comma-joined) is rejected with
    ``"CN Number is required"``, so challans were never registered.
    """
    data = {
        "api_key": LEOPARDS_API_KEY,
        "api_password": LEOPARDS_API_PASSWORD,
        "cn_numbers": list(cn_numbers),
        "courier_name": courier_name or "Leopards Courier Service",
        "courier_code": courier_code or "LCS",
    }
    try:
        async with httpx.AsyncClient(timeout=_TIMEOUT) as client:
            resp = await client.post(
                f"{LEOPARDS_API_BASE_URL}/api/generateLoadSheet/format/json/",
                json=data,
            )
            resp.raise_for_status()
    except Exception as exc:
        logger.warning("generateLoadSheet JSON call failed: %s", exc)
        return {"status": 0, "error": str(exc)}
    try:
        return resp.json()
    except Exception:
        ct = resp.headers.get("content-type", "")
        if resp.content and resp.content[:5] == b"%PDF-":
            return {"status": 1, "message": "PDF generated", "pdf_bytes_len": len(resp.content)}
        return {"raw": resp.text[:1000], "content_type": ct}


async def cn_list() -> list[dict]:
    """Return the pool of CN numbers allocated to this merchant account."""
    async with httpx.AsyncClient(timeout=_TIMEOUT) as client:
        resp = await client.get(
            f"{LEOPARDS_API_BASE_URL}/api/cnList/",
            params={"api_key": LEOPARDS_API_KEY, "api_password": LEOPARDS_API_PASSWORD},
        )
        resp.raise_for_status()
        payload = resp.json()
    if isinstance(payload, dict) and isinstance(payload.get("list"), list):
        return payload["list"]
    return []


async def get_all_cities() -> list[dict]:
    """Return the list of supported cities from Leopards."""
    resp = await _post("/api/getAllCities/format/json/")
    payload = resp.json()
    if isinstance(payload, dict) and isinstance(payload.get("city_list"), list):
        cities = payload["city_list"]
        global _city_cache
        _city_cache = {c["name"].lower(): c["id"] for c in cities if c.get("name") and c.get("id")}
        return cities
    return []


async def get_city_id(city_name: str) -> int | None:
    """Resolve a city name to its Leopards city ID. Returns None if not found.

    Matching (in order):
    1. exact (case-insensitive) city name
    2. word-boundary containment — the customer often sends a locality/sub-area
       string (e.g. "Bahria Town Lahore") that is not itself in the Leopards
       city list but contains a real city name ("Lahore"). The longest match
       wins so "Rawalpindi, Punjab" resolves to Rawalpindi not Punjab.
    """
    global _city_cache
    if not _city_cache:
        await get_all_cities()
    query = city_name.lower().strip()
    if not query:
        return None
    if query in _city_cache:
        return _city_cache[query]

    best: tuple[int, int] | None = None
    for known, cid in _city_cache.items():
        # Word-boundary containment: "bahria town lahore" contains "lahore"
        # but "isl" must not match "islamabad" via substring.
        if re.search(rf"(^|[\s,;/])({re.escape(known)})([\s,;/]|$)", query):
            if best is None or len(known) > best[0]:
                best = (len(known), cid)
    return best[1] if best else None


async def booked_packet_slip_api(cn_number: str) -> httpx.Response | None:
    """Download the real airway bill / booked packet slip PDF from Leopards.

    This is the direct endpoint that returns a PDF for a given CN number.
    Does NOT require generateLoadSheet first.

    Tries multiple auth methods:
    1. GET with base64-encoded credentials in query string
    2. POST with api_key/api_password in form data
    """
    import base64
    import urllib.parse

    # Method 1: GET with base64 credentials (original Leopards docs format)
    key_b64 = base64.b64encode(LEOPARDS_API_KEY.encode()).decode()
    pw_b64 = base64.b64encode(LEOPARDS_API_PASSWORD.encode()).decode()
    url = (
        f"{LEOPARDS_API_BASE_URL}/api/booked_packet_slip_api/{cn_number}"
        f"?api_key_secure={urllib.parse.quote(key_b64)}&api_key_password_secure={urllib.parse.quote(pw_b64)}"
    )
    try:
        async with httpx.AsyncClient(timeout=_TIMEOUT) as client:
            resp = await client.get(url)
            ct = resp.headers.get("content-type", "")
            if resp.status_code == 200 and (
                ct.startswith("application/pdf") or resp.content[:5] == b"%PDF-"
            ):
                return resp
            logger.info(
                "booked_packet_slip_api GET method returned %s (content-type: %s) for CN %s",
                resp.status_code, ct, cn_number,
            )
    except Exception as exc:
        logger.warning("booked_packet_slip_api GET failed for CN %s: %s", cn_number, exc)

    # Method 2: POST with standard form auth (same as other Leopards endpoints)
    try:
        async with httpx.AsyncClient(timeout=_TIMEOUT) as client:
            resp = await client.post(
                f"{LEOPARDS_API_BASE_URL}/api/booked_packet_slip_api/{cn_number}",
                data={"api_key": LEOPARDS_API_KEY, "api_password": LEOPARDS_API_PASSWORD},
            )
            ct = resp.headers.get("content-type", "")
            if resp.status_code == 200 and (
                ct.startswith("application/pdf") or resp.content[:5] == b"%PDF-"
            ):
                return resp
            logger.info(
                "booked_packet_slip_api POST method returned %s (content-type: %s) for CN %s",
                resp.status_code, ct, cn_number,
            )
    except Exception as exc:
        logger.warning("booked_packet_slip_api POST failed for CN %s: %s", cn_number, exc)

    # Method 3: Try the format/json variant
    try:
        async with httpx.AsyncClient(timeout=_TIMEOUT) as client:
            resp = await client.post(
                f"{LEOPARDS_API_BASE_URL}/api/booked_packet_slip_api/{cn_number}/format/json/",
                data={"api_key": LEOPARDS_API_KEY, "api_password": LEOPARDS_API_PASSWORD},
            )
            ct = resp.headers.get("content-type", "")
            if resp.status_code == 200 and (
                ct.startswith("application/pdf") or resp.content[:5] == b"%PDF-"
            ):
                return resp
            logger.info(
                "booked_packet_slip_api format/json returned %s (content-type: %s) for CN %s",
                resp.status_code, ct, cn_number,
            )
    except Exception as exc:
        logger.warning("booked_packet_slip_api format/json failed for CN %s: %s", cn_number, exc)

    return None


async def book_packet_api(payload: dict) -> dict:
    """Call Leopards Merchant API /api/bookPacket/format/json/ to book a packet.

    The Leopards API requires:
    - origin_city / destination_city as integer city IDs (or 'self' for origin)
    - shipment fields can use 'self' to use merchant account defaults
    """
    destination_city = payload.get("destination_city", "")
    destination_city_id = payload.get("destination_city_id")

    if not destination_city_id and destination_city:
        destination_city_id = await get_city_id(str(destination_city))

    origin_val = payload.get("origin_city", "self")
    if origin_val.lower() == "self" or not origin_val:
        origin_val = "self"
    else:
        origin_id = await get_city_id(str(origin_val))
        if origin_id:
            origin_val = str(origin_id)

    dest_val = str(destination_city_id) if destination_city_id else "self"

    # Never silently book to the account-default city. If the customer city
    # cannot be resolved to a Leopards city ID, fail loudly instead of sending
    # `self` (which Leopards interprets as the merchant's own origin/default
    # city — e.g. Islamabad) and generating a waybill to the wrong destination.
    if not destination_city_id:
        if not re.match(r"^\d+$", str(dest_val)):
            logger.warning(
                "bookPacket destination city not resolvable: %r (fallback '%s' refused)",
                destination_city, dest_val,
            )
            return {
                "status": 0,
                "error": (
                    f"Destination city '{destination_city}' was not found on Leopards. "
                    "Shipment was NOT booked to the wrong destination. "
                    "Correct the consignee city and try again."
                ),
            }

    weight = str(payload.get("weight", payload.get("weight_grams", "500")))
    pieces = str(payload.get("pieces", "1"))
    cod_amount = str(payload.get("cod_amount", "0"))

    try:
        resp = await _post(
            "/api/bookPacket/format/json/",
            booked_packet_weight=weight,
            booked_packet_no_piece=pieces,
            booked_packet_collect_amount=cod_amount,
            booked_packet_order_id=str(payload.get("order_id", "")),
            origin_city=origin_val,
            destination_city=dest_val,
            # Shipper/company information (the business shipping — never the
            # customer/consignee). These fields accept real values OR 'self'
            # (merchant account default). Supplied values come from the manual
            # booking page / configured default_shipper; empty falls back to
            # 'self'. NOTE: the Leopards bookPacket API has NO shipment_city
            # field — the shipper's origin city is conveyed via origin_city.
            shipment_name_eng=str(payload.get("shipper_name", "") or "self"),
            shipment_email=str(payload.get("shipper_email", "") or "self"),
            shipment_phone=str(payload.get("shipper_phone", "") or "self"),
            shipment_address=str(payload.get("shipper_address", "") or "self"),
            consignment_name_eng=str(payload.get("consignee_name", "")),
            consignment_email=str(payload.get("consignee_email", "")),
            consignment_phone=str(payload.get("consignee_phone", "")),
            consignment_address=str(payload.get("consignee_address", "")),
            special_instructions=str(payload.get("special_instructions", "N/A")),
        )
        return resp.json()
    except Exception as exc:
        logger.warning("bookPacket API call failed: %s", exc)
        return {}

