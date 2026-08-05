"""Tests for app.modules.settings.customer_accounts.service"""

from sqlalchemy import func, select

from app.modules.settings.customer_accounts import service
from app.modules.settings.customer_accounts.model import CustomerAccountSettings
from app.modules.settings.customer_accounts.schema import CustomerAccountSettingsUpdate


async def test_get_settings_creates_singleton_when_missing(db_session):
    settings = await service.get_settings(db_session)
    assert settings.id == 1
    assert settings.show_sign_in_links is True
    assert settings.allow_registration is True
    assert settings.require_email_verification is False
    assert settings.session_duration_days == 30
    assert settings.allow_self_returns is True
    assert settings.return_window_days == 14
    assert settings.allow_store_credit is True
    assert settings.account_domain == "https://eligoleather.com/account"


async def test_get_settings_returns_existing_row(db_session):
    settings = await service.get_settings(db_session)
    settings.session_duration_days = 45
    await db_session.commit()

    fetched = await service.get_settings(db_session)
    assert fetched.id == 1
    assert fetched.session_duration_days == 45


async def test_seed_default_settings_is_idempotent(db_session):
    assert await service.seed_default_settings(db_session) is None
    assert await service.seed_default_settings(db_session) is None

    count = (
        await db_session.execute(select(func.count(CustomerAccountSettings.id)))
    ).scalar()
    assert count == 1


async def test_update_settings_persists_fields(db_session):
    updated = await service.update_settings(
        CustomerAccountSettingsUpdate(
            show_sign_in_links=False,
            allow_registration=False,
            session_duration_days=60,
            return_window_days=7,
            account_domain="https://accounts.eligo.example",
        ),
        db_session,
    )
    assert updated.show_sign_in_links is False
    assert updated.session_duration_days == 60
    assert updated.return_window_days == 7
    assert updated.account_domain == "https://accounts.eligo.example"

    fetched = await service.get_settings(db_session)
    assert fetched.allow_registration is False
