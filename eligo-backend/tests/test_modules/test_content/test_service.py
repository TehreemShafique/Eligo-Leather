"""Tests for app.modules.content.service"""

from app.modules.content import service
from app.modules.content.model import (
    MetaobjectStatus,
    MenuTarget,
    BlogPost,
)
from app.modules.content.schema import (
    MetaobjectDefinitionCreate,
    MetaobjectDefinitionUpdate,
    MetaobjectDefinitionFieldCreate,
    MetaobjectEntryCreate,
    MetaobjectEntryUpdate,
    FileCreate,
    FileUpdate,
    MenuCreate,
    MenuUpdate,
    MenuItemCreate,
    MenuItemUpdate,
    UrlRedirectCreate,
    UrlRedirectUpdate,
    BlogPostCreate,
    BlogPostUpdate,
)


# ---------------------------------------------------------------------------
# Metaobject Definitions
# ---------------------------------------------------------------------------

async def test_metaobject_definition_crud(db_session):
    definition = await service.create_metaobject_definition(
        db_session, MetaobjectDefinitionCreate(name="Card", type_key="card"),
    )
    assert definition.id is not None
    assert definition.name == "Card"
    assert definition.available_on_storefront is False

    listed = await service.list_metaobject_definitions(db_session, search="Card")
    assert [d.id for d in listed] == [definition.id]
    assert await service.list_metaobject_definitions(db_session, search="nomatch") == []

    fetched = await service.get_metaobject_definition(db_session, definition.id)
    assert fetched is not None
    assert fetched.name == "Card"
    assert await service.get_metaobject_definition(db_session, 99999) is None

    updated = await service.update_metaobject_definition(
        db_session, definition.id, MetaobjectDefinitionUpdate(name="Banner", available_on_storefront=True),
    )
    assert updated.name == "Banner"
    assert updated.available_on_storefront is True
    assert await service.update_metaobject_definition(
        db_session, 99999, MetaobjectDefinitionUpdate(name="x"),
    ) is None

    with_fields = await service.update_metaobject_definition(
        db_session, definition.id,
        MetaobjectDefinitionUpdate(
            description="Rebuilt fields",
            fields=[
                MetaobjectDefinitionFieldCreate(
                    label="Title", field_type="Single line text",
                    cardinality="one", required=True,
                    is_display_name=True, is_filterable=False, position=0,
                ),
                MetaobjectDefinitionFieldCreate(
                    label="Color", field_type="Color",
                    cardinality="one", required=False,
                    is_display_name=False, is_filterable=True, position=1,
                ),
            ],
        ),
    )
    assert with_fields.description == "Rebuilt fields"
    rebuilt = await service.get_metaobject_definition(db_session, definition.id)
    assert [f.label for f in rebuilt.fields] == ["Title", "Color"]
    assert all(f.definition_id == rebuilt.id for f in rebuilt.fields)
    assert rebuilt.fields[1].is_filterable is True

    assert await service.delete_metaobject_definition(db_session, definition.id) is True
    assert await service.delete_metaobject_definition(db_session, definition.id) is False
    assert await service.get_metaobject_definition(db_session, definition.id) is None


# ---------------------------------------------------------------------------
# Metaobject Entries
# ---------------------------------------------------------------------------

async def test_metaobject_entry_crud_and_filters(db_session):
    definition = await service.create_metaobject_definition(
        db_session, MetaobjectDefinitionCreate(name="Card", type_key="card", available_on_storefront=True),
    )
    entry = await service.create_metaobject_entry(
        db_session, MetaobjectEntryCreate(definition_id=definition.id, display_name="E1", handle="e1"),
    )
    assert entry.id is not None
    assert entry.status == MetaobjectStatus.active
    assert entry.references_count == 0

    fetched = await service.get_metaobject_entry(db_session, entry.id)
    assert fetched is not None
    assert fetched.definition_id == definition.id
    assert await service.get_metaobject_entry(db_session, 99999) is None

    assert len(await service.list_metaobject_entries(db_session, definition_id=definition.id)) == 1
    assert len(await service.list_metaobject_entries(db_session, status="active")) == 1
    assert len(await service.list_metaobject_entries(db_session, status="draft")) == 0
    assert len(await service.list_metaobject_entries(db_session, available_on_storefront=True)) == 1
    assert len(await service.list_metaobject_entries(db_session, available_on_storefront=False)) == 0
    assert len(await service.list_metaobject_entries(db_session, search="e1")) == 1

    updated = await service.update_metaobject_entry(
        db_session, entry.id, MetaobjectEntryUpdate(display_name="E2", status="draft"),
    )
    assert updated.display_name == "E2"
    assert updated.status == MetaobjectStatus.draft
    assert await service.update_metaobject_entry(
        db_session, 99999, MetaobjectEntryUpdate(display_name="x"),
    ) is None

    assert await service.delete_metaobject_entry(db_session, entry.id) is True
    assert await service.delete_metaobject_entry(db_session, entry.id) is False


# ---------------------------------------------------------------------------
# Files
# ---------------------------------------------------------------------------

async def test_file_crud_and_filters(db_session):
    file_obj = await service.create_file(
        db_session,
        FileCreate(
            filename="hero.png",
            original_filename="hero.png",
            mime_type="image/png",
            url="https://cdn.example.com/hero.png",
            alt_text="Hero image",
        ),
    )
    assert file_obj.id is not None
    assert file_obj.file_size == 0
    assert file_obj.references_count == 0

    fetched = await service.get_file(db_session, file_obj.id)
    assert fetched is not None
    assert fetched.filename == "hero.webp"
    assert fetched.mime_type == "image/webp"
    assert await service.get_file(db_session, 99999) is None

    assert len(await service.list_files(db_session, search="hero")) == 1
    assert len(await service.list_files(db_session, mime_type="image/webp")) == 1
    assert len(await service.list_files(db_session, mime_type="application/pdf")) == 0

    updated = await service.update_file(db_session, file_obj.id, FileUpdate(alt_text="New alt"))
    assert updated.alt_text == "New alt"
    assert await service.update_file(db_session, 99999, FileUpdate(alt_text="x")) is None

    assert await service.delete_file(db_session, file_obj.id) is True
    assert await service.delete_file(db_session, file_obj.id) is False


# ---------------------------------------------------------------------------
# Menus & Menu Items
# ---------------------------------------------------------------------------

async def test_menu_crud_with_items(db_session):
    menu = await service.create_menu(
        db_session,
        MenuCreate(
            title="Main Menu",
            handle="main-menu",
            items=[MenuItemCreate(label="Home", url="/"), MenuItemCreate(label="Shop", url="/shop")],
        ),
    )
    assert menu.id is not None
    assert len(menu.items) == 2
    assert menu.items[0].label == "Home"
    assert menu.items[0].target == MenuTarget.same_window

    fetched = await service.get_menu(db_session, menu.id)
    assert fetched is not None
    assert len(fetched.items) == 2
    assert await service.get_menu(db_session, 99999) is None

    assert len(await service.list_menus(db_session, search="Main")) == 1
    assert len(await service.list_menus(db_session, search="nomatch")) == 0

    updated = await service.update_menu(db_session, menu.id, MenuUpdate(title="Header Menu"))
    assert updated.title == "Header Menu"
    assert await service.update_menu(db_session, 99999, MenuUpdate(title="x")) is None

    assert await service.delete_menu(db_session, menu.id) is True
    assert await service.delete_menu(db_session, menu.id) is False


async def test_menu_item_crud(db_session):
    menu = await service.create_menu(db_session, MenuCreate(title="Main", handle="main-menu"))
    item = await service.create_menu_item(
        db_session, menu.id, MenuItemCreate(label="Shop", url="/shop", position=2),
    )
    assert item.id is not None
    assert item.menu_id == menu.id
    assert item.position == 2
    assert item.target == MenuTarget.same_window

    fetched = await service.get_menu_item(db_session, item.id)
    assert fetched is not None
    assert fetched.label == "Shop"
    assert await service.get_menu_item(db_session, 99999) is None

    updated = await service.update_menu_item(
        db_session, item.id, MenuItemUpdate(label="Store", position=1),
    )
    assert updated.label == "Store"
    assert updated.position == 1
    assert await service.update_menu_item(db_session, 99999, MenuItemUpdate(label="x")) is None

    assert await service.delete_menu_item(db_session, item.id) is True
    assert await service.delete_menu_item(db_session, item.id) is False


# ---------------------------------------------------------------------------
# URL Redirects
# ---------------------------------------------------------------------------

async def test_url_redirect_crud(db_session):
    redirect = await service.create_url_redirect(
        db_session, UrlRedirectCreate(from_path="/old", to_path="/new"),
    )
    assert redirect.id is not None
    assert redirect.redirect_type == 301
    assert redirect.target_type is None

    fetched = await service.get_url_redirect(db_session, redirect.id)
    assert fetched is not None
    assert fetched.from_path == "/old"
    assert await service.get_url_redirect(db_session, 99999) is None

    assert len(await service.list_url_redirects(db_session, search="old")) == 1
    assert len(await service.list_url_redirects(db_session, search="nomatch")) == 0

    updated = await service.update_url_redirect(
        db_session, redirect.id, UrlRedirectUpdate(to_path="/brand-new", redirect_type=302),
    )
    assert updated.to_path == "/brand-new"
    assert updated.redirect_type == 302
    assert await service.update_url_redirect(
        db_session, 99999, UrlRedirectUpdate(to_path="/x"),
    ) is None

    assert await service.delete_url_redirect(db_session, redirect.id) is True
    assert await service.delete_url_redirect(db_session, redirect.id) is False


# ---------------------------------------------------------------------------
# Blog Posts
# ---------------------------------------------------------------------------

async def test_blog_post_crud_and_filters(db_session):
    post = await service.create_blog_post(
        db_session, BlogPostCreate(title="Welcome", handle="welcome", author="Alice"),
    )
    assert post.id is not None
    assert post.author == "Alice"
    assert post.visibility.value == "Visible"

    fetched = await service.get_blog_post(db_session, post.id)
    assert fetched is not None
    assert fetched.title == "Welcome"
    assert await service.get_blog_post(db_session, 99999) is None

    assert len(await service.list_blog_posts(db_session, search="Welcome")) == 1
    assert len(await service.list_blog_posts(db_session, author="Alice")) == 1
    assert len(await service.list_blog_posts(db_session, author="Bob")) == 0
    assert len(await service.list_blog_posts(db_session, blog="News")) == 1
    assert len(await service.list_blog_posts(db_session, visibility="visible")) == 1

    updated = await service.update_blog_post(
        db_session, post.id, BlogPostUpdate(title="Welcome Back", blog="Updates"),
    )
    assert updated.title == "Welcome Back"
    assert updated.blog == "Updates"
    assert await service.update_blog_post(db_session, 99999, BlogPostUpdate(title="x")) is None

    assert await service.delete_blog_post(db_session, post.id) is True
    assert await service.delete_blog_post(db_session, post.id) is False


# ---------------------------------------------------------------------------
# Content Overview
# ---------------------------------------------------------------------------

async def test_get_content_overview(db_session):
    definition = await service.create_metaobject_definition(
        db_session,
        MetaobjectDefinitionCreate(name="Card", type_key="card", available_on_storefront=True),
    )
    await service.create_metaobject_entry(
        db_session, MetaobjectEntryCreate(definition_id=definition.id, display_name="E1"),
    )
    await service.create_file(
        db_session,
        FileCreate(filename="a.png", original_filename="a.png", mime_type="image/png", url="u"),
    )
    await service.create_menu(db_session, MenuCreate(title="Main", handle="main-menu"))
    await service.create_url_redirect(db_session, UrlRedirectCreate(from_path="/a", to_path="/b"))
    post = await service.create_blog_post(db_session, BlogPostCreate(title="Post", handle="post-9"))

    overview = await service.get_content_overview(db_session)

    assert overview.metaobjects.total_definitions == 1
    assert overview.metaobjects.total_entries == 1
    assert overview.metaobjects.active_entries == 1
    assert overview.metaobjects.draft_entries == 0
    assert overview.metaobjects.available_on_storefront == 1
    assert len(overview.metaobjects.definitions) == 1
    assert overview.metaobjects.definitions[0].entry_count == 1

    assert overview.files_count == 1
    assert overview.menus_count == 1
    assert overview.url_redirects_count == 1

    assert overview.blog.total_posts == 1
    assert overview.blog.visible_posts == 1
    assert overview.blog.hidden_posts == 0
