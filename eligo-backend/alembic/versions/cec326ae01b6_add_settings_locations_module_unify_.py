"""add_settings_locations_module_unify_location

Revision ID: cec326ae01b6
Revises: e4ae8f9bf31e
Create Date: 2026-08-01 15:44:17.845281

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'cec326ae01b6'
down_revision: Union[str, Sequence[str], None] = 'e4ae8f9bf31e'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # --- Extend the unified `locations` table with full address + fulfillment fields ---
    op.add_column('locations', sa.Column('suite', sa.String(), nullable=True))
    op.add_column('locations', sa.Column('city', sa.String(), nullable=True))
    op.add_column('locations', sa.Column('province', sa.String(), nullable=True))
    op.add_column('locations', sa.Column('country', sa.String(), server_default='Pakistan', nullable=False))
    op.add_column('locations', sa.Column('postal_code', sa.String(), nullable=True))
    op.add_column('locations', sa.Column('phone', sa.String(), nullable=True))
    op.add_column('locations', sa.Column('is_active', sa.Boolean(), server_default=sa.text('true'), nullable=False))
    op.add_column('locations', sa.Column('is_primary', sa.Boolean(), server_default=sa.text('false'), nullable=False))
    op.add_column('locations', sa.Column('fulfills_online_orders', sa.Boolean(), server_default=sa.text('true'), nullable=False))
    op.add_column('locations', sa.Column('allows_local_pickup', sa.Boolean(), server_default=sa.text('false'), nullable=False))
    op.add_column('locations', sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False))

    # --- Migrate fulfillment locations into the unified locations table ---
    op.execute(
        """
        INSERT INTO locations (name, address, suite, city, province, country, postal_code,
                               phone, is_active, is_primary, fulfills_online_orders,
                               allows_local_pickup, created_at, updated_at)
        SELECT name, address, NULL, city, province, country, postal_code,
               phone, is_active, is_primary, true, false, created_at, updated_at
        FROM fulfillment_locations
        """
    )

    # Keep exactly one default location (first primary wins)
    op.execute(
        """
        UPDATE locations SET is_primary = false
        WHERE is_primary = true
          AND id <> (SELECT id FROM locations WHERE is_primary = true ORDER BY id LIMIT 1)
        """
    )

    # --- Drop the now-unified-away fulfillment_locations table ---
    op.drop_index(op.f('ix_fulfillment_locations_id'), table_name='fulfillment_locations')
    op.drop_table('fulfillment_locations')


def downgrade() -> None:
    """Downgrade schema."""
    # --- Recreate fulfillment_locations and move data back ---
    op.create_table('fulfillment_locations',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('name', sa.String(), nullable=False),
    sa.Column('is_primary', sa.Boolean(), nullable=False),
    sa.Column('is_active', sa.Boolean(), nullable=False),
    sa.Column('address', sa.String(), nullable=True),
    sa.Column('city', sa.String(), nullable=True),
    sa.Column('province', sa.String(), nullable=True),
    sa.Column('country', sa.String(), nullable=False),
    sa.Column('postal_code', sa.String(), nullable=True),
    sa.Column('phone', sa.String(), nullable=True),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_fulfillment_locations_id'), 'fulfillment_locations', ['id'], unique=False)

    op.execute(
        """
        INSERT INTO fulfillment_locations (name, is_primary, is_active, address, city, province,
                                           country, postal_code, phone, created_at, updated_at)
        SELECT name, is_primary, is_active, address, city, province,
               country, postal_code, phone, created_at, updated_at
        FROM locations
        """
    )

    op.drop_column('locations', 'updated_at')
    op.drop_column('locations', 'allows_local_pickup')
    op.drop_column('locations', 'fulfills_online_orders')
    op.drop_column('locations', 'is_primary')
    op.drop_column('locations', 'is_active')
    op.drop_column('locations', 'phone')
    op.drop_column('locations', 'postal_code')
    op.drop_column('locations', 'country')
    op.drop_column('locations', 'province')
    op.drop_column('locations', 'city')
    op.drop_column('locations', 'suite')
