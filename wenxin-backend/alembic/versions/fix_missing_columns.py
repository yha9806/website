"""Fix missing score columns in production

Revision ID: fix_missing_columns
Revises: 12aa0300721d
Create Date: 2025-08-18 16:50:00.000000

This is a repair migration that ensures score columns exist,
regardless of the current database state.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'fix_missing_columns'
down_revision: Union[str, Sequence[str], None] = '12aa0300721d'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add missing score columns if they don't exist."""
    # Get database connection
    bind = op.get_bind()
    
    # Define columns that should exist
    required_columns = [
        ('rhythm_score', sa.Float()),
        ('composition_score', sa.Float()),
        ('narrative_score', sa.Float()),
        ('emotion_score', sa.Float()),
        ('creativity_score', sa.Float()),
        ('cultural_score', sa.Float())
    ]
    
    # Check existing columns
    inspector = sa.inspect(bind)
    existing_columns = [col['name'] for col in inspector.get_columns('ai_models')]
    
    # Add missing columns
    for col_name, col_type in required_columns:
        if col_name not in existing_columns:
            print(f"Adding missing column: {col_name}")
            op.add_column('ai_models', sa.Column(
                col_name, 
                col_type, 
                nullable=True, 
                server_default='0.0'
            ))
        else:
            print(f"Column {col_name} already exists, skipping")


def downgrade() -> None:
    """Remove the score columns."""
    # Only remove columns if they were added by this migration
    # In practice, we don't want to remove these columns
    pass