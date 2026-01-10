"""
VULCA Algorithm Package
Production-ready implementation of VULCA 47-dimension evaluation system
"""

from .vulca_core import VULCACore, VULCAResult
from .emnlp2025 import VULCAAlgorithmV2, VULCA_47_DIMENSIONS, VULCADimension, DimensionCategory
from .correlation_matrix import CorrelationMatrix, DimensionRelationship

__all__ = [
    # Core classes
    'VULCACore',
    'VULCAResult',
    'VULCAAlgorithmV2',
    'CorrelationMatrix',
    
    # Data structures
    'VULCADimension',
    'DimensionCategory',
    'DimensionRelationship',
    
    # Constants
    'VULCA_47_DIMENSIONS',
]

# Version info
__version__ = '2.0.0'
__algorithm_version__ = 'EMNLP2025-v2.0'