"""
Multi-Agent Dialogue Models for Art Discussion
Each persona is represented by an independent agent
"""
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field
from datetime import datetime
import uuid


class DialogueTurn(BaseModel):
    """Single turn in a multi-agent dialogue"""
    turn_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    speaker_id: str                    # Persona ID (su_shi, john_ruskin, etc.)
    speaker_name: str                  # Display name
    content: str                       # The actual speech content
    language: str = "en"               # Language code (zh, en, ja, ru, etc.)
    chain_of_thought: str = ""         # Internal reasoning process
    stance: str = "neutral"            # agree/disagree/neutral/challenge/elaborate
    responds_to: Optional[str] = None  # Which turn_id this responds to
    references: List[str] = Field(default_factory=list)  # Informal references/quotes
    timestamp: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        json_schema_extra = {
            "example": {
                "turn_id": "uuid",
                "speaker_id": "su_shi",
                "speaker_name": "苏轼",
                "content": "观此作品，神韵胜于形似...",
                "language": "zh",
                "chain_of_thought": "此作融合传统与现代...",
                "stance": "elaborate",
                "references": ["《东坡题跋》"]
            }
        }


class VisualTags(BaseModel):
    """URL-formatted visual tags from image analysis"""
    composition: str = ""              # tag://visual/composition/...
    color_palette: str = ""            # tag://visual/color/...
    technique: str = ""                # tag://technique/...
    mood: str = ""                     # tag://visual/mood/...
    subject: str = ""                  # tag://visual/subject/...


class PerturbationConfig(BaseModel):
    """Configuration for input perturbation"""
    temperature: float = 1.0           # Actual temperature used
    input_variation: int = 0           # Input length variation applied
    conflict_injected: bool = False    # Whether conflict was injected


class MultiAgentDialogue(BaseModel):
    """Complete multi-agent dialogue about an artwork"""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    artwork_id: int
    artwork_url: str = ""              # /api/v1/exhibition/artworks/{id}
    artwork_title: str = ""
    image_url: str = ""                # Primary image URL

    # URL markers (new)
    artwork_ref: str = ""              # artwork://1759494368418
    image_refs: List[str] = Field(default_factory=list)  # ["image://1759494368418/0", ...]

    # Multimodal analysis (new)
    image_analyzed: bool = False       # Whether images were analyzed
    visual_analysis: str = ""          # Visual analysis text from Claude Vision
    visual_tags: Optional[VisualTags] = None  # URL-formatted visual tags

    # Participants
    participants: List[str] = Field(default_factory=list)  # List of persona IDs
    participant_names: List[str] = Field(default_factory=list)  # Display names

    # Dialogue content
    topic: str = ""                    # Discussion topic/focus
    turns: List[DialogueTurn] = Field(default_factory=list)

    # Metadata
    total_turns: int = 0
    languages_used: List[str] = Field(default_factory=list)
    conflict_moments: int = 0          # Number of disagreements

    # Generation config (enhanced)
    model_used: str = ""
    temperature: float = 1.0
    perturbation_config: Optional[PerturbationConfig] = None  # Perturbation settings
    created_at: datetime = Field(default_factory=datetime.utcnow)

    def add_turn(self, turn: DialogueTurn):
        """Add a turn and update metadata"""
        self.turns.append(turn)
        self.total_turns = len(self.turns)
        if turn.language not in self.languages_used:
            self.languages_used.append(turn.language)
        if turn.stance in ["disagree", "challenge"]:
            self.conflict_moments += 1

    class Config:
        json_schema_extra = {
            "example": {
                "id": "uuid",
                "artwork_id": 1759494368418,
                "artwork_url": "/api/v1/exhibition/artworks/1759494368418",
                "participants": ["su_shi", "john_ruskin", "dr_aris_thorne"],
                "topic": "传统与现代的融合",
                "total_turns": 6,
                "conflict_moments": 2
            }
        }


class DialogueCreate(BaseModel):
    """Input for creating a dialogue"""
    artwork_id: int
    participants: List[str]  # Persona IDs to include
    num_turns: int = 6       # Target number of turns
    temperature: float = 1.0
