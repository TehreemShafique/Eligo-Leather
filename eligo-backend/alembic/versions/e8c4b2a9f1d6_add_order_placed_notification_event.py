"""add order_placed to notification_event_type

Add the ``order_placed`` value to the ``notification_event_type`` PostgreSQL
enum so new storefront orders can dispatch a distinct "order placed" email
immediately, independent of the manual ``order_confirmation`` email.

Revision ID: e8c4b2a9f1d6
Revises: f7d3a9b1c2e4
Create Date: 2026-09-02 13:00:00.000000

Note: The native enum value is added with ``ADD VALUE IF NOT EXISTS`` before
any rule row referencing it is inserted by the application's seed routine.
PG 12+ permits DDL for a new enum value inside a transaction as long as the
value is not used within the same transaction.

"""
from typing import Sequence, Union

from alembic import op


# revision identifiers, used by Alembic.
revision: str = "e8c4b2a9f1d6"
down_revision: Union[str, None] = "f7d3a9b1c2e4"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute(
        "ALTER TYPE notification_event_type ADD VALUE IF NOT EXISTS 'order_placed'"
    )


def downgrade() -> None:
    # PostgreSQL cannot easily remove an enum value that is in use. If the
    # order_placed value has never been used, it can be dropped; otherwise the
    # value must be recreated via a type swap. Downgrading an enum member is
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
                WHERE t.typname = 'notification_event_type'
                  AND e.enumlabel = 'order_placed'
            ) AND NOT EXISTS (
                SELECT 1
                FROM notification_dispatch_rules
                WHERE event_type = 'order_placed'
            ) THEN
                ALTER TYPE notification_event_type RENAME TO notification_event_type_old;
                CREATE TYPE notification_event_type AS ENUM (
                    'order_confirmation','order_shipped','order_delivered',
                    'order_cancelled','return_requested','abandoned_checkout',
                    'password_reset','low_stock','admin_notification'
                );
                ALTER TABLE notification_dispatch_rules
                    ALTER COLUMN event_type TYPE notification_event_type
                    USING event_type::text::notification_event_type;
                DROP TYPE notification_event_type_old;
            END IF;
        END $$;
        """
    )
