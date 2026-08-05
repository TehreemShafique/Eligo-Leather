import enum
from datetime import datetime

from sqlalchemy import Boolean, DateTime, String, func
from sqlalchemy import Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class LanguageStatus(str, enum.Enum):
    published = "published"
    unpublished = "unpublished"


class StoreLanguage(Base):
    """An active storefront language (Settings -> Languages).

    `is_default` is exclusive - only one row may be True (English by
    default). `status` controls whether translations are served to the
    storefront, and `domain` optionally maps a locale to a subdomain /
    subdirectory (e.g. `es.eligo.pk`, `/ar/`).
    """

    __tablename__ = "store_languages"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    language_code: Mapped[str] = mapped_column(String, unique=True, index=True, nullable=False)
    language_name: Mapped[str] = mapped_column(String, nullable=False)
    native_name: Mapped[str | None] = mapped_column(String, nullable=True)
    is_default: Mapped[bool] = mapped_column(Boolean, default=False)
    status: Mapped[LanguageStatus] = mapped_column(
        SAEnum(LanguageStatus, name="language_status"),
        default=LanguageStatus.published,
        nullable=False,
    )
    domain: Mapped[str | None] = mapped_column(String, nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )
