from fastapi import APIRouter, HTTPException, Depends, status, Request
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db
from app.modules.auth.schema import User_out, UserCreate, Token, LoginRequest
from app.modules.auth import service
from app.core.security import create_access_token
from app.core.dependencies import get_current_user
from app.modules.settings.account.service import record_login_session

router = APIRouter(prefix="/auth", tags=["auth"])

@router.post("/register", response_model=User_out, status_code=status.HTTP_201_CREATED)
async def register(data: UserCreate, db: AsyncSession = Depends(get_db)):
    existing = await service.get_user_by_email(db, data.email)
    if existing:
        raise HTTPException(status_code=400, detail="Email Exist Already.")
    return await service.create_user(db, data)

@router.post("/login", response_model=Token)
async def login(data: LoginRequest, request: Request, db: AsyncSession = Depends(get_db)):
    user = await service.authentication(db, data.email, data.password)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid email or password.")

    token = create_access_token(data= {"sub": user.email})
    await record_login_session(db, user, token, request)
    return Token(access_token=token)

@router.get("/me", response_model=User_out)
async def read_current_user(current_user= Depends(get_current_user)):
    return current_user

