"""upgrade untampered built-in order_confirmation template to phone-confirmation wording

Revision ID: d1e2f3a4b5c6
Revises: e8c4b2a9f1d6
Create Date: 2026-09-02 14:00:00.000000

Problem
-------
The application's ``seed_defaults`` adds built-in templates only when a code
is missing; it never overwrites an existing ``email_templates`` row. Prior to
this change the built-in ``order_confirmation`` template said:

    "Thank you for your order. We're getting it ready."

which no longer matches the new manual phone-confirmation workflow. Because
that exact built-in body shipped unchanged since the monorepo was created, we
can safely upgrade a row that still matches this fingerprint while leaving any
admin-customized ``order_confirmation`` template untouched.

Strategy
--------
Deterministic data migration: UPDATE ONLY the single ``email_templates`` row
whose ``code`` = 'order_confirmation' AND whose subject AND html_body still
exactly equal the historical built-in default (the fingerprint). Anything else
(a customized subject/body) is preserved verbatim. Idempotent: once run, the
row's body no longer matches the old fingerprint, so re-running is a no-op.

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "d1e2f3a4b5c6"
down_revision: Union[str, None] = "e8c4b2a9f1d6"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

# Historical built-in values that shipped unchanged in every published version.
_OLD_SUBJECT = "Order {{ order_number }} confirmed - {{ store_name }}"
_OLD_BODY = (
    "<p>Hi {{ customer_name }},</p>"
    "<p>Thank you for your order. We're getting it ready.</p>"
    "<h3>Order {{ order_number }}</h3>"
    '<table border="1" cellpadding="8" cellspacing="0" '
    'style="border-collapse:collapse;width:100%">'
    "<tr><th>Item</th><th>Qty</th><th>Price</th></tr>"
    "{% for item in items %}"
    "<tr><td>{{ item.product_name }}</td><td>{{ item.quantity }}</td>"
    "<td>{{ item.total_price }} {{ currency }}</td></tr>"
    "{% endfor %}"
    "</table>"
    "<p><strong>Total:</strong> {{ total_price }} {{ currency }}</p>"
    "{% if tracking_number %}"
    "<p>Tracking: {{ tracking_number }} ({{ tracking_company }})</p>"
    "{% endif %}"
    "<p>Thank you for shopping with {{ store_name }}.</p>"
)

# The new built-in default (must stay in lock-step with BUILT_IN_TEMPLATES).
_NEW_SUBJECT = "Order {{ order_number }} confirmed - {{ store_name }}"
_NEW_BODY = (
    "<p>Hi {{ customer_name }},</p>"
    "<p>Good news! We've spoken with you and your order "
    "<strong>{{ order_number }}</strong> is now confirmed.</p>"
    "<p>We're moving your order forward for processing and shipment.</p>"
    "<h3>Order {{ order_number }}</h3>"
    '<table border="1" cellpadding="8" cellspacing="0" '
    'style="border-collapse:collapse;width:100%">'
    "<tr><th>Item</th><th>Qty</th><th>Price</th></tr>"
    "{% for item in items %}"
    "<tr><td>{{ item.product_name }}</td><td>{{ item.quantity }}</td>"
    "<td>{{ item.total_price }} {{ currency }}</td></tr>"
    "{% endfor %}"
    "</table>"
    "<p><strong>Total:</strong> {{ total_price }} {{ currency }}</p>"
    "{% if tracking_number %}"
    "<p>Tracking: {{ tracking_number }} ({{ tracking_company }})</p>"
    "{% endif %}"
    "<p>Thank you for shopping with {{ store_name }}.</p>"
)


def upgrade() -> None:
    conn = op.get_bind()
    result = conn.execute(
        sa.text(
            "SELECT id FROM email_templates "
            "WHERE code = 'order_confirmation' AND subject = :subject AND html_body = :body"
        ),
        {"subject": _OLD_SUBJECT, "body": _OLD_BODY},
    )
    row = result.fetchone()
    if row is None:
        # Either no row, an admin-customized template, or already upgraded.
        return
    conn.execute(
        sa.text("UPDATE email_templates SET subject = :subject, html_body = :body WHERE id = :id"),
        {"subject": _NEW_SUBJECT, "body": _NEW_BODY, "id": row[0]},
    )


def downgrade() -> None:
    # Restore the old default only when the row still exactly matches the new
    # built-in (i.e. the admin has not further customized it since upgrading).
    # Best-effort and intentionally narrow to avoid clobbering custom content.
    conn = op.get_bind()
    result = conn.execute(
        sa.text(
            "SELECT id FROM email_templates "
            "WHERE code = 'order_confirmation' AND subject = :subject AND html_body = :body"
        ),
        {"subject": _NEW_SUBJECT, "body": _NEW_BODY},
    )
    row = result.fetchone()
    if row is None:
        return
    conn.execute(
        sa.text("UPDATE email_templates SET subject = :subject, html_body = :body WHERE id = :id"),
        {"subject": _OLD_SUBJECT, "body": _OLD_BODY, "id": row[0]},
    )