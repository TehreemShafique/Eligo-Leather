"""drop order note columns

Revision ID: 9a1b2c3d4e5f
Revises: f0e1d2c3b4a5
Create Date: 2026-08-28 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '9a1b2c3d4e5f'
down_revision: Union[str, Sequence[str], None] = 'f0e1d2c3b4a5'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Drop the now-unused order note columns."""
    op.drop_column('orders', 'internal_note')
    op.drop_column('orders', 'customer_note')


def downgrade() -> None:
    """Re-add the order note columns (column order may differ from original)."""
    op.add_column('orders', sa.Column('customer_note', sa.Text(), nullable=True))
    op.add_column('orders', sa.Column('internal_note', sa.Text(), nullable=True))
