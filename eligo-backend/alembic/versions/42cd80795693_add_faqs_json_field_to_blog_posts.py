"""add faqs json field to blog_posts

Revision ID: 42cd80795693
Revises: b7c3e9a1f2d4
Create Date: 2026-08-19 19:48:32.243261

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '42cd80795693'
down_revision: Union[str, Sequence[str], None] = 'b7c3e9a1f2d4'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add faqs JSON text column to blog_posts."""
    op.add_column('blog_posts', sa.Column('faqs', sa.Text(), nullable=True))


def downgrade() -> None:
    """Remove faqs column from blog_posts."""
    op.drop_column('blog_posts', 'faqs')
