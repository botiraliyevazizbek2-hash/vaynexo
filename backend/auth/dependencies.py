import jwt
from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from backend.core.config import Settings, get_settings
from backend.core.database import get_db
from backend.core.security import read_token
from backend.users.models import User

bearer = HTTPBearer(auto_error=False)


def subject(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer),
    settings: Settings = Depends(get_settings),
):
    try:
        if not credentials:
            raise ValueError()
        return read_token(credentials.credentials, settings.session_secret)
    except (jwt.InvalidTokenError, ValueError, KeyError):
        raise HTTPException(401, "unauthorized") from None


def current_user(sub: str = Depends(subject), db: Session = Depends(get_db)):
    if not sub.startswith("user:"):
        raise HTTPException(403, "user_required")
    user = db.get(User, int(sub.split(":")[1]))
    if not user:
        raise HTTPException(401, "unauthorized")
    return user


def admin(
    sub: str = Depends(subject), db: Session = Depends(get_db), settings: Settings = Depends(get_settings)
):
    if sub == "admin:key" and settings.admin_key:
        return sub
    if sub.startswith("user:"):
        user = db.get(User, int(sub.split(":")[1]))
        if user and user.telegram_id in settings.admin_telegram_ids:
            return sub
    raise HTTPException(403, "admin_required")
