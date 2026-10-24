from sqlalchemy import JSON, Boolean, CheckConstraint, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from backend.core.database import Base


class Product(Base):
    __tablename__ = "products"
    __table_args__ = (CheckConstraint("price_uzs > 0"),)
    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    names: Mapped[dict] = mapped_column(JSON)
    category: Mapped[str] = mapped_column(String(16))
    price_uzs: Mapped[int] = mapped_column(Integer)
    active: Mapped[bool] = mapped_column(Boolean, default=True)
