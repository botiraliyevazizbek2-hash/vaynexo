from alembic import context

from backend.core import models  # noqa: F401
from backend.core.database import Base, engine

with engine.connect() as connection:
    context.configure(connection=connection, target_metadata=Base.metadata, render_as_batch=True)
    with context.begin_transaction():
        context.run_migrations()
