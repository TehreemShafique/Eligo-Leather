from sqlalchemy import Select
from app.core.dependencies import get_current_user, require_admin
from sqlalchemy.ext.asyncio import AsyncSession
from app.modules.auth.model import User
from app.modules.auth.schema import UserCreate
from app.core.security import hash_password, verify_password
from fastapi import HTTPException

async def get_user_by_email(db: AsyncSession , email: str) -> User | None:
    result = await db.execute(Select(User).where(User.email == email))
    return result.scalar_one_or_none()

async def create_user(db: AsyncSession, data: UserCreate) -> User:
    user= User(
        email = data.email,
        full_name=data.full_name,
        hashed_password=hash_password(data.password)
    )

    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user

async def authentication(db: AsyncSession, email: str, password: str) -> User | None:
    user = await get_user_by_email(db, email)
    if not user or not verify_password(password, user.hashed_password):
        raise HTTPException(status_code=404, detail="Invalid email or password")
    return user