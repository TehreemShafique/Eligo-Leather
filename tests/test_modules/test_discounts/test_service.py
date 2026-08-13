"""Tests for the discounts service in ``app.modules.discounts.service``."""

from datetime import datetime, timedelta, timezone

import pytest

from app.modules.discounts import service
from app.modules.discounts.model import Discount, DiscountMethod, DiscountStatus
from app.modules.discounts.schema import (
    DiscountCreate,
    DiscountUpdate,
    WelcomeDiscountUpdate,
)


@pytest.mark.asyncio
async def test_create_discount(db_session):
    discount = await service.create_discount(
        db_session,
        DiscountCreate(title="Summer Sale", code="SUMMER10"),
    )
    assert discount.id is not None
    assert discount.title == "Summer Sale"
    assert discount.code == "SUMMER10"


@pytest.mark.asyncio
async def test_get_discount_missing_returns_none(db_session):
    assert await service.get_discount(db_session, 999) is None


@pytest.mark.asyncio
async def test_list_discounts_search(db_session):
    await service.create_discount(db_session, DiscountCreate(title="Leather", code="LEATHER5"))
    await service.create_discount(db_session, DiscountCreate(title="Shoes", code="SHOES10"))

    results = await service.list_discounts(db_session, search="leather")
    assert len(results) == 1
    assert results[0].code == "LEATHER5"


@pytest.mark.asyncio
async def test_list_discounts_pagination(db_session):
    for i in range(5):
        await service.create_discount(db_session, DiscountCreate(title=f"Sale {i}"))

    assert len(await service.list_discounts(db_session, skip=0, limit=2)) == 2
    assert len(await service.list_discounts(db_session, skip=2, limit=10)) == 3


@pytest.mark.asyncio
async def test_update_discount(db_session):
    discount = await service.create_discount(
        db_session, DiscountCreate(title="Old Title", code="OLD")
    )
    updated = await service.update_discount(
        db_session, discount.id, DiscountUpdate(title="New Title")
    )
    assert updated.title == "New Title"


@pytest.mark.asyncio
async def test_update_discount_missing_returns_none(db_session):
    assert await service.update_discount(db_session, 999, DiscountUpdate(title="x")) is None


@pytest.mark.asyncio
async def test_delete_discount(db_session):
    discount = await service.create_discount(db_session, DiscountCreate(title="Temp"))
    assert await service.delete_discount(db_session, discount.id) is True
    assert await service.get_discount(db_session, discount.id) is None


@pytest.mark.asyncio
async def test_delete_discount_missing_returns_false(db_session):
    assert await service.delete_discount(db_session, 999) is False


@pytest.mark.asyncio
async def test_get_welcome_settings_creates_default(db_session):
    settings = await service.get_welcome_settings(db_session)
    assert settings.discount_percentage == 10
    assert settings.is_active is False


@pytest.mark.asyncio
async def test_update_welcome_settings(db_session):
    await service.get_welcome_settings(db_session)
    updated = await service.update_welcome_settings(
        db_session,
        WelcomeDiscountUpdate(discount_percentage=15, is_active=True),
        updated_by=1,
    )
    assert updated.discount_percentage == 15
    assert updated.is_active is True
    assert updated.updated_by == 1


@pytest.mark.asyncio
async def test_evaluate_welcome_discount_disabled_by_default(db_session):
    result = await service.evaluate_welcome_discount(db_session, "u@example.com", "1.2.3.4")
    assert result.show_welcome_discount is False


@pytest.mark.asyncio
async def test_evaluate_welcome_discount_enabled_once(db_session):
    await service.update_welcome_settings(
        db_session, WelcomeDiscountUpdate(is_active=True), updated_by=1
    )
    result = await service.evaluate_welcome_discount(db_session, "u@example.com", "1.2.3.4")
    assert result.show_welcome_discount is True
    assert result.discount_percentage == 10

    # Second login from same email or IP must not show again.
    second = await service.evaluate_welcome_discount(db_session, "u@example.com", "5.6.7.8")
    assert second.show_welcome_discount is False
    third = await service.evaluate_welcome_discount(db_session, "other@example.com", "1.2.3.4")
    assert third.show_welcome_discount is False


@pytest.mark.asyncio
async def test_list_discounts_date_range(db_session):
    await service.create_discount(db_session, DiscountCreate(title="Recent"))
    start = datetime.now(timezone.utc) - timedelta(days=1)
    end = datetime.now(timezone.utc) + timedelta(days=1)
    results = await service.list_discounts(db_session, start_date=start, end_date=end)
    assert len(results) == 1


@pytest.mark.asyncio
async def test_discount_enum_defaults_persist(db_session):
    discount = await service.create_discount(db_session, DiscountCreate(title="Defaults"))
    assert discount.status == DiscountStatus.active
    assert discount.method == DiscountMethod.code
