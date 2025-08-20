"""Add all benchmark-related columns

Revision ID: add_all_benchmark_columns
Revises: fix_missing_columns
Create Date: 2025-08-20 17:55:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'add_all_benchmark_columns'
down_revision = 'fix_missing_columns'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add benchmark_responses column if it doesn't exist
    op.execute("""
        DO $$
        BEGIN
            IF NOT EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_name='ai_models' AND column_name='benchmark_responses'
            ) THEN
                ALTER TABLE ai_models ADD COLUMN benchmark_responses JSON;
            END IF;
        END $$;
    """)
    
    # Add scoring_details column if it doesn't exist
    op.execute("""
        DO $$
        BEGIN
            IF NOT EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_name='ai_models' AND column_name='scoring_details'
            ) THEN
                ALTER TABLE ai_models ADD COLUMN scoring_details JSON;
            END IF;
        END $$;
    """)
    
    # Add score_highlights column if it doesn't exist
    op.execute("""
        DO $$
        BEGIN
            IF NOT EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_name='ai_models' AND column_name='score_highlights'
            ) THEN
                ALTER TABLE ai_models ADD COLUMN score_highlights TEXT[];
            END IF;
        END $$;
    """)
    
    # Add score_weaknesses column if it doesn't exist
    op.execute("""
        DO $$
        BEGIN
            IF NOT EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_name='ai_models' AND column_name='score_weaknesses'
            ) THEN
                ALTER TABLE ai_models ADD COLUMN score_weaknesses TEXT[];
            END IF;
        END $$;
    """)
    
    # Add improvement_suggestions column if it doesn't exist
    op.execute("""
        DO $$
        BEGIN
            IF NOT EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_name='ai_models' AND column_name='improvement_suggestions'
            ) THEN
                ALTER TABLE ai_models ADD COLUMN improvement_suggestions TEXT[];
            END IF;
        END $$;
    """)
    
    # Add model_type column if it doesn't exist
    op.execute("""
        DO $$
        BEGIN
            IF NOT EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_name='ai_models' AND column_name='model_type'
            ) THEN
                ALTER TABLE ai_models ADD COLUMN model_type VARCHAR(50);
            END IF;
        END $$;
    """)
    
    # Add model_tier column if it doesn't exist
    op.execute("""
        DO $$
        BEGIN
            IF NOT EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_name='ai_models' AND column_name='model_tier'
            ) THEN
                ALTER TABLE ai_models ADD COLUMN model_tier VARCHAR(20);
            END IF;
        END $$;
    """)
    
    # Add llm_rank column if it doesn't exist
    op.execute("""
        DO $$
        BEGIN
            IF NOT EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_name='ai_models' AND column_name='llm_rank'
            ) THEN
                ALTER TABLE ai_models ADD COLUMN llm_rank INTEGER;
            END IF;
        END $$;
    """)
    
    # Add image_rank column if it doesn't exist
    op.execute("""
        DO $$
        BEGIN
            IF NOT EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_name='ai_models' AND column_name='image_rank'
            ) THEN
                ALTER TABLE ai_models ADD COLUMN image_rank INTEGER;
            END IF;
        END $$;
    """)


def downgrade() -> None:
    # Note: We don't drop columns in downgrade to avoid data loss
    pass