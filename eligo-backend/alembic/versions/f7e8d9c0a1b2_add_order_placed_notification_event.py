"""add order_placed notification event

Revision ID: f7e8d9c0a1b2
Revises: a4b8c2d1e9f3
Create Date: 2026-09-02

"""
from typing import Sequence, Union

from alembic import op


# revision identifiers, used by Alembic.
revision: str = "f7e8d9c0a1b2"
down_revision: Union[str, Sequence[str], None] = "a4b8c2d1e9f3"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add the new `order_placed` value to the notification event enum."""
    # PostgreSQL supports adding enum values with ALTER TYPE ... ADD VALUE.
    # `IF NOT EXISTS` keeps it idempotent for an already-upgraded DB.
    op.execute("ALTER TYPE notification_event_type ADD VALUE IF NOT EXISTS 'order_placed'")


def downgrade() -> None:
    """PostgreSQL cannot remove an enum value in-place once it has been added.

    New rows referencing 'order_placed' would break if the value were dropped,
    so downgrade is intentionally a no-op. The app code path for the
    'order_placed' event simply stops dispatching when rolled back.
    """
    pass
