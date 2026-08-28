"""
End-to-end tests for the customer review pipeline:

  1. Customer submits a review (public POST) -> stored as 'pending'
  2. Admin fetches reviews and approves/rejects them (action endpoint)
  3. Approved reviews appear on public list/summary endpoints only
  4. Admin can delete a review
The public endpoints are reachable without any install/credentials because
the whole flow is backed by the store's own database.
"""

from sqlalchemy import func, select

from app.modules.settings.account.model import UserSession
from app.modules.settings.apps.model import Review
from app.modules.settings.apps.reviews import review_summary, create_review, update_review_status


async def _reset_admin_sessions(db_session):
    """SQLite re-reads the timezone-aware ``last_seen_at`` written by an admin
    request as naive; reset the session ledger rows to None so each admin
    request behaves like the first."""
    rows = (await db_session.execute(select(UserSession))).scalars().all()
    for row in rows:
        row.last_seen_at = None
    await db_session.commit()


async def _install_reviews_app(client, admin_headers, db_session) -> None:
    resp = await client.post(
        "/api/v1/settings/apps/supabase_reviews/install",
        json={"app_code": "supabase_reviews"},
        headers=admin_headers,
    )
    assert resp.status_code == 201


async def _create_review_payload(product_id="1"):
    return {
        "external_id": product_id,
        "reviewer_name": "Ali Raza",
        "reviewer_email": "ali@example.com",
        "rating": 5,
        "title": "Amazing quality",
        "body": "Genuine leather, loved it.",
        "images": ["/static/uploads/photo-1.webp", "/static/uploads/photo-2.webp"],
    }


# ---------------------------------------------------------------------------
# Data layer
# ---------------------------------------------------------------------------


async def test_create_review_stores_pending(db_session):
    result = await create_review(db_session, await _create_review_payload())
    assert result["success"] is True
    serialized = result["review"]
    assert serialized["status"] == "pending"
    assert serialized["product_id"] == "1"
    assert serialized["rating"] == 5
    assert len(serialized["images"]) == 2
    assert serialized["photo_urls"] == serialized["images"]


async def test_review_summary_counts_only_approved(db_session):
    created = await create_review(db_session, await _create_review_payload("7"))
    await update_review_status(db_session, created["review"]["id"], "approved")

    await create_review(
        db_session, {**await _create_review_payload("7"), "rating": 3}
    )
    # one approved (5) + one pending (3) -> summary ignores pending
    summary = await review_summary(db_session, "7")
    assert summary["review_count"] == 1
    assert summary["average_rating"] == 5


# ---------------------------------------------------------------------------
# Public storefront endpoints
# ---------------------------------------------------------------------------


async def test_public_list_returns_only_approved(client):
    # A review submitted through the public endpoint is pending at first.
    create_resp = await client.post(
        "/api/v1/settings/apps/supabase_reviews/public/reviews",
        json=await _create_review_payload("9"),
    )
    assert create_resp.status_code == 201
    review = create_resp.json()["review"]
    assert review["status"] == "pending"

    # Pending reviews are invisible to customers.
    listing = await client.get(
        "/api/v1/settings/apps/supabase_reviews/public/reviews?product_id=9"
    )
    assert listing.status_code == 200
    assert listing.json() == []

    summary_before = await client.get(
        "/api/v1/settings/apps/supabase_reviews/public/reviews/summary?product_id=9"
    )
    assert summary_before.json() == {
        "product_id": "9",
        "average_rating": 0,
        "review_count": 0,
    }


async def test_public_create_review_validation(client):
    resp = await client.post(
        "/api/v1/settings/apps/supabase_reviews/public/reviews",
        json={**await _create_review_payload(), "rating": 9},
    )
    assert resp.status_code == 422


# ---------------------------------------------------------------------------
# Admin moderation via the action dispatcher
# ---------------------------------------------------------------------------


async def test_admin_approve_then_public_visible(client, admin_headers, db_session):
    await _reset_admin_sessions(db_session)
    await _install_reviews_app(client, admin_headers, db_session)
    created = await client.post(
        "/api/v1/settings/apps/supabase_reviews/public/reviews",
        json=await _create_review_payload("42"),
    )
    review_id = created.json()["review"]["id"]

    await _reset_admin_sessions(db_session)
    fetched = await client.post(
        "/api/v1/settings/apps/supabase_reviews/action",
        json={"action": "fetch_reviews", "payload": {"page": 1, "per_page": 20}},
        headers=admin_headers,
    )
    assert fetched.status_code == 200
    reviews = fetched.json()["data"]["reviews"]
    assert any(r["id"] == review_id and r["status"] == "pending" for r in reviews)

    await _reset_admin_sessions(db_session)
    approved = await client.post(
        "/api/v1/settings/apps/supabase_reviews/action",
        json={
            "action": "update_review_status",
            "payload": {"review_id": review_id, "status": "approved"},
        },
        headers=admin_headers,
    )
    assert approved.status_code == 200
    assert approved.json()["data"]["review"]["status"] == "approved"

    listing = await client.get(
        "/api/v1/settings/apps/supabase_reviews/public/reviews?product_id=42"
    )
    assert listing.status_code == 200
    assert len(listing.json()) == 1

    summary = await client.get(
        "/api/v1/settings/apps/supabase_reviews/public/reviews/summary?product_id=42"
    )
    body = summary.json()
    assert body["product_id"] == "42"
    assert body["review_count"] == 1
    assert body["average_rating"] == 5


# ---------------------------------------------------------------------------
# Home page reviews (no specific product)
# ---------------------------------------------------------------------------


async def test_homepage_review_pipeline(client, admin_headers, db_session):
    """A review submitted from the home page has no product and, once
    approved, appears in the general storefront list (home page testimonials)
    but never in a product-filtered listing."""
    payload = await _create_review_payload()
    payload.pop("external_id")

    await _reset_admin_sessions(db_session)
    await _install_reviews_app(client, admin_headers, db_session)
    created = await client.post(
        "/api/v1/settings/apps/supabase_reviews/public/reviews", json=payload
    )
    assert created.status_code == 201
    review = created.json()["review"]
    assert review["product_id"] is None
    assert review["status"] == "pending"

    # Admin sees the homepage review in the moderation queue.
    await _reset_admin_sessions(db_session)
    fetched = await client.post(
        "/api/v1/settings/apps/supabase_reviews/action",
        json={"action": "fetch_reviews", "payload": {"page": 1, "per_page": 20}},
        headers=admin_headers,
    )
    fetched_reviews = fetched.json()["data"]["reviews"]
    assert any(
        r["id"] == review["id"] and r["product_id"] is None for r in fetched_reviews
    )

    # Approve it.
    await _reset_admin_sessions(db_session)
    await client.post(
        "/api/v1/settings/apps/supabase_reviews/action",
        json={
            "action": "update_review_status",
            "payload": {"review_id": review["id"], "status": "approved"},
        },
        headers=admin_headers,
    )

    # It appears on the home page list but not on a product page.
    home_listing = await client.get(
        "/api/v1/settings/apps/supabase_reviews/public/reviews"
    )
    assert any(r["id"] == review["id"] for r in home_listing.json())

    product_listing = await client.get(
        "/api/v1/settings/apps/supabase_reviews/public/reviews?product_id=42"
    )
    assert all(r["id"] != review["id"] for r in product_listing.json())


async def test_admin_reject_hides_review(client, admin_headers, db_session):
    await _reset_admin_sessions(db_session)
    await _install_reviews_app(client, admin_headers, db_session)
    created = await client.post(
        "/api/v1/settings/apps/supabase_reviews/public/reviews",
        json=await _create_review_payload("43"),
    )
    review_id = created.json()["review"]["id"]

    await _reset_admin_sessions(db_session)
    await client.post(
        "/api/v1/settings/apps/supabase_reviews/action",
        json={
            "action": "update_review_status",
            "payload": {"review_id": review_id, "status": "rejected"},
        },
        headers=admin_headers,
    )

    listing = await client.get(
        "/api/v1/settings/apps/supabase_reviews/public/reviews?product_id=43"
    )
    assert listing.json() == []


async def test_admin_delete_review(client, admin_headers, db_session):
    await _reset_admin_sessions(db_session)
    await _install_reviews_app(client, admin_headers, db_session)
    created = await client.post(
        "/api/v1/settings/apps/supabase_reviews/public/reviews",
        json=await _create_review_payload("44"),
    )
    review_id = created.json()["review"]["id"]

    await _reset_admin_sessions(db_session)
    deleted = await client.post(
        "/api/v1/settings/apps/supabase_reviews/action",
        json={"action": "delete_review", "payload": {"review_id": review_id}},
        headers=admin_headers,
    )
    assert deleted.status_code == 200
    count = (
        await db_session.execute(select(func.count()).select_from(Review))
    ).scalar()
    assert count == 0

    await _reset_admin_sessions(db_session)
    again = await client.post(
        "/api/v1/settings/apps/supabase_reviews/action",
        json={"action": "delete_review", "payload": {"review_id": review_id}},
        headers=admin_headers,
    )
    assert again.status_code == 400


async def test_admin_review_summary_action(client, admin_headers, db_session):
    await _reset_admin_sessions(db_session)
    await _install_reviews_app(client, admin_headers, db_session)
    created = await create_review(
        db_session, {**await _create_review_payload("8"), "rating": 4}
    )
    await update_review_status(db_session, created["review"]["id"], "approved")

    await _reset_admin_sessions(db_session)
    resp = await client.post(
        "/api/v1/settings/apps/supabase_reviews/action",
        json={"action": "review_summary", "payload": {"product_id": "8"}},
        headers=admin_headers,
    )
    assert resp.status_code == 200
    summary = resp.json()["data"]
    assert summary["product_id"] == "8"
    assert summary["review_count"] == 1
    assert summary["average_rating"] == 4


async def test_admin_moderation_works_without_install(client, admin_headers, db_session):
    """Customers can submit reviews and admins can moderate them even when the
    app has never been installed — reviews live in the store's own database."""
    await _reset_admin_sessions(db_session)
    created = await client.post(
        "/api/v1/settings/apps/supabase_reviews/public/reviews",
        json=await _create_review_payload("77"),
    )
    review_id = created.json()["review"]["id"]
    assert created.status_code == 201

    await _reset_admin_sessions(db_session)
    fetched = await client.post(
        "/api/v1/settings/apps/supabase_reviews/action",
        json={"action": "fetch_reviews", "payload": {"per_page": 20}},
        headers=admin_headers,
    )
    assert fetched.status_code == 200
    assert any(
        r["id"] == review_id and r["status"] == "pending"
        for r in fetched.json()["data"]["reviews"]
    )

    await _reset_admin_sessions(db_session)
    approved = await client.post(
        "/api/v1/settings/apps/supabase_reviews/action",
        json={
            "action": "update_review_status",
            "payload": {"review_id": review_id, "status": "approved"},
        },
        headers=admin_headers,
    )
    assert approved.status_code == 200
    assert approved.json()["data"]["review"]["status"] == "approved"