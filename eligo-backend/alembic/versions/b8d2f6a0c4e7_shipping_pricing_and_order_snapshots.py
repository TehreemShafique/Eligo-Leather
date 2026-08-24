"""shipping pricing settings and order delivery snapshots

Adds the single-source-of-truth shipping charge configuration to
`shipping_settings` (flat charge + free-shipping threshold + return address)
and per-order delivery snapshots to `orders` (name/phone/street/city/
province/postal/country + payment_method) so historical orders keep the
amounts and addresses that were valid when they were placed.

Also extends the `deliverystatus` PostgreSQL enum with the two courier
lifecycle states the Leopards integration reports (booked, picked_up).

Revision ID: b8d2f6a0c4e7
Revises: e5f6a7b8c9d0
Create Date: 2026-08-24

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "b8d2f6a0c4e7"
down_revision: Union[str, Sequence[str], None] = "e5f6a7b8c9d0"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "shipping_settings",
        sa.Column("shipping_charge", sa.Numeric(12, 2), nullable=False, server_default="250"),
    )
    op.add_column(
        "shipping_settings",
        sa.Column("free_shipping_threshold", sa.Numeric(12, 2), nullable=False, server_default="4000"),
    )
    op.add_column(
        "shipping_settings",
        sa.Column("return_same_as_sender", sa.Boolean(), nullable=False, server_default=sa.true()),
    )
    op.add_column("shipping_settings", sa.Column("return_name", sa.String(), nullable=True))
    op.add_column("shipping_settings", sa.Column("return_phone", sa.String(), nullable=True))
    op.add_column("shipping_settings", sa.Column("return_address", sa.String(), nullable=True))
    op.add_column("shipping_settings", sa.Column("return_city", sa.String(), nullable=True))
    op.add_column("shipping_settings", sa.Column("return_province", sa.String(), nullable=True))
    op.add_column("shipping_settings", sa.Column("return_postal_code", sa.String(), nullable=True))
    op.add_column("shipping_settings", sa.Column("return_country", sa.String(), nullable=True))

    op.add_column("orders", sa.Column("payment_method", sa.String(), nullable=True))
    op.add_column("orders", sa.Column("shipping_name", sa.String(), nullable=True))
    op.add_column("orders", sa.Column("shipping_phone", sa.String(), nullable=True))
    op.add_column("orders", sa.Column("shipping_address_line1", sa.Text(), nullable=True))
    op.add_column("orders", sa.Column("shipping_city", sa.String(), nullable=True))
    op.add_column("orders", sa.Column("shipping_province", sa.String(), nullable=True))
    op.add_column("orders", sa.Column("shipping_postal_code", sa.String(), nullable=True))
    op.add_column("orders", sa.Column("shipping_country", sa.String(), nullable=True))

    # New enum members for the Leopards courier lifecycle. PG 12+ allows
    # ADD VALUE inside a transaction as long as the value is not used in it.
    op.execute("ALTER TYPE deliverystatus ADD VALUE IF NOT EXISTS 'booked'")
    op.execute("ALTER TYPE deliverystatus ADD VALUE IF NOT EXISTS 'picked_up'")


def downgrade() -> None:
    op.drop_column("orders", "shipping_country")
    op.drop_column("orders", "shipping_postal_code")
    op.drop_column("orders", "shipping_province")
    op.drop_column("orders", "shipping_city")
    op.drop_column("orders", "shipping_address_line1")
    op.drop_column("orders", "shipping_phone")
    op.drop_column("orders", "shipping_name")
    op.drop_column("orders", "payment_method")

    op.drop_column("shipping_settings", "return_country")
    op.drop_column("shipping_settings", "return_postal_code")
    op.drop_column("shipping_settings", "return_province")
    op.drop_column("shipping_settings", "return_city")
    op.drop_column("shipping_settings", "return_address")
    op.drop_column("shipping_settings", "return_phone")
    op.drop_column("shipping_settings", "return_name")
    op.drop_column("shipping_settings", "return_same_as_sender")
    op.drop_column("shipping_settings", "free_shipping_threshold")
    op.drop_column("shipping_settings", "shipping_charge")

    # Enum values cannot be removed in PostgreSQL; leave them in place.
