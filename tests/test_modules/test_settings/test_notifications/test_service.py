"""Tests for app.modules.settings.notifications.service"""

from copy import deepcopy

import pytest
from sqlalchemy import select

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
