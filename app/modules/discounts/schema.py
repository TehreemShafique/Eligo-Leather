from datetime import datetime
from pydantic import BaseModel, ConfigDict

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
    start_date: datetime | None
    end_date: datetime | None
    created_at: datetime
    updated_at: datetime | None

    model_config = ConfigDict(from_attributes=True)
