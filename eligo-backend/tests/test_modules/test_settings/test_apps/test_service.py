"""
Tests for app.modules.settings.apps.service
"""

import pytest
from sqlalchemy import func, select

from app.modules.settings.apps import service, adapters
from app.modules.settings.apps.model import AppStatus, StoreIntegration
from app.modules.settings.apps.schema import AppInstall, AppUpdate


# ---------------------------------------------------------------------------
# App registry
# ---------------------------------------------------------------------------

async def test_get_definition_known_and_unknown():
    definition = service.get_definition("resend_email")
    assert definition is not None
    assert definition["code"] == "resend_email"
    assert definition["category"] == "email"
    assert "send_email" in definition["actions"]
    assert service.get_definition("no_such_app") is None


async def test_app_definitions_registry_is_valid():
    codes = [definition["code"] for definition in service.APP_DEFINITIONS]
    assert len(codes) == len(set(codes))
    for definition in service.APP_DEFINITIONS:
        assert set(definition).issuperset(
            {"code", "name", "category", "description", "actions"}
        )
        assert service.get_definition(definition["code"]) is definition


async def test_list_apps_marks_nothing_installed(db_session):
    apps = await service.list_apps(db_session)
    assert len(apps) == len(service.APP_DEFINITIONS)
    assert all(app.installed is False for app in apps)
    assert all(app.status is None for app in apps)


# ---------------------------------------------------------------------------
# Install / list / get
# ---------------------------------------------------------------------------

async def test_install_app_from_registry(db_session):
    integration = await service.install(
        AppInstall(
            app_code="resend_email",
            api_credentials={"api_key": "k-123", "from_email": "a@b.com"},
            settings={"sender": "Eligo"},
        ),
        db_session,
    )
    assert integration.id is not None
    assert integration.app_code == "resend_email"
    assert integration.app_name == "Resend Email"
    assert integration.category == "email"
    assert integration.status == AppStatus.installed
    assert integration.has_credentials is True
    assert integration.settings == {"sender": "Eligo"}

    apps = await service.list_apps(db_session)
    resend = next(app for app in apps if app.code == "resend_email")
    assert resend.installed is True
    assert resend.status == AppStatus.installed


async def test_install_unknown_app_raises_value_error(db_session):
    with pytest.raises(ValueError, match="Unknown app"):
        await service.install(AppInstall(app_code="not_an_app"), db_session)


async def test_install_existing_app_is_idempotent(db_session):
    first = await service.install(
        AppInstall(app_code="resend_email", settings={"a": 1}), db_session
    )
    second = await service.install(
        AppInstall(app_code="resend_email", settings={"a": 2}), db_session
    )
    assert second.id == first.id
    assert second.settings == {"a": 2}
    count = (
        await db_session.execute(select(func.count()).select_from(StoreIntegration))
    ).scalar()
    assert count == 1


async def test_get_app_returns_definition(db_session):
    await service.install(AppInstall(app_code="resend_email"), db_session)
    app = await service.get_app("resend_email", db_session)
    assert app is not None
    assert app.installed is True
    assert app.status == AppStatus.installed
    assert await service.get_app("unknown", db_session) is None


async def test_get_installed_returns_row_or_none(db_session):
    await service.install(AppInstall(app_code="resend_email"), db_session)
    row = await service.get_installed("resend_email", db_session)
    assert row is not None
    assert row.app_code == "resend_email"
    assert await service.get_installed("unknown", db_session) is None


async def test_list_installed_orders_by_name(db_session):
    await service.install(AppInstall(app_code="supabase_reviews"), db_session)
    await service.install(AppInstall(app_code="google_analytics"), db_session)
    installed = await service.list_installed(db_session)
    assert [row.app_code for row in installed] == ["google_analytics", "supabase_reviews"]


# ---------------------------------------------------------------------------
# Update / status / uninstall
# ---------------------------------------------------------------------------

async def test_update_installed_app(db_session):
    installed = await service.install(
        AppInstall(app_code="resend_email", settings={"a": 1}), db_session
    )
    updated = await service.update(
        "resend_email",
        AppUpdate(api_credentials={"api_key": "new-key"}, settings={"a": 2}),
        db_session,
    )
    assert updated is not None
    assert updated.id == installed.id
    assert updated.settings == {"a": 2}
    assert updated.has_credentials is True
    assert await service.update("unknown", AppUpdate(settings={"x": 1}), db_session) is None


async def test_set_status_activates_and_deactivates(db_session):
    await service.install(AppInstall(app_code="resend_email"), db_session)
    active = await service.set_status("resend_email", AppStatus.active, db_session)
    assert active is not None
    assert active.status == AppStatus.active
    inactive = await service.set_status("resend_email", AppStatus.inactive, db_session)
    assert inactive.status == AppStatus.inactive
    assert await service.set_status("unknown", AppStatus.active, db_session) is None


async def test_uninstall_removes_app(db_session):
    await service.install(AppInstall(app_code="resend_email"), db_session)
    assert await service.uninstall("resend_email", db_session) is True
    assert await service.get_installed("resend_email", db_session) is None
    assert await service.uninstall("resend_email", db_session) is False


# ---------------------------------------------------------------------------
# run_action
# ---------------------------------------------------------------------------

async def test_run_action_uninstalled_or_unknown_raises(db_session):
    with pytest.raises(ValueError):
        await service.run_action("resend_email", "send_email", {}, db_session)


async def test_run_action_unsupported_action_raises(db_session):
    await service.install(AppInstall(app_code="resend_email"), db_session)
    with pytest.raises(ValueError, match="does not support"):
        await service.run_action("resend_email", "send_sms", {}, db_session)


async def test_run_action_supported_action_dispatches_payload(db_session, monkeypatch):
    captured: dict = {}

    async def _fake_send_email(payload: dict) -> dict:
        captured["payload"] = payload
        return {"success": True, "id": "fake-id"}

    monkeypatch.setitem(
        adapters.ADAPTERS["resend_email"], "send_email", _fake_send_email
    )
    await service.install(AppInstall(app_code="resend_email"), db_session)

    result = await service.run_action(
        "resend_email", "send_email", {"to": "a@b.com"}, db_session
    )
    assert result["success"] is True
    assert result["action"] == "send_email"
    assert result["data"]["id"] == "fake-id"
    assert captured["payload"] == {"to": "a@b.com"}
