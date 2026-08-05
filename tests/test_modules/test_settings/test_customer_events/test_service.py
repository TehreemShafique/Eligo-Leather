"""
Tests for app.modules.settings.customer_events.service
"""

import pytest
from sqlalchemy import select

from app.modules.settings.customer_events import service
from app.modules.settings.customer_events.model import (
    PixelEventLog,
    PixelPlacement,
    PixelProvider,
)
from app.modules.settings.customer_events.schema import (
    PixelCreate,
    PixelEventIn,
    PixelUpdate,
)


# ---------------------------------------------------------------------------
# Definitions
# ---------------------------------------------------------------------------

async def test_list_definitions_returns_catalog():
    definitions = service.list_definitions()
    assert len(definitions) == len(service.PIXEL_DEFINITIONS)
    providers = [definition.provider.value for definition in definitions]
    assert "facebook" in providers
    assert "custom" in providers
    for definition in definitions:
        assert isinstance(definition.provider, PixelProvider)
        assert definition.kind.value == "web"


async def test_facebook_and_instagram_templates_share_snippet():
    facebook = next(
        definition for definition in service.PIXEL_DEFINITIONS if definition["provider"] == "facebook"
    )
    instagram = next(
        definition for definition in service.PIXEL_DEFINITIONS if definition["provider"] == "instagram"
    )
    assert "{PIXEL_ID}" in facebook["template"]
    assert instagram["template"] == facebook["template"]


# ---------------------------------------------------------------------------
# Pixel CRUD
# ---------------------------------------------------------------------------

async def test_create_pixel_with_template_generates_script(db_session):
    pixel = await service.create_pixel(
        PixelCreate(name="Meta", provider=PixelProvider.facebook, pixel_id="FB-123"),
        db_session,
    )
    assert pixel.id is not None
    assert pixel.provider == PixelProvider.facebook
    assert pixel.script_content is not None
    assert "FB-123" in pixel.script_content


async def test_create_custom_pixel_keeps_script_content(db_session):
    script = "<script>window.custom=1;</script>"
    pixel = await service.create_pixel(
        PixelCreate(name="Custom", provider=PixelProvider.custom, script_content=script),
        db_session,
    )
    assert pixel.script_content == script


async def test_list_pixels_excludes_inactive(db_session):
    await service.create_pixel(
        PixelCreate(name="Active", provider=PixelProvider.facebook, pixel_id="1"),
        db_session,
    )
    inactive = await service.create_pixel(
        PixelCreate(
            name="Inactive", provider=PixelProvider.custom, script_content="<script>x</script>"
        ),
        db_session,
    )
    await service.set_active(inactive.id, False, db_session)

    assert [pixel.name for pixel in await service.list_pixels(db_session)] == ["Active"]
    assert len(await service.list_pixels(db_session, include_inactive=True)) == 2


async def test_get_pixel_returns_row_or_none(db_session):
    pixel = await service.create_pixel(
        PixelCreate(name="X", provider=PixelProvider.custom), db_session
    )
    fetched = await service.get_pixel(pixel.id, db_session)
    assert fetched is not None
    assert fetched.name == "X"
    assert await service.get_pixel(99999, db_session) is None


async def test_update_pixel_regenerates_script_when_pixel_id_changes(db_session):
    pixel = await service.create_pixel(
        PixelCreate(name="Meta", provider=PixelProvider.facebook, pixel_id="OLD"),
        db_session,
    )
    updated = await service.update_pixel(
        pixel.id, PixelUpdate(pixel_id="NEW"), db_session
    )
    assert updated.script_content is not None
    assert "NEW" in updated.script_content
    assert "OLD" not in updated.script_content


async def test_update_pixel_fields(db_session):
    pixel = await service.create_pixel(
        PixelCreate(
            name="Meta", provider=PixelProvider.facebook, pixel_id="1", is_active=True
        ),
        db_session,
    )
    updated = await service.update_pixel(
        pixel.id, PixelUpdate(name="Renamed", is_active=False), db_session
    )
    assert updated.name == "Renamed"
    assert updated.is_active is False
    assert await service.update_pixel(99999, PixelUpdate(name="x"), db_session) is None


async def test_set_active_toggles(db_session):
    pixel = await service.create_pixel(
        PixelCreate(name="X", provider=PixelProvider.custom), db_session
    )
    deactivated = await service.set_active(pixel.id, False, db_session)
    assert deactivated is not None
    assert deactivated.is_active is False
    assert await service.set_active(99999, True, db_session) is None


async def test_delete_pixel(db_session):
    pixel = await service.create_pixel(
        PixelCreate(name="X", provider=PixelProvider.custom), db_session
    )
    assert await service.delete_pixel(pixel.id, db_session) is True
    assert await service.get_pixel(pixel.id, db_session) is None
    assert await service.delete_pixel(pixel.id, db_session) is False


# ---------------------------------------------------------------------------
# Storefront injection
# ---------------------------------------------------------------------------

async def test_get_storefront_scripts_filters_active_and_placement(db_session):
    await service.create_pixel(
        PixelCreate(
            name="Meta",
            provider=PixelProvider.facebook,
            pixel_id="FB",
            placement=PixelPlacement.head,
        ),
        db_session,
    )
    inactive = await service.create_pixel(
        PixelCreate(
            name="Off",
            provider=PixelProvider.custom,
            script_content="<script>x</script>",
            placement=PixelPlacement.head,
        ),
        db_session,
    )
    await service.set_active(inactive.id, False, db_session)
    await service.create_pixel(
        PixelCreate(
            name="Judge",
            provider=PixelProvider.judge_me,
            pixel_id="JM",
            placement=PixelPlacement.body_end,
        ),
        db_session,
    )

    scripts = await service.get_storefront_scripts(db_session)
    assert [script.name for script in scripts] == ["Meta", "Judge"]

    head = await service.get_storefront_scripts(db_session, placement=PixelPlacement.head)
    assert [script.name for script in head] == ["Meta"]
    assert "FB" in head[0].script


async def test_get_storefront_scripts_generates_script_from_template(db_session):
    pixel = await service.create_pixel(
        PixelCreate(name="Meta", provider=PixelProvider.facebook, pixel_id="FB"),
        db_session,
    )
    pixel.script_content = None
    await db_session.commit()

    scripts = await service.get_storefront_scripts(db_session)
    assert len(scripts) == 1
    assert "FB" in scripts[0].script


# ---------------------------------------------------------------------------
# Server-side event dispatch
# ---------------------------------------------------------------------------

async def test_dispatch_event_custom_success_and_logs(db_session):
    result = await service.dispatch_event(
        PixelEventIn(provider=PixelProvider.custom, event_type="Purchase", payload={"value": 100}),
        db_session,
    )
    assert result.success is True
    assert result.event_type == "Purchase"

    logs = await service.list_event_logs(db_session)
    assert len(logs) == 1
    assert logs[0].success is True
    assert logs[0].provider == "custom"
    assert logs[0].payload == {"value": 100}


async def test_dispatch_event_unwired_provider_records_failure(db_session):
    result = await service.dispatch_event(
        PixelEventIn(provider=PixelProvider.facebook, event_type="Purchase"),
        db_session,
    )
    assert result.success is False

    logs = await service.list_event_logs(db_session)
    assert len(logs) == 1
    assert logs[0].success is False


async def test_dispatch_event_unregistered_provider_records_error(db_session):
    result = await service.dispatch_event(
        PixelEventIn(provider=PixelProvider.pinterest, event_type="PageView"),
        db_session,
    )
    assert result.success is False
    assert "No server-side adapter" in result.response["error"]

    logs = await service.list_event_logs(db_session)
    assert len(logs) == 1
    assert "No server-side adapter" in logs[0].response


async def test_dispatch_event_links_to_pixel(db_session):
    pixel = await service.create_pixel(
        PixelCreate(name="Meta", provider=PixelProvider.facebook, pixel_id="FB-1"),
        db_session,
    )
    result = await service.dispatch_event(
        PixelEventIn(provider=PixelProvider.custom, event_type="Purchase", pixel_id="FB-1"),
        db_session,
    )
    assert result.success is True
    log = (await db_session.execute(select(PixelEventLog))).scalar_one()
    assert log.pixel_id == pixel.id
