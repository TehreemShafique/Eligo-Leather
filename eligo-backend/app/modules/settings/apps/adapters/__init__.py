"""Third-party provider adapters for installed apps.

ENV-BASED CREDENTIAL LOGIC
---------------------------------------------------------------------
This module assumes a single store / single set of provider accounts.
Every adapter reads its own credentials straight from os.environ - no
credentials dict is passed in from the caller anymore. Make sure your
.env is loaded before this module's functions are called (e.g. via
python-dotenv's load_dotenv() at your app's entrypoint, or your
framework's own settings loader) - this file does NOT call load_dotenv()
itself, to avoid double-loading or clashing with your app's existing
config setup.

Each adapter receives only:
    payload  - the request payload from the action endpoint

Required env vars per provider are listed above each adapter.
"""

import os

import httpx

class AdapterError(Exception):
    """Raised when an adapter call fails (missing env var, bad creds, provider error, etc.)."""
    pass


def _require_env(key: str) -> str:
    """Fetch a required env var, or raise a clear AdapterError instead of a bare KeyError."""
    value = os.environ.get(key)
    if not value:
        raise AdapterError(
            f"Missing required env var '{key}'. Add it to your .env file."
        )
    return value


# ============================ EMAIL (Resend) ===========================
# Required env: RESEND_API_KEY, RESEND_FROM_EMAIL
# Get the API key from Resend Dashboard -> API Keys. RESEND_FROM_EMAIL
# must be an address on a domain you've verified in Resend -> Domains,
# otherwise sends will fail (or be restricted to their sandbox address).

RESEND_SEND_URL = "https://api.resend.com/emails"


async def _resend_send_email(payload: dict) -> dict:
    """Resend - action: send_email. Payload: {to, subject, html}"""
    api_key = _require_env("RESEND_API_KEY")
    from_email = _require_env("RESEND_FROM_EMAIL")
    try:
        async with httpx.AsyncClient(timeout=15) as client:
            resp = await client.post(
                RESEND_SEND_URL,
                headers={
                    "Authorization": f"Bearer {api_key}",
                    "Content-Type": "application/json",
                },
                json={
                    "from": from_email,
                    "to": [payload["to"]] if isinstance(payload["to"], str) else payload["to"],
                    "subject": payload["subject"],
                    "html": payload["html"],
                },
            )
            resp.raise_for_status()
            data = resp.json()
        return {"success": True, "id": data.get("id")}
    except httpx.HTTPError as exc:
        raise AdapterError(f"Resend send_email failed: {exc}")


# ============================ SHIPPING / TRACKING ====================

# ---- Leopards Courier ----
# Required env: LEOPARDS_API_KEY, LEOPARDS_API_PASSWORD
# Get these from your Leopards merchant portal / account manager - not
# self-generated. Endpoint paths below are placeholders - confirm exact
# paths and field names against your Leopards API docs before relying
# on this in production.

LEOPARDS_BOOK_URL = "https://merchantapi.leopardscourier.com/api/bookPacket/format/json/"
LEOPARDS_TRACK_URL = "https://merchantapi.leopardscourier.com/api/trackBookedPacket/format/json/"


async def _leopards_create_shipment(payload: dict) -> dict:
    """Leopards Courier - action: create_shipment. Payload: {order: {...}}"""
    api_key = _require_env("LEOPARDS_API_KEY")
    api_password = _require_env("LEOPARDS_API_PASSWORD")
    try:
        async with httpx.AsyncClient(timeout=20) as client:
            resp = await client.post(
                LEOPARDS_BOOK_URL,
                data={"api_key": api_key, "api_password": api_password, **payload.get("order", {})},
            )
            resp.raise_for_status()
            data = resp.json()
        return {"success": True, "raw": data}
    except httpx.HTTPError as exc:
        raise AdapterError(f"Leopards create_shipment failed: {exc}")


async def _leopards_track_shipment(payload: dict) -> dict:
    """Leopards Courier - action: track_shipment. Payload: {waybill}"""
    api_key = _require_env("LEOPARDS_API_KEY")
    api_password = _require_env("LEOPARDS_API_PASSWORD")
    try:
        async with httpx.AsyncClient(timeout=20) as client:
            resp = await client.post(
                LEOPARDS_TRACK_URL,
                data={
                    "api_key": api_key,
                    "api_password": api_password,
                    "track_numbers": payload["waybill"],
                },
            )
            resp.raise_for_status()
            data = resp.json()
        return {"success": True, "raw": data}
    except httpx.HTTPError as exc:
        raise AdapterError(f"Leopards track_shipment failed: {exc}")


# ---- Sonic-Trax ----
# Required env: SONIC_TRAX_API_KEY, SONIC_TRAX_BASE_URL
# You have the API key but not the base URL yet - these functions will
# raise a clear AdapterError ("Missing required env var 'SONIC_TRAX_BASE_URL'")
# if called before you fill it in. That's intentional - better a clear
# error now than a silent failure hitting the wrong host later.
# Endpoint paths below are placeholders - replace once Trax confirms
# their exact contract.

async def _sonic_trax_create_shipment(payload: dict) -> dict:
    """Sonic-Trax - action: create_shipment. Payload: {order: {...}}"""
    api_key = _require_env("SONIC_TRAX_API_KEY")
    base_url = _require_env("SONIC_TRAX_BASE_URL")
    try:
        async with httpx.AsyncClient(timeout=20) as client:
            resp = await client.post(
                base_url.rstrip("/") + "/create-order",  # TODO: confirm real path with Trax
                headers={"Authorization": f"Bearer {api_key}"},
                json=payload.get("order", {}),
            )
            resp.raise_for_status()
            data = resp.json()
        return {"success": True, "raw": data}
    except httpx.HTTPError as exc:
        raise AdapterError(f"Sonic-Trax create_shipment failed: {exc}")


async def _sonic_trax_track_shipment(payload: dict) -> dict:
    """Sonic-Trax - action: track_shipment. Payload: {waybill}"""
    api_key = _require_env("SONIC_TRAX_API_KEY")
    base_url = _require_env("SONIC_TRAX_BASE_URL")
    try:
        async with httpx.AsyncClient(timeout=20) as client:
            resp = await client.get(
                base_url.rstrip("/") + "/track",  # TODO: confirm real path with Trax
                headers={"Authorization": f"Bearer {api_key}"},
                params={"waybill": payload["waybill"]},
            )
            resp.raise_for_status()
            data = resp.json()
        return {"success": True, "raw": data}
    except httpx.HTTPError as exc:
        raise AdapterError(f"Sonic-Trax track_shipment failed: {exc}")



async def _supabase_headers() -> dict:
    key = _require_env("NEXT_PUBLIC_SUPABASE_SECRET_KEY")
    return {
        "apikey": key,
        "Authorization": f"Bearer {key}",
        "Content-Type": "application/json",
    }


def _supabase_reviews_url() -> str:
    base_url = _require_env("NEXT_PUBLIC_SUPABASE_URL").rstrip("/")
    table = os.environ.get("SUPABASE_REVIEWS_TABLE", "reviews")
    return f"{base_url}/rest/v1/{table}"


async def _supabase_fetch_reviews(payload: dict) -> dict:
    """Supabase Reviews - action: fetch_reviews. Payload: {external_id?, page?, per_page?}"""
    try:
        per_page = payload.get("per_page", 20)
        page = payload.get("page", 1)
        offset = (page - 1) * per_page

        params = {
            "select": "*",
            "order": "created_at.desc",
            "limit": str(per_page),
            "offset": str(offset),
        }
        # Storefront reads only ever see approved reviews; admin fetches all.
        if payload.get("status"):
            params["status"] = f"eq.{payload['status']}"
        if payload.get("external_id"):
            params["product_id"] = f"eq.{payload['external_id']}"

        async with httpx.AsyncClient(timeout=15) as client:
            resp = await client.get(
                _supabase_reviews_url(),
                headers=await _supabase_headers(),
                params=params,
            )
            resp.raise_for_status()
            data = resp.json()

        return {"success": True, "reviews": data}
    except httpx.HTTPError as exc:
        raise AdapterError(f"Supabase fetch_reviews failed: {exc}")


async def _supabase_post_review(payload: dict) -> dict:
    """Supabase Reviews - action: post_review.
    Payload: {external_id?, reviewer_name, reviewer_email, rating, title, body}
    Customer-submitted reviews always land as 'pending' until an admin
    approves them via update_review_status.
    """
    try:
        body = {
            "product_id": payload.get("external_id"),
            "reviewer_name": payload["reviewer_name"],
            "reviewer_email": payload.get("reviewer_email", ""),
            "rating": payload["rating"],
            "title": payload.get("title", ""),
            "body": payload["body"],
            "status": "pending",
        }
        headers = await _supabase_headers()
        headers["Prefer"] = "return=representation"  # ask PostgREST to return the created row

        async with httpx.AsyncClient(timeout=15) as client:
            resp = await client.post(_supabase_reviews_url(), headers=headers, json=body)
            resp.raise_for_status()
            data = resp.json()

        return {"success": True, "review": data[0] if isinstance(data, list) and data else data}
    except httpx.HTTPError as exc:
        raise AdapterError(f"Supabase post_review failed: {exc}")


async def _supabase_update_review_status(payload: dict) -> dict:
    """Supabase Reviews - action: update_review_status.
    Payload: {review_id, status} ('approved' | 'rejected' | 'pending')
    """
    try:
        review_id = payload["review_id"]
        status = payload["status"]
        url = f"{_supabase_reviews_url()}?id=eq.{review_id}"
        headers = await _supabase_headers()
        headers["Prefer"] = "return=representation"

        async with httpx.AsyncClient(timeout=15) as client:
            resp = await client.patch(url, headers=headers, json={"status": status})
            resp.raise_for_status()
            data = resp.json()

        return {"success": True, "review": data[0] if isinstance(data, list) and data else data}
    except httpx.HTTPError as exc:
        raise AdapterError(f"Supabase update_review_status failed: {exc}")


async def _supabase_delete_review(payload: dict) -> dict:
    """Supabase Reviews - action: delete_review. Payload: {review_id}"""
    try:
        review_id = payload["review_id"]
        url = f"{_supabase_reviews_url()}?id=eq.{review_id}"
        headers = await _supabase_headers()

        async with httpx.AsyncClient(timeout=15) as client:
            resp = await client.delete(url, headers=headers)
            resp.raise_for_status()

        return {"success": True, "message": f"Review {review_id} deleted successfully"}
    except httpx.HTTPError as exc:
        raise AdapterError(f"Supabase delete_review failed: {exc}")

#   FOR FRONTEND  LOGIC
# function timeAgo(createdAt) {
#   const diffDays = Math.floor((Date.now() - new Date(createdAt)) / 86400000);
#   if (diffDays < 1) return "today";
#   if (diffDays < 30) return `${diffDays} day${diffDays === 1 ? "" : "s"} ago`;
#   const months = Math.floor(diffDays / 30);
#   return `${months} month${months === 1 ? "" : "s"} ago`;

# const initials = reviewerName.split(" ").map(n => n[0]).join("").toUpperCase();
# // render a circle div with `initials` if avatar_url is falsy, else an <img src={avatar_url}>

# Array.from({ length: 5 }, (_, i) => i < rating ? "★" : "☆").join("")
# }
# ============================ ANALYTICS (Microsoft Clarity) ===========
# Required env: CLARITY_API_TOKEN
# Optional env: CLARITY_PROJECT_ID (kept for your own reference/logging;
# not required by this particular endpoint)
# Not in your current .env yet - left wired here so it's a one-line
# env addition later rather than rewriting code. Get the token from
# your Clarity project -> Settings -> Data Export -> Generate new API
# token. Free, but capped at 10 requests/day per project, max 3 days
# of data and 3 dimensions per request - poll sparingly (e.g. once
# daily via a cron job).

CLARITY_EXPORT_URL = "https://www.clarity.ms/export-data/api/v1/project-live-insights"


async def _clarity_fetch_insights(payload: dict) -> dict:
    """Microsoft Clarity - action: fetch_insights.
    Payload: {num_of_days?: 1|2|3, dimension1?, dimension2?, dimension3?}
    """
    api_token = _require_env("CLARITY_API_TOKEN")
    try:
        params = {"numOfDays": payload.get("num_of_days", 1)}
        for key in ("dimension1", "dimension2", "dimension3"):
            if payload.get(key):
                params[key] = payload[key]

        async with httpx.AsyncClient(timeout=15) as client:
            resp = await client.get(
                CLARITY_EXPORT_URL,
                headers={"Authorization": f"Bearer {api_token}"},
                params=params,
            )
            resp.raise_for_status()
            data = resp.json()

        return {"success": True, "insights": data}
    except httpx.HTTPError as exc:
        raise AdapterError(f"Clarity fetch_insights failed: {exc}")


# =====================================================================
# SKIPPED FOR NOW - SMS
# =====================================================================

# async def _twilio_send_sms(payload: dict) -> dict:
#     """Twilio SMS - action: send_sms. Payload: {to, body}"""
#     account_sid = _require_env("TWILIO_ACCOUNT_SID")
#     auth_token = _require_env("TWILIO_AUTH_TOKEN")
#     from_number = _require_env("TWILIO_FROM_NUMBER")
#     from twilio.rest import Client
#     client = Client(account_sid, auth_token)
#     message = client.messages.create(body=payload["body"], from_=from_number, to=payload["to"])
#     return {"success": True, "message_sid": message.sid}


# =====================================================================
# NOT WIRED - Klaviyo (not needed while flows are built manually)
# =====================================================================

# async def _klaviyo_sync_profile(payload: dict) -> dict:
#     """Klaviyo Marketing - action: sync_profile."""
#     ...
#
# async def _klaviyo_trigger_flow(payload: dict) -> dict:
#     """Klaviyo Marketing - action: trigger_flow."""
#     ...


ADAPTERS: dict[str, dict[str, callable]] = {
    "resend_email": {"send_email": _resend_send_email},
    "leopards_shipping": {
        "create_shipment": _leopards_create_shipment,
        "track_shipment": _leopards_track_shipment,
    },
    # "sonic_trax_shipping": {
    #     "create_shipment": _sonic_trax_create_shipment,
    #     "track_shipment": _sonic_trax_track_shipment,
    # },
    "supabase_reviews": {
        "fetch_reviews": _supabase_fetch_reviews,
        "post_review": _supabase_post_review,
        "update_review_status": _supabase_update_review_status,
        "delete_review": _supabase_delete_review,
    },
    "clarity_analytics": {"fetch_insights": _clarity_fetch_insights},
    # "twilio_sms": {"send_sms": _twilio_send_sms},           # skipped
    # "klaviyo_marketing": {                                   # not needed yet
    #     "sync_profile": _klaviyo_sync_profile,
    #     "trigger_flow": _klaviyo_trigger_flow,
    # },
}


async def run(app_code: str, action: str, payload: dict) -> dict:
    """Dispatch to the right adapter. Credentials are read from env inside
    each adapter, so callers only need to pass app_code, action, and payload.
    """
    adapter = ADAPTERS.get(app_code, {}).get(action)
    if adapter is None:
        raise AdapterError(
            f"No adapter registered for app '{app_code}' action '{action}'. "
            "Add it in app/modules/settings/apps/adapters/__init__.py"
        )
    return await adapter(payload)

