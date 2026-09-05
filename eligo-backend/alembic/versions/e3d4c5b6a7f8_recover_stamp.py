"""Recover lost Neon DB stamp

This is a no-op recovery migration that bridges the gap between the
tracked revision a4b8c2d1e9f3 and the Neon database's existing
alembic_version stamp e3d4c5b6a7f8 (which was applied out-of-band and
never existed in this repository's migration history).

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "e3d4c5b6a7f8"
down_revision: Union[str, None] = "a4b8c2d1e9f3"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # No-op: schema already matches a4b8c2d1e9f3 state
    pass


def downgrade() -> None:
    # No-op: nothing to revert
    pass