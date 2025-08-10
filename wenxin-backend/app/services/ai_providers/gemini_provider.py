import os
import asyncio
from typing import Optional, Dict, Any
import google.generativeai as genai
from . import (
    AIProvider,
    PoemResponse,
    StoryResponse,
    ImageResponse,
    MusicResponse
)


class GeminiProvider(AIProvider):
    """Google Gemini API provider for AI generation tasks"""
    
    def __init__(self, api_key: str = None):
        super().__init__(api_key=api_key)
        genai.configure(api_key=api_key or os.getenv("GEMINI_API_KEY"))
        self.model = genai.GenerativeModel('gemini-pro')
        
    async def generate_poem(
        self,
        prompt: str,
        style: Optional[str] = None,
        **kwargs
    ) -> PoemResponse:
        """Generate a poem using Gemini Pro"""
        try:
            # Construct the prompt
            full_prompt = f"Write a beautiful poem about: {prompt}"
            if style:
                full_prompt += f"\nStyle: {style}"
            full_prompt += "\nFormat: Start with 'Title:' followed by the poem content."
            
            # Generate content synchronously (gemini SDK doesn't have async yet)
            response = await asyncio.to_thread(
                self.model.generate_content,
                full_prompt
            )
            
            content = response.text
            lines = content.split('\n')
            title = prompt[:30]  # Default title
            poem_content = content
            
            # Parse title if present
            if lines and lines[0].startswith('Title:'):
                title = lines[0].replace('Title:', '').strip()
                poem_content = '\n'.join(lines[1:]).strip()
            elif lines and lines[0].startswith('#'):
                title = lines[0].replace('#', '').strip()
                poem_content = '\n'.join(lines[1:]).strip()
            
            return PoemResponse(
                title=title,
                content=poem_content,
                style=style,
                metadata={
                    "provider": "gemini",
                    "model": "gemini-pro",
                    "prompt": prompt
                }
            )
        except Exception as e:
            return PoemResponse(
                title=f"Poem about {prompt[:30]}",
                content=f"Error generating poem: {str(e)}",
                style=style,
                metadata={"provider": "gemini", "error": str(e)}
            )
    
    async def generate_story(
        self,
        prompt: str,
        max_length: int = 500,
        **kwargs
    ) -> StoryResponse:
        """Generate a story using Gemini Pro"""
        try:
            full_prompt = f"""Write an engaging story about: {prompt}
Maximum length: {max_length} words
Format: Start with 'Title:' followed by the story content."""
            
            response = await asyncio.to_thread(
                self.model.generate_content,
                full_prompt
            )
            
            content = response.text
            lines = content.split('\n')
            title = prompt[:30]
            story_content = content
            
            # Extract title if present
            if lines and (lines[0].startswith('Title:') or lines[0].startswith('#')):
                title = lines[0].replace('Title:', '').replace('#', '').strip()
                story_content = '\n'.join(lines[1:]).strip()
            
            # Truncate if too long
            words = story_content.split()
            if len(words) > max_length:
                story_content = ' '.join(words[:max_length]) + '...'
            
            word_count = len(story_content.split())
            
            return StoryResponse(
                title=title,
                content=story_content,
                genre=kwargs.get('genre', 'General'),
                word_count=word_count,
                metadata={
                    "provider": "gemini",
                    "model": "gemini-pro",
                    "prompt": prompt
                }
            )
        except Exception as e:
            return StoryResponse(
                title=f"Story about {prompt[:30]}",
                content=f"Error generating story: {str(e)}",
                genre="Error",
                word_count=0,
                metadata={"provider": "gemini", "error": str(e)}
            )
    
    async def generate_image(
        self,
        prompt: str,
        style: Optional[str] = None,
        **kwargs
    ) -> ImageResponse:
        """Gemini doesn't support image generation yet, return placeholder"""
        # Gemini doesn't have image generation capability yet
        # Return a placeholder or delegate to another service
        return ImageResponse(
            image_url=f"https://via.placeholder.com/1024x1024?text=Gemini+No+Image+Support",
            prompt_used=prompt,
            metadata={
                "provider": "gemini",
                "note": "Gemini doesn't support image generation yet",
                "prompt": prompt,
                "style": style
            }
        )
    
    async def generate_music(
        self,
        prompt: str,
        duration: Optional[int] = None,
        **kwargs
    ) -> MusicResponse:
        """Generate music lyrics using Gemini Pro"""
        try:
            full_prompt = f"""Create song lyrics about: {prompt}
Include:
1. Verse 1
2. Chorus
3. Verse 2
4. Bridge (optional)
5. Final Chorus

Also describe the melody and rhythm."""
            
            response = await asyncio.to_thread(
                self.model.generate_content,
                full_prompt
            )
            
            content = response.text
            
            # Simple ABC notation placeholder
            notation = """X:1
T:Gemini Generated Song
M:4/4
L:1/8
K:G
|: GABG cBAG | FGAF DEFD :|"""
            
            return MusicResponse(
                notation=notation,
                lyrics=content,
                metadata={
                    "provider": "gemini",
                    "model": "gemini-pro",
                    "prompt": prompt,
                    "duration": duration or 30,
                    "note": "Lyrics and description generated"
                }
            )
        except Exception as e:
            return MusicResponse(
                notation="",
                lyrics=f"Error generating music: {str(e)}",
                metadata={"provider": "gemini", "error": str(e)}
            )
    
    async def health_check(self) -> bool:
        """Check if Gemini API is accessible"""
        try:
            # Try a simple generation
            response = await asyncio.to_thread(
                self.model.generate_content,
                "Hello, are you working?"
            )
            return bool(response.text)
        except Exception:
            return False