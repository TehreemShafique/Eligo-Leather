"""Server-side event dispatch for tracking pixels.

Web pixels run as JS in the browser (the storefront template injects them).
Server pixels fire from the backend when a conversion happens (order placed,
checkout started, ...) and are sent to the provider's server-side event API.

Each adapter receives:

    auth_tokens  - decrypted credentials from the linked app row
                   (see app/modules/settings/apps/crypto.py), or None
    settings     - pixel.settings / provider config
    payload      - the event payload: {event_type, payload, pixel_id}

=============================================================================
HOW TO ADD THE META CONVERSIONS API (server-side events for Facebook/IG)
=============================================================================
The Meta Conversions API lets you send purchase/conversion events from your
backend (more reliable than browser pixels, and required for iOS 14+).

  1. PREREQUISITES (get these, then store them on the linked app row):
     - Meta Pixel ID            (the tracking id in your Meta Events Manager)
     - Meta Conversions API access token (created in Events Manager ->
       Settings -> Conversions API -> Generate access token)
     - The app is already OAuth-connected OR you use a System User token.

  2. REQUEST (replace the stub in _meta_send_event below):
     POST https://graph.facebook.com/v19.0/{pixel_id}/events
     Authorization: none needed (pass access_token in body or query)
     {
       "data": [{
         "event_name": event_type.upper(),        # e.g. "PURCHASE"
         "event_time": int(time.time()),
         "event_id": str(uuid4()),                # dedupe browser+server
         "action_source": "website",
         "user_data": {
           "em": hashed_email,                    # sha256(lowercased, trimmed)
           "ph": hashed_phone,                    # sha256 with country code
           "client_ip_address": payload.get("ip"),
           "client_user_agent": payload.get("ua"),
           "fbc": payload.get("fbc"),             # fbclid cookie
           "fbp": payload.get("fbp")              # _fbp cookie
         },
         "custom_data": {
           "currency": payload.get("currency", "PKR"),
           "value": payload.get("value", 0),
           "content_ids": payload.get("content_ids", []),
           "content_type": "product"
         }
       }],
       "access_token": auth_tokens["conversions_access_token"]
     }
  3. VERIFY: GET https://graph.facebook.com/v19.0/{pixel_id}?fields=name
     or use the test events tool in Meta Events Manager. Response contains
     `events_received: 1` on success.

=============================================================================
HOW TO ADD THE GOOGLE ANALYTICS 4 MEASUREMENT PROTOCOL (server-side)
=============================================================================
  1. PREREQUISITES:
     - GA4 Measurement ID (G-XXXXXXXXXX) -> stored in auth_tokens / pixel_id
     - GA4 API Secret (Admin -> Data Streams -> your stream -> Measurement
       Protocol API secrets)
  2. REQUEST (replace the stub in _ga4_send_event below):
     POST https://www.google-analytics.com/mp/collect?api_secret={secret}&measurement_id={G-ID}
     {
       "client_id": payload.get("client_id") or uuid4().hex,
       "user_id": payload.get("user_id"),
       "events": [{"name": event_type, "params": payload}]
     }
=============================================================================
"""

import uuid
from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.settings.apps.crypto import decrypt_credentials
from app.modules.settings.apps.model import StoreIntegration


class PixelAdapterError(Exception):
    """Raised when a server-side event dispatch fails."""


async def _resolve_auth_tokens(app_code: str | None, db: AsyncSession) -> dict:
    """Pull the linked app's decrypted credentials (if a pixel is tied to an app)."""
    if not app_code:
        return {}
    result = await db.execute(select(StoreIntegration).where(StoreIntegration.app_code == app_code))
    row = result.scalar_one_or_none()
    return decrypt_credentials(row.api_credentials) if row else {}


# ============================ FACEBOOK / INSTAGRAM ====================


async def _meta_send_event(app_code: str | None, db: AsyncSession, payload: dict) -> dict:
    """Meta Conversions API - fire a conversion event server-side."""
    # =================================================================
    # ADD META CONVERSIONS API CALL HERE (see the walkthrough at the top)
    # -----------------------------------------------------------------
    # import httpx
    # import time
    # from hashlib import sha256
    # auth = await _resolve_auth_tokens(app_code, db)
    # pixel_id = payload.get("pixel_id") or auth.get("pixel_id")
    # access_token = auth.get("conversions_access_token")
    # if not pixel_id or not access_token:
    #     return {"success": False, "message": "Missing Meta pixel_id or access_token"}
    #
    # def h(s): return sha256((s or "").strip().lower().encode()).hexdigest()
    # email = h(payload.get("payload", {}).get("email"))
    # phone = h(payload.get("payload", {}).get("phone"))
    #
    # body = {"data": [{
    #     "event_name": payload["event_type"].upper(),
    #     "event_time": int(time.time()),
    #     "event_id": str(uuid.uuid4()),
    #     "action_source": "website",
    #     "user_data": {"em": email, "ph": phone},
    #     "custom_data": payload.get("payload", {}),
    # }], "access_token": access_token}
    # async with httpx.AsyncClient() as client:
    #     resp = await client.post(
    #         f"https://graph.facebook.com/v19.0/{pixel_id}/events", json=body
    #     )
    #     data = resp.json()
    #     return {"success": resp.is_success, "status_code": resp.status_code, "data": data}
    # =================================================================
    return {
        "success": False,
        "message": "Meta Conversions API not wired yet - add it in "
        "app/modules/settings/customer_events/adapters/__init__.py",
    }


# ============================ GOOGLE ANALYTICS ========================


async def _ga4_send_event(app_code: str | None, db: AsyncSession, payload: dict) -> dict:
    """GA4 Measurement Protocol - fire a server-side event."""
    # =================================================================
    # ADD GA4 MEASUREMENT PROTOCOL CALL HERE (see walkthrough at the top)
    # -----------------------------------------------------------------
    # import httpx
    # auth = await _resolve_auth_tokens(app_code, db)
    # measurement_id = payload.get("pixel_id") or auth.get("measurement_id")
    # api_secret = auth.get("api_secret")
    # if not measurement_id or not api_secret:
    #     return {"success": False, "message": "Missing GA4 measurement_id or api_secret"}
    #
    # body = {
    #     "client_id": payload.get("payload", {}).get("client_id") or str(uuid.uuid4()),
    #     "events": [{"name": payload["event_type"], "params": payload.get("payload", {})}],
    # }
    # async with httpx.AsyncClient() as client:
    #     resp = await client.post(
    #         "https://www.google-analytics.com/mp/collect",
    #         params={"api_secret": api_secret, "measurement_id": measurement_id},
    #         json=body,
    #     )
    #     return {"success": resp.status_code == 204, "status_code": resp.status_code}
    # =================================================================
    return {
        "success": False,
        "message": "GA4 Measurement Protocol not wired yet - add it in "
        "app/modules/settings/customer_events/adapters/__init__.py",
    }


# ============================ TIKTOK ==================================


async def _tiktok_send_event(app_code: str | None, db: AsyncSession, payload: dict) -> dict:
    """TikTok Events API - fire a server-side conversion event."""
    # =================================================================
    # ADD TIKTOK EVENTS API CALL HERE
    # -----------------------------------------------------------------
    # TikTok Events API: POST https://business-api.tiktok.com/open_api/v1.3/event/track/
    # with {"event_source": "web", "event_name": event_type, "event_time": ts,
    #       "user": {"email": ..., "phone": ...},
    #       "properties": payload, "page": {...}}
    # Auth: app_key + app_secret + access_token (from auth_tokens).
    # =================================================================
    return {
        "success": False,
        "message": "TikTok Events API not wired yet - add it in "
        "app/modules/settings/customer_events/adapters/__init__.py",
    }


# ============================ CUSTOM ==================================


async def _custom_send_event(app_code: str | None, db: AsyncSession, payload: dict) -> dict:
    """Custom / generic server event - nothing to call unless you add an HTTP sink."""
    return {
        "success": True,
        "message": "Custom server event logged (no external API configured).",
    }


# =====================================================================
# PIXEL ADAPTER REGISTRY
# Maps provider -> server-side event sender.
# When you add a new provider, register its adapter here as well.
# =====================================================================

ADAPTERS: dict[str, callable] = {
    "facebook": _meta_send_event,
    "instagram": _meta_send_event,
    "google_analytics": _ga4_send_event,
    "tiktok": _tiktok_send_event,
    "custom": _custom_send_event,
}


async def dispatch(provider: str, app_code: str | None, db: AsyncSession, payload: dict) -> dict:
    adapter = ADAPTERS.get(provider)
    if adapter is None:
        raise PixelAdapterError(
            f"No server-side adapter for provider '{provider}'. "
            "Add it in app/modules/settings/customer_events/adapters/__init__.py"
        )
    return await adapter(app_code, db, payload)
