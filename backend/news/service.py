"""Fixed-source gaming news discovery. Store only titles, source URLs and dates."""
from datetime import UTC, datetime
from email.utils import parsedate_to_datetime
from urllib.parse import urlsplit
from xml.etree import ElementTree

import httpx
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError

from backend.news.models import NewsArticle

RSS_FEED = (
    "https://news.google.com/rss/search?"
    "q=Mobile+Legends+Bang+Bang+esports&hl=en-US&gl=US&ceid=US:en"
)
NEWSAPI_ENDPOINT = "https://newsapi.org/v2/everything"


def secure_source_url(value: str) -> bool:
    if not isinstance(value, str) or len(value) > 1000:
        return False
    parsed = urlsplit(value)
    return parsed.scheme == "https" and bool(parsed.hostname) and not parsed.username


def rss_entries(xml: str) -> list[dict]:
    if "<!DOCTYPE" in xml.upper() or "<!ENTITY" in xml.upper():
        return []
    root = ElementTree.fromstring(xml)
    entries = []
    for item in root.findall(".//channel/item")[:20]:
        title = (item.findtext("title") or "").strip()
        url = (item.findtext("link") or "").strip()
        source = (item.findtext("source") or "Google News").strip()
        published = (item.findtext("pubDate") or "").strip()
        try:
            published = parsedate_to_datetime(published).astimezone(UTC).isoformat()
        except (TypeError, ValueError):
            published = datetime.now(UTC).isoformat()
        entries.append({"title": title, "url": url, "source": source, "published_at": published})
    return entries


def newsapi_entries(payload: dict) -> list[dict]:
    entries = []
    for item in payload.get("articles", [])[:20]:
        entries.append({
            "title": item.get("title", ""),
            "url": item.get("url", ""),
            "source": (item.get("source") or {}).get("name") or "NewsAPI",
            "published_at": item.get("publishedAt") or datetime.now(UTC).isoformat(),
        })
    return entries


async def discover(settings) -> list[dict]:
    async with httpx.AsyncClient(timeout=15, follow_redirects=False) as client:
        if settings.news_api_key and settings.app_env == "development":
            response = await client.get(
                NEWSAPI_ENDPOINT,
                params={
                    "q": '"Mobile Legends" OR "MLBB" OR "MPL esports"',
                    "language": "en",
                    "sortBy": "publishedAt",
                    "pageSize": 20,
                },
                headers={"X-Api-Key": settings.news_api_key},
            )
            response.raise_for_status()
            payload = response.json()
            if payload.get("status") != "ok":
                raise ValueError("NewsAPI did not return success")
            return newsapi_entries(payload)
        response = await client.get(RSS_FEED)
        response.raise_for_status()
        if len(response.content) > 1024 * 1024:
            raise ValueError("RSS feed too large")
        return rss_entries(response.text)


def stage(db, entries: list[dict]) -> int:
    added = 0
    for entry in entries[:20]:
        title = entry.get("title")
        url = entry.get("url")
        if not isinstance(title, str) or not title.strip() or not secure_source_url(url):
            continue
        if db.scalar(select(NewsArticle.id).where(NewsArticle.url == url)):
            continue
        row = NewsArticle(
            title=title.strip()[:240],
            url=url,
            source=str(entry.get("source") or "Unknown")[:120],
            published_at=str(entry.get("published_at") or "")[:45],
            approved=False,
        )
        try:
            with db.begin_nested():
                db.add(row)
                db.flush()
        except IntegrityError:
            continue
        added += 1
    db.commit()
    return added
