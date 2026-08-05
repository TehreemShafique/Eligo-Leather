"""
Tests for app.modules.settings.metafields_and_metaobjects.router
"""

from app.modules.settings.metafields_and_metaobjects import service as metafield_service
from app.modules.settings.metafields_and_metaobjects.schema import (
    MetafieldDefinitionCreate,
    MetafieldValueCreate,
)


async def _create_definition(db_session, **kwargs):
    return await metafield_service.create_definition(
        MetafieldDefinitionCreate(**kwargs), db_session
    )


# ---------------------------------------------------------------------------
# Auth
# ---------------------------------------------------------------------------

async def test_admin_routes_require_auth(client):
    resp = await client.get("/api/v1/settings/metafields-and-metaobjects/overview")
    assert resp.status_code in (401, 403)


async def test_admin_routes_reject_non_admin(client, auth_headers):
    resp = await client.get("/api/v1/settings/metafields-and-metaobjects/types", headers=auth_headers)
    assert resp.status_code == 404


# ---------------------------------------------------------------------------
# Overview / catalogs
# ---------------------------------------------------------------------------

async def test_overview(client, admin_headers):
    resp = await client.get("/api/v1/settings/metafields-and-metaobjects/overview", headers=admin_headers)
    assert resp.status_code == 200
    body = resp.json()
    assert len(body["resources"]) == len(metafield_service.RESOURCE_TYPES)
    assert len(body["resource_types"]) == len(metafield_service.RESOURCE_TYPES)
    assert len(body["type_catalog"]) == len(metafield_service.METAFIELD_TYPES)
    assert body["metaobject_definitions_count"] == 0


async def test_resource_types(client, admin_headers):
    resp = await client.get("/api/v1/settings/metafields-and-metaobjects/resource-types", headers=admin_headers)
    assert resp.status_code == 200
    body = resp.json()
    assert body[0]["resource_type"] == "product"
    assert all("name" in r for r in body)


async def test_types(client, admin_headers):
    resp = await client.get("/api/v1/settings/metafields-and-metaobjects/types", headers=admin_headers)
    assert resp.status_code == 200
    body = resp.json()
    assert any(t["code"] == "single_line_text" for t in body)
    assert all("category" in t for t in body)


# ---------------------------------------------------------------------------
# Definitions CRUD
# ---------------------------------------------------------------------------

async def test_create_definition(client, admin_headers):
    resp = await client.post(
        "/api/v1/settings/metafields-and-metaobjects/definitions",
        json={
            "resource_type": "product",
            "name": "Material",
            "type": "single_line_text",
            "storefront_api_access": True,
        },
        headers=admin_headers,
    )
    assert resp.status_code == 201
    body = resp.json()
    assert body["key"] == "material"
    assert body["type_label"] == "Single line text"
    assert body["scope"] == "all"


async def test_create_definition_with_categories_scope(client, admin_headers):
    resp = await client.post(
        "/api/v1/settings/metafields-and-metaobjects/definitions",
        json={
            "resource_type": "product",
            "name": "Vegan",
            "type": "boolean",
            "scope": "categories",
            "category_ids": [1, 2],
        },
        headers=admin_headers,
    )
    assert resp.status_code == 201
    body = resp.json()
    assert body["scope"] == "categories"
    assert body["category_ids"] == [1, 2]


async def test_create_definition_unknown_resource_type_422(client, admin_headers):
    resp = await client.post(
        "/api/v1/settings/metafields-and-metaobjects/definitions",
        json={"resource_type": "widget", "name": "Material", "type": "text"},
        headers=admin_headers,
    )
    assert resp.status_code == 422
    assert "Unknown resource_type" in resp.json()["detail"]


async def test_create_definition_unknown_type_422(client, admin_headers):
    resp = await client.post(
        "/api/v1/settings/metafields-and-metaobjects/definitions",
        json={"resource_type": "product", "name": "Material", "type": "bogus_type"},
        headers=admin_headers,
    )
    assert resp.status_code == 422
    assert "Unknown metafield type" in resp.json()["detail"]


async def test_create_definition_duplicate_422(client, admin_headers, db_session):
    await _create_definition(db_session, resource_type="product", name="Material", type="text")
    resp = await client.post(
        "/api/v1/settings/metafields-and-metaobjects/definitions",
        json={"resource_type": "product", "name": "Material", "type": "text"},
        headers=admin_headers,
    )
    assert resp.status_code == 422
    assert "already exists" in resp.json()["detail"]


async def test_create_definition_invalid_scope_422(client, admin_headers):
    resp = await client.post(
        "/api/v1/settings/metafields-and-metaobjects/definitions",
        json={"resource_type": "product", "name": "Material", "type": "text", "scope": "bogus"},
        headers=admin_headers,
    )
    assert resp.status_code == 422


async def test_create_definition_empty_body_422(client, admin_headers):
    resp = await client.post(
        "/api/v1/settings/metafields-and-metaobjects/definitions",
        json={},
        headers=admin_headers,
    )
    assert resp.status_code == 422


async def test_get_definition(client, admin_headers, db_session):
    definition = await _create_definition(db_session, resource_type="product", name="Material", type="text")
    resp = await client.get(
        f"/api/v1/settings/metafields-and-metaobjects/definitions/{definition.id}",
        headers=admin_headers,
    )
    assert resp.status_code == 200
    assert resp.json()["name"] == "Material"


async def test_get_definition_missing_404(client, admin_headers):
    resp = await client.get("/api/v1/settings/metafields-and-metaobjects/definitions/99999", headers=admin_headers)
    assert resp.status_code == 404
    assert resp.json()["detail"] == "Definition not found"


async def test_list_definitions_filter(client, admin_headers, db_session):
    await _create_definition(db_session, resource_type="product", name="Alpha", type="text")
    await _create_definition(db_session, resource_type="customer", name="Beta", type="email")

    resp = await client.get(
        "/api/v1/settings/metafields-and-metaobjects/definitions",
        params={"resource_type": "customer"},
        headers=admin_headers,
    )
    assert resp.status_code == 200
    body = resp.json()
    assert len(body) == 1
    assert body[0]["name"] == "Beta"


async def test_list_definitions_search(client, admin_headers, db_session):
    await _create_definition(db_session, resource_type="product", name="Care Instructions", type="multi_line_text")
    await _create_definition(db_session, resource_type="product", name="Rating", type="rating")

    resp = await client.get(
        "/api/v1/settings/metafields-and-metaobjects/definitions",
        params={"search": "care"},
        headers=admin_headers,
    )
    assert resp.status_code == 200
    body = resp.json()
    assert len(body) == 1
    assert body[0]["name"] == "Care Instructions"


async def test_update_definition(client, admin_headers, db_session):
    definition = await _create_definition(db_session, resource_type="product", name="Material", type="text")
    resp = await client.patch(
        f"/api/v1/settings/metafields-and-metaobjects/definitions/{definition.id}",
        json={"name": "Primary Material", "type": "multi_line_text"},
        headers=admin_headers,
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["name"] == "Primary Material"
    assert body["key"] == "primary_material"
    assert body["type"] == "multi_line_text"


async def test_update_definition_unknown_type_422(client, admin_headers, db_session):
    definition = await _create_definition(db_session, resource_type="product", name="Material", type="text")
    resp = await client.patch(
        f"/api/v1/settings/metafields-and-metaobjects/definitions/{definition.id}",
        json={"type": "bogus_type"},
        headers=admin_headers,
    )
    assert resp.status_code == 422
    assert "Unknown metafield type" in resp.json()["detail"]


async def test_update_definition_missing_404(client, admin_headers):
    resp = await client.patch(
        "/api/v1/settings/metafields-and-metaobjects/definitions/99999",
        json={"name": "x"},
        headers=admin_headers,
    )
    assert resp.status_code == 404
    assert resp.json()["detail"] == "Definition not found"


async def test_delete_definition(client, admin_headers, db_session):
    definition = await _create_definition(db_session, resource_type="product", name="Material", type="text")
    resp = await client.delete(
        f"/api/v1/settings/metafields-and-metaobjects/definitions/{definition.id}",
        headers=admin_headers,
    )
    assert resp.status_code == 204

    assert await metafield_service.get_definition(definition.id, db_session) is None


async def test_delete_definition_missing_404(client, admin_headers):
    resp = await client.delete(
        "/api/v1/settings/metafields-and-metaobjects/definitions/99999", headers=admin_headers
    )
    assert resp.status_code == 404
    assert resp.json()["detail"] == "Definition not found"


async def test_set_pinned(client, admin_headers, db_session):
    definition = await _create_definition(db_session, resource_type="product", name="Material", type="text")
    resp = await client.post(
        f"/api/v1/settings/metafields-and-metaobjects/definitions/{definition.id}/pin",
        headers=admin_headers,
    )
    assert resp.status_code == 200
    assert resp.json()["is_pinned"] is True


async def test_set_pinned_missing_404(client, admin_headers):
    resp = await client.post(
        "/api/v1/settings/metafields-and-metaobjects/definitions/99999/pin",
        headers=admin_headers,
    )
    assert resp.status_code == 404


# ---------------------------------------------------------------------------
# Values
# ---------------------------------------------------------------------------

async def test_record_value(client, admin_headers, db_session):
    definition = await _create_definition(db_session, resource_type="product", name="Material", type="text")
    resp = await client.post(
        f"/api/v1/settings/metafields-and-metaobjects/definitions/{definition.id}/values",
        json={"owner_resource_type": "product", "owner_id": 7, "value": "Leather"},
        headers=admin_headers,
    )
    assert resp.status_code == 201
    body = resp.json()
    assert body["definition_id"] == definition.id
    assert body["owner_id"] == 7
    assert body["value"] == "Leather"


async def test_record_value_missing_definition_404(client, admin_headers):
    resp = await client.post(
        "/api/v1/settings/metafields-and-metaobjects/definitions/99999/values",
        json={"owner_resource_type": "product", "owner_id": 7, "value": "Leather"},
        headers=admin_headers,
    )
    assert resp.status_code == 404
    assert resp.json()["detail"] == "Definition not found"


async def test_list_values(client, admin_headers, db_session):
    definition = await _create_definition(db_session, resource_type="product", name="Material", type="text")
    await metafield_service.record_value(
        definition.id,
        MetafieldValueCreate(owner_resource_type="product", owner_id=1, value="Leather"),
        db_session,
    )
    await metafield_service.record_value(
        definition.id,
        MetafieldValueCreate(owner_resource_type="product", owner_id=2, value="Canvas"),
        db_session,
    )

    resp = await client.get(
        f"/api/v1/settings/metafields-and-metaobjects/definitions/{definition.id}/values",
        headers=admin_headers,
    )
    assert resp.status_code == 200
    assert len(resp.json()) == 2


# ---------------------------------------------------------------------------
# Metaobjects dashboard / seed
# ---------------------------------------------------------------------------

async def test_metaobjects_list_empty(client, admin_headers):
    resp = await client.get("/api/v1/settings/metafields-and-metaobjects/metaobjects", headers=admin_headers)
    assert resp.status_code == 200
    body = resp.json()
    assert body["definitions"] == []
    assert body["total"] == 0


async def test_metaobject_missing_404(client, admin_headers):
    resp = await client.get("/api/v1/settings/metafields-and-metaobjects/metaobjects/99999", headers=admin_headers)
    assert resp.status_code == 404
    assert resp.json()["detail"] == "Metaobject definition not found"


async def test_seed(client, admin_headers, db_session):
    resp = await client.post("/api/v1/settings/metafields-and-metaobjects/seed", headers=admin_headers)
    assert resp.status_code == 201
    assert resp.json()["status"] == "ok"

    definitions = await metafield_service.list_definitions(db_session)
    assert len(definitions) == len(metafield_service.SAMPLE_DEFINITIONS)
