import hmac
import secrets

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.orm import Session

from backend.core.config import Settings, get_settings
from backend.core.database import get_db
from backend.core.security import issue_token, validate_init_data
from backend.users.models import User

router = APIRouter(prefix="/auth", tags=["auth"])


class TelegramLogin(BaseModel):
    init_data: str = Field(max_length=16384)


class AdminLogin(BaseModel):
    key: str = Field(max_length=256)


def session(user, db, settings):
    db.commit()
    return {"token": issue_token(f"user:{user.id}", settings.session_secret)}


@router.post("/telegram")
def telegram(data: TelegramLogin, db: Session = Depends(get_db), settings: Settings = Depends(get_settings)):
    try:
        identity = validate_init_data(data.init_data, settings.bot_token)
    except (ValueError, KeyError, TypeError):
        raise HTTPException(401, "invalid_telegram_data") from None
    user = db.scalar(select(User).where(User.telegram_id == identity["id"]))
    if not user:
        lang = identity.get("language_code", "uz")
        user = User(
            telegram_id=identity["id"],
            name=str(identity.get("first_name", "Player"))[:128],
            language=lang if lang in ("uz", "ru", "en") else "en",
        )
        db.add(user)
        db.flush()
    return session(user, db, settings)


@router.post("/demo")
def demo(db: Session = Depends(get_db), settings: Settings = Depends(get_settings)):
    if not settings.demo_login_enabled or settings.app_env != "development":
        raise HTTPException(404, "not_found")
    # Separate isolated demo user per browser login. Never grants admin rights.
    user = User(name="Demo " + secrets.token_hex(3), language="uz")
    db.add(user)
    db.flush()
    return session(user, db, settings)


@router.post("/admin")
def login_admin(data: AdminLogin, settings: Settings = Depends(get_settings)):
    if not settings.admin_key or not hmac.compare_digest(data.key, settings.admin_key):
        raise HTTPException(401, "unauthorized")
    return {"token": issue_token("admin:key", settings.session_secret)}
