import enum
from datetime import datetime

from sqlalchemy import String, Boolean, Integer, DateTime, JSON, func
from sqlalchemy import Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class ContactMethod(str, enum.Enum):
    phone_or_email = "phone_or_email"
    email = "email"


class FormFieldRequirement(str, enum.Enum):
    don_t_include = "don_t_include"
    optional = "optional"
    required = "required"


class EmailOptinOption(str, enum.Enum):
    checkout_only = "checkout_only"
    signin_only = "signin_only"
    checkout_and_signin = "checkout_and_signin"
    don_t_show = "don_t_show"


class SmsOptinOption(str, enum.Enum):
    don_t_show = "don_t_show"
    checkout_only = "checkout_only"


class BillingAddressRule(str, enum.Enum):
    allow_different = "allow_different"
    require_match = "require_match"


class CheckoutConfig(Base):
    __tablename__ = "checkout_configs"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String, default="My Store configuration", nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

    contact_method: Mapped[ContactMethod] = mapped_column(
        SAEnum(ContactMethod, name="checkout_contact_method"),
        default=ContactMethod.phone_or_email,
    )
    show_order_tracking_link: Mapped[bool] = mapped_column(Boolean, default=False)
    require_login: Mapped[bool] = mapped_column(Boolean, default=False)

    full_name_field: Mapped[FormFieldRequirement] = mapped_column(
        SAEnum(FormFieldRequirement, name="form_field_requirement"),
        default=FormFieldRequirement.required,
    )
    company_name_field: Mapped[FormFieldRequirement] = mapped_column(
        SAEnum(FormFieldRequirement, name="form_field_requirement"),
        default=FormFieldRequirement.don_t_include,
    )
    address_line2_field: Mapped[FormFieldRequirement] = mapped_column(
        SAEnum(FormFieldRequirement, name="form_field_requirement"),
        default=FormFieldRequirement.optional,
    )
    shipping_phone_field: Mapped[FormFieldRequirement] = mapped_column(
        SAEnum(FormFieldRequirement, name="form_field_requirement"),
        default=FormFieldRequirement.required,
    )

    marketing_email_optin: Mapped[EmailOptinOption] = mapped_column(
        SAEnum(EmailOptinOption, name="email_optin_option"),
        default=EmailOptinOption.checkout_and_signin,
    )
    marketing_sms_optin: Mapped[SmsOptinOption] = mapped_column(
        SAEnum(SmsOptinOption, name="sms_optin_option"),
        default=SmsOptinOption.don_t_show,
    )
    show_tipping: Mapped[bool] = mapped_column(Boolean, default=False)
    checkout_language: Mapped[str] = mapped_column(String, default="English")

    billing_address_rule: Mapped[BillingAddressRule] = mapped_column(
        SAEnum(BillingAddressRule, name="billing_address_rule"),
        default=BillingAddressRule.allow_different,
    )
    validate_shipping_address: Mapped[bool] = mapped_column(Boolean, default=False)
    use_shipping_as_billing_default: Mapped[bool] = mapped_column(Boolean, default=True)

    enable_cart_limit: Mapped[bool] = mapped_column(Boolean, default=True)
    cart_item_limit: Mapped[int] = mapped_column(Integer, default=50)

    checkout_rules: Mapped[dict | None] = mapped_column(JSON, nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
