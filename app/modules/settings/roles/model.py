import enum
from app.db.base import Base
from sqlalchemy.orm import Mapped, mapped_column, relationship
from datetime import datetime
from sqlalchemy import String, Integer, Boolean, func, DateTime, Date
from sqlalchemy import Enum as SAEnum

class RoleDomain(str, enum.Enum):
    organization = "organization"
    store = "store"
    point_of_sale = "point_of_sale"

class Roles(Base):
    __tablename__ = "roles"

    id : Mapped[int] = mapped_column(primary_key=True, index=True)
    name : Mapped[str] = mapped_column(String, unique=True, nullable=False)
    domain: Mapped[RoleDomain] = mapped_column(SAEnum(RoleDomain), nullable=False)
    description: Mapped[str | None] = mapped_column(String, nullable=True)
    is_system: Mapped[bool] = mapped_column(Boolean, default=True)
    create_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    users = relationship("User", back_populates="role")