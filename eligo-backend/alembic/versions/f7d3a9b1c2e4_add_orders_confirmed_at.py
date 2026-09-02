"""add orders.confirmed_at

Add a ``confirmed_at`` column to ``orders`` representing when an admin
confirmed the order with the customer by phone (null = not yet
customer-confirmed). Backfill historical orders that were clearly processed
under the previous auto-confirm workflow so they do not appear actionable.

Revision ID: f7d3a9b1c2e4
Revises: a4b8c2d1e9f3
Create Date: 2026-09-02 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "f7d3a9b1c2e4"
down_revision: Union[str, None] = "e3d4c5b6a7f8"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "orders",
        sa.Column("confirmed_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index("ix_orders_confirmed_at", "orders", ["confirmed_at"])

    # Safe historical backfill: orders that clearly moved forward under the
    # old auto-confirm workflow are marked as already confirmed. Only fresh
    # pending COD orders (null state, no courier, unpaid) remain unconfirmed
    # so the admin can confirm them by phone.
    op.execute(
        """
        UPDATE orders
        SET confirmed_at = created_at
        WHERE confirmed_at IS NULL
          AND (
              delivery_status IN ('booked','picked_up','in_transit',
                                  'out_for_delivery','delivered','failed','returned')
              OR fulfillment_status IN ('fulfilled','partial','scheduled')
              OR payment_status IN ('paid','partially_paid','voided','refunded')
          )
        """
    )


def downgrade() -> None:
    op.drop_index("ix_orders_confirmed_at", table_name="orders")
    op.drop_column("orders", "confirmed_at")
