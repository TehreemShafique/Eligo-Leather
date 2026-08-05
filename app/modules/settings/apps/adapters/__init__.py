"""Third-party provider adapters for installed apps.

Every installed app's actions are dispatched here. Each adapter receives:

    credentials  - decrypted dict of the provider's API keys/tokens
    settings     - plugin-specific config stored on the app row
    payload      - the request payload from the action endpoint

The real provider SDK / REST calls go inside the marked sections below.
Until they are wired up, actions return a clear "not wired" message so the
frontend can show that the integration is configured but not yet connected.

-----centralized dispatcher and registry for all third-party integrations (such as SMS gateways, email providers, payment processors, and couriers)----
"""

# =====================================================================
# WHERE TO ADD YOUR PROVIDER APIS
# ---------------------------------------------------------------------
# SMS   : pip install twilio   -> app.modules.settings.apps.adapters._twilio_*
#         pip install viro     -> app.modules.settings.apps.adapters._viro_*
# EMAIL : pip install sendgrid -> app.modules.settings.apps.adapters._sendgrid_*
#         pip install resend   -> app.modules.settings.apps.adapters._resend_*
# PAYMENTS : pip install stripe -> app.modules.settings.apps.adapters._stripe_* not needed bcz payment is cod
# SHIPPING : call Leopards / Sonic-Trax REST endpoints directly.
# TRACKING : call 17TRACK REST endpoint directly.
# =====================================================================


class AdapterError(Exception):
    """Raised when an adapter call fails (bad creds, provider error, etc.)."""


# ============================ SMS =====================================


async def _twilio_send_sms(credentials: dict, settings: dict, payload: dict) -> dict:
    """Twilio SMS - action: send_sms. Payload: {to, body}"""
    # =================================================================
    # ADD TWILIO SMS API HERE
    # from twilio.rest import Client
    # client = Client(credentials["account_sid"], credentials["auth_token"])
    # message = client.messages.create(
    #     body=payload["body"],
    #     from_=credentials["from_number"],
    #     to=payload["to"],
    # )
    # return {"success": True, "message_sid": message.sid}
    # =================================================================
    return {
        "success": False,
        "message": "Twilio SMS API not wired yet - add it in "
        "app/modules/settings/apps/adapters/__init__.py",
    }


# async def _viro_send_sms(credentials: dict, settings: dict, payload: dict) -> dict:
#     """Viro SMS - action: send_sms. Payload: {to, body}"""
#     # =================================================================
#     # ADD VIRO SMS API HERE (Pakistani gateway, use their REST endpoint)
#     # url = "https://www.viro.com.pk/api/sms.php"
#     # params = {
#     #     "apikey": credentials["api_key"],
#     #     "senderid": credentials["sender_id"],
#     #     "number": payload["to"],
#     #     "message": payload["body"],
#     # }
#     # async with httpx.AsyncClient() as client:
#     #     resp = await client.get(url, params=params)
#     #     resp.raise_for_status()
#     # return {"success": True, "response": resp.json()}
#     # =================================================================
#     return {
#         "success": False,
#         "message": "Viro SMS API not wired yet - add it in "
#         "app/modules/settings/apps/adapters/__init__.py",
#     }


# ============================ EMAIL ===================================
# 100 emails/day for 60 days free .... $19.95 per month

async def _sendgrid_send_email(credentials: dict, settings: dict, payload: dict) -> dict:
    """SendGrid Email - action: send_email. Payload: {to, subject, html}"""
    # =================================================================
    # ADD SENDGRID EMAIL API HERE
    # from sendgrid import SendGridAPIClient
    # from sendgrid.helpers.mail import Mail
    # message = Mail(
    #     from_email=credentials["from_email"],
    #     to_emails=payload["to"],
    #     subject=payload["subject"],
    #     html_content=payload["html"],
    # )
    # response = SendGridAPIClient(credentials["api_key"]).send(message)
    # return {"success": response.status_code in (200, 202), "status_code": response.status_code}
    # =================================================================
    return {
        "success": False,
        "message": "SendGrid Email API not wired yet - add it in "
        "app/modules/settings/apps/adapters/__init__.py",
    }


# async def _resend_send_email(credentials: dict, settings: dict, payload: dict) -> dict:
#     """Resend Email - action: send_email. Payload: {to, subject, html}"""
#     # =================================================================
#     # ADD RESEND EMAIL API HERE
#     # import resend
#     # resend.api_key = credentials["api_key"]
#     # response = resend.Emails.send({
#     #     "from": credentials["from_email"],
#     #     "to": payload["to"],
#     #     "subject": payload["subject"],
#     #     "html": payload["html"],
#     # })
#     # return {"success": bool(response.get("id")), "message_id": response.get("id")}
#     # =================================================================
#     return {
#         "success": False,
#         "message": "Resend Email API not wired yet - add it in "
#         "app/modules/settings/apps/adapters/__init__.py",
#     }


# ============================ PAYMENTS ================================


# async def _stripe_create_payment_intent(credentials: dict, settings: dict, payload: dict) -> dict:
#     """Stripe Payments - action: create_payment_intent. Payload: {amount_cents, currency}"""
#     # =================================================================
#     # ADD STRIPE PAYMENT INTENT API HERE
#     # import stripe
#     # stripe.api_key = credentials["secret_key"]
#     # intent = stripe.PaymentIntent.create(
#     #     amount=payload["amount_cents"],
#     #     currency=payload["currency"],
#     #     automatic_payment_methods={"enabled": True},
#     # )
#     # return {"success": True, "client_secret": intent.client_secret, "id": intent.id}
#     # =================================================================
#     return {
#         "success": False,
#         "message": "Stripe API not wired yet - add it in "
#         "app/modules/settings/apps/adapters/__init__.py",
#     }


# async def _stripe_capture_payment(credentials: dict, settings: dict, payload: dict) -> dict:
#     """Stripe Payments - action: capture_payment. Payload: {payment_intent_id}"""
#     # =================================================================
#     # ADD STRIPE CAPTURE API HERE
#     # import stripe
#     # stripe.api_key = credentials["secret_key"]
#     # intent = stripe.PaymentIntent.capture(payload["payment_intent_id"])
#     # return {"success": intent.status == "succeeded", "status": intent.status}
#     # =================================================================
#     return {
#         "success": False,
#         "message": "Stripe API not wired yet - add it in "
#         "app/modules/settings/apps/adapters/__init__.py",
#     }


# ============================ SHIPPING / TRACKING ====================


async def _leopards_create_shipment(credentials: dict, settings: dict, payload: dict) -> dict:
    """Leopards Courier - action: create_shipment."""
    # =================================================================
    # ADD LEOPARDS BOOKING API HERE (REST, JSON)
    # url = "https://leopardscourier.com/api/create-order"
    # headers = {"Authorization": f"Bearer {credentials['api_key']}"}
    # ... POST payload["order"] ... return consignment number
    # =================================================================
    return {
        "success": False,
        "message": "Leopards API not wired yet - add it in "
        "app/modules/settings/apps/adapters/__init__.py",
    }


async def _leopards_track_shipment(credentials: dict, settings: dict, payload: dict) -> dict:
    """Leopards Courier - action: track_shipment."""
    # =================================================================
    # ADD LEOPARDS TRACKING API HERE (REST)
    # ... GET /track?waybill={payload["waybill"]} ... return status
    # =================================================================
    return {
        "success": False,
        "message": "Leopards tracking API not wired yet - add it in "
        "app/modules/settings/apps/adapters/__init__.py",
    }


async def _sonic_trax_create_shipment(credentials: dict, settings: dict, payload: dict) -> dict:
    """Sonic-Trax Courier - action: create_shipment."""
    # =================================================================
    # ADD SONIC-TRAX BOOKING API HERE
    # =================================================================
    return {
        "success": False,
        "message": "Sonic-Trax API not wired yet - add it in "
        "app/modules/settings/apps/adapters/__init__.py",
    }


async def _sonic_trax_track_shipment(credentials: dict, settings: dict, payload: dict) -> dict:
    """Sonic-Trax Courier - action: track_shipment."""
    # =================================================================
    # ADD SONIC-TRAX TRACKING API HERE
    # =================================================================
    return {
        "success": False,
        "message": "Sonic-Trax tracking API not wired yet - add it in "
        "app/modules/settings/apps/adapters/__init__.py",
    }


# async def _seventeen_track_track_shipment(credentials: dict, settings: dict, payload: dict) -> dict:
#     """17TRACK - action: track_shipment."""
#     # =================================================================
#     # ADD 17TRACK TRACKING API HERE
#     # url = "https://api.17track.net/track/v2.2"
#     # headers = {"17token": credentials["api_key"]}
#     # ... POST {"tracking_number": payload["tracking_number"]} ... return status
#     # =================================================================
#     return {
#         "success": False,
#         "message": "17TRACK API not wired yet - add it in "
#         "app/modules/settings/apps/adapters/__init__.py",
#     }


# ============================ MARKETING / REVIEWS ====================


async def _klaviyo_sync_profile(credentials: dict, settings: dict, payload: dict) -> dict:
    """Klaviyo Marketing - action: sync_profile."""
    # =================================================================
    # ADD KLAVIYO PROFILE SYNC API HERE
    # =================================================================
    return {
        "success": False,
        "message": "Klaviyo API not wired yet - add it in "
        "app/modules/settings/apps/adapters/__init__.py",
    }


async def _klaviyo_trigger_flow(credentials: dict, settings: dict, payload: dict) -> dict:
    """Klaviyo Marketing - action: trigger_flow."""
    # =================================================================
    # ADD KLAVIYO FLOW TRIGGER API HERE
    # =================================================================
    return {
        "success": False,
        "message": "Klaviyo API not wired yet - add it in "
        "app/modules/settings/apps/adapters/__init__.py",
    }


async def _judgeme_fetch_reviews(credentials: dict, settings: dict, payload: dict) -> dict:
    """Judge.me Reviews - action: fetch_reviews."""
    # =================================================================
    # ADD JUDGE.ME REVIEWS API HERE
    # =================================================================
    return {
        "success": False,
        "message": "Judge.me API not wired yet - add it in "
        "app/modules/settings/apps/adapters/__init__.py",
    }


async def _judgeme_post_review(credentials: dict, settings: dict, payload: dict) -> dict:
    """Judge.me Reviews - action: post_review."""
    # =================================================================
    # ADD JUDGE.ME POST REVIEW API HERE
    # =================================================================
    return {
        "success": False,
        "message": "Judge.me API not wired yet - add it in "
        "app/modules/settings/apps/adapters/__init__.py",
    }


async def _google_analytics_verify_property(credentials: dict, settings: dict, payload: dict) -> dict:
    """Google Analytics 4 - action: verify_property."""
    # =================================================================
    # ADD GOOGLE ANALYTICS VERIFY API HERE
    # =================================================================
    return {
        "success": False,
        "message": "Google Analytics API not wired yet - add it in "
        "app/modules/settings/apps/adapters/__init__.py",
    }


# =====================================================================
# ADAPTER REGISTRY
# Maps app_code -> { action_name: adapter_callable }
# When you add a new app, register its adapter here as well.
# =====================================================================

ADAPTERS: dict[str, dict[str, callable]] = {
    "twilio_sms": {"send_sms": _twilio_send_sms},
    # "viro_sms": {"send_sms": _viro_send_sms},
    "sendgrid_email": {"send_email": _sendgrid_send_email},
    # "resend_email": {"send_email": _resend_send_email},
    # "stripe_payments": {
    #     "create_payment_intent": _stripe_create_payment_intent,
    #     "capture_payment": _stripe_capture_payment,
    # },
    "leopards_shipping": {
        "create_shipment": _leopards_create_shipment,
        "track_shipment": _leopards_track_shipment,
    },
    "sonic_trax_shipping": {
        "create_shipment": _sonic_trax_create_shipment,
        "track_shipment": _sonic_trax_track_shipment,
    },
    # "seventeen_track": {"track_shipment": _seventeen_track_track_shipment},
    # "klaviyo_marketing": {
    #     "sync_profile": _klaviyo_sync_profile,
    #     "trigger_flow": _klaviyo_trigger_flow,
    # },
    "judgeme_reviews": {
        "fetch_reviews": _judgeme_fetch_reviews,
        "post_review": _judgeme_post_review,
    },
    "google_analytics": {"verify_property": _google_analytics_verify_property},
}


async def run(app_code: str, action: str, credentials: dict, settings: dict, payload: dict) -> dict:
    adapter = ADAPTERS.get(app_code, {}).get(action)
    if adapter is None:
        raise AdapterError(
            f"No adapter registered for app '{app_code}' action '{action}'. "
            "Add it in app/modules/settings/apps/adapters/__init__.py"
        )
    return await adapter(credentials, settings, payload)
