from sqlalchemy import select, func
from app.modules.settings.security.model import ActivityLogs, CollaboratorCodes
from app.modules.settings.security.schema import ActivityLogOut, CollaboratorCodesOut
from sqlalchemy.ext.asyncio import AsyncSession
import secrets

async def log_activity(db: AsyncSession, event: str, resource_type: str, actor_user_id: str|int|None) -> ActivityLogs:
    entry =  ActivityLogs(event = event, resource_type = resource_type, actor_user_id = actor_user_id)
    db.add(entry)
    await db.commit()
    await db.refresh(entry)
    return entry

async def list_activity_logs(db: AsyncSession, skip: int = 0, limit: int = 50) -> list[ActivityLogs]:
    result = await db.execute(select(ActivityLogs).order_by(ActivityLogs.created_at.desc()).offset(skip).limit(limit))

    return list(result.scalars().all())

async def generate_collaborator_code(db: AsyncSession) -> CollaboratorCodes:
    code = CollaboratorCodes(code=f"{secrets.randbelow(10000):04d}")
    db.add(code)
    await db.commit()
    await db.refresh(code)

    return code

async def list_collaborator_codes(db: AsyncSession) -> list[CollaboratorCodes]:
    result = await db.execute(select(CollaboratorCodes).where(CollaboratorCodes.is_active == True))  # noqa: E712
    return list(result.scalars().all())


async def revoke_collaborator_code(db: AsyncSession, code_id: int) -> CollaboratorCodes | None:
    code = await db.get(CollaboratorCodes, code_id)
    if not code:
        return None
    code.is_active = False
    await db.commit()
    await db.refresh(code)
    return code