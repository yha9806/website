from abc import ABC, abstractmethod
from typing import Dict, Any, Optional
from pydantic import BaseModel
from enum import Enum


class TaskType(str, Enum):
    POEM = "poem"
    STORY = "story"
    PAINTING = "painting"
    MUSIC = "music"


class PoemResponse(BaseModel):
    title: str
    content: str
    style: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None


class StoryResponse(BaseModel):
    title: str
    content: str
    genre: Optional[str] = None
    word_count: int
    metadata: Optional[Dict[str, Any]] = None


class ImageResponse(BaseModel):
    image_url: Optional[str] = None
    image_base64: Optional[str] = None
    prompt_used: str
    metadata: Optional[Dict[str, Any]] = None


class MusicResponse(BaseModel):
    audio_url: Optional[str] = None
    notation: Optional[str] = None
    lyrics: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None


class AIProvider(ABC):
    """Abstract base class for AI providers"""
    
    def __init__(self, api_key: str = None, base_url: str = None):
        self.api_key = api_key
        self.base_url = base_url
    
    @abstractmethod
    async def generate_poem(
        self, 
        prompt: str,
        style: Optional[str] = None,
        **kwargs
    ) -> PoemResponse:
        """Generate a poem based on prompt"""
        pass
    
    @abstractmethod
    async def generate_story(
        self,
        prompt: str,
        max_length: int = 500,
        **kwargs
    ) -> StoryResponse:
        """Generate a story based on prompt"""
        pass
    
    @abstractmethod
    async def generate_image(
        self,
        prompt: str,
        style: Optional[str] = None,
        **kwargs
    ) -> ImageResponse:
        """Generate an image based on prompt"""
        pass
    
    @abstractmethod
    async def generate_music(
        self,
        prompt: str,
        duration: Optional[int] = None,
        **kwargs
    ) -> MusicResponse:
        """Generate music based on prompt"""
        pass
    
    @abstractmethod
    async def health_check(self) -> bool:
        """Check if the provider is available"""
        pass