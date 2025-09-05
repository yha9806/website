"""
VULCA Module
Vision-Understanding and Language-based Cultural Adaptability Framework
"""

from .vulca import router as vulca_router
from .core.vulca_core_adapter import VULCACoreAdapter
from .services.vulca_service import VULCAService
from .models.vulca_model import VULCAEvaluation, VULCADimension, VULCAComparison

__all__ = [
    'vulca_router',
    'VULCACoreAdapter',
    'VULCAService',
    'VULCAEvaluation',
    'VULCADimension',
    'VULCAComparison'
]

__version__ = '2.0.0'