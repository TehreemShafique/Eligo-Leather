from pydantic import BaseModel, EmailStr, ConfigDict
from datetime import datetime
from app.modules.auth.model import UserType
class UserCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: str | None = None

class User_out(BaseModel):
    id: int
    email: EmailStr
    full_name: str | None = None
    is_admin: bool
    is_active: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class MeOut(User_out):
    user_type: UserType = UserType.pos
    role_id: int | None = None
    domain: str | None = None

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    show_welcome_discount: bool = False
    welcome_discount_percentage: float | None = None

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class PinLoginRequest(BaseModel):
    code: str
    email: EmailStr
