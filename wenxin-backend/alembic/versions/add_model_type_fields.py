"""Add model type and ranking fields

Revision ID: add_model_type_fields
Revises: fix_missing_columns
Create Date: 2025-08-18 19:45:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'add_model_type_fields'
down_revision: Union[str, Sequence[str], None] = 'fix_missing_columns'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add model_type, model_tier, llm_rank, and image_rank columns."""
    # Get database connection
    bind = op.get_bind()
    
    # Define columns that should exist
    required_columns = [
        ('model_type', sa.String(20)),  # llm, image, multimodal
        ('model_tier', sa.String(20)),  # flagship, professional, efficient, lightweight
        ('llm_rank', sa.Integer()),
        ('image_rank', sa.Integer())
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
                nullable=True
            ))
        else:
            print(f"Column {col_name} already exists, skipping")


def downgrade() -> None:
    """Remove the model type and ranking columns."""
    op.drop_column('ai_models', 'image_rank')
    op.drop_column('ai_models', 'llm_rank')
    op.drop_column('ai_models', 'model_tier')
    op.drop_column('ai_models', 'model_type')