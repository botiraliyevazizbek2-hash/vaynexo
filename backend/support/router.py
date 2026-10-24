from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.orm import Session

from backend.auth.dependencies import current_user
from backend.core.database import get_db
from backend.support.models import Ticket
from backend.users.models import User

router = APIRouter(prefix="/support", tags=["support"])


class Message(BaseModel):
    message: str = Field(min_length=3, max_length=2000)


@router.get("")
def tickets(user: User = Depends(current_user), db: Session = Depends(get_db)):
    return db.scalars(
        select(Ticket).where(Ticket.user_id == user.id).order_by(Ticket.id.desc()).limit(100)
    ).all()


@router.post("", status_code=201)
def create(data: Message, user: User = Depends(current_user), db: Session = Depends(get_db)):
    ticket = Ticket(user_id=user.id, message=data.message)
    db.add(ticket)
    db.commit()
    return ticket
