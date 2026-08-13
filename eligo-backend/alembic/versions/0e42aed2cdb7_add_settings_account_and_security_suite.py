"""add_settings_account_and_security_suite

Revision ID: 0e42aed2cdb7
Revises: 9c6f4e2d7a83
Create Date: 2026-08-03 13:28:36.846976

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '0e42aed2cdb7'
down_revision: Union[str, Sequence[str], None] = '9c6f4e2d7a83'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # --- Admin account profile + personal security tables ---
    op.create_table('user_login_services',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('user_id', sa.Integer(), nullable=False),
    sa.Column('provider', sa.Enum('google', 'apple', name='login_provider'), nullable=False),
    sa.Column('external_id', sa.String(), nullable=False),
    sa.Column('connected_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('user_id', 'provider', name='uq_user_login_services_user_provider')
    )
    op.create_index(op.f('ix_user_login_services_id'), 'user_login_services', ['id'], unique=False)
    op.create_index(op.f('ix_user_login_services_user_id'), 'user_login_services', ['user_id'], unique=False)
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
    op.create_index(op.f('ix_user_passkeys_credential_id'), 'user_passkeys', ['credential_id'], unique=True)
    op.create_index(op.f('ix_user_passkeys_id'), 'user_passkeys', ['id'], unique=False)
    op.create_index(op.f('ix_user_passkeys_user_id'), 'user_passkeys', ['user_id'], unique=False)
    op.create_table('user_recovery_codes',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('user_id', sa.Integer(), nullable=False),
    sa.Column('code_hash', sa.String(), nullable=False),
    sa.Column('is_active', sa.Boolean(), nullable=False),
    sa.Column('used_at', sa.DateTime(timezone=True), nullable=True),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('code_hash')
    )
    op.create_index(op.f('ix_user_recovery_codes_id'), 'user_recovery_codes', ['id'], unique=False)
    op.create_index(op.f('ix_user_recovery_codes_user_id'), 'user_recovery_codes', ['user_id'], unique=False)
    op.create_table('user_sessions',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('user_id', sa.Integer(), nullable=False),
    sa.Column('token_id', sa.String(), nullable=True),
    sa.Column('device_name', sa.String(), nullable=True),
    sa.Column('browser', sa.String(), nullable=True),
    sa.Column('os', sa.String(), nullable=True),
    sa.Column('ip_address', sa.String(), nullable=True),
    sa.Column('location_name', sa.String(), nullable=True),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.Column('last_seen_at', sa.DateTime(timezone=True), nullable=True),
    sa.Column('revoked_at', sa.DateTime(timezone=True), nullable=True),
    sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_user_sessions_id'), 'user_sessions', ['id'], unique=False)
    op.create_index(op.f('ix_user_sessions_token_id'), 'user_sessions', ['token_id'], unique=True)
    op.create_index(op.f('ix_user_sessions_user_id'), 'user_sessions', ['user_id'], unique=False)

    # --- Extend `users` with the admin account profile + security fields ---
    op.add_column('users', sa.Column('first_name', sa.String(), nullable=True))
    op.add_column('users', sa.Column('last_name', sa.String(), nullable=True))
    op.add_column('users', sa.Column('avatar_url', sa.String(), nullable=True))
    op.add_column('users', sa.Column('phone', sa.String(), nullable=True))
    op.add_column('users', sa.Column('email_verified', sa.Boolean(), server_default=sa.text('false'), nullable=False))
    op.add_column('users', sa.Column('secondary_email', sa.String(), nullable=True))
    op.add_column('users', sa.Column('secondary_email_verified', sa.Boolean(), server_default=sa.text('false'), nullable=False))
    op.add_column('users', sa.Column('preferred_language', sa.String(), server_default='en', nullable=False))
    op.add_column('users', sa.Column('regional_format', sa.String(), server_default='en-PK', nullable=False))
    op.add_column('users', sa.Column('timezone', sa.String(), server_default='Asia/Karachi', nullable=False))
    op.add_column('users', sa.Column('password_changed_at', sa.DateTime(timezone=True), nullable=True))
    op.add_column('users', sa.Column('totp_secret', sa.Text(), nullable=True))
    op.add_column('users', sa.Column('totp_enabled', sa.Boolean(), server_default=sa.text('false'), nullable=False))
    op.add_column('users', sa.Column('recovery_codes_last_generated_at', sa.DateTime(timezone=True), nullable=True))


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('users', 'recovery_codes_last_generated_at')
    op.drop_column('users', 'totp_enabled')
    op.drop_column('users', 'totp_secret')
    op.drop_column('users', 'password_changed_at')
    op.drop_column('users', 'timezone')
    op.drop_column('users', 'regional_format')
    op.drop_column('users', 'preferred_language')
    op.drop_column('users', 'secondary_email_verified')
    op.drop_column('users', 'secondary_email')
    op.drop_column('users', 'email_verified')
    op.drop_column('users', 'phone')
    op.drop_column('users', 'avatar_url')
    op.drop_column('users', 'last_name')
    op.drop_column('users', 'first_name')
    op.drop_index(op.f('ix_user_sessions_user_id'), table_name='user_sessions')
    op.drop_index(op.f('ix_user_sessions_token_id'), table_name='user_sessions')
    op.drop_index(op.f('ix_user_sessions_id'), table_name='user_sessions')
    op.drop_table('user_sessions')
    op.drop_index(op.f('ix_user_recovery_codes_user_id'), table_name='user_recovery_codes')
    op.drop_index(op.f('ix_user_recovery_codes_id'), table_name='user_recovery_codes')
    op.drop_table('user_recovery_codes')
    op.drop_index(op.f('ix_user_passkeys_user_id'), table_name='user_passkeys')
    op.drop_index(op.f('ix_user_passkeys_id'), table_name='user_passkeys')
    op.drop_index(op.f('ix_user_passkeys_credential_id'), table_name='user_passkeys')
    op.drop_table('user_passkeys')
    op.drop_index(op.f('ix_user_login_services_user_id'), table_name='user_login_services')
    op.drop_index(op.f('ix_user_login_services_id'), table_name='user_login_services')
    op.drop_table('user_login_services')
