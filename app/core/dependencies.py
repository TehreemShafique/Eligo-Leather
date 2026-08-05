from datetime import datetime, timedelta, timezone
from fastapi.security import HTTPBearer
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import Depends, HTTPException
from app.db.session import get_db
from app.core.security import decode_access_token
from jose import JWTError
from sqlalchemy import Select
from app.modules.auth.model import User
from app.modules.settings.account.model import UserSession

oauth2_scheme =  HTTPBearer()

# Active-device ledger rows are touched at most once every interval so the
# sessions table is not written on every single admin request.
SESSION_TOUCH_INTERVAL = timedelta(minutes=5)

async def _admin_session(db: AsyncSession, user: User, token: str) -> UserSession | None:
    try:
        payload = decode_access_token(token)
    except JWTError:
        return None
    jti = payload.get("jti")
    if not jti:
        return None
    result = await db.execute(
        Select(UserSession).where(
            UserSession.user_id == user.id,
            UserSession.token_id == jti,
        )
    )
    return result.scalar_one_or_none()

async def get_current_user(credentials=Depends(oauth2_scheme), db: AsyncSession=Depends(get_db)):
    token = credentials.credentials
    credential_exception = HTTPException(status_code=404, detail="Credentials are not valid")
    try:
        payload = decode_access_token(token)
        email = payload.get("sub")
        if email is None:
            raise credential_exception
    except JWTError:
        raise credential_exception

    result = await db.execute(Select(User).where(User.email == email))
    user = result.scalar_one_or_none()

    if user is None:
        raise credential_exception

    if user.is_admin:
        session = await _admin_session(db, user, token)
        if session is None or session.revoked_at is not None:
            raise credential_exception
        now = datetime.now(timezone.utc)
        if session.last_seen_at is None or (now - session.last_seen_at) > SESSION_TOUCH_INTERVAL:
            session.last_seen_at = now
            await db.commit()

    return user

async def require_admin(current_user: User = Depends(get_current_user)):
    if current_user.is_admin:
        return current_user

    raise HTTPException(status_code=404, detail="User is Not admin")