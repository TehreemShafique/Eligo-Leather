from datetime import datetime

from pydantic import BaseModel, ConfigDict, field_validator

from app.modules.settings.checkout.model import (
    ContactMethod,
    FormFieldRequirement,
    EmailOptinOption,
    SmsOptinOption,
    BillingAddressRule,
)


class CheckoutConfigCreate(BaseModel):
    name: str | None = None


class CheckoutConfigRename(BaseModel):
    name: str


class CheckoutConfigUpdate(BaseModel):
    name: str | None = None
    contact_method: ContactMethod | None = None
    show_order_tracking_link: bool | None = None
    require_login: bool | None = None
    full_name_field: FormFieldRequirement | None = None
    company_name_field: FormFieldRequirement | None = None
    address_line2_field: FormFieldRequirement | None = None
    shipping_phone_field: FormFieldRequirement | None = None
    marketing_email_optin: EmailOptinOption | None = None
    marketing_sms_optin: SmsOptinOption | None = None
    show_tipping: bool | None = None
    checkout_language: str | None = None
    billing_address_rule: BillingAddressRule | None = None
    validate_shipping_address: bool | None = None
    use_shipping_as_billing_default: bool | None = None
    enable_cart_limit: bool | None = None
    cart_item_limit: int | None = None
    checkout_rules: dict | None = None

    @field_validator("cart_item_limit")
    @classmethod
    def validate_cart_limit(cls, value):
        if value is not None and value < 1:
            raise ValueError("Cart item limit must be at least 1")
        return value


class CheckoutConfigOut(BaseModel):
    id: int
    name: str
    is_active: bool
    contact_method: ContactMethod
    show_order_tracking_link: bool
    require_login: bool
    full_name_field: FormFieldRequirement
    company_name_field: FormFieldRequirement
    address_line2_field: FormFieldRequirement
    shipping_phone_field: FormFieldRequirement
    marketing_email_optin: EmailOptinOption
    marketing_sms_optin: SmsOptinOption
    show_tipping: bool
    checkout_language: str
    billing_address_rule: BillingAddressRule
    validate_shipping_address: bool
    use_shipping_as_billing_default: bool
    enable_cart_limit: bool
    cart_item_limit: int
    checkout_rules: dict | None = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
