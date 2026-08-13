from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.core.dependencies import require_admin
from app.modules.settings.security import service
from app.modules.settings.security.schema import ActivityLogOut, CollaboratorCodesOut

router = APIRouter(prefix="/security", tags=["Settings - Security"], dependencies=[Depends(require_admin)])


@router.get("/activity-logs", response_model=list[ActivityLogOut])
async def list_activity_logs(skip: int = 0, limit: int = 50, db: AsyncSession = Depends(get_db)):
    return await service.list_activity_logs(db, skip, limit)


@router.get("/collaborator-codes", response_model=list[CollaboratorCodesOut])
async def list_collaborator_codes(db: AsyncSession = Depends(get_db)):
    return await service.list_collaborator_codes(db)


@router.post("/collaborator-codes", response_model=CollaboratorCodesOut, status_code=status.HTTP_201_CREATED)
async def generate_collaborator_code(db: AsyncSession = Depends(get_db)):
    return await service.generate_collaborator_code(db)


@router.delete("/collaborator-codes/{code_id}", response_model=CollaboratorCodesOut)
async def revoke_collaborator_code(code_id: int, db: AsyncSession = Depends(get_db)):
    code = await service.revoke_collaborator_code(db, code_id)
    if not code:
        raise HTTPException(status_code=404, detail="Code not found")
    return code
