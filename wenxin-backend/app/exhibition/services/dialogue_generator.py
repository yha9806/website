"""
Claude-based Dialogue Generator for Art Criticism
Uses Claude's vision capability for multimodal analysis
"""
import os
import json
import logging
import asyncio
from typing import List, Dict, Any, Optional, Tuple
from datetime import datetime

import anthropic

from ..models.persona import Persona, get_persona, get_all_personas
from ..models.conversation import Conversation, ConversationCreate
from .image_processor import ImageProcessor

logger = logging.getLogger(__name__)


class DialogueGenerator:
    """Generate art criticism dialogues using Claude API"""

    # Output format template
    OUTPUT_FORMAT = """
Your response should follow this format:

TEXT: [First paragraph of art criticism]
TEXT: [Second paragraph of art criticism]
TEXT: [Continue as needed...]

```json
{
    "artwork_identifier": "[Title of the artwork]",
    "evaluative_stance": {
        "overall_assessment": "[positive/negative/mixed/neutral]",
        "key_strengths": ["strength1", "strength2"],
        "areas_for_reflection": ["area1", "area2"]
    },
    "core_focal_points": [
        {
            "aspect": "[e.g., technique, concept, emotion]",
            "observation": "[specific observation]",
            "significance": "[why this matters]"
        }
    ],
    "argumentative_quality_impression": {
        "coherence": "[high/medium/low]",
        "depth_of_analysis": "[high/medium/low]",
        "cultural_sensitivity": "[high/medium/low]"
    },
    "multimodal_input_notes": {
        "visual_elements_analyzed": ["element1", "element2"],
        "text_context_utilized": ["context1", "context2"]
    }
}
```
"""

    def __init__(
        self,
        api_key: Optional[str] = None,
        model: str = "claude-sonnet-4-5-20250929",
        max_tokens: int = 4096
    ):
        self.api_key = api_key or os.getenv("ANTHROPIC_API_KEY")
        if not self.api_key:
            raise ValueError("ANTHROPIC_API_KEY not found")

        self.client = anthropic.Anthropic(api_key=self.api_key)
        self.model = model
        self.max_tokens = max_tokens
        self.image_processor = ImageProcessor()

    def _build_system_prompt(self, persona: Persona) -> str:
        """Build system prompt for persona"""
        base_prompt = f"""You are an art critic providing thoughtful analysis of contemporary artworks.

{persona.system_prompt}

When analyzing art, consider:
1. The visual elements, composition, and technique
2. The conceptual depth and artistic intention
3. The emotional resonance and viewer experience
4. Cultural context and contemporary relevance
5. The artist's background and creative approach

{self.OUTPUT_FORMAT}
"""
        return base_prompt

    def _build_user_message(
        self,
        artwork: Dict[str, Any],
        artist: Optional[Dict[str, Any]] = None,
        image_data: Optional[List[Tuple[str, str]]] = None,
        persona: Optional[Persona] = None
    ) -> List[Dict[str, Any]]:
        """Build user message with text and optional images"""
        content = []

        # Add images if available
        if image_data:
            for base64_data, media_type in image_data:
                content.append({
                    "type": "image",
                    "source": {
                        "type": "base64",
                        "media_type": media_type,
                        "data": base64_data
                    }
                })

        # Build text context
        text_parts = []

        # Artwork information
        text_parts.append(f"**Artwork Title**: {artwork.get('title', 'Untitled')}")
        text_parts.append(f"**Chapter/Theme**: {artwork.get('chapter_name', 'Unknown')}")

        if artwork.get('medium'):
            text_parts.append(f"**Medium**: {artwork['medium']}")
        if artwork.get('material'):
            text_parts.append(f"**Material**: {artwork['material']}")
        if artwork.get('size'):
            text_parts.append(f"**Size/Duration**: {artwork['size']}")
        if artwork.get('create_year'):
            text_parts.append(f"**Year**: {artwork['create_year']}")
        if artwork.get('categories'):
            text_parts.append(f"**Categories**: {artwork['categories']}")

        # Description
        if artwork.get('description'):
            text_parts.append(f"\n**Artist's Description**:\n{artwork['description']}")

        # Artist information
        if artist:
            text_parts.append(f"\n**Artist**: {artist.get('first_name', '')} {artist.get('last_name', '')}")
            if artist.get('school'):
                text_parts.append(f"**School**: {artist['school']}")
            if artist.get('major'):
                text_parts.append(f"**Major**: {artist['major']}")
            if artist.get('bio'):
                text_parts.append(f"**Artist Bio**: {artist['bio']}")
            elif artist.get('profile'):
                text_parts.append(f"**Artist Profile**: {artist['profile']}")

        # Add persona-specific instruction
        if persona and persona.id != "basic":
            text_parts.append(f"\n**Perspective**: Please analyze this artwork from the perspective of {persona.name} ({persona.name_cn if persona.name_cn else persona.name}).")

        text_parts.append("\nPlease provide your critical analysis of this artwork.")

        content.append({
            "type": "text",
            "text": "\n".join(text_parts)
        })

        return content

    def _parse_response(self, response_text: str) -> Tuple[List[str], Dict[str, Any]]:
        """Parse response into text segments and structured analysis"""
        text_segments = []
        structured_analysis = {}

        lines = response_text.strip().split("\n")
        current_text = []
        json_started = False
        json_lines = []

        for line in lines:
            if line.startswith("TEXT:"):
                if current_text:
                    text_segments.append(" ".join(current_text))
                    current_text = []
                text_segments.append(line[5:].strip())
            elif line.strip() == "```json":
                json_started = True
            elif line.strip() == "```" and json_started:
                json_started = False
                try:
                    structured_analysis = json.loads("\n".join(json_lines))
                except json.JSONDecodeError as e:
                    logger.warning(f"Failed to parse JSON: {e}")
            elif json_started:
                json_lines.append(line)
            elif line.strip() and not json_started:
                current_text.append(line.strip())

        if current_text:
            text_segments.append(" ".join(current_text))

        return text_segments, structured_analysis

    async def generate_dialogue(
        self,
        artwork: Dict[str, Any],
        artist: Optional[Dict[str, Any]] = None,
        persona_id: str = "basic",
        include_images: bool = True,
        max_images: int = 3
    ) -> ConversationCreate:
        """
        Generate dialogue for an artwork

        Args:
            artwork: Artwork data dict
            artist: Artist data dict (optional)
            persona_id: Persona ID (basic, su_shi, etc.)
            include_images: Whether to analyze images
            max_images: Maximum number of images to include

        Returns:
            ConversationCreate object
        """
        persona = get_persona(persona_id)

        # Fetch images if requested
        image_data = []
        if include_images and artwork.get("image_urls"):
            # Handle both string and list formats
            raw_urls = artwork["image_urls"]
            if isinstance(raw_urls, str):
                urls = ImageProcessor.parse_image_urls(raw_urls)
            else:
                urls = raw_urls if raw_urls else []
            for url in urls[:max_images]:
                base64_data, media_type = await ImageProcessor.fetch_image_base64(
                    url, max_width=1024
                )
                if base64_data:
                    image_data.append((base64_data, media_type))

        # Build messages
        system_prompt = self._build_system_prompt(persona)
        user_content = self._build_user_message(artwork, artist, image_data, persona)

        logger.info(f"Generating dialogue for artwork {artwork['id']} with persona {persona_id}")
        logger.info(f"Including {len(image_data)} images")

        # Call Claude API
        try:
            response = self.client.messages.create(
                model=self.model,
                max_tokens=self.max_tokens,
                system=system_prompt,
                messages=[{
                    "role": "user",
                    "content": user_content
                }]
            )

            response_text = response.content[0].text
            text_segments, structured_analysis = self._parse_response(response_text)

            return ConversationCreate(
                artwork_id=artwork["id"],
                persona_id=persona_id,
                persona_name=persona.name,
                text_segments=text_segments,
                structured_analysis=structured_analysis,
                image_analyzed=len(image_data) > 0,
                model_used=self.model
            )

        except Exception as e:
            logger.error(f"Failed to generate dialogue: {e}")
            raise

    async def generate_all_dialogues(
        self,
        artwork: Dict[str, Any],
        artist: Optional[Dict[str, Any]] = None,
        include_basic: bool = True,
        include_images: bool = True,
        delay_seconds: float = 1.0
    ) -> List[ConversationCreate]:
        """
        Generate dialogues for all personas

        Args:
            artwork: Artwork data
            artist: Artist data
            include_basic: Include basic perspective
            include_images: Whether to analyze images
            delay_seconds: Delay between API calls

        Returns:
            List of ConversationCreate objects
        """
        conversations = []
        personas = get_all_personas()

        for persona in personas:
            if persona.id == "basic" and not include_basic:
                continue

            try:
                conversation = await self.generate_dialogue(
                    artwork=artwork,
                    artist=artist,
                    persona_id=persona.id,
                    include_images=include_images
                )
                conversations.append(conversation)
                logger.info(f"Generated {persona.id} dialogue for artwork {artwork['id']}")

                # Rate limiting delay
                if delay_seconds > 0:
                    await asyncio.sleep(delay_seconds)

            except Exception as e:
                logger.error(f"Failed to generate {persona.id} dialogue: {e}")
                continue

        return conversations
