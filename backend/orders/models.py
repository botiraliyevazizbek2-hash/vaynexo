from datetime import UTC, datetime
from uuid import uuid4

from sqlalchemy import JSON, CheckConstraint, ForeignKey, Integer, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from backend.core.database import Base


def now():
    return datetime.now(UTC).isoformat()


class Order(Base):
    __tablename__ = "orders"
    __table_args__ = (UniqueConstraint("user_id", "idempotency_key"), CheckConstraint("price_uzs > 0"))
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    product_id: Mapped[str] = mapped_column(ForeignKey("products.id"))
    product_names: Mapped[dict] = mapped_column(JSON)
    price_uzs: Mapped[int] = mapped_column(Integer)
    player_id: Mapped[str] = mapped_column(String(20))
    zone_id: Mapped[str] = mapped_column(String(10))
    status: Mapped[str] = mapped_column(String(32), default="awaiting_test_payment", index=True)
    idempotency_key: Mapped[str] = mapped_column(String(64))
    created_at: Mapped[str] = mapped_column(String(40), default=now)
    updated_at: Mapped[str] = mapped_column(String(40), default=now)
