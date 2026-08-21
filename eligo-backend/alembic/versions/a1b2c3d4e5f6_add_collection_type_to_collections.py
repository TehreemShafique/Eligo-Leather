"""add collection_type to collections and drop theme_template

Revision ID: a1b2c3d4e5f6
Revises: 42cd80795693
Create Date: 2026-08-20 10:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = 'a1b2c3d4e5f6'
down_revision: Union[str, Sequence[str], None] = '42cd80795693'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    collection_type_enum = sa.Enum(
        'wallets', 'belts', 'cases', 'keychains',
        name='collection_type',
    )
    collection_type_enum.create(op.get_bind(), checkfirst=True)
    op.add_column(
        'collections',
        sa.Column(
            'collection_type',
            sa.Enum('wallets', 'belts', 'cases', 'keychains', name='collection_type'),
            nullable=False,
            server_default='wallets',
        ),
    )
    op.drop_column('collections', 'theme_template')


def downgrade() -> None:
    op.add_column(
        'collections',
        sa.Column('theme_template', sa.String(), nullable=False, server_default='Default collection'),
    )
    op.drop_column('collections', 'collection_type')
    sa.Enum(name='collection_type').drop(op.get_bind(), checkfirst=True)
