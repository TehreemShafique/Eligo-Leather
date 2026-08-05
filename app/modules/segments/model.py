from datetime import datetime
from sqlalchemy import String, Float, Boolean, DateTime, Text, func, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base


class Segment(Base):
    __tablename__ = "segments"
    __table_args__ = (
        Index("ix_segments_name", "name"),
    )

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String, nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    percentage_of_customers: Mapped[float] = mapped_column(Float, default=0.0)
    last_activity: Mapped[str | None] = mapped_column(String, nullable=True)
    created_by: Mapped[str | None] = mapped_column(String, nullable=True)
    query_definition: Mapped[str | None] = mapped_column(Text, nullable=True)
    is_system: Mapped[bool] = mapped_column(Boolean, default=False)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # M2M back-reference (imported from customers/model.py via customer_segment table)
    customers = relationship(
        "Customer",
        secondary="customer_segment",
        back_populates="segments",
    )
