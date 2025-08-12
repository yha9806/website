import os
import asyncio
from typing import Optional, Dict, Any
from openai import AsyncOpenAI
from . import (
    AIProvider,
    PoemResponse,
    StoryResponse,
    ImageResponse,
    MusicResponse
)
from ..media_storage import ImageStorage


class OpenAIProvider(AIProvider):
    """OpenAI API provider for AI generation tasks"""
    
    def __init__(self, api_key: str = None):
        super().__init__(api_key=api_key)
        self.client = AsyncOpenAI(
            api_key=api_key or os.getenv("OPENAI_API_KEY")
        )
        self.image_storage = ImageStorage()
        
    async def generate_poem(
        self,
        prompt: str,
        style: Optional[str] = None,
        **kwargs
    ) -> PoemResponse:
        """Generate a poem using GPT-4"""
        try:
            system_prompt = "You are a professional poet. Create beautiful, meaningful poems."
            if style:
                system_prompt += f" Write in {style} style."
            
            user_prompt = f"Write a poem about: {prompt}"
            
            response = await self.client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                max_tokens=500,
                temperature=0.8
            )
            
            content = response.choices[0].message.content
            # Parse title from first line if formatted as "Title: XXX"
            lines = content.split('\n')
            title = prompt[:30]  # Default title from prompt
            poem_content = content
            
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
                    "provider": "openai",
                    "model": "gpt-4o-mini",
                    "prompt": prompt,
                    "tokens_used": response.usage.total_tokens if response.usage else 0
                }
            )
        except Exception as e:
            # Fallback to mock response on error
            return PoemResponse(
                title=f"Poem about {prompt[:30]}",
                content=f"Error generating poem: {str(e)}",
                style=style,
                metadata={"provider": "openai", "error": str(e)}
            )
    
    async def generate_story(
        self,
        prompt: str,
        max_length: int = 500,
        **kwargs
    ) -> StoryResponse:
        """Generate a story using GPT-4"""
        try:
            system_prompt = f"You are a creative storyteller. Write engaging stories with a maximum of {max_length} words."
            
            response = await self.client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": f"Write a story about: {prompt}"}
                ],
                max_tokens=min(max_length * 2, 2000),  # Approximate tokens
                temperature=0.85
            )
            
            content = response.choices[0].message.content
            lines = content.split('\n')
            title = prompt[:30]
            story_content = content
            
            # Extract title if present
            if lines and (lines[0].startswith('Title:') or lines[0].startswith('#')):
                title = lines[0].replace('Title:', '').replace('#', '').strip()
                story_content = '\n'.join(lines[1:]).strip()
            
            word_count = len(story_content.split())
            
            return StoryResponse(
                title=title,
                content=story_content,
                genre=kwargs.get('genre', 'General'),
                word_count=word_count,
                metadata={
                    "provider": "openai",
                    "model": "gpt-4o-mini",
                    "prompt": prompt,
                    "tokens_used": response.usage.total_tokens if response.usage else 0
                }
            )
        except Exception as e:
            return StoryResponse(
                title=f"Story about {prompt[:30]}",
                content=f"Error generating story: {str(e)}",
                genre="Error",
                word_count=0,
                metadata={"provider": "openai", "error": str(e)}
            )
    
    async def generate_image(
        self,
        prompt: str,
        style: Optional[str] = None,
        task_id: Optional[str] = None,
        **kwargs
    ) -> ImageResponse:
        """Generate an image using DALL-E 3 and save locally"""
        try:
            # Enhance prompt with style if provided
            full_prompt = prompt
            if style:
                full_prompt = f"{prompt}, {style} style"
            
            response = await self.client.images.generate(
                model="dall-e-3",
                prompt=full_prompt,
                size="1024x1024",
                quality="standard",
                n=1
            )
            
            openai_image_url = response.data[0].url
            
            # Save image locally
            local_image_url = None
            if task_id:
                local_image_url = await self.image_storage.save_generated_image(
                    openai_image_url, task_id, "dalle3"
                )
            
            # Use local URL if available, otherwise fallback to OpenAI URL
            final_image_url = local_image_url or openai_image_url
            
            return ImageResponse(
                image_url=final_image_url,
                prompt_used=full_prompt,
                metadata={
                    "provider": "openai",
                    "model": "dall-e-3",
                    "prompt": prompt,
                    "style": style,
                    "revised_prompt": response.data[0].revised_prompt if hasattr(response.data[0], 'revised_prompt') else full_prompt,
                    "original_url": openai_image_url,
                    "local_url": local_image_url,
                    "task_id": task_id
                }
            )
        except Exception as e:
            # Fallback to placeholder
            return ImageResponse(
                image_url=f"https://via.placeholder.com/1024x1024?text=Error+Generating+Image",
                prompt_used=prompt,
                metadata={"provider": "openai", "error": str(e)}
            )
    
    async def generate_music(
        self,
        prompt: str,
        duration: Optional[int] = None,
        **kwargs
    ) -> MusicResponse:
        """Generate music description using GPT-4 (OpenAI doesn't have music generation yet)"""
        try:
            # Since OpenAI doesn't have music generation, we'll create lyrics and notation description
            system_prompt = "You are a music composer. Create song lyrics and describe the musical composition."
            
            response = await self.client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": f"Create a song about: {prompt}. Include lyrics and describe the melody."}
                ],
                max_tokens=500,
                temperature=0.9
            )
            
            content = response.choices[0].message.content
            
            # Simple ABC notation placeholder
            notation = """X:1
T:AI Generated Melody
M:4/4
L:1/8
K:C
|: CDEF GABc | cBAG FEDC :|"""
            
            return MusicResponse(
                notation=notation,
                lyrics=content,
                metadata={
                    "provider": "openai",
                    "model": "gpt-4o-mini",
                    "prompt": prompt,
                    "duration": duration or 30,
                    "note": "Music generation not available, lyrics and description provided"
                }
            )
        except Exception as e:
            return MusicResponse(
                notation="",
                lyrics=f"Error generating music: {str(e)}",
                metadata={"provider": "openai", "error": str(e)}
            )
    
    async def health_check(self) -> bool:
        """Check if OpenAI API is accessible"""
        try:
            # Try a simple API call
            response = await self.client.models.list()
            return True
        except Exception:
            return False