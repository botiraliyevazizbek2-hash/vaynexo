from backend.catalog.seed import seed
from backend.core.database import SessionLocal

if __name__ == "__main__":
    with SessionLocal() as db:
        seed(db)
    print("Test catalog ready. Existing product prices were not changed.")
