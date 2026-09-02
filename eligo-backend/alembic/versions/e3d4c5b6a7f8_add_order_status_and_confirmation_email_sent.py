"""add order_status and confirmation_email_sent to orders

Revision ID: e3d4c5b6a7f8
Revises: f7e8d9c0a1b2
Create Date: 2026-09-02

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "e3d4c5b6a7f8"
down_revision: Union[str, Sequence[str], None] = "f7e8d9c0a1b2"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add the manual order-lifecycle status and the one-time email guard."""
    # New enum type for the manual order lifecycle (placed -> confirmed).
    order_status_enum = sa.Enum(
        "placed",
        "confirmed",
        name="orderstatus",
    )
    order_status_enum.create(op.get_bind(), checkfirst=True)

    op.add_column(
        "orders",
        sa.Column(
            "order_status",
            sa.Enum("placed", "confirmed", name="orderstatus"),
            nullable=False,
            server_default="placed",
        ),
    )
    op.add_column(
        "orders",
        sa.Column(
            "confirmation_email_sent",
            sa.Boolean(),
            nullable=False,
            server_default=sa.text("false"),
        ),
    )


def downgrade() -> None:
    """Remove the confirmation columns and the orderstatus enum type."""
    op.drop_column("orders", "confirmation_email_sent")
    op.drop_column("orders", "order_status")
    sa.Enum(name="orderstatus").drop(op.get_bind(), checkfirst=True)
