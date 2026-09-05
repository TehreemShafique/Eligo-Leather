"""add category tree (parent_id) to collections

Revision ID: f1a2b3c4d5e6
Revises: a1b2c3d4e5f6
Create Date: 2026-08-21

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "f1a2b3c4d5e6"
down_revision: Union[str, Sequence[str], None] = "a1b2c3d4e5f6"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Parent category (self-reference) powering the storefront category tree.
    op.add_column(
        "collections",
        sa.Column("parent_id", sa.Integer(), nullable=True),
    )
    op.create_foreign_key(
        "fk_collections_parent_id_collections",
        "collections",
        "collections",
        ["parent_id"],
        ["id"],
    )

    # product_collections already exists (recovered migration); make sure the
    # lookup index used by category filtering is present.
    op.execute(
        "CREATE INDEX IF NOT EXISTS ix_product_collections_collection_id "
        "ON product_collections (collection_id)"
    )


def downgrade() -> None:
    op.execute(
        "DROP INDEX IF EXISTS ix_product_collections_collection_id"
    )
    op.drop_constraint(
        "fk_collections_parent_id_collections", "collections", type_="foreignkey",
    )
    op.drop_column("collections", "parent_id")
