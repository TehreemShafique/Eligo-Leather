from datetime import datetime

from pydantic import BaseModel, ConfigDict

from app.modules.settings.payment.model import PaymentCaptureMethod


class PaymentMethodCreate(BaseModel):
    name: str
    additional_details: str | None = None
    payment_instructions: str | None = None


class PaymentMethodUpdate(BaseModel):
    name: str | None = None
    additional_details: str | None = None
    payment_instructions: str | None = None


class PaymentMethodOut(BaseModel):
    id: int
    name: str
    additional_details: str | None = None
    payment_instructions: str | None = None
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class PaymentSettingsUpdate(BaseModel):
    gift_cards_expire: bool | None = None
    gift_card_validity_years: int | None = None
    payment_capture_method: PaymentCaptureMethod | None = None


class PaymentSettingsOut(BaseModel):
    id: int
    gift_cards_expire: bool
    gift_card_validity_years: int | None = None
    payment_capture_method: PaymentCaptureMethod
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
