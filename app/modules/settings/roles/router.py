from fastapi import APIRouter, Depends, HTTPException, status
from app.core.dependencies import require_admin
from sqlalchemy.ext.asyncio import AsyncSession
from app.modules.settings.roles import services
from app.modules.settings.roles.schema import (
    RoleCreate,
    RoleOut
)
from app.db.session import get_db

router = APIRouter(prefix="/roles", tags=["settings-roles"], dependencies=[Depends(require_admin)])

@router.post("/seed", status_code=status.HTTP_204_NO_CONTENT)
async def seed_system_roles(db: AsyncSession = Depends(get_db)):
    return await services.seed_system_roles(db)

@router.get("/list-roles",response_model=list[RoleOut])
async def list_roles(db: AsyncSession = Depends(get_db)):
    result = await services.list_roles(db)
    if not result:
        raise HTTPException(status_code=404, detail="Roles are not found.")

    return result

@router.get("/role/{role_id}", response_model=RoleOut)
async def get_role_by_id( role_id: int, db: AsyncSession = Depends(get_db)):
    result = await services.get_role(db, role_id)
    if not result:
        raise HTTPException(status_code=404, detail="Role not found.")
    return result

@router.post("/create_role", response_model=RoleOut, status_code=status.HTTP_201_CREATED)
async def create_role(data: RoleCreate, db: AsyncSession = Depends(get_db)):
    return await services.create_role(db, data)