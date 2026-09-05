from fastapi import APIRouter, HTTPException, Depends, status, Request
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db
from app.modules.auth.schema import User_out, UserCreate, Token, LoginRequest, MeOut, PinLoginRequest
from app.modules.auth import service
from app.core.security import create_access_token
from app.core.dependencies import get_current_user
from app.modules.settings.account.service import record_login_session, _client_ip
from app.modules.settings.security.service import validate_collaborator_code
from app.modules.discounts.service import evaluate_welcome_discount

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

    welcome = await evaluate_welcome_discount(
        db,
        user_email=user.email,
        ip_address=_client_ip(request),
        visitor_id=request.cookies.get("eligo_visitor_id") or None,
    )
    return Token(
        access_token=token,
        show_welcome_discount=welcome.show_welcome_discount,
        welcome_discount_percentage=welcome.discount_percentage,
    )

@router.get("/me", response_model=MeOut)
async def read_current_user(current_user= Depends(get_current_user)):
    role = getattr(current_user, "role", None)
    domain = role.domain.value if role is not None and role.domain is not None else None
    return MeOut(
        id=current_user.id,
        email=current_user.email,
        full_name=current_user.full_name,
        is_admin=current_user.is_admin,
        is_active=current_user.is_active,
        created_at=current_user.created_at,
        user_type=current_user.user_type,
        role_id=current_user.role_id,
        domain=domain,
    )


@router.post("/pin-login", response_model=Token)
async def pin_login(
    data: PinLoginRequest,
    request: Request,
    db: AsyncSession = Depends(get_db),
    _current_user=Depends(get_current_user),
):
    """Quick terminal access: validate a 4-digit collaborator PIN and issue a
    fresh session token for the given staff email without re-entering their
    password. The caller must already hold a valid session (operator)."""
    stored = await validate_collaborator_code(db, data.code)
    if not stored:
        raise HTTPException(status_code=401, detail="Invalid or expired PIN code.")

    user = await service.get_user_by_email(db, data.email)
    if not user:
        raise HTTPException(status_code=404, detail="User not found for the provided email.")
    if not user.is_active:
        raise HTTPException(status_code=403, detail="User account is inactive.")

    token = create_access_token(data={"sub": user.email})
    await record_login_session(db, user, token, request)

    return Token(access_token=token, show_welcome_discount=False, welcome_discount_percentage=None)

