from datetime import datetime
from decimal import Decimal
from typing import Annotated
from enum import Enum

from pydantic import BaseModel, ConfigDict, EmailStr, Field

from app.modules.orders.model import (
    PaymentStatus, FulfillmentStatus, DeliveryStatus, DeliveryMethod,
    ReturnStatus, LabelStatus, DraftOrderStatus, RecoveryStatus,
    AuditEventType,
)


# ========== Order Items ==========

class OrderItemCreate(BaseModel):
    product_id: int | None = None
    variant_id: int | None = None
    product_name: str
    sku: str | None = None
    variant_title: str | None = None
    quantity: Annotated[int, Field(ge=1, le=99)] = 1
    unit_price: Annotated[Decimal, Field(ge=0)]
    total_price: Annotated[Decimal | None, Field(ge=0)] = None
    requires_shipping: bool = True
    is_gift_card: bool = False


class OrderItemOut(OrderItemCreate):
    id: int
    restocked: bool
    model_config = ConfigDict(from_attributes=True)


# ========== Order Notes ==========

class OrderNoteCreate(BaseModel):
    body: str
    is_customer_visible: bool = False


class OrderNoteOut(BaseModel):
    id: int
    order_id: int
    author_id: int | None
    author_name: str | None
    body: str
    is_customer_visible: bool
    created_at: datetime
    updated_at: datetime
    model_config = ConfigDict(from_attributes=True)


# ========== Order Audit Log ==========

class OrderAuditLogOut(BaseModel):
    id: int
    order_id: int
    event_type: str
    description: str
    actor_name: str | None
    metadata_json: str | None
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)


# ========== Orders ==========

class OrderCreate(BaseModel):
    order_number: str
    customer_id: int | None = None
    location_id: int | None = None
    fulfill_by: datetime | None = None
    channel: str = "Online Store"
    currency: str = "PKR"
    subtotal: Decimal = Decimal("0")
    shipping_cost: Decimal = Decimal("0")
    tax: Decimal = Decimal("0")
    paid_amount: Decimal = Decimal("0")
    tags: str | None = None
    destination: str | None = None
    po_number: str | None = None
    shipping_address: str | None = None
    billing_address: str | None = None
    tracking_company: str | None = None
    tracking_number: str | None = None
    items: list[OrderItemCreate] = []


class OrderUpdate(BaseModel):
    fulfill_by: datetime | None = None
    payment_status: PaymentStatus | None = None
    fulfillment_status: FulfillmentStatus | None = None
    delivery_status: DeliveryStatus | None = None
    delivery_method: DeliveryMethod | None = None
    return_status: ReturnStatus | None = None
    label_status: LabelStatus | None = None
    tags: str | None = None
    destination: str | None = None
    po_number: str | None = None
    shipping_address: str | None = None
    billing_address: str | None = None
    tracking_company: str | None = None
    tracking_number: str | None = None
    paid_amount: Decimal | None = None
    risk_level: str | None = None
    is_archived: bool | None = None


class OrderOut(BaseModel):
    id: int
    order_number: str
    customer_id: int | None
    customer_name: str | None = None
    customer_email: str | None = None
    customer_phone: str | None = None
    # The Order model has no locations feature yet; kept optional so ORM
    # serialization does not crash with AttributeError -> 500.
    location_id: int | None = None
    fulfill_by: datetime | None
    cancelled_at: datetime | None
    closed_at: datetime | None
    confirmed_at: datetime | None = None
    channel: str
    currency: str
    subtotal: Decimal
    shipping_cost: Decimal
    tax: Decimal
    total_price: Decimal
    discount: Decimal = Decimal("0")
    paid_amount: Decimal
    payment_status: PaymentStatus
    fulfillment_status: FulfillmentStatus
    delivery_status: DeliveryStatus
    delivery_method: DeliveryMethod
    return_status: ReturnStatus
    label_status: LabelStatus
    tracking_company: str | None
    tracking_number: str | None
    shipping_address: str | None
    billing_address: str | None
    tags: str | None
    destination: str | None
    po_number: str | None
    risk_level: str | None
    conversion_summary: str | None
    is_archived: bool
    created_at: datetime
    updated_at: datetime
    items: list[OrderItemOut] = []
    model_config = ConfigDict(from_attributes=True)


class OrderListOut(BaseModel):
    id: int
    order_number: str
    customer_id: int | None
    customer_name: str | None = None
    fulfill_by: datetime | None
    confirmed_at: datetime | None = None
    channel: str
    total_price: Decimal
    payment_status: PaymentStatus
    fulfillment_status: FulfillmentStatus
    delivery_status: DeliveryStatus
    tags: str | None
    is_archived: bool
    created_at: datetime
    items: list[OrderItemOut] = []
    model_config = ConfigDict(from_attributes=True)


# ========== Order Confirmation ==========

class OrderConfirmationEmailStatus(str, Enum):
    sent = "sent"                 # customer has an email and the dispatch succeeded
    failed = "failed"             # customer has an email, send was attempted, SMTP failed
    unavailable = "unavailable"   # customer has no email address
    skipped = "skipped"           # email exists but intentionally not sent (disabled/missing)


class ConfirmOrderResponse(BaseModel):
    order_id: int
    order_number: str
    confirmed_at: datetime | None
    already_confirmed: bool
    email_status: OrderConfirmationEmailStatus = OrderConfirmationEmailStatus.skipped
    email_message: str | None = None
    courier_booked: bool
    courier_error: str | None = None


# ========== Export ==========

class ExportScope(str):
    current_page = "current_page"
    all_orders = "all_orders"
    selected = "selected"
    by_search = "by_search"
    by_date = "by_date"


class ExportOrdersRequest(BaseModel):
    scope: str  # current_page | all_orders | selected | by_search | by_date
    format: str = "csv"  # csv | csv_excel
    order_ids: list[int] | None = None
    date_from: datetime | None = None
    date_to: datetime | None = None
    search: str | None = None


class ExportOrdersResponse(BaseModel):
    download_url: str
    filename: str
    total_exported: int


# ========== Analytics Summary ==========

class OrdersAnalyticsSummary(BaseModel):
    total_orders: int
    items_ordered: int
    sales_reversals: Decimal
    orders_fulfilled: int
    total_sales: Decimal
    date_from: datetime | None = None
    date_to: datetime | None = None


# ========== Draft Orders ==========

class DraftOrderItemCreate(BaseModel):
    product_id: int | None = None
    variant_id: int | None = None
    product_name: str
    sku: str | None = None
    variant_title: str | None = None
    quantity: int = 1
    unit_price: Decimal
    total_price: Decimal | None = None
    requires_shipping: bool = True
    is_custom: bool = False


class DraftOrderItemOut(DraftOrderItemCreate):
    id: int
    model_config = ConfigDict(from_attributes=True)


class DraftOrderCreate(BaseModel):
    draft_number: str
    customer_id: int | None = None
    customer_email: str | None = None
    customer_phone: str | None = None
    discount: Decimal = Decimal("0")
    shipping_cost: Decimal = Decimal("0")
    tax: Decimal = Decimal("0")
    currency: str = "PKR"
    market: str | None = None
    shipping_address: str | None = None
    billing_address: str | None = None
    note: str | None = None
    tags: str | None = None
    items: list[DraftOrderItemCreate] = []


class DraftOrderUpdate(BaseModel):
    status: DraftOrderStatus | None = None
    discount: Decimal | None = None
    shipping_cost: Decimal | None = None
    tax: Decimal | None = None
    note: str | None = None
    tags: str | None = None
    shipping_address: str | None = None
    billing_address: str | None = None
    customer_id: int | None = None
    customer_email: str | None = None
    customer_phone: str | None = None


class DraftOrderOut(BaseModel):
    id: int
    draft_number: str
    customer_id: int | None
    customer_email: str | None
    customer_phone: str | None
    subtotal: Decimal
    discount: Decimal
    shipping_cost: Decimal
    tax: Decimal
    total_price: Decimal
    currency: str
    market: str | None
    status: DraftOrderStatus
    shipping_address: str | None
    billing_address: str | None
    note: str | None
    tags: str | None
    created_at: datetime
    updated_at: datetime
    items: list[DraftOrderItemOut] = []
    model_config = ConfigDict(from_attributes=True)


# ========== Abandoned Checkout Items ==========

class AbandonedCheckoutItemOut(BaseModel):
    id: int
    product_id: int | None
    variant_id: int | None
    product_name: str
    sku: str | None
    variant_title: str | None
    quantity: int
    unit_price: Decimal
    total_price: Decimal
    model_config = ConfigDict(from_attributes=True)


# ========== Abandoned Checkouts ==========

class AbandonedCheckoutCreate(BaseModel):
    checkout_reference: str
    customer_id: int | None = None
    customer_name: str | None = None
    customer_email: str | None = None
    customer_phone: str | None = None
    region: str | None = None
    total_price: Decimal = Decimal("0")
    currency: str = "PKR"
    shipping_address: str | None = None
    ip_address: str | None = None
    browser_info: str | None = None
    items: list[DraftOrderItemCreate] = []


class AbandonedCheckoutUpdate(BaseModel):
    recovery_status: RecoveryStatus | None = None
    customer_name: str | None = None
    customer_email: str | None = None
    customer_phone: str | None = None


class AbandonedCheckoutOut(BaseModel):
    id: int
    checkout_reference: str
    customer_id: int | None
    customer_name: str | None
    customer_email: str | None
    customer_phone: str | None
    region: str | None
    total_price: Decimal
    currency: str
    recovery_status: RecoveryStatus
    recovery_token: str | None
    recovery_email_sent_at: datetime | None
    recovered_at: datetime | None
    recovery_attempts: int
    shipping_address: str | None
    ip_address: str | None
    browser_info: str | None
    created_at: datetime
    updated_at: datetime
    items: list[AbandonedCheckoutItemOut] = []
    model_config = ConfigDict(from_attributes=True)


class AbandonedCheckoutListOut(BaseModel):
    id: int
    checkout_reference: str
    customer_name: str | None
    customer_email: str | None
    region: str | None
    recovery_status: RecoveryStatus
    total_price: Decimal
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)


# ========== Send Recovery Email ==========

class SendRecoveryEmailRequest(BaseModel):
    recovery_url: str | None = None  # optional custom URL override


class SendRecoveryEmailResponse(BaseModel):
    success: bool
    message: str
    sent_at: datetime
