import enum
from datetime import datetime

from sqlalchemy import (
    String, Integer, Boolean, Float, DateTime, Text, Index, ForeignKey,
    Enum as SAEnum, func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


# ---------------------------------------------------------------------------
# Enums
# ---------------------------------------------------------------------------

class MetaobjectStatus(str, enum.Enum):
    active = "active"
    draft = "draft"


class Visibility(str, enum.Enum):
    visible = "Visible"
    hidden = "Hidden"


class BlogCommentStatus(str, enum.Enum):
    pending = "pending"
    approved = "approved"
    spam = "spam"


class MenuTarget(str, enum.Enum):
    same_window = "same_window"
    new_window = "new_window"


class RedirectTargetType(str, enum.Enum):
    home = "Home"
    collection = "Collection"
    product = "Product"
    page = "Page"
    blog_post = "Blog post"
    custom = "Custom"


# ---------------------------------------------------------------------------
# Metaobject Definitions
# ---------------------------------------------------------------------------

class MetaobjectDefinition(Base):
    __tablename__ = "metaobject_definitions"
    __table_args__ = (
        Index("ix_metaobject_definitions_type_key", "type_key"),
        Index("ix_metaobject_definitions_handle", "handle"),
    )

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String, nullable=False)
    type_key: Mapped[str] = mapped_column(String, nullable=False, unique=True)
    handle: Mapped[str | None] = mapped_column(String, nullable=True, unique=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(
        SAEnum(MetaobjectStatus, name="metaobject_definition_status"),
        default=MetaobjectStatus.active,
    )
    publish_as_web_pages: Mapped[bool] = mapped_column(Boolean, default=False)
    available_on_storefront: Mapped[bool] = mapped_column(Boolean, default=False)

    fields = relationship(
        "MetaobjectDefinitionField", back_populates="definition",
        cascade="all, delete-orphan", order_by="MetaobjectDefinitionField.position",
    )
    entries = relationship(
        "MetaobjectEntry", back_populates="definition",
        cascade="all, delete-orphan",
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(),
    )
    updated_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), onupdate=func.now(), nullable=True,
    )


# ---------------------------------------------------------------------------
# Metaobject Entries
# ---------------------------------------------------------------------------

class MetaobjectEntry(Base):
    __tablename__ = "metaobject_entries"
    __table_args__ = (
        Index("ix_metaobject_entries_status", "status"),
        Index("ix_metaobject_entries_created_at", "created_at"),
        Index("ix_metaobject_entries_definition_id", "definition_id"),
    )

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    definition_id: Mapped[int] = mapped_column(
        ForeignKey("metaobject_definitions.id", ondelete="CASCADE"),
    )
    display_name: Mapped[str] = mapped_column(String, nullable=False)
    handle: Mapped[str | None] = mapped_column(String, nullable=True)
    status: Mapped[str] = mapped_column(
        SAEnum(MetaobjectStatus, name="metaobject_status"),
        default=MetaobjectStatus.active,
    )
    tags: Mapped[str | None] = mapped_column(String, nullable=True)
    added_by: Mapped[str | None] = mapped_column(String, nullable=True)
    references_count: Mapped[int] = mapped_column(Integer, default=0)

    definition = relationship("MetaobjectDefinition", back_populates="entries")
    field_values = relationship(
        "MetaobjectEntryValue", back_populates="entry",
        cascade="all, delete-orphan",
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(),
    )
    updated_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), onupdate=func.now(), nullable=True,
    )


# ---------------------------------------------------------------------------
# Metaobject Definition Fields
# ---------------------------------------------------------------------------

class MetaobjectDefinitionField(Base):
    __tablename__ = "metaobject_definition_fields"
    __table_args__ = (
        Index("ix_metaobject_definition_fields_definition_id", "definition_id"),
        Index("ix_metaobject_definition_fields_position", "position"),
    )

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    definition_id: Mapped[int] = mapped_column(
        ForeignKey("metaobject_definitions.id", ondelete="CASCADE"),
    )
    label: Mapped[str] = mapped_column(String, nullable=False)
    field_type: Mapped[str] = mapped_column(String, nullable=False)
    cardinality: Mapped[str] = mapped_column(String, default="one")  # "one" or "list"
    required: Mapped[bool] = mapped_column(Boolean, default=False)
    is_display_name: Mapped[bool] = mapped_column(Boolean, default=False)
    is_filterable: Mapped[bool] = mapped_column(Boolean, default=False)
    position: Mapped[int] = mapped_column(Integer, default=0)
    config: Mapped[str | None] = mapped_column(Text, nullable=True)  # JSON for type-specific config (max_length, min, max, etc.)

    definition = relationship("MetaobjectDefinition", back_populates="fields")

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(),
    )
    updated_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), onupdate=func.now(), nullable=True,
    )


# ---------------------------------------------------------------------------
# Metaobject Entry Values
# ---------------------------------------------------------------------------

class MetaobjectEntryValue(Base):
    __tablename__ = "metaobject_entry_values"
    __table_args__ = (
        Index("ix_metaobject_entry_values_entry_id", "entry_id"),
        Index("ix_metaobject_entry_values_field_id", "field_id"),
    )

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    entry_id: Mapped[int] = mapped_column(
        ForeignKey("metaobject_entries.id", ondelete="CASCADE"),
    )
    field_id: Mapped[int] = mapped_column(
        ForeignKey("metaobject_definition_fields.id", ondelete="CASCADE"),
    )
    value: Mapped[str | None] = mapped_column(Text, nullable=True)  # Text value or JSON for complex types (references, lists)
    reference_id: Mapped[int | None] = mapped_column(Integer, nullable=True)  # FK to referenced entity (product, collection, etc.)
    reference_type: Mapped[str | None] = mapped_column(String, nullable=True)  # e.g. "product", "collection", "metaobject"

    entry = relationship("MetaobjectEntry", back_populates="field_values")
    field = relationship("MetaobjectDefinitionField")

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(),
    )
    updated_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), onupdate=func.now(), nullable=True,
    )


# ---------------------------------------------------------------------------
# Files
# ---------------------------------------------------------------------------

class File(Base):
    __tablename__ = "files"
    __table_args__ = (
        Index("ix_files_filename", "filename"),
        Index("ix_files_created_at", "created_at"),
    )

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    filename: Mapped[str] = mapped_column(String, nullable=False)
    original_filename: Mapped[str] = mapped_column(String, nullable=False)
    mime_type: Mapped[str] = mapped_column(String, nullable=False)
    format: Mapped[str | None] = mapped_column(String, nullable=True)
    file_size: Mapped[int] = mapped_column(Integer, default=0)
    width: Mapped[int | None] = mapped_column(Integer, nullable=True)
    height: Mapped[int | None] = mapped_column(Integer, nullable=True)
    alt_text: Mapped[str | None] = mapped_column(String, nullable=True)
    url: Mapped[str] = mapped_column(String, nullable=False)
    added_by: Mapped[str | None] = mapped_column(String, nullable=True)
    references_count: Mapped[int] = mapped_column(Integer, default=0)
    usage: Mapped[str | None] = mapped_column(String, nullable=True)
    focal_point_x: Mapped[float | None] = mapped_column(Float, nullable=True)
    focal_point_y: Mapped[float | None] = mapped_column(Float, nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(),
    )
    updated_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), onupdate=func.now(), nullable=True,
    )


# ---------------------------------------------------------------------------
# Menus
# ---------------------------------------------------------------------------

class Menu(Base):
    __tablename__ = "menus"
    __table_args__ = (
        Index("ix_menus_handle", "handle"),
    )

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    title: Mapped[str] = mapped_column(String, nullable=False)
    handle: Mapped[str] = mapped_column(String, nullable=False, unique=True)

    items = relationship(
        "MenuItem", back_populates="menu",
        cascade="all, delete-orphan",
        foreign_keys="MenuItem.menu_id",
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(),
    )
    updated_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), onupdate=func.now(), nullable=True,
    )


class MenuItem(Base):
    __tablename__ = "menu_items"
    __table_args__ = (
        Index("ix_menu_items_menu_id", "menu_id"),
        Index("ix_menu_items_parent_id", "parent_id"),
    )

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    menu_id: Mapped[int] = mapped_column(
        ForeignKey("menus.id", ondelete="CASCADE"),
    )
    parent_id: Mapped[int | None] = mapped_column(
        ForeignKey("menu_items.id", ondelete="SET NULL"),
        nullable=True,
    )
    label: Mapped[str] = mapped_column(String, nullable=False)
    url: Mapped[str] = mapped_column(String, default="/")
    target: Mapped[str] = mapped_column(
        SAEnum(MenuTarget, name="menu_target"),
        default=MenuTarget.same_window,
    )
    position: Mapped[int] = mapped_column(Integer, default=0)

    menu = relationship("Menu", back_populates="items", foreign_keys=[menu_id])
    parent = relationship(
        "MenuItem", remote_side="MenuItem.id",
        backref="children", foreign_keys=[parent_id],
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(),
    )


# ---------------------------------------------------------------------------
# URL Redirects
# ---------------------------------------------------------------------------

class UrlRedirect(Base):
    __tablename__ = "url_redirects"
    __table_args__ = (
        Index("ix_url_redirects_from_path", "from_path"),
    )

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    from_path: Mapped[str] = mapped_column(String, nullable=False)
    to_path: Mapped[str] = mapped_column(String, nullable=False)
    target_type: Mapped[str | None] = mapped_column(
        SAEnum(RedirectTargetType, name="redirect_target_type"),
        nullable=True,
    )
    redirect_type: Mapped[int] = mapped_column(Integer, default=301)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(),
    )


# ---------------------------------------------------------------------------
# Blog Posts
# ---------------------------------------------------------------------------

class BlogPost(Base):
    __tablename__ = "blog_posts"
    __table_args__ = (
        Index("ix_blog_posts_handle", "handle"),
        Index("ix_blog_posts_author", "author"),
        Index("ix_blog_posts_blog", "blog"),
        Index("ix_blog_posts_published_at", "published_at"),
    )

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    title: Mapped[str] = mapped_column(String, nullable=False)
    handle: Mapped[str] = mapped_column(String, nullable=False, unique=True)
    body: Mapped[str | None] = mapped_column(Text, nullable=True)
    excerpt: Mapped[str | None] = mapped_column(Text, nullable=True)
    faqs: Mapped[str | None] = mapped_column(Text, nullable=True)
    author: Mapped[str] = mapped_column(String, default="Eligo Leather")
    blog: Mapped[str] = mapped_column(String, default="News")
    tags: Mapped[str | None] = mapped_column(String, nullable=True)
    visibility: Mapped[str] = mapped_column(
        SAEnum(Visibility, name="blog_visibility"),
        default=Visibility.visible,
    )
    featured_image_url: Mapped[str | None] = mapped_column(String, nullable=True)
    thumbnail_url: Mapped[str | None] = mapped_column(String, nullable=True)
    seo_title: Mapped[str | None] = mapped_column(String, nullable=True)
    seo_description: Mapped[str | None] = mapped_column(Text, nullable=True)
    template_suffix: Mapped[str | None] = mapped_column(String, nullable=True)
    published_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True,
    )

    comments = relationship(
        "BlogComment", back_populates="post",
        cascade="all, delete-orphan",
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(),
    )
    updated_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), onupdate=func.now(), nullable=True,
    )


# ---------------------------------------------------------------------------
# Blog Comments
# ---------------------------------------------------------------------------

class BlogComment(Base):
    __tablename__ = "blog_comments"
    __table_args__ = (
        Index("ix_blog_comments_post_id", "post_id"),
        Index("ix_blog_comments_status", "status"),
    )

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    post_id: Mapped[int] = mapped_column(
        ForeignKey("blog_posts.id", ondelete="CASCADE"),
    )
    author_name: Mapped[str] = mapped_column(String, nullable=False)
    author_email: Mapped[str] = mapped_column(String, nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[str] = mapped_column(
        SAEnum(BlogCommentStatus, name="blog_comment_status"),
        default=BlogCommentStatus.pending,
    )

    post = relationship("BlogPost", back_populates="comments")

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(),
    )


# ---------------------------------------------------------------------------
# Pages
# ---------------------------------------------------------------------------

class Page(Base):
    __tablename__ = "pages"
    __table_args__ = (
        Index("ix_pages_handle", "handle"),
        Index("ix_pages_visibility", "visibility"),
    )

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    title: Mapped[str] = mapped_column(String, nullable=False)
    handle: Mapped[str] = mapped_column(String, nullable=False, unique=True)
    content: Mapped[str | None] = mapped_column(Text, nullable=True)
    visibility: Mapped[str] = mapped_column(String, default="Visible")
    template: Mapped[str | None] = mapped_column(String, default="Default page")
    metafields: Mapped[str | None] = mapped_column(Text, nullable=True)
    seo_title: Mapped[str | None] = mapped_column(String, nullable=True)
    seo_description: Mapped[str | None] = mapped_column(Text, nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(),
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(),
    )

