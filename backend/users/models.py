from sqlalchemy import BigInteger, Boolean, String
from sqlalchemy.orm import Mapped, mapped_column

from backend.core.database import Base


class User(Base):
    __tablename__ = "users"
    id: Mapped[int] = mapped_column(primary_key=True)
    telegram_id: Mapped[int | None] = mapped_column(BigInteger, unique=True)
    name: Mapped[str] = mapped_column(String(128))
    language: Mapped[str] = mapped_column(String(2), default="uz")
    player_id: Mapped[str] = mapped_column(String(20), default="")
    zone_id: Mapped[str] = mapped_column(String(10), default="")
    notifications: Mapped[bool] = mapped_column(Boolean, default=True)
