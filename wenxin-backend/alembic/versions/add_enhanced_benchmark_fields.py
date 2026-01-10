"""Add enhanced benchmark fields for v2 scoring system

Revision ID: add_enhanced_benchmark_fields
Revises: fix_missing_columns
Create Date: 2025-08-19 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'add_enhanced_benchmark_fields'
down_revision = 'fix_missing_columns'
branch_labels = None
depends_on = None


def upgrade():
    """Add new columns for enhanced benchmark scoring"""
    
    # Get existing columns to avoid adding duplicates
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    existing_columns = [col['name'] for col in inspector.get_columns('ai_models')]
    
    # Add new columns if they don't exist
    new_columns = [
        ('benchmark_responses', sa.JSON(), '{}'),
        ('scoring_details', sa.JSON(), '{}'),
        ('score_highlights', sa.JSON(), '[]'),
        ('score_weaknesses', sa.JSON(), '[]'),
        ('improvement_suggestions', sa.Text(), None),
    ]
    
    for col_name, col_type, default_value in new_columns:
        if col_name not in existing_columns:
            op.add_column('ai_models', sa.Column(col_name, col_type, nullable=True))
            # Set default value for existing rows
            if default_value is not None:
                if isinstance(default_value, str):
                    op.execute(f"UPDATE ai_models SET {col_name} = '{default_value}' WHERE {col_name} IS NULL")
                else:
                    op.execute(f"UPDATE ai_models SET {col_name} = NULL WHERE {col_name} IS NULL")


def downgrade():
    """Remove enhanced benchmark fields"""
    op.drop_column('ai_models', 'improvement_suggestions')
    op.drop_column('ai_models', 'score_weaknesses')
    op.drop_column('ai_models', 'score_highlights')
    op.drop_column('ai_models', 'scoring_details')
    op.drop_column('ai_models', 'benchmark_responses')