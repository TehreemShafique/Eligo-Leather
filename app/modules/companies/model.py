import enum
from datetime import datetime
from sqlalchemy import String, Boolean, DateTime, Integer, ForeignKey, Text, func, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base


class PaymentTerms(str, enum.Enum):
    none = "none"
    due_on_fulfillment = "due_on_fulfillment"
    net_7 = "net_7"
    net_15 = "net_15"
    net_30 = "net_30"
    net_45 = "net_45"
    net_60 = "net_60"
    net_90 = "net_90"


class OrderSubmissionMode(str, enum.Enum):
    automatic = "automatic"
    draft_without_address = "draft_without_address"
    all_drafts = "all_drafts"


class TaxCollectionMode(str, enum.Enum):
    collect_unless_exempt = "collect_unless_exempt"
    dont_collect = "dont_collect"


class Company(Base):
    __tablename__ = "companies"
    __table_args__ = (
        Index("ix_companies_company_name", "company_name"),
    )

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    company_name: Mapped[str] = mapped_column(String, nullable=False)
    company_id_ref: Mapped[str | None] = mapped_column(String, unique=True, nullable=True)
    main_contact_id: Mapped[int | None] = mapped_column(ForeignKey("customers.id"), nullable=True)

    # Billing
    billing_address_same_as_shipping: Mapped[bool] = mapped_column(Boolean, default=True)
    billing_address: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Tax
    tax_id: Mapped[str | None] = mapped_column(String, nullable=True)
    tax_settings: Mapped[str | None] = mapped_column(String, nullable=True, default="collect_unless_exempt")

    # Notes
    note: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Legacy fields (kept for backward compatibility)
    custom_pricing_tier: Mapped[str | None] = mapped_column(String, nullable=True)
    net_payment_terms: Mapped[str | None] = mapped_column(String, nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    customers = relationship(
        "Customer",
        secondary="customer_company",
        back_populates="companies",
    )
    main_contact = relationship("Customer", foreign_keys=[main_contact_id], post_update=True)
    locations = relationship("CompanyLocation", back_populates="company", cascade="all, delete-orphan")


class CompanyLocation(Base):
    __tablename__ = "company_locations"
    __table_args__ = (
        Index("ix_company_locations_company_id", "company_id"),
    )

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    company_id: Mapped[int] = mapped_column(ForeignKey("companies.id", ondelete="CASCADE"), nullable=False)
    location_name: Mapped[str] = mapped_column(String, nullable=False)
    location_id_ref: Mapped[str | None] = mapped_column(String, nullable=True)

    # Address
    address_line1: Mapped[str | None] = mapped_column(String, nullable=True)
    address_line2: Mapped[str | None] = mapped_column(String, nullable=True)
    city: Mapped[str | None] = mapped_column(String, nullable=True)
    province: Mapped[str | None] = mapped_column(String, nullable=True)
    postal_code: Mapped[str | None] = mapped_column(String, nullable=True)
    country: Mapped[str] = mapped_column(String, nullable=True, default="Pakistan")

    # Market & Catalog
    market: Mapped[str | None] = mapped_column(String, nullable=True)
    catalog_id: Mapped[int | None] = mapped_column(Integer, nullable=True)

    # Payment terms (per-location override)
    payment_terms: Mapped[str] = mapped_column(String, nullable=True, default="none")

    # Checkout configuration
    ship_to_address: Mapped[bool] = mapped_column(Boolean, default=True)
    order_submission: Mapped[str] = mapped_column(String, nullable=True, default="automatic")

    # Status
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    company = relationship("Company", back_populates="locations")
