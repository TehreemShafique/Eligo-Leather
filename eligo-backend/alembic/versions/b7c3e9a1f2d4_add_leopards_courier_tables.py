"""add_leopards_courier_tables

Revision ID: b7c3e9a1f2d4
Revises: 95ff2b7210ab
Create Date: 2026-08-11 19:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'b7c3e9a1f2d4'
down_revision: Union[str, Sequence[str], None] = '95ff2b7210ab'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table('leopard_shipments',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('cn_number', sa.String(), nullable=False),
    sa.Column('booked_packet_id', sa.Integer(), nullable=True),
    sa.Column('order_number', sa.String(), nullable=True),
    sa.Column('booking_date', sa.String(), nullable=True),
    sa.Column('weight', sa.String(), nullable=True),
    sa.Column('pieces', sa.Integer(), nullable=True),
    sa.Column('collect_amount', sa.String(), nullable=True),
    sa.Column('destination_city', sa.String(), nullable=True),
    sa.Column('consignee_name', sa.String(), nullable=True),
    sa.Column('consignee_phone', sa.String(), nullable=True),
    sa.Column('consignee_address', sa.Text(), nullable=True),
    sa.Column('invoice_number', sa.String(), nullable=True),
    sa.Column('invoice_date', sa.String(), nullable=True),
    sa.Column('current_status', sa.String(), nullable=True),
    sa.Column('raw_json', sa.Text(), nullable=True),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('cn_number')
    )
    op.create_index(op.f('ix_leopard_shipments_id'), 'leopard_shipments', ['id'], unique=False)
    op.create_index(op.f('ix_leopard_shipments_cn_number'), 'leopard_shipments', ['cn_number'], unique=True)

    op.create_table('leopard_load_sheets',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('challan_no', sa.String(), nullable=False),
    sa.Column('challan_date', sa.String(), nullable=True),
    sa.Column('pickup_date', sa.String(), nullable=True),
    sa.Column('printed_on', sa.String(), nullable=True),
    sa.Column('acc_no', sa.String(), nullable=True),
    sa.Column('company_name', sa.String(), nullable=True),
    sa.Column('handed_over_to_code', sa.String(), nullable=True),
    sa.Column('handed_over_to_name', sa.String(), nullable=True),
    sa.Column('items_json', sa.Text(), nullable=True),
    sa.Column('total_pieces', sa.Integer(), nullable=True),
    sa.Column('total_packets', sa.Integer(), nullable=True),
    sa.Column('total_cod', sa.String(), nullable=True),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('challan_no')
    )
    op.create_index(op.f('ix_leopard_load_sheets_id'), 'leopard_load_sheets', ['id'], unique=False)
    op.create_index(op.f('ix_leopard_load_sheets_challan_no'), 'leopard_load_sheets', ['challan_no'], unique=True)

    op.create_table('leopard_logs',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('order_number', sa.String(), nullable=True),
    sa.Column('log_type', sa.String(), nullable=False),
    sa.Column('status', sa.String(), nullable=False),
    sa.Column('detail', sa.Text(), nullable=True),
    sa.Column('date', sa.String(), nullable=False),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_leopard_logs_id'), 'leopard_logs', ['id'], unique=False)


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index(op.f('ix_leopard_logs_id'), table_name='leopard_logs')
    op.drop_table('leopard_logs')
    op.drop_index(op.f('ix_leopard_load_sheets_challan_no'), table_name='leopard_load_sheets')
    op.drop_index(op.f('ix_leopard_load_sheets_id'), table_name='leopard_load_sheets')
    op.drop_table('leopard_load_sheets')
    op.drop_index(op.f('ix_leopard_shipments_cn_number'), table_name='leopard_shipments')
    op.drop_index(op.f('ix_leopard_shipments_id'), table_name='leopard_shipments')
    op.drop_table('leopard_shipments')
