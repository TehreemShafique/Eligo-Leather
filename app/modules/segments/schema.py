from datetime import datetime
from pydantic import BaseModel, ConfigDict


class SegmentCreate(BaseModel):
    name: str
    description: str | None = None
    percentage_of_customers: float = 0.0
    last_activity: str | None = None
    created_by: str | None = None
    query_definition: str | None = None
    is_system: bool = False


class SegmentUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    percentage_of_customers: float | None = None
    last_activity: str | None = None
    created_by: str | None = None
    query_definition: str | None = None
    is_system: bool | None = None


class SegmentOut(BaseModel):
    id: int
    name: str
    description: str | None
    percentage_of_customers: float
    last_activity: str | None
    created_by: str | None
    query_definition: str | None
    is_system: bool
    created_at: datetime
    updated_at: datetime
    model_config = ConfigDict(from_attributes=True)


class SegmentListOut(BaseModel):
    id: int
    name: str
    description: str | None
    percentage_of_customers: float
    last_activity: str | None
    created_by: str | None
    is_system: bool
    created_at: datetime
    updated_at: datetime
    model_config = ConfigDict(from_attributes=True)
