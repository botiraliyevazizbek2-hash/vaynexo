import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import sessionmaker

from apps.api.main import app
from backend.catalog.seed import seed
from backend.core import models  # noqa: F401
from backend.core.config import Settings, get_settings
from backend.core.database import Base, get_db, make_engine


@pytest.fixture
def setup(tmp_path):
    settings = Settings(
        _env_file=None,
        demo_login_enabled=True,
        session_secret="s" * 48,
        admin_key="a" * 48,
        bot_token="123456:test-token",
    )
    engine = make_engine(f"sqlite:///{tmp_path}/test.db")
    Base.metadata.create_all(engine)
    factory = sessionmaker(engine, expire_on_commit=False)
    with factory() as db:
        seed(db)

    def database():
        with factory() as db:
            yield db

    app.dependency_overrides[get_db] = database
    app.dependency_overrides[get_settings] = lambda: settings
    with TestClient(app) as client:
        yield client, factory, settings
    app.dependency_overrides.clear()
    engine.dispose()


@pytest.fixture
def client(setup):
    return setup[0]


def login(client):
    result = client.post("/api/auth/demo")
    assert result.status_code == 200
    return {"Authorization": "Bearer " + result.json()["token"]}


@pytest.fixture
def headers(client):
    return login(client)


@pytest.fixture
def admin_headers(client):
    result = client.post("/api/auth/admin", json={"key": "a" * 48})
    assert result.status_code == 200
    return {"Authorization": "Bearer " + result.json()["token"]}
