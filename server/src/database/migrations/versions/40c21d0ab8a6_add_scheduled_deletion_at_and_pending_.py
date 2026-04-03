"""add_scheduled_deletion_at_and_pending_deletion_status

Revision ID: 40c21d0ab8a6
Revises: 363ff2019254
Create Date: 2026-02-18 14:17:51.514663

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "40c21d0ab8a6"
down_revision: Union[str, Sequence[str], None] = "363ff2019254"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:

    # KEEP only this ↓
    op.add_column(
        "audio_files",
        sa.Column("scheduled_deletion_at", sa.DateTime(timezone=True), nullable=True),
    )


def downgrade() -> None:

    # KEEP only this ↓
    op.drop_column("audio_files", "scheduled_deletion_at")
