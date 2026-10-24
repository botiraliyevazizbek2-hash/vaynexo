from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse

from backend.admin.router import router as admin
from backend.ai.router import router as ai
from backend.auth.router import router as auth
from backend.catalog.router import router as catalog
from backend.core.config import get_settings
from backend.orders.router import router as orders
from backend.support.router import router as support
from backend.users.router import router as users

app = FastAPI(
    title="Vaynexo", version="0.1.0", description="Test orders only. No real payments or diamond delivery."
)
for router in (auth, users, catalog, orders, support, admin, ai):
    app.include_router(router, prefix="/api")


@app.middleware("http")
async def security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["Cache-Control"] = "no-store"
    return response


@app.get("/api/health")
def health():
    return {"status": "ok", "commerce_mode": "test"}


@app.get("/api/config")
def config():
    settings = get_settings()
    return {
        "mode": "test",
        "demo_login": settings.demo_login_enabled and settings.app_env == "development",
        "nickname_validation": False,
    }


@app.exception_handler(Exception)
async def internal_error(request: Request, exc: Exception):
    # No provider credentials, user input or stack traces in client responses.
    return JSONResponse(status_code=500, content={"detail": "internal_error"})
