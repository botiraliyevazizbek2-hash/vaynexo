import secrets
from functools import lru_cache
from typing import Literal

from pydantic import Field, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")
    app_env: Literal["development", "production"] = "development"
    database_url: str = "sqlite:///./vaynexo.db"
    demo_login_enabled: bool = False
    session_secret: str = ""
    admin_key: str = ""
    admin_telegram_ids: list[int] = Field(default_factory=list)
    bot_token: str = ""
    mini_app_url: str = ""

    @model_validator(mode="after")
    def secure_config(self):
        if self.app_env == "production":
            if self.demo_login_enabled:
                raise ValueError("Demo login must be disabled in production")
            if len(self.session_secret) < 32:
                raise ValueError("SESSION_SECRET must contain at least 32 characters")
        elif not self.session_secret:
            self.session_secret = secrets.token_urlsafe(48)
        if len(self.session_secret) < 32:
            raise ValueError("SESSION_SECRET must contain at least 32 characters")
        if self.admin_key and len(self.admin_key) < 32:
            raise ValueError("ADMIN_KEY must contain at least 32 characters")
        return self


@lru_cache
def get_settings():
    return Settings()
