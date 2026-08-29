"""add metaobject entry code and variant link

Adds ``code`` to ``metaobject_entries``: a stable, user-editable SKU token
(independent of ``display_name``, e.g. "RED") used to generate product variant
SKUs (base SKU + "-" + code). Also adds ``product_variants.metaobject_entry_id``
so each variant can reference the reusable metaobject entry it came from.

Revision ID: dc5e6f7a8b9c
Revises: e7f2a3b4c5d6
Create Date: 2026-08-29 05:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "dc5e6f7a8b9c"
down_revision: Union[str, None] = "e7f2a3b4c5d6"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("metaobject_entries", sa.Column("code", sa.String(), nullable=True))
    op.create_index(
        "ix_metaobject_entries_code", "metaobject_entries", ["code"],
    )

    op.add_column(
        "product_variants",
        sa.Column("metaobject_entry_id", sa.Integer(), nullable=True),
    )
    op.create_index(
        "ix_product_variants_metaobject_entry_id",
        "product_variants", ["metaobject_entry_id"],
    )
    op.create_foreign_key(
        "fk_product_variants_metaobject_entry_id_metaobject_entries",
        "product_variants", "metaobject_entries",
        ["metaobject_entry_id"], ["id"], ondelete="SET NULL",
    )


def downgrade() -> None:
    op.drop_constraint(
        "fk_product_variants_metaobject_entry_id_metaobject_entries",
        "product_variants", type_="foreignkey",
    )
    op.drop_index(
        "ix_product_variants_metaobject_entry_id", table_name="product_variants",
    )
    op.drop_column("product_variants", "metaobject_entry_id")

    op.drop_index("ix_metaobject_entries_code", table_name="metaobject_entries")
    op.drop_column("metaobject_entries", "code")