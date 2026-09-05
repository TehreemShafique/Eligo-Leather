"""add metaobject definition fields and entry values

Revision ID: c9d0e1f2a3b4
Revises: b8d2f6a0c4e7
Create Date: 2026-08-26

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "c9d0e1f2a3b4"
down_revision: Union[str, Sequence[str], None] = "b8d2f6a0c4e7"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create the new enum type for definition status
    definition_status_enum = sa.Enum(
        "active", "draft",
        name="metaobject_definition_status",
    )
    definition_status_enum.create(op.get_bind(), checkfirst=True)

    # Also create entry status enum if it doesn't exist yet
    entry_status_enum = sa.Enum(
        "active", "draft",
        name="metaobject_entry_status",
    )
    entry_status_enum.create(op.get_bind(), checkfirst=True)

    # Add new columns to metaobject_definitions
    op.add_column(
        "metaobject_definitions",
        sa.Column("handle", sa.String(), nullable=True, unique=True),
    )
    op.add_column(
        "metaobject_definitions",
        sa.Column("description", sa.Text(), nullable=True),
    )
    op.add_column(
        "metaobject_definitions",
        sa.Column(
            "status",
            sa.Enum("active", "draft", name="metaobject_definition_status"),
            nullable=False,
            server_default="active",
        ),
    )
    op.add_column(
        "metaobject_definitions",
        sa.Column("publish_as_web_pages", sa.Boolean(), nullable=False, server_default=sa.text("false")),
    )
    op.create_index(
        "ix_metaobject_definitions_handle",
        "metaobject_definitions",
        ["handle"],
    )

    # Create metaobject_definition_fields table
    op.create_table(
        "metaobject_definition_fields",
        sa.Column("id", sa.Integer(), primary_key=True, index=True),
        sa.Column(
            "definition_id",
            sa.Integer(),
            sa.ForeignKey("metaobject_definitions.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("label", sa.String(), nullable=False),
        sa.Column("field_type", sa.String(), nullable=False),
        sa.Column("cardinality", sa.String(), nullable=False, server_default="one"),
        sa.Column("required", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("is_display_name", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("is_filterable", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("position", sa.Integer(), nullable=False, server_default=sa.text("0")),
        sa.Column("config", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True, onupdate=sa.func.now()),
    )
    op.create_index(
        "ix_metaobject_definition_fields_definition_id",
        "metaobject_definition_fields",
        ["definition_id"],
    )
    op.create_index(
        "ix_metaobject_definition_fields_position",
        "metaobject_definition_fields",
        ["position"],
    )

    # Remove old 'fields' text column from metaobject_entries
    op.drop_column("metaobject_entries", "fields")

    # Create metaobject_entry_values table
    op.create_table(
        "metaobject_entry_values",
        sa.Column("id", sa.Integer(), primary_key=True, index=True),
        sa.Column(
            "entry_id",
            sa.Integer(),
            sa.ForeignKey("metaobject_entries.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "field_id",
            sa.Integer(),
            sa.ForeignKey("metaobject_definition_fields.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("value", sa.Text(), nullable=True),
        sa.Column("reference_id", sa.Integer(), nullable=True),
        sa.Column("reference_type", sa.String(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True, onupdate=sa.func.now()),
    )
    op.create_index(
        "ix_metaobject_entry_values_entry_id",
        "metaobject_entry_values",
        ["entry_id"],
    )
    op.create_index(
        "ix_metaobject_entry_values_field_id",
        "metaobject_entry_values",
        ["field_id"],
    )


def downgrade() -> None:
    op.drop_table("metaobject_entry_values")
    op.add_column(
        "metaobject_entries",
        sa.Column("fields", sa.Text(), nullable=True),
    )
    op.drop_table("metaobject_definition_fields")
    op.drop_index("ix_metaobject_definitions_handle", "metaobject_definitions")
    op.drop_column("metaobject_definitions", "publish_as_web_pages")
    op.drop_column("metaobject_definitions", "status")
    op.drop_column("metaobject_definitions", "description")
    op.drop_column("metaobject_definitions", "handle")
    sa.Enum(name="metaobject_entry_status").drop(op.get_bind(), checkfirst=True)
    sa.Enum(name="metaobject_definition_status").drop(op.get_bind(), checkfirst=True)
