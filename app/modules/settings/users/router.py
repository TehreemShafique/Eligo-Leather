from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.core.dependencies import require_admin
from app.modules.settings.users import service
from app.modules.settings.users.schema import StaffUserCreate, StaffUserUpdate, StaffUserOut
from app.modules.auth.model import User

router = APIRouter(prefix="/users", tags=["Settings - Users"], dependencies=[Depends(require_admin)])


@router.get("/", response_model=list[StaffUserOut])
async def list_staff_users(skip: int = 0, limit: int = 50, db: AsyncSession = Depends(get_db)):
    return await service.list_staff_users(db, skip, limit)


@router.post("/", response_model=StaffUserOut, status_code=status.HTTP_201_CREATED)
async def create_staff_user(
    data: StaffUserCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    try:
        return await service.create_staff_user(db, data, actor_id=current_user.id)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc))


@router.get("/{user_id}", response_model=StaffUserOut)
async def get_staff_user(user_id: int, db: AsyncSession = Depends(get_db)):
    user = await service.get_staff_user(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@router.patch("/{user_id}", response_model=StaffUserOut)
async def update_staff_user(user_id: int, data: StaffUserUpdate, db: AsyncSession = Depends(get_db)):
    user = await service.update_staff_user(db, user_id, data)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_staff_user(
    user_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    try:
        deleted = await service.delete_staff_user(db, user_id, actor_id=current_user.id)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc))
    if not deleted:
        raise HTTPException(status_code=404, detail="User not found")