import random
import asyncio
from typing import Optional
from . import (
    AIProvider,
    PoemResponse,
    StoryResponse,
    ImageResponse,
    MusicResponse
)


class MockProvider(AIProvider):
    """Mock AI provider for testing without real API calls"""
    
    def __init__(self):
        super().__init__()
        self.poems = [
            {
                "title": "春晓",
                "content": "春眠不觉晓，处处闻啼鸟。\n夜来风雨声，花落知多少。",
                "style": "唐诗"
            },
            {
                "title": "静夜思",
                "content": "床前明月光，疑是地上霜。\n举头望明月，低头思故乡。",
                "style": "唐诗"
            },
            {
                "title": "秋思",
                "content": "枯藤老树昏鸦，小桥流水人家。\n古道西风瘦马，夕阳西下，断肠人在天涯。",
                "style": "元曲"
            }
        ]
        
        self.stories = [
            {
                "title": "山中奇遇",
                "content": "深山之中，云雾缭绕。一位年轻的书生独自行走在崎岖的山路上。忽然，他听到远处传来一阵悠扬的笛声...",
                "genre": "仙侠"
            },
            {
                "title": "江南烟雨",
                "content": "烟雨朦胧的江南小镇，青石板路上映着斑驳的倒影。一把油纸伞下，走来一位身着青衫的女子...",
                "genre": "古风"
            }
        ]
    
    async def generate_poem(
        self,
        prompt: str,
        style: Optional[str] = None,
        **kwargs
    ) -> PoemResponse:
        """Generate a mock poem"""
        await asyncio.sleep(random.uniform(0.5, 1.5))  # Simulate API delay
        
        poem = random.choice(self.poems)
        
        # Add some variation based on prompt
        if "春" in prompt or "spring" in prompt.lower():
            poem = self.poems[0]
        elif "月" in prompt or "moon" in prompt.lower():
            poem = self.poems[1]
        
        return PoemResponse(
            title=poem["title"],
            content=poem["content"],
            style=style or poem["style"],
            metadata={
                "provider": "mock",
                "prompt": prompt,
                "generation_time": random.uniform(0.5, 2.0)
            }
        )
    
    async def generate_story(
        self,
        prompt: str,
        max_length: int = 500,
        **kwargs
    ) -> StoryResponse:
        """Generate a mock story"""
        await asyncio.sleep(random.uniform(1.0, 2.0))  # Simulate API delay
        
        story = random.choice(self.stories)
        
        # Adjust content length
        content = story["content"]
        if len(content) > max_length:
            content = content[:max_length] + "..."
        
        return StoryResponse(
            title=story["title"],
            content=content,
            genre=story["genre"],
            word_count=len(content),
            metadata={
                "provider": "mock",
                "prompt": prompt,
                "generation_time": random.uniform(1.0, 3.0)
            }
        )
    
    async def generate_image(
        self,
        prompt: str,
        style: Optional[str] = None,
        **kwargs
    ) -> ImageResponse:
        """Generate a mock image response"""
        await asyncio.sleep(random.uniform(2.0, 3.0))  # Simulate API delay
        
        # Use placeholder image service
        image_seed = abs(hash(prompt)) % 1000
        image_url = f"https://picsum.photos/seed/{image_seed}/1024/1024"
        
        return ImageResponse(
            image_url=image_url,
            prompt_used=f"{prompt} in {style or 'default'} style",
            metadata={
                "provider": "mock",
                "prompt": prompt,
                "style": style,
                "generation_time": random.uniform(2.0, 5.0)
            }
        )
    
    async def generate_music(
        self,
        prompt: str,
        duration: Optional[int] = None,
        **kwargs
    ) -> MusicResponse:
        """Generate a mock music response"""
        await asyncio.sleep(random.uniform(1.5, 2.5))  # Simulate API delay
        
        # Generate simple ABC notation
        notation = """X:1
T:Generated Melody
M:4/4
L:1/8
K:C
|: CDEF GABc | cBAG FEDC :|"""
        
        lyrics = f"♪ A melody inspired by: {prompt} ♪"
        
        return MusicResponse(
            notation=notation,
            lyrics=lyrics,
            metadata={
                "provider": "mock",
                "prompt": prompt,
                "duration": duration or 30,
                "generation_time": random.uniform(1.0, 3.0)
            }
        )
    
    async def health_check(self) -> bool:
        """Mock provider is always healthy"""
        return True