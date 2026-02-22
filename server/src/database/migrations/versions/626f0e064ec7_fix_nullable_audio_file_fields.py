"""fix nullable audio file fields

Revision ID: 626f0e064ec7
Revises: 40c21d0ab8a6
Create Date: 2026-02-22 14:47:27.578117

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '626f0e064ec7'
down_revision: Union[str, Sequence[str], None] = '40c21d0ab8a6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass