from uuid import uuid4

from sqlalchemy import func, select

from backend.core.models import Audit, Order
from tests.conftest import login

BODY = {"product_id": "mlbb-172", "player_id": "123456789", "zone_id": "1234", "expected_price_uzs": 27500}


def create(client, headers, key=None, body=None):
    return client.post(
        "/api/orders", headers={**headers, "Idempotency-Key": key or str(uuid4())}, json=body or BODY
    )


def test_catalog_and_auth(client):
    assert len(client.get("/api/catalog").json()) == 6
    assert client.get("/api/orders").status_code == 401
    assert client.get("/api/admin/orders").status_code == 401


def test_server_price_and_validation(client, headers):
    assert create(client, headers, body={**BODY, "expected_price_uzs": 1}).status_code == 409
    assert create(client, headers, body={**BODY, "player_id": "<script>"}).status_code == 422
    assert create(client, headers, body={**BODY, "price_uzs": 1}).status_code == 422
    assert client.post("/api/orders", headers=headers, json=BODY).status_code == 422


def test_idempotency_and_snapshot(setup, headers, admin_headers):
    client, factory, _ = setup
    key = str(uuid4())
    first = create(client, headers, key).json()
    second = create(client, headers, key).json()
    assert first["id"] == second["id"]
    assert create(client, headers, key, {**BODY, "zone_id": "5678"}).status_code == 409
    client.patch(
        "/api/admin/products/mlbb-172", headers=admin_headers, json={"price_uzs": 30000, "active": True}
    )
    assert create(client, headers, key).json()["price_uzs"] == 27500
    assert create(client, headers).status_code == 409
    assert client.get("/api/orders", headers=headers).json()[0]["price_uzs"] == 27500
    with factory() as db:
        assert db.scalar(select(func.count()).select_from(Order)) == 1
        assert db.scalar(select(func.count()).select_from(Audit)) == 2


def test_user_isolation_and_admin(client, headers):
    order = create(client, headers).json()
    other = login(client)
    assert client.get("/api/orders", headers=other).json() == []
    assert client.post(f"/api/orders/{order['id']}/test-payment", headers=other).status_code == 404
    assert client.get("/api/admin/orders", headers=headers).status_code == 403
    assert (
        client.patch(
            f"/api/admin/orders/{order['id']}", headers=headers, json={"status": "test_completed"}
        ).status_code
        == 403
    )


def test_complete_flow(client, headers, admin_headers):
    order = create(client, headers).json()
    order_id = order["id"]
    endpoint = f"/api/admin/orders/{order_id}"
    assert client.patch(endpoint, headers=admin_headers, json={"status": "test_completed"}).status_code == 409
    assert (
        client.post(f"/api/orders/{order_id}/test-payment", headers=headers).json()["status"] == "test_paid"
    )
    assert client.post(f"/api/orders/{order_id}/cancel", headers=headers).status_code == 409
    for status in ["test_processing", "test_completed"]:
        assert (
            client.patch(endpoint, headers=admin_headers, json={"status": status}).json()["status"] == status
        )
    assert client.patch(endpoint, headers=admin_headers, json={"status": "test_refunded"}).status_code == 409
    assert client.get("/api/admin/summary", headers=admin_headers).json()["test_completed_uzs"] == 27500


def test_failed_refund_and_cancel(client, headers, admin_headers):
    order_id = create(client, headers).json()["id"]
    client.post(f"/api/orders/{order_id}/test-payment", headers=headers)
    for status in ["test_processing", "test_failed", "test_refunded"]:
        assert (
            client.patch(
                f"/api/admin/orders/{order_id}", headers=admin_headers, json={"status": status}
            ).status_code
            == 200
        )
    another = create(client, headers).json()["id"]
    assert client.post(f"/api/orders/{another}/cancel", headers=headers).status_code == 200
    assert client.post(f"/api/orders/{another}/test-payment", headers=headers).status_code == 409


def test_disable_product(client, headers, admin_headers):
    response = client.patch(
        "/api/admin/products/mlbb-172", headers=admin_headers, json={"price_uzs": 27500, "active": False}
    )
    assert response.status_code == 200
    assert create(client, headers).status_code == 404
    assert len(client.get("/api/catalog").json()) == 5


def test_profile_and_support(client, headers, admin_headers):
    for language in ["uz", "ru", "en"]:
        response = client.put(
            "/api/me",
            headers=headers,
            json={"language": language, "player_id": "123456789", "zone_id": "1234", "notifications": False},
        )
        assert response.json()["language"] == language
    ticket = client.post("/api/support", headers=headers, json={"message": "Test savol"}).json()
    assert client.get("/api/support", headers=login(client)).json() == []
    assert (
        client.patch(
            f"/api/admin/support/{ticket['id']}", headers=admin_headers, json={"reply": "Javob tayyor"}
        ).status_code
        == 200
    )
    assert client.get("/api/support", headers=headers).json()[0]["reply"] == "Javob tayyor"
