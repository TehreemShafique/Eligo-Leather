"""Tests for app.modules.settings.checkout.service"""

from datetime import datetime

import pytest
from pydantic import ValidationError
from sqlalchemy import func, select

from app.modules.settings.checkout import service
from app.modules.settings.checkout.model import CheckoutConfig, ContactMethod
from app.modules.settings.checkout.schema import (
    CheckoutConfigCreate,
    CheckoutConfigUpdate,
)


# ---------------------------------------------------------------------------
# ensure_default_config / seed_default_config
# ---------------------------------------------------------------------------

async def test_ensure_default_config_creates_default(db_session):
    await service.ensure_default_config(db_session)
    result = await db_session.execute(select(CheckoutConfig))
    configs = result.scalars().all()
    assert len(configs) == 1
    assert configs[0].name == "My Store configuration"
    assert configs[0].is_active is True


async def test_ensure_default_config_is_idempotent(db_session):
    await service.ensure_default_config(db_session)
    await service.ensure_default_config(db_session)
    await service.ensure_default_config(db_session)
    count = (await db_session.execute(select(func.count(CheckoutConfig.id)))).scalar_one()
    assert count == 1


async def test_seed_default_config_creates_and_is_idempotent(db_session):
    await service.seed_default_config(db_session)
    await service.seed_default_config(db_session)
    count = (await db_session.execute(select(func.count(CheckoutConfig.id)))).scalar_one()
    assert count == 1


# ---------------------------------------------------------------------------
# list_configs / get_config / get_active_config
# ---------------------------------------------------------------------------

async def test_list_configs_creates_default_when_empty(db_session):
    configs = await service.list_configs(db_session)
    assert len(configs) == 1
    assert configs[0].name == "My Store configuration"


async def test_list_configs_returns_all_configs(db_session):
    await service.ensure_default_config(db_session)
    await service.create_config(CheckoutConfigCreate(name="Draft A"), db_session)
    await service.create_config(CheckoutConfigCreate(name="Draft B"), db_session)
    configs = await service.list_configs(db_session)
    assert len(configs) == 3
    assert {c.name for c in configs} == {"My Store configuration", "Draft A", "Draft B"}


async def test_get_config_returns_config_or_none(db_session):
    configs = await service.list_configs(db_session)
    config = await service.get_config(configs[0].id, db_session)
    assert config is not None
    assert config.name == "My Store configuration"
    assert await service.get_config(99999, db_session) is None


async def test_get_active_config_creates_default(db_session):
    config = await service.get_active_config(db_session)
    assert config.name == "My Store configuration"
    assert config.is_active is True


async def test_get_active_config_promotes_most_recent_when_none_active(db_session):
    await service.ensure_default_config(db_session)
    first = await service.create_config(CheckoutConfigCreate(name="First"), db_session)
    second = await service.create_config(CheckoutConfigCreate(name="Second"), db_session)

    default = await service.get_config(1, db_session)
    default.is_active = False
    default.created_at = datetime(2024, 1, 1)
    first.created_at = datetime(2025, 1, 1)
    second.created_at = datetime(2025, 1, 2)
    await db_session.commit()

    active = await service.get_active_config(db_session)
    assert active.id == second.id
    assert active.is_active is True


# ---------------------------------------------------------------------------
# create_config / update_config / rename_config
# ---------------------------------------------------------------------------

async def test_create_config_creates_inactive_draft(db_session):
    config = await service.create_config(CheckoutConfigCreate(name="My Draft"), db_session)
    assert config.id is not None
    assert config.name == "My Draft"
    assert config.is_active is False


async def test_create_config_defaults_name(db_session):
    config = await service.create_config(CheckoutConfigCreate(), db_session)
    assert config.name == "My Store configuration"
    assert config.is_active is False


async def test_create_config_keeps_default_active(db_session):
    active = await service.get_active_config(db_session)
    await service.create_config(CheckoutConfigCreate(name="Draft"), db_session)
    after = await service.get_active_config(db_session)
    assert after.id == active.id
    assert after.is_active is True


async def test_update_config_updates_fields(db_session):
    configs = await service.list_configs(db_session)
    updated = await service.update_config(
        configs[0].id,
        CheckoutConfigUpdate(
            name="Renamed",
            contact_method=ContactMethod.email,
            show_tipping=True,
        ),
        db_session,
    )
    assert updated is not None
    assert updated.name == "Renamed"
    assert updated.contact_method == ContactMethod.email
    assert updated.show_tipping is True


async def test_update_config_missing_returns_none(db_session):
    assert await service.update_config(99999, CheckoutConfigUpdate(name="x"), db_session) is None


async def test_update_config_invalid_cart_limit_raises(db_session):
    with pytest.raises(ValidationError):
        CheckoutConfigUpdate(cart_item_limit=0)


async def test_update_config_invalid_contact_method_raises(db_session):
    with pytest.raises(ValidationError):
        CheckoutConfigUpdate(contact_method="carrier_pigeon")


async def test_rename_config(db_session):
    configs = await service.list_configs(db_session)
    renamed = await service.rename_config(configs[0].id, "Renamed Store", db_session)
    assert renamed is not None
    assert renamed.name == "Renamed Store"
    assert await service.rename_config(99999, "x", db_session) is None


# ---------------------------------------------------------------------------
# duplicate_config / activate_config / delete_config
# ---------------------------------------------------------------------------

async def test_duplicate_config_copies_source(db_session):
    source = await service.create_config(CheckoutConfigCreate(name="Original"), db_session)
    copy = await service.duplicate_config(source.id, db_session)
    assert copy is not None
    assert copy.id != source.id
    assert copy.name == "Original (copy)"
    assert copy.is_active is False
    assert copy.contact_method == source.contact_method
    assert copy.enable_cart_limit == source.enable_cart_limit
    assert await service.duplicate_config(99999, db_session) is None


async def test_activate_config_activates_only_target(db_session):
    active = await service.get_active_config(db_session)
    first = await service.create_config(CheckoutConfigCreate(name="A"), db_session)
    second = await service.create_config(CheckoutConfigCreate(name="B"), db_session)

    activated = await service.activate_config(second.id, db_session)
    assert activated is not None
    assert activated.is_active is True
    assert (await service.get_config(active.id, db_session)).is_active is False
    assert (await service.get_config(first.id, db_session)).is_active is False
    assert await service.activate_config(99999, db_session) is None


async def test_delete_config_removes_row(db_session):
    await service.ensure_default_config(db_session)
    draft = await service.create_config(CheckoutConfigCreate(name="Draft"), db_session)
    assert await service.delete_config(draft.id, db_session) is True
    assert await service.get_config(draft.id, db_session) is None


async def test_delete_config_missing_returns_false(db_session):
    assert await service.delete_config(99999, db_session) is False


async def test_delete_active_config_promotes_replacement(db_session):
    active = await service.get_active_config(db_session)
    draft = await service.create_config(CheckoutConfigCreate(name="Backup"), db_session)
    await service.activate_config(draft.id, db_session)

    assert await service.delete_config(draft.id, db_session) is True
    remaining = await service.get_active_config(db_session)
    assert remaining is not None
    assert remaining.id == active.id
    assert remaining.is_active is True
