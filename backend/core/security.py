import hashlib
import hmac
import json
import time
from urllib.parse import parse_qsl

import jwt


def validate_init_data(raw: str, bot_token: str, max_age: int = 3600):
    if not bot_token or len(raw) > 16384:
        raise ValueError("Invalid Telegram data")
    pairs = parse_qsl(raw, keep_blank_values=True, strict_parsing=True)
    fields = dict(pairs)
    if len(fields) != len(pairs):
        raise ValueError("Duplicate fields")
    received_hash = fields.pop("hash", "")
    check = "\n".join(f"{key}={value}" for key, value in sorted(fields.items()))
    secret = hmac.new(b"WebAppData", bot_token.encode(), hashlib.sha256).digest()
    expected = hmac.new(secret, check.encode(), hashlib.sha256).hexdigest()
    if not hmac.compare_digest(expected, received_hash):
        raise ValueError("Invalid signature")
    age = time.time() - int(fields.get("auth_date", "0"))
    if age < -30 or age > max_age:
        raise ValueError("Expired Telegram data")
    user = json.loads(fields["user"])
    if not isinstance(user, dict) or type(user.get("id")) is not int or user["id"] <= 0:
        raise ValueError("Invalid Telegram user")
    return user


def issue_token(subject: str, secret: str):
    now = int(time.time())
    return jwt.encode(
        {"sub": subject, "iat": now, "exp": now + 3600, "iss": "vaynexo", "aud": "vaynexo-app"},
        secret,
        algorithm="HS256",
    )


def read_token(token: str, secret: str):
    return jwt.decode(
        token,
        secret,
        algorithms=["HS256"],
        audience="vaynexo-app",
        issuer="vaynexo",
        options={"require": ["sub", "exp", "iat"]},
    )["sub"]
