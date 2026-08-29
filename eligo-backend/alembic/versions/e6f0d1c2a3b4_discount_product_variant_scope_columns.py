"""discount product/variant scope columns

Adds ``applies_to_products`` and ``applies_to_variants`` JSON columns to the
``discounts`` table so admin-created promo discounts can be scoped to specific
catalog items (instead of applying to the whole cart). Null/empty = applies to
all items.

Revision ID: e6f0d1c2a3b4
Revises: b0a1c2d3e4f5
Create Date: 2026-08-29 04:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "e6f0d1c2a3b4"
down_revision: Union[str, None] = "b0a1c2d3e4f5"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("discounts", sa.Column("applies_to_products", sa.JSON(), nullable=True))
    op.add_column("discounts", sa.Column("applies_to_variants", sa.JSON(), nullable=True))


def downgrade() -> None:
    op.drop_column("discounts", "applies_to_variants")
    op.drop_column("discounts", "applies_to_products")
