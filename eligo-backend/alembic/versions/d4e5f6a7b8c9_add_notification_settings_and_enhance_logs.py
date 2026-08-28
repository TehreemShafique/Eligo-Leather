"""add notification settings and enhance logs

Revision ID: d4e5f6a7b8c9
Revises: c9d0e1f2a3b4
Create Date: 2026-08-26

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "d4e5f6a7b8c9"
down_revision: Union[str, None] = "c9d0e1f2a3b4"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "notification_settings",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("notification_type", sa.String(), nullable=False, unique=True, index=True),
        sa.Column("enabled", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), onupdate=sa.func.now()),
    )

    op.add_column(
        "notification_logs",
        sa.Column("customer_id", sa.Integer(), sa.ForeignKey("customers.id", ondelete="SET NULL"), nullable=True),
    )
    op.add_column(
        "notification_logs",
        sa.Column("order_id", sa.Integer(), sa.ForeignKey("orders.id", ondelete="SET NULL"), nullable=True),
    )
    op.add_column(
        "notification_logs",
        sa.Column("template_code", sa.String(), nullable=True),
    )
    op.add_column(
        "notification_logs",
        sa.Column("provider", sa.String(), nullable=True),
    )
    op.add_column(
        "notification_logs",
        sa.Column("provider_message_id", sa.String(), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("notification_logs", "provider_message_id")
    op.drop_column("notification_logs", "provider")
    op.drop_column("notification_logs", "template_code")
    op.drop_column("notification_logs", "order_id")
    op.drop_column("notification_logs", "customer_id")
    op.drop_table("notification_settings")
