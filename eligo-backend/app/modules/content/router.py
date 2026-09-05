from fastapi import APIRouter, Depends, HTTPException, Query, status, UploadFile, File as FileParam, Form
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.core.dependencies import get_current_user
from app.modules.content import service
from app.modules.content.schema import (
    MetaobjectDefinitionCreate,
    MetaobjectDefinitionUpdate,
    MetaobjectDefinitionOut,
    MetaobjectDefinitionWithEntries,
    MetaobjectDefinitionWithFields,
    MetaobjectDefinitionFieldOut,
    MetaobjectEntryCreate,
    MetaobjectEntryUpdate,
    MetaobjectEntryOut,
    MetaobjectEntryWithValues,
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
    PageCreate,
    PageUpdate,
    PageBulkDelete,
    PageOut,
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


@metaobject_definition_router.get("/", response_model=list[MetaobjectDefinitionWithFields])
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


@metaobject_entry_router.get("/", response_model=list[MetaobjectEntryWithValues])
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


@metaobject_entry_router.get("/{entry_id}", response_model=MetaobjectEntryWithValues)
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


@metaobject_entry_router.patch("/{entry_id}", response_model=MetaobjectEntryWithValues)
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


@files_router.post("/upload", response_model=FileOut, status_code=status.HTTP_201_CREATED)
async def upload_file(
    file: UploadFile = FileParam(...),
    alt_text: str | None = Form(None),
    folder: str = Query("general"),
    db: AsyncSession = Depends(get_db),
):
    """Upload any image format (PNG, JPG, GIF) - automatically converts to .webp format.

    Use the ``folder`` query parameter to organise uploads in R2
    (e.g. ``blogs``, ``products``, ``reviews``).  When R2 is not configured
    the folder parameter is ignored and files are saved to local disk.
    """
    content = await file.read()
    webp_bytes, webp_filename, mime_type = service.convert_image_to_webp(content, file.filename or "image.png")
    url_path = service.save_upload(webp_bytes, webp_filename, folder=folder)

    file_data = FileCreate(
        filename=webp_filename,
        original_filename=file.filename or webp_filename,
        url=url_path,
        mime_type=mime_type,
        size_bytes=len(webp_bytes),
        alt_text=alt_text or webp_filename,
    )
    return await service.create_file(db, file_data)


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


@menus_router.patch("/items/{item_id}", response_model=MenuItemOut, dependencies=[Depends(get_current_user)])
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
    dependencies=[Depends(get_current_user)],
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
# Pages Router
# ===========================================================================

pages_router = APIRouter(
    prefix="/pages",
    tags=["Pages"],
)


@pages_router.post("/", response_model=PageOut, status_code=status.HTTP_201_CREATED)
async def create_page(data: PageCreate, db: AsyncSession = Depends(get_db)):
    return await service.create_page(db, data)


@pages_router.get("/", response_model=list[PageOut])
async def list_pages(
    search: str | None = Query(None),
    visibility: str | None = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=200),
    db: AsyncSession = Depends(get_db),
):
    return await service.list_pages(db, search=search, visibility=visibility, skip=skip, limit=limit)


@pages_router.get("/{page_id_or_handle}", response_model=PageOut)
async def get_page(page_id_or_handle: str, db: AsyncSession = Depends(get_db)):
    if page_id_or_handle.isdigit():
        obj = await service.get_page(db, int(page_id_or_handle))
    else:
        obj = await service.get_page_by_handle(db, page_id_or_handle)
    if not obj:
        raise HTTPException(status_code=404, detail="Page not found")
    return obj


@pages_router.patch("/{page_id}", response_model=PageOut)
async def update_page(page_id: int, data: PageUpdate, db: AsyncSession = Depends(get_db)):
    obj = await service.update_page(db, page_id, data)
    if not obj:
        raise HTTPException(status_code=404, detail="Page not found")
    return obj


@pages_router.post("/bulk-delete")
async def bulk_delete_pages(data: PageBulkDelete, db: AsyncSession = Depends(get_db)):
    deleted = await service.bulk_delete_pages(db, data.ids, data.handles)
    return {"status": "success", "deleted": deleted}


@pages_router.delete("/{page_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_page(page_id: int, db: AsyncSession = Depends(get_db)):
    deleted = await service.delete_page(db, page_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Page not found")


@pages_router.get("/robots.txt/raw")
async def get_robots_txt_raw(db: AsyncSession = Depends(get_db)):
    obj = await service.get_page_by_handle(db, "robots-txt")
    default_text = (
        "# Eligo Leather Storefront robots.txt\n"
        "# Controls search engine crawler indexing (Googlebot, Bingbot, YandexBot)\n\n"
        "User-agent: *\n"
        "Disallow: /admin/\n"
        "Disallow: /checkout/\n"
        "Disallow: /cart/\n"
        "Disallow: /account/\n"
        "Disallow: /api/\n"
        "Allow: /\n\n"
        "# XML Sitemap Index for Search Engines\n"
        "Sitemap: https://eligoleather.com/sitemap.xml\n"
    )
    if not obj:
        return Response(content=default_text, media_type="text/plain")
    return Response(content=obj.content or default_text, media_type="text/plain")


@pages_router.get("/robots.txt/content")
async def get_robots_txt_content(db: AsyncSession = Depends(get_db)):
    obj = await service.get_page_by_handle(db, "robots-txt")
    default_text = (
        "# Eligo Leather Storefront robots.txt\n"
        "# Controls search engine crawler indexing (Googlebot, Bingbot, YandexBot)\n\n"
        "User-agent: *\n"
        "Disallow: /admin/\n"
        "Disallow: /checkout/\n"
        "Disallow: /cart/\n"
        "Disallow: /account/\n"
        "Disallow: /api/\n"
        "Allow: /\n\n"
        "# XML Sitemap Index for Search Engines\n"
        "Sitemap: https://eligoleather.com/sitemap.xml\n"
    )
    if not obj:
        return {"content": default_text}
    return {"content": obj.content or default_text}


@pages_router.put("/robots.txt/content")
async def save_robots_txt_content(payload: dict, db: AsyncSession = Depends(get_db)):
    content_val = payload.get("content", "")
    obj = await service.get_page_by_handle(db, "robots-txt")
    if not obj:
        from app.modules.content.schema import PageCreate
        obj = await service.create_page(
            db,
            PageCreate(
                title="robots.txt",
                handle="robots-txt",
                content=content_val,
                visibility="Visible",
                template="Default page",
            ),
        )
    else:
        from app.modules.content.schema import PageUpdate
        obj = await service.update_page(db, obj.id, PageUpdate(content=content_val))
    return {"status": "success", "content": obj.content}


# ===========================================================================
# Public Storefront Metaobject API (no auth required, no drafts)
# ===========================================================================

storefront_metaobject_router = APIRouter(
    prefix="/storefront/metaobjects",
    tags=["Storefront Metaobjects"],
)


@storefront_metaobject_router.get("/", response_model=list[MetaobjectDefinitionOut])
async def list_storefront_definitions(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    db: AsyncSession = Depends(get_db),
):
    """List all active definitions available on storefront (no auth required)."""
    return await service.list_storefront_definitions(db, skip=skip, limit=limit)


@storefront_metaobject_router.get("/{type_key}", response_model=MetaobjectDefinitionWithFields)
async def get_storefront_definition(
    type_key: str,
    db: AsyncSession = Depends(get_db),
):
    """Get a single definition by type_key (no auth required)."""
    obj = await service.get_storefront_definition_by_type_key(db, type_key)
    if not obj:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Definition not found or not available on storefront",
        )
    return obj


@storefront_metaobject_router.get("/{type_key}/entries", response_model=list[MetaobjectEntryWithValues])
async def list_storefront_entries(
    type_key: str,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    db: AsyncSession = Depends(get_db),
):
    """List active entries for a definition (no auth required, no drafts)."""
    return await service.list_storefront_entries(
        db, type_key=type_key, skip=skip, limit=limit,
    )


