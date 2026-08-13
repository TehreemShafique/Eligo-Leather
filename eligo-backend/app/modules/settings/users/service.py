from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.auth.model import User, UserType
from app.core.security import hash_password
from app.modules.settings.users.schema import StaffUserCreate, StaffUserUpdate
from app.modules.settings.security.service import log_activity


async def _admin_count(db: AsyncSession, exclude_id: int | None = None) -> int:
    stmt = select(func.count()).select_from(User).where(User.is_admin == True)  # noqa: E712
    if exclude_id is not None:
        stmt = stmt.where(User.id != exclude_id)
    result = await db.execute(stmt)
    return result.scalar_one()


async def list_staff_users(db: AsyncSession, skip: int = 0, limit: int = 50) -> list[User]:
    result = await db.execute(select(User).order_by(User.created_at.desc()).offset(skip).limit(limit))
    return list(result.scalars().all())


async def get_staff_user(db: AsyncSession, user_id: int) -> User | None:
    return await db.get(User, user_id)


async def create_staff_user(db: AsyncSession, data: StaffUserCreate, actor_id: int) -> User:
    if data.user_type == UserType.admin and await _admin_count(db) > 0:
        raise ValueError("There can only be one admin. Demote or delete the existing admin first.")
    user = User(
        email=data.email,
        hashed_password=hash_password(data.password),
        full_name=data.full_name,
        user_type=data.user_type,
        role_id=data.role_id,
        is_admin=(data.user_type == UserType.admin),
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)

    await log_activity(db, event=f"{user.full_name or user.email} was created.", resource_type="User", actor_user_id=actor_id)
    return user


async def update_staff_user(db: AsyncSession, user_id: int, data: StaffUserUpdate) -> User | None:
    user = await get_staff_user(db, user_id)
    if not user:
        return None
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(user, field, value)
    await db.commit()
    await db.refresh(user)
    return user


async def delete_staff_user(db: AsyncSession, user_id: int, actor_id: int) -> bool:
    user = await get_staff_user(db, user_id)
    if not user:
        return False
    if user.is_admin and await _admin_count(db, exclude_id=user_id) == 0:
        raise ValueError("Cannot delete the only admin.")
    name = user.full_name or user.email
    await db.delete(user)
    await db.commit()
    await log_activity(db, event=f"{name} was deleted.", resource_type="User", actor_user_id=actor_id)
    return True