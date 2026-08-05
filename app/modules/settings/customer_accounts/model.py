from datetime import datetime

from sqlalchemy import String, Boolean, Integer, DateTime, func
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class CustomerAccountSettings(Base):
    __tablename__ = "customer_account_settings"

    id: Mapped[int] = mapped_column(primary_key=True)

    show_sign_in_links: Mapped[bool] = mapped_column(Boolean, default=True)

    allow_registration: Mapped[bool] = mapped_column(Boolean, default=True)
    require_email_verification: Mapped[bool] = mapped_column(Boolean, default=False)
    session_duration_days: Mapped[int] = mapped_column(Integer, default=30)

    allow_self_returns: Mapped[bool] = mapped_column(Boolean, default=True)
    allow_self_cancellations: Mapped[bool] = mapped_column(Boolean, default=True)
    return_window_days: Mapped[int] = mapped_column(Integer, default=14)

    allow_store_credit: Mapped[bool] = mapped_column(Boolean, default=True)

    account_domain: Mapped[str] = mapped_column(String, default="https://eligoleather.com/account")

    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
