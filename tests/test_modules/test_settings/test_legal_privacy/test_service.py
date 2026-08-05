"""Tests for app.modules.settings.legal_privacy.service"""

from sqlalchemy import func, select

from app.modules.content.model import Menu, MenuItem
from app.modules.settings.legal_privacy import service
from app.modules.settings.legal_privacy.model import (
    PolicyType,
    StorePolicy,
    StorePrivacySettings,
)
from app.modules.settings.legal_privacy.schema import (
    PrivacySettingsUpdate,
    StorePolicyUpdate,
)


# ---------------------------------------------------------------------------
# Templates
# ---------------------------------------------------------------------------

async def test_list_default_policies_has_five():
    policies = service.list_default_policies()
    assert len(policies) == 5
    assert {p["policy_type"] for p in policies} == set(PolicyType)


# ---------------------------------------------------------------------------
# Store policies
# ---------------------------------------------------------------------------

async def test_list_policies_empty_by_default(db_session):
    assert await service.list_policies(db_session) == []


async def test_upsert_policy_creates_automated_template(db_session):
    policy = await service.upsert_policy(
        StorePolicyUpdate(policy_type=PolicyType.privacy_policy), db_session
    )
    assert policy.policy_type == PolicyType.privacy_policy
    assert policy.title == "Privacy Policy"
    assert policy.is_automated is True
    assert "{store_name}" in policy.content


async def test_upsert_policy_custom_content_flips_to_manual(db_session):
    policy = await service.upsert_policy(
        StorePolicyUpdate(
            policy_type=PolicyType.terms_of_service,
            title="Custom T&C",
            content="<p>Custom body</p>",
        ),
        db_session,
    )
    assert policy.title == "Custom T&C"
    assert policy.content == "<p>Custom body</p>"
    assert policy.is_automated is False


async def test_upsert_policy_updates_existing_row(db_session):
    await service.upsert_policy(StorePolicyUpdate(policy_type=PolicyType.privacy_policy), db_session)
    updated = await service.upsert_policy(
        StorePolicyUpdate(
            policy_type=PolicyType.privacy_policy,
            title="New Title",
            content="<p>New body</p>",
        ),
        db_session,
    )
    assert updated.title == "New Title"
    assert updated.content == "<p>New body</p>"
    assert updated.is_automated is False

    count = (await db_session.execute(select(func.count(StorePolicy.id)))).scalar_one()
    assert count == 1


async def test_upsert_policy_automated_true_regenerates_body(db_session):
    await service.upsert_policy(
        StorePolicyUpdate(
            policy_type=PolicyType.refund_policy,
            title="Custom",
            content="<p>Custom body</p>",
        ),
        db_session,
    )
    regenerated = await service.upsert_policy(
        StorePolicyUpdate(policy_type=PolicyType.refund_policy, is_automated=True), db_session
    )
    assert regenerated.is_automated is True
    assert "Custom body" not in regenerated.content
    assert "Return window" in regenerated.content


async def test_upsert_policy_automated_false_keeps_custom_body(db_session):
    await service.upsert_policy(
        StorePolicyUpdate(policy_type=PolicyType.shipping_policy, content="<p>My shipping rules</p>"),
        db_session,
    )
    kept = await service.upsert_policy(
        StorePolicyUpdate(
            policy_type=PolicyType.shipping_policy,
            title="Shipping",
            is_automated=False,
        ),
        db_session,
    )
    assert kept.is_automated is False
    assert kept.content == "<p>My shipping rules</p>"
    assert kept.title == "Shipping"


async def test_get_policy_returns_policy_or_none(db_session):
    assert await service.get_policy(db_session, PolicyType.privacy_policy) is None
    await service.upsert_policy(StorePolicyUpdate(policy_type=PolicyType.privacy_policy), db_session)
    policy = await service.get_policy(db_session, PolicyType.privacy_policy)
    assert policy is not None
    assert policy.policy_type == PolicyType.privacy_policy
    assert policy.title == "Privacy Policy"


async def test_regenerate_policy_resets_to_template(db_session):
    await service.upsert_policy(
        StorePolicyUpdate(
            policy_type=PolicyType.legal_notice,
            title="Custom",
            content="<p>Custom body</p>",
        ),
        db_session,
    )
    regenerated = await service.regenerate_policy(PolicyType.legal_notice, db_session)
    assert regenerated.is_automated is True
    assert regenerated.title == "Legal Notice"
    assert "Site content" in regenerated.content


async def test_seed_defaults_creates_five_policies_and_settings(db_session):
    await service.seed_defaults(db_session)
    policies = await service.list_policies(db_session)
    assert len(policies) == 5
    assert all(p.is_automated for p in policies)
    settings = await service.get_privacy_settings(db_session)
    assert settings.id == 1


async def test_seed_defaults_is_idempotent(db_session):
    await service.seed_defaults(db_session)
    await service.seed_defaults(db_session)
    count = (await db_session.execute(select(func.count(StorePolicy.id)))).scalar_one()
    assert count == 5


# ---------------------------------------------------------------------------
# Privacy settings singleton
# ---------------------------------------------------------------------------

async def test_get_privacy_settings_creates_singleton(db_session):
    settings = await service.get_privacy_settings(db_session)
    assert settings.id == 1
    assert settings.cookie_banner_enabled is True
    assert settings.cookie_banner_theme.value == "light"
    assert settings.network_intelligence_enabled is False

    again = await service.get_privacy_settings(db_session)
    assert again.id == 1
    count = (await db_session.execute(select(func.count(StorePrivacySettings.id)))).scalar_one()
    assert count == 1


async def test_update_privacy_settings_applies_fields(db_session):
    result = await service.update_privacy_settings(
        PrivacySettingsUpdate(cookie_banner_enabled=False, show_in_checkout=True), db_session
    )
    assert result.settings.cookie_banner_enabled is False
    assert result.settings.show_in_checkout is True
    assert result.opt_out_menu is None


# ---------------------------------------------------------------------------
# Automated opt-out menu injection
# ---------------------------------------------------------------------------

async def test_update_privacy_settings_injects_opt_out_menu(db_session):
    result = await service.update_privacy_settings(
        PrivacySettingsUpdate(opt_out_menu_target="Footer"), db_session
    )
    assert result.settings.opt_out_menu_target == "Footer"
    assert result.opt_out_menu is not None
    assert result.opt_out_menu.title == "Footer"
    assert result.opt_out_menu.label == "Do Not Sell My Info"
    assert result.opt_out_menu.url == "/pages/opt-out"

    menu_count = (await db_session.execute(select(func.count(Menu.id)))).scalar_one()
    assert menu_count == 1
    item_count = (await db_session.execute(select(func.count(MenuItem.id)))).scalar_one()
    assert item_count == 1


async def test_update_privacy_settings_opt_out_is_idempotent(db_session):
    first = await service.update_privacy_settings(
        PrivacySettingsUpdate(opt_out_menu_target="Footer"), db_session
    )
    second = await service.update_privacy_settings(
        PrivacySettingsUpdate(opt_out_menu_target="Footer"), db_session
    )
    assert second.opt_out_menu.menu_id == first.opt_out_menu.menu_id
    assert second.opt_out_menu.menu_item_id == first.opt_out_menu.menu_item_id
    item_count = (await db_session.execute(select(func.count(MenuItem.id)))).scalar_one()
    assert item_count == 1


async def test_update_privacy_settings_moves_opt_out_menu(db_session):
    first = await service.update_privacy_settings(
        PrivacySettingsUpdate(opt_out_menu_target="Footer"), db_session
    )
    second = await service.update_privacy_settings(
        PrivacySettingsUpdate(opt_out_menu_target="Information"), db_session
    )
    assert second.opt_out_menu.title == "Information"
    assert second.opt_out_menu.menu_item_id == first.opt_out_menu.menu_item_id
    menu_count = (await db_session.execute(select(func.count(Menu.id)))).scalar_one()
    assert menu_count == 2


async def test_update_privacy_settings_disabling_link_removes_menu_item(db_session):
    await service.update_privacy_settings(
        PrivacySettingsUpdate(opt_out_menu_target="Footer"), db_session
    )
    result = await service.update_privacy_settings(
        PrivacySettingsUpdate(opt_out_link_enabled=False), db_session
    )
    assert result.opt_out_menu is None
    item_count = (await db_session.execute(select(func.count(MenuItem.id)))).scalar_one()
    assert item_count == 0


# ---------------------------------------------------------------------------
# Public reads
# ---------------------------------------------------------------------------

async def test_get_public_settings(db_session):
    settings = await service.get_public_settings(db_session)
    assert settings.cookie_banner_enabled is True
    assert settings.cookie_banner_theme.value == "light"
    assert settings.network_intelligence_enabled is False
    assert settings.opt_out_url == "/pages/opt-out"


async def test_get_public_policies_returns_seeded_policies(db_session):
    assert await service.get_public_policies(db_session) == []
    await service.seed_defaults(db_session)
    policies = await service.get_public_policies(db_session)
    assert len(policies) == 5
    assert all(p.title for p in policies)
