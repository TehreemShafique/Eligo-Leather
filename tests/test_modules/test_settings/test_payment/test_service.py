"""Tests for app.modules.settings.payment.service"""

from sqlalchemy import func, select

from app.modules.settings.payment import service
from app.modules.settings.payment.model import (
    PaymentCaptureMethod,
    PaymentMethod,
    PaymentSettings,
)
from app.modules.settings.payment.schema import (
    PaymentMethodCreate,
    PaymentMethodUpdate,
    PaymentSettingsUpdate,
)


# ---------------------------------------------------------------------------
# Payment settings singleton
# ---------------------------------------------------------------------------

async def test_get_payment_settings_creates_singleton(db_session):
    settings = await service.get_payment_settings(db_session)
    assert settings.id == 1
    assert settings.gift_cards_expire is False
    assert settings.gift_card_validity_years is None
    assert settings.payment_capture_method == PaymentCaptureMethod.manual

    again = await service.get_payment_settings(db_session)
    assert again.id == 1
    count = (await db_session.execute(select(func.count(PaymentSettings.id)))).scalar_one()
    assert count == 1


async def test_update_payment_settings_gift_cards_enabled_defaults_to_one_year(db_session):
    settings = await service.update_payment_settings(
        PaymentSettingsUpdate(gift_cards_expire=True), db_session
    )
    assert settings.gift_cards_expire is True
    assert settings.gift_card_validity_years == 1


async def test_update_payment_settings_keeps_explicit_years(db_session):
    settings = await service.update_payment_settings(
        PaymentSettingsUpdate(gift_cards_expire=True, gift_card_validity_years=3), db_session
    )
    assert settings.gift_cards_expire is True
    assert settings.gift_card_validity_years == 3


async def test_update_payment_settings_disabled_clears_years(db_session):
    await service.update_payment_settings(
        PaymentSettingsUpdate(gift_cards_expire=True, gift_card_validity_years=5), db_session
    )
    settings = await service.update_payment_settings(
        PaymentSettingsUpdate(gift_cards_expire=False), db_session
    )
    assert settings.gift_cards_expire is False
    assert settings.gift_card_validity_years is None


async def test_update_payment_settings_capture_method(db_session):
    settings = await service.update_payment_settings(
        PaymentSettingsUpdate(payment_capture_method=PaymentCaptureMethod.auto_on_fulfillment),
        db_session,
    )
    assert settings.payment_capture_method == PaymentCaptureMethod.auto_on_fulfillment


async def test_update_payment_settings_stays_singleton(db_session):
    await service.update_payment_settings(
        PaymentSettingsUpdate(gift_cards_expire=True), db_session
    )
    await service.update_payment_settings(
        PaymentSettingsUpdate(payment_capture_method=PaymentCaptureMethod.auto_checkout), db_session
    )
    count = (await db_session.execute(select(func.count(PaymentSettings.id)))).scalar_one()
    assert count == 1


# ---------------------------------------------------------------------------
# Payment methods
# ---------------------------------------------------------------------------

async def test_create_and_get_payment_method(db_session):
    method = await service.create_payment_method(
        PaymentMethodCreate(name="Bank Transfer", additional_details="Direct to account"),
        db_session,
    )
    assert method.id is not None
    assert method.name == "Bank Transfer"
    assert method.additional_details == "Direct to account"
    assert method.is_active is True

    fetched = await service.get_payment_method(method.id, db_session)
    assert fetched is not None
    assert fetched.name == "Bank Transfer"


async def test_get_payment_method_missing_returns_none(db_session):
    assert await service.get_payment_method(99999, db_session) is None


async def test_list_payment_methods_excludes_inactive(db_session):
    await service.create_payment_method(PaymentMethodCreate(name="COD"), db_session)
    second = await service.create_payment_method(PaymentMethodCreate(name="Card"), db_session)
    await service.deactivate_payment_method(second.id, db_session)

    active = await service.list_payment_methods(db_session)
    assert len(active) == 1
    assert active[0].name == "COD"

    all_methods = await service.list_payment_methods(db_session, include_inactive=True)
    assert len(all_methods) == 2


async def test_update_payment_method(db_session):
    method = await service.create_payment_method(PaymentMethodCreate(name="COD"), db_session)
    updated = await service.update_payment_method(
        method.id,
        PaymentMethodUpdate(
            name="Cash on Delivery",
            payment_instructions="Have exact change ready",
        ),
        db_session,
    )
    assert updated is not None
    assert updated.name == "Cash on Delivery"
    assert updated.payment_instructions == "Have exact change ready"


async def test_update_payment_method_missing_returns_none(db_session):
    assert await service.update_payment_method(99999, PaymentMethodUpdate(name="x"), db_session) is None


async def test_deactivate_payment_method(db_session):
    method = await service.create_payment_method(PaymentMethodCreate(name="COD"), db_session)
    deactivated = await service.deactivate_payment_method(method.id, db_session)
    assert deactivated is not None
    assert deactivated.is_active is False


async def test_deactivate_payment_method_missing_returns_none(db_session):
    assert await service.deactivate_payment_method(99999, db_session) is None


async def test_delete_payment_method(db_session):
    method = await service.create_payment_method(PaymentMethodCreate(name="Temp"), db_session)
    assert await service.delete_payment_method(method.id, db_session) is True
    assert await service.get_payment_method(method.id, db_session) is None
    assert await service.delete_payment_method(method.id, db_session) is False


# ---------------------------------------------------------------------------
# Seeding
# ---------------------------------------------------------------------------

async def test_seed_default_payment_methods_is_idempotent(db_session):
    await service.seed_default_payment_methods(db_session)
    await service.seed_default_payment_methods(db_session)
    methods = await service.list_payment_methods(db_session, include_inactive=True)
    assert len(methods) == 1
    assert methods[0].name == "Cash on Delivery (COD)"
    assert methods[0].additional_details == "Free Shipping On Above 2000/ Order"
    assert methods[0].is_active is True
