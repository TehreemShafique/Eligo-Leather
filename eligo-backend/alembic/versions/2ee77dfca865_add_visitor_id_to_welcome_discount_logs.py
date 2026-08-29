"""add_visitor_id_to_welcome_discount_logs

Revision ID: 2ee77dfca865
Revises: dc5e6f7a8b9c
Create Date: 2026-08-29 17:29:56.631653

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '2ee77dfca865'
down_revision: Union[str, Sequence[str], None] = 'dc5e6f7a8b9c'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column('welcome_discount_logs', sa.Column('visitor_id', sa.String(), nullable=True))
    op.create_index(
        'ix_welcome_discount_logs_visitor_id',
        'welcome_discount_logs',
        ['visitor_id'],
        unique=True,
    )
    # Legacy rows were inserted with NOT NULL email/IP; the new anonymous
    # visitor flow only needs the visitor id.
    op.alter_column('welcome_discount_logs', 'user_email', existing_type=sa.String(), nullable=True)
    op.alter_column('welcome_discount_logs', 'ip_address', existing_type=sa.String(), nullable=True)


def downgrade() -> None:
    """Downgrade schema."""
    op.alter_column('welcome_discount_logs', 'ip_address', existing_type=sa.String(), nullable=False)
    op.alter_column('welcome_discount_logs', 'user_email', existing_type=sa.String(), nullable=False)
    op.drop_index('ix_welcome_discount_logs_visitor_id', table_name='welcome_discount_logs')
    op.drop_column('welcome_discount_logs', 'visitor_id')
