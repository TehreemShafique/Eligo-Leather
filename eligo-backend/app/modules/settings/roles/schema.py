from datetime import datetime
from pydantic import BaseModel, ConfigDict
from app.modules.settings.roles.model import RoleDomain

class RoleCreate(BaseModel):
    name: str
    domain: RoleDomain
    description: str | None = None

    # create a new role in admin panel

class RoleOut(BaseModel):
    id: int
    name: str
    domain: RoleDomain
    description: str | None 
    is_system: bool
    user_count: int = 0

    model_config = ConfigDict(from_attributes=True)


