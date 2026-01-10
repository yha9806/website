import random
import asyncio
from typing import Optional
from . import (
    AIProvider,
    PoemResponse,
    StoryResponse,
    ImageResponse,
    MusicResponse,
    Language,
    BilingualContent
)


class MockProvider(AIProvider):
    """Mock AI provider for testing without real API calls"""
    
    def __init__(self):
        super().__init__()
        self.bilingual_poems = [
            {
                "title_zh": "春晓",
                "title_en": "Spring Dawn",
                "content_zh": "春眠不觉晓，处处闻啼鸟。\n夜来风雨声，花落知多少。",
                "content_en": "In spring sleep, dawn comes unaware,\nBirdsong echoes everywhere.\nNight brought sounds of wind and rain,\nHow many blossoms fell in vain?",
                "style": "唐诗/Tang Poetry"
            },
            {
                "title_zh": "静夜思",
                "title_en": "Quiet Night Thoughts",
                "content_zh": "床前明月光，疑是地上霜。\n举头望明月，低头思故乡。",
                "content_en": "Bright moonlight before my bed,\nI suspect it is frost on the ground.\nLooking up, I gaze at the bright moon,\nLowering my head, I think of my hometown.",
                "style": "唐诗/Tang Poetry"
            },
            {
                "title_zh": "秋思",
                "title_en": "Autumn Thoughts",
                "content_zh": "枯藤老树昏鸦，小桥流水人家。\n古道西风瘦马，夕阳西下，断肠人在天涯。",
                "content_en": "Withered vines, old trees, evening crows,\nSmall bridge, flowing water, people's homes.\nAncient road, west wind, thin horse,\nSunset descends, heartbroken one at the edge of the world.",
                "style": "元曲/Yuan Poetry"
            }
        ]
        
        self.bilingual_stories = [
            {
                "title_zh": "山中奇遇",
                "title_en": "Mountain Encounter",
                "content_zh": "深山之中，云雾缭绕。一位年轻的书生独自行走在崎岖的山路上。忽然，他听到远处传来一阵悠扬的笛声...",
                "content_en": "Deep in the mountains, clouds and mist swirl. A young scholar walks alone on the rugged mountain path. Suddenly, he hears a melodious flute melody drifting from afar...",
                "genre": "仙侠/Xianxia"
            },
            {
                "title_zh": "江南烟雨",
                "title_en": "Misty Rain in Jiangnan",
                "content_zh": "烟雨朦胧的江南小镇，青石板路上映着斑驳的倒影。一把油纸伞下，走来一位身着青衫的女子...",
                "content_en": "In the misty rain of a Jiangnan town, mottled reflections dance on the bluestone path. Under an oil-paper umbrella, a woman in green robes approaches...",
                "genre": "古风/Ancient Style"
            }
        ]
    
    async def generate_poem(
        self,
        prompt: str,
        style: Optional[str] = None,
        language: Language = Language.CHINESE,
        **kwargs
    ) -> PoemResponse:
        """Generate a mock poem with bilingual support"""
        print(f"MockProvider.generate_poem called with language={language}, type={type(language)}")
        await asyncio.sleep(random.uniform(0.5, 1.5))  # Simulate API delay
        
        # Select poem based on prompt
        poem = random.choice(self.bilingual_poems)
        if "春" in prompt or "spring" in prompt.lower():
            poem = self.bilingual_poems[0]
        elif "月" in prompt or "moon" in prompt.lower():
            poem = self.bilingual_poems[1]
        elif "秋" in prompt or "autumn" in prompt.lower():
            poem = self.bilingual_poems[2]
        
        # Prepare bilingual content if requested
        bilingual_title = None
        bilingual_content = None
        
        if language == Language.BOTH:
            print(f"Creating bilingual content for poem")
            bilingual_title = BilingualContent(
                zh=poem["title_zh"],
                en=poem["title_en"],
                primary_language=Language.CHINESE
            )
            bilingual_content = BilingualContent(
                zh=poem["content_zh"],
                en=poem["content_en"],
                primary_language=Language.CHINESE
            )
            title = poem["title_zh"]  # Default to Chinese for primary
            content = poem["content_zh"]
            print(f"Bilingual title created: {bilingual_title}")
            print(f"Bilingual content created: {bilingual_content}")
        elif language == Language.ENGLISH:
            title = poem["title_en"]
            content = poem["content_en"]
        else:  # Chinese or default
            title = poem["title_zh"]
            content = poem["content_zh"]
        
        return PoemResponse(
            title=title,
            content=content,
            style=style or poem["style"],
            language=language,
            bilingual_title=bilingual_title,
            bilingual_content=bilingual_content,
            metadata={
                "provider": "mock",
                "prompt": prompt,
                "language": language.value,
                "generation_time": random.uniform(0.5, 2.0)
            }
        )
    
    async def generate_story(
        self,
        prompt: str,
        max_length: int = 500,
        language: Language = Language.CHINESE,
        **kwargs
    ) -> StoryResponse:
        """Generate a mock story with bilingual support"""
        await asyncio.sleep(random.uniform(1.0, 2.0))  # Simulate API delay
        
        story = random.choice(self.bilingual_stories)
        
        # Prepare bilingual content if requested
        bilingual_title = None
        bilingual_content = None
        
        if language == Language.BOTH:
            bilingual_title = BilingualContent(
                zh=story["title_zh"],
                en=story["title_en"],
                primary_language=Language.CHINESE
            )
            bilingual_content = BilingualContent(
                zh=story["content_zh"],
                en=story["content_en"],
                primary_language=Language.CHINESE
            )
            title = story["title_zh"]
            content = story["content_zh"]
        elif language == Language.ENGLISH:
            title = story["title_en"]
            content = story["content_en"]
        else:  # Chinese or default
            title = story["title_zh"]
            content = story["content_zh"]
        
        # Adjust content length
        if len(content) > max_length:
            content = content[:max_length] + "..."
        
        return StoryResponse(
            title=title,
            content=content,
            genre=story["genre"],
            word_count=len(content),
            language=language,
            bilingual_title=bilingual_title,
            bilingual_content=bilingual_content,
            metadata={
                "provider": "mock",
                "prompt": prompt,
                "language": language.value,
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