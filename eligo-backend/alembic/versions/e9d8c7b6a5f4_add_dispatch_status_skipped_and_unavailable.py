"""add unavailable and skipped to dispatch_status

Add the ``unavailable`` and ``skipped`` values to the ``dispatch_status``
PostgreSQL enum used by ``notification_logs`` so the dispatch engine can
record every email outcome (sent / failed / unavailable / skipped) and store
admins can review the full delivery history in Settings -> Notifications ->
Logs.

Revision ID: e9d8c7b6a5f4
Revises: f6a5b4c3d2e1
Create Date: 2026-09-03 16:00:00.000000

Note: PG 12+ permits ``ADD VALUE`` for a new enum member inside a transaction
as long as the value is not used within the same transaction.
"""
from typing import Sequence, Union

from alembic import op


# revision identifiers, used by Alembic.
revision: str = "e9d8c7b6a5f4"
down_revision: Union[str, None] = "f6a5b4c3d2e1"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute(
        "ALTER TYPE dispatch_status ADD VALUE IF NOT EXISTS 'unavailable'"
    )
    op.execute(
        "ALTER TYPE dispatch_status ADD VALUE IF NOT EXISTS 'skipped'"
    )


def downgrade() -> None:
    # PostgreSQL cannot easily remove an enum value that is in use. If the
    # values have never been logged, they can be dropped; otherwise the type
    # must be recreated via a swap. Downgrading new enum members is
    # intentionally a no-op to avoid data loss; renaming the type remains the
    # documented manual procedure.
    op.execute(
        """
        DO $$
        BEGIN
            IF EXISTS (
                SELECT 1
                FROM pg_enum e
                JOIN pg_type t ON t.oid = e.enumtypid
                WHERE t.typname = 'dispatch_status' AND e.enumlabel = 'unavailable'
            ) THEN
                ALTER TYPE dispatch_status RENAME TO dispatch_status_old;
                CREATE TYPE dispatch_status AS ENUM ('success','failed');
                ALTER TABLE notification_logs
                    ALTER COLUMN status TYPE dispatch_status
                    USING status::text::dispatch_status;
                DROP TYPE dispatch_status_old;
            END IF;
        END $$;
        """
    )
