"""add blog post seo focus keyword and canonical url

Revision ID: c3f4a5b6d7e8
Revises: 9a1b2c3d4e5f
Create Date: 2026-08-28 10:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "c3f4a5b6d7e8"
down_revision: Union[str, Sequence[str], None] = "9a1b2c3d4e5f"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add SEO focus keyword and canonical URL columns to blog_posts."""
    op.add_column("blog_posts", sa.Column("seo_keyword", sa.String(), nullable=True))
    op.add_column("blog_posts", sa.Column("seo_canonical_url", sa.String(), nullable=True))


def downgrade() -> None:
    """Remove SEO focus keyword and canonical URL columns from blog_posts."""
    op.drop_column("blog_posts", "seo_canonical_url")
    op.drop_column("blog_posts", "seo_keyword")
