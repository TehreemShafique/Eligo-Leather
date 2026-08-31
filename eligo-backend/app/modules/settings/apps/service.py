from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.settings.apps import adapters
from app.modules.settings.apps.crypto import encrypt_credentials
from app.modules.settings.apps.model import AppStatus, StoreIntegration
from app.modules.settings.apps.reviews import (
    create_review,
    list_reviews,
    review_summary,
    update_review_status as set_review_status,
    delete_review as remove_review,
)
from app.modules.settings.apps.schema import AppDefinition, AppInstall, AppUpdate

# =====================================================================
# APP REGISTRY
# =====================================================================
# Every app shown in Settings -> Apps lives in this list. `credential_fields`
# is what the Settings UI asks the admin for (e.g. an API key / sender
# number) and is stored encrypted on `store_integrations.api_credentials`.
#
# To add a new app:
#   1. Add an entry below (code must be unique).
#   2. Implement its actions in app/modules/settings/apps/adapters/__init__.py
#      and register them in the ADAPTERS mapping.
# =====================================================================

APP_DEFINITIONS: list[dict] = [
    # ------------------------------------------------------------------
    # SMS providers
    # ------------------------------------------------------------------
    # {
    #     "code": "twilio_sms",
    #     "name": "Twilio SMS",
    #     "category": "sms",
    #     "description": "Send order status updates and promotional texts.",
    #     "actions": ["send_sms"],
    #     "credential_fields": [
    #         {"name": "account_sid", "label": "Account SID", "type": "password"},
    #         {"name": "auth_token", "label": "Auth Token", "type": "password"},
    #         {"name": "from_number", "label": "From Phone Number", "type": "text"},
    #     ],
    #     "config_fields": [],
    # },
    # {
    #     "code": "viro_sms",
    #     "name": "Viro SMS",
    #     "category": "sms",
    #     "description": "Pakistani SMS gateway for order alerts and OTPs.",
    #     "actions": ["send_sms"],
    #     "credential_fields": [
    #         {"name": "api_key", "label": "API Key", "type": "password"},
    #         {"name": "sender_id", "label": "Sender ID / Mask", "type": "text"},
    #     ],
    #     "config_fields": [],
    # },
    # ------------------------------------------------------------------
    # Email providers
    # ------------------------------------------------------------------
    # {
    #     "code": "sendgrid_email",
    #     "name": "SendGrid Email",
    #     "category": "email",
    #     "description": "Transactional and marketing email delivery.",
    #     "actions": ["send_email"],
    #     "credential_fields": [
    #         {"name": "api_key", "label": "API Key", "type": "password"},
    #         {"name": "from_email", "label": "From Email", "type": "text"},
    #         {"name": "from_name", "label": "From Name", "type": "text"},
    #     ],
    #     "config_fields": [],
    # },
    # ------------------------------------------------------------------
    # Payments
    # ------------------------------------------------------------------
    # {
    #     "code": "stripe_payments",
    #     "name": "Stripe Payments",
    #     "category": "payments",
    #     "description": "Accept card payments via Stripe.",
    #     "actions": ["create_payment_intent", "capture_payment"],
    #     "credential_fields": [
    #         {"name": "secret_key", "label": "Secret Key", "type": "password"},
    #         {"name": "publishable_key", "label": "Publishable Key", "type": "text"},
    #         {"name": "webhook_secret", "label": "Webhook Secret", "type": "password"},
    #     ],
    #     "config_fields": [],
    # },
    # ------------------------------------------------------------------
    # Shipping / tracking
    # ------------------------------------------------------------------
    {
        "code": "leopards_shipping",
        "name": "Leopards Courier",
        "category": "shipping",
        "description": "Create shipments and fetch tracking for Leopards Courier.",
        "actions": ["create_shipment", "track_shipment"],
        "credential_fields": [
            {"name": "username", "label": "Username", "type": "text"},
            {"name": "password", "label": "Password", "type": "password"},
            {"name": "customer_id", "label": "Customer ID", "type": "text"},
        ],
        "config_fields": [],
    },
    {
        "code": "sonic_trax_shipping",
        "name": "Sonic-Trax Courier",
        "category": "shipping",
        "description": "Create shipments and fetch tracking for Sonic-Trax.",
        "actions": ["create_shipment", "track_shipment"],
        "credential_fields": [
            {"name": "api_key", "label": "API Key", "type": "password"},
            {"name": "account_number", "label": "Account Number", "type": "text"},
        ],
        "config_fields": [],
    },
    # {
    #     "code": "seventeen_track",
    #     "name": "17TRACK",
    #     "category": "tracking",
    #     "description": "Track orders across hundreds of carriers.",
    #     "actions": ["track_shipment"],
    #     "credential_fields": [
    #         {"name": "api_key", "label": "API Key", "type": "password"},
    #     ],
    #     "config_fields": [],
    # },
    # ------------------------------------------------------------------
    # Marketing / reviews / analytics
    # ------------------------------------------------------------------
    # {
    #     "code": "klaviyo_marketing",
    #     "name": "Klaviyo Marketing",
    #     "category": "marketing",
    #     "description": "Email/SMS marketing flows and segmentation.",
    #     "actions": ["sync_profile", "trigger_flow"],
    #     "credential_fields": [
    #         {"name": "private_api_key", "label": "Private API Key", "type": "password"},
    #         {"name": "public_api_key", "label": "Public API Key", "type": "text"},
    #     ],
    #     "config_fields": [],
    # },
    {
        "code": "supabase_reviews",
        "name": "Supabase Reviews",
        "category": "reviews",
        "description": "Collect and display product reviews.",
        "actions": [
            "fetch_reviews",
            "post_review",
            "update_review_status",
            "delete_review",
            "review_summary",
        ],
        "credential_fields": [
            {"name": "api_token", "label": "API Token", "type": "password"},
            {"name": "shop_domain", "label": "Shop Domain", "type": "text"},
        ],
        "config_fields": [],
    },
    {
        "code": "google_analytics",
        "name": "Google Analytics 4",
        "category": "analytics",
        "description": "Track store traffic and conversions.",
        "actions": ["verify_property"],
        "credential_fields": [
            {"name": "measurement_id", "label": "Measurement ID", "type": "text"},
            {"name": "api_secret", "label": "API Secret", "type": "password"},
        ],
        "config_fields": [],
    },
]

_DEFINITIONS_BY_CODE: dict[str, dict] = {app["code"]: app for app in APP_DEFINITIONS}


def get_definition(app_code: str) -> dict | None:
    return _DEFINITIONS_BY_CODE.get(app_code)


async def _installed_by_code(db: AsyncSession) -> dict[str, StoreIntegration]:
    result = await db.execute(select(StoreIntegration))
    return {row.app_code: row for row in result.scalars().all()}


async def list_apps(db: AsyncSession) -> list[AppDefinition]:
    installed = await _installed_by_code(db)
    apps: list[AppDefinition] = []
    for definition in APP_DEFINITIONS:
        row = installed.get(definition["code"])
        apps.append(
            AppDefinition(
                **definition,
                installed=row is not None,
                status=row.status if row else None,
            )
        )
    return apps


async def get_app(app_code: str, db: AsyncSession) -> AppDefinition | None:
    definition = get_definition(app_code)
    if not definition:
        return None
    result = await db.execute(select(StoreIntegration).where(StoreIntegration.app_code == app_code))
    row = result.scalar_one_or_none()
    return AppDefinition(**definition, installed=row is not None, status=row.status if row else None)


async def list_installed(db: AsyncSession) -> list[StoreIntegration]:
    result = await db.execute(select(StoreIntegration).order_by(StoreIntegration.app_name))
    return list(result.scalars().all())


async def get_installed(app_code: str, db: AsyncSession) -> StoreIntegration | None:
    result = await db.execute(select(StoreIntegration).where(StoreIntegration.app_code == app_code))
    return result.scalar_one_or_none()


async def install(data: AppInstall, db: AsyncSession) -> StoreIntegration:
    definition = get_definition(data.app_code)
    if not definition:
        raise ValueError(f"Unknown app: {data.app_code}")

    row = await get_installed(data.app_code, db)
    if row is None:
        row = StoreIntegration(
            app_code=definition["code"],
            app_name=definition["name"],
            category=definition["category"],
            status=AppStatus.installed,
        )
        db.add(row)

    row.api_credentials = encrypt_credentials(data.api_credentials)
    row.settings = data.settings or {}
    row.status = AppStatus.installed

    await db.commit()
    await db.refresh(row)
    return row


async def update(app_code: str, data: AppUpdate, db: AsyncSession) -> StoreIntegration | None:
    row = await get_installed(app_code, db)
    if not row:
        return None

    if data.api_credentials is not None:
        row.api_credentials = encrypt_credentials(data.api_credentials)
    if data.settings is not None:
        row.settings = data.settings

    await db.commit()
    await db.refresh(row)
    return row


async def set_status(app_code: str, status: AppStatus, db: AsyncSession) -> StoreIntegration | None:
    row = await get_installed(app_code, db)
    if not row:
        return None
    row.status = status
    await db.commit()
    await db.refresh(row)
    return row


async def uninstall(app_code: str, db: AsyncSession) -> bool:
    row = await get_installed(app_code, db)
    if not row:
        return False
    await db.delete(row)
    await db.commit()
    return True


async def run_action(app_code: str, action: str, payload: dict, db: AsyncSession) -> dict:
    definition = get_definition(app_code)

    if not definition:
        raise ValueError(f"Unknown or unsupported app: {app_code}")
    if action not in definition["actions"]:
        raise ValueError(f"App '{app_code}' does not support action '{action}'")

    # Reviews are stored in the store's own database (no third-party provider
    # and no credentials), so they work even if the app has not been
    # "installed" — customers can always submit and admins can always moderate.
    if app_code == "supabase_reviews":
        return await _run_reviews_action(action, payload, db)

    row = await get_installed(app_code, db)
    if not row:
        raise ValueError(f"App not installed or unknown: {app_code}")

    result = await adapters.run(app_code, action, payload)
    return {"success": result.get("success", True), "action": action, "data": result}


async def _run_reviews_action(
    action: str, payload: dict, db: AsyncSession
) -> dict:
    """Local (self-hosted) review actions backed by the `reviews` table."""
    if action == "fetch_reviews":
        reviews = await list_reviews(
            db,
            product_id=payload.get("external_id") or payload.get("product_id"),
            status=payload.get("status"),
            page=int(payload.get("page", 1) or 1),
            per_page=int(payload.get("per_page", 50) or 50),
        )
        return {
            "success": True,
            "action": action,
            "data": {"success": True, "reviews": reviews},
        }
    if action == "post_review":
        result = await create_review(db, payload)
        return {"success": True, "action": action, "data": result}
    if action == "review_summary":
        summary = await review_summary(
            db,
            product_id=payload.get("external_id") or payload.get("product_id"),
        )
        if isinstance(summary, dict):
            return {"success": True, "action": action, "data": summary}
        return {"success": True, "action": action, "data": {"summaries": summary}}
    if action == "update_review_status":
        review_id = payload.get("review_id")
        status = payload.get("status")
        if review_id is None or status not in ("approved", "rejected", "pending"):
            raise ValueError("review_id and status ('approved'|'rejected'|'pending') are required")
        result = await set_review_status(db, int(review_id), status)
        if result is None:
            raise ValueError("Review not found")
        return {"success": True, "action": action, "data": result}
    if action == "delete_review":
        review_id = payload.get("review_id")
        if review_id is None:
            raise ValueError("review_id is required")
        deleted = await remove_review(db, int(review_id))
        if not deleted:
            raise ValueError("Review not found")
        return {"success": True, "action": action, "data": {"success": True}}
    raise ValueError(f"App 'supabase_reviews' does not support action '{action}'")
