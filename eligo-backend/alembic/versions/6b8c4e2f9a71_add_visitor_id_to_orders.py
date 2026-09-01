"""add_visitor_id_to_orders

Revision ID: 6b8c4e2f9a71
Revises: 3a5b7c9d1e2f
Create Date: 2026-09-01 13:30:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '6b8c4e2f9a71'
down_revision: Union[str, Sequence[str], None] = '3a5b7c9d1e2f'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column(
        'orders',
        sa.Column('visitor_id', sa.String(), nullable=True),
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('orders', 'visitor_id')