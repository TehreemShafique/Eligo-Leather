from datetime import datetime
import json

from sqlalchemy import select, func, or_, delete
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.modules.content.model import (
    MetaobjectDefinition,
    MetaobjectEntry,
    MetaobjectDefinitionField,
    MetaobjectEntryValue,
    File,
    Menu,
    MenuItem,
    UrlRedirect,
    BlogPost,
    BlogComment,
    Page,
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
    BlogCommentCreate,
    BlogCommentUpdate,
    PageCreate,
    PageUpdate,
    ContentOverview,
    MetaobjectSummary,
    MetaobjectDefinitionSummary,
    BlogSummary,
)


# ===========================================================================
# Metaobject Definition – CRUD
# ===========================================================================

async def create_metaobject_definition(
    db: AsyncSession, data: MetaobjectDefinitionCreate,
) -> MetaobjectDefinition:
    obj = MetaobjectDefinition(
        name=data.name,
        type_key=data.type_key,
        handle=data.handle,
        description=data.description,
        status=data.status,
        publish_as_web_pages=data.publish_as_web_pages,
        available_on_storefront=data.available_on_storefront,
    )
    db.add(obj)
    await db.flush()  # Get the ID before adding fields

    # Create fields if provided
    for field_data in data.fields:
        field = MetaobjectDefinitionField(
            definition_id=obj.id,
            label=field_data.label,
            field_type=field_data.field_type,
            cardinality=field_data.cardinality,
            required=field_data.required,
            is_display_name=field_data.is_display_name,
            is_filterable=field_data.is_filterable,
            position=field_data.position,
            config=json.dumps(field_data.config) if field_data.config else None,
        )
        db.add(field)

    await db.commit()
    await db.refresh(obj)
    return obj


async def get_metaobject_definition(
    db: AsyncSession, def_id: int,
) -> MetaobjectDefinition | None:
    result = await db.execute(
        select(MetaobjectDefinition)
        .options(
            selectinload(MetaobjectDefinition.fields),
            selectinload(MetaobjectDefinition.entries).selectinload(MetaobjectEntry.field_values),
        )
        .where(MetaobjectDefinition.id == def_id),
    )
    return result.scalar_one_or_none()


async def list_metaobject_definitions(
    db: AsyncSession,
    search: str | None = None,
    skip: int = 0,
    limit: int = 50,
) -> list[MetaobjectDefinition]:
    query = select(MetaobjectDefinition).options(
        selectinload(MetaobjectDefinition.fields),
    )
    if search:
        query = query.where(
            or_(
                MetaobjectDefinition.name.ilike(f"%{search}%"),
                MetaobjectDefinition.type_key.ilike(f"%{search}%"),
            ),
        )
    query = query.order_by(MetaobjectDefinition.created_at.desc()).offset(skip).limit(limit)
    result = await db.execute(query)
    return list(result.scalars().all())


async def update_metaobject_definition(
    db: AsyncSession, def_id: int, data: MetaobjectDefinitionUpdate,
) -> MetaobjectDefinition | None:
    obj = await get_metaobject_definition(db, def_id)
    if not obj:
        return None

    # Update definition fields
    update_data = data.model_dump(exclude_unset=True)
    fields_data = update_data.pop("fields", None)

    for field, value in update_data.items():
        setattr(obj, field, value)

    # Update fields if provided
    if fields_data is not None:
        # Delete existing fields
        for existing_field in obj.fields:
            await db.delete(existing_field)
        await db.flush()

        # Create new fields
        for field_data in fields_data:
            field = MetaobjectDefinitionField(
                definition_id=obj.id,
                label=field_data.label,
                field_type=field_data.field_type,
                cardinality=field_data.cardinality,
                required=field_data.required,
                is_display_name=field_data.is_display_name,
                is_filterable=field_data.is_filterable,
                position=field_data.position,
                config=json.dumps(field_data.config) if field_data.config else None,
            )
            db.add(field)

    await db.commit()
    await db.refresh(obj)
    return obj


async def delete_metaobject_definition(db: AsyncSession, def_id: int) -> bool:
    obj = await get_metaobject_definition(db, def_id)
    if not obj:
        return False
    await db.delete(obj)
    await db.commit()
    return True


# ===========================================================================
# Metaobject Entry – CRUD
# ===========================================================================

async def create_metaobject_entry(
    db: AsyncSession, data: MetaobjectEntryCreate,
) -> MetaobjectEntry:
    obj = MetaobjectEntry(
        definition_id=data.definition_id,
        display_name=data.display_name,
        handle=data.handle,
        status=data.status,
        tags=data.tags,
        added_by=data.added_by,
    )
    db.add(obj)
    await db.flush()  # Get the ID before adding field values

    # Create field values if provided
    for value_data in data.field_values:
        field_value = MetaobjectEntryValue(
            entry_id=obj.id,
            field_id=value_data.field_id,
            value=value_data.value,
            reference_id=value_data.reference_id,
            reference_type=value_data.reference_type,
        )
        db.add(field_value)

    await db.commit()
    await db.refresh(obj)
    return obj


async def get_metaobject_entry(
    db: AsyncSession, entry_id: int,
) -> MetaobjectEntry | None:
    result = await db.execute(
        select(MetaobjectEntry)
        .options(
            selectinload(MetaobjectEntry.definition).selectinload(MetaobjectDefinition.fields),
            selectinload(MetaobjectEntry.field_values),
        )
        .where(MetaobjectEntry.id == entry_id),
    )
    return result.scalar_one_or_none()


async def list_metaobject_entries(
    db: AsyncSession,
    definition_id: int | None = None,
    status: str | None = None,
    available_on_storefront: bool | None = None,
    search: str | None = None,
    skip: int = 0,
    limit: int = 50,
) -> list[MetaobjectEntry]:
    query = select(MetaobjectEntry).options(
        selectinload(MetaobjectEntry.definition).selectinload(MetaobjectDefinition.fields),
        selectinload(MetaobjectEntry.field_values),
    )
    if definition_id:
        query = query.where(MetaobjectEntry.definition_id == definition_id)
    if status:
        query = query.where(MetaobjectEntry.status == status)
    if available_on_storefront is not None:
        query = query.join(MetaobjectDefinition).where(
            MetaobjectDefinition.available_on_storefront == available_on_storefront,
        )
    if search:
        query = query.where(
            or_(
                MetaobjectEntry.display_name.ilike(f"%{search}%"),
                MetaobjectEntry.tags.ilike(f"%{search}%"),
                MetaobjectEntry.handle.ilike(f"%{search}%"),
            ),
        )
    query = query.order_by(MetaobjectEntry.updated_at.desc().nullslast()).offset(skip).limit(limit)
    result = await db.execute(query)
    return list(result.scalars().all())


async def update_metaobject_entry(
    db: AsyncSession, entry_id: int, data: MetaobjectEntryUpdate,
) -> MetaobjectEntry | None:
    obj = await get_metaobject_entry(db, entry_id)
    if not obj:
        return None

    # Update entry fields
    update_data = data.model_dump(exclude_unset=True)
    field_values_data = update_data.pop("field_values", None)

    for field, value in update_data.items():
        setattr(obj, field, value)

    # Update field values if provided
    if field_values_data is not None:
        # Delete existing field values
        for existing_value in obj.field_values:
            await db.delete(existing_value)
        await db.flush()

        # Create new field values
        for value_data in field_values_data:
            field_value = MetaobjectEntryValue(
                entry_id=obj.id,
                field_id=value_data.field_id,
                value=value_data.value,
                reference_id=value_data.reference_id,
                reference_type=value_data.reference_type,
            )
            db.add(field_value)

    await db.commit()
    await db.refresh(obj)
    return obj


async def delete_metaobject_entry(db: AsyncSession, entry_id: int) -> bool:
    obj = await get_metaobject_entry(db, entry_id)
    if not obj:
        return False
    await db.delete(obj)
    await db.commit()
    return True


import io
import re
import uuid
from pathlib import Path

# Uploaded media lives next to the backend root and is served by the
# StaticFiles mount at /static (see app.main).
UPLOADS_DIR = Path(__file__).resolve().parents[3] / "static" / "uploads"


def save_upload_to_disk(data: bytes, filename: str) -> str:
    """Persists uploaded bytes under static/uploads and returns its public URL."""
    suffix = Path(filename).suffix
    safe_stem = re.sub(r"[^A-Za-z0-9_-]+", "_", Path(filename).stem)[:60] or "file"
    unique_name = f"{uuid.uuid4().hex[:8]}_{safe_stem}{suffix}"
    UPLOADS_DIR.mkdir(parents=True, exist_ok=True)
    (UPLOADS_DIR / unique_name).write_bytes(data)
    return f"/static/uploads/{unique_name}"


def convert_image_to_webp(image_bytes: bytes, filename: str) -> tuple[bytes, str, str]:
    """Converts any uploaded image (PNG, JPG, BMP, GIF, etc.) to WebP format.

    Returns: (webp_bytes, webp_filename, 'image/webp')
    """
    try:
        from PIL import Image

        img = Image.open(io.BytesIO(image_bytes))
        output_buffer = io.BytesIO()

        if img.mode in ("RGBA", "LA") or (img.mode == "P" and "transparency" in img.info):
            img = img.convert("RGBA")
        else:
            img = img.convert("RGB")

        img.save(output_buffer, format="WEBP", quality=85, optimize=True)
        webp_bytes = output_buffer.getvalue()

        base_name = filename.rsplit(".", 1)[0] if "." in filename else filename
        webp_filename = f"{base_name}.webp"

        return webp_bytes, webp_filename, "image/webp"
    except Exception:
        ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else ""
        mime = f"image/{ext}" if ext in ("png", "jpg", "jpeg", "webp", "gif") else "application/octet-stream"
        return image_bytes, filename, mime


# ===========================================================================
# Files – CRUD
# ===========================================================================

async def create_file(
    db: AsyncSession, data: FileCreate,
) -> File:
    # If image file creation is called with raw non-webp, ensure WebP extension and MIME
    original_name = data.original_filename or data.filename
    if data.mime_type.startswith("image/") and not data.filename.endswith(".webp"):
        base_name = data.filename.rsplit(".", 1)[0] if "." in data.filename else data.filename
        data.filename = f"{base_name}.webp"
        data.mime_type = "image/webp"

    obj = File(**data.model_dump())
    db.add(obj)
    await db.commit()
    await db.refresh(obj)
    return obj


async def get_file(
    db: AsyncSession, file_id: int,
) -> File | None:
    result = await db.execute(
        select(File).where(File.id == file_id),
    )
    return result.scalar_one_or_none()


async def list_files(
    db: AsyncSession,
    search: str | None = None,
    mime_type: str | None = None,
    skip: int = 0,
    limit: int = 50,
) -> list[File]:
    query = select(File)
    if search:
        query = query.where(
            or_(
                File.filename.ilike(f"%{search}%"),
                File.alt_text.ilike(f"%{search}%"),
                File.original_filename.ilike(f"%{search}%"),
            ),
        )
    if mime_type:
        query = query.where(File.mime_type.ilike(f"%{mime_type}%"))
    query = query.order_by(File.created_at.desc()).offset(skip).limit(limit)
    result = await db.execute(query)
    return list(result.scalars().all())


async def update_file(
    db: AsyncSession, file_id: int, data: FileUpdate,
) -> File | None:
    obj = await get_file(db, file_id)
    if not obj:
        return None
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(obj, field, value)
    await db.commit()
    await db.refresh(obj)
    return obj


async def delete_file(db: AsyncSession, file_id: int) -> bool:
    obj = await get_file(db, file_id)
    if not obj:
        return False
    await db.delete(obj)
    await db.commit()
    return True


# ===========================================================================
# Menu – CRUD
# ===========================================================================

async def create_menu(
    db: AsyncSession, data: MenuCreate,
) -> Menu:
    items_data = data.items
    menu = Menu(title=data.title, handle=data.handle)
    if items_data:
        menu.items = [
            MenuItem(
                label=item.label,
                url=item.url,
                target=item.target,
                position=item.position,
                parent_id=item.parent_id,
            )
            for item in items_data
        ]
    db.add(menu)
    await db.commit()
    await db.refresh(menu, attribute_names=["items"])
    return menu


async def get_menu(
    db: AsyncSession, menu_id: int,
) -> Menu | None:
    result = await db.execute(
        select(Menu)
        .options(selectinload(Menu.items))
        .where(Menu.id == menu_id),
    )
    return result.scalar_one_or_none()


async def list_menus(
    db: AsyncSession,
    search: str | None = None,
    skip: int = 0,
    limit: int = 50,
) -> list[Menu]:
    query = select(Menu)
    if search:
        query = query.where(
            or_(
                Menu.title.ilike(f"%{search}%"),
                Menu.handle.ilike(f"%{search}%"),
            ),
        )
    query = query.order_by(Menu.created_at.desc()).offset(skip).limit(limit)
    result = await db.execute(query)
    return list(result.scalars().all())


async def update_menu(
    db: AsyncSession, menu_id: int, data: MenuUpdate,
) -> Menu | None:
    obj = await get_menu(db, menu_id)
    if not obj:
        return None
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(obj, field, value)
    await db.commit()
    await db.refresh(obj)
    return obj


async def delete_menu(db: AsyncSession, menu_id: int) -> bool:
    obj = await get_menu(db, menu_id)
    if not obj:
        return False
    await db.delete(obj)
    await db.commit()
    return True


# ===========================================================================
# Menu Item – CRUD
# ===========================================================================

async def create_menu_item(
    db: AsyncSession, menu_id: int, data: MenuItemCreate,
) -> MenuItem:
    item = MenuItem(menu_id=menu_id, **data.model_dump())
    db.add(item)
    await db.commit()
    await db.refresh(item)
    return item


async def get_menu_item(
    db: AsyncSession, item_id: int,
) -> MenuItem | None:
    result = await db.execute(
        select(MenuItem).where(MenuItem.id == item_id),
    )
    return result.scalar_one_or_none()


async def update_menu_item(
    db: AsyncSession, item_id: int, data: MenuItemUpdate,
) -> MenuItem | None:
    obj = await get_menu_item(db, item_id)
    if not obj:
        return None
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(obj, field, value)
    await db.commit()
    await db.refresh(obj)
    return obj


async def delete_menu_item(db: AsyncSession, item_id: int) -> bool:
    obj = await get_menu_item(db, item_id)
    if not obj:
        return False
    await db.delete(obj)
    await db.commit()
    return True


# ===========================================================================
# URL Redirect – CRUD
# ===========================================================================

async def create_url_redirect(
    db: AsyncSession, data: UrlRedirectCreate,
) -> UrlRedirect:
    obj = UrlRedirect(**data.model_dump())
    db.add(obj)
    await db.commit()
    await db.refresh(obj)
    return obj


async def get_url_redirect(
    db: AsyncSession, redirect_id: int,
) -> UrlRedirect | None:
    result = await db.execute(
        select(UrlRedirect).where(UrlRedirect.id == redirect_id),
    )
    return result.scalar_one_or_none()


async def list_url_redirects(
    db: AsyncSession,
    search: str | None = None,
    skip: int = 0,
    limit: int = 50,
) -> list[UrlRedirect]:
    query = select(UrlRedirect)
    if search:
        query = query.where(
            or_(
                UrlRedirect.from_path.ilike(f"%{search}%"),
                UrlRedirect.to_path.ilike(f"%{search}%"),
            ),
        )
    query = query.order_by(UrlRedirect.created_at.desc()).offset(skip).limit(limit)
    result = await db.execute(query)
    return list(result.scalars().all())


async def update_url_redirect(
    db: AsyncSession, redirect_id: int, data: UrlRedirectUpdate,
) -> UrlRedirect | None:
    obj = await get_url_redirect(db, redirect_id)
    if not obj:
        return None
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(obj, field, value)
    await db.commit()
    await db.refresh(obj)
    return obj


async def delete_url_redirect(db: AsyncSession, redirect_id: int) -> bool:
    obj = await get_url_redirect(db, redirect_id)
    if not obj:
        return False
    await db.delete(obj)
    await db.commit()
    return True


# ===========================================================================
# Blog Post – CRUD
# ===========================================================================

async def create_blog_post(
    db: AsyncSession, data: BlogPostCreate,
) -> BlogPost:
    obj = BlogPost(**data.model_dump())
    db.add(obj)
    await db.commit()
    await db.refresh(obj)
    return obj


async def get_blog_post(
    db: AsyncSession, post_id: int,
) -> BlogPost | None:
    result = await db.execute(
        select(BlogPost)
        .options(selectinload(BlogPost.comments))
        .where(BlogPost.id == post_id),
    )
    return result.scalar_one_or_none()


async def list_blog_posts(
    db: AsyncSession,
    search: str | None = None,
    author: str | None = None,
    blog: str | None = None,
    visibility: str | None = None,
    skip: int = 0,
    limit: int = 50,
) -> list[BlogPost]:
    query = select(BlogPost)
    if search:
        query = query.where(
            or_(
                BlogPost.title.ilike(f"%{search}%"),
                BlogPost.tags.ilike(f"%{search}%"),
            ),
        )
    if author:
        query = query.where(BlogPost.author == author)
    if blog:
        query = query.where(BlogPost.blog == blog)
    if visibility:
        query = query.where(BlogPost.visibility == visibility)
    query = query.order_by(BlogPost.updated_at.desc().nullslast()).offset(skip).limit(limit)
    result = await db.execute(query)
    return list(result.scalars().all())


async def update_blog_post(
    db: AsyncSession, post_id: int, data: BlogPostUpdate,
) -> BlogPost | None:
    obj = await get_blog_post(db, post_id)
    if not obj:
        return None
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(obj, field, value)
    await db.commit()
    await db.refresh(obj)
    return obj


async def delete_blog_post(db: AsyncSession, post_id: int) -> bool:
    obj = await get_blog_post(db, post_id)
    if not obj:
        return False
    await db.delete(obj)
    await db.commit()
    return True


# ===========================================================================
# Blog Comment – CRUD
# ===========================================================================

async def create_blog_comment(
    db: AsyncSession, data: BlogCommentCreate,
) -> BlogComment:
    obj = BlogComment(**data.model_dump())
    db.add(obj)
    await db.commit()
    await db.refresh(obj)
    return obj


async def get_blog_comment(
    db: AsyncSession, comment_id: int,
) -> BlogComment | None:
    result = await db.execute(
        select(BlogComment).where(BlogComment.id == comment_id),
    )
    return result.scalar_one_or_none()


async def list_blog_comments(
    db: AsyncSession,
    post_id: int | None = None,
    status: str | None = None,
    skip: int = 0,
    limit: int = 50,
) -> list[BlogComment]:
    query = select(BlogComment)
    if post_id:
        query = query.where(BlogComment.post_id == post_id)
    if status:
        query = query.where(BlogComment.status == status)
    query = query.order_by(BlogComment.created_at.desc()).offset(skip).limit(limit)
    result = await db.execute(query)
    return list(result.scalars().all())


async def update_blog_comment(
    db: AsyncSession, comment_id: int, data: BlogCommentUpdate,
) -> BlogComment | None:
    obj = await get_blog_comment(db, comment_id)
    if not obj:
        return None
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(obj, field, value)
    await db.commit()
    await db.refresh(obj)
    return obj


async def delete_blog_comment(db: AsyncSession, comment_id: int) -> bool:
    obj = await get_blog_comment(db, comment_id)
    if not obj:
        return False
    await db.delete(obj)
    await db.commit()
    return True


# ===========================================================================
# Content Overview – Dashboard aggregations
# ===========================================================================

async def get_content_overview(db: AsyncSession) -> ContentOverview:
    # --- Metaobject definitions + entry breakdown per definition ---
    defs_result = await db.execute(select(MetaobjectDefinition))
    all_defs = list(defs_result.scalars().all())

    total_entries = 0
    active_entries = 0
    draft_entries = 0
    available_on_storefront = 0
    definitions_summary: list[MetaobjectDefinitionSummary] = []

    for d in all_defs:
        entry_q = await db.execute(
            select(
                func.coalesce(func.count(MetaobjectEntry.id), 0).label("total"),
                func.coalesce(
                    func.count(MetaobjectEntry.id).filter(
                        MetaobjectEntry.status == "active",
                    ), 0,
                ).label("active"),
                func.coalesce(
                    func.count(MetaobjectEntry.id).filter(
                        MetaobjectEntry.status == "draft",
                    ), 0,
                ).label("draft"),
            ).where(MetaobjectEntry.definition_id == d.id),
        )
        row = entry_q.one()
        total_entries += int(row.total)
        active_entries += int(row.active)
        draft_entries += int(row.draft)
        if d.available_on_storefront:
            available_on_storefront += int(row.total)
        definitions_summary.append(
            MetaobjectDefinitionSummary(
                definition_id=d.id,
                name=d.name,
                type_key=d.type_key,
                entry_count=int(row.total),
                active_count=int(row.active),
                draft_count=int(row.draft),
            ),
        )

    # --- Files count ---
    files_result = await db.execute(select(func.count(File.id)))
    files_count = files_result.scalar() or 0

    # --- Menus count ---
    menus_result = await db.execute(select(func.count(Menu.id)))
    menus_count = menus_result.scalar() or 0

    # --- URL Redirects count ---
    redirects_result = await db.execute(select(func.count(UrlRedirect.id)))
    url_redirects_count = redirects_result.scalar() or 0

    # --- Blog summary ---
    blog_counts = await db.execute(
        select(
            func.coalesce(func.count(BlogPost.id), 0).label("total"),
            func.coalesce(
                func.count(BlogPost.id).filter(
                    BlogPost.visibility == "Visible",
                ), 0,
            ).label("visible"),
            func.coalesce(
                func.count(BlogPost.id).filter(
                    BlogPost.visibility == "Hidden",
                ), 0,
            ).label("hidden"),
        ),
    )
    blog_row = blog_counts.one()

    comment_counts = await db.execute(
        select(
            func.coalesce(func.count(BlogComment.id), 0).label("total"),
            func.coalesce(
                func.count(BlogComment.id).filter(
                    BlogComment.status == "pending",
                ), 0,
            ).label("pending"),
        ),
    )
    comment_row = comment_counts.one()

    return ContentOverview(
        metaobjects=MetaobjectSummary(
            total_definitions=len(all_defs),
            total_entries=total_entries,
            active_entries=active_entries,
            draft_entries=draft_entries,
            available_on_storefront=available_on_storefront,
            definitions=definitions_summary,
        ),
        files_count=files_count,
        menus_count=menus_count,
        url_redirects_count=url_redirects_count,
        blog=BlogSummary(
            total_posts=int(blog_row.total),
            visible_posts=int(blog_row.visible),
            hidden_posts=int(blog_row.hidden),
            pending_comments=int(comment_row.pending),
            total_comments=int(comment_row.total),
        ),
    )


# ===========================================================================
# Pages – CRUD
# ===========================================================================

async def create_page(db: AsyncSession, data: PageCreate) -> Page:
    payload = data.model_dump()
    if not payload.get("handle"):
        payload["handle"] = payload["title"].lower().replace(" ", "-")
    obj = Page(**payload)
    db.add(obj)
    await db.commit()
    await db.refresh(obj)
    return obj


async def get_page(db: AsyncSession, page_id: int) -> Page | None:
    result = await db.execute(select(Page).where(Page.id == page_id))
    return result.scalar_one_or_none()


async def get_page_by_handle(db: AsyncSession, handle: str) -> Page | None:
    result = await db.execute(select(Page).where(Page.handle == handle))
    return result.scalar_one_or_none()


async def list_pages(
    db: AsyncSession,
    search: str | None = None,
    visibility: str | None = None,
    skip: int = 0,
    limit: int = 100,
) -> list[Page]:
    query = select(Page)
    if search:
        query = query.where(
            or_(
                Page.title.ilike(f"%{search}%"),
                Page.handle.ilike(f"%{search}%"),
                Page.content.ilike(f"%{search}%"),
            )
        )
    if visibility:
        query = query.where(Page.visibility == visibility)
    query = query.order_by(Page.created_at.desc()).offset(skip).limit(limit)
    result = await db.execute(query)
    pages = list(result.scalars().all())

    # Auto-seed standard pages if DB table is empty
    if not pages and not search and not visibility:
        seed_data = [
            {"title": "Terms of Service", "handle": "terms-of-service", "visibility": "Visible", "content": "Review Eligo Leather Terms of Service.", "template": "terms-of-service", "seo_title": "Terms & Conditions – Eligo Leather Official"},
            {"title": "Refund Policy", "handle": "refund-policy", "visibility": "Visible", "content": "We have a 30-day return policy for handcrafted leather goods.", "template": "Default page", "seo_title": "Refund & Return Policy – Eligo Leather"},
            {"title": "Contact Us", "handle": "contact-us", "visibility": "Visible", "content": "Contact Eligo Leather customer support team at eligoleather9@gmail.com.", "template": "contact-us", "seo_title": "Contact Us – Eligo Leather Official"},
            {"title": "Track Your Order", "handle": "track-order", "visibility": "Visible", "content": "Track your domestic leather order delivery status across Pakistan.", "template": "Default page", "seo_title": "Track Your Order – Eligo Leather"},
            {"title": "Privacy Policy", "handle": "privacy-policy", "visibility": "Visible", "content": "Privacy Policy describing how Eligo Leather processes customer data.", "template": "Default page", "seo_title": "Privacy Policy – Eligo Leather"},
            {"title": "About Us", "handle": "about-us", "visibility": "Visible", "content": "Learn about Eligo Leather craftsmanship and heritage.", "template": "about-us", "seo_title": "About Us – Eligo Leather Handcrafted Goods"},
            {"title": "Sales", "handle": "sales", "visibility": "Visible", "content": "Special store discounts and sales events at Eligo Leather.", "template": "Default page", "seo_title": "Sales & Offers – Eligo Leather"},
            {"title": "HTML sitemap for blogs", "handle": "avada-sitemap-blogs", "visibility": "Hidden", "content": "<h3>Blogs</h3><ul><li><a href='/blogs/news'>Blog</a></li><li><a href='/blogs/news'>News</a></li><li><a href='/blogs/news/leather-grades'>Different Leather Grades & Leather Quality</a></li><li><a href='/blogs/news/sewing-leather'>Sewing of Leather: The Art and Craft Behind Handcrafted Leather</a></li><li><a href='/blogs/news/ideal-wallet-guide'>Guide to Choosing the Ideal Leather Goods</a></li></ul>", "template": "Default page", "seo_title": "HTML sitemap for blogs – Eligo Leather"},
            {"title": "HTML sitemap for articles", "handle": "avada-sitemap-articles", "visibility": "Hidden", "content": "<h3>Articles</h3><ul><li><a href='/blogs/news/sewing-leather'>Sewing of Leather: The Art and Craft Behind Leather Products</a></li><li><a href='/blogs/news/eco-wallets'>Eco-Friendly Leather Wallets: A Wise Choice for Conscious Shoppers</a></li></ul>", "template": "Default page", "seo_title": "HTML sitemap for articles – Eligo Leather"},
            {"title": "HTML sitemap for collections", "handle": "avada-sitemap-collections", "visibility": "Hidden", "content": "<h3>Collections</h3><ul><li><a href='/collections/accessories'>Accessories</a></li><li><a href='/collections/keychains'>Keychain</a></li><li><a href='/collections/belts'>All Belts</a></li><li><a href='/collections/wallets'>All Wallets</a></li><li><a href='/collections/bags'>Ladies Wear</a></li><li><a href='/collections/long-wallets'>Long Wallet</a></li><li><a href='/collections/men'>Men</a></li><li><a href='/collections/rfid'>RFID Wallets</a></li></ul>", "template": "Default page", "seo_title": "HTML sitemap for collections – Eligo Leather"},
            {"title": "HTML sitemap for products", "handle": "avada-sitemap-products", "visibility": "Hidden", "content": "<h3>Products</h3><ul><li><a href='/products/rosy-leather-handbag'>Rosy Leather Handbag</a></li><li><a href='/products/vintage-brown-wallet'>Vintage Dark Brown Bifold Leather Wallet</a></li><li><a href='/products/maroon-tan-wallet'>Maroon Tan Leather Wallet</a></li></ul>", "template": "Default page", "seo_title": "HTML sitemap for products – Eligo Leather"},
            {"title": "HTML sitemap", "handle": "avada-sitemap", "visibility": "Hidden", "content": "<h3>HTML Sitemap Master Index</h3><p>Master HTML sitemap index for search engines.</p>", "template": "Default page", "seo_title": "HTML sitemap – Eligo Leather"},
            {"title": "HTML sitemap for pages", "handle": "avada-sitemap-pages", "visibility": "Hidden", "content": "<h3>Pages Sitemap</h3><ul><li><a href='/pages/terms-of-service'>Terms of Service</a></li><li><a href='/pages/privacy-policy'>Privacy Policy</a></li><li><a href='/pages/about-us'>About Us</a></li><li><a href='/pages/contact-us'>Contact Us</a></li></ul>", "template": "Default page", "seo_title": "HTML sitemap for pages – Eligo Leather"},
        ]

        for p_dict in seed_data:
            p_obj = Page(**p_dict)
            db.add(p_obj)
        await db.commit()

        res_new = await db.execute(query)
        pages = list(res_new.scalars().all())

    return pages


async def update_page(
    db: AsyncSession, page_id: int, data: PageUpdate,
) -> Page | None:
    obj = await get_page(db, page_id)
    if not obj:
        return None
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(obj, field, value)
    await db.commit()
    await db.refresh(obj)
    return obj


async def delete_page(db: AsyncSession, page_id: int) -> bool:
    obj = await get_page(db, page_id)
    if not obj:
        return False
    await db.delete(obj)
    await db.commit()
    return True


async def bulk_delete_pages(
    db: AsyncSession, page_ids: list[int], handles: list[str],
) -> int:
    """Delete multiple pages. Returns the number of rows actually deleted."""
    ids = list({int(i) for i in page_ids if i})
    names = list({h.strip() for h in handles if h and h.strip()})
    if not ids and not names:
        return 0

    conditions = []
    if ids:
        conditions.append(Page.id.in_(ids))
    if names:
        conditions.append(Page.handle.in_(names))

    result = await db.execute(delete(Page).where(or_(*conditions)))
    await db.commit()
    return result.rowcount or 0


# ===========================================================================
# Public Storefront Metaobject – Read-only (no drafts)
# ===========================================================================

async def list_storefront_definitions(
    db: AsyncSession,
    skip: int = 0,
    limit: int = 50,
) -> list[MetaobjectDefinition]:
    """List all active definitions available on storefront."""
    query = select(MetaobjectDefinition).options(
        selectinload(MetaobjectDefinition.fields),
    ).where(
        MetaobjectDefinition.available_on_storefront == True,
        MetaobjectDefinition.status == "active",
    ).order_by(MetaobjectDefinition.created_at.desc()).offset(skip).limit(limit)
    result = await db.execute(query)
    return list(result.scalars().all())


async def get_storefront_definition_by_type_key(
    db: AsyncSession, type_key: str,
) -> MetaobjectDefinition | None:
    """Get a single definition by type_key (storefront only, active only)."""
    result = await db.execute(
        select(MetaobjectDefinition)
        .options(
            selectinload(MetaobjectDefinition.fields),
        )
        .where(
            MetaobjectDefinition.type_key == type_key,
            MetaobjectDefinition.available_on_storefront == True,
            MetaobjectDefinition.status == "active",
        ),
    )
    return result.scalar_one_or_none()


async def list_storefront_entries(
    db: AsyncSession,
    type_key: str,
    skip: int = 0,
    limit: int = 50,
) -> list[MetaobjectEntry]:
    """List active entries for a definition (storefront only, no drafts)."""
    # First get the definition
    def_result = await db.execute(
        select(MetaobjectDefinition).where(
            MetaobjectDefinition.type_key == type_key,
            MetaobjectDefinition.available_on_storefront == True,
            MetaobjectDefinition.status == "active",
        ),
    )
    definition = def_result.scalar_one_or_none()
    if not definition:
        return []

    query = select(MetaobjectEntry).options(
        selectinload(MetaobjectEntry.field_values),
    ).where(
        MetaobjectEntry.definition_id == definition.id,
        MetaobjectEntry.status == "active",
    ).order_by(MetaobjectEntry.display_name.asc()).offset(skip).limit(limit)
    result = await db.execute(query)
    return list(result.scalars().all())

