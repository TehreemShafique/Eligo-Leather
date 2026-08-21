from datetime import datetime
from pydantic import BaseModel, ConfigDict

from app.modules.content.model import (
    MetaobjectStatus,
    Visibility,
    BlogCommentStatus,
    MenuTarget,
    RedirectTargetType,
)


# ===========================================================================
# Metaobject Definition
# ===========================================================================

class MetaobjectDefinitionCreate(BaseModel):
    name: str
    type_key: str
    available_on_storefront: bool = False
    display_name: str | None = None


class MetaobjectDefinitionUpdate(BaseModel):
    name: str | None = None
    type_key: str | None = None
    available_on_storefront: bool | None = None
    display_name: str | None = None


class MetaobjectDefinitionOut(BaseModel):
    id: int
    name: str
    type_key: str
    available_on_storefront: bool
    display_name: str | None
    created_at: datetime
    updated_at: datetime | None

    model_config = ConfigDict(from_attributes=True)


# ===========================================================================
# Metaobject Entry
# ===========================================================================

class MetaobjectEntryCreate(BaseModel):
    definition_id: int
    display_name: str
    handle: str | None = None
    fields: str | None = None
    status: MetaobjectStatus = MetaobjectStatus.active
    tags: str | None = None
    added_by: str | None = None


class MetaobjectEntryUpdate(BaseModel):
    definition_id: int | None = None
    display_name: str | None = None
    handle: str | None = None
    fields: str | None = None
    status: MetaobjectStatus | None = None
    tags: str | None = None
    added_by: str | None = None
    references_count: int | None = None


class MetaobjectEntryOut(BaseModel):
    id: int
    definition_id: int
    display_name: str
    handle: str | None
    fields: str | None
    status: MetaobjectStatus
    tags: str | None
    added_by: str | None
    references_count: int
    created_at: datetime
    updated_at: datetime | None

    model_config = ConfigDict(from_attributes=True)


class MetaobjectDefinitionWithEntries(MetaobjectDefinitionOut):
    entries: list[MetaobjectEntryOut] = []


# ===========================================================================
# Files
# ===========================================================================

class FileCreate(BaseModel):
    filename: str
    original_filename: str
    mime_type: str
    format: str | None = None
    file_size: int = 0
    width: int | None = None
    height: int | None = None
    alt_text: str | None = None
    url: str
    added_by: str | None = None


class FileUpdate(BaseModel):
    filename: str | None = None
    original_filename: str | None = None
    mime_type: str | None = None
    format: str | None = None
    file_size: int | None = None
    width: int | None = None
    height: int | None = None
    alt_text: str | None = None
    url: str | None = None
    added_by: str | None = None
    references_count: int | None = None
    usage: str | None = None
    focal_point_x: float | None = None
    focal_point_y: float | None = None


class FileOut(BaseModel):
    id: int
    filename: str
    original_filename: str
    mime_type: str
    format: str | None
    file_size: int
    width: int | None
    height: int | None
    alt_text: str | None
    url: str
    added_by: str | None
    references_count: int
    usage: str | None
    focal_point_x: float | None
    focal_point_y: float | None
    created_at: datetime
    updated_at: datetime | None

    model_config = ConfigDict(from_attributes=True)


# ===========================================================================
# Menu Item
# ===========================================================================

class MenuItemCreate(BaseModel):
    label: str
    url: str = "/"
    target: MenuTarget = MenuTarget.same_window
    position: int = 0
    parent_id: int | None = None


class MenuItemUpdate(BaseModel):
    label: str | None = None
    url: str | None = None
    target: MenuTarget | None = None
    position: int | None = None
    parent_id: int | None = None


class MenuItemOut(BaseModel):
    id: int
    menu_id: int
    parent_id: int | None
    label: str
    url: str
    target: MenuTarget
    position: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class MenuItemTree(MenuItemOut):
    children: list["MenuItemTree"] = []


# ===========================================================================
# Menu
# ===========================================================================

class MenuCreate(BaseModel):
    title: str
    handle: str
    items: list[MenuItemCreate] = []


class MenuUpdate(BaseModel):
    title: str | None = None
    handle: str | None = None


class MenuOut(BaseModel):
    id: int
    title: str
    handle: str
    created_at: datetime
    updated_at: datetime | None

    model_config = ConfigDict(from_attributes=True)


class MenuWithItems(MenuOut):
    items: list[MenuItemOut] = []


# ===========================================================================
# URL Redirects
# ===========================================================================

class UrlRedirectCreate(BaseModel):
    from_path: str
    to_path: str
    target_type: RedirectTargetType | None = None
    redirect_type: int = 301


class UrlRedirectUpdate(BaseModel):
    from_path: str | None = None
    to_path: str | None = None
    target_type: RedirectTargetType | None = None
    redirect_type: int | None = None


class UrlRedirectOut(BaseModel):
    id: int
    from_path: str
    to_path: str
    target_type: RedirectTargetType | None
    redirect_type: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ===========================================================================
# Blog Post
# ===========================================================================

class BlogPostCreate(BaseModel):
    title: str
    handle: str
    body: str | None = None
    excerpt: str | None = None
    faqs: str | None = None
    author: str = "Eligo Leather"
    blog: str = "News"
    tags: str | None = None
    visibility: Visibility = Visibility.visible
    featured_image_url: str | None = None
    thumbnail_url: str | None = None
    seo_title: str | None = None
    seo_description: str | None = None
    template_suffix: str | None = None
    published_at: datetime | None = None


class BlogPostUpdate(BaseModel):
    title: str | None = None
    handle: str | None = None
    body: str | None = None
    excerpt: str | None = None
    faqs: str | None = None
    author: str | None = None
    blog: str | None = None
    tags: str | None = None
    visibility: Visibility | None = None
    featured_image_url: str | None = None
    thumbnail_url: str | None = None
    seo_title: str | None = None
    seo_description: str | None = None
    template_suffix: str | None = None
    published_at: datetime | None = None


class BlogPostOut(BaseModel):
    id: int
    title: str
    handle: str
    body: str | None
    excerpt: str | None
    faqs: str | None
    author: str
    blog: str
    tags: str | None
    visibility: Visibility
    featured_image_url: str | None
    thumbnail_url: str | None
    seo_title: str | None
    seo_description: str | None
    template_suffix: str | None
    published_at: datetime | None
    created_at: datetime
    updated_at: datetime | None

    model_config = ConfigDict(from_attributes=True)


# ===========================================================================
# Blog Comment
# ===========================================================================

class BlogCommentCreate(BaseModel):
    post_id: int
    author_name: str
    author_email: str
    content: str
    status: BlogCommentStatus = BlogCommentStatus.pending


class BlogCommentUpdate(BaseModel):
    author_name: str | None = None
    author_email: str | None = None
    content: str | None = None
    status: BlogCommentStatus | None = None


class BlogCommentOut(BaseModel):
    id: int
    post_id: int
    author_name: str
    author_email: str
    content: str
    status: BlogCommentStatus
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ===========================================================================
# Content Overview (dashboard summary)
# ===========================================================================

class MetaobjectDefinitionSummary(BaseModel):
    definition_id: int
    name: str
    type_key: str
    entry_count: int
    active_count: int
    draft_count: int

    model_config = ConfigDict(from_attributes=True)


class MetaobjectSummary(BaseModel):
    total_definitions: int
    total_entries: int
    active_entries: int
    draft_entries: int
    available_on_storefront: int
    definitions: list[MetaobjectDefinitionSummary] = []

    model_config = ConfigDict(from_attributes=True)


class BlogSummary(BaseModel):
    total_posts: int
    visible_posts: int
    hidden_posts: int
    pending_comments: int
    total_comments: int

    model_config = ConfigDict(from_attributes=True)


class ContentOverview(BaseModel):
    metaobjects: MetaobjectSummary
    files_count: int
    menus_count: int
    url_redirects_count: int
    blog: BlogSummary

    model_config = ConfigDict(from_attributes=True)


# ===========================================================================
# Pages
# ===========================================================================

class PageCreate(BaseModel):
    title: str
    handle: str | None = None
    content: str | None = None
    visibility: str = "Visible"
    template: str | None = "Default page"
    metafields: str | None = None
    seo_title: str | None = None
    seo_description: str | None = None


class PageUpdate(BaseModel):
    title: str | None = None
    handle: str | None = None
    content: str | None = None
    visibility: str | None = None
    template: str | None = None
    metafields: str | None = None
    seo_title: str | None = None
    seo_description: str | None = None


class PageOut(BaseModel):
    id: int
    title: str
    handle: str
    content: str | None = None
    visibility: str
    template: str | None = "Default page"
    metafields: str | None = None
    seo_title: str | None = None
    seo_description: str | None = None
    created_at: datetime
    updated_at: datetime | None = None

    model_config = ConfigDict(from_attributes=True)

