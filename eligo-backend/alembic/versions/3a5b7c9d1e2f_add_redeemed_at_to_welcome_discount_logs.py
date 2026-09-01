"""add_redeemed_at_to_welcome_discount_logs

Revision ID: 3a5b7c9d1e2f
Revises: 2ee77dfca865
Create Date: 2026-09-01 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '3a5b7c9d1e2f'
down_revision: Union[str, Sequence[str], None] = '2ee77dfca865'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column(
        'welcome_discount_logs',
        sa.Column('redeemed_at', sa.DateTime(timezone=True), nullable=True),
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('welcome_discount_logs', 'redeemed_at')
