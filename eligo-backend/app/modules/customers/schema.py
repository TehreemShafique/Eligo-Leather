from datetime import datetime
from pydantic import BaseModel, EmailStr, ConfigDict


# ========== Customer Address Schemas ==========

class CustomerAddressCreate(BaseModel):
    first_name: str | None = None
    last_name: str | None = None
    company: str | None = None
    address_line1: str
    address_line2: str | None = None
    city: str
    province: str | None = None
    postal_code: str | None = None
    country: str = "Pakistan"
    country_code: str | None = None
    phone: str | None = None
    is_default: bool = False
    address_type: str = "both"


class CustomerAddressUpdate(BaseModel):
    first_name: str | None = None
    last_name: str | None = None
    company: str | None = None
    address_line1: str | None = None
    address_line2: str | None = None
    city: str | None = None
    province: str | None = None
    postal_code: str | None = None
    country: str | None = None
    country_code: str | None = None
    phone: str | None = None
    is_default: bool | None = None
    address_type: str | None = None


class CustomerAddressOut(BaseModel):
    id: int
    customer_id: int
    first_name: str | None
    last_name: str | None
    company: str | None
    address_line1: str
    address_line2: str | None
    city: str
    province: str | None
    postal_code: str | None
    country: str
    country_code: str | None
    phone: str | None
    is_default: bool
    address_type: str
    created_at: datetime
    updated_at: datetime
    model_config = ConfigDict(from_attributes=True)


# ========== Customer Schemas ==========

class CustomerCreate(BaseModel):
    email: str | None = None
    first_name: str | None = None
    last_name: str | None = None
    phone: str | None = None
    phone_country_code: str | None = None
    location: str | None = None
    postal_code: str | None = None
    customer_language: str | None = "en"
    email_subscription: bool = False
    sms_subscription: bool = False
    whatsapp_subscription: bool = False
    tax_exempt: bool = False
    tax_settings: str | None = "collect"
    tags: str | None = None
    notes: str | None = None
    company_ids: list[int] = []
    segment_ids: list[int] = []
    address: CustomerAddressCreate | None = None


class CustomerUpdate(BaseModel):
    email: str | None = None
    first_name: str | None = None
    last_name: str | None = None
    phone: str | None = None
    phone_country_code: str | None = None
    location: str | None = None
    postal_code: str | None = None
    customer_language: str | None = None
    email_subscription: bool | None = None
    sms_subscription: bool | None = None
    whatsapp_subscription: bool | None = None
    total_orders: int | None = None
    amount_spent: float | None = None
    tax_exempt: bool | None = None
    tax_settings: str | None = None
    tags: str | None = None
    notes: str | None = None
    deletable: bool | None = None
    mergeable: bool | None = None
    company_ids: list[int] | None = None
    segment_ids: list[int] | None = None


class CustomerOut(BaseModel):
    id: int
    email: str | None
    first_name: str | None
    last_name: str | None
    phone: str | None
    phone_country_code: str | None
    location: str | None
    postal_code: str | None
    customer_language: str | None
    email_subscription: bool
    sms_subscription: bool
    whatsapp_subscription: bool
    total_orders: int
    amount_spent: float
    first_order_date: datetime | None
    last_order_date: datetime | None
    tax_exempt: bool
    tax_settings: str | None
    tags: str | None
    notes: str | None
    default_address_id: int | None
    deletable: bool
    mergeable: bool
    created_at: datetime
    updated_at: datetime
    addresses: list[CustomerAddressOut] = []
    companies: list = []
    segments: list = []
    model_config = ConfigDict(from_attributes=True)


class CustomerListOut(BaseModel):
    id: int
    email: str | None
    first_name: str | None
    last_name: str | None
    phone: str | None
    location: str | None
    postal_code: str | None
    customer_language: str | None
    total_orders: int
    amount_spent: float
    email_subscription: bool
    sms_subscription: bool
    whatsapp_subscription: bool
    tax_exempt: bool
    tags: str | None
    created_at: datetime
    updated_at: datetime
    model_config = ConfigDict(from_attributes=True)


# ========== Export / Import ==========

class ExportCustomersRequest(BaseModel):
    scope: str = "all"  # all | selected | segment
    customer_ids: list[int] | None = None
    segment_id: int | None = None
    format: str = "csv"


class ImportCustomerRow(BaseModel):
    email: EmailStr
    first_name: str | None = None
    last_name: str | None = None
    phone: str | None = None
    location: str | None = None
    tags: str | None = None


class ImportCustomersRequest(BaseModel):
    customers: list[ImportCustomerRow]
    skip_duplicates: bool = True


class ImportCustomersResponse(BaseModel):
    imported: int
    skipped: int
    errors: list[str] = []


# ========== Sort Options ==========

class CustomerSortField(str):
    amount_spent = "amount_spent"
    orders = "total_orders"
    customer_added_date = "created_at"
    date_customer_updated = "updated_at"
    last_order_date = "last_order_date"
    first_order_date = "first_order_date"
