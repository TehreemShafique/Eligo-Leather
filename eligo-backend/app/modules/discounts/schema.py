from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.modules.discounts.model import (
    DiscountStatus,
    DiscountMethod,
    DiscountEligibility,
    DiscountType,
)


# ---------------------------------------------------------------------------
# Create / Update / Response
# ---------------------------------------------------------------------------

class DiscountCreate(BaseModel):
    title: str
    code: str | None = None
    status: DiscountStatus = DiscountStatus.active
    method: DiscountMethod = DiscountMethod.code
    eligibility: DiscountEligibility = DiscountEligibility.all_customers
    type: DiscountType = DiscountType.percentage
    combinations: str | None = None
    used_count: int = 0
    value: str | None = None
    percentage_value: float | None = Field(default=None, ge=0, le=100)
    value_amount: float | None = Field(default=None, ge=0)
    applies_to_products: list[int] = []
    applies_to_variants: list[int] = []
    start_date: datetime | None = None
    end_date: datetime | None = None


class DiscountUpdate(BaseModel):
    title: str | None = None
    code: str | None = None
    status: DiscountStatus | None = None
    method: DiscountMethod | None = None
    eligibility: DiscountEligibility | None = None
    type: DiscountType | None = None
    combinations: str | None = None
    used_count: int | None = None
    value: str | None = None
    percentage_value: float | None = Field(default=None, ge=0, le=100)
    value_amount: float | None = Field(default=None, ge=0)
    applies_to_products: list[int] | None = None
    applies_to_variants: list[int] | None = None
    start_date: datetime | None = None
    end_date: datetime | None = None


class DiscountOut(BaseModel):
    id: int
    title: str
    code: str | None
    status: DiscountStatus
    method: DiscountMethod
    eligibility: DiscountEligibility
    type: DiscountType
    combinations: str | None
    used_count: int
    value: str | None
    percentage_value: float | None
    value_amount: float | None
    applies_to_products: list[int] = []
    applies_to_variants: list[int] = []
    start_date: datetime | None
    end_date: datetime | None
    created_at: datetime
    updated_at: datetime | None

    model_config = ConfigDict(from_attributes=True)

    @field_validator("applies_to_products", "applies_to_variants", mode="before")
    @classmethod
    def _coerce_null_lists(cls, value):
        return value if value is not None else []


# ---------------------------------------------------------------------------
# Welcome Discount
# ---------------------------------------------------------------------------

class WelcomeDiscountOut(BaseModel):
    discount_percentage: float
    is_active: bool
    updated_by: int | None
    updated_at: datetime | None

    model_config = ConfigDict(from_attributes=True)


class WelcomeDiscountUpdate(BaseModel):
    discount_percentage: float | None = Field(default=None, ge=0, le=100)
    is_active: bool | None = None


class WelcomeDiscountResult(BaseModel):
    show_welcome_discount: bool = False
    discount_percentage: float | None = None
    coupon_code: str | None = None
