from datetime import datetime
from sqlalchemy import String, Boolean, DateTime, Numeric, Integer, ForeignKey, Table, Column, func, Index, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base

# ========== Association Table: Customer <-> Company (M2M) ==========

customer_company = Table(
    "customer_company",
    Base.metadata,
    Column("customer_id", ForeignKey("customers.id", ondelete="CASCADE"), primary_key=True),
    Column("company_id", ForeignKey("companies.id", ondelete="CASCADE"), primary_key=True),
)

# ========== Association Table: Customer <-> Segment (M2M) ==========

customer_segment = Table(
    "customer_segment",
    Base.metadata,
    Column("customer_id", ForeignKey("customers.id", ondelete="CASCADE"), primary_key=True),
    Column("segment_id", ForeignKey("segments.id", ondelete="CASCADE"), primary_key=True),
)

# ========== Customer ==========

class Customer(Base):
    __tablename__ = "customers"
    __table_args__ = (
        Index("ix_customers_email", "email"),
        Index("ix_customers_phone", "phone"),
        Index("ix_customers_last_name", "last_name"),
    )

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    first_name: Mapped[str | None] = mapped_column(String, nullable=True)
    last_name: Mapped[str | None] = mapped_column(String, nullable=True)
    email: Mapped[str | None] = mapped_column(String, unique=True, nullable=True)
    phone: Mapped[str | None] = mapped_column(String, nullable=True)
    phone_country_code: Mapped[str | None] = mapped_column(String(10), nullable=True)
    location: Mapped[str | None] = mapped_column(String, nullable=True)
    postal_code: Mapped[str | None] = mapped_column(String, nullable=True)
    customer_language: Mapped[str | None] = mapped_column(String(10), nullable=True, default="en")

    # Subscription preferences
    email_subscription: Mapped[bool] = mapped_column(Boolean, default=False)
    sms_subscription: Mapped[bool] = mapped_column(Boolean, default=False)
    whatsapp_subscription: Mapped[bool] = mapped_column(Boolean, default=False)

    # Order metrics
    total_orders: Mapped[int] = mapped_column(Integer, default=0)
    amount_spent: Mapped[float] = mapped_column(Numeric(12, 2), default=0)
    first_order_date: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    last_order_date: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    # Tax
    tax_exempt: Mapped[bool] = mapped_column(Boolean, default=False)
    tax_settings: Mapped[str | None] = mapped_column(String, nullable=True, default="collect")

    # Tags & Notes
    tags: Mapped[str | None] = mapped_column(String, nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Default address FK
    default_address_id: Mapped[int | None] = mapped_column(ForeignKey("customer_addresses.id"), nullable=True)

    # Flags
    deletable: Mapped[bool] = mapped_column(Boolean, default=True)
    mergeable: Mapped[bool] = mapped_column(Boolean, default=True)

    # Timestamps
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # ---- Relationships ----
    orders = relationship("Order", back_populates="customer")
    companies = relationship("Company", secondary=customer_company, back_populates="customers")
    segments = relationship("Segment", secondary=customer_segment, back_populates="customers")
    addresses = relationship("CustomerAddress", back_populates="customer", cascade="all, delete-orphan", foreign_keys="CustomerAddress.customer_id")
    default_address = relationship("CustomerAddress", foreign_keys=[default_address_id], post_update=True)


# ========== Customer Address ==========

class CustomerAddress(Base):
    __tablename__ = "customer_addresses"
    __table_args__ = (
        Index("ix_customer_addresses_customer_id", "customer_id"),
    )

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    customer_id: Mapped[int] = mapped_column(ForeignKey("customers.id", ondelete="CASCADE"), nullable=False)

    first_name: Mapped[str | None] = mapped_column(String, nullable=True)
    last_name: Mapped[str | None] = mapped_column(String, nullable=True)
    company: Mapped[str | None] = mapped_column(String, nullable=True)

    address_line1: Mapped[str] = mapped_column(String, nullable=False)
    address_line2: Mapped[str | None] = mapped_column(String, nullable=True)
    city: Mapped[str] = mapped_column(String, nullable=False)
    province: Mapped[str | None] = mapped_column(String, nullable=True)
    postal_code: Mapped[str | None] = mapped_column(String, nullable=True)

    country: Mapped[str] = mapped_column(String, nullable=False, default="Pakistan")
    country_code: Mapped[str | None] = mapped_column(String(10), nullable=True)
    phone: Mapped[str | None] = mapped_column(String, nullable=True)

    is_default: Mapped[bool] = mapped_column(Boolean, default=False)
    address_type: Mapped[str] = mapped_column(String, default="both")  # shipping / billing / both

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    customer = relationship("Customer", back_populates="addresses", foreign_keys=[customer_id])
