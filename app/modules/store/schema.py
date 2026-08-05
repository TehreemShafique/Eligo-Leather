from datetime import datetime

from pydantic import BaseModel, Field

MAX_HEADER_SCRIPT_CHARS = 10000


class HeaderScriptUpdate(BaseModel):
    header_scripts: str = Field(
        default="",
        max_length=MAX_HEADER_SCRIPT_CHARS,
    )


class HeaderScriptOut(BaseModel):
    user_id: int
    header_scripts: str
    updated_at: datetime | None
    disclaimer: str
