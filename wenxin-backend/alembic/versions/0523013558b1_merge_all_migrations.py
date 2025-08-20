"""Merge all migrations

Revision ID: 0523013558b1
Revises: add_all_benchmark_columns, add_enhanced_benchmark_fields, add_model_type_fields
Create Date: 2025-08-20 18:57:32.301862

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '0523013558b1'
down_revision: Union[str, Sequence[str], None] = ('add_all_benchmark_columns', 'add_enhanced_benchmark_fields', 'add_model_type_fields')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
