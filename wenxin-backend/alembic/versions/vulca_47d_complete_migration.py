"""Add VULCA 47D complete tables and UUID migration

Revision ID: vulca_47d_complete
Revises: add_vulca_indexes
Create Date: 2024-12-10 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql
import uuid

# revision identifiers, used by Alembic.
revision = 'vulca_47d_complete'
down_revision = 'add_vulca_indexes'
branch_labels = None
depends_on = None


def upgrade():
    """
    Complete VULCA 47D migration including:
    1. UUID columns for all tables
    2. VULCA dimension tables
    3. VULCA score tables
    4. Cultural perspective tables
    5. Algorithm version management
    6. Indexes for performance
    """
    
    # 1. Add UUID columns to existing tables (dual ID support)
    op.add_column('ai_models', 
        sa.Column('uuid', sa.String(36), nullable=True, unique=True)
    )
    op.add_column('benchmarks',
        sa.Column('uuid', sa.String(36), nullable=True, unique=True)
    )
    op.add_column('users',
        sa.Column('uuid', sa.String(36), nullable=True, unique=True)
    )
    
    # Generate UUIDs for existing records
    connection = op.get_bind()
    
    # Update ai_models
    result = connection.execute(sa.text("SELECT id FROM ai_models"))
    for row in result:
        new_uuid = str(uuid.uuid4())
        connection.execute(
            sa.text("UPDATE ai_models SET uuid = :uuid WHERE id = :id"),
            {"uuid": new_uuid, "id": row[0]}
        )
    
    # Update benchmarks
    result = connection.execute(sa.text("SELECT id FROM benchmarks"))
    for row in result:
        new_uuid = str(uuid.uuid4())
        connection.execute(
            sa.text("UPDATE benchmarks SET uuid = :uuid WHERE id = :id"),
            {"uuid": new_uuid, "id": row[0]}
        )
    
    # Update users
    result = connection.execute(sa.text("SELECT id FROM users"))
    for row in result:
        new_uuid = str(uuid.uuid4())
        connection.execute(
            sa.text("UPDATE users SET uuid = :uuid WHERE id = :id"),
            {"uuid": new_uuid, "id": row[0]}
        )
    
    # 2. Create VULCA Algorithm Version table
    op.create_table('vulca_algorithm_versions',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('uuid', sa.String(36), nullable=False, unique=True),
        sa.Column('version', sa.String(20), nullable=False, unique=True),
        sa.Column('name', sa.String(100), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False, default=False),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column('config', sa.JSON(), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    
    # 3. Create VULCA Dimensions table
    op.create_table('vulca_dimensions',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('uuid', sa.String(36), nullable=False, unique=True),
        sa.Column('name', sa.String(50), nullable=False),
        sa.Column('display_name', sa.String(100), nullable=False),
        sa.Column('category', sa.String(20), nullable=False),  # cognitive, creative, social
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('weight', sa.Float(), nullable=False, default=1.0),
        sa.Column('cultural_sensitivity', sa.Float(), nullable=False, default=0.5),
        sa.Column('tier_required', sa.String(20), nullable=False, default='free'),  # free, paid, enterprise
        sa.Column('order_index', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('name')
    )
    
    # 4. Create Cultural Perspectives table
    op.create_table('vulca_cultural_perspectives',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('uuid', sa.String(36), nullable=False, unique=True),
        sa.Column('name', sa.String(50), nullable=False, unique=True),
        sa.Column('display_name', sa.String(100), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('adjustment_factors', sa.JSON(), nullable=False),  # JSON with dimension adjustments
        sa.Column('is_active', sa.Boolean(), nullable=False, default=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.PrimaryKeyConstraint('id')
    )
    
    # 5. Create VULCA Scores table (main evaluation results)
    op.create_table('vulca_scores',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('uuid', sa.String(36), nullable=False, unique=True),
        sa.Column('model_id', sa.Integer(), nullable=False),
        sa.Column('model_uuid', sa.String(36), nullable=True),
        sa.Column('algorithm_version_id', sa.Integer(), nullable=False),
        sa.Column('cultural_perspective_id', sa.Integer(), nullable=True),
        
        # 6D scores (base)
        sa.Column('creativity_6d', sa.Float(), nullable=False),
        sa.Column('technique_6d', sa.Float(), nullable=False),
        sa.Column('emotion_6d', sa.Float(), nullable=False),
        sa.Column('context_6d', sa.Float(), nullable=False),
        sa.Column('innovation_6d', sa.Float(), nullable=False),
        sa.Column('impact_6d', sa.Float(), nullable=False),
        
        # Aggregate scores
        sa.Column('overall_score', sa.Float(), nullable=False),
        sa.Column('cognitive_score', sa.Float(), nullable=True),
        sa.Column('creative_score', sa.Float(), nullable=True),
        sa.Column('social_score', sa.Float(), nullable=True),
        
        # Metadata
        sa.Column('confidence_level', sa.Float(), nullable=True),
        sa.Column('correlation_strength', sa.Float(), nullable=True),
        sa.Column('processing_time_ms', sa.Float(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(), nullable=True, onupdate=sa.func.now()),
        
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['model_id'], ['ai_models.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['algorithm_version_id'], ['vulca_algorithm_versions.id']),
        sa.ForeignKeyConstraint(['cultural_perspective_id'], ['vulca_cultural_perspectives.id'])
    )
    
    # 6. Create VULCA Score Details table (47D breakdown)
    op.create_table('vulca_score_details',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('uuid', sa.String(36), nullable=False, unique=True),
        sa.Column('vulca_score_id', sa.Integer(), nullable=False),
        sa.Column('vulca_score_uuid', sa.String(36), nullable=True),
        sa.Column('dimension_id', sa.Integer(), nullable=False),
        sa.Column('dimension_uuid', sa.String(36), nullable=True),
        sa.Column('score', sa.Float(), nullable=False),
        sa.Column('normalized_score', sa.Float(), nullable=True),
        sa.Column('percentile_rank', sa.Float(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
        
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['vulca_score_id'], ['vulca_scores.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['dimension_id'], ['vulca_dimensions.id']),
        sa.UniqueConstraint('vulca_score_id', 'dimension_id')
    )
    
    # 7. Create VULCA Cache table for performance
    op.create_table('vulca_cache',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('cache_key', sa.String(64), nullable=False, unique=True),
        sa.Column('model_uuid', sa.String(36), nullable=False),
        sa.Column('algorithm_version', sa.String(20), nullable=False),
        sa.Column('cultural_perspective', sa.String(50), nullable=True),
        sa.Column('result_data', sa.JSON(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column('expires_at', sa.DateTime(), nullable=False),
        sa.Column('hit_count', sa.Integer(), nullable=False, default=0),
        
        sa.PrimaryKeyConstraint('id')
    )
    
    # 8. Create indexes for performance
    op.create_index('idx_ai_models_uuid', 'ai_models', ['uuid'])
    op.create_index('idx_benchmarks_uuid', 'benchmarks', ['uuid'])
    op.create_index('idx_users_uuid', 'users', ['uuid'])
    
    op.create_index('idx_vulca_scores_model_id', 'vulca_scores', ['model_id'])
    op.create_index('idx_vulca_scores_model_uuid', 'vulca_scores', ['model_uuid'])
    op.create_index('idx_vulca_scores_algorithm_version', 'vulca_scores', ['algorithm_version_id'])
    op.create_index('idx_vulca_scores_created_at', 'vulca_scores', ['created_at'])
    op.create_index('idx_vulca_scores_overall', 'vulca_scores', ['overall_score'])
    
    op.create_index('idx_vulca_score_details_score_id', 'vulca_score_details', ['vulca_score_id'])
    op.create_index('idx_vulca_score_details_dimension_id', 'vulca_score_details', ['dimension_id'])
    op.create_index('idx_vulca_score_details_score', 'vulca_score_details', ['score'])
    
    op.create_index('idx_vulca_dimensions_category', 'vulca_dimensions', ['category'])
    op.create_index('idx_vulca_dimensions_tier', 'vulca_dimensions', ['tier_required'])
    
    op.create_index('idx_vulca_cache_key', 'vulca_cache', ['cache_key'])
    op.create_index('idx_vulca_cache_model', 'vulca_cache', ['model_uuid'])
    op.create_index('idx_vulca_cache_expires', 'vulca_cache', ['expires_at'])
    
    # 9. Insert default data
    
    # Insert algorithm versions
    connection.execute(sa.text("""
        INSERT INTO vulca_algorithm_versions (uuid, version, name, description, is_active, config)
        VALUES 
        (:uuid1, 'v1.0', 'VULCA Basic', 'Initial 6D to 47D mapping', false, '{}'),
        (:uuid2, 'v2.0', 'VULCA EMNLP2025', 'Advanced correlation-based expansion', true, 
         '{"enable_correlation": true, "cultural_perspectives": true}')
    """), {
        "uuid1": str(uuid.uuid4()),
        "uuid2": str(uuid.uuid4())
    })
    
    # Insert cultural perspectives
    connection.execute(sa.text("""
        INSERT INTO vulca_cultural_perspectives (uuid, name, display_name, description, adjustment_factors)
        VALUES
        (:uuid1, 'western', 'Western', 'Western cultural perspective emphasizing innovation and individual creativity',
         '{"innovation_index": 1.25, "creative_synthesis": 1.20, "logical_reasoning": 1.15}'),
        (:uuid2, 'eastern', 'Eastern', 'Eastern cultural perspective emphasizing harmony and collective wisdom',
         '{"cultural_awareness": 1.30, "social_appropriateness": 1.25, "collaborative_ability": 1.22}'),
        (:uuid3, 'global', 'Global', 'Balanced global perspective',
         '{"diversity_handling": 1.20, "fairness_assessment": 1.18, "ethical_reasoning": 1.15}')
    """), {
        "uuid1": str(uuid.uuid4()),
        "uuid2": str(uuid.uuid4()),
        "uuid3": str(uuid.uuid4())
    })
    
    # Insert all 47 dimensions
    dimensions_data = [
        # Cognitive (16)
        ('logical_reasoning', 'Logical Reasoning', 'cognitive', 0.03, 0.2, 0),
        ('pattern_recognition', 'Pattern Recognition', 'cognitive', 0.025, 0.1, 1),
        ('analytical_depth', 'Analytical Depth', 'cognitive', 0.025, 0.15, 2),
        ('knowledge_integration', 'Knowledge Integration', 'cognitive', 0.02, 0.25, 3),
        ('contextual_understanding', 'Contextual Understanding', 'cognitive', 0.025, 0.4, 4),
        ('abstraction_capability', 'Abstraction Capability', 'cognitive', 0.02, 0.1, 5),
        ('temporal_reasoning', 'Temporal Reasoning', 'cognitive', 0.015, 0.2, 6),
        ('spatial_reasoning', 'Spatial Reasoning', 'cognitive', 0.015, 0.1, 7),
        ('causal_inference', 'Causal Inference', 'cognitive', 0.02, 0.3, 8),
        ('memory_utilization', 'Memory Utilization', 'cognitive', 0.015, 0.1, 9),
        ('attention_focus', 'Attention Focus', 'cognitive', 0.015, 0.15, 10),
        ('cognitive_flexibility', 'Cognitive Flexibility', 'cognitive', 0.02, 0.25, 11),
        ('metacognition', 'Metacognition', 'cognitive', 0.015, 0.2, 12),
        ('problem_decomposition', 'Problem Decomposition', 'cognitive', 0.02, 0.1, 13),
        ('hypothesis_generation', 'Hypothesis Generation', 'cognitive', 0.015, 0.15, 14),
        ('evidence_evaluation', 'Evidence Evaluation', 'cognitive', 0.02, 0.25, 15),
        
        # Creative (16)
        ('creative_synthesis', 'Creative Synthesis', 'creative', 0.025, 0.35, 16),
        ('artistic_expression', 'Artistic Expression', 'creative', 0.02, 0.5, 17),
        ('innovation_index', 'Innovation Index', 'creative', 0.025, 0.3, 18),
        ('narrative_construction', 'Narrative Construction', 'creative', 0.02, 0.4, 19),
        ('metaphorical_thinking', 'Metaphorical Thinking', 'creative', 0.015, 0.45, 20),
        ('imaginative_depth', 'Imaginative Depth', 'creative', 0.02, 0.35, 21),
        ('stylistic_versatility', 'Stylistic Versatility', 'creative', 0.015, 0.4, 22),
        ('conceptual_blending', 'Conceptual Blending', 'creative', 0.015, 0.25, 23),
        ('divergent_thinking', 'Divergent Thinking', 'creative', 0.02, 0.2, 24),
        ('aesthetic_sensitivity', 'Aesthetic Sensitivity', 'creative', 0.015, 0.6, 25),
        ('humor_generation', 'Humor Generation', 'creative', 0.01, 0.7, 26),
        ('emotional_resonance', 'Emotional Resonance', 'creative', 0.02, 0.5, 27),
        ('originality_score', 'Originality Score', 'creative', 0.02, 0.3, 28),
        ('creative_flexibility', 'Creative Flexibility', 'creative', 0.015, 0.35, 29),
        ('symbolic_representation', 'Symbolic Representation', 'creative', 0.015, 0.4, 30),
        ('creative_coherence', 'Creative Coherence', 'creative', 0.015, 0.25, 31),
        
        # Social (15)
        ('cultural_awareness', 'Cultural Awareness', 'social', 0.025, 0.8, 32),
        ('empathy_modeling', 'Empathy Modeling', 'social', 0.02, 0.6, 33),
        ('social_appropriateness', 'Social Appropriateness', 'social', 0.02, 0.7, 34),
        ('communication_clarity', 'Communication Clarity', 'social', 0.025, 0.3, 35),
        ('collaborative_ability', 'Collaborative Ability', 'social', 0.02, 0.4, 36),
        ('ethical_reasoning', 'Ethical Reasoning', 'social', 0.025, 0.65, 37),
        ('perspective_taking', 'Perspective Taking', 'social', 0.02, 0.55, 38),
        ('conflict_resolution', 'Conflict Resolution', 'social', 0.015, 0.5, 39),
        ('emotional_intelligence', 'Emotional Intelligence', 'social', 0.02, 0.6, 40),
        ('social_prediction', 'Social Prediction', 'social', 0.015, 0.45, 41),
        ('trust_building', 'Trust Building', 'social', 0.015, 0.5, 42),
        ('fairness_assessment', 'Fairness Assessment', 'social', 0.02, 0.7, 43),
        ('diversity_handling', 'Diversity Handling', 'social', 0.02, 0.75, 44),
        ('social_impact_awareness', 'Social Impact Awareness', 'social', 0.015, 0.6, 45),
        ('interpersonal_sensitivity', 'Interpersonal Sensitivity', 'social', 0.015, 0.65, 46),
    ]
    
    for name, display_name, category, weight, cultural_sensitivity, order_idx in dimensions_data:
        tier = 'free' if weight > 0.022 else 'paid'
        connection.execute(sa.text("""
            INSERT INTO vulca_dimensions 
            (uuid, name, display_name, category, weight, cultural_sensitivity, tier_required, order_index)
            VALUES (:uuid, :name, :display_name, :category, :weight, :cultural_sensitivity, :tier, :order_idx)
        """), {
            "uuid": str(uuid.uuid4()),
            "name": name,
            "display_name": display_name,
            "category": category,
            "weight": weight,
            "cultural_sensitivity": cultural_sensitivity,
            "tier": tier,
            "order_idx": order_idx
        })


def downgrade():
    """
    Rollback VULCA 47D migration
    """
    # Drop indexes
    op.drop_index('idx_vulca_cache_expires')
    op.drop_index('idx_vulca_cache_model')
    op.drop_index('idx_vulca_cache_key')
    op.drop_index('idx_vulca_dimensions_tier')
    op.drop_index('idx_vulca_dimensions_category')
    op.drop_index('idx_vulca_score_details_score')
    op.drop_index('idx_vulca_score_details_dimension_id')
    op.drop_index('idx_vulca_score_details_score_id')
    op.drop_index('idx_vulca_scores_overall')
    op.drop_index('idx_vulca_scores_created_at')
    op.drop_index('idx_vulca_scores_algorithm_version')
    op.drop_index('idx_vulca_scores_model_uuid')
    op.drop_index('idx_vulca_scores_model_id')
    op.drop_index('idx_users_uuid')
    op.drop_index('idx_benchmarks_uuid')
    op.drop_index('idx_ai_models_uuid')
    
    # Drop tables
    op.drop_table('vulca_cache')
    op.drop_table('vulca_score_details')
    op.drop_table('vulca_scores')
    op.drop_table('vulca_cultural_perspectives')
    op.drop_table('vulca_dimensions')
    op.drop_table('vulca_algorithm_versions')
    
    # Drop UUID columns
    op.drop_column('users', 'uuid')
    op.drop_column('benchmarks', 'uuid')
    op.drop_column('ai_models', 'uuid')