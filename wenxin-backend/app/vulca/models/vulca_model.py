"""
VULCA Database Models
SQLAlchemy models for VULCA evaluation data
"""

from sqlalchemy import Column, Integer, String, Float, JSON, DateTime, ForeignKey, Text, Index
from sqlalchemy.orm import relationship
from datetime import datetime

from ...core.database import Base

class VULCAEvaluation(Base):
    """VULCA evaluation results for models"""
    
    __tablename__ = 'vulca_evaluations'
    
    id = Column(Integer, primary_key=True, index=True)
    model_id = Column(Integer, index=True, nullable=False)
    model_name = Column(String(255), nullable=False)
    
    # 6-dimensional original scores (JSON)
    original_6d_scores = Column(JSON, nullable=False)
    # Example: {"creativity": 85, "technique": 90, "emotion": 82, ...}
    
    # 47-dimensional extended scores (JSON)
    extended_47d_scores = Column(JSON, nullable=False)
    # Example: {"originality": 87.5, "imagination": 83.2, ...}
    
    # 8 cultural perspective scores (JSON)
    cultural_perspectives = Column(JSON, nullable=False)
    # Example: {"western": 85.3, "eastern": 88.1, "african": 82.7, ...}
    
    # Metadata (renamed to avoid SQLAlchemy reserved keyword)
    evaluation_metadata = Column(JSON)
    # Example: {"algorithm_version": "2.0", "expansion_method": "correlation_matrix"}
    
    # Timestamps
    evaluation_date = Column(DateTime, default=datetime.utcnow, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Indexes for performance
    __table_args__ = (
        Index('idx_model_date', 'model_id', 'evaluation_date'),
        Index('idx_model_name', 'model_name'),
    )
    
    def to_dict(self) -> dict:
        """Convert model to dictionary"""
        return {
            'id': self.id,
            'model_id': self.model_id,
            'model_name': self.model_name,
            'original_6d_scores': self.original_6d_scores,
            'extended_47d_scores': self.extended_47d_scores,
            'cultural_perspectives': self.cultural_perspectives,
            'metadata': self.evaluation_metadata,
            'evaluation_date': self.evaluation_date.isoformat() if self.evaluation_date else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }


class VULCADimension(Base):
    """VULCA dimension definitions and metadata"""
    
    __tablename__ = 'vulca_dimensions'
    
    id = Column(Integer, primary_key=True, index=True)
    dimension_id = Column(String(50), unique=True, index=True, nullable=False)
    dimension_name = Column(String(100), nullable=False)
    category = Column(String(50), nullable=False)
    description = Column(Text)
    
    # Dimension properties
    weight = Column(Float, default=1.0)
    min_value = Column(Float, default=0.0)
    max_value = Column(Float, default=100.0)
    
    # Cultural relevance scores for each perspective (JSON)
    cultural_relevance = Column(JSON)
    # Example: {"western": 0.8, "eastern": 0.6, ...}
    
    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def to_dict(self) -> dict:
        """Convert model to dictionary"""
        return {
            'id': self.id,
            'dimension_id': self.dimension_id,
            'dimension_name': self.dimension_name,
            'category': self.category,
            'description': self.description,
            'weight': self.weight,
            'min_value': self.min_value,
            'max_value': self.max_value,
            'cultural_relevance': self.cultural_relevance,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }


class VULCAComparison(Base):
    """VULCA model comparison results"""
    
    __tablename__ = 'vulca_comparisons'
    
    id = Column(Integer, primary_key=True, index=True)
    comparison_id = Column(String(50), unique=True, index=True, nullable=False)
    
    # Models being compared (JSON array of model IDs)
    model_ids = Column(JSON, nullable=False)
    # Example: [1, 2, 3, 4]
    
    # Difference matrix (JSON 2D array)
    difference_matrix = Column(JSON, nullable=False)
    
    # Comparison summary (JSON)
    summary = Column(JSON, nullable=False)
    # Includes: most_similar, most_different, average_difference, etc.
    
    # Metadata
    comparison_date = Column(DateTime, default=datetime.utcnow, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    def to_dict(self) -> dict:
        """Convert model to dictionary"""
        return {
            'id': self.id,
            'comparison_id': self.comparison_id,
            'model_ids': self.model_ids,
            'difference_matrix': self.difference_matrix,
            'summary': self.summary,
            'comparison_date': self.comparison_date.isoformat() if self.comparison_date else None,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }