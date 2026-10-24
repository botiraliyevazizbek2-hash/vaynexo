"""Moderated news links; full external articles are never copied."""
from datetime import UTC, datetime
from sqlalchemy import Boolean, Integer, String
from sqlalchemy.orm import Mapped, mapped_column
from backend.core.database import Base


def now():
    return datetime.now(UTC).isoformat()


class NewsArticle(Base):
    __tablename__ = "news_articles"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    title: Mapped[str] = mapped_column(String(240))
    url: Mapped[str] = mapped_column(String(1000), unique=True, nullable=False)
    source: Mapped[str] = mapped_column(String(120))
    published_at: Mapped[str] = mapped_column(String(45), default=now)
    imported_at: Mapped[str] = mapped_column(String(45), default=now)
    approved: Mapped[bool] = mapped_column(Boolean, default=False)
