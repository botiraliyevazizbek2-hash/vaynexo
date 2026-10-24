"""News is staged and moderated; imports never publish automatically."""
from backend.news.service import rss_entries, stage


def test_rss_parser_and_url_validation():
    xml = (
        "<rss><channel><item><title>MLBB patch</title>"
        "<link>https://example.com/patch</link><source>Example</source>"
        "<pubDate>Sat, 24 Oct 2026 12:00:00 GMT</pubDate>"
        "</item></channel></rss>"
    )
    rows = rss_entries(xml)
    assert len(rows) == 1
    assert rows[0]["title"] == "MLBB patch"
    assert rss_entries("<!DOCTYPE rss><rss/>") == []


def test_news_is_public_only_when_approved(setup, admin_headers):
    client, factory, _ = setup
    with factory() as db:
        assert stage(db, [
            {"title": "MLBB guide", "url": "https://example.com/a", "source": "Example"},
            {"title": "MLBB guide", "url": "https://example.com/a", "source": "Example"},
            {"title": "Bad", "url": "http://localhost/bad", "source": "Invalid"},
        ]) == 1
    assert client.get("/api/news").json() == []
    assert client.get("/api/news/admin").status_code == 401
    items = client.get("/api/news/admin", headers=admin_headers).json()
    assert len(items) == 1
    assert items[0]["approved"] is False
    result = client.patch(
        f"/api/news/admin/{items[0]['id']}",
        headers=admin_headers,
        json={"approved": True},
    )
    assert result.status_code == 200
    assert len(client.get("/api/news").json()) == 1


def test_cron_needs_secret_and_stages_only(setup, monkeypatch):
    client, _factory, settings = setup
    assert client.post("/api/news/cron/import").status_code == 401
    settings.news_cron_secret = "secret-for-test-only"

    async def mocked_discover(_settings):
        return [{"title": "MLBB tournament", "url": "https://example.com/tour", "source": "Example"}]

    from backend.news import router as news_module

    monkeypatch.setattr(news_module, "discover", mocked_discover)
    assert client.post(
        "/api/news/cron/import",
        headers={"X-Vaynexo-Cron-Secret": "wrong"},
    ).status_code == 401
    result = client.post(
        "/api/news/cron/import",
        headers={"X-Vaynexo-Cron-Secret": "secret-for-test-only"},
    )
    assert result.status_code == 200
    assert result.json() == {"staged": 1, "published": 0}
    assert client.get("/api/news").json() == []
