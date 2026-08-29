"""Tests for app.modules.content.router"""

from app.modules.content.model import (
    MetaobjectDefinition,
    MetaobjectEntry,
    BlogPost,
)


# ---------------------------------------------------------------------------
# Content Overview
# ---------------------------------------------------------------------------

async def test_content_overview_requires_auth(client):
    resp = await client.get("/api/v1/content/overview")
    assert resp.status_code == 401


async def test_content_overview(client, auth_headers, db_session):
    definition = MetaobjectDefinition(name="Card", type_key="card")
    db_session.add(definition)
    await db_session.commit()
    await db_session.refresh(definition)
    db_session.add(MetaobjectEntry(definition_id=definition.id, display_name="E1"))
    post = BlogPost(title="Post", handle="post-1")
    db_session.add(post)
    await db_session.commit()

    resp = await client.get("/api/v1/content/overview", headers=auth_headers)
    assert resp.status_code == 200
    body = resp.json()
    assert body["metaobjects"]["total_definitions"] == 1
    assert body["metaobjects"]["total_entries"] == 1
    assert body["files_count"] == 0
    assert body["menus_count"] == 0
    assert body["url_redirects_count"] == 0
    assert body["blog"]["total_posts"] == 1
    assert body["blog"]["visible_posts"] == 1


# ---------------------------------------------------------------------------
# Metaobject Definitions
# ---------------------------------------------------------------------------

async def test_metaobject_definitions_requires_auth(client):
    resp = await client.get("/api/v1/metaobject-definitions/")
    assert resp.status_code == 401


async def test_metaobject_definitions_full_crud(client, auth_headers):
    resp = await client.post(
        "/api/v1/metaobject-definitions/",
        json={"name": "Card", "type_key": "card", "available_on_storefront": True},
        headers=auth_headers,
    )
    assert resp.status_code == 201
    body = resp.json()
    assert body["name"] == "Card"
    assert body["type_key"] == "card"
    assert body["available_on_storefront"] is True
    def_id = body["id"]

    resp = await client.get("/api/v1/metaobject-definitions/", headers=auth_headers)
    assert resp.status_code == 200
    assert len(resp.json()) == 1

    resp = await client.get(f"/api/v1/metaobject-definitions/{def_id}", headers=auth_headers)
    assert resp.status_code == 200
    assert resp.json()["type_key"] == "card"
    assert resp.json()["entries"] == []

    resp = await client.patch(
        f"/api/v1/metaobject-definitions/{def_id}",
        json={"name": "Banner"},
        headers=auth_headers,
    )
    assert resp.status_code == 200
    assert resp.json()["name"] == "Banner"

    resp = await client.delete(f"/api/v1/metaobject-definitions/{def_id}", headers=auth_headers)
    assert resp.status_code == 204


async def test_metaobject_definitions_missing_404(client, auth_headers):
    resp = await client.get("/api/v1/metaobject-definitions/99999", headers=auth_headers)
    assert resp.status_code == 404
    assert resp.json()["detail"] == "Metaobject definition not found"

    resp = await client.patch("/api/v1/metaobject-definitions/99999", json={"name": "x"}, headers=auth_headers)
    assert resp.status_code == 404
    assert resp.json()["detail"] == "Metaobject definition not found"

    resp = await client.delete("/api/v1/metaobject-definitions/99999", headers=auth_headers)
    assert resp.status_code == 404
    assert resp.json()["detail"] == "Metaobject definition not found"


async def test_metaobject_definitions_invalid_body_422(client, auth_headers):
    resp = await client.post("/api/v1/metaobject-definitions/", json={}, headers=auth_headers)
    assert resp.status_code == 422


async def test_metaobject_definitions_list_search(client, auth_headers):
    await client.post("/api/v1/metaobject-definitions/", json={"name": "Card", "type_key": "card"}, headers=auth_headers)
    await client.post("/api/v1/metaobject-definitions/", json={"name": "Banner", "type_key": "banner"}, headers=auth_headers)

    resp = await client.get(
        "/api/v1/metaobject-definitions/", params={"search": "card"}, headers=auth_headers,
    )
    assert resp.status_code == 200
    assert [d["type_key"] for d in resp.json()] == ["card"]


# ---------------------------------------------------------------------------
# Metaobject Entries
# ---------------------------------------------------------------------------

async def test_metaobject_entries_requires_auth(client):
    resp = await client.get("/api/v1/metaobject-entries/")
    assert resp.status_code == 401


async def test_metaobject_entries_full_crud(client, auth_headers, db_session):
    definition = MetaobjectDefinition(name="Card", type_key="card")
    db_session.add(definition)
    await db_session.commit()
    await db_session.refresh(definition)

    resp = await client.post(
        "/api/v1/metaobject-entries/",
        json={"definition_id": definition.id, "display_name": "E1", "handle": "e1"},
        headers=auth_headers,
    )
    assert resp.status_code == 201
    body = resp.json()
    assert body["display_name"] == "E1"
    assert body["status"] == "active"
    assert body["references_count"] == 0
    entry_id = body["id"]

    resp = await client.get("/api/v1/metaobject-entries/", headers=auth_headers)
    assert resp.status_code == 200
    assert len(resp.json()) == 1

    resp = await client.get(
        "/api/v1/metaobject-entries/", params={"definition_id": definition.id}, headers=auth_headers,
    )
    assert len(resp.json()) == 1

    resp = await client.get(f"/api/v1/metaobject-entries/{entry_id}", headers=auth_headers)
    assert resp.status_code == 200
    assert resp.json()["handle"] == "e1"

    resp = await client.patch(
        f"/api/v1/metaobject-entries/{entry_id}",
        json={"display_name": "E2", "status": "draft"},
        headers=auth_headers,
    )
    assert resp.status_code == 200
    assert resp.json()["display_name"] == "E2"
    assert resp.json()["status"] == "draft"

    resp = await client.delete(f"/api/v1/metaobject-entries/{entry_id}", headers=auth_headers)
    assert resp.status_code == 204


async def test_metaobject_entries_missing_404(client, auth_headers):
    resp = await client.get("/api/v1/metaobject-entries/99999", headers=auth_headers)
    assert resp.status_code == 404
    assert resp.json()["detail"] == "Metaobject entry not found"

    resp = await client.patch("/api/v1/metaobject-entries/99999", json={"display_name": "x"}, headers=auth_headers)
    assert resp.status_code == 404
    assert resp.json()["detail"] == "Metaobject entry not found"

    resp = await client.delete("/api/v1/metaobject-entries/99999", headers=auth_headers)
    assert resp.status_code == 404
    assert resp.json()["detail"] == "Metaobject entry not found"


async def test_metaobject_entries_invalid_body_422(client, auth_headers):
    resp = await client.post("/api/v1/metaobject-entries/", json={}, headers=auth_headers)
    assert resp.status_code == 422


# ---------------------------------------------------------------------------
# Files
# ---------------------------------------------------------------------------

async def test_files_requires_auth(client):
    resp = await client.get("/api/v1/files/")
    assert resp.status_code == 401


async def test_files_full_crud(client, auth_headers):
    payload = {
        "filename": "hero.png",
        "original_filename": "hero.png",
        "mime_type": "image/png",
        "url": "https://cdn.example.com/hero.png",
        "alt_text": "Hero",
    }
    resp = await client.post("/api/v1/files/", json=payload, headers=auth_headers)
    assert resp.status_code == 201
    body = resp.json()
    assert body["filename"] == "hero.png"
    assert body["file_size"] == 0
    file_id = body["id"]

    resp = await client.get("/api/v1/files/", headers=auth_headers)
    assert resp.status_code == 200
    assert len(resp.json()) == 1

    resp = await client.get("/api/v1/files/", params={"mime_type": "image/png"}, headers=auth_headers)
    assert len(resp.json()) == 1

    resp = await client.get(f"/api/v1/files/{file_id}", headers=auth_headers)
    assert resp.status_code == 200
    assert resp.json()["mime_type"] == "image/png"

    resp = await client.patch(f"/api/v1/files/{file_id}", json={"alt_text": "New Hero"}, headers=auth_headers)
    assert resp.status_code == 200
    assert resp.json()["alt_text"] == "New Hero"

    resp = await client.delete(f"/api/v1/files/{file_id}", headers=auth_headers)
    assert resp.status_code == 204


async def test_files_missing_404(client, auth_headers):
    resp = await client.get("/api/v1/files/99999", headers=auth_headers)
    assert resp.status_code == 404
    assert resp.json()["detail"] == "File not found"

    resp = await client.patch("/api/v1/files/99999", json={"alt_text": "x"}, headers=auth_headers)
    assert resp.status_code == 404
    assert resp.json()["detail"] == "File not found"

    resp = await client.delete("/api/v1/files/99999", headers=auth_headers)
    assert resp.status_code == 404
    assert resp.json()["detail"] == "File not found"


async def test_files_invalid_body_422(client, auth_headers):
    resp = await client.post("/api/v1/files/", json={}, headers=auth_headers)
    assert resp.status_code == 422


# ---------------------------------------------------------------------------
# Menus & Menu Items
# ---------------------------------------------------------------------------

async def test_menus_requires_auth(client):
    resp = await client.get("/api/v1/menus/")
    assert resp.status_code == 401


async def test_menus_full_crud(client, auth_headers):
    resp = await client.post(
        "/api/v1/menus/",
        json={"title": "Main Menu", "handle": "main-menu", "items": [{"label": "Home", "url": "/"}]},
        headers=auth_headers,
    )
    assert resp.status_code == 201
    body = resp.json()
    assert body["title"] == "Main Menu"
    menu_id = body["id"]

    resp = await client.get("/api/v1/menus/", headers=auth_headers)
    assert resp.status_code == 200
    assert len(resp.json()) == 1

    resp = await client.get(f"/api/v1/menus/{menu_id}", headers=auth_headers)
    assert resp.status_code == 200
    assert resp.json()["handle"] == "main-menu"
    assert len(resp.json()["items"]) == 1

    resp = await client.patch(f"/api/v1/menus/{menu_id}", json={"title": "Header Menu"}, headers=auth_headers)
    assert resp.status_code == 200
    assert resp.json()["title"] == "Header Menu"

    resp = await client.delete(f"/api/v1/menus/{menu_id}", headers=auth_headers)
    assert resp.status_code == 204


async def test_menus_missing_404(client, auth_headers):
    resp = await client.get("/api/v1/menus/99999", headers=auth_headers)
    assert resp.status_code == 404
    assert resp.json()["detail"] == "Menu not found"

    resp = await client.patch("/api/v1/menus/99999", json={"title": "x"}, headers=auth_headers)
    assert resp.status_code == 404
    assert resp.json()["detail"] == "Menu not found"

    resp = await client.delete("/api/v1/menus/99999", headers=auth_headers)
    assert resp.status_code == 404
    assert resp.json()["detail"] == "Menu not found"


async def test_menus_invalid_body_422(client, auth_headers):
    resp = await client.post("/api/v1/menus/", json={}, headers=auth_headers)
    assert resp.status_code == 422


async def test_menu_items_crud(client, auth_headers, db_session):
    from app.modules.content.model import Menu

    menu = Menu(title="Main", handle="main-menu")
    db_session.add(menu)
    await db_session.commit()
    await db_session.refresh(menu)

    resp = await client.post(
        f"/api/v1/menus/{menu.id}/items",
        json={"label": "Shop", "url": "/shop", "position": 2},
        headers=auth_headers,
    )
    assert resp.status_code == 201
    body = resp.json()
    assert body["label"] == "Shop"
    assert body["menu_id"] == menu.id
    assert body["target"] == "same_window"
    item_id = body["id"]

    resp = await client.get(f"/api/v1/menus/{menu.id}/items", headers=auth_headers)
    assert resp.status_code == 200
    assert len(resp.json()) == 1

    resp = await client.patch(f"/api/v1/menus/items/{item_id}", json={"label": "Store"}, headers=auth_headers)
    assert resp.status_code == 200
    assert resp.json()["label"] == "Store"

    resp = await client.delete(f"/api/v1/menus/items/{item_id}", headers=auth_headers)
    assert resp.status_code == 204


async def test_menu_items_missing_menu_404(client, auth_headers):
    resp = await client.post("/api/v1/menus/99999/items", json={"label": "Shop"}, headers=auth_headers)
    assert resp.status_code == 404
    assert resp.json()["detail"] == "Menu not found"

    resp = await client.get("/api/v1/menus/99999/items", headers=auth_headers)
    assert resp.status_code == 404
    assert resp.json()["detail"] == "Menu not found"


async def test_menu_items_missing_item_404(client, auth_headers, db_session):
    from app.modules.content.model import Menu

    menu = Menu(title="Main", handle="main-menu")
    db_session.add(menu)
    await db_session.commit()
    await db_session.refresh(menu)

    resp = await client.patch("/api/v1/menus/items/99999", json={"label": "x"}, headers=auth_headers)
    assert resp.status_code == 404
    assert resp.json()["detail"] == "Menu item not found"

    resp = await client.delete("/api/v1/menus/items/99999", headers=auth_headers)
    assert resp.status_code == 404
    assert resp.json()["detail"] == "Menu item not found"


# ---------------------------------------------------------------------------
# URL Redirects
# ---------------------------------------------------------------------------

async def test_url_redirects_requires_auth(client):
    resp = await client.get("/api/v1/url-redirects/")
    assert resp.status_code == 401


async def test_url_redirects_full_crud(client, auth_headers):
    resp = await client.post(
        "/api/v1/url-redirects/",
        json={"from_path": "/old", "to_path": "/new"},
        headers=auth_headers,
    )
    assert resp.status_code == 201
    body = resp.json()
    assert body["from_path"] == "/old"
    assert body["redirect_type"] == 301
    redirect_id = body["id"]

    resp = await client.get("/api/v1/url-redirects/", headers=auth_headers)
    assert resp.status_code == 200
    assert len(resp.json()) == 1

    resp = await client.get(f"/api/v1/url-redirects/{redirect_id}", headers=auth_headers)
    assert resp.status_code == 200
    assert resp.json()["to_path"] == "/new"

    resp = await client.patch(f"/api/v1/url-redirects/{redirect_id}", json={"redirect_type": 302}, headers=auth_headers)
    assert resp.status_code == 200
    assert resp.json()["redirect_type"] == 302

    resp = await client.delete(f"/api/v1/url-redirects/{redirect_id}", headers=auth_headers)
    assert resp.status_code == 204


async def test_url_redirects_missing_404(client, auth_headers):
    resp = await client.get("/api/v1/url-redirects/99999", headers=auth_headers)
    assert resp.status_code == 404
    assert resp.json()["detail"] == "URL redirect not found"

    resp = await client.patch("/api/v1/url-redirects/99999", json={"to_path": "/x"}, headers=auth_headers)
    assert resp.status_code == 404
    assert resp.json()["detail"] == "URL redirect not found"

    resp = await client.delete("/api/v1/url-redirects/99999", headers=auth_headers)
    assert resp.status_code == 404
    assert resp.json()["detail"] == "URL redirect not found"


async def test_url_redirects_invalid_body_422(client, auth_headers):
    resp = await client.post("/api/v1/url-redirects/", json={}, headers=auth_headers)
    assert resp.status_code == 422


# ---------------------------------------------------------------------------
# Blog Posts
# ---------------------------------------------------------------------------

async def test_blog_posts_requires_auth(client):
    resp = await client.get("/api/v1/blog-posts/")
    assert resp.status_code == 401


async def test_blog_posts_full_crud(client, auth_headers):
    resp = await client.post(
        "/api/v1/blog-posts/",
        json={"title": "Welcome", "handle": "welcome"},
        headers=auth_headers,
    )
    assert resp.status_code == 201
    body = resp.json()
    assert body["title"] == "Welcome"
    assert body["author"] == "Eligo Leather"
    assert body["visibility"] == "Visible"
    post_id = body["id"]

    resp = await client.get("/api/v1/blog-posts/", headers=auth_headers)
    assert resp.status_code == 200
    assert len(resp.json()) == 1

    resp = await client.get(f"/api/v1/blog-posts/{post_id}", headers=auth_headers)
    assert resp.status_code == 200
    assert resp.json()["handle"] == "welcome"

    resp = await client.patch(
        f"/api/v1/blog-posts/{post_id}",
        json={"title": "Welcome Back", "visibility": "Hidden"},
        headers=auth_headers,
    )
    assert resp.status_code == 200
    assert resp.json()["title"] == "Welcome Back"
    assert resp.json()["visibility"] == "Hidden"

    resp = await client.delete(f"/api/v1/blog-posts/{post_id}", headers=auth_headers)
    assert resp.status_code == 204


async def test_blog_posts_missing_404(client, auth_headers):
    resp = await client.get("/api/v1/blog-posts/99999", headers=auth_headers)
    assert resp.status_code == 404
    assert resp.json()["detail"] == "Blog post not found"

    resp = await client.patch("/api/v1/blog-posts/99999", json={"title": "x"}, headers=auth_headers)
    assert resp.status_code == 404
    assert resp.json()["detail"] == "Blog post not found"

    resp = await client.delete("/api/v1/blog-posts/99999", headers=auth_headers)
    assert resp.status_code == 404
    assert resp.json()["detail"] == "Blog post not found"


async def test_blog_posts_invalid_body_422(client, auth_headers):
    resp = await client.post("/api/v1/blog-posts/", json={}, headers=auth_headers)
    assert resp.status_code == 422



