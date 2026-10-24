"""Moderated gaming news API. Never auto-publishes imported sources."""
from fastapi import APIRouter, Depends, Header, HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.orm import Session

from backend.auth.dependencies import admin
from backend.core.config import Settings, get_settings
from backend.core.database import get_db
from backend.news.models import NewsArticle
from backend.news.service import discover, stage

router = APIRouter(prefix="/news", tags=["news"])


@router.get("")
def published(db: Session = Depends(get_db)):
    return db.scalars(
        select(NewsArticle)
        .where(NewsArticle.approved.is_(True))
        .order_by(NewsArticle.published_at.desc())
        .limit(50)
    ).all()


@router.get("/admin", dependencies=[Depends(admin)])
def pending(db: Session = Depends(get_db)):
    return db.scalars(
        select(NewsArticle).order_by(NewsArticle.imported_at.desc()).limit(100)
    ).all()


@router.post("/admin/import", dependencies=[Depends(admin)])
async def import_news(db: Session = Depends(get_db), settings: Settings = Depends(get_settings)):
    try:
        entries = await discover(settings)
    except (ValueError, Exception) as exc:
        # Never expose provider credentials or upstream responses to clients.
        raise HTTPException(502, "news_source_unavailable") from None
    return {"staged": stage(db, entries), "published": 0}


class Moderation(BaseModel):
    approved: bool


@router.patch("/admin/{article_id}", dependencies=[Depends(admin)])
def moderate(article_id: int, data: Moderation, db: Session = Depends(get_db)):
    item = db.get(NewsArticle, article_id)
    if item is None:
        raise HTTPException(404, "not_found")
    item.approved = data.approved
    db.commit()
    db.refresh(item)
    return item
