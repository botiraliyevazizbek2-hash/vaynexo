"""AI Coach is off by default and cannot be called anonymously."""
from unittest.mock import AsyncMock

from backend.ai import router as ai_module


def test_ai_status_is_disabled_by_default(client):
    result = client.get("/api/ai/status")
    assert result.status_code == 200
    assert result.json()["available"] is False


def test_ai_requires_authentication(client):
    result = client.post("/api/ai/coach", json={"question": "Best tank hero?"})
    assert result.status_code == 401


def test_ai_requires_explicit_enablement(client, headers):
    result = client.post("/api/ai/coach", json={"question": "Best tank hero?"}, headers=headers)
    assert result.status_code == 503
    assert result.json()["detail"] == "ai_unavailable"


def test_ai_rejects_bad_input(client, headers):
    result = client.post("/api/ai/coach", json={"question": "hi"}, headers=headers)
    assert result.status_code == 422


def test_ai_provider_response_and_limits(setup, headers, monkeypatch):
    client, _factory, settings = setup
    settings.ai_enabled = True
    settings.openai_api_key = "test-key-not-real"
    settings.ai_daily_limit = 1

    class FakeResponse:
        status_code = 200

        def json(self):
            return {"output": [{"type": "message", "content": [{"type": "output_text", "text": "Tank: Tigreal"}]}]}

    class FakeClient:
        async def __aenter__(self):
            return self

        async def __aexit__(self, *args):
            return None

        async def post(self, *args, **kwargs):
            assert kwargs["json"]["store"] is False
            return FakeResponse()

    monkeypatch.setattr(ai_module.httpx, "AsyncClient", lambda **kw: FakeClient())
    ai_module._requests.clear()
    result = client.post("/api/ai/coach", json={"question": "Tank o'ynashni o'rgat"}, headers=headers)
    assert result.status_code == 200
    assert result.json()["answer"] == "Tank: Tigreal"
    result = client.post("/api/ai/coach", json={"question": "What emblem?"}, headers=headers)
    assert result.status_code == 429
    ai_module._requests.clear()
