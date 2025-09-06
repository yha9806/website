"""add_vulca_fields_to_ai_models

Revision ID: f0ec7cd5469e
Revises: 0523013558b1
Create Date: 2025-09-05 20:17:17.422421

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'f0ec7cd5469e'
down_revision: Union[str, Sequence[str], None] = '0523013558b1'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add VULCA fields to ai_models table."""
    # Add VULCA-related columns to ai_models table
    op.add_column('ai_models', sa.Column('vulca_scores_47d', sa.JSON(), nullable=True))
    op.add_column('ai_models', sa.Column('vulca_cultural_perspectives', sa.JSON(), nullable=True))
    op.add_column('ai_models', sa.Column('vulca_evaluation_date', sa.DateTime(timezone=True), nullable=True))
    op.add_column('ai_models', sa.Column('vulca_sync_status', sa.String(20), nullable=True, server_default='pending'))


def downgrade() -> None:
    """Remove VULCA fields from ai_models table."""
    # Remove VULCA-related columns
    op.drop_column('ai_models', 'vulca_sync_status')
    op.drop_column('ai_models', 'vulca_evaluation_date')
    op.drop_column('ai_models', 'vulca_cultural_perspectives')
    op.drop_column('ai_models', 'vulca_scores_47d')
