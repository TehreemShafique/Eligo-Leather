from pydantic import BaseModel, ConfigDict
from datetime import datetime

class ActivityLogOut(BaseModel):
    id: int
    event: str
    resource_type: str
    actor_user_id: int | None = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class CollaboratorCodesOut(BaseModel):
    id: int
    code: str
    is_active: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)



