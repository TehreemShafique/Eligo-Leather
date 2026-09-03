"""Tests for app.modules.settings.notifications.service"""

from copy import deepcopy
from decimal import Decimal

import pytest
from sqlalchemy import select

from app.modules.customers.model import Customer
from app.modules.orders.model import (
    DeliveryMethod,
    DeliveryStatus,
    FulfillmentStatus,
    LabelStatus,
    Order,
    PaymentStatus,
    ReturnStatus,
)
from app.modules.settings.apps.crypto import decrypt_credentials
from app.modules.settings.notifications import service
from app.modules.settings.notifications.model import (
    DispatchStatus,
    EmailTemplate,
    NotificationChannel,
    NotificationEventType,
    NotificationLog,
    SenderConfig,
    WebhookEndpoint,
)
from app.modules.settings.notifications.schema import (
    DispatchRuleCreate,
    DispatchRuleUpdate,
    EmailTemplateCreate,
    EmailTemplateUpdate,
    SenderConfigUpdate,
    WebhookEndpointCreate,
    WebhookEndpointUpdate,
)

_PRISTINE_DEFAULT_RULES = deepcopy(service.DEFAULT_RULES)


@pytest.fixture(autouse=True)
def _pristine_default_rules():
    """seed_defaults mutates the module-level DEFAULT_RULES (rule.pop) so it
    works only once per process. Restore it before every test."""
    service.DEFAULT_RULES = deepcopy(_PRISTINE_DEFAULT_RULES)
    yield


# ---------------------------------------------------------------------------
# Sender config (singleton)
# ---------------------------------------------------------------------------

async def test_get_sender_config_creates_defaults(db_session):
    config = await service.get_sender_config(db_session)
    assert config.id == 1
    assert config.smtp_host == service.DEFAULT_SENDER["smtp_host"]
    assert config.smtp_port == 587
    assert config.from_name == service.DEFAULT_SENDER["from_name"]
    assert config.admin_email == service.DEFAULT_SENDER["admin_email"]
    assert config.is_enabled is True
    assert config.has_password is False


async def test_get_sender_config_is_singleton(db_session):
    first = await service.get_sender_config(db_session)
    second = await service.get_sender_config(db_session)
    assert first.id == second.id == 1
    rows = (await db_session.execute(select(SenderConfig))).scalars().all()
    assert len(rows) == 1


async def test_update_sender_config_fields(db_session):
    config = await service.update_sender_config(
        SenderConfigUpdate(from_name="Eligo HQ", is_enabled=False), db_session,
    )
    assert config.id == 1
    assert config.from_name == "Eligo HQ"
    assert config.is_enabled is False


async def test_update_sender_config_encrypts_password(db_session):
    config = await service.update_sender_config(
        SenderConfigUpdate(smtp_password="app-password"), db_session,
    )
    assert config.has_password is True
    assert decrypt_credentials(config.smtp_password)["smtp_password"] == "app-password"


async def test_update_sender_config_clears_password_with_blank(db_session):
    await service.update_sender_config(SenderConfigUpdate(smtp_password="app-password"), db_session)
    config = await service.update_sender_config(SenderConfigUpdate(smtp_password=""), db_session)
    assert config.smtp_password is None
    assert config.has_password is False


async def test_update_sender_config_rejects_tls_and_ssl_together(db_session):
    with pytest.raises(ValueError):
        SenderConfigUpdate(use_tls=True, use_ssl=True)


async def test_send_test_email_without_password_fails_gracefully(db_session):
    result = await service.send_test_email(db_session)
    assert result.success is False
    assert "password" in result.message.lower()
    assert result.recipient == service.DEFAULT_SENDER["admin_email"]


# ---------------------------------------------------------------------------
# Email templates
# ---------------------------------------------------------------------------

async def test_create_and_get_template(db_session):
    template = await service.create_template(
        EmailTemplateCreate(
            code="welcome_email", name="Welcome", subject="Hello {{ name }}", html_body="<p>Hi</p>",
        ),
        db_session,
    )
    assert template.id is not None
    assert template.code == "welcome_email"
    assert template.is_active is True
    assert template.is_built_in is False

    fetched = await service.get_template(template.id, db_session)
    assert fetched is not None
    assert fetched.name == "Welcome"


async def test_get_template_missing_returns_none(db_session):
    assert await service.get_template(99999, db_session) is None


async def test_get_template_by_code(db_session):
    template = await service.create_template(
        EmailTemplateCreate(code="welcome_email", name="Welcome", subject="S", html_body="<p>Hi</p>"), db_session,
    )
    found = await service.get_template_by_code("welcome_email", db_session)
    assert found is not None
    assert found.id == template.id
    assert await service.get_template_by_code("nope", db_session) is None


async def test_list_templates_ordered_by_code(db_session):
    await service.create_template(EmailTemplateCreate(code="beta", name="B", subject="S", html_body="<p>x</p>"), db_session)
    await service.create_template(EmailTemplateCreate(code="alpha", name="A", subject="S", html_body="<p>x</p>"), db_session)
    templates = await service.list_templates(db_session)
    assert [t.code for t in templates] == ["alpha", "beta"]


async def test_create_template_duplicate_code_raises(db_session):
    await service.create_template(
        EmailTemplateCreate(code="dup", name="D", subject="S", html_body="<p>x</p>"), db_session,
    )
    with pytest.raises(ValueError, match="already exists"):
        await service.create_template(
            EmailTemplateCreate(code="dup", name="D2", subject="S", html_body="<p>x</p>"), db_session,
        )


async def test_update_template(db_session):
    template = await service.create_template(
        EmailTemplateCreate(code="t", name="T", subject="S", html_body="<p>x</p>"), db_session,
    )
    updated = await service.update_template(template.id, EmailTemplateUpdate(name="T2", is_active=False), db_session)
    assert updated is not None
    assert updated.name == "T2"
    assert updated.is_active is False


async def test_update_template_missing_returns_none(db_session):
    assert await service.update_template(99999, EmailTemplateUpdate(name="x"), db_session) is None


async def test_delete_template(db_session):
    template = await service.create_template(
        EmailTemplateCreate(code="t", name="T", subject="S", html_body="<p>x</p>"), db_session,
    )
    assert await service.delete_template(template.id, db_session) is True
    assert await service.get_template(template.id, db_session) is None
    assert await service.delete_template(template.id, db_session) is False


# ---------------------------------------------------------------------------
# Webhook endpoints
# ---------------------------------------------------------------------------

async def test_create_and_get_webhook(db_session):
    webhook = await service.create_webhook(
        WebhookEndpointCreate(
            name="Order webhook", url="https://example.com/hook", secret="shh", events=["order_shipped"],
        ),
        db_session,
    )
    assert webhook.id is not None
    assert webhook.url == "https://example.com/hook"
    assert webhook.events == ["order_shipped"]
    assert webhook.is_active is True
    assert webhook.has_secret is True
    assert decrypt_credentials(webhook.secret)["secret"] == "shh"

    fetched = await service.get_webhook(webhook.id, db_session)
    assert fetched is not None
    assert fetched.name == "Order webhook"


async def test_get_webhook_missing_returns_none(db_session):
    assert await service.get_webhook(99999, db_session) is None


async def test_list_webhooks_ordered_by_name(db_session):
    await service.create_webhook(WebhookEndpointCreate(name="A", url="https://a.example.com"), db_session)
    await service.create_webhook(WebhookEndpointCreate(name="B", url="https://b.example.com"), db_session)
    webhooks = await service.list_webhooks(db_session)
    assert [w.name for w in webhooks] == ["A", "B"]


async def test_update_webhook(db_session):
    webhook = await service.create_webhook(
        WebhookEndpointCreate(name="A", url="https://a.example.com", secret="shh"), db_session,
    )
    updated = await service.update_webhook(
        webhook.id, WebhookEndpointUpdate(url="https://b.example.com", secret=""), db_session,
    )
    assert updated is not None
    assert updated.url == "https://b.example.com"
    assert updated.has_secret is False


async def test_update_webhook_missing_returns_none(db_session):
    assert await service.update_webhook(99999, WebhookEndpointUpdate(name="x"), db_session) is None


async def test_delete_webhook(db_session):
    webhook = await service.create_webhook(
        WebhookEndpointCreate(name="A", url="https://a.example.com"), db_session,
    )
    assert await service.delete_webhook(webhook.id, db_session) is True
    assert await service.get_webhook(webhook.id, db_session) is None
    assert await service.delete_webhook(webhook.id, db_session) is False


async def test_webhook_missing_returns_error_response(db_session):
    result = await service.test_webhook(99999, db_session)
    assert result.success is False
    assert result.error == "Webhook not found"


# ---------------------------------------------------------------------------
# Dispatch rules
# ---------------------------------------------------------------------------

async def test_create_and_get_rule(db_session):
    rule = await service.create_rule(
        DispatchRuleCreate(
            event_type=NotificationEventType.order_shipped,
            channel=NotificationChannel.email,
            recipient="customer",
        ),
        db_session,
    )
    assert rule.id is not None
    assert rule.event_type == NotificationEventType.order_shipped
    assert rule.channel == NotificationChannel.email
    assert rule.recipient == "customer"
    assert rule.is_active is True

    fetched = await service.get_rule(rule.id, db_session)
    assert fetched is not None
    assert fetched.id == rule.id


async def test_get_rule_missing_returns_none(db_session):
    assert await service.get_rule(99999, db_session) is None


async def test_list_rules_orders_by_event_type(db_session):
    await service.create_rule(
        DispatchRuleCreate(event_type=NotificationEventType.admin_notification, channel=NotificationChannel.email), db_session,
    )
    await service.create_rule(
        DispatchRuleCreate(event_type=NotificationEventType.order_confirmation, channel=NotificationChannel.email), db_session,
    )
    rules = await service.list_rules(db_session)
    assert [r.event_type for r in rules] == [
        NotificationEventType.admin_notification,
        NotificationEventType.order_confirmation,
    ]


async def test_update_rule(db_session):
    rule = await service.create_rule(
        DispatchRuleCreate(event_type=NotificationEventType.order_confirmation, channel=NotificationChannel.email), db_session,
    )
    updated = await service.update_rule(
        rule.id, DispatchRuleUpdate(recipient="admin@example.com", is_active=False), db_session,
    )
    assert updated is not None
    assert updated.recipient == "admin@example.com"
    assert updated.is_active is False


async def test_update_rule_missing_returns_none(db_session):
    assert await service.update_rule(99999, DispatchRuleUpdate(recipient="x"), db_session) is None


async def test_delete_rule(db_session):
    rule = await service.create_rule(
        DispatchRuleCreate(event_type=NotificationEventType.order_confirmation, channel=NotificationChannel.email), db_session,
    )
    assert await service.delete_rule(rule.id, db_session) is True
    assert await service.get_rule(rule.id, db_session) is None
    assert await service.delete_rule(rule.id, db_session) is False


# ---------------------------------------------------------------------------
# Notification logs
# ---------------------------------------------------------------------------

async def test_list_logs_empty(db_session):
    assert await service.list_logs(db_session) == []


async def test_list_logs_paginates(db_session):
    for i in range(3):
        db_session.add(
            NotificationLog(
                event_type="order_confirmation",
                channel=NotificationChannel.email,
                recipient=f"u{i}@example.com",
                subject="S",
                status=DispatchStatus.success,
            )
        )
    await db_session.commit()

    assert len(await service.list_logs(db_session)) == 3
    assert len(await service.list_logs(db_session, skip=1)) == 2
    assert len(await service.list_logs(db_session, skip=1, limit=1)) == 1


# ---------------------------------------------------------------------------
# Dispatch engine
# ---------------------------------------------------------------------------

async def test_dispatch_unknown_event_returns_zero(db_session):
    result = await service.dispatch_event("not_an_event", {}, db_session)
    assert result.dispatched == 0
    assert result.failed == 0


async def test_dispatch_no_matching_rules_returns_zero(db_session):
    result = await service.dispatch_event(NotificationEventType.order_shipped, {"email": "c@example.com"}, db_session)
    assert result.dispatched == 0
    assert result.failed == 0


async def test_dispatch_runs_only_active_rules(db_session):
    await service.update_sender_config(SenderConfigUpdate(is_enabled=False), db_session)
    template = await service.create_template(
        EmailTemplateCreate(code="order_shipped", name="S", subject="S", html_body="<p>x</p>"), db_session,
    )
    await service.create_rule(
        DispatchRuleCreate(
            event_type=NotificationEventType.order_shipped,
            channel=NotificationChannel.email,
            recipient="admin",
            template_id=template.id,
        ),
        db_session,
    )
    await service.create_rule(
        DispatchRuleCreate(
            event_type=NotificationEventType.order_shipped,
            channel=NotificationChannel.email,
            recipient="admin",
            is_active=False,
        ),
        db_session,
    )

    result = await service.dispatch_event(NotificationEventType.order_shipped, {"email": "c@example.com"}, db_session)
    assert result.dispatched == 0
    assert result.failed == 1


async def test_dispatch_webhook_rule_with_missing_webhook_counts_failed(db_session):
    await service.create_rule(
        DispatchRuleCreate(
            event_type=NotificationEventType.order_shipped,
            channel=NotificationChannel.webhook,
            recipient="",
            webhook_id=99999,
        ),
        db_session,
    )
    result = await service.dispatch_event(NotificationEventType.order_shipped, {}, db_session)
    assert result.dispatched == 0
    assert result.failed == 1


# ---------------------------------------------------------------------------
# Seed
# ---------------------------------------------------------------------------

async def test_seed_defaults_creates_builtin_data(db_session):
    await service.seed_defaults(db_session)

    sender = await service.get_sender_config(db_session)
    assert sender.id == 1

    templates = await service.list_templates(db_session)
    assert len(templates) == len(service.BUILT_IN_TEMPLATES)
    assert all(t.is_built_in for t in templates)

    rules = await service.list_rules(db_session)
    assert len(rules) == len(service.DEFAULT_RULES)


async def test_seed_defaults_is_idempotent(db_session):
    await service.seed_defaults(db_session)
    await service.seed_defaults(db_session)

    assert len(await service.list_templates(db_session)) == len(service.BUILT_IN_TEMPLATES)
    assert len(await service.list_rules(db_session)) == len(service.DEFAULT_RULES)
    rows = (await db_session.execute(select(SenderConfig))).scalars().all()
    assert len(rows) == 1


async def test_order_placed_is_valid_event():
    assert NotificationEventType.order_placed.value == "order_placed"
    assert "order_placed" in {e.value for e in NotificationEventType}


async def test_seed_adds_missing_default_rule_individually(db_session):
    """A DB that already has some dispatch rules must still receive a missing
    default rule (e.g. the new order_placed rule) without duplicating rules."""
    await service.seed_defaults(db_session)

    # Simulate a database provisioned before order_placed existed: seed once,
    # then delete every default rule (as if none had been created yet), then
    # seed again and verify all defaults are back exactly once.
    for r in await service.list_rules(db_session):
        await db_session.delete(r)
    await db_session.commit()
    assert len(await service.list_rules(db_session)) == 0

    await service.seed_defaults(db_session)

    rules = await service.list_rules(db_session)
    assert len(rules) == len(service.DEFAULT_RULES)
    event_types = [r.event_type.value for r in rules]
    assert event_types.count("order_placed") == 1
    assert event_types.count("order_confirmation") == 1


async def test_seed_leaves_existing_customized_rules_alone(db_session):
    """Seeding must never overwrite or duplicate a rule an admin customized
    (same event/channel/recipient but a different template)."""
    await service.seed_defaults(db_session)

    # Point the existing order_confirmation customer rule at a custom template.
    from app.modules.settings.notifications.model import DispatchRule

    custom = EmailTemplate(
        code="custom_confirmation",
        name="Custom",
        subject="Custom subject",
        html_body="<p>custom</p>",
    )
    db_session.add(custom)
    await db_session.commit()

    result = await db_session.execute(
        select(DispatchRule).where(
            DispatchRule.event_type == "order_confirmation",
            DispatchRule.recipient == "customer",
        )
    )
    existing_rule = result.scalar_one()
    existing_rule.template_id = custom.id
    await db_session.commit()

    await service.seed_defaults(db_session)

    result = await db_session.execute(
        select(DispatchRule).where(
            DispatchRule.event_type == "order_confirmation",
            DispatchRule.recipient == "customer",
        )
    )
    rules = result.scalars().all()
    assert len(rules) == 1
    assert rules[0].template_id == custom.id
    total = len(await service.list_rules(db_session))
    assert total == len(service.DEFAULT_RULES)


# ---------------------------------------------------------------------------
# Order-confirmation template upgrade (phone-confirmation wording)
# ---------------------------------------------------------------------------


def _confirmation_default():
    return next(
        (t for t in service.BUILT_IN_TEMPLATES if t["code"] == "order_confirmation"), None
    )


async def test_upgrade_converts_exact_old_builtin_to_new_default(db_session):
    """An untouched built-in default (exact old fingerprint) is upgraded."""
    old_default = _confirmation_default()
    assert old_default is not None
    # Reproduce the historical pre-workflow default so we can verify upgrade.
    from app.modules.settings.notifications.model import EmailTemplate

    template = EmailTemplate(
        code="order_confirmation",
        name="Order Confirmation",
        subject=service.OLD_ORDER_CONFIRMATION_SUBJECT,
        html_body=service.OLD_ORDER_CONFIRMATION_BODY,
        is_built_in=True,
    )
    db_session.add(template)
    await db_session.commit()

    upgraded = await service._upgrade_default_order_confirmation_template(db_session)
    assert upgraded is True

    await db_session.refresh(template)
    assert template.subject == old_default["subject"]
    assert template.html_body == old_default["html_body"]
    assert service.OLD_ORDER_CONFIRMATION_BODY not in template.html_body


async def test_upgrade_leaves_customized_template_untouched(db_session):
    """An admin-customized order_confirmation template is never overwritten."""
    custom_subject = "Custom Order #{{ order_number }}"
    custom_body = "<p>My own confirmation copy {{ order_number }}</p>"
    from app.modules.settings.notifications.model import EmailTemplate

    template = EmailTemplate(
        code="order_confirmation",
        name="My Custom",
        subject=custom_subject,
        html_body=custom_body,
        is_built_in=False,
    )
    db_session.add(template)
    await db_session.commit()

    upgraded = await service._upgrade_default_order_confirmation_template(db_session)
    assert upgraded is False

    await db_session.refresh(template)
    assert template.subject == custom_subject
    assert template.html_body == custom_body


async def test_upgrade_is_idempotent_on_already_new_template(db_session):
    """An already-upgraded (new default) template is left untouched and the
    function reports no upgrade happened."""
    new_default = _confirmation_default()
    from app.modules.settings.notifications.model import EmailTemplate

    template = EmailTemplate(
        code="order_confirmation",
        name=new_default["name"],
        subject=new_default["subject"],
        html_body=new_default["html_body"],
        is_built_in=True,
    )
    db_session.add(template)
    await db_session.commit()

    upgraded = await service._upgrade_default_order_confirmation_template(db_session)
    assert upgraded is False

    await db_session.refresh(template)
    assert template.subject == new_default["subject"]
    assert template.html_body == new_default["html_body"]


async def test_upgrade_missing_template_is_noop(db_session):
    """No order_confirmation row => no upgrade, no crash."""
    upgraded = await service._upgrade_default_order_confirmation_template(db_session)
    assert upgraded is False


# ---------------------------------------------------------------------------
# Email dispatch outcome markers (sent / failed / unavailable / skipped)
# ---------------------------------------------------------------------------


async def _email_rule(db_session, event="order_confirmation", template=None):
    return await service.create_rule(
        DispatchRuleCreate(
            event_type=NotificationEventType(event),
            channel=NotificationChannel.email,
            recipient="customer",
            template_id=template.id if template else None,
        ),
        db_session,
    )


async def test_dispatch_email_unavailable_when_no_recipient(db_session):
    """No customer email => unavailable, not a failure."""
    await service.get_sender_config(db_session)
    rule = await _email_rule(db_session)
    outcome = await service._dispatch_email(
        db_session, "order_confirmation", rule, {"email": None, "customer_email": ""}
    )
    assert outcome == "unavailable"


async def test_dispatch_email_skipped_when_sender_disabled(db_session):
    await service.update_sender_config(SenderConfigUpdate(is_enabled=False), db_session)
    rule = await _email_rule(db_session)
    outcome = await service._dispatch_email(
        db_session, "order_confirmation", rule, {"email": "c@example.com"}
    )
    assert outcome == "skipped"


async def test_dispatch_email_skipped_when_template_missing(db_session):
    await service.get_sender_config(db_session)
    # Rule without a template and no template by that code exists.
    rule = await _email_rule(db_session, template=None)
    outcome = await service._dispatch_email(
        db_session, "order_confirmation", rule, {"email": "c@example.com"}
    )
    assert outcome == "skipped"


async def test_dispatch_email_failed_on_smtp_error(db_session, monkeypatch):
    await service.get_sender_config(db_session)
    template = await service.create_template(
        EmailTemplateCreate(
            code="order_confirmation", name="C", subject="Sub", html_body="<p>x</p>"
        ),
        db_session,
    )
    rule = await _email_rule(db_session, template=template)

    async def _boom(config, to, subject, html_body):
        raise RuntimeError("SMTP down")

    monkeypatch.setattr(service, "_send_email", _boom)
    outcome = await service._dispatch_email(
        db_session, "order_confirmation", rule, {"email": "c@example.com"}
    )
    assert outcome == "failed"

    logs = await service.list_logs(db_session)
    assert len(logs) == 1
    assert logs[0].status == DispatchStatus.failed


async def test_dispatch_email_sent_on_success(db_session, monkeypatch):
    await service.get_sender_config(db_session)
    template = await service.create_template(
        EmailTemplateCreate(
            code="order_confirmation", name="C", subject="Sub", html_body="<p>x</p>"
        ),
        db_session,
    )
    rule = await _email_rule(db_session, template=template)

    async def _ok(config, to, subject, html_body):
        return {"provider": "smtp", "provider_message_id": None}

    monkeypatch.setattr(service, "_send_email", _ok)
    outcome = await service._dispatch_email(
        db_session, "order_confirmation", rule, {"email": "c@example.com"}
    )
    assert outcome == "sent"

    logs = await service.list_logs(db_session)
    assert len(logs) == 1
    assert logs[0].status == DispatchStatus.success


# ---------------------------------------------------------------------------
# Manual confirmation dispatcher: explicit customer-rule selection
# ---------------------------------------------------------------------------


async def _seed_customer_with_order(
    db_session,
    *,
    email="c@example.com",
    first_name="Ali",
    last_name="Raza",
    shipping_name=None,
    shipping_email="__snapshot__",
):
    if shipping_email == "__snapshot__":
        shipping_email = email
    customer = Customer(
        first_name=first_name,
        last_name=last_name,
        email=email,
        phone="03001234567",
        email_subscription=True,
        sms_subscription=True,
        whatsapp_subscription=False,
        total_orders=0,
        amount_spent=Decimal("0"),
        tax_exempt=False,
        deletable=False,
        mergeable=False,
    )
    db_session.add(customer)
    await db_session.flush()
    order = Order(
        order_number="CN-9001",
        customer_id=customer.id,
        channel="Online Store",
        currency="PKR",
        shipping_name=shipping_name,
        shipping_email=shipping_email,
        subtotal=Decimal("2500.00"),
        shipping_cost=Decimal("250.00"),
        tax=Decimal("0.00"),
        total_price=Decimal("2750.00"),
        discount=Decimal("0.00"),
        paid_amount=Decimal("0.00"),
        payment_status=PaymentStatus.pending,
        fulfillment_status=FulfillmentStatus.unfulfilled,
        delivery_status=DeliveryStatus.pending,
        delivery_method=DeliveryMethod.standard,
        return_status=ReturnStatus.none,
        label_status=LabelStatus.not_generated,
    )
    db_session.add(order)
    await db_session.commit()
    return customer, order


async def _confirmation_template(db_session):
    return await service.create_template(
        EmailTemplateCreate(
            code="order_confirmation", name="C", subject="Sub", html_body="<p>x</p>"
        ),
        db_session,
    )


async def _confirmation_rule(db_session, *, recipient="customer", active=True, template=None):
    rule = await service.create_rule(
        DispatchRuleCreate(
            event_type=NotificationEventType.order_confirmation,
            channel=NotificationChannel.email,
            recipient=recipient,
            template_id=template.id if template else None,
        ),
        db_session,
    )
    if not active:
        rule.is_active = False
        await db_session.commit()
    return rule


async def test_confirmation_rule_selection_uses_customer_rule(db_session, monkeypatch):
    """A customer rule is used and the email goes to the customer."""
    await service.get_sender_config(db_session)
    await _confirmation_template(db_session)
    customer, order = await _seed_customer_with_order(db_session)
    await _confirmation_rule(db_session, recipient="customer")

    sent_to = []

    async def _record(config, to, subject, html_body):
        sent_to.append(to)
        return {"provider": "smtp", "provider_message_id": None}

    monkeypatch.setattr(service, "_send_email", _record)
    outcome = await service.dispatch_order_confirmation_email(db_session, order.id)
    assert outcome == "sent"
    assert sent_to == [customer.email]

    logs = await service.list_logs(db_session)
    assert len(logs) == 1
    assert logs[0].recipient == customer.email


async def test_confirmation_rule_selection_prefers_customer_over_admin(db_session, monkeypatch):
    """When customer + admin rules exist, the customer rule wins; the admin
    rule (which would also resolve) is explicitly never touched."""
    await service.get_sender_config(db_session)
    template = await _confirmation_template(db_session)
    customer, order = await _seed_customer_with_order(db_session)
    await _confirmation_rule(db_session, recipient="customer", template=template)
    await _confirmation_rule(db_session, recipient="admin", template=template)

    sent_to = []

    async def _record(config, to, subject, html_body):
        sent_to.append(to)
        return {"provider": "smtp", "provider_message_id": None}

    monkeypatch.setattr(service, "_send_email", _record)
    outcome = await service.dispatch_order_confirmation_email(db_session, order.id)
    assert outcome == "sent"
    assert sent_to == [customer.email]

    logs = await service.list_logs(db_session)
    assert len(logs) == 1
    assert logs[0].recipient == customer.email


async def test_confirmation_rule_selection_skips_when_only_admin_and_literal_rules(db_session):
    """Only admin/literal rules exist -> skipped, no email sent, no log."""
    await service.get_sender_config(db_session)
    template = await _confirmation_template(db_session)
    _, order = await _seed_customer_with_order(db_session)
    await _confirmation_rule(db_session, recipient="admin", template=template)
    await _confirmation_rule(db_session, recipient="internal@example.com", template=template)

    outcome = await service.dispatch_order_confirmation_email(db_session, order.id)
    assert outcome == "skipped"
    assert await service.list_logs(db_session) == []


async def test_confirmation_rule_selection_unavailable_without_customer_email(db_session, monkeypatch):
    """Customer has no email -> unavailable, and no unrelated rule runs."""
    await service.get_sender_config(db_session)
    template = await _confirmation_template(db_session)
    _, order = await _seed_customer_with_order(db_session, email=None)
    await _confirmation_rule(db_session, recipient="customer", template=template)
    await _confirmation_rule(db_session, recipient="admin", template=template)

    called = []

    async def _record(config, to, subject, html_body):
        called.append(to)
        raise AssertionError("no email may be attempted without a customer email")

    monkeypatch.setattr(service, "_send_email", _record)
    outcome = await service.dispatch_order_confirmation_email(db_session, order.id)
    assert outcome == "unavailable"
    assert called == []
    assert await service.list_logs(db_session) == []


async def test_confirmation_rule_selection_skips_inactive_customer_rule(db_session):
    """An inactive customer rule -> skipped, nothing sent or logged."""
    await service.get_sender_config(db_session)
    template = await _confirmation_template(db_session)
    _, order = await _seed_customer_with_order(db_session)
    await _confirmation_rule(db_session, recipient="customer", active=False, template=template)

    outcome = await service.dispatch_order_confirmation_email(db_session, order.id)
    assert outcome == "skipped"
    assert await service.list_logs(db_session) == []


# ---------------------------------------------------------------------------
# Checkout name snapshot takes precedence over the shared customer profile
# ---------------------------------------------------------------------------

async def test_notification_payload_prefers_order_shipping_name():
    """The notification payload uses the order's checkout ``shipping_name``
    (e.g. a gift recipient) rather than the shared customer profile name."""
    customer = Customer(
        first_name="John",
        last_name="Doe",
        email="john@example.com",
    )
    order = Order(
        order_number="CN-9002",
        customer=customer,
        channel="Online Store",
        currency="PKR",
        shipping_name="Jane Smith",
        subtotal=Decimal("2500.00"),
        shipping_cost=Decimal("250.00"),
        tax=Decimal("0.00"),
        total_price=Decimal("2750.00"),
        discount=Decimal("0.00"),
        paid_amount=Decimal("0.00"),
        payment_status=PaymentStatus.pending,
        fulfillment_status=FulfillmentStatus.unfulfilled,
        delivery_status=DeliveryStatus.pending,
        delivery_method=DeliveryMethod.standard,
        return_status=ReturnStatus.none,
        label_status=LabelStatus.not_generated,
    )
    customer_name = service._customer_display_name(order, customer)
    assert customer_name == "Jane Smith"

    payload = service._build_order_notification_payload(order, customer_name)
    assert payload["customer_name"] == "Jane Smith"


async def test_notification_payload_falls_back_to_profile_name():
    """Without a checkout ``shipping_name``, the shared profile name is used."""
    order = Order(
        order_number="CN-9003",
        customer=None,
        channel="Online Store",
        currency="PKR",
        shipping_name=None,
        subtotal=Decimal("2500.00"),
        shipping_cost=Decimal("250.00"),
        tax=Decimal("0.00"),
        total_price=Decimal("2750.00"),
        discount=Decimal("0.00"),
        paid_amount=Decimal("0.00"),
        payment_status=PaymentStatus.pending,
        fulfillment_status=FulfillmentStatus.unfulfilled,
        delivery_status=DeliveryStatus.pending,
        delivery_method=DeliveryMethod.standard,
        return_status=ReturnStatus.none,
        label_status=LabelStatus.not_generated,
    )
    customer = Customer(
        first_name="John",
        last_name="Doe",
        email="john@example.com",
    )
    assert service._customer_display_name(order, customer) == "John Doe"


async def test_order_confirmation_email_greets_checkout_name(db_session, monkeypatch):
    """End-to-end: confirmation email payload greets the checkout name even
    when the shared customer profile carries a different name."""
    await service.get_sender_config(db_session)
    await service.create_template(
        EmailTemplateCreate(
            code="order_confirmation",
            name="C",
            subject="Hello {{ customer_name }}",
            html_body="<p>Hi {{ customer_name }}, thanks for your order.</p>",
        ),
        db_session,
    )
    customer, order = await _seed_customer_with_order(
        db_session,
        first_name="John",
        last_name="Doe",
        shipping_name="Jane Smith",
    )
    await _confirmation_rule(db_session, recipient="customer")

    rendered = {}

    async def _record(config, to, subject, html_body):
        rendered["subject"] = subject
        rendered["html_body"] = html_body
        return {"provider": "smtp", "provider_message_id": None}

    monkeypatch.setattr(service, "_send_email", _record)
    outcome = await service.dispatch_order_confirmation_email(db_session, order.id)
    assert outcome == "sent"
    assert "Jane Smith" in rendered["subject"]
    assert "John Doe" not in rendered["subject"]
    assert "Jane Smith" in rendered["html_body"]
    assert "John Doe" not in rendered["html_body"]


# ---------------------------------------------------------------------------
# Order email snapshot survives a later Customer.email edit
# ---------------------------------------------------------------------------

async def test_customer_email_prefers_order_shipping_email_snapshot(db_session):
    """Changing the linked Customer profile email must NOT change
    `order.customer_email` when the order carries a checkout snapshot."""
    customer, order = await _seed_customer_with_order(
        db_session, email="original@example.com", shipping_email="checkout@example.com"
    )
    assert order.shipping_email == "checkout@example.com"
    assert order.customer_email == "checkout@example.com"

    customer.email = "changed@example.com"
    await db_session.commit()

    result = await db_session.execute(
        select(Order).where(Order.id == order.id)
    )
    order = result.scalar_one()
    assert order.customer_email == "checkout@example.com"


async def test_order_confirmation_email_uses_snapshot_after_customer_email_edit(
    db_session, monkeypatch
):
    """The confirmation dispatch still sends to the checkout snapshot address
    even after the shared customer profile email is edited."""
    await service.get_sender_config(db_session)
    template = await service.create_template(
        EmailTemplateCreate(
            code="order_confirmation",
            name="C",
            subject="Sub",
            html_body="<p>Hi {{ customer_name }}</p>",
        ),
        db_session,
    )
    customer, order = await _seed_customer_with_order(
        db_session, email="original@example.com", shipping_email="checkout@example.com"
    )
    await _confirmation_rule(db_session, recipient="customer", template=template)

    # Admin edits the customer profile email after the order was placed.
    customer.email = "changed@example.com"
    await db_session.commit()

    sent_to = []
    rendered = {}

    async def _record(config, to, subject, html_body):
        sent_to.append(to)
        rendered.update(subject=subject, html_body=html_body)
        return {"provider": "smtp", "provider_message_id": None}

    monkeypatch.setattr(service, "_send_email", _record)
    outcome = await service.dispatch_order_confirmation_email(db_session, order.id)
    assert outcome == "sent"
    assert sent_to == ["checkout@example.com"]
    assert "changed@example.com" not in sent_to

    logs = await service.list_logs(db_session)
    assert logs[-1].recipient == "checkout@example.com"
