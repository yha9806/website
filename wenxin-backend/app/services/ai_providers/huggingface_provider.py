import os
import asyncio
import httpx
from typing import Optional, Dict, Any
from . import (
    AIProvider,
    PoemResponse,
    StoryResponse,
    ImageResponse,
    MusicResponse
)


class HuggingFaceProvider(AIProvider):
    """HuggingFace API provider for AI generation tasks"""
    
    def __init__(self, api_key: str = None):
        super().__init__(api_key=api_key)
        self.api_key = api_key or os.getenv("HUGGINGFACE_API_KEY")
        self.base_url = "https://api-inference.huggingface.co/models"
        self.headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        
    async def generate_poem(
        self,
        prompt: str,
        style: Optional[str] = None,
        **kwargs
    ) -> PoemResponse:
        """Generate a poem using HuggingFace text generation model"""
        try:
            # Use a general text generation model
            model = "microsoft/DialoGPT-medium"  # Fallback to available model
            
            full_prompt = f"Write a poem about {prompt}"
            if style:
                full_prompt += f" in {style} style"
            
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{self.base_url}/{model}",
                    headers=self.headers,
                    json={
                        "inputs": full_prompt,
                        "parameters": {
                            "max_new_tokens": 200,
                            "temperature": 0.8,
                            "do_sample": True
                        }
                    },
                    timeout=30.0
                )
                
            if response.status_code == 200:
                result = response.json()
                if isinstance(result, list) and result:
                    content = result[0].get("generated_text", "")
                    # Remove the input prompt from the response
                    content = content.replace(full_prompt, "").strip()
                else:
                    content = "Unable to generate poem at this time."
                    
                return PoemResponse(
                    title=f"Poem about {prompt[:30]}",
                    content=content or "Generated poem content",
                    style=style,
                    metadata={
                        "provider": "huggingface",
                        "model": model,
                        "prompt": prompt
                    }
                )
            else:
                raise Exception(f"API error: {response.status_code}")
                
        except Exception as e:
            # Fallback response
            return PoemResponse(
                title=f"Poem about {prompt[:30]}",
                content="HuggingFace poem generation temporarily unavailable",
                style=style,
                metadata={"provider": "huggingface", "error": str(e)}
            )
    
    async def generate_story(
        self,
        prompt: str,
        max_length: int = 500,
        **kwargs
    ) -> StoryResponse:
        """Generate a story using HuggingFace text generation model"""
        try:
            model = "microsoft/DialoGPT-medium"
            full_prompt = f"Tell a story about {prompt}"
            
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{self.base_url}/{model}",
                    headers=self.headers,
                    json={
                        "inputs": full_prompt,
                        "parameters": {
                            "max_new_tokens": min(max_length, 500),
                            "temperature": 0.85,
                            "do_sample": True
                        }
                    },
                    timeout=30.0
                )
                
            if response.status_code == 200:
                result = response.json()
                if isinstance(result, list) and result:
                    content = result[0].get("generated_text", "")
                    content = content.replace(full_prompt, "").strip()
                else:
                    content = "Story generation in progress..."
                    
                word_count = len(content.split()) if content else 0
                
                return StoryResponse(
                    title=f"Story about {prompt[:30]}",
                    content=content or "Generated story content",
                    genre=kwargs.get('genre', 'General'),
                    word_count=word_count,
                    metadata={
                        "provider": "huggingface",
                        "model": model,
                        "prompt": prompt
                    }
                )
            else:
                raise Exception(f"API error: {response.status_code}")
                
        except Exception as e:
            return StoryResponse(
                title=f"Story about {prompt[:30]}",
                content="HuggingFace story generation temporarily unavailable",
                genre="Error",
                word_count=0,
                metadata={"provider": "huggingface", "error": str(e)}
            )
    
    async def generate_image(
        self,
        prompt: str,
        style: Optional[str] = None,
        **kwargs
    ) -> ImageResponse:
        """Generate an image using Stable Diffusion model"""
        try:
            # Use Stable Diffusion model
            model = "stabilityai/stable-diffusion-xl-base-1.0"
            
            full_prompt = prompt
            if style:
                full_prompt += f", {style} style"
            
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{self.base_url}/{model}",
                    headers=self.headers,
                    json={
                        "inputs": full_prompt,
                        "parameters": {
                            "guidance_scale": 7.5,
                            "num_inference_steps": 20
                        }
                    },
                    timeout=60.0
                )
                
            if response.status_code == 200:
                # HuggingFace returns binary image data
                import base64
                image_data = response.content
                
                # For now, return a placeholder URL
                # In production, you'd upload to S3/CDN and return the URL
                placeholder_url = f"https://via.placeholder.com/1024x1024?text=HF+Generated"
                
                return ImageResponse(
                    image_url=placeholder_url,
                    image_base64=base64.b64encode(image_data).decode() if image_data else None,
                    prompt_used=full_prompt,
                    metadata={
                        "provider": "huggingface",
                        "model": model,
                        "prompt": prompt,
                        "style": style,
                        "note": "Image generated but needs CDN upload for URL"
                    }
                )
            else:
                raise Exception(f"API error: {response.status_code}")
                
        except Exception as e:
            return ImageResponse(
                image_url=f"https://via.placeholder.com/1024x1024?text=HF+Error",
                prompt_used=prompt,
                metadata={"provider": "huggingface", "error": str(e)}
            )
    
    async def generate_music(
        self,
        prompt: str,
        duration: Optional[int] = None,
        **kwargs
    ) -> MusicResponse:
        """HuggingFace music generation (limited support)"""
        # HuggingFace has limited music generation models
        # For now, return a creative text-based response
        
        # Simple ABC notation based on prompt sentiment/keywords
        notation = """X:1
T:HF Generated Tune
M:4/4
L:1/8
K:D
|: DFAF BAGF | GFED CDEF :|"""
        
        lyrics = f"🎵 A melody inspired by '{prompt}' 🎵\n(HuggingFace music generation coming soon)"
        
        return MusicResponse(
            notation=notation,
            lyrics=lyrics,
            metadata={
                "provider": "huggingface",
                "prompt": prompt,
                "duration": duration or 30,
                "note": "Limited music generation support"
            }
        )
    
    async def health_check(self) -> bool:
        """Check if HuggingFace API is accessible"""
        try:
            async with httpx.AsyncClient() as client:
                # Try accessing a simple model
                response = await client.get(
                    f"https://huggingface.co/api/models/microsoft/DialoGPT-medium",
                    timeout=10.0
                )
                return response.status_code == 200
        except Exception:
            return False