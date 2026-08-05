import enum
from datetime import datetime

from sqlalchemy import (
    Boolean,
    DateTime,
    ForeignKey,
    Integer,
    JSON,
    String,
    Text,
    UniqueConstraint,
    func,
)
from sqlalchemy import Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class MetafieldScope(str, enum.Enum):
    """Sub-tab the definition belongs to on a resource page.

    `all` = assigned to every record of the resource (e.g. all products).
    `categories` = only assigned to records matching `category_ids`.
    """

    all = "all"
    categories = "categories"


class MetafieldDefinition(Base):
    """A universal custom-data definition attached to any core resource.

    One table powers metafields for Products, Variants, Collections,
    Customers, Orders, ... - the resource is stored in `resource_type` so a
    single API endpoint can create/extend every entity without schema
    changes. `type` is a code from the METAFIELD_TYPES catalog in service.py.
    """

    __tablename__ = "metafield_definitions"
    __table_args__ = (
        UniqueConstraint(
            "resource_type", "key", name="uq_metafield_definitions_resource_key"
        ),
    )

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    resource_type: Mapped[str] = mapped_column(String, index=True, nullable=False)
    name: Mapped[str] = mapped_column(String, nullable=False)
    # Auto-generated snake_case key used by the storefront template renderer
    # (namespace.key lookups), unique within the resource.
    key: Mapped[str] = mapped_column(String, nullable=False)
    type: Mapped[str] = mapped_column(String, nullable=False)
    # One value vs list of values (value constraint selector).
    is_list: Mapped[bool] = mapped_column(Boolean, default=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    storefront_api_access: Mapped[bool] = mapped_column(Boolean, default=False)
    scope: Mapped[MetafieldScope] = mapped_column(
        SAEnum(MetafieldScope, name="metafield_scope"),
        default=MetafieldScope.all,
        nullable=False,
    )
    # Collection/category ids this definition is restricted to (scope == categories).
    category_ids: Mapped[list | None] = mapped_column(JSON, nullable=True)
    is_pinned: Mapped[bool] = mapped_column(Boolean, default=False)

    values = relationship(
        "MetafieldValue",
        back_populates="definition",
        cascade="all, delete-orphan",
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )


class MetafieldValue(Base):
    """A concrete metafield value attached to one record of a resource.

    `owner_id` is the record's primary key within `owner_resource_type`
    (e.g. product 37). The "Used in N products" count is COUNT of these rows.
    """

    __tablename__ = "metafield_values"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    definition_id: Mapped[int] = mapped_column(
        ForeignKey("metafield_definitions.id", ondelete="CASCADE"),
        index=True,
        nullable=False,
    )
    owner_resource_type: Mapped[str] = mapped_column(String, nullable=False)
    owner_id: Mapped[int] = mapped_column(Integer, index=True, nullable=False)
    value: Mapped[str | None] = mapped_column(Text, nullable=True)

    definition = relationship("MetafieldDefinition", back_populates="values")

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )
