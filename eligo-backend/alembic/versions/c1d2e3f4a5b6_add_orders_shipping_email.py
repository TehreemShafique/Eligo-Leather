"""add orders.shipping_email

Add a ``shipping_email`` column to ``orders`` so every order retains an
email-address snapshot of the contact used at checkout. The ``order.customer_email``
property (and all order email dispatches) prefer this snapshot over the linked
``Customer`` profile, so editing a shared customer record's email never rewrites
the recipient of a historical order's notifications.

Backfill existing rows from their linked customer profile so no historical order
loses its customer email.

Revision ID: c1d2e3f4a5b6
Revises: d1e2f3a4b5c6
Create Date: 2026-09-03 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "c1d2e3f4a5b6"
down_revision: Union[str, None] = "d1e2f3a4b5c6"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "orders",
        sa.Column("shipping_email", sa.String(), nullable=True),
    )

    # Safe historical backfill: snapshot each order's customer email so existing
    # orders keep the address used at checkout, even if the customer profile is
    # later edited. Only rows with a linked customer and no snapshot yet are set.
    op.execute(
        """
        UPDATE orders
        SET shipping_email = (
            SELECT email FROM customers WHERE customers.id = orders.customer_id
        )
        WHERE shipping_email IS NULL AND customer_id IS NOT NULL
        """
    )


def downgrade() -> None:
    op.drop_column("orders", "shipping_email")
