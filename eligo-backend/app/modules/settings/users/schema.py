from datetime import datetime
from pydantic import BaseModel, EmailStr, ConfigDict
from app.modules.auth.model import UserType


class StaffUserCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: str | None = None
    user_type: UserType = UserType.admin
    role_id: int | None = None


class StaffUserUpdate(BaseModel):
    full_name: str | None = None
    role_id: int | None = None
    is_active: bool | None = None


class StaffUserOut(BaseModel):
    id: int
    email: EmailStr
    full_name: str | None
    user_type: UserType
    role_id: int | None
    is_admin: bool
    is_active: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)