from typing import Literal

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from backend.auth.dependencies import admin
from backend.core.database import get_db
from backend.core.models import Audit, Order, Product, Ticket, User
from backend.orders.service import transition

router = APIRouter(prefix="/admin", tags=["admin"], dependencies=[Depends(admin)])


class ProductUpdate(BaseModel):
    price_uzs: int = Field(gt=0, le=100_000_000)
    active: bool


class StatusUpdate(BaseModel):
    status: Literal["test_processing", "test_completed", "test_failed", "test_refunded", "cancelled"]


class Reply(BaseModel):
    reply: str = Field(min_length=1, max_length=2000)


def find(db, model, key):
    item = db.get(model, key)
    if item is None:
        raise HTTPException(404, "not_found")
    return item


@router.get("/summary")
def summary(db: Session = Depends(get_db)):
    return {
        "orders": db.scalar(select(func.count()).select_from(Order)),
        "users": db.scalar(select(func.count()).select_from(User)),
        "test_completed_uzs": db.scalar(
            select(func.coalesce(func.sum(Order.price_uzs), 0)).where(Order.status == "test_completed")
        ),
        "mode": "test",
    }


@router.get("/orders")
def orders(db: Session = Depends(get_db), offset: int = 0):
    return db.scalars(select(Order).order_by(Order.created_at.desc()).offset(max(0, offset)).limit(100)).all()


@router.patch("/orders/{order_id}")
def update_order(
    order_id: str, data: StatusUpdate, db: Session = Depends(get_db), actor: str = Depends(admin)
):
    return transition(db, find(db, Order, order_id), data.status, actor)


@router.get("/products")
def products(db: Session = Depends(get_db)):
    return db.scalars(select(Product).order_by(Product.price_uzs)).all()


@router.patch("/products/{product_id}")
def update_product(
    product_id: str, data: ProductUpdate, db: Session = Depends(get_db), actor: str = Depends(admin)
):
    product = find(db, Product, product_id)
    before = {"price_uzs": product.price_uzs, "active": product.active}
    product.price_uzs, product.active = data.price_uzs, data.active
    db.add(
        Audit(
            actor=actor,
            action="product_updated",
            target=product_id,
            detail={"before": before, "after": data.model_dump()},
        )
    )
    db.commit()
    return product


@router.get("/users")
def users(db: Session = Depends(get_db), offset: int = 0):
    return db.scalars(select(User).order_by(User.id.desc()).offset(max(0, offset)).limit(100)).all()


@router.get("/support")
def tickets(db: Session = Depends(get_db), offset: int = 0):
    return db.scalars(select(Ticket).order_by(Ticket.id.desc()).offset(max(0, offset)).limit(100)).all()


@router.patch("/support/{ticket_id}")
def reply(ticket_id: int, data: Reply, db: Session = Depends(get_db), actor: str = Depends(admin)):
    ticket = find(db, Ticket, ticket_id)
    ticket.reply = data.reply
    db.add(Audit(actor=actor, action="ticket_replied", target=str(ticket_id), detail={}))
    db.commit()
    return ticket


@router.get("/audit")
def audit(db: Session = Depends(get_db), offset: int = 0):
    return db.scalars(select(Audit).order_by(Audit.id.desc()).offset(max(0, offset)).limit(100)).all()
