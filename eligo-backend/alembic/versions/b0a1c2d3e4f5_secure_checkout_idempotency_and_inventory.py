"""secure checkout: order idempotency key

Secure Backend Checkout:
- Adds a DB-unique ``idempotency_key`` on ``orders`` so a checkout request can
  only ever produce one order (prevents double-clicks / retries from creating
  duplicate orders or double-deducting stock).

Stock integrity is enforced at the application level: checkout validates
inventory before creation and deducts it atomically under row locks for
tracked variants, while explicitly refusing to oversell those that do not opt
into ``continue_selling_out_of_stock``. A hard ``>= 0`` CHECK is deliberately
omitted here because Eligo supports the intentional merchant ``continue
selling out of stock`` feature, which legitimately takes tracked stock below
zero — so a blanket database CHECK would break that designed behavior.

Revision ID: b0a1c2d3e4f5
Revises: c3f4a5b6d7e8
Create Date: 2026-08-29 02:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "b0a1c2d3e4f5"
down_revision: Union[str, None] = "c3f4a5b6d7e8"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # DB-unique checkout idempotency key on orders (NULL allowed for legacy rows).
    op.add_column("orders", sa.Column("idempotency_key", sa.String(), nullable=True))
    op.create_index(
        "ix_orders_idempotency_key", "orders", ["idempotency_key"], unique=True
    )


def downgrade() -> None:
    op.drop_index("ix_orders_idempotency_key", table_name="orders")
    op.drop_column("orders", "idempotency_key")
