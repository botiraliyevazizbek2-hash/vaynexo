from typing import Annotated

from fastapi import APIRouter, Depends, Header, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from backend.auth.dependencies import current_user
from backend.core.database import get_db
from backend.orders.models import Order
from backend.orders.schemas import CreateOrder
from backend.orders.service import create_order, transition
from backend.users.models import User

router = APIRouter(prefix="/orders", tags=["orders"])


def owned(db, user, order_id):
    order = db.get(Order, order_id)
    if not order or order.user_id != user.id:
        raise HTTPException(404, "not_found")
    return order


@router.get("")
def orders(user: User = Depends(current_user), db: Session = Depends(get_db), offset: int = 0):
    return db.scalars(
        select(Order)
        .where(Order.user_id == user.id)
        .order_by(Order.created_at.desc())
        .offset(max(0, offset))
        .limit(100)
    ).all()


@router.post("", status_code=201)
def create(
    data: CreateOrder,
    idempotency_key: Annotated[str, Header(min_length=16, max_length=64, pattern=r"^[A-Za-z0-9_-]+$")],
    user: User = Depends(current_user),
    db: Session = Depends(get_db),
):
    return create_order(db, user, data, idempotency_key)


@router.post("/{order_id}/test-payment")
def test_payment(order_id: str, user: User = Depends(current_user), db: Session = Depends(get_db)):
    return transition(db, owned(db, user, order_id), "test_paid", f"user:{user.id}")


@router.post("/{order_id}/cancel")
def cancel(order_id: str, user: User = Depends(current_user), db: Session = Depends(get_db)):
    return transition(db, owned(db, user, order_id), "cancelled", f"user:{user.id}")
