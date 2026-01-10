"""
Multi-Agent Dialogue Generator
Each persona is an independent Claude agent that takes turns speaking
Supports multimodal image analysis and input perturbation
"""
import os
import json
import logging
import asyncio
import random
import re
from typing import List, Dict, Any, Optional, Tuple
from datetime import datetime

import anthropic

from ..models.persona import Persona, get_persona, get_all_personas, PERSONAS
from ..models.dialogue import DialogueTurn, MultiAgentDialogue, DialogueCreate, VisualTags, PerturbationConfig
from .image_processor import ImageProcessor

logger = logging.getLogger(__name__)


# Perturbation configuration (from openspec design.md)
PERTURBATION_CONFIG = {
    "temperature_range": (0.8, 1.0),      # Claude max is 1.0
    "input_length_variation": (1, 20),     # Input length variation range
    "conflict_injection_rate": 0.4,        # 40% probability to inject conflict
    "language_switch_rate": 0.3,           # 30% probability to switch language
}

# Visual analysis prompt template
VISUAL_ANALYSIS_PROMPT = """Analyze these artwork images and provide a detailed visual analysis.

Focus on:
1. **Composition**: Layout, structure, visual flow, balance
2. **Color Palette**: Dominant colors, color relationships, mood
3. **Technique**: Medium, style, artistic approach
4. **Subject Matter**: What is depicted, symbols, themes
5. **Mood/Atmosphere**: Emotional quality, feeling evoked

Respond in this exact JSON format:
```json
{
    "visual_description": "A comprehensive description of what you see in the images...",
    "composition": "description of composition",
    "color_palette": "description of colors",
    "technique": "description of technique/style",
    "mood": "description of mood/atmosphere",
    "subject": "description of subject matter",
    "key_visual_elements": ["element1", "element2", "element3"]
}
```
"""


class PersonaAgent:
    """An agent representing a single persona in the dialogue"""

    def __init__(
        self,
        persona: Persona,
        client: anthropic.Anthropic,
        model: str = "claude-sonnet-4-5-20250929"
    ):
        self.persona = persona
        self.client = client
        self.model = model
        self.conversation_history: List[Dict] = []

    def _get_native_language(self) -> str:
        """Determine persona's native language"""
        region = self.persona.region.lower()
        if "china" in region:
            return "zh"
        elif "japan" in region:
            return "ja"
        elif "russia" in region:
            return "ru"
        elif "africa" in region:
            return "en"  # Using English for accessibility
        elif "greece" in region:
            return "en"  # Modern English for accessibility
        else:
            return "en"

    def _build_system_prompt(self, artwork_context: str) -> str:
        """Build persona-specific system prompt"""
        native_lang = self._get_native_language()
        lang_instruction = ""
        if native_lang == "zh":
            lang_instruction = "You may respond in Chinese (中文) when it feels natural, especially for cultural concepts."
        elif native_lang == "ja":
            lang_instruction = "You may use Japanese (日本語) for key concepts or when expressing Eastern philosophical ideas."
        elif native_lang == "ru":
            lang_instruction = "You may use Russian (русский) terminology for formalist concepts."

        return f"""You are {self.persona.name} ({self.persona.name_cn if self.persona.name_cn else self.persona.name}), participating in an art criticism discussion.

{self.persona.system_prompt}

CONTEXT ABOUT YOU:
- Era: {self.persona.era or 'Contemporary'}
- Region: {self.persona.region or 'Global'}
- Style: {self.persona.style}

ARTWORK BEING DISCUSSED:
{artwork_context}

DIALOGUE INSTRUCTIONS:
1. Respond in character as {self.persona.name}
2. Show your reasoning process before your main response
3. Take a clear stance (agree, disagree, challenge, or elaborate)
4. You may reference your own works or theories informally
5. CRITICAL: Your response content must be EXTREMELY SHORT - only 1-20 characters maximum! Like a brief exclamation, single word, or very short phrase.
6. {lang_instruction}

RESPONSE FORMAT:
<thinking>
[Your internal reasoning about the artwork and other speakers' points]
</thinking>

<stance>[agree|disagree|challenge|elaborate|neutral]</stance>

<language>[zh|en|ja|ru]</language>

<response>
[Your actual dialogue contribution]
</response>

<references>
[Any works, theories, or quotes you're referencing, comma separated]
</references>
"""

    async def generate_response(
        self,
        artwork_context: str,
        dialogue_history: List[DialogueTurn],
        temperature: float = 1.0
    ) -> DialogueTurn:
        """Generate this agent's response to the dialogue"""

        # Build messages with dialogue history
        messages = []

        # Add dialogue history as context
        if dialogue_history:
            history_text = "DIALOGUE SO FAR:\n\n"
            for turn in dialogue_history:
                history_text += f"**{turn.speaker_name}** ({turn.stance}): {turn.content}\n\n"
            messages.append({
                "role": "user",
                "content": history_text + "\n\nNow it's your turn to respond. What is your perspective?"
            })
        else:
            messages.append({
                "role": "user",
                "content": "You are starting the discussion. Share your initial observations and perspective on this artwork."
            })

        # Generate response
        response = self.client.messages.create(
            model=self.model,
            max_tokens=500,  # Reduced for shorter responses
            temperature=temperature,
            system=self._build_system_prompt(artwork_context),
            messages=messages
        )

        response_text = response.content[0].text

        # Parse response
        turn = self._parse_response(response_text, dialogue_history)
        return turn

    def _parse_response(
        self,
        response_text: str,
        dialogue_history: List[DialogueTurn]
    ) -> DialogueTurn:
        """Parse the structured response into a DialogueTurn"""
        import re

        # Extract components
        thinking_match = re.search(r'<thinking>(.*?)</thinking>', response_text, re.DOTALL)
        stance_match = re.search(r'<stance>(.*?)</stance>', response_text, re.DOTALL)
        language_match = re.search(r'<language>(.*?)</language>', response_text, re.DOTALL)
        response_match = re.search(r'<response>(.*?)</response>', response_text, re.DOTALL)
        refs_match = re.search(r'<references>(.*?)</references>', response_text, re.DOTALL)

        chain_of_thought = thinking_match.group(1).strip() if thinking_match else ""
        stance = stance_match.group(1).strip().lower() if stance_match else "neutral"
        language = language_match.group(1).strip().lower() if language_match else "en"
        content = response_match.group(1).strip() if response_match else response_text
        references = []
        if refs_match:
            refs_text = refs_match.group(1).strip()
            if refs_text and refs_text.lower() != "none":
                references = [r.strip() for r in refs_text.split(",") if r.strip()]

        # Validate stance
        valid_stances = ["agree", "disagree", "challenge", "elaborate", "neutral"]
        if stance not in valid_stances:
            stance = "neutral"

        # Validate language
        valid_languages = ["zh", "en", "ja", "ru", "de", "fr"]
        if language not in valid_languages:
            language = "en"

        # Determine responds_to
        responds_to = None
        if dialogue_history:
            responds_to = dialogue_history[-1].turn_id

        return DialogueTurn(
            speaker_id=self.persona.id,
            speaker_name=self.persona.name,
            content=content,
            language=language,
            chain_of_thought=chain_of_thought,
            stance=stance,
            responds_to=responds_to,
            references=references
        )


class MultiAgentDialogueGenerator:
    """Orchestrates multi-agent dialogue generation with multimodal support"""

    def __init__(
        self,
        api_key: Optional[str] = None,
        model: str = "claude-sonnet-4-5-20250929"
    ):
        self.api_key = api_key or os.getenv("ANTHROPIC_API_KEY")
        if not self.api_key:
            raise ValueError("ANTHROPIC_API_KEY not found")

        self.client = anthropic.Anthropic(api_key=self.api_key)
        self.model = model
        self.image_processor = ImageProcessor()

    async def _analyze_images(
        self,
        artwork: Dict[str, Any],
        max_images: int = 3
    ) -> Tuple[str, VisualTags, List[str]]:
        """
        Analyze artwork images using Claude Vision API

        Returns:
            Tuple of (visual_analysis_text, visual_tags, image_refs)
        """
        image_urls = artwork.get("image_urls", [])
        if isinstance(image_urls, str):
            image_urls = [u.strip() for u in image_urls.split(",") if u.strip()]

        if not image_urls:
            return "", VisualTags(), []

        # Fetch images as base64
        image_data = []
        image_refs = []
        artwork_id = artwork["id"]

        for i, url in enumerate(image_urls[:max_images]):
            base64_data, media_type = await ImageProcessor.fetch_image_base64(url, max_width=1024)
            if base64_data:
                image_data.append((base64_data, media_type))
                image_refs.append(f"image://{artwork_id}/{i}")

        if not image_data:
            return "", VisualTags(), []

        # Build multimodal message
        content = []
        for base64_data, media_type in image_data:
            content.append({
                "type": "image",
                "source": {
                    "type": "base64",
                    "media_type": media_type,
                    "data": base64_data
                }
            })

        content.append({
            "type": "text",
            "text": VISUAL_ANALYSIS_PROMPT
        })

        # Call Claude Vision API
        try:
            response = self.client.messages.create(
                model=self.model,
                max_tokens=2000,
                messages=[{"role": "user", "content": content}]
            )

            response_text = response.content[0].text

            # Parse JSON from response
            json_match = re.search(r'```json\s*(.*?)\s*```', response_text, re.DOTALL)
            if json_match:
                analysis = json.loads(json_match.group(1))
            else:
                # Try parsing entire response as JSON
                analysis = json.loads(response_text)

            # Build visual description
            visual_description = analysis.get("visual_description", "")
            if not visual_description:
                visual_description = f"""
Composition: {analysis.get('composition', 'N/A')}
Color Palette: {analysis.get('color_palette', 'N/A')}
Technique: {analysis.get('technique', 'N/A')}
Subject: {analysis.get('subject', 'N/A')}
Mood: {analysis.get('mood', 'N/A')}
Key Elements: {', '.join(analysis.get('key_visual_elements', []))}
"""

            # Build visual tags with URL format
            visual_tags = VisualTags(
                composition=f"tag://visual/composition/{self._slugify(analysis.get('composition', 'unknown')[:50])}",
                color_palette=f"tag://visual/color/{self._slugify(analysis.get('color_palette', 'unknown')[:50])}",
                technique=f"tag://technique/{self._slugify(analysis.get('technique', 'unknown')[:50])}",
                mood=f"tag://visual/mood/{self._slugify(analysis.get('mood', 'unknown')[:50])}",
                subject=f"tag://visual/subject/{self._slugify(analysis.get('subject', 'unknown')[:50])}"
            )

            logger.info(f"Visual analysis completed for artwork {artwork_id}")
            return visual_description, visual_tags, image_refs

        except Exception as e:
            logger.error(f"Failed to analyze images: {e}")
            return "", VisualTags(), image_refs

    def _slugify(self, text: str) -> str:
        """Convert text to URL-safe slug"""
        if not text:
            return "unknown"
        # Replace spaces and special chars with dashes
        slug = re.sub(r'[^\w\s-]', '', text.lower())
        slug = re.sub(r'[-\s]+', '-', slug).strip('-')
        return slug[:50] if slug else "unknown"

    def _generate_url_markers(self, artwork: Dict[str, Any]) -> Tuple[str, str]:
        """Generate URL markers for artwork"""
        artwork_id = artwork["id"]
        artwork_ref = f"artwork://{artwork_id}"
        artwork_url = f"/api/v1/exhibition/artworks/{artwork_id}"
        return artwork_ref, artwork_url

    def _apply_input_perturbation(self, text: str) -> Tuple[str, int]:
        """
        Apply input length perturbation (1-20 characters)
        Returns modified text and variation amount
        """
        variation = random.randint(*PERTURBATION_CONFIG["input_length_variation"])
        # Add random padding characters to create variation
        padding = " " * variation
        return text + padding, variation

    def _should_inject_conflict(self) -> bool:
        """Check if conflict should be injected based on rate"""
        return random.random() < PERTURBATION_CONFIG["conflict_injection_rate"]

    def _select_participants(
        self,
        num_participants: int = 3,
        required_ids: Optional[List[str]] = None
    ) -> List[Persona]:
        """Select diverse participants for the dialogue"""
        if required_ids:
            return [get_persona(pid) for pid in required_ids]

        # Strategy: mix Eastern and Western, traditional and modern
        personas = [p for p in PERSONAS if p.id != "basic"]

        # Ensure diversity
        eastern = [p for p in personas if p.region and ("China" in p.region or "Japan" in p.region)]
        western = [p for p in personas if p not in eastern]

        selected = []

        # Pick at least one from each if possible
        if eastern and len(selected) < num_participants:
            selected.append(random.choice(eastern))
        if western and len(selected) < num_participants:
            selected.append(random.choice(western))

        # Fill remaining slots randomly
        remaining = [p for p in personas if p not in selected]
        while len(selected) < num_participants and remaining:
            pick = random.choice(remaining)
            selected.append(pick)
            remaining.remove(pick)

        return selected

    def _build_artwork_context(
        self,
        artwork: Dict[str, Any],
        artist: Optional[Dict[str, Any]] = None,
        visual_analysis: str = "",
        visual_tags: Optional[VisualTags] = None
    ) -> str:
        """Build artwork context for all agents, including visual analysis"""
        context_parts = []

        context_parts.append(f"**Title**: {artwork.get('title', 'Untitled')}")
        context_parts.append(f"**Chapter/Theme**: {artwork.get('chapter_name', '')}")

        if artwork.get('medium'):
            context_parts.append(f"**Medium**: {artwork['medium']}")
        if artwork.get('material'):
            context_parts.append(f"**Material**: {artwork['material']}")
        if artwork.get('categories'):
            context_parts.append(f"**Categories**: {artwork['categories']}")
        if artwork.get('create_year'):
            context_parts.append(f"**Year**: {artwork['create_year']}")

        if artwork.get('description'):
            context_parts.append(f"\n**Artist's Description**:\n{artwork['description']}")

        if artist:
            name = f"{artist.get('first_name', '')} {artist.get('last_name', '')}".strip()
            context_parts.append(f"\n**Artist**: {name}")
            if artist.get('school'):
                context_parts.append(f"**School**: {artist['school']}")
            if artist.get('bio'):
                context_parts.append(f"**Bio**: {artist['bio'][:500]}...")

        # Inject visual analysis (multimodal)
        if visual_analysis:
            context_parts.append(f"\n**Visual Analysis (from image)**:\n{visual_analysis}")

        # Inject visual tags as references
        if visual_tags:
            context_parts.append(f"\n**Visual Tags**:")
            context_parts.append(f"  - Composition: {visual_tags.composition}")
            context_parts.append(f"  - Color: {visual_tags.color_palette}")
            context_parts.append(f"  - Technique: {visual_tags.technique}")
            context_parts.append(f"  - Mood: {visual_tags.mood}")
            context_parts.append(f"  - Subject: {visual_tags.subject}")

        return "\n".join(context_parts)

    async def generate_dialogue(
        self,
        artwork: Dict[str, Any],
        artist: Optional[Dict[str, Any]] = None,
        participant_ids: Optional[List[str]] = None,
        num_participants: int = 3,
        num_turns: int = 6,
        temperature: float = 1.0,
        include_images: bool = True,
        max_images: int = 3
    ) -> MultiAgentDialogue:
        """
        Generate a multi-agent dialogue about an artwork with multimodal support

        Args:
            artwork: Artwork data
            artist: Artist data (optional)
            participant_ids: Specific persona IDs to include
            num_participants: Number of participants if not specified
            num_turns: Target number of dialogue turns
            temperature: Base temperature (will be varied by perturbation)
            include_images: Whether to analyze images (multimodal)
            max_images: Maximum images to analyze

        Returns:
            MultiAgentDialogue with all turns
        """
        # Generate URL markers
        artwork_ref, artwork_url = self._generate_url_markers(artwork)

        # Get image URLs
        image_urls = artwork.get("image_urls", [])
        if isinstance(image_urls, str):
            image_urls = [u.strip() for u in image_urls.split(",") if u.strip()]
        primary_image = image_urls[0] if image_urls else ""

        # Step 1: Analyze images (multimodal)
        visual_analysis = ""
        visual_tags = None
        image_refs = []
        image_analyzed = False

        if include_images and image_urls:
            logger.info(f"Analyzing images for artwork {artwork['id']}...")
            visual_analysis, visual_tags, image_refs = await self._analyze_images(artwork, max_images)
            image_analyzed = bool(visual_analysis)
            if image_analyzed:
                logger.info(f"Visual analysis completed: {len(visual_analysis)} chars")

        # Select participants
        participants = self._select_participants(num_participants, participant_ids)

        # Create agents for each participant
        agents = {
            p.id: PersonaAgent(p, self.client, self.model)
            for p in participants
        }

        # Build artwork context with visual analysis injected
        artwork_context = self._build_artwork_context(
            artwork, artist, visual_analysis, visual_tags
        )

        # Apply input perturbation
        artwork_context, input_variation = self._apply_input_perturbation(artwork_context)

        # Determine temperature with perturbation
        temp_min, temp_max = PERTURBATION_CONFIG["temperature_range"]
        actual_temp = random.uniform(temp_min, temp_max)

        # Determine if conflict should be injected
        conflict_injected = self._should_inject_conflict()

        # Create perturbation config
        perturbation_config = PerturbationConfig(
            temperature=actual_temp,
            input_variation=input_variation,
            conflict_injected=conflict_injected
        )

        # Create dialogue object with all new fields
        dialogue = MultiAgentDialogue(
            artwork_id=artwork["id"],
            artwork_url=artwork_url,
            artwork_title=artwork.get("title", ""),
            image_url=primary_image,
            # New URL markers
            artwork_ref=artwork_ref,
            image_refs=image_refs,
            # Multimodal fields
            image_analyzed=image_analyzed,
            visual_analysis=visual_analysis,
            visual_tags=visual_tags,
            # Participants
            participants=[p.id for p in participants],
            participant_names=[p.name for p in participants],
            topic=f"Discussion of '{artwork.get('title', 'this artwork')}'",
            # Generation config
            model_used=self.model,
            temperature=actual_temp,
            perturbation_config=perturbation_config
        )

        logger.info(f"Generating {num_turns}-turn dialogue for artwork {artwork['id']}")
        logger.info(f"Participants: {[p.name for p in participants]}")
        logger.info(f"Config: temp={actual_temp:.2f}, conflict={conflict_injected}, image_analyzed={image_analyzed}")

        # Generate turns
        turns: List[DialogueTurn] = []
        speaker_order = list(agents.keys())

        for i in range(num_turns):
            # Vary temperature slightly for diversity
            turn_temp = actual_temp + random.uniform(-0.1, 0.1)
            turn_temp = max(0.7, min(1.0, turn_temp))  # Keep in Claude's valid range

            # Select next speaker (rotate with some randomness)
            if i == 0:
                # First speaker is random
                speaker_id = random.choice(speaker_order)
            else:
                # Avoid same speaker twice in a row
                last_speaker = turns[-1].speaker_id
                available = [s for s in speaker_order if s != last_speaker]
                speaker_id = random.choice(available)

            agent = agents[speaker_id]

            # Inject conflict hint if configured
            conflict_hint = ""
            if conflict_injected and i > 0 and i % 2 == 0:
                conflict_hint = "\n[Note: Feel free to challenge or disagree with previous points if you have a different perspective]"

            try:
                turn = await agent.generate_response(
                    artwork_context=artwork_context + conflict_hint,
                    dialogue_history=turns,
                    temperature=turn_temp
                )
                dialogue.add_turn(turn)
                turns.append(turn)

                logger.info(f"Turn {i+1}: {turn.speaker_name} ({turn.stance}, {turn.language})")

                # Small delay for rate limiting
                await asyncio.sleep(0.5)

            except Exception as e:
                logger.error(f"Failed to generate turn {i+1} for {speaker_id}: {e}")
                continue

        # Ensure we have at least some turns
        if not dialogue.turns:
            raise ValueError("Failed to generate any dialogue turns")

        return dialogue


async def generate_all_artwork_dialogues(
    artworks: List[Dict[str, Any]],
    artists: Dict[int, Dict[str, Any]],
    output_callback=None,
    num_participants: int = 3,
    num_turns: int = 6,
    delay_between: float = 2.0
) -> List[MultiAgentDialogue]:
    """
    Generate dialogues for all artworks

    Args:
        artworks: List of artwork data
        artists: Dict mapping artist_id to artist data
        output_callback: Optional callback for each completed dialogue
        num_participants: Participants per dialogue
        num_turns: Turns per dialogue
        delay_between: Delay between artworks

    Returns:
        List of generated dialogues
    """
    generator = MultiAgentDialogueGenerator()
    dialogues = []

    for i, artwork in enumerate(artworks):
        logger.info(f"\n[{i+1}/{len(artworks)}] Processing: {artwork.get('title', 'Unknown')}")

        artist = artists.get(artwork.get("artist_id"))

        try:
            dialogue = await generator.generate_dialogue(
                artwork=artwork,
                artist=artist,
                num_participants=num_participants,
                num_turns=num_turns,
                temperature=random.uniform(0.9, 1.1)  # Vary temperature
            )

            dialogues.append(dialogue)

            if output_callback:
                output_callback(dialogue)

            logger.info(f"Generated {dialogue.total_turns} turns, {dialogue.conflict_moments} conflicts")

        except Exception as e:
            logger.error(f"Failed to generate dialogue for artwork {artwork['id']}: {e}")

        # Delay between artworks
        if i < len(artworks) - 1:
            await asyncio.sleep(delay_between)

    return dialogues
