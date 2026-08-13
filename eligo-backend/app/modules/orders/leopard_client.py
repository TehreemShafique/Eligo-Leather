"""Thin async client for the Leopards Courier Merchant API.

All calls authenticate with the merchant `api_key` / `api_password` taken from
environment variables. Confirmed working live endpoints (2026-08):

- POST /api/trackBookedPacket/format/json/  -> booked packet tracking data
- POST /api/downloadLoadSheet/format/json/  -> returns the real challan PDF
- POST /api/generateLoadSheet/format/json/  -> generate a load sheet for CNs
- GET  /api/cnList/                         -> pool of allocated CN numbers
- POST /api/getAllCities/format/json/       -> supported city list
"""

from __future__ import annotations

import os
import logging

import httpx

logger = logging.getLogger(__name__)

LEOPARDS_API_BASE_URL = os.getenv(
    "LEOPARDS_API_BASE_URL", "https://merchantapi.leopardscourier.com"
).rstrip("/")

LEOPARDS_API_KEY = os.getenv("LEOPARDS_API_KEY", "")
LEOPARDS_API_PASSWORD = os.getenv("LEOPARDS_API_PASSWORD", "")

_INITIAL_CN_NUMBERS = os.getenv(
    "LEOPARDS_INITIAL_CN_NUMBERS", ""
)
_INITIAL_CHALLANS = os.getenv(
    "LEOPARDS_INITIAL_CHALLANS", ""
)

_TIMEOUT = httpx.Timeout(90.0, connect=30.0)


def initial_cn_numbers() -> list[str]:
    """Comma-separated CNs configured via LEOPARDS_INITIAL_CN_NUMBERS."""
    return [c.strip() for c in _INITIAL_CN_NUMBERS.split(",") if c.strip()]


def initial_challans() -> list[str]:
    """Comma-separated challan numbers configured via LEOPARDS_INITIAL_CHALLANS."""
    return [c.strip() for c in _INITIAL_CHALLANS.split(",") if c.strip()]


async def _post(path: str, **fields) -> httpx.Response:
    data = {"api_key": LEOPARDS_API_KEY, "api_password": LEOPARDS_API_PASSWORD}
    data.update({k: v for k, v in fields.items() if v is not None})
    async with httpx.AsyncClient(timeout=_TIMEOUT) as client:
        resp = await client.post(f"{LEOPARDS_API_BASE_URL}{path}", data=data)
        resp.raise_for_status()
        return resp


async def track_booked_packets(cn_numbers: list[str]) -> list[dict]:
    """Return the full booked-packet records for the given consignment numbers."""
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
    logger.warning("trackBookedPacket unexpected payload: %s", str(payload)[:200])
    return []


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

    Returns the parsed JSON response (contains the new challan number).
    """
    resp = await _post(
        "/api/generateLoadSheet/format/json/",
        cn_number=",".join(cn_numbers),
        courier_name=courier_name,
        courier_code=courier_code,
    )
    try:
        return resp.json()
    except Exception:
        return {"raw": resp.text[:1000]}


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
        return payload["city_list"]
    return []


async def book_packet_api(payload: dict) -> dict:
    """Call Leopards Merchant API /api/bookPacket/format/json/ to book a packet."""
    try:
        resp = await _post(
            "/api/bookPacket/format/json/",
            booked_packet_weight=str(payload.get("weight", "500")),
            booked_packet_no_piece=str(payload.get("pieces", "1")),
            booked_packet_collect_amount=str(payload.get("cod_amount", "0")),
            booked_packet_order_id=str(payload.get("order_id", "")),
            origin_city=str(payload.get("origin_city", "Islamabad")),
            destination_city=str(payload.get("destination_city", "")),
            shipment_name_eng=str(payload.get("shipper_name", "ELIGO LEATHER")),
            shipment_email=str(payload.get("shipper_email", "info@eligoleather.com")),
            shipment_phone=str(payload.get("shipper_phone", "03345399470")),
            shipment_address=str(payload.get("shipper_address", "Office # 407, 4th floor, Gulberg Empire, Executive Block, Gulberg Greens, Islamabad")),
            consignment_name_eng=str(payload.get("consignee_name", "")),
            consignment_phone=str(payload.get("consignee_phone", "")),
            consignment_address=str(payload.get("consignee_address", "")),
            special_instructions=str(payload.get("special_instructions", "")),
        )
        return resp.json()
    except Exception as exc:
        logger.warning("bookPacket API call failed: %s", exc)
        return {}

