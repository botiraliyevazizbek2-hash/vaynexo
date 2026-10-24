import hashlib
import hmac
import json
import time
from urllib.parse import urlencode

import pytest
from pydantic import ValidationError

from apps.bot.main import STATUS, TEXT, dispatcher, languages
from backend.core.config import Settings
from backend.core.security import issue_token, validate_init_data


def signed(token, **changes):
    data = {
        "auth_date": str(int(time.time())),
        "user": json.dumps({"id": 123456789, "first_name": "Test", "language_code": "ru"}),
    }
    data.update(changes)
    check = "\n".join(f"{k}={v}" for k, v in sorted(data.items()))
    secret = hmac.new(b"WebAppData", token.encode(), hashlib.sha256).digest()
    data["hash"] = hmac.new(secret, check.encode(), hashlib.sha256).hexdigest()
    return urlencode(data)


def test_telegram_signature_and_expiry(setup):
    client, _, settings = setup
    valid = signed(settings.bot_token)
    assert validate_init_data(valid, settings.bot_token)["id"] == 123456789
    login = client.post("/api/auth/telegram", json={"init_data": valid})
    assert login.status_code == 200
    headers = {"Authorization": "Bearer " + login.json()["token"]}
    assert client.get("/api/me", headers=headers).json()["language"] == "ru"
    for bad in [
        valid + "x",
        valid + "&auth_date=0",
        signed(settings.bot_token, auth_date="1"),
        signed(settings.bot_token, auth_date=str(int(time.time()) + 300)),
    ]:
        assert client.post("/api/auth/telegram", json={"init_data": bad}).status_code == 401


def test_demo_guard_and_no_default_admin(setup):
    client, _, settings = setup
    settings.demo_login_enabled = False
    assert client.post("/api/auth/demo").status_code == 404
    settings.admin_key = ""
    assert client.post("/api/auth/admin", json={"key": ""}).status_code == 401


def test_invalid_session(client):
    token = issue_token("admin:key", "wrong-secret-value-32-characters-long")
    assert client.get("/api/admin/orders", headers={"Authorization": "Bearer " + token}).status_code == 401


def test_production_guard():
    with pytest.raises(ValidationError):
        Settings(_env_file=None, app_env="production", demo_login_enabled=True, session_secret="x" * 48)
    with pytest.raises(ValidationError):
        Settings(_env_file=None, app_env="production", session_secret="")


def test_bot_localization_and_dispatcher():
    assert set(TEXT) == set(STATUS) == {"uz", "ru", "en"}
    assert all(set(TEXT["uz"]) == set(t) for t in TEXT.values())
    assert len(languages().inline_keyboard[0]) == 3
    assert dispatcher() is not None
