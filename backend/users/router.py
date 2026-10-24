from typing import Literal

from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from backend.auth.dependencies import current_user
from backend.core.database import get_db
from backend.users.models import User

router = APIRouter(prefix="/me", tags=["users"])


class Profile(BaseModel):
    language: Literal["uz", "ru", "en"]
    player_id: str = Field(default="", pattern=r"^(?:[0-9]{4,20})?$")
    zone_id: str = Field(default="", pattern=r"^(?:[0-9]{2,10})?$")
    notifications: bool = True


def public(user):
    return {
        "id": user.id,
        "name": user.name,
        "language": user.language,
        "player_id": user.player_id,
        "zone_id": user.zone_id,
        "notifications": user.notifications,
    }


@router.get("")
def me(user: User = Depends(current_user)):
    return public(user)


@router.put("")
def update(data: Profile, user: User = Depends(current_user), db: Session = Depends(get_db)):
    for key, value in data.model_dump().items():
        setattr(user, key, value)
    db.commit()
    return public(user)
