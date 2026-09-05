"""add order_out_for_delivery to notification_event_type

Add the ``order_out_for_delivery`` value to the ``notification_event_type``
PostgreSQL enum so the Leopards tracking sync and the manual
``mark-out-for-delivery`` endpoint can dispatch a distinct "out for delivery"
email to the customer.

Revision ID: f6a5b4c3d2e1
Revises: c1d2e3f4a5b6
Create Date: 2026-09-03 15:00:00.000000

Note: The native enum value is added with ``ADD VALUE IF NOT EXISTS`` before
any rule row referencing it is inserted by the application's seed routine.
PG 12+ permits DDL for a new enum value inside a transaction as long as the
value is not used within the same transaction.
"""
from typing import Sequence, Union

from alembic import op


# revision identifiers, used by Alembic.
revision: str = "f6a5b4c3d2e1"
down_revision: Union[str, None] = "c1d2e3f4a5b6"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute(
        "ALTER TYPE notification_event_type ADD VALUE IF NOT EXISTS 'order_out_for_delivery'"
    )


def downgrade() -> None:
    # PostgreSQL cannot easily remove an enum value that is in use. If the
    # order_out_for_delivery value has never been used, it can be dropped;
    # otherwise the value must be recreated via a type swap. Downgrading an
    # enum member is intentionally a no-op to avoid data loss; renaming the
    # type remains the documented manual procedure.
    op.execute(
        """
        DO $$
        BEGIN
            IF EXISTS (
                SELECT 1
                FROM pg_enum e
                JOIN pg_type t ON t.oid = e.enumtypid
                WHERE t.typname = 'notification_event_type'
                  AND e.enumlabel = 'order_out_for_delivery'
            ) AND NOT EXISTS (
                SELECT 1
                FROM notification_dispatch_rules
                WHERE event_type = 'order_out_for_delivery'
            ) THEN
                ALTER TYPE notification_event_type RENAME TO notification_event_type_old;
                CREATE TYPE notification_event_type AS ENUM (
                    'order_placed','order_confirmation','order_shipped',
                    'order_delivered','order_cancelled','return_requested',
                    'abandoned_checkout','password_reset','low_stock',
                    'discount_offer','admin_notification'
                );
                ALTER TABLE notification_dispatch_rules
                    ALTER COLUMN event_type TYPE notification_event_type
                    USING event_type::text::notification_event_type;
                DROP TYPE notification_event_type_old;
            END IF;
        END $$;
        """
    )
