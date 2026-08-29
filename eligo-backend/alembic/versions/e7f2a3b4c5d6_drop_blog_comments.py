"""drop blog_comments

Removes the ``blog_comments`` table (and its indexes) now that the "Leave a
comment" feature has been removed from the storefront and API.

Revision ID: e7f2a3b4c5d6
Revises: e6f0d1c2a3b4
Create Date: 2026-08-29 05:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "e7f2a3b4c5d6"
down_revision: Union[str, None] = "e6f0d1c2a3b4"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.drop_index("ix_blog_comments_status", table_name="blog_comments")
    op.drop_index("ix_blog_comments_post_id", table_name="blog_comments")
    op.drop_index(op.f("ix_blog_comments_id"), table_name="blog_comments")
    op.drop_table("blog_comments")


def downgrade() -> None:
    op.create_table(
        "blog_comments",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("post_id", sa.Integer(), nullable=False),
        sa.Column("author_name", sa.String(), nullable=False),
        sa.Column("author_email", sa.String(), nullable=False),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column("status", sa.Enum("pending", "approved", "spam", name="blog_comment_status"), nullable=False),
        sa.ForeignKeyConstraint(["post_id"], ["blog_posts.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_blog_comments_status", "blog_comments", ["status"], unique=False)
    op.create_index("ix_blog_comments_post_id", "blog_comments", ["post_id"], unique=False)
    op.create_index(op.f("ix_blog_comments_id"), "blog_comments", ["id"], unique=False)
