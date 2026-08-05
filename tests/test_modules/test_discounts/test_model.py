"""Tests for discount models in ``app.modules.discounts.model``."""

from app.db.base import Base
from app.modules.discounts.model import (
    Discount,
    DiscountEligibility,
    DiscountMethod,
    DiscountStatus,
    DiscountType,
    WelcomeDiscountLog,
    WelcomeDiscountSettings,
)


def test_tables_registered():
    for table in ("discounts", "welcome_discount_settings", "welcome_discount_logs"):
        assert table in Base.metadata.tables


def test_discount_status_enum_values():
    assert DiscountStatus.active.value == "Active"
    assert DiscountStatus.expired.value == "Expired"
    assert DiscountStatus.scheduled.value == "Scheduled"
    assert DiscountStatus.disabled.value == "Disabled"


def test_discount_method_enum_values():
    assert DiscountMethod.code.value == "Code"
    assert DiscountMethod.automatic.value == "Automatic"


def test_discount_eligibility_enum_values():
    assert DiscountEligibility.all_customers.value == "All customers"
    assert DiscountEligibility.specific_customers.value == "Specific customers"
    assert DiscountEligibility.specific_segments.value == "Specific segments"


def test_discount_type_enum_values():
    assert DiscountType.percentage.value == "Percentage"
    assert DiscountType.fixed_amount.value == "Fixed amount"
    assert DiscountType.free_shipping.value == "Free shipping"
    assert DiscountType.buy_x_get_y.value == "Buy X get Y"


def test_discount_code_is_unique():
    assert Discount.__table__.c.code.unique is True


async def test_welcome_settings_defaults(db_session):
    row = WelcomeDiscountSettings(discount_percentage=10, is_active=False)
    db_session.add(row)
    await db_session.commit()
    await db_session.refresh(row)
    assert row.discount_percentage == 10
    assert row.is_active is False


async def test_welcome_log_columns(db_session):
    row = WelcomeDiscountLog(user_email="a@b.c", ip_address="127.0.0.1")
    db_session.add(row)
    await db_session.commit()
    await db_session.refresh(row)
    assert row.claimed_at is not None
