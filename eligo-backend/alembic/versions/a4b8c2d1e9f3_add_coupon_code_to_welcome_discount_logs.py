"""add coupon_code to welcome_discount_logs

Add a unique, server-generated ``coupon_code`` column to
``welcome_discount_logs`` so each eligible visitor receives a unique promo
code instead of a shared ``WELCOME<n>`` code.

Revision ID: a4b8c2d1e9f3
Revises: 6b8c4e2f9a71
Create Date: 2026-09-01 18:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "a4b8c2d1e9f3"
down_revision: Union[str, None] = "6b8c4e2f9a71"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "welcome_discount_logs",
        sa.Column("coupon_code", sa.String(), nullable=True),
    )
    op.create_index(
        "ix_welcome_discount_logs_coupon_code",
        "welcome_discount_logs",
        ["coupon_code"],
        unique=True,
    )


def downgrade() -> None:
    op.drop_index(
        "ix_welcome_discount_logs_coupon_code",
        table_name="welcome_discount_logs",
    )
    op.drop_column("welcome_discount_logs", "coupon_code")
