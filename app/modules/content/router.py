from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.core.dependencies import get_current_user
from app.modules.content import service
from app.modules.content.schema import (
    MetaobjectDefinitionCreate,
    MetaobjectDefinitionUpdate,
    MetaobjectDefinitionOut,
    MetaobjectDefinitionWithEntries,
    MetaobjectEntryCreate,
    MetaobjectEntryUpdate,
    MetaobjectEntryOut,
    FileCreate,
    FileUpdate,
    FileOut,
    MenuCreate,
    MenuUpdate,
    MenuOut,
    MenuWithItems,
    MenuItemCreate,
    MenuItemUpdate,
    MenuItemOut,
    UrlRedirectCreate,
    UrlRedirectUpdate,
    UrlRedirectOut,
    BlogPostCreate,
    BlogPostUpdate,
    BlogPostOut,
    BlogCommentCreate,
    BlogCommentUpdate,
    BlogCommentOut,
    ContentOverview,
)

# ===========================================================================
# Content Overview
# ===========================================================================

content_router = APIRouter(
    prefix="/content",
    tags=["Content"],
    dependencies=[Depends(get_current_user)],
)


@content_router.get("/overview", response_model=ContentOverview)
async def get_content_overview(db: AsyncSession = Depends(get_db)):
    return await service.get_content_overview(db)


# ===========================================================================
# Metaobject Definitions
# ===========================================================================

metaobject_definition_router = APIRouter(
    prefix="/metaobject-definitions",
    tags=["Metaobject Definitions"],
    dependencies=[Depends(get_current_user)],
)


@metaobject_definition_router.post(
    "/", response_model=MetaobjectDefinitionOut,
    status_code=status.HTTP_201_CREATED,
)
async def create_metaobject_definition(
    data: MetaobjectDefinitionCreate,
    db: AsyncSession = Depends(get_db),
):
    return await service.create_metaobject_definition(db, data)


@metaobject_definition_router.get("/", response_model=list[MetaobjectDefinitionOut])
async def list_metaobject_definitions(
    search: str | None = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    db: AsyncSession = Depends(get_db),
):
    return await service.list_metaobject_definitions(
        db, search=search, skip=skip, limit=limit,
    )


@metaobject_definition_router.get(
    "/{def_id}", response_model=MetaobjectDefinitionWithEntries,
)
async def get_metaobject_definition(
    def_id: int,
    db: AsyncSession = Depends(get_db),
):
    obj = await service.get_metaobject_definition(db, def_id)
    if not obj:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Metaobject definition not found",
        )
    return obj


@metaobject_definition_router.patch(
    "/{def_id}", response_model=MetaobjectDefinitionOut,
)
async def update_metaobject_definition(
    def_id: int,
    data: MetaobjectDefinitionUpdate,
    db: AsyncSession = Depends(get_db),
):
    obj = await service.update_metaobject_definition(db, def_id, data)
    if not obj:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Metaobject definition not found",
        )
    return obj


@metaobject_definition_router.delete(
    "/{def_id}", status_code=status.HTTP_204_NO_CONTENT,
)
async def delete_metaobject_definition(
    def_id: int,
    db: AsyncSession = Depends(get_db),
):
    deleted = await service.delete_metaobject_definition(db, def_id)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Metaobject definition not found",
        )


# ===========================================================================
# Metaobject Entries
# ===========================================================================

metaobject_entry_router = APIRouter(
    prefix="/metaobject-entries",
    tags=["Metaobject Entries"],
    dependencies=[Depends(get_current_user)],
)


@metaobject_entry_router.post(
    "/", response_model=MetaobjectEntryOut,
    status_code=status.HTTP_201_CREATED,
)
async def create_metaobject_entry(
    data: MetaobjectEntryCreate,
    db: AsyncSession = Depends(get_db),
):
    return await service.create_metaobject_entry(db, data)


@metaobject_entry_router.get("/", response_model=list[MetaobjectEntryOut])
async def list_metaobject_entries(
    definition_id: int | None = Query(None),
    status_filter: str | None = Query(None, alias="status"),
    available_on_storefront: bool | None = Query(None),
    search: str | None = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    db: AsyncSession = Depends(get_db),
):
    return await service.list_metaobject_entries(
        db,
        definition_id=definition_id,
        status=status_filter,
        available_on_storefront=available_on_storefront,
        search=search,
        skip=skip,
        limit=limit,
    )


@metaobject_entry_router.get("/{entry_id}", response_model=MetaobjectEntryOut)
async def get_metaobject_entry(
    entry_id: int,
    db: AsyncSession = Depends(get_db),
):
    obj = await service.get_metaobject_entry(db, entry_id)
    if not obj:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Metaobject entry not found",
        )
    return obj


@metaobject_entry_router.patch("/{entry_id}", response_model=MetaobjectEntryOut)
async def update_metaobject_entry(
    entry_id: int,
    data: MetaobjectEntryUpdate,
    db: AsyncSession = Depends(get_db),
):
    obj = await service.update_metaobject_entry(db, entry_id, data)
    if not obj:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Metaobject entry not found",
        )
    return obj


@metaobject_entry_router.delete(
    "/{entry_id}", status_code=status.HTTP_204_NO_CONTENT,
)
async def delete_metaobject_entry(
    entry_id: int,
    db: AsyncSession = Depends(get_db),
):
    deleted = await service.delete_metaobject_entry(db, entry_id)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Metaobject entry not found",
        )


# ===========================================================================
# Files
# ===========================================================================

files_router = APIRouter(
    prefix="/files",
    tags=["Files"],
    dependencies=[Depends(get_current_user)],
)


@files_router.post("/", response_model=FileOut, status_code=status.HTTP_201_CREATED)
async def create_file(
    data: FileCreate,
    db: AsyncSession = Depends(get_db),
):
    return await service.create_file(db, data)


@files_router.get("/", response_model=list[FileOut])
async def list_files(
    search: str | None = Query(None),
    mime_type: str | None = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    db: AsyncSession = Depends(get_db),
):
    return await service.list_files(
        db, search=search, mime_type=mime_type, skip=skip, limit=limit,
    )


@files_router.get("/{file_id}", response_model=FileOut)
async def get_file(
    file_id: int,
    db: AsyncSession = Depends(get_db),
):
    obj = await service.get_file(db, file_id)
    if not obj:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File not found",
        )
    return obj


@files_router.patch("/{file_id}", response_model=FileOut)
async def update_file(
    file_id: int,
    data: FileUpdate,
    db: AsyncSession = Depends(get_db),
):
    obj = await service.update_file(db, file_id, data)
    if not obj:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File not found",
        )
    return obj


@files_router.delete("/{file_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_file(
    file_id: int,
    db: AsyncSession = Depends(get_db),
):
    deleted = await service.delete_file(db, file_id)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File not found",
        )


# ===========================================================================
# Menus
# ===========================================================================

menus_router = APIRouter(
    prefix="/menus",
    tags=["Menus"],
    dependencies=[Depends(get_current_user)],
)


@menus_router.post("/", response_model=MenuOut, status_code=status.HTTP_201_CREATED)
async def create_menu(
    data: MenuCreate,
    db: AsyncSession = Depends(get_db),
):
    return await service.create_menu(db, data)


@menus_router.get("/", response_model=list[MenuOut])
async def list_menus(
    search: str | None = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    db: AsyncSession = Depends(get_db),
):
    return await service.list_menus(db, search=search, skip=skip, limit=limit)


@menus_router.get("/{menu_id}", response_model=MenuWithItems)
async def get_menu(
    menu_id: int,
    db: AsyncSession = Depends(get_db),
):
    obj = await service.get_menu(db, menu_id)
    if not obj:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Menu not found",
        )
    return obj


@menus_router.patch("/{menu_id}", response_model=MenuOut)
async def update_menu(
    menu_id: int,
    data: MenuUpdate,
    db: AsyncSession = Depends(get_db),
):
    obj = await service.update_menu(db, menu_id, data)
    if not obj:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Menu not found",
        )
    return obj


@menus_router.delete("/{menu_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_menu(
    menu_id: int,
    db: AsyncSession = Depends(get_db),
):
    deleted = await service.delete_menu(db, menu_id)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Menu not found",
        )


# --- Menu Items (nested under menu) ---

@menus_router.post(
    "/{menu_id}/items", response_model=MenuItemOut,
    status_code=status.HTTP_201_CREATED,
)
async def create_menu_item(
    menu_id: int,
    data: MenuItemCreate,
    db: AsyncSession = Depends(get_db),
):
    menu = await service.get_menu(db, menu_id)
    if not menu:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Menu not found",
        )
    return await service.create_menu_item(db, menu_id, data)


@menus_router.get("/{menu_id}/items", response_model=list[MenuItemOut])
async def list_menu_items(
    menu_id: int,
    db: AsyncSession = Depends(get_db),
):
    menu = await service.get_menu(db, menu_id)
    if not menu:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Menu not found",
        )
    return menu.items


@menus_router.patch("/items/{item_id}", response_model=MenuItemOut)
async def update_menu_item(
    item_id: int,
    data: MenuItemUpdate,
    db: AsyncSession = Depends(get_db),
):
    obj = await service.update_menu_item(db, item_id, data)
    if not obj:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Menu item not found",
        )
    return obj


@menus_router.delete(
    "/items/{item_id}", status_code=status.HTTP_204_NO_CONTENT,
)
async def delete_menu_item(
    item_id: int,
    db: AsyncSession = Depends(get_db),
):
    deleted = await service.delete_menu_item(db, item_id)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Menu item not found",
        )


# ===========================================================================
# URL Redirects
# ===========================================================================

url_redirects_router = APIRouter(
    prefix="/url-redirects",
    tags=["URL Redirects"],
    dependencies=[Depends(get_current_user)],
)


@url_redirects_router.post(
    "/", response_model=UrlRedirectOut, status_code=status.HTTP_201_CREATED,
)
async def create_url_redirect(
    data: UrlRedirectCreate,
    db: AsyncSession = Depends(get_db),
):
    return await service.create_url_redirect(db, data)


@url_redirects_router.get("/", response_model=list[UrlRedirectOut])
async def list_url_redirects(
    search: str | None = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    db: AsyncSession = Depends(get_db),
):
    return await service.list_url_redirects(
        db, search=search, skip=skip, limit=limit,
    )


@url_redirects_router.get("/{redirect_id}", response_model=UrlRedirectOut)
async def get_url_redirect(
    redirect_id: int,
    db: AsyncSession = Depends(get_db),
):
    obj = await service.get_url_redirect(db, redirect_id)
    if not obj:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="URL redirect not found",
        )
    return obj


@url_redirects_router.patch("/{redirect_id}", response_model=UrlRedirectOut)
async def update_url_redirect(
    redirect_id: int,
    data: UrlRedirectUpdate,
    db: AsyncSession = Depends(get_db),
):
    obj = await service.update_url_redirect(db, redirect_id, data)
    if not obj:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="URL redirect not found",
        )
    return obj


@url_redirects_router.delete(
    "/{redirect_id}", status_code=status.HTTP_204_NO_CONTENT,
)
async def delete_url_redirect(
    redirect_id: int,
    db: AsyncSession = Depends(get_db),
):
    deleted = await service.delete_url_redirect(db, redirect_id)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="URL redirect not found",
        )


# ===========================================================================
# Blog Posts
# ===========================================================================

blog_posts_router = APIRouter(
    prefix="/blog-posts",
    tags=["Blog Posts"],
    dependencies=[Depends(get_current_user)],
)


@blog_posts_router.post(
    "/", response_model=BlogPostOut, status_code=status.HTTP_201_CREATED,
)
async def create_blog_post(
    data: BlogPostCreate,
    db: AsyncSession = Depends(get_db),
):
    return await service.create_blog_post(db, data)


@blog_posts_router.get("/", response_model=list[BlogPostOut])
async def list_blog_posts(
    search: str | None = Query(None),
    author: str | None = Query(None),
    blog: str | None = Query(None),
    visibility: str | None = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    db: AsyncSession = Depends(get_db),
):
    return await service.list_blog_posts(
        db,
        search=search,
        author=author,
        blog=blog,
        visibility=visibility,
        skip=skip,
        limit=limit,
    )


@blog_posts_router.get("/{post_id}", response_model=BlogPostOut)
async def get_blog_post(
    post_id: int,
    db: AsyncSession = Depends(get_db),
):
    obj = await service.get_blog_post(db, post_id)
    if not obj:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Blog post not found",
        )
    return obj


@blog_posts_router.patch("/{post_id}", response_model=BlogPostOut)
async def update_blog_post(
    post_id: int,
    data: BlogPostUpdate,
    db: AsyncSession = Depends(get_db),
):
    obj = await service.update_blog_post(db, post_id, data)
    if not obj:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Blog post not found",
        )
    return obj


@blog_posts_router.delete(
    "/{post_id}", status_code=status.HTTP_204_NO_CONTENT,
)
async def delete_blog_post(
    post_id: int,
    db: AsyncSession = Depends(get_db),
):
    deleted = await service.delete_blog_post(db, post_id)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Blog post not found",
        )


# ===========================================================================
# Blog Comments
# ===========================================================================

blog_comments_router = APIRouter(
    prefix="/blog-comments",
    tags=["Blog Comments"],
    dependencies=[Depends(get_current_user)],
)


@blog_comments_router.post(
    "/", response_model=BlogCommentOut, status_code=status.HTTP_201_CREATED,
)
async def create_blog_comment(
    data: BlogCommentCreate,
    db: AsyncSession = Depends(get_db),
):
    return await service.create_blog_comment(db, data)


@blog_comments_router.get("/", response_model=list[BlogCommentOut])
async def list_blog_comments(
    post_id: int | None = Query(None),
    status_filter: str | None = Query(None, alias="status"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    db: AsyncSession = Depends(get_db),
):
    return await service.list_blog_comments(
        db, post_id=post_id, status=status_filter, skip=skip, limit=limit,
    )


@blog_comments_router.get("/{comment_id}", response_model=BlogCommentOut)
async def get_blog_comment(
    comment_id: int,
    db: AsyncSession = Depends(get_db),
):
    obj = await service.get_blog_comment(db, comment_id)
    if not obj:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Blog comment not found",
        )
    return obj


@blog_comments_router.patch("/{comment_id}", response_model=BlogCommentOut)
async def update_blog_comment(
    comment_id: int,
    data: BlogCommentUpdate,
    db: AsyncSession = Depends(get_db),
):
    obj = await service.update_blog_comment(db, comment_id, data)
    if not obj:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Blog comment not found",
        )
    return obj


@blog_comments_router.delete(
    "/{comment_id}", status_code=status.HTTP_204_NO_CONTENT,
)
async def delete_blog_comment(
    comment_id: int,
    db: AsyncSession = Depends(get_db),
):
    deleted = await service.delete_blog_comment(db, comment_id)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Blog comment not found",
        )
