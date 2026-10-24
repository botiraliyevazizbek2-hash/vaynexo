from fastapi import HTTPException
from sqlalchemy import select, update
from sqlalchemy.exc import IntegrityError

from backend.audit.models import Audit
from backend.catalog.models import Product
from backend.orders.models import Order, now

TRANSITIONS = {
    "awaiting_test_payment": {"test_paid", "cancelled"},
    "test_paid": {"test_processing", "test_refunded"},
    "test_processing": {"test_completed", "test_failed"},
    "test_failed": {"test_refunded"},
}


def create_order(db, user, data, key):
    def existing():
        return db.scalar(select(Order).where(Order.user_id == user.id, Order.idempotency_key == key))

    def check(order):
        if (order.product_id, order.player_id, order.zone_id, order.price_uzs) != (
            data.product_id,
            data.player_id,
            data.zone_id,
            data.expected_price_uzs,
        ):
            raise HTTPException(409, "idempotency_conflict")
        return order

    prior = existing()
    if prior:
        return check(prior)
    product = db.get(Product, data.product_id)
    if not product or not product.active:
        raise HTTPException(404, "product_unavailable")
    if product.price_uzs != data.expected_price_uzs:
        raise HTTPException(409, "price_changed")
    order = Order(
        user_id=user.id,
        product_id=product.id,
        product_names=dict(product.names),
        price_uzs=product.price_uzs,
        player_id=data.player_id,
        zone_id=data.zone_id,
        idempotency_key=key,
    )
    db.add(order)
    try:
        db.flush()
        db.add(
            Audit(actor=f"user:{user.id}", action="order_created", target=order.id, detail={"mode": "test"})
        )
        db.commit()
    except IntegrityError:
        db.rollback()
        prior = existing()
        if prior:
            return check(prior)
        raise
    return order


def transition(db, order, target, actor):
    previous = order.status
    if target == previous:
        return order
    if target not in TRANSITIONS.get(previous, set()):
        raise HTTPException(409, "invalid_transition")
    result = db.execute(
        update(Order)
        .where(Order.id == order.id, Order.status == previous)
        .values(status=target, updated_at=now())
    )
    if result.rowcount != 1:
        db.rollback()
        raise HTTPException(409, "order_changed")
    db.add(
        Audit(
            actor=actor,
            action="order_status",
            target=order.id,
            detail={"from": previous, "to": target, "mode": "test"},
        )
    )
    db.commit()
    db.refresh(order)
    return order
