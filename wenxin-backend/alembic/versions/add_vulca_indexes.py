"""Add VULCA performance indexes

Revision ID: add_vulca_indexes
Revises: f0ec7cd5469e
Create Date: 2025-09-06 22:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'add_vulca_indexes'
down_revision: Union[str, None] = 'f0ec7cd5469e'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create indexes for VULCA sync and date queries
    op.create_index('idx_vulca_sync', 'ai_models', ['vulca_sync_status'])
    op.create_index('idx_vulca_date', 'ai_models', ['vulca_evaluation_date'])
    
    # Create composite index for efficient filtering
    op.create_index('idx_vulca_sync_date', 'ai_models', ['vulca_sync_status', 'vulca_evaluation_date'])
    
    # Index for model type and VULCA status
    op.create_index('idx_model_type_vulca', 'ai_models', ['model_type', 'vulca_sync_status'])


def downgrade() -> None:
    # Drop all indexes
    op.drop_index('idx_model_type_vulca', 'ai_models')
    op.drop_index('idx_vulca_sync_date', 'ai_models')
    op.drop_index('idx_vulca_date', 'ai_models')
    op.drop_index('idx_vulca_sync', 'ai_models')