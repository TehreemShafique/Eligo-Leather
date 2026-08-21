from datetime import datetime

from sqlalchemy import (
    String, Text, DateTime, Boolean, ForeignKey, Index, func,
)
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class StoreHeaderScript(Base):
    """Raw custom header code owned by a single store/user. Only the owning
    user may edit it; its content is rendered on that user's storefront."""

    __tablename__ = "store_header_scripts"
    __table_args__ = (
        Index("ix_store_header_scripts_user_id", "user_id"),
    )

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False, unique=True,
    )
    header_scripts: Mapped[str] = mapped_column(Text, default="")

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(),
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(),
    )


class StoreSchema(Base):
    """JSON-LD structured data schemas owned by a single store/user.
    Each schema is scoped to specific page patterns on the storefront."""

    __tablename__ = "store_schemas"
    __table_args__ = (
        Index("ix_store_schemas_user_id", "user_id"),
    )

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False,
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    schema_type: Mapped[str] = mapped_column(String(50), nullable=False, default="custom")
    target_pages: Mapped[str] = mapped_column(Text, nullable=False, default="/*")
    schema_json: Mapped[str] = mapped_column(Text, nullable=False, default="")
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(),
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(),
    )
