from backend.catalog.models import Product

PRODUCTS = [
    ("mlbb-55", {"uz": "55 olmos", "ru": "55 алмазов", "en": "55 diamonds"}, "diamonds", 9000),
    ("mlbb-172", {"uz": "172 olmos", "ru": "172 алмаза", "en": "172 diamonds"}, "diamonds", 27500),
    ("mlbb-257", {"uz": "257 olmos", "ru": "257 алмазов", "en": "257 diamonds"}, "diamonds", 42500),
    (
        "mlbb-weekly",
        {"uz": "Haftalik olmos propusk", "ru": "Недельный алмазный пропуск", "en": "Weekly Diamond Pass"},
        "passes",
        19428,
    ),
    (
        "mlbb-elite-weekly",
        {"uz": "Haftalik elit paket", "ru": "Недельный элитный набор", "en": "Weekly Elite Pack"},
        "passes",
        10600,
    ),
    (
        "mlbb-elite-monthly",
        {"uz": "Oylik elit paket", "ru": "Месячный элитный набор", "en": "Monthly Elite Pack"},
        "passes",
        53200,
    ),
]


def seed(db):
    for product_id, names, category, price in PRODUCTS:
        if not db.get(Product, product_id):
            db.add(Product(id=product_id, names=names, category=category, price_uzs=price))
    db.commit()
