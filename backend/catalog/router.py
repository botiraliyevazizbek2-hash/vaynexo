from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from backend.catalog.models import Product
from backend.core.database import get_db

router = APIRouter(prefix="/catalog", tags=["catalog"])


@router.get("")
def catalog(db: Session = Depends(get_db)):
    return db.scalars(select(Product).where(Product.active.is_(True)).order_by(Product.price_uzs)).all()
