import hmac
import hashlib
import json
import re
from datetime import datetime, timezone

import httpx
from email.message import EmailMessage
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.db.session import AsyncSessionLocal
from app.modules.settings.apps.crypto import decrypt_credentials, encrypt_credentials
from app.modules.settings.notifications.model import (
    DispatchRule,
    DispatchStatus,
    EmailTemplate,
    NotificationChannel,
    NotificationEventType,
    NotificationLog,
    NotificationSetting,
    SenderConfig,
    WebhookEndpoint,
)
from app.modules.settings.notifications.schema import (
    CustomerSearchResult,
    DispatchResponse,
    DispatchRuleCreate,
    DispatchRuleUpdate,
    EmailTemplateCreate,
    EmailTemplateUpdate,
    ManualEmailRequest,
    ManualEmailResponse,
    SenderConfigUpdate,
    TestEmailResponse,
    TestEmailWithTemplateRequest,
    WebhookEndpointCreate,
    WebhookEndpointUpdate,
    WebhookTestResponse,
)

# =====================================================================
# DEFAULTS / SEED
# =====================================================================

DEFAULT_SENDER = {
    "smtp_host": "smtp.gmail.com",
    "smtp_port": 587,
    "smtp_username": "eligoleather9@gmail.com",
    "from_email": "eligoleather9@gmail.com",
    "from_name": "Eligo Leather",
    "admin_email": "eligoleather9@gmail.com",
}

BUILT_IN_TEMPLATES = [
    {
        "code": "order_confirmation",
        "name": "Order Confirmation",
        "subject": "Order {{ order_number }} confirmed - {{ store_name }}",
        "html_body": (
            "<p>Hi {{ customer_name }},</p>"
            "<p>Thank you for your order. We're getting it ready.</p>"
            "<h3>Order {{ order_number }}</h3>"
            "<table border=\"1\" cellpadding=\"8\" cellspacing=\"0\" "
            "style=\"border-collapse:collapse;width:100%\">"
            "<tr><th>Item</th><th>Qty</th><th>Price</th></tr>"
            "{% for item in items %}"
            "<tr><td>{{ item.product_name }}</td><td>{{ item.quantity }}</td>"
            "<td>{{ item.total_price }} {{ currency }}</td></tr>"
            "{% endfor %}"
            "</table>"
            "<p><strong>Total:</strong> {{ total_price }} {{ currency }}</p>"
            "{% if tracking_number %}"
            "<p>Tracking: {{ tracking_number }} ({{ tracking_company }})</p>"
            "{% endif %}"
            "<p>Thank you for shopping with {{ store_name }}.</p>"
        ),
    },
    {
        "code": "order_shipped",
        "name": "Order Shipped",
        "subject": "Your order {{ order_number }} is on the way",
        "html_body": (
            "<p>Hi {{ customer_name }},</p>"
            "<p>Good news - your order <strong>{{ order_number }}</strong> has "
            "been shipped.</p>"
            "{% if tracking_number %}"
            "<p>Tracking: {{ tracking_number }} ({{ tracking_company }})</p>"
            "{% endif %}"
            "<p>Thank you for shopping with {{ store_name }}.</p>"
        ),
    },
    {
        "code": "order_delivered",
        "name": "Order Delivered",
        "subject": "Your order {{ order_number }} has been delivered",
        "html_body": (
            "<p>Hi {{ customer_name }},</p>"
            "<p>Your order <strong>{{ order_number }}</strong> has been "
            "delivered. We hope you love it!</p>"
            "<p>Thank you for shopping with {{ store_name }}.</p>"
        ),
    },
    {
        "code": "order_cancelled",
        "name": "Order Cancelled",
        "subject": "Your order {{ order_number }} has been cancelled",
        "html_body": (
            "<p>Hi {{ customer_name }},</p>"
            "<p>Your order <strong>{{ order_number }}</strong> has been "
            "cancelled.</p>"
            "<p>If you have any questions, please contact "
            "{{ support_email }}.</p>"
        ),
    },
    {
        "code": "abandoned_checkout",
        "name": "Abandoned Checkout",
        "subject": "You left something behind - {{ store_name }}",
        "html_body": (
            "<p>Hi {{ customer_name }},</p>"
            "<p>You left a cart worth {{ total_price }} {{ currency }} behind. "
            "<a href=\"{{ recovery_url }}\">Complete your order now</a>.</p>"
        ),
    },
    {
        "code": "discount_offer",
        "name": "Special Discount & Offer",
        "subject": "Exclusive {{ discount_code }} offer on {{ store_name }}",
        "html_body": (
            "<p>Hi {{ customer_name }},</p>"
            "<p>Use promo code <strong>{{ discount_code }}</strong> to get {{ discount_value }} off your next order!</p>"
            "<p><a href=\"{{ store_url }}\">Shop Now</a></p>"
            "<p>Thank you for shopping with {{ store_name }}.</p>"
        ),
    },
    {
        "code": "admin_notification",
        "name": "Admin / Staff Alert",
        "subject": "{{ store_name }} alert: {{ alert_title }}",
        "html_body": (
            "<p>Hello {{ admin_name | default('Store Admin') }},</p>"
            "<p>{{ message }}</p>"
            "<p>Event: <code>{{ event_type }}</code></p>"
        ),
    },
]

DEFAULT_RULES = [
    # Customer gets a confirmation email on order placement.
    {
        "event_type": "order_confirmation",
        "channel": "email",
        "recipient": "customer",
        "template_code": "order_confirmation",
    },
    {
        "event_type": "order_shipped",
        "channel": "email",
        "recipient": "customer",
        "template_code": "order_shipped",
    },
    {
        "event_type": "order_delivered",
        "channel": "email",
        "recipient": "customer",
        "template_code": "order_delivered",
    },
    # Staff are always alerted to cancellations and new admin events.
    {
        "event_type": "order_cancelled",
        "channel": "email",
        "recipient": "admin",
        "template_code": "order_cancelled",
    },
    {
        "event_type": "admin_notification",
        "channel": "email",
        "recipient": "admin",
        "template_code": "admin_notification",
    },
]


def _strip_html(html: str) -> str:
    return re.sub(r"\s+", " ", re.sub(r"<[^>]+>", "", html)).strip()


# =====================================================================
# SENDER CONFIG
# =====================================================================


async def get_sender_config(db: AsyncSession) -> SenderConfig:
    result = await db.execute(select(SenderConfig).where(SenderConfig.id == 1))
    config = result.scalar_one_or_none()
    if config is None:
        config = SenderConfig(id=1, **DEFAULT_SENDER)
        db.add(config)
        await db.commit()
        await db.refresh(config)
    return config


async def update_sender_config(data: SenderConfigUpdate, db: AsyncSession) -> SenderConfig:
    config = await get_sender_config(db)
    payload = data.model_dump(exclude_unset=True)

    if "smtp_password" in payload:
        password = payload.pop("smtp_password")
        if password:
            config.smtp_password = encrypt_credentials({"smtp_password": password})
        else:
            config.smtp_password = None

    for field, value in payload.items():
        setattr(config, field, value)

    await db.commit()
    await db.refresh(config)
    return config


def _decrypt_smtp_password(config: SenderConfig) -> str:
    credentials = decrypt_credentials(config.smtp_password)
    return credentials.get("smtp_password", "")


# =====================================================================
# SMTP SEND
# =====================================================================


async def _send_email(
    config: SenderConfig,
    to: str,
    subject: str,
    html_body: str,
) -> dict:
    """Send email via Resend or SMTP fallback. Returns provider info dict."""
    import os
    resend_key = os.getenv("RESEND_API_KEY")
    if resend_key:
        try:
            import resend
            resend.api_key = resend_key
            sender_email = config.from_email if "@" in config.from_email and not config.from_email.endswith("@gmail.com") else "onboarding@resend.dev"
            params = {
                "from": f"{config.from_name} <{sender_email}>",
                "to": [to],
                "subject": subject,
                "html": html_body,
            }
            result = resend.Emails.send(params)
            message_id = result.get("id") if isinstance(result, dict) else None
            return {"provider": "resend", "provider_message_id": message_id}
        except Exception as _rexc:
            print(f"[RESEND FALLBACK] Resend send failed, falling back to SMTP: {_rexc}")

    import aiosmtplib

    password = _decrypt_smtp_password(config)

    message = EmailMessage()
    message["From"] = f"{config.from_name} <{config.from_email}>"
    message["To"] = to
    message["Subject"] = subject
    message.set_content(_strip_html(html_body))
    message.add_alternative(html_body, subtype="html")

    await aiosmtplib.send(
        message,
        hostname=config.smtp_host,
        port=config.smtp_port,
        username=config.smtp_username,
        password=password,
        start_tls=config.use_tls,
        use_tls=config.use_ssl,
        timeout=30,
    )
    return {"provider": "smtp", "provider_message_id": None}


async def send_test_email(db: AsyncSession, to: str | None = None) -> TestEmailResponse:
    config = await get_sender_config(db)
    recipient = to or config.admin_email or config.from_email

    if not _decrypt_smtp_password(config):
        return TestEmailResponse(
            success=False,
            message="SMTP password is not configured. Save it in Settings -> Notifications.",
            recipient=recipient,
        )

    body = (
        "<p>This is a test email from Eligo Leather.</p>"
        "<p>Your SMTP settings are working correctly.</p>"
    )
    try:
        await _send_email(config, recipient, "Test email - Eligo Notifications", body)
    except Exception as exc:  # noqa: BLE001 - surface provider errors to the admin
        return TestEmailResponse(success=False, message=str(exc), recipient=recipient)

    return TestEmailResponse(
        success=True,
        message=f"Test email sent to {recipient} via {config.smtp_host}:{config.smtp_port}",
        recipient=recipient,
    )


# =====================================================================
# EMAIL TEMPLATES
# =====================================================================


async def list_templates(db: AsyncSession) -> list[EmailTemplate]:
    result = await db.execute(select(EmailTemplate).order_by(EmailTemplate.code))
    return list(result.scalars().all())


async def get_template(template_id: int, db: AsyncSession) -> EmailTemplate | None:
    return await db.get(EmailTemplate, template_id)


async def get_template_by_code(code: str, db: AsyncSession) -> EmailTemplate | None:
    result = await db.execute(select(EmailTemplate).where(EmailTemplate.code == code))
    return result.scalar_one_or_none()


async def create_template(data: EmailTemplateCreate, db: AsyncSession) -> EmailTemplate:
    if await get_template_by_code(data.code, db):
        raise ValueError(f"Template code '{data.code}' already exists")
    template = EmailTemplate(**data.model_dump())
    db.add(template)
    await db.commit()
    await db.refresh(template)
    return template


async def update_template(
    template_id: int, data: EmailTemplateUpdate, db: AsyncSession
) -> EmailTemplate | None:
    template = await get_template(template_id, db)
    if not template:
        return None
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(template, field, value)
    await db.commit()
    await db.refresh(template)
    return template


async def delete_template(template_id: int, db: AsyncSession) -> bool:
    template = await get_template(template_id, db)
    if not template:
        return False
    await db.delete(template)
    await db.commit()
    return True


# =====================================================================
# WEBHOOK ENDPOINTS
# =====================================================================


async def list_webhooks(db: AsyncSession) -> list[WebhookEndpoint]:
    result = await db.execute(select(WebhookEndpoint).order_by(WebhookEndpoint.name))
    return list(result.scalars().all())


async def get_webhook(webhook_id: int, db: AsyncSession) -> WebhookEndpoint | None:
    return await db.get(WebhookEndpoint, webhook_id)


async def create_webhook(data: WebhookEndpointCreate, db: AsyncSession) -> WebhookEndpoint:
    webhook = WebhookEndpoint(
        name=data.name,
        url=data.url,
        secret=encrypt_credentials({"secret": data.secret}) if data.secret else None,
        events=data.events,
        is_active=data.is_active,
    )
    db.add(webhook)
    await db.commit()
    await db.refresh(webhook)
    return webhook


async def update_webhook(
    webhook_id: int, data: WebhookEndpointUpdate, db: AsyncSession
) -> WebhookEndpoint | None:
    webhook = await get_webhook(webhook_id, db)
    if not webhook:
        return None
    payload = data.model_dump(exclude_unset=True)
    if "secret" in payload:
        secret = payload.pop("secret")
        webhook.secret = encrypt_credentials({"secret": secret}) if secret else None
    for field, value in payload.items():
        setattr(webhook, field, value)
    await db.commit()
    await db.refresh(webhook)
    return webhook


async def delete_webhook(webhook_id: int, db: AsyncSession) -> bool:
    webhook = await get_webhook(webhook_id, db)
    if not webhook:
        return False
    await db.delete(webhook)
    await db.commit()
    return True


def _signature(payload: bytes, secret: str | None) -> str:
    key = secret or ""
    return "sha256=" + hmac.new(key.encode(), payload, hashlib.sha256).hexdigest()


async def _post_webhook(webhook: WebhookEndpoint, event_type: str, payload: dict) -> None:
    body = {
        "event": event_type,
        "sent_at": datetime.now(timezone.utc).isoformat(),
        "data": payload,
    }
    raw = json.dumps(body).encode("utf-8")
    credentials = decrypt_credentials(webhook.secret)
    secret = credentials.get("secret", "")

    async with httpx.AsyncClient(timeout=15) as client:
        response = await client.post(
            webhook.url,
            content=raw,
            headers={
                "Content-Type": "application/json",
                "X-Eligo-Signature": _signature(raw, secret),
                "X-Eligo-Event": event_type,
            },
        )
        response.raise_for_status()


async def test_webhook(webhook_id: int, db: AsyncSession) -> WebhookTestResponse:
    webhook = await get_webhook(webhook_id, db)
    if not webhook:
        return WebhookTestResponse(success=False, error="Webhook not found")
    try:
        await _post_webhook(webhook, "test_event", {"ping": "ok"})
    except httpx.HTTPStatusError as exc:
        return WebhookTestResponse(
            success=False, status_code=exc.response.status_code, error=str(exc)
        )
    except Exception as exc:  # noqa: BLE001
        return WebhookTestResponse(success=False, error=str(exc))
    return WebhookTestResponse(success=True, status_code=200)


# =====================================================================
# DISPATCH RULES
# =====================================================================


async def list_rules(db: AsyncSession) -> list[DispatchRule]:
    result = await db.execute(
        select(DispatchRule).order_by(DispatchRule.event_type, DispatchRule.id)
    )
    return list(result.scalars().all())


async def get_rule(rule_id: int, db: AsyncSession) -> DispatchRule | None:
    return await db.get(DispatchRule, rule_id)


async def create_rule(data: DispatchRuleCreate, db: AsyncSession) -> DispatchRule:
    rule = DispatchRule(**data.model_dump())
    db.add(rule)
    await db.commit()
    await db.refresh(rule)
    return rule


async def update_rule(
    rule_id: int, data: DispatchRuleUpdate, db: AsyncSession
) -> DispatchRule | None:
    rule = await get_rule(rule_id, db)
    if not rule:
        return None
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(rule, field, value)
    await db.commit()
    await db.refresh(rule)
    return rule


async def delete_rule(rule_id: int, db: AsyncSession) -> bool:
    rule = await get_rule(rule_id, db)
    if not rule:
        return False
    await db.delete(rule)
    await db.commit()
    return True


# =====================================================================
# NOTIFICATION LOGS
# =====================================================================


async def list_logs(db: AsyncSession, skip: int = 0, limit: int = 50) -> list[NotificationLog]:
    result = await db.execute(
        select(NotificationLog)
        .order_by(NotificationLog.created_at.desc())
        .offset(skip)
        .limit(limit)
    )
    return list(result.scalars().all())


async def _log(
    db: AsyncSession,
    event_type: str,
    channel: NotificationChannel,
    recipient: str | None,
    subject: str | None,
    status: DispatchStatus,
    error: str | None = None,
    template_code: str | None = None,
    provider: str | None = None,
    provider_message_id: str | None = None,
    customer_id: int | None = None,
    order_id: int | None = None,
) -> None:
    db.add(
        NotificationLog(
            event_type=event_type,
            channel=channel,
            recipient=recipient,
            subject=subject,
            status=status,
            error=(error or "")[:2000] or None,
            template_code=template_code,
            provider=provider,
            provider_message_id=provider_message_id,
            customer_id=customer_id,
            order_id=order_id,
        )
    )


# =====================================================================
# DISPATCH ENGINE
# =====================================================================


def render_template(body: str, context: dict) -> str:
    from jinja2 import Template

    return Template(body).render(**context)


def _resolve_recipient(rule: DispatchRule, payload: dict, config: SenderConfig) -> str | None:
    if rule.recipient == "customer":
        return payload.get("email") or payload.get("customer_email")
    if rule.recipient == "admin":
        return config.admin_email
    return rule.recipient


async def is_notification_enabled(db: AsyncSession, notification_type: str) -> bool:
    """Check if a notification type is enabled. Defaults to True."""
    result = await db.execute(
        select(NotificationSetting).where(NotificationSetting.notification_type == notification_type)
    )
    setting = result.scalar_one_or_none()
    if setting is None:
        return True
    return setting.enabled


async def get_notification_settings(db: AsyncSession) -> list[NotificationSetting]:
    result = await db.execute(
        select(NotificationSetting).order_by(NotificationSetting.notification_type)
    )
    return list(result.scalars().all())


async def update_notification_setting(
    db: AsyncSession, notification_type: str, enabled: bool
) -> NotificationSetting:
    result = await db.execute(
        select(NotificationSetting).where(NotificationSetting.notification_type == notification_type)
    )
    setting = result.scalar_one_or_none()
    if setting is None:
        setting = NotificationSetting(notification_type=notification_type, enabled=enabled)
        db.add(setting)
    else:
        setting.enabled = enabled
    await db.commit()
    await db.refresh(setting)
    return setting


async def _dispatch_email(
    db: AsyncSession,
    event_type: str,
    rule: DispatchRule,
    payload: dict,
    customer_id: int | None = None,
    order_id: int | None = None,
) -> None:
    config = await get_sender_config(db)
    recipient = _resolve_recipient(rule, payload, config)
    if not recipient or not config.is_enabled:
        return

    template = None
    if rule.template_id:
        template = await get_template(rule.template_id, db)
    if template is None:
        template = await get_template_by_code(event_type, db)
    if template is None or not template.is_active:
        return

    context = {**payload, "store_name": config.from_name, "support_email": config.admin_email}
    subject = render_template(template.subject, context)
    html_body = render_template(template.html_body, context)

    try:
        send_result = await _send_email(config, recipient, subject, html_body)
        await _log(
            db, event_type, NotificationChannel.email, recipient, subject,
            DispatchStatus.success,
            template_code=template.code,
            provider=send_result.get("provider"),
            provider_message_id=send_result.get("provider_message_id"),
            customer_id=customer_id,
            order_id=order_id,
        )
    except Exception as exc:  # noqa: BLE001 - a failed dispatch must not break the request
        await _log(
            db,
            event_type,
            NotificationChannel.email,
            recipient,
            subject,
            DispatchStatus.failed,
            str(exc),
            template_code=template.code,
            customer_id=customer_id,
            order_id=order_id,
        )


async def _dispatch_webhook(
    db: AsyncSession,
    event_type: str,
    rule: DispatchRule,
    payload: dict,
) -> None:
    webhook = None
    if rule.webhook_id:
        webhook = await get_webhook(rule.webhook_id, db)
    if webhook is None or not webhook.is_active:
        return

    try:
        await _post_webhook(webhook, event_type, payload)
        await _log(db, event_type, NotificationChannel.webhook, webhook.url, None, DispatchStatus.success)
    except Exception as exc:  # noqa: BLE001
        await _log(
            db,
            event_type,
            NotificationChannel.webhook,
            webhook.url,
            None,
            DispatchStatus.failed,
            str(exc),
        )


async def dispatch_event(
    event_type: NotificationEventType | str,
    payload: dict,
    db: AsyncSession,
) -> DispatchResponse:
    """Fire an event: run every active dispatch rule for it (email + webhook).

    Never raises - dispatch failures are captured in notification_logs so a
    slow/broken SMTP or webhook can not break the calling request.
    """
    event = event_type.value if isinstance(event_type, NotificationEventType) else event_type
    if event not in {e.value for e in NotificationEventType}:
        return DispatchResponse(event_type=event, dispatched=0, failed=0)

    if not await is_notification_enabled(db, event):
        return DispatchResponse(event_type=event, dispatched=0, failed=0)

    customer_id = payload.get("customer_id")
    order_id = payload.get("order_id")

    result = await db.execute(
        select(DispatchRule).where(
            DispatchRule.event_type == event,
            DispatchRule.is_active == True,  # noqa: E712
        )
    )
    rules = list(result.scalars().all())

    dispatched = 0
    failed = 0
    for rule in rules:
        if rule.channel == NotificationChannel.email:
            await _dispatch_email(db, event, rule, payload, customer_id, order_id)
        elif rule.channel == NotificationChannel.webhook:
            await _dispatch_webhook(db, event, rule, payload)

        log = (
            await db.execute(
                select(NotificationLog)
                .where(NotificationLog.event_type == event)
                .order_by(NotificationLog.id.desc())
                .limit(1)
            )
        ).scalar_one_or_none()
        if log is not None and log.status == DispatchStatus.success:
            dispatched += 1
        else:
            failed += 1

    await db.commit()
    return DispatchResponse(
        event_type=event,
        dispatched=dispatched,
        failed=failed,
    )


async def background_dispatch_event(event_type: str, payload: dict) -> None:
    """Self-contained dispatcher for FastAPI BackgroundTasks.

    Opens its own DB session so it stays safe after the request session closes.
    """
    async with AsyncSessionLocal() as db:
        await dispatch_event(event_type, payload, db)


async def background_dispatch_order_confirmation(order_id: int) -> None:
    """Background task fired when a native order is created.

    Loads the order + customer in its own session, builds the notification
    payload and runs the `order_confirmation` dispatch rules (email to the
    customer by default). Failures are captured in notification_logs.
    """
    from app.modules.customers.model import Customer
    from app.modules.orders.model import Order

    async with AsyncSessionLocal() as db:
        result = await db.execute(
            select(Order)
            .options(selectinload(Order.items), selectinload(Order.customer))
            .where(Order.id == order_id)
        )
        order = result.scalar_one_or_none()
        if order is None:
            return

        customer: Customer | None = order.customer
        customer_name = "Valued Customer"
        if customer:
            customer_name = (
                customer.first_name or customer.last_name
            ) and " ".join(filter(None, [customer.first_name, customer.last_name])) or "Valued Customer"

        payload = {
            "email": customer.email if customer else None,
            "customer_email": customer.email if customer else None,
            "customer_name": customer_name,
            "order_number": order.order_number,
            "order_id": order.id,
            "currency": order.currency,
            "subtotal": str(order.subtotal),
            "shipping_cost": str(order.shipping_cost),
            "tax": str(order.tax),
            "total_price": str(order.total_price),
            "paid_amount": str(order.paid_amount),
            "payment_status": order.payment_status.value,
            "tracking_number": order.tracking_number,
            "tracking_company": order.tracking_company,
            "items": [
                {
                    "product_name": item.product_name,
                    "sku": item.sku,
                    "variant_title": item.variant_title,
                    "quantity": item.quantity,
                    "unit_price": str(item.unit_price),
                    "total_price": str(item.total_price),
                }
                for item in order.items
            ],
        }
        await dispatch_event("order_confirmation", payload, db)


# =====================================================================
# MANUAL EMAIL
# =====================================================================


async def send_manual_email(
    db: AsyncSession, data: ManualEmailRequest
) -> ManualEmailResponse:
    """Send a manual email to a customer (admin-initiated)."""
    from app.modules.customers.model import Customer

    customer = None
    recipient = data.recipient_email

    if data.customer_id:
        customer = await db.get(Customer, data.customer_id)
        if not customer:
            return ManualEmailResponse(success=False, message="Customer not found")
        if not customer.email:
            return ManualEmailResponse(
                success=False, message=f"Customer '{customer.first_name} {customer.last_name}' has no email address"
            )
        recipient = customer.email

    if not recipient:
        return ManualEmailResponse(success=False, message="No recipient email provided")

    config = await get_sender_config(db)
    if not config.is_enabled:
        return ManualEmailResponse(success=False, message="Email sending is disabled")

    template = await get_template_by_code(data.template_code, db)
    if not template or not template.is_active:
        return ManualEmailResponse(success=False, message=f"Template '{data.template_code}' not found or inactive")

    customer_name = "Valued Customer"
    if customer:
        parts = [customer.first_name or "", customer.last_name or ""]
        customer_name = " ".join(p for p in parts if p).strip() or "Valued Customer"

    context = {
        "store_name": config.from_name,
        "support_email": config.admin_email,
        "customer_name": customer_name,
        "customer_email": recipient,
        **data.context,
    }

    subject = render_template(data.subject or template.subject, context)
    html_body = render_template(template.html_body, context)

    try:
        send_result = await _send_email(config, recipient, subject, html_body)
        await _log(
            db, "manual_email", NotificationChannel.email, recipient, subject,
            DispatchStatus.success,
            template_code=template.code,
            provider=send_result.get("provider"),
            provider_message_id=send_result.get("provider_message_id"),
            customer_id=data.customer_id,
        )
        await db.commit()
        return ManualEmailResponse(success=True, message=f"Email sent to {recipient}", recipient=recipient)
    except Exception as exc:  # noqa: BLE001
        await _log(
            db, "manual_email", NotificationChannel.email, recipient, subject,
            DispatchStatus.failed, str(exc),
            template_code=template.code,
            customer_id=data.customer_id,
        )
        await db.commit()
        return ManualEmailResponse(success=False, message=f"Failed to send: {exc}", recipient=recipient)


# =====================================================================
# TEST EMAIL WITH TEMPLATE
# =====================================================================


async def send_test_with_template(
    db: AsyncSession, data: TestEmailWithTemplateRequest
) -> TestEmailResponse:
    """Send a test email using a specific template with sample/mock data."""
    config = await get_sender_config(db)
    if not config.is_enabled:
        return TestEmailResponse(success=False, message="Email sending is disabled", recipient=data.to)

    template = await get_template_by_code(data.template_code, db)
    if not template or not template.is_active:
        return TestEmailResponse(
            success=False,
            message=f"Template '{data.template_code}' not found or inactive",
            recipient=data.to,
        )

    context = {
        "store_name": config.from_name,
        "support_email": config.admin_email,
        "customer_name": "Test Customer",
        "customer_email": data.to,
        "order_number": "EL-TEST-0001",
        "total_price": "4,598",
        "currency": "PKR",
        "tracking_number": "TCS-847291039",
        "tracking_company": "Leopards Courier",
        "discount_code": "ELIGO15",
        "discount_value": "15% OFF",
        "store_url": "http://localhost:3000",
        "recovery_url": "http://localhost:3000/cart",
        "alert_title": "Test Alert",
        "message": "This is a test notification email.",
        "event_type": "test_event",
        "admin_name": "Store Admin",
        "items": [
            {"product_name": "Classic Leather Wallet", "quantity": 1, "total_price": "2,499"},
            {"product_name": "Leather Belt", "quantity": 1, "total_price": "2,099"},
        ],
        **data.context,
    }

    subject = render_template(template.subject, context)
    html_body = render_template(template.html_body, context)

    try:
        send_result = await _send_email(config, data.to, subject, html_body)
        return TestEmailResponse(
            success=True,
            message=f"Test email sent to {data.to} via {send_result.get('provider', 'resend')}",
            recipient=data.to,
        )
    except Exception as exc:  # noqa: BLE001
        return TestEmailResponse(success=False, message=str(exc), recipient=data.to)


# =====================================================================
# CUSTOMER SEARCH FOR MANUAL EMAIL
# =====================================================================


async def search_customers_for_email(
    db: AsyncSession, query: str, limit: int = 20
) -> list[CustomerSearchResult]:
    """Search customers by name or email for the manual email form."""
    from app.modules.customers.model import Customer

    stmt = select(Customer)
    if query:
        like_pattern = f"%{query}%"
        stmt = stmt.where(
            (Customer.first_name.ilike(like_pattern))
            | (Customer.last_name.ilike(like_pattern))
            | (Customer.email.ilike(like_pattern))
        )
    stmt = stmt.order_by(Customer.id.desc()).limit(limit)
    result = await db.execute(stmt)
    customers = list(result.scalars().all())

    return [
        CustomerSearchResult(
            id=c.id,
            name=" ".join(filter(None, [c.first_name, c.last_name])) or "Unknown",
            email=c.email,
            phone=c.phone,
        )
        for c in customers
    ]


# =====================================================================
# SEED
# =====================================================================


async def seed_defaults(db: AsyncSession) -> None:
    await get_sender_config(db)

    result = await db.execute(select(EmailTemplate.code))
    existing_codes = {row[0] for row in result.all()}
    for template in BUILT_IN_TEMPLATES:
        if template["code"] not in existing_codes:
            db.add(
                EmailTemplate(
                    **template,
                    is_active=True,
                    is_built_in=True,
                )
            )
    await db.commit()

    result = await db.execute(select(DispatchRule.id).limit(1))
    if result.scalar_one_or_none() is None:
        for rule in DEFAULT_RULES:
            template = await get_template_by_code(rule.pop("template_code"), db)
            db.add(
                DispatchRule(
                    event_type=rule["event_type"],
                    channel=rule["channel"],
                    recipient=rule["recipient"],
                    template_id=template.id if template else None,
                )
            )
        await db.commit()

    # Seed notification settings (one row per event type, defaults to enabled)
    result = await db.execute(select(NotificationSetting.notification_type))
    existing_types = {row[0] for row in result.all()}
    for event in NotificationEventType:
        if event.value not in existing_types:
            db.add(NotificationSetting(notification_type=event.value, enabled=True))
    await db.commit()
