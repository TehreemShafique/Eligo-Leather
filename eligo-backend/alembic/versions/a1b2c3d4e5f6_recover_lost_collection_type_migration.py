"""recovery stub for lost migration a1b2c3d4e5f6

The original file (`add_collection_type_to_collections`) was lost from
version control, but its changes were already applied to the dev database:
- `collections.collection_type` (NOT NULL, server default 'wallets')
- `product_collections` table (PK + CASCADE FKs)

This empty stub restores the linear migration chain.

Revision ID: a1b2c3d4e5f6
Revises: b7c3e9a1f2d4
Create Date: 2026-08-21

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "a1b2c3d4e5f6"
down_revision: Union[str, Sequence[str], None] = "b7c3e9a1f2d4"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Changes were already applied out-of-band; nothing to do.
    pass


def downgrade() -> None:
    # Intentionally not reversing the recovered migration.
    pass
