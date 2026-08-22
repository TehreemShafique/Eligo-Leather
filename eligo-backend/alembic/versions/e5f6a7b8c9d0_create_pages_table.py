"""create pages table

Revision ID: e5f6a7b8c9d0
Revises: f1a2b3c4d5e6
Create Date: 2026-08-22

The Page model (app.modules.content.model.Page) existed without a matching
migration, so every GET /pages/* request failed with a database error on
environments provisioned purely through Alembic.
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op


revision: str = "e5f6a7b8c9d0"
down_revision: Union[str, Sequence[str], None] = "f1a2b3c4d5e6"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "pages",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("title", sa.String(), nullable=False),
        sa.Column("handle", sa.String(), nullable=False),
        sa.Column("content", sa.Text(), nullable=True),
        sa.Column(
            "visibility", sa.String(), server_default="Visible", nullable=False
        ),
        sa.Column(
            "template",
            sa.String(),
            server_default="Default page",
            nullable=True,
        ),
        sa.Column("metafields", sa.Text(), nullable=True),
        sa.Column("seo_title", sa.String(), nullable=True),
        sa.Column("seo_description", sa.Text(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("handle"),
    )
    op.create_index("ix_pages_handle", "pages", ["handle"])
    op.create_index("ix_pages_visibility", "pages", ["visibility"])

    op.execute(
        """
        INSERT INTO pages (title, handle, visibility, template, content)
        VALUES (
            'About Us',
            'about-us',
            'Visible',
            'Default page',
            '<p>Eligo Leather crafts premium handmade leather goods - wallets, belts, keychains and cases - built to last and age beautifully.</p>'
        )
        ON CONFLICT (handle) DO NOTHING
        """
    )


def downgrade() -> None:
    op.drop_index("ix_pages_visibility", table_name="pages")
    op.drop_index("ix_pages_handle", table_name="pages")
    op.drop_table("pages")
