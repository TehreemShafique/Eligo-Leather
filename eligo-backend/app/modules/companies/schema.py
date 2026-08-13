from datetime import datetime
from pydantic import BaseModel, ConfigDict


# ========== Company Location Schemas ==========

class CompanyLocationCreate(BaseModel):
    location_name: str
    location_id_ref: str | None = None
    address_line1: str | None = None
    address_line2: str | None = None
    city: str | None = None
    province: str | None = None
    postal_code: str | None = None
    country: str = "Pakistan"
    market: str | None = None
    catalog_id: int | None = None
    payment_terms: str = "none"
    ship_to_address: bool = True
    order_submission: str = "automatic"
    is_active: bool = True


class CompanyLocationUpdate(BaseModel):
    location_name: str | None = None
    location_id_ref: str | None = None
    address_line1: str | None = None
    address_line2: str | None = None
    city: str | None = None
    province: str | None = None
    postal_code: str | None = None
    country: str | None = None
    market: str | None = None
    catalog_id: int | None = None
    payment_terms: str | None = None
    ship_to_address: bool | None = None
    order_submission: str | None = None
    is_active: bool | None = None


class CompanyLocationOut(BaseModel):
    id: int
    company_id: int
    location_name: str
    location_id_ref: str | None
    address_line1: str | None
    address_line2: str | None
    city: str | None
    province: str | None
    postal_code: str | None
    country: str | None
    market: str | None
    catalog_id: int | None
    payment_terms: str | None
    ship_to_address: bool
    order_submission: str | None
    is_active: bool
    created_at: datetime
    updated_at: datetime
    model_config = ConfigDict(from_attributes=True)


# ========== Company Schemas ==========

class CompanyCreate(BaseModel):
    company_name: str
    company_id_ref: str | None = None
    main_contact_id: int | None = None
    billing_address_same_as_shipping: bool = True
    billing_address: str | None = None
    tax_id: str | None = None
    tax_settings: str | None = "collect_unless_exempt"
    note: str | None = None
    custom_pricing_tier: str | None = None
    net_payment_terms: str | None = None
    locations: list[CompanyLocationCreate] = []


class CompanyUpdate(BaseModel):
    company_name: str | None = None
    company_id_ref: str | None = None
    main_contact_id: int | None = None
    billing_address_same_as_shipping: bool | None = None
    billing_address: str | None = None
    tax_id: str | None = None
    tax_settings: str | None = None
    note: str | None = None
    custom_pricing_tier: str | None = None
    net_payment_terms: str | None = None


class CompanyOut(BaseModel):
    id: int
    company_name: str
    company_id_ref: str | None
    main_contact_id: int | None
    billing_address_same_as_shipping: bool
    billing_address: str | None
    tax_id: str | None
    tax_settings: str | None
    note: str | None
    custom_pricing_tier: str | None
    net_payment_terms: str | None
    created_at: datetime
    updated_at: datetime
    locations: list[CompanyLocationOut] = []
    model_config = ConfigDict(from_attributes=True)


class CompanyListOut(BaseModel):
    id: int
    company_name: str
    company_id_ref: str | None
    main_contact_id: int | None
    tax_id: str | None
    net_payment_terms: str | None
    created_at: datetime
    updated_at: datetime
    model_config = ConfigDict(from_attributes=True)
