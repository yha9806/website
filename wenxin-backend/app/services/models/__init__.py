"""
Unified Model Interface - 统一模型接口
"""

from .model_registry import ModelConfig, model_registry
from .unified_client import UnifiedModelClient
from .validator import ModelValidator
from .monitor import ModelMonitor

# Auto-load all models when package is imported
from .configs.model_configs import load_all_models

# Initialize models on import
try:
    stats = load_all_models()
    try:
        print(f"Unified Model Interface initialized: {stats}")
    except:
        pass  # Ignore print errors during import
except Exception as e:
    try:
        print(f"Warning: Failed to auto-load models: {e}")
    except:
        pass  # Ignore print errors during import

__all__ = [
    'ModelConfig',
    'model_registry',
    'UnifiedModelClient',
    'ModelValidator',
    'ModelMonitor',
    'load_all_models'
]