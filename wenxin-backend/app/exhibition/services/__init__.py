"""
Exhibition Services
"""
from .lancedb_service import LanceDBService
from .image_processor import ImageProcessor

# Lazy import for DialogueGenerator (requires anthropic)
def get_dialogue_generator():
    from .dialogue_generator import DialogueGenerator
    return DialogueGenerator

__all__ = ["LanceDBService", "ImageProcessor", "get_dialogue_generator"]
