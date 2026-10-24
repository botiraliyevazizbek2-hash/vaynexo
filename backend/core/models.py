# Import every model for Alembic's metadata registry.
from backend.audit.models import Audit
from backend.catalog.models import Product
from backend.orders.models import Order
from backend.support.models import Ticket
from backend.users.models import User

__all__ = ["Audit", "Order", "Product", "Ticket", "User"]
