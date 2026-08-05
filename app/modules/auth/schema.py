from pydantic import BaseModel, EmailStr, ConfigDict
from datetime import datetime
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

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"

class LoginRequest(BaseModel):
    email: EmailStr
    password: str
