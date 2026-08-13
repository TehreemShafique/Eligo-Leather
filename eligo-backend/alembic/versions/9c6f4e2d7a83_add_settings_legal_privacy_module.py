"""add_settings_legal_privacy_module

Revision ID: 9c6f4e2d7a83
Revises: 3b8d2c4e5f01
Create Date: 2026-08-01 20:15:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '9c6f4e2d7a83'
down_revision: Union[str, Sequence[str], None] = '3b8d2c4e5f01'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table('store_policies',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('policy_type', sa.Enum('privacy_policy', 'refund_policy', 'terms_of_service', 'shipping_policy', 'legal_notice', name='policy_type'), nullable=False),
    sa.Column('title', sa.String(), nullable=False),
    sa.Column('content', sa.Text(), nullable=False),
    sa.Column('is_automated', sa.Boolean(), nullable=False),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('policy_type')
    )
    op.create_index(op.f('ix_store_policies_id'), 'store_policies', ['id'], unique=False)
    op.create_index(op.f('ix_store_policies_policy_type'), 'store_policies', ['policy_type'], unique=True)

    op.create_table('store_privacy_settings',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('cookie_banner_enabled', sa.Boolean(), nullable=False),
    sa.Column('cookie_banner_theme', sa.Enum('light', 'dark', 'custom', name='cookie_banner_theme'), nullable=False),
    sa.Column('cookie_banner_position', sa.Enum('center', 'bottom_center', 'bottom_left', 'bottom_right', 'bottom_full', name='cookie_banner_position'), nullable=False),
    sa.Column('show_in_checkout', sa.Boolean(), nullable=False),
    sa.Column('network_intelligence_enabled', sa.Boolean(), nullable=False),
    sa.Column('opt_out_link_enabled', sa.Boolean(), nullable=False),
    sa.Column('opt_out_menu_target', sa.String(), nullable=True),
    sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.PrimaryKeyConstraint('id')
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_table('store_privacy_settings')
    sa.Enum(name='cookie_banner_position').drop(op.get_bind(), checkfirst=True)
    sa.Enum(name='cookie_banner_theme').drop(op.get_bind(), checkfirst=True)
    op.drop_index(op.f('ix_store_policies_policy_type'), table_name='store_policies')
    op.drop_index(op.f('ix_store_policies_id'), table_name='store_policies')
    op.drop_table('store_policies')
    sa.Enum(name='policy_type').drop(op.get_bind(), checkfirst=True)
