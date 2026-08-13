from sqlalchemy import String, Boolean, DateTime, Text, func, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from datetime import datetime
from app.db.base import Base
import enum
from sqlalchemy import Enum as SAEnum
class UserType(str, enum.Enum):
    admin = "admin"
    pos = "pos"

class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key= True, index= True)
    full_name: Mapped[str] = mapped_column(String, nullable= True)
    email: Mapped[str] = mapped_column(String, nullable= False, unique= True, index= True)
    hashed_password: Mapped[str] = mapped_column(String, nullable= False)
    is_admin: Mapped[bool] = mapped_column(Boolean, default= False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default= func.now())

    user_type: Mapped[UserType] = mapped_column(SAEnum(UserType), default=UserType.admin)
    role_id: Mapped[int | None] = mapped_column(ForeignKey("roles.id"), nullable= True)

    role = relationship("Roles", back_populates="users")

    # ---- Personal account profile (Settings -> Account) ----
    first_name: Mapped[str | None] = mapped_column(String, nullable=True)
    last_name: Mapped[str | None] = mapped_column(String, nullable=True)
    avatar_url: Mapped[str | None] = mapped_column(String, nullable=True)
    phone: Mapped[str | None] = mapped_column(String, nullable=True)
    email_verified: Mapped[bool] = mapped_column(Boolean, default=False)
    secondary_email: Mapped[str | None] = mapped_column(String, nullable=True)
    secondary_email_verified: Mapped[bool] = mapped_column(Boolean, default=False)
    preferred_language: Mapped[str] = mapped_column(String, default="en")
    regional_format: Mapped[str] = mapped_column(String, default="en-PK")
    timezone: Mapped[str] = mapped_column(String, default="Asia/Karachi")

    # ---- Security (Settings -> Account -> Security) ----
    password_changed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    # Fernet-encrypted TOTP seed (see app.modules.settings.apps.crypto).
    totp_secret: Mapped[str | None] = mapped_column(Text, nullable=True)
    totp_enabled: Mapped[bool] = mapped_column(Boolean, default=False)
    recovery_codes_last_generated_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

