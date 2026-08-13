from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.store.model import StoreHeaderScript
from app.modules.store.schema import HeaderScriptOut, HeaderScriptUpdate

HEADER_SCRIPTS_WARNING = (
    "Add custom HTML, meta tags, or script tags (like Google Analytics or "
    "Facebook Pixel) to your store's header. Use caution; broken code can "
    "affect your store's layout."
)


async def get_header_script(
    db: AsyncSession, user_id: int,
) -> StoreHeaderScript | None:
    result = await db.execute(
        select(StoreHeaderScript).where(StoreHeaderScript.user_id == user_id),
    )
    return result.scalar_one_or_none()


async def ensure_header_script(
    db: AsyncSession, user_id: int,
) -> StoreHeaderScript:
    """Return the user's record, creating an empty one on first access so
    the owner always has a row to edit."""
    script = await get_header_script(db, user_id)
    if script is None:
        script = StoreHeaderScript(user_id=user_id, header_scripts="")
        db.add(script)
        await db.commit()
        await db.refresh(script)
    return script


async def update_header_script(
    db: AsyncSession,
    user_id: int,
    data: HeaderScriptUpdate,
) -> StoreHeaderScript:
    script = await ensure_header_script(db, user_id)
    script.header_scripts = data.header_scripts
    await db.commit()
    await db.refresh(script)
    return script


def to_out(script: StoreHeaderScript | None) -> HeaderScriptOut:
    if script is None:
        return HeaderScriptOut(
            user_id=0,
            header_scripts="",
            updated_at=None,
            disclaimer=HEADER_SCRIPTS_WARNING,
        )
    return HeaderScriptOut(
        user_id=script.user_id,
        header_scripts=script.header_scripts,
        updated_at=script.updated_at,
        disclaimer=HEADER_SCRIPTS_WARNING,
    )
