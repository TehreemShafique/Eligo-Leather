import enum
from app.db.base import Base
from datetime import datetime, timezone
from decimal import Decimal
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import String, Boolean, ForeignKey, Numeric, func, Text, DateTime, Integer, Index
from sqlalchemy import Enum as SAEnum

# ==== Timestamps ====

def _utcnow() -> datetime:
    return datetime.now(timezone.utc)

# ==== Enums ====

class PaymentStatus(str, enum.Enum):
    paid = "paid"
    pending = "pending"
    voided = "voided"
    refunded = "refunded"
    partially_paid = "partially_paid"

class FulfillmentStatus(str, enum.Enum):
    fulfilled = "fulfilled"
    unfulfilled = "unfulfilled"
    partial = "partial"
    scheduled = "scheduled"

class DeliveryStatus(str, enum.Enum):
    pending = "pending"
    booked = "booked"
    picked_up = "picked_up"
    in_transit = "in_transit"
    out_for_delivery = "out_for_delivery"
    delivered = "delivered"
    failed = "failed"
    returned = "returned"

class DeliveryMethod(str, enum.Enum):
    standard = "standard"
    express = "express"
    pickup = "pickup"

class ReturnStatus(str, enum.Enum):
    none = "none"
    requested = "requested"
    approved = "approved"
    received = "received"
    refunded = "refunded"

class LabelStatus(str, enum.Enum):
    not_generated = "not_generated"
    generated = "generated"
    printed = "printed"

class DraftOrderStatus(str, enum.Enum):
    open = "open"
    invoice_sent = "invoice_sent"
    completed = "completed"
    cancelled = "cancelled"

class RecoveryStatus(str, enum.Enum):
    not_sent = "not_sent"
    email_sent = "email_sent"
    recovered = "recovered"
    lost = "lost"

class AuditEventType(str, enum.Enum):
    order_created = "order_created"
    customer_confirmed = "customer_confirmed"
    payment_updated = "payment_updated"
    fulfillment_updated = "fulfillment_updated"
    delivery_updated = "delivery_updated"
    tracking_updated = "tracking_updated"
    email_sent = "email_sent"
    note_added = "note_added"
    tag_added = "tag_added"
    tag_removed = "tag_removed"
    return_requested = "return_requested"
    return_approved = "return_approved"
    return_received = "return_received"
    restock_completed = "restock_completed"
    address_updated = "address_updated"
    order_archived = "order_archived"
    order_cancelled = "order_cancelled"
    status_changed = "status_changed"
    courier_update = "courier_update"
    internal_comment = "internal_comment"
    recovery_email_sent = "recovery_email_sent"


# ==== Active Orders ====

class Order(Base):
    __tablename__ = "orders"
    __table_args__ = (
        # Enforce at the PostgreSQL level that a given checkout request can
        # only ever produce one order (idempotency). Duplicate submissions —
        # double-clicks, browser/network retries — hit the unique index instead
        # of creating a second order / double-deducting stock. NULL allows
        # legacy orders that were never issued an idempotency key.
        Index("ix_orders_idempotency_key", "idempotency_key", unique=True),
    )

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    order_number: Mapped[str] = mapped_column(String, unique=True, index=True, nullable=False)
    customer_id: Mapped[int | None] = mapped_column(ForeignKey("customers.id"), nullable=True)
    # Client-supplied, DB-unique checkout/order request identifier used to
    # make order creation idempotent (see POST /api/v1/orders/create-order).
    idempotency_key: Mapped[str | None] = mapped_column(String, nullable=True)
    # Storefront visitor cookie (``eligo_visitor_id``) captured at checkout so
    # anonymous visitors can be matched for duplicate-order detection and the
    # one-time welcome discount can be tied to the order that redeemed it.
    visitor_id: Mapped[str | None] = mapped_column(String, nullable=True)
    # location_id: Mapped[int | None] = mapped_column(ForeignKey("locations.id"), nullable=True)

    # Timestamps
    fulfill_by: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    cancelled_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    closed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    # Customer phone-confirmation gate: null = not yet confirmed by phone,
    # set = admin confirmed after speaking with the customer. Only confirmed
    # orders move to the courier workflow.
    confirmed_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True, index=True
    )

    channel: Mapped[str] = mapped_column(String, default="Online Store")
    currency: Mapped[str] = mapped_column(String(3), default="PKR")

    # Financial
    subtotal: Mapped[Decimal] = mapped_column(Numeric(10, 2), default=0)
    shipping_cost: Mapped[Decimal] = mapped_column(Numeric(10, 2), default=0)
    tax: Mapped[Decimal] = mapped_column(Numeric(10, 2), default=0)
    total_price: Mapped[Decimal] = mapped_column(Numeric(10, 2), default=0)
    # Promo-code amount (server-computed at order creation).
    discount: Mapped[Decimal] = mapped_column(Numeric(10, 2), default=0)
    paid_amount: Mapped[Decimal] = mapped_column(Numeric(10, 2), default=0)
    # "COD" for cash on delivery storefront orders; None for legacy orders.
    payment_method: Mapped[str | None] = mapped_column(String, nullable=True)

    # Statuses
    payment_status: Mapped[PaymentStatus] = mapped_column(SAEnum(PaymentStatus), default=PaymentStatus.pending)
    fulfillment_status: Mapped[FulfillmentStatus] = mapped_column(SAEnum(FulfillmentStatus), default=FulfillmentStatus.unfulfilled)
    delivery_status: Mapped[DeliveryStatus] = mapped_column(SAEnum(DeliveryStatus), default=DeliveryStatus.pending)
    delivery_method: Mapped[DeliveryMethod] = mapped_column(SAEnum(DeliveryMethod), default=DeliveryMethod.standard)
    return_status: Mapped[ReturnStatus] = mapped_column(SAEnum(ReturnStatus), default=ReturnStatus.none)
    label_status: Mapped[LabelStatus] = mapped_column(SAEnum(LabelStatus), default=LabelStatus.not_generated)

    # Tracking
    tracking_company: Mapped[str | None] = mapped_column(String, nullable=True)
    tracking_number: Mapped[str | None] = mapped_column(String, nullable=True)

    # Addresses (stored as JSON text)
    shipping_address: Mapped[str | None] = mapped_column(Text, nullable=True)
    billing_address: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Structured delivery-address snapshot taken at order creation so later
    # edits to the customer profile or shipping settings never rewrite the
    # history of existing orders.
    shipping_name: Mapped[str | None] = mapped_column(String, nullable=True)
    shipping_phone: Mapped[str | None] = mapped_column(String, nullable=True)
    shipping_address_line1: Mapped[str | None] = mapped_column(Text, nullable=True)
    shipping_city: Mapped[str | None] = mapped_column(String, nullable=True)
    shipping_province: Mapped[str | None] = mapped_column(String, nullable=True)
    shipping_postal_code: Mapped[str | None] = mapped_column(String, nullable=True)
    shipping_country: Mapped[str | None] = mapped_column(String, nullable=True)

    # Metadata (customer_note / internal_note columns were removed)
    tags: Mapped[str | None] = mapped_column(String, nullable=True)
    destination: Mapped[str | None] = mapped_column(String, nullable=True)
    po_number: Mapped[str | None] = mapped_column(String, nullable=True)

    # Risk & conversion
    risk_level: Mapped[str | None] = mapped_column(String, nullable=True)
    conversion_summary: Mapped[str | None] = mapped_column(Text, nullable=True)

    is_archived: Mapped[bool] = mapped_column(Boolean, default=False)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow, onupdate=_utcnow)

    # Relationships
    customer = relationship("Customer", back_populates="orders")
    # location = relationship("Location")
    # location_id: Mapped[int | None] = mapped_column(ForeignKey("locations.id"), nullable=True)
    items = relationship("OrderItem", back_populates="order", cascade="all, delete-orphan")
    audit_logs = relationship("OrderAuditLog", back_populates="order", cascade="all, delete-orphan")
    notes = relationship("OrderNote", back_populates="order", cascade="all, delete-orphan")

    @property
    def customer_name(self) -> str | None:
        # Prefer the order's own checkout snapshot (``shipping_name``) so each
        # order always reports the name it was placed with, even when a shared
        # customer record is later edited or the same email is reused with a
        # different name on a later order. Falls back to the linked profile.
        if self.shipping_name:
            return self.shipping_name
        if self.customer is None:
            return None
        parts = [self.customer.first_name or "", self.customer.last_name or ""]
        name = " ".join(p for p in parts if p).strip()
        return name or self.customer.email

    @property
    def customer_email(self) -> str | None:
        return self.customer.email if self.customer else None

    @property
    def customer_phone(self) -> str | None:
        # Prefer the order's own checkout snapshot so each order keeps the
        # contact number used at purchase time.
        if self.shipping_phone:
            return self.shipping_phone
        return self.customer.phone if self.customer else None


class OrderItem(Base):
    __tablename__ = "order_items"

    id: Mapped[int] = mapped_column(primary_key=True)
    order_id: Mapped[int] = mapped_column(ForeignKey("orders.id"), nullable=False)
    product_id: Mapped[int | None] = mapped_column(Integer, nullable=True)
    variant_id: Mapped[int | None] = mapped_column(Integer, nullable=True)

    product_name: Mapped[str] = mapped_column(String, nullable=False)
    sku: Mapped[str | None] = mapped_column(String, nullable=True)
    variant_title: Mapped[str | None] = mapped_column(String, nullable=True)
    quantity: Mapped[int] = mapped_column(Integer, default=1)
    unit_price: Mapped[Decimal] = mapped_column(Numeric(10, 2), default=0)
    total_price: Mapped[Decimal] = mapped_column(Numeric(10, 2), default=0)
    requires_shipping: Mapped[bool] = mapped_column(Boolean, default=True)
    is_gift_card: Mapped[bool] = mapped_column(Boolean, default=False)
    restocked: Mapped[bool] = mapped_column(Boolean, default=False)

    order = relationship("Order", back_populates="items")


class OrderNote(Base):
    __tablename__ = "order_notes"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    order_id: Mapped[int] = mapped_column(ForeignKey("orders.id"), nullable=False)
    author_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    author_name: Mapped[str | None] = mapped_column(String, nullable=True)
    body: Mapped[str] = mapped_column(Text, nullable=False)
    is_customer_visible: Mapped[bool] = mapped_column(Boolean, default=False)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow, onupdate=_utcnow)

    order = relationship("Order", back_populates="notes")


class OrderAuditLog(Base):
    __tablename__ = "order_audit_logs"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    order_id: Mapped[int] = mapped_column(ForeignKey("orders.id"), nullable=False)
    event_type: Mapped[str] = mapped_column(String, nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    actor_name: Mapped[str | None] = mapped_column(String, nullable=True)
    metadata_json: Mapped[str | None] = mapped_column(Text, nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow)

    order = relationship("Order", back_populates="audit_logs")


# ==== Draft Orders ====

class DraftOrder(Base):
    __tablename__ = "draft_orders"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    draft_number: Mapped[str] = mapped_column(String, unique=True, index=True, nullable=False)
    customer_id: Mapped[int | None] = mapped_column(ForeignKey("customers.id"), nullable=True)

    # Customer info (for manual orders without existing customer)
    customer_email: Mapped[str | None] = mapped_column(String, nullable=True)
    customer_phone: Mapped[str | None] = mapped_column(String, nullable=True)

    # Financial
    subtotal: Mapped[Decimal] = mapped_column(Numeric(10, 2), default=0)
    discount: Mapped[Decimal] = mapped_column(Numeric(10, 2), default=0)
    shipping_cost: Mapped[Decimal] = mapped_column(Numeric(10, 2), default=0)
    tax: Mapped[Decimal] = mapped_column(Numeric(10, 2), default=0)
    total_price: Mapped[Decimal] = mapped_column(Numeric(10, 2), default=0)
    currency: Mapped[str] = mapped_column(String(3), default="PKR")

    # Market
    market: Mapped[str | None] = mapped_column(String, nullable=True)

    # Status
    status: Mapped[DraftOrderStatus] = mapped_column(SAEnum(DraftOrderStatus), default=DraftOrderStatus.open)

    # Addresses
    shipping_address: Mapped[str | None] = mapped_column(Text, nullable=True)
    billing_address: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Metadata
    note: Mapped[str | None] = mapped_column(Text, nullable=True)
    tags: Mapped[str | None] = mapped_column(String, nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow, onupdate=_utcnow)

    customer = relationship("Customer")
    items = relationship("DraftOrderItem", back_populates="draft_order", cascade="all, delete-orphan")


class DraftOrderItem(Base):
    __tablename__ = "draft_order_items"

    id: Mapped[int] = mapped_column(primary_key=True)
    draft_order_id: Mapped[int] = mapped_column(ForeignKey("draft_orders.id"), nullable=False)
    product_id: Mapped[int | None] = mapped_column(Integer, nullable=True)
    variant_id: Mapped[int | None] = mapped_column(Integer, nullable=True)

    product_name: Mapped[str] = mapped_column(String, nullable=False)
    sku: Mapped[str | None] = mapped_column(String, nullable=True)
    variant_title: Mapped[str | None] = mapped_column(String, nullable=True)
    quantity: Mapped[int] = mapped_column(Integer, default=1)
    unit_price: Mapped[Decimal] = mapped_column(Numeric(10, 2), default=0)
    total_price: Mapped[Decimal] = mapped_column(Numeric(10, 2), default=0)
    requires_shipping: Mapped[bool] = mapped_column(Boolean, default=True)
    is_custom: Mapped[bool] = mapped_column(Boolean, default=False)

    draft_order = relationship("DraftOrder", back_populates="items")


# ==== Abandoned Checkouts ====

class AbandonedCheckout(Base):
    __tablename__ = "abandoned_checkouts"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    checkout_reference: Mapped[str] = mapped_column(String, unique=True, index=True, nullable=False)

    # Customer info
    customer_id: Mapped[int | None] = mapped_column(ForeignKey("customers.id"), nullable=True)
    customer_name: Mapped[str | None] = mapped_column(String, nullable=True)
    customer_email: Mapped[str | None] = mapped_column(String, nullable=True)
    customer_phone: Mapped[str | None] = mapped_column(String, nullable=True)
    region: Mapped[str | None] = mapped_column(String, nullable=True)

    # Financial
    total_price: Mapped[Decimal] = mapped_column(Numeric(10, 2), default=0)
    currency: Mapped[str] = mapped_column(String(3), default="PKR")

    # Recovery
    recovery_status: Mapped[RecoveryStatus] = mapped_column(SAEnum(RecoveryStatus), default=RecoveryStatus.not_sent)
    recovery_token: Mapped[str | None] = mapped_column(String, unique=True, nullable=True)
    recovery_email_sent_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    recovered_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    recovery_attempts: Mapped[int] = mapped_column(Integer, default=0)

    # Shipping address at time of checkout
    shipping_address: Mapped[str | None] = mapped_column(Text, nullable=True)

    # IP / session
    ip_address: Mapped[str | None] = mapped_column(String, nullable=True)
    browser_info: Mapped[str | None] = mapped_column(String, nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow, onupdate=_utcnow)

    customer = relationship("Customer")
    items = relationship("AbandonedCheckoutItem", back_populates="checkout", cascade="all, delete-orphan")


class AbandonedCheckoutItem(Base):
    __tablename__ = "abandoned_checkout_items"

    id: Mapped[int] = mapped_column(primary_key=True)
    checkout_id: Mapped[int] = mapped_column(ForeignKey("abandoned_checkouts.id"), nullable=False)
    product_id: Mapped[int | None] = mapped_column(Integer, nullable=True)
    variant_id: Mapped[int | None] = mapped_column(Integer, nullable=True)

    product_name: Mapped[str] = mapped_column(String, nullable=False)
    sku: Mapped[str | None] = mapped_column(String, nullable=True)
    variant_title: Mapped[str | None] = mapped_column(String, nullable=True)
    quantity: Mapped[int] = mapped_column(Integer, default=1)
    unit_price: Mapped[Decimal] = mapped_column(Numeric(10, 2), default=0)
    total_price: Mapped[Decimal] = mapped_column(Numeric(10, 2), default=0)

    checkout = relationship("AbandonedCheckout", back_populates="items")


# ==== Leopards Courier integration ====

class LeopardShipment(Base):
    """A packet booked on Leopards, keyed by its consignment number (CN)."""

    __tablename__ = "leopard_shipments"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    cn_number: Mapped[str] = mapped_column(String, unique=True, index=True, nullable=False)
    booked_packet_id: Mapped[int | None] = mapped_column(Integer, nullable=True)
    order_number: Mapped[str | None] = mapped_column(String, nullable=True)
    booking_date: Mapped[str | None] = mapped_column(String, nullable=True)
    weight: Mapped[str | None] = mapped_column(String, nullable=True)
    pieces: Mapped[int | None] = mapped_column(Integer, nullable=True)
    collect_amount: Mapped[str | None] = mapped_column(String, nullable=True)
    destination_city: Mapped[str | None] = mapped_column(String, nullable=True)
    consignee_name: Mapped[str | None] = mapped_column(String, nullable=True)
    consignee_phone: Mapped[str | None] = mapped_column(String, nullable=True)
    consignee_address: Mapped[str | None] = mapped_column(Text, nullable=True)
    invoice_number: Mapped[str | None] = mapped_column(String, nullable=True)
    invoice_date: Mapped[str | None] = mapped_column(String, nullable=True)
    current_status: Mapped[str | None] = mapped_column(String, nullable=True)
    raw_json: Mapped[str | None] = mapped_column(Text, nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow, onupdate=_utcnow)


class LeopardLoadSheet(Base):
    """A generated load sheet / challan number on Leopards."""

    __tablename__ = "leopard_load_sheets"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    challan_no: Mapped[str] = mapped_column(String, unique=True, index=True, nullable=False)
    challan_date: Mapped[str | None] = mapped_column(String, nullable=True)
    pickup_date: Mapped[str | None] = mapped_column(String, nullable=True)
    printed_on: Mapped[str | None] = mapped_column(String, nullable=True)
    acc_no: Mapped[str | None] = mapped_column(String, nullable=True)
    company_name: Mapped[str | None] = mapped_column(String, nullable=True)
    handed_over_to_code: Mapped[str | None] = mapped_column(String, nullable=True)
    handed_over_to_name: Mapped[str | None] = mapped_column(String, nullable=True)
    items_json: Mapped[str | None] = mapped_column(Text, nullable=True)
    total_pieces: Mapped[int | None] = mapped_column(Integer, nullable=True)
    total_packets: Mapped[int | None] = mapped_column(Integer, nullable=True)
    total_cod: Mapped[str | None] = mapped_column(String, nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow)


class LeopardLog(Base):
    """Audit log of CN generation and Leopards API operations."""

    __tablename__ = "leopard_logs"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    order_number: Mapped[str | None] = mapped_column(String, nullable=True)
    log_type: Mapped[str] = mapped_column(String, nullable=False)
    status: Mapped[str] = mapped_column(String, nullable=False)
    detail: Mapped[str | None] = mapped_column(Text, nullable=True)
    date: Mapped[str] = mapped_column(String, nullable=False)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow)
