import enum
from datetime import datetime

from sqlalchemy import (
    Boolean,
    DateTime,
    ForeignKey,
    String,
    UniqueConstraint,
    func,
)
from sqlalchemy import Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class LoginProvider(str, enum.Enum):
    google = "google"
    apple = "apple"


class UserLoginService(Base):
    """A bound external SSO identity (Connect to Google / Connect to Apple).

    `external_id` is the provider's user identifier returned by the OAuth
    handshake. A user may connect each provider at most once.
    """

    __tablename__ = "user_login_services"
    __table_args__ = (
        UniqueConstraint(
            "user_id", "provider", name="uq_user_login_services_user_provider"
        ),
    )

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False
    )
    provider: Mapped[LoginProvider] = mapped_column(
        SAEnum(LoginProvider, name="login_provider"), nullable=False
    )
    external_id: Mapped[str] = mapped_column(String, nullable=False)
    connected_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )


class UserSession(Base):
    """An active admin login session (the Active devices ledger).

    `token_id` is the JWT `jti`. A session is revoked (token invalidated)
    via the security tab. `is_current` is computed from the request's token,
    not stored, so the ledger always reflects the real current device.
    """

    __tablename__ = "user_sessions"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False
    )
    token_id: Mapped[str | None] = mapped_column(
        String, unique=True, index=True, nullable=True
    )
    device_name: Mapped[str | None] = mapped_column(String, nullable=True)
    browser: Mapped[str | None] = mapped_column(String, nullable=True)
    os: Mapped[str | None] = mapped_column(String, nullable=True)
    ip_address: Mapped[str | None] = mapped_column(String, nullable=True)
    location_name: Mapped[str | None] = mapped_column(String, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    last_seen_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    revoked_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )


class UserRecoveryCode(Base):
    """Backup two-step codes, stored hashed (SHA-256) so a DB leak cannot
    reveal usable codes. One-time use only."""

    __tablename__ = "user_recovery_codes"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False
    )
    code_hash: Mapped[str] = mapped_column(String, unique=True, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    used_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
