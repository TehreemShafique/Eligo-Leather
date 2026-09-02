"""Tests for ``app.modules.orders.router``."""

from decimal import Decimal

import pytest

from app.modules.orders.model import Order, OrderItem, OrderAuditLog, ReturnStatus


async def _seed_order(db_session, order_number="ORD-SEED", **kwargs):
    order = Order(
        order_number=order_number,
        items=[
            OrderItem(
                product_name="Leather Belt",
                unit_price=Decimal("10.00"),
                quantity=2,
                total_price=Decimal("20.00"),
                variant_id=1,
            )
        ],
        **kwargs,
    )
    db_session.add(order)
    await db_session.commit()
    return order


async def test_orders_require_auth(client):
    response = await client.get("/api/v1/orders/")
    assert response.status_code in (401, 403)


async def test_create_order(client, auth_headers, monkeypatch):
    async def _noop_background_dispatch(order_id: int) -> None:
        return None

    monkeypatch.setattr(
        "app.modules.orders.router.background_dispatch_order_placed",
        _noop_background_dispatch,
    )
    response = await client.post(
        "/api/v1/orders/",
        headers=auth_headers,
        json={
            "order_number": "ORD-1001",
            "channel": "Online Store",
            "shipping_cost": 5,
            "tax": 1,
            "items": [{"product_name": "Leather Belt", "unit_price": 10, "quantity": 2}],
        },
    )
    assert response.status_code == 201
    body = response.json()
    assert body["order_number"] == "ORD-1001"
    assert float(body["subtotal"]) == 20.0
    assert float(body["total_price"]) == 26.0
    assert len(body["items"]) == 1


async def test_create_order_invalid_body_returns_422(client, auth_headers):
    response = await client.post("/api/v1/orders/", headers=auth_headers, json={})
    assert response.status_code == 422


async def test_list_orders(client, auth_headers, db_session):
    await _seed_order(db_session, order_number="ORD-LIST")
    response = await client.get("/api/v1/orders/", headers=auth_headers)
    assert response.status_code == 200
    assert len(response.json()) == 1


async def test_list_orders_filters(client, auth_headers, db_session):
    await _seed_order(db_session, order_number="ORD-ARCH", is_archived=True)
    await _seed_order(db_session, order_number="ORD-LIVE")

    response = await client.get(
        "/api/v1/orders/?is_archived=false", headers=auth_headers
    )
    assert response.status_code == 200
    body = response.json()
    assert [o["order_number"] for o in body] == ["ORD-LIVE"]


async def test_get_order_by_id(client, auth_headers, db_session):
    seeded = await _seed_order(db_session, order_number="ORD-GET")
    response = await client.get(f"/api/v1/orders/{seeded.id}", headers=auth_headers)
    assert response.status_code == 200
    assert response.json()["order_number"] == "ORD-GET"


async def test_get_order_missing_returns_404(client, auth_headers):
    response = await client.get("/api/v1/orders/99999", headers=auth_headers)
    assert response.status_code == 404
    assert response.json()["detail"] == "Order not found"


async def test_update_order(client, auth_headers, db_session):
    seeded = await _seed_order(db_session)
    response = await client.patch(
        f"/api/v1/orders/{seeded.id}",
        headers=auth_headers,
        json={"payment_status": "paid"},
    )
    assert response.status_code == 200
    assert response.json()["payment_status"] == "paid"


async def test_update_order_missing_returns_404(client, auth_headers):
    response = await client.patch(
        "/api/v1/orders/99999", headers=auth_headers, json={"tags": "x"}
    )
    assert response.status_code == 404
    assert response.json()["detail"] == "Order not found"


async def test_archive_order(client, auth_headers, db_session):
    seeded = await _seed_order(db_session)
    response = await client.post(
        f"/api/v1/orders/{seeded.id}/archive", headers=auth_headers
    )
    assert response.status_code == 200
    assert response.json()["is_archived"] is True


async def test_archive_order_missing_returns_404(client, auth_headers):
    response = await client.post("/api/v1/orders/99999/archive", headers=auth_headers)
    assert response.status_code == 404
    assert response.json()["detail"] == "Order not found"


async def test_restock_order(client, auth_headers, db_session):
    seeded = await _seed_order(db_session, return_status=ReturnStatus.approved)
    response = await client.post(
        f"/api/v1/orders/{seeded.id}/restock", headers=auth_headers
    )
    assert response.status_code == 200
    assert response.json()["items"][0]["restocked"] is True


async def test_restock_order_missing_returns_404(client, auth_headers):
    response = await client.post("/api/v1/orders/99999/restock", headers=auth_headers)
    assert response.status_code == 404
    assert response.json()["detail"] == "Order not found"


async def test_return_flow(client, auth_headers, db_session):
    seeded = await _seed_order(db_session)

    requested = await client.post(
        f"/api/v1/orders/{seeded.id}/return/request", headers=auth_headers
    )
    assert requested.status_code == 200
    assert requested.json()["return_status"] == "requested"

    approved = await client.post(
        f"/api/v1/orders/{seeded.id}/return/approve", headers=auth_headers
    )
    assert approved.status_code == 200
    assert approved.json()["return_status"] == "approved"

    received = await client.post(
        f"/api/v1/orders/{seeded.id}/return/receive", headers=auth_headers
    )
    assert received.status_code == 200
    assert received.json()["return_status"] == "received"


async def test_return_flow_missing_returns_404(client, auth_headers):
    for suffix in ("request", "approve", "receive"):
        response = await client.post(
            f"/api/v1/orders/99999/return/{suffix}", headers=auth_headers
        )
        assert response.status_code == 404
        assert response.json()["detail"] == "Order not found"


async def test_add_order_note(client, auth_headers, db_session):
    seeded = await _seed_order(db_session)
    response = await client.post(
        f"/api/v1/orders/{seeded.id}/notes",
        headers=auth_headers,
        json={"body": "Please gift wrap", "is_customer_visible": True},
    )
    assert response.status_code == 201
    assert response.json()["body"] == "Please gift wrap"


async def test_add_order_note_missing_order_returns_404(client, auth_headers):
    response = await client.post(
        "/api/v1/orders/99999/notes", headers=auth_headers, json={"body": "hi"}
    )
    assert response.status_code == 404
    assert response.json()["detail"] == "Order not found"


async def test_list_order_notes(client, auth_headers, db_session):
    seeded = await _seed_order(db_session)
    await client.post(
        f"/api/v1/orders/{seeded.id}/notes", headers=auth_headers, json={"body": "one"}
    )
    response = await client.get(
        f"/api/v1/orders/{seeded.id}/notes", headers=auth_headers
    )
    assert response.status_code == 200
    assert [n["body"] for n in response.json()] == ["one"]


async def test_update_order_note(client, auth_headers, db_session):
    seeded = await _seed_order(db_session)
    created = await client.post(
        f"/api/v1/orders/{seeded.id}/notes", headers=auth_headers, json={"body": "old"}
    )
    note_id = created.json()["id"]
    response = await client.patch(
        f"/api/v1/orders/notes/{note_id}",
        headers=auth_headers,
        params={"body": "new"},
    )
    assert response.status_code == 200
    assert response.json()["body"] == "new"


async def test_delete_order_note(client, auth_headers, db_session):
    seeded = await _seed_order(db_session)
    created = await client.post(
        f"/api/v1/orders/{seeded.id}/notes", headers=auth_headers, json={"body": "temp"}
    )
    note_id = created.json()["id"]
    response = await client.delete(
        f"/api/v1/orders/notes/{note_id}", headers=auth_headers
    )
    assert response.status_code == 204


async def test_order_note_missing_returns_404(client, auth_headers):
    response = await client.patch(
        "/api/v1/orders/notes/99999", headers=auth_headers, params={"body": "x"}
    )
    assert response.status_code == 404
    assert response.json()["detail"] == "Note not found"

    response = await client.delete("/api/v1/orders/notes/99999", headers=auth_headers)
    assert response.status_code == 404
    assert response.json()["detail"] == "Note not found"


async def test_audit_log(client, auth_headers, db_session):
    seeded = await _seed_order(db_session)
    db_session.add(
        OrderAuditLog(
            order_id=seeded.id,
            event_type="order_archived",
            description="Order archived",
        )
    )
    await db_session.commit()
    response = await client.get(
        f"/api/v1/orders/{seeded.id}/audit-log", headers=auth_headers
    )
    assert response.status_code == 200
    assert any(log["event_type"] == "order_archived" for log in response.json())


async def test_orders_analytics_empty(client, auth_headers):
    response = await client.get("/api/v1/orders/analytics", headers=auth_headers)
    assert response.status_code == 200
    assert response.json()["total_orders"] == 0
    assert response.json()["total_sales"] == "0"


async def test_orders_analytics_with_orders(client, auth_headers, db_session):
    await _seed_order(db_session, order_number="ORD-ANA", total_price=Decimal("20.00"))
    response = await client.get("/api/v1/orders/analytics", headers=auth_headers)
    assert response.status_code == 200
    assert response.json()["total_orders"] == 1


async def test_export_orders_csv(client, auth_headers, db_session):
    await _seed_order(db_session, order_number="ORD-CSV")
    response = await client.post(
        "/api/v1/orders/export",
        headers=auth_headers,
        json={"scope": "all_orders", "format": "csv"},
    )
    assert response.status_code == 200
    assert "text/csv" in response.headers["content-type"]
    assert "ORD-CSV" in response.text


# ---------------------------------------------------------------------------
# Draft orders
# ---------------------------------------------------------------------------


async def test_create_draft_order(client, auth_headers):
    response = await client.post(
        "/api/v1/orders/drafts",
        headers=auth_headers,
        json={
            "draft_number": "DRAFT-1",
            "items": [{"product_name": "Leather Belt", "unit_price": 10, "quantity": 2}],
        },
    )
    assert response.status_code == 201
    assert response.json()["draft_number"] == "DRAFT-1"
    assert float(response.json()["subtotal"]) == 20.0
    assert float(response.json()["total_price"]) == 20.0


async def test_list_draft_orders(client, auth_headers):
    await client.post(
        "/api/v1/orders/drafts",
        headers=auth_headers,
        json={"draft_number": "DRAFT-L"},
    )
    response = await client.get("/api/v1/orders/drafts", headers=auth_headers)
    assert response.status_code == 200
    assert [d["draft_number"] for d in response.json()] == ["DRAFT-L"]


async def test_get_draft_order_by_id(client, auth_headers):
    created = await client.post(
        "/api/v1/orders/drafts",
        headers=auth_headers,
        json={"draft_number": "DRAFT-G"},
    )
    draft_id = created.json()["id"]
    response = await client.get(f"/api/v1/orders/drafts/{draft_id}", headers=auth_headers)
    assert response.status_code == 200
    assert response.json()["draft_number"] == "DRAFT-G"


async def test_get_draft_order_missing_returns_404(client, auth_headers):
    response = await client.get("/api/v1/orders/drafts/99999", headers=auth_headers)
    assert response.status_code == 404
    assert response.json()["detail"] == "Draft order not found"


async def test_update_draft_order(client, auth_headers):
    created = await client.post(
        "/api/v1/orders/drafts",
        headers=auth_headers,
        json={"draft_number": "DRAFT-U"},
    )
    draft_id = created.json()["id"]
    response = await client.patch(
        f"/api/v1/orders/drafts/{draft_id}",
        headers=auth_headers,
        json={"status": "invoice_sent"},
    )
    assert response.status_code == 200
    assert response.json()["status"] == "invoice_sent"


async def test_add_draft_order_item(client, auth_headers):
    created = await client.post(
        "/api/v1/orders/drafts",
        headers=auth_headers,
        json={"draft_number": "DRAFT-I"},
    )
    draft_id = created.json()["id"]
    response = await client.post(
        f"/api/v1/orders/drafts/{draft_id}/items",
        headers=auth_headers,
        json={"product_name": "Wallet", "unit_price": 15, "quantity": 1},
    )
    assert response.status_code == 201
    assert response.json()["product_name"] == "Wallet"
    assert response.json()["total_price"] == "15.00"


async def test_remove_draft_order_item(client, auth_headers):
    created = await client.post(
        "/api/v1/orders/drafts",
        headers=auth_headers,
        json={"draft_number": "DRAFT-D",
              "items": [{"product_name": "Belt", "unit_price": 10, "quantity": 1}]},
    )
    draft_id = created.json()["id"]
    item_id = created.json()["items"][0]["id"]
    response = await client.delete(
        f"/api/v1/orders/drafts/{draft_id}/items/{item_id}", headers=auth_headers
    )
    assert response.status_code == 204


async def test_convert_draft_to_order(client, auth_headers):
    created = await client.post(
        "/api/v1/orders/drafts",
        headers=auth_headers,
        json={"draft_number": "DRAFT-C",
              "items": [{"product_name": "Belt", "unit_price": 10, "quantity": 1}]},
    )
    draft_id = created.json()["id"]
    response = await client.post(
        f"/api/v1/orders/drafts/{draft_id}/convert",
        headers=auth_headers,
        params={"order_number": "ORD-CONVERTED"},
    )
    assert response.status_code == 200
    assert response.json()["order_number"] == "ORD-CONVERTED"


# ---------------------------------------------------------------------------
# Abandoned checkouts
# ---------------------------------------------------------------------------


async def test_create_abandoned_checkout(client, auth_headers):
    response = await client.post(
        "/api/v1/orders/abandoned-checkouts",
        headers=auth_headers,
        json={"checkout_reference": "CHK-1", "total_price": 50},
    )
    assert response.status_code == 201
    body = response.json()
    assert body["checkout_reference"] == "CHK-1"
    assert body["recovery_token"] is not None


async def test_list_abandoned_checkouts(client, auth_headers):
    await client.post(
        "/api/v1/orders/abandoned-checkouts",
        headers=auth_headers,
        json={"checkout_reference": "CHK-L"},
    )
    response = await client.get(
        "/api/v1/orders/abandoned-checkouts", headers=auth_headers
    )
    assert response.status_code == 200
    assert [c["checkout_reference"] for c in response.json()] == ["CHK-L"]


async def test_get_abandoned_checkout_by_id(client, auth_headers):
    created = await client.post(
        "/api/v1/orders/abandoned-checkouts",
        headers=auth_headers,
        json={"checkout_reference": "CHK-G"},
    )
    checkout_id = created.json()["id"]
    response = await client.get(
        f"/api/v1/orders/abandoned-checkouts/{checkout_id}", headers=auth_headers
    )
    assert response.status_code == 200
    assert response.json()["checkout_reference"] == "CHK-G"


async def test_get_abandoned_checkout_missing_returns_404(client, auth_headers):
    response = await client.get(
        "/api/v1/orders/abandoned-checkouts/99999", headers=auth_headers
    )
    assert response.status_code == 404
    assert response.json()["detail"] == "Abandoned checkout not found"


async def test_update_abandoned_checkout(client, auth_headers):
    created = await client.post(
        "/api/v1/orders/abandoned-checkouts",
        headers=auth_headers,
        json={"checkout_reference": "CHK-U"},
    )
    checkout_id = created.json()["id"]
    response = await client.patch(
        f"/api/v1/orders/abandoned-checkouts/{checkout_id}",
        headers=auth_headers,
        json={"customer_name": "Ayesha"},
    )
    assert response.status_code == 200
    assert response.json()["customer_name"] == "Ayesha"


async def test_send_recovery_email(client, auth_headers):
    created = await client.post(
        "/api/v1/orders/abandoned-checkouts",
        headers=auth_headers,
        json={"checkout_reference": "CHK-R"},
    )
    checkout_id = created.json()["id"]
    response = await client.post(
        f"/api/v1/orders/abandoned-checkouts/{checkout_id}/send-recovery-email",
        headers=auth_headers,
    )
    assert response.status_code == 200
    assert response.json()["recovery_status"] == "email_sent"
    assert response.json()["recovery_attempts"] == 1


async def test_mark_checkout_recovered(client, auth_headers):
    created = await client.post(
        "/api/v1/orders/abandoned-checkouts",
        headers=auth_headers,
        json={"checkout_reference": "CHK-M"},
    )
    checkout_id = created.json()["id"]
    response = await client.post(
        f"/api/v1/orders/abandoned-checkouts/{checkout_id}/mark-recovered",
        headers=auth_headers,
    )
    assert response.status_code == 200
    assert response.json()["recovery_status"] == "recovered"


async def test_export_abandoned_checkouts_csv(client, auth_headers):
    await client.post(
        "/api/v1/orders/abandoned-checkouts",
        headers=auth_headers,
        json={"checkout_reference": "CHK-CSV"},
    )
    response = await client.post(
        "/api/v1/orders/abandoned-checkouts/export",
        headers=auth_headers,
    )
    assert response.status_code == 200
    assert "text/csv" in response.headers["content-type"]
    assert "CHK-CSV" in response.text


async def test_receive_leopard_webhook(client, db_session):
    order = await _seed_order(db_session, order_number="ORD-LPD-1", tracking_number="LPD-84920194")

    payload = {
        "data": [
            {
                "cn_number": "LPD-84920194",
                "status": "Delivered",
                "receiver_name": "Muhammad Ali",
                "reason": "Delivered to recipient",
                "activity_date": "2026-02-11 14:30:00",
            }
        ]
    }

    response = await client.post("/api/v1/orders/webhooks/leopard", json=payload)
    assert response.status_code == 200
    res_json = response.json()
    assert res_json["status"] == "success"
    assert res_json["raw_received"] == payload
    assert res_json["processed_result"]["matched_updated"] == 1


async def test_get_leopard_orders_api(client, db_session):
    await _seed_order(db_session, order_number="#1331", tracking_number="ID7536607778")
    response = await client.get("/api/v1/orders/leopard/list")
    assert response.status_code == 200
    res_json = response.json()
    assert res_json["status"] == "success"
    assert len(res_json["orders"]) >= 1


async def test_generate_leopard_cn_api(client):
    response = await client.post("/api/v1/orders/leopard/generate-cn", json={"order_ids": [1331, 1329]})
    assert response.status_code == 200
    res_json = response.json()
    assert res_json["status"] == "success"
    assert len(res_json["results"]) == 2


