"""drop_passkeys_and_enforce_single_admin

Revision ID: a3b9c4d5e6f7
Revises: 0e42aed2cdb7
Create Date: 2026-08-03 14:05:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a3b9c4d5e6f7'
down_revision: Union[str, Sequence[str], None] = '0e42aed2cdb7'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # The passkey (WebAuthn) concept is removed from the admin account.
    op.drop_index(op.f('ix_user_passkeys_credential_id'), table_name='user_passkeys')
    op.drop_index(op.f('ix_user_passkeys_id'), table_name='user_passkeys')
    op.drop_index(op.f('ix_user_passkeys_user_id'), table_name='user_passkeys')
    op.drop_table('user_passkeys')

    # Exactly one admin row may exist. Postgres partial unique index: only
    # rows where `is_admin = true` participate, and uniqueness over the
    # constant `is_admin` allows at most one such row.
    op.create_index(
        'uq_users_single_admin',
        'users',
        ['is_admin'],
        unique=True,
        postgresql_where=sa.text('is_admin = true'),
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index('uq_users_single_admin', table_name='users')
    op.create_table('user_passkeys',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('user_id', sa.Integer(), nullable=False),
    sa.Column('name', sa.String(), nullable=False),
    sa.Column('credential_id', sa.String(), nullable=False),
    sa.Column('public_key', sa.Text(), nullable=False),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.Column('last_used_at', sa.DateTime(timezone=True), nullable=True),
    sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_user_passkeys_user_id'), 'user_passkeys', ['user_id'], unique=False)
    op.create_index(op.f('ix_user_passkeys_id'), 'user_passkeys', ['id'], unique=False)
    op.create_index(op.f('ix_user_passkeys_credential_id'), 'user_passkeys', ['credential_id'], unique=True)
