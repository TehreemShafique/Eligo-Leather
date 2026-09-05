"""Tests for app.modules.content.model"""

import pytest
from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError

from app.db.base import Base
from app.modules.content.model import (
    MetaobjectDefinition,
    MetaobjectEntry,
    File,
    Menu,
    MenuItem,
    UrlRedirect,
    BlogPost,
    MetaobjectStatus,
    Visibility,
    MenuTarget,
    RedirectTargetType,
)


def test_tables_registered():
    tables = set(Base.metadata.tables.keys())
    for name in (
        "metaobject_definitions",
        "metaobject_entries",
        "files",
        "menus",
        "menu_items",
        "url_redirects",
        "blog_posts",
    ):
        assert name in tables


def test_enum_values():
    assert MenuTarget.same_window.value == "same_window"
    assert MenuTarget.new_window.value == "new_window"
    assert Visibility.visible.value == "Visible"
    assert Visibility.hidden.value == "Hidden"
    assert MetaobjectStatus.active.value == "active"
    assert MetaobjectStatus.draft.value == "draft"
    assert RedirectTargetType.home.value == "Home"
    assert RedirectTargetType.custom.value == "Custom"


def test_metaobject_definition_columns():
    table = MetaobjectDefinition.__table__
    for name in (
        "id", "name", "type_key", "handle", "description", "status",
        "publish_as_web_pages", "available_on_storefront", "created_at", "updated_at",
    ):
        assert name in table.columns.keys()
    assert table.c.name.nullable is False
    assert table.c.type_key.nullable is False
    assert table.c.type_key.unique is True
    assert "ix_metaobject_definitions_type_key" in {ix.name for ix in table.indexes}


async def test_metaobject_definition_insert_defaults(db_session):
    definition = MetaobjectDefinition(name="Card", type_key="card")
    db_session.add(definition)
    await db_session.commit()
    await db_session.refresh(definition)

    assert definition.id is not None
    assert definition.available_on_storefront is False
    assert definition.publish_as_web_pages is False
    assert definition.handle is None
    assert definition.description is None
    assert definition.status == MetaobjectStatus.active
    assert definition.created_at is not None
    assert definition.updated_at is None


async def test_metaobject_definition_type_key_unique(db_session):
    db_session.add(MetaobjectDefinition(name="Card", type_key="card"))
    await db_session.commit()

    db_session.add(MetaobjectDefinition(name="Other", type_key="card"))
    with pytest.raises(IntegrityError):
        await db_session.commit()
    await db_session.rollback()


def test_metaobject_entry_columns_and_fk():
    table = MetaobjectEntry.__table__
    for name in ("id", "definition_id", "display_name", "code", "handle", "status", "tags", "references_count"):
        assert name in table.columns.keys()
    assert table.c.definition_id.nullable is False
    fk = list(table.c.definition_id.foreign_keys)[0]
    assert fk.column.table.name == "metaobject_definitions"
    assert fk.ondelete == "CASCADE"
    index_names = {ix.name for ix in table.indexes}
    assert "ix_metaobject_entries_status" in index_names
    assert "ix_metaobject_entries_definition_id" in index_names


async def test_metaobject_entry_insert_defaults(db_session):
    definition = MetaobjectDefinition(name="Card", type_key="card")
    db_session.add(definition)
    await db_session.commit()
    await db_session.refresh(definition)

    entry = MetaobjectEntry(definition_id=definition.id, display_name="E1")
    db_session.add(entry)
    await db_session.commit()
    await db_session.refresh(entry)

    assert entry.status == MetaobjectStatus.active
    assert entry.references_count == 0
    assert entry.handle is None


async def test_metaobject_definition_cascade_deletes_entries(db_session):
    definition = MetaobjectDefinition(name="Card", type_key="card")
    entry = MetaobjectEntry(definition_id=definition.id, display_name="E1")
    definition.entries.append(entry)
    db_session.add(definition)
    await db_session.commit()

    await db_session.delete(definition)
    await db_session.commit()

    count = (await db_session.execute(select(func.count(MetaobjectEntry.id)))).scalar()
    assert count == 0


def test_file_columns():
    table = File.__table__
    for name in (
        "id", "filename", "original_filename", "mime_type", "format",
        "file_size", "width", "height", "alt_text", "url", "added_by",
        "references_count", "usage", "focal_point_x", "focal_point_y", "created_at",
    ):
        assert name in table.columns.keys()
    assert table.c.filename.nullable is False
    assert table.c.url.nullable is False
    index_names = {ix.name for ix in table.indexes}
    assert "ix_files_filename" in index_names
    assert "ix_files_created_at" in index_names


async def test_file_insert_defaults(db_session):
    file_obj = File(
        filename="hero.png",
        original_filename="hero.png",
        mime_type="image/png",
        url="https://cdn.example.com/hero.png",
    )
    db_session.add(file_obj)
    await db_session.commit()
    await db_session.refresh(file_obj)

    assert file_obj.id is not None
    assert file_obj.file_size == 0
    assert file_obj.references_count == 0
    assert file_obj.format is None


def test_menu_columns_and_unique_handle():
    table = Menu.__table__
    for name in ("id", "title", "handle", "created_at", "updated_at"):
        assert name in table.columns.keys()
    assert table.c.title.nullable is False
    assert table.c.handle.nullable is False
    assert table.c.handle.unique is True


async def test_menu_handle_unique(db_session):
    db_session.add(Menu(title="Main", handle="main-menu"))
    await db_session.commit()

    db_session.add(Menu(title="Other", handle="main-menu"))
    with pytest.raises(IntegrityError):
        await db_session.commit()
    await db_session.rollback()


def test_menu_item_columns():
    table = MenuItem.__table__
    for name in ("id", "menu_id", "parent_id", "label", "url", "target", "position", "created_at"):
        assert name in table.columns.keys()
    assert table.c.label.nullable is False
    parent_fk = list(table.c.parent_id.foreign_keys)[0]
    assert parent_fk.column.table.name == "menu_items"


async def test_menu_item_insert_defaults(db_session):
    menu = Menu(title="Main", handle="main-menu")
    db_session.add(menu)
    await db_session.commit()
    await db_session.refresh(menu)

    item = MenuItem(menu_id=menu.id, label="Home")
    db_session.add(item)
    await db_session.commit()
    await db_session.refresh(item)

    assert item.url == "/"
    assert item.target == MenuTarget.same_window
    assert item.position == 0
    assert item.parent_id is None


def test_url_redirect_columns():
    table = UrlRedirect.__table__
    for name in ("id", "from_path", "to_path", "target_type", "redirect_type", "created_at"):
        assert name in table.columns.keys()
    assert table.c.from_path.nullable is False
    assert table.c.to_path.nullable is False
    assert "ix_url_redirects_from_path" in {ix.name for ix in table.indexes}


async def test_url_redirect_insert_defaults(db_session):
    redirect = UrlRedirect(from_path="/old", to_path="/new")
    db_session.add(redirect)
    await db_session.commit()
    await db_session.refresh(redirect)

    assert redirect.redirect_type == 301
    assert redirect.target_type is None


def test_blog_post_columns_and_unique_handle():
    table = BlogPost.__table__
    for name in (
        "id", "title", "handle", "body", "excerpt", "author", "blog", "tags",
        "visibility", "featured_image_url", "published_at", "created_at", "updated_at",
    ):
        assert name in table.columns.keys()
    assert table.c.title.nullable is False
    assert table.c.handle.nullable is False
    assert table.c.handle.unique is True
    index_names = {ix.name for ix in table.indexes}
    assert "ix_blog_posts_handle" in index_names
    assert "ix_blog_posts_author" in index_names
    assert "ix_blog_posts_published_at" in index_names


async def test_blog_post_insert_defaults(db_session):
    post = BlogPost(title="Welcome", handle="welcome")
    db_session.add(post)
    await db_session.commit()
    await db_session.refresh(post)

    assert post.author == "Eligo Leather"
    assert post.blog == "News"
    assert post.visibility == Visibility.visible
    assert post.published_at is None


async def test_blog_post_handle_unique(db_session):
    db_session.add(BlogPost(title="A", handle="news"))
    await db_session.commit()

    db_session.add(BlogPost(title="B", handle="news"))
    with pytest.raises(IntegrityError):
        await db_session.commit()
    await db_session.rollback()
