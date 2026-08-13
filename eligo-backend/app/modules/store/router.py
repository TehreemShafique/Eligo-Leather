from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_current_user
from app.db.session import get_db
from app.modules.auth.model import User
from app.modules.store import service
from app.modules.store.schema import HeaderScriptOut, HeaderScriptUpdate

router = APIRouter(
    prefix="/store",
    tags=["Store"],
)


@router.get("/header-scripts", response_model=HeaderScriptOut)
async def get_my_header_scripts(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    script = await service.ensure_header_script(db, current_user.id)
    return service.to_out(script)


@router.post("/header-scripts", response_model=HeaderScriptOut)
async def save_header_scripts(
    data: HeaderScriptUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    script = await service.update_header_script(db, current_user.id, data)
    return service.to_out(script)


@router.get("/{user_id}/header-scripts", response_model=HeaderScriptOut)
async def get_public_header_scripts(
    user_id: int,
    db: AsyncSession = Depends(get_db),
):
    """Public read used by the storefront renderer to inject the owner's
    custom code into the page <head>. Scripts are public-facing content."""
    script = await service.get_header_script(db, user_id)
    return service.to_out(script)
