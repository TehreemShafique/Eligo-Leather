import enum
from datetime import datetime

from sqlalchemy import String, Boolean, Integer, DateTime, Text, func
from sqlalchemy import Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class PaymentCaptureMethod(str, enum.Enum):
    auto_checkout = "automatically_at_checkout"
    auto_on_fulfillment = "automatically_on_fulfillment"
    manual = "manual"


class PaymentMethod(Base):
    __tablename__ = "payment_methods"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String, nullable=False)
    additional_details: Mapped[str | None] = mapped_column(Text, nullable=True)
    payment_instructions: Mapped[str | None] = mapped_column(Text, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


class PaymentSettings(Base):
    __tablename__ = "payment_settings"

    id: Mapped[int] = mapped_column(primary_key=True)
    gift_cards_expire: Mapped[bool] = mapped_column(Boolean, default=False)
    gift_card_validity_years: Mapped[int | None] = mapped_column(Integer, nullable=True)
    payment_capture_method: Mapped[PaymentCaptureMethod] = mapped_column(
        SAEnum(PaymentCaptureMethod, name="payment_capture_method"),
        default=PaymentCaptureMethod.manual,
    )

    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
