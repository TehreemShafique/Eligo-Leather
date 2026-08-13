"""
Tests for app.modules.settings.metafields_and_metaobjects.service
"""

import pytest

from app.modules.settings.metafields_and_metaobjects import service
from app.modules.settings.metafields_and_metaobjects.model import MetafieldScope
from app.modules.settings.metafields_and_metaobjects.schema import (
    MetafieldDefinitionCreate,
    MetafieldDefinitionUpdate,
    MetafieldValueCreate,
)


# ---------------------------------------------------------------------------
# Catalogs
# ---------------------------------------------------------------------------

async def test_catalogs_are_populated():
    assert len(service.list_resource_types()) == len(service.RESOURCE_TYPES)
    assert len(service.list_type_definitions()) == len(service.METAFIELD_TYPES)
    assert service.get_type("single_line_text")["label"] == "Single line text"
    assert service.get_type("not_a_real_type") is None


# ---------------------------------------------------------------------------
# Definitions CRUD
# ---------------------------------------------------------------------------

async def test_create_and_get_definition(db_session):
    definition = await service.create_definition(
        MetafieldDefinitionCreate(
            resource_type="product",
            name="Material",
            type="single_line_text",
            description="Primary material",
            storefront_api_access=True,
        ),
        db_session,
    )
    assert definition.id is not None
    assert definition.resource_type == "product"
    assert definition.name == "Material"
    assert definition.key == "material"
    assert definition.type == "single_line_text"
    assert definition.type_label == "Single line text"
    assert definition.scope == MetafieldScope.all
    assert definition.is_pinned is False
    assert definition.usage_count == 0

    fetched = await service.get_definition(definition.id, db_session)
    assert fetched is not None
    assert fetched.key == "material"


async def test_create_definition_slugifies_name(db_session):
    definition = await service.create_definition(
        MetafieldDefinitionCreate(resource_type="collection", name="Care Instructions!", type="multi_line_text"),
        db_session,
    )
    assert definition.key == "care_instructions"


async def test_create_definition_unknown_resource_type_raises(db_session):
    with pytest.raises(ValueError, match="Unknown resource_type"):
        await service.create_definition(
            MetafieldDefinitionCreate(resource_type="widget", name="Material", type="text"),
            db_session,
        )


async def test_create_definition_unknown_type_raises(db_session):
    with pytest.raises(ValueError, match="Unknown metafield type"):
        await service.create_definition(
            MetafieldDefinitionCreate(resource_type="product", name="Material", type="bogus_type"),
            db_session,
        )


async def test_create_definition_duplicate_name_raises(db_session):
    payload = MetafieldDefinitionCreate(resource_type="product", name="Material", type="text")
    await service.create_definition(payload, db_session)
    with pytest.raises(ValueError, match="already exists"):
        await service.create_definition(payload, db_session)


async def test_create_definition_with_categories_scope(db_session):
    definition = await service.create_definition(
        MetafieldDefinitionCreate(
            resource_type="product",
            name="Vegan",
            type="boolean",
            scope=MetafieldScope.categories,
            category_ids=[1, 2],
        ),
        db_session,
    )
    assert definition.scope == MetafieldScope.categories
    assert definition.category_ids == [1, 2]


async def test_list_definitions_filters(db_session):
    await service.create_definition(MetafieldDefinitionCreate(resource_type="product", name="Alpha", type="text"), db_session)
    await service.create_definition(MetafieldDefinitionCreate(resource_type="product", name="Beta", type="text"), db_session)
    await service.create_definition(MetafieldDefinitionCreate(resource_type="customer", name="Gamma", type="email"), db_session)

    assert len(await service.list_definitions(db_session)) == 3
    assert len(await service.list_definitions(db_session, resource_type="product")) == 2
    assert len(await service.list_definitions(db_session, resource_type="customer")) == 1
    assert len(await service.list_definitions(db_session, search="alpha")) == 1
    assert len(await service.list_definitions(db_session, scope=MetafieldScope.all)) == 3


async def test_get_definition_missing_returns_none(db_session):
    assert await service.get_definition(99999, db_session) is None


async def test_update_definition(db_session):
    definition = await service.create_definition(
        MetafieldDefinitionCreate(resource_type="product", name="Material", type="text"), db_session
    )
    updated = await service.update_definition(
        definition.id,
        MetafieldDefinitionUpdate(name="Primary Material", type="multi_line_text", is_pinned=True),
        db_session,
    )
    assert updated is not None
    assert updated.name == "Primary Material"
    assert updated.key == "primary_material"
    assert updated.type == "multi_line_text"
    assert updated.is_pinned is True


async def test_update_definition_unknown_type_raises(db_session):
    definition = await service.create_definition(
        MetafieldDefinitionCreate(resource_type="product", name="Material", type="text"), db_session
    )
    with pytest.raises(ValueError, match="Unknown metafield type"):
        await service.update_definition(definition.id, MetafieldDefinitionUpdate(type="bogus_type"), db_session)


async def test_update_definition_missing_returns_none(db_session):
    assert await service.update_definition(99999, MetafieldDefinitionUpdate(name="x"), db_session) is None


async def test_delete_definition(db_session):
    definition = await service.create_definition(
        MetafieldDefinitionCreate(resource_type="product", name="Material", type="text"), db_session
    )
    assert await service.delete_definition(definition.id, db_session) is True
    assert await service.get_definition(definition.id, db_session) is None
    assert await service.delete_definition(definition.id, db_session) is False


async def test_set_pinned(db_session):
    definition = await service.create_definition(
        MetafieldDefinitionCreate(resource_type="product", name="Material", type="text"), db_session
    )
    assert (await service.set_pinned(definition.id, True, db_session)).is_pinned is True
    assert (await service.set_pinned(definition.id, False, db_session)).is_pinned is False
    assert await service.set_pinned(99999, True, db_session) is None


# ---------------------------------------------------------------------------
# Values
# ---------------------------------------------------------------------------

async def test_record_and_list_values(db_session):
    definition = await service.create_definition(
        MetafieldDefinitionCreate(resource_type="product", name="Material", type="text"), db_session
    )
    value = await service.record_value(
        definition.id,
        MetafieldValueCreate(owner_resource_type="product", owner_id=7, value="Leather"),
        db_session,
    )
    assert value is not None
    assert value.definition_id == definition.id
    assert value.value == "Leather"

    values = await service.list_values(definition.id, db_session)
    assert len(values) == 1
    assert values[0].owner_id == 7


async def test_record_value_missing_definition_returns_none(db_session):
    assert await service.record_value(
        99999, MetafieldValueCreate(owner_resource_type="product", owner_id=1, value="x"), db_session
    ) is None


async def test_usage_count_reflects_recorded_values(db_session):
    definition = await service.create_definition(
        MetafieldDefinitionCreate(resource_type="product", name="Material", type="text"), db_session
    )
    for owner_id in (1, 2, 3):
        await service.record_value(
            definition.id,
            MetafieldValueCreate(owner_resource_type="product", owner_id=owner_id, value="Leather"),
            db_session,
        )
    fetched = await service.get_definition(definition.id, db_session)
    assert fetched.usage_count == 3


async def test_list_resources_counts(db_session):
    product = await service.create_definition(
        MetafieldDefinitionCreate(resource_type="product", name="Material", type="text"), db_session
    )
    await service.create_definition(MetafieldDefinitionCreate(resource_type="customer", name="Email", type="email"), db_session)
    await service.record_value(
        product.id,
        MetafieldValueCreate(owner_resource_type="product", owner_id=1, value="Leather"),
        db_session,
    )

    resources = await service.list_resources(db_session)
    assert len(resources) == len(service.RESOURCE_TYPES)
    by_type = {r.resource_type: r for r in resources}
    assert by_type["product"].definition_count == 1
    assert by_type["product"].value_count == 1
    assert by_type["customer"].definition_count == 1


# ---------------------------------------------------------------------------
# Seed
# ---------------------------------------------------------------------------

async def test_seed_defaults_populates_once(db_session):
    await service.seed_defaults(db_session)
    assert len(await service.list_definitions(db_session)) == len(service.SAMPLE_DEFINITIONS)

    await service.seed_defaults(db_session)
    assert len(await service.list_definitions(db_session)) == len(service.SAMPLE_DEFINITIONS)


async def test_seed_defaults_respects_existing_data(db_session):
    await service.create_definition(
        MetafieldDefinitionCreate(resource_type="product", name="Custom", type="text"), db_session
    )
    await service.seed_defaults(db_session)
    assert len(await service.list_definitions(db_session)) == 1
