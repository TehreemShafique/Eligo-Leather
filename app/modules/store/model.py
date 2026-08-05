from datetime import datetime

from sqlalchemy import (
    String, Text, DateTime, ForeignKey, Index, func,
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
        DateTime(timezone=True), server_default=func.now(),
        onupdate=func.now(),
    )
