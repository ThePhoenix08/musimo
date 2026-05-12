"""add separation_status to separation_analysis_records

Revision ID: f0503148a3c1
Revises: 9d41e3193304
Create Date: 2026-05-07 23:05:35.388621

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'f0503148a3c1'
down_revision: Union[str, Sequence[str], None] = '9d41e3193304'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.execute("CREATE TYPE separationstatus AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED')")
    
    op.add_column(
        'separation_analysis_records',
        sa.Column(
            'separation_status',
            sa.Enum('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', name='separationstatus'),
            nullable=False,
            server_default='PENDING',  # prevents failure on existing rows
        )
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('separation_analysis_records', 'separation_status')
    op.execute("DROP TYPE IF EXISTS separationstatus")