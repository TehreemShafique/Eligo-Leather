from datetime import datetime

from sqlalchemy import select, func, or_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.modules.content.model import (
    MetaobjectDefinition,
    MetaobjectEntry,
    File,
    Menu,
    MenuItem,
    UrlRedirect,
    BlogPost,
    BlogComment,
)
from app.modules.content.schema import (
    MetaobjectDefinitionCreate,
    MetaobjectDefinitionUpdate,
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
    obj = MetaobjectDefinition(**data.model_dump())
    db.add(obj)
    await db.commit()
    await db.refresh(obj)
    return obj


async def get_metaobject_definition(
    db: AsyncSession, def_id: int,
) -> MetaobjectDefinition | None:
    result = await db.execute(
        select(MetaobjectDefinition)
        .options(selectinload(MetaobjectDefinition.entries))
        .where(MetaobjectDefinition.id == def_id),
    )
    return result.scalar_one_or_none()


async def list_metaobject_definitions(
    db: AsyncSession,
    search: str | None = None,
    skip: int = 0,
    limit: int = 50,
) -> list[MetaobjectDefinition]:
    query = select(MetaobjectDefinition)
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
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(obj, field, value)
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
    obj = MetaobjectEntry(**data.model_dump())
    db.add(obj)
    await db.commit()
    await db.refresh(obj)
    return obj


async def get_metaobject_entry(
    db: AsyncSession, entry_id: int,
) -> MetaobjectEntry | None:
    result = await db.execute(
        select(MetaobjectEntry)
        .options(selectinload(MetaobjectEntry.definition))
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
        selectinload(MetaobjectEntry.definition),
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
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(obj, field, value)
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


# ===========================================================================
# Files – CRUD
# ===========================================================================

async def create_file(
    db: AsyncSession, data: FileCreate,
) -> File:
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
