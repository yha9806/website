"""
LanceDB Service for Exhibition Data
"""
import os
import json
import logging
from datetime import datetime
from typing import List, Optional, Dict, Any
from pathlib import Path

import lancedb
from sentence_transformers import SentenceTransformer

from ..models import Artwork, ArtworkCreate, Artist, ArtistCreate, Conversation, ConversationCreate
from ..models.dialogue import MultiAgentDialogue, DialogueTurn

logger = logging.getLogger(__name__)


class LanceDBService:
    """Service for managing exhibition data in LanceDB"""

    def __init__(
        self,
        db_path: str = "data/exhibition",
        embedding_model: str = "all-MiniLM-L6-v2"
    ):
        self.db_path = Path(db_path)
        self.db_path.mkdir(parents=True, exist_ok=True)

        # Initialize LanceDB
        self.db = lancedb.connect(str(self.db_path))

        # Initialize embedding model (lazy load)
        self._embedding_model_name = embedding_model
        self._embedding_model = None

        # Table names
        self.ARTWORKS_TABLE = "artworks"
        self.ARTISTS_TABLE = "artists"
        self.CONVERSATIONS_TABLE = "conversations"
        self.DIALOGUES_TABLE = "dialogues"  # New: multi-agent dialogues

    @property
    def embedding_model(self) -> SentenceTransformer:
        """Lazy load embedding model"""
        if self._embedding_model is None:
            logger.info(f"Loading embedding model: {self._embedding_model_name} (CPU mode)")
            # Force CPU to avoid CUDA errors in WSL2 environment
            self._embedding_model = SentenceTransformer(self._embedding_model_name, device="cpu")
        return self._embedding_model

    def _generate_embedding(self, text: str) -> List[float]:
        """Generate embedding for text"""
        if not text:
            return [0.0] * 384  # Default dimension for MiniLM
        return self.embedding_model.encode(text).tolist()

    # ==================== Artwork Operations ====================

    def create_artworks_table(self, artworks: List[ArtworkCreate]) -> None:
        """Create or overwrite artworks table"""
        records = []
        for artwork in artworks:
            # Generate embedding from title + description
            text = f"{artwork.title}. {artwork.description}"
            vector = self._generate_embedding(text)

            record = Artwork(
                **artwork.model_dump(),
                vector=vector
            )
            records.append(record.model_dump())

        if self.ARTWORKS_TABLE in self.db.table_names():
            self.db.drop_table(self.ARTWORKS_TABLE)

        self.db.create_table(self.ARTWORKS_TABLE, records)
        logger.info(f"Created artworks table with {len(records)} records")

    def get_artwork(self, artwork_id: int) -> Optional[Dict[str, Any]]:
        """Get artwork by ID"""
        table = self.db.open_table(self.ARTWORKS_TABLE)
        results = table.search().where(f"id = {artwork_id}").limit(1).to_list()
        return results[0] if results else None

    def get_artworks(
        self,
        chapter_name: Optional[str] = None,
        limit: int = 100,
        offset: int = 0
    ) -> List[Dict[str, Any]]:
        """Get artworks with optional filtering"""
        table = self.db.open_table(self.ARTWORKS_TABLE)
        query = table.search()

        if chapter_name:
            query = query.where(f"chapter_name = '{chapter_name}'")

        return query.limit(limit + offset).to_list()[offset:]

    def search_artworks(
        self,
        query: str,
        limit: int = 10
    ) -> List[Dict[str, Any]]:
        """Semantic search for artworks"""
        vector = self._generate_embedding(query)
        table = self.db.open_table(self.ARTWORKS_TABLE)
        return table.search(vector).limit(limit).to_list()

    # ==================== Artist Operations ====================

    def create_artists_table(self, artists: List[ArtistCreate]) -> None:
        """Create or overwrite artists table"""
        records = []
        for artist in artists:
            # Generate embedding from profile + bio
            text = f"{artist.first_name} {artist.last_name}. {artist.profile}. {artist.bio}"
            vector = self._generate_embedding(text)

            record = Artist(
                **artist.model_dump(),
                vector=vector
            )
            records.append(record.model_dump())

        if self.ARTISTS_TABLE in self.db.table_names():
            self.db.drop_table(self.ARTISTS_TABLE)

        self.db.create_table(self.ARTISTS_TABLE, records)
        logger.info(f"Created artists table with {len(records)} records")

    def get_artist(self, artist_id: int) -> Optional[Dict[str, Any]]:
        """Get artist by ID"""
        table = self.db.open_table(self.ARTISTS_TABLE)
        results = table.search().where(f"id = {artist_id}").limit(1).to_list()
        return results[0] if results else None

    def get_artists(self, limit: int = 100) -> List[Dict[str, Any]]:
        """Get all artists"""
        table = self.db.open_table(self.ARTISTS_TABLE)
        return table.search().limit(limit).to_list()

    # ==================== Conversation Operations ====================

    def create_conversations_table(self) -> None:
        """Create empty conversations table if not exists"""
        if self.CONVERSATIONS_TABLE not in self.db.table_names():
            # Create with a dummy record then delete
            dummy = Conversation(
                id="dummy",
                artwork_id=0,
                persona_id="basic",
                persona_name="Basic",
                text_segments=[],
                structured_analysis={},
                vector=[0.0] * 384
            )
            self.db.create_table(self.CONVERSATIONS_TABLE, [dummy.model_dump()])
            # Delete dummy
            table = self.db.open_table(self.CONVERSATIONS_TABLE)
            table.delete("id = 'dummy'")
            logger.info("Created empty conversations table")

    def add_conversation(self, conversation: ConversationCreate) -> str:
        """Add a new conversation"""
        # Generate embedding from text segments
        text = " ".join(conversation.text_segments)
        vector = self._generate_embedding(text)

        record = Conversation(
            **conversation.model_dump(),
            vector=vector
        )

        # Convert to dict and serialize complex fields as JSON strings
        record_dict = record.model_dump()
        record_dict["text_segments_json"] = json.dumps(record_dict.pop("text_segments"))
        record_dict["structured_analysis_json"] = json.dumps(record_dict.pop("structured_analysis"))

        # Create table if not exists with first record
        if self.CONVERSATIONS_TABLE not in self.db.table_names():
            self.db.create_table(self.CONVERSATIONS_TABLE, [record_dict])
        else:
            table = self.db.open_table(self.CONVERSATIONS_TABLE)
            table.add([record_dict])

        logger.info(f"Added conversation {record.id} for artwork {conversation.artwork_id}")
        return record.id

    def _deserialize_conversation(self, record: Dict[str, Any]) -> Dict[str, Any]:
        """Deserialize JSON fields in conversation record"""
        if "text_segments_json" in record:
            record["text_segments"] = json.loads(record.pop("text_segments_json"))
        if "structured_analysis_json" in record:
            record["structured_analysis"] = json.loads(record.pop("structured_analysis_json"))
        return record

    def get_conversations_for_artwork(
        self,
        artwork_id: int,
        persona_id: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """Get conversations for an artwork"""
        if self.CONVERSATIONS_TABLE not in self.db.table_names():
            return []
        table = self.db.open_table(self.CONVERSATIONS_TABLE)
        query = table.search().where(f"artwork_id = {artwork_id}")

        if persona_id:
            query = query.where(f"persona_id = '{persona_id}'")

        results = query.limit(100).to_list()
        return [self._deserialize_conversation(r) for r in results]

    def search_conversations(
        self,
        query: str,
        limit: int = 10
    ) -> List[Dict[str, Any]]:
        """Semantic search for conversations"""
        if self.CONVERSATIONS_TABLE not in self.db.table_names():
            return []
        vector = self._generate_embedding(query)
        table = self.db.open_table(self.CONVERSATIONS_TABLE)
        results = table.search(vector).limit(limit).to_list()
        return [self._deserialize_conversation(r) for r in results]

    def conversation_exists(self, artwork_id: int, persona_id: str) -> bool:
        """Check if conversation exists for artwork + persona"""
        if self.CONVERSATIONS_TABLE not in self.db.table_names():
            return False
        table = self.db.open_table(self.CONVERSATIONS_TABLE)
        results = table.search().where(
            f"artwork_id = {artwork_id} AND persona_id = '{persona_id}'"
        ).limit(1).to_list()
        return len(results) > 0

    # ==================== Utility Operations ====================

    def get_chapters(self) -> List[Dict[str, Any]]:
        """Get unique chapters from artworks"""
        table = self.db.open_table(self.ARTWORKS_TABLE)
        artworks = table.search().limit(1000).to_list()

        chapters = {}
        for artwork in artworks:
            chapter_id = artwork.get("chapter_id")
            chapter_name = artwork.get("chapter_name")
            if chapter_id not in chapters:
                chapters[chapter_id] = {
                    "id": chapter_id,
                    "name": chapter_name,
                    "count": 0
                }
            chapters[chapter_id]["count"] += 1

        return list(chapters.values())

    def get_stats(self) -> Dict[str, Any]:
        """Get database statistics"""
        stats = {
            "artworks_count": 0,
            "artists_count": 0,
            "conversations_count": 0,
            "tables": self.db.table_names()
        }

        if self.ARTWORKS_TABLE in self.db.table_names():
            table = self.db.open_table(self.ARTWORKS_TABLE)
            stats["artworks_count"] = len(table.search().limit(10000).to_list())

        if self.ARTISTS_TABLE in self.db.table_names():
            table = self.db.open_table(self.ARTISTS_TABLE)
            stats["artists_count"] = len(table.search().limit(10000).to_list())

        if self.CONVERSATIONS_TABLE in self.db.table_names():
            table = self.db.open_table(self.CONVERSATIONS_TABLE)
            stats["conversations_count"] = len(table.search().limit(10000).to_list())

        if self.DIALOGUES_TABLE in self.db.table_names():
            table = self.db.open_table(self.DIALOGUES_TABLE)
            stats["dialogues_count"] = len(table.search().limit(10000).to_list())

        return stats

    # ==================== Multi-Agent Dialogue Operations ====================

    def add_dialogue(self, dialogue: MultiAgentDialogue) -> str:
        """Add a new multi-agent dialogue"""
        # Generate embedding from all dialogue content
        all_content = " ".join([t.content for t in dialogue.turns])
        vector = self._generate_embedding(all_content)

        # Serialize complex fields
        record = {
            "id": dialogue.id,
            "artwork_id": dialogue.artwork_id,
            "artwork_url": dialogue.artwork_url,
            "artwork_title": dialogue.artwork_title,
            "image_url": dialogue.image_url,
            "participants_json": json.dumps(dialogue.participants),
            "participant_names_json": json.dumps(dialogue.participant_names),
            "topic": dialogue.topic,
            "turns_json": json.dumps([t.model_dump() for t in dialogue.turns], default=str),
            "total_turns": dialogue.total_turns,
            "languages_json": json.dumps(dialogue.languages_used),
            "conflict_moments": dialogue.conflict_moments,
            "model_used": dialogue.model_used,
            "temperature": dialogue.temperature,
            "created_at": dialogue.created_at.isoformat(),
            "vector": vector,
            # New multimodal fields
            "image_analyzed": dialogue.image_analyzed,
            "visual_analysis": dialogue.visual_analysis,
            "visual_tags_json": json.dumps(dialogue.visual_tags.model_dump() if dialogue.visual_tags else {}),
            "image_refs_json": json.dumps(dialogue.image_refs),
            "perturbation_config_json": json.dumps(dialogue.perturbation_config.model_dump() if dialogue.perturbation_config else {})
        }

        # Create table if not exists
        if self.DIALOGUES_TABLE not in self.db.table_names():
            self.db.create_table(self.DIALOGUES_TABLE, [record])
        else:
            table = self.db.open_table(self.DIALOGUES_TABLE)
            table.add([record])

        logger.info(f"Added dialogue {dialogue.id} for artwork {dialogue.artwork_id}")
        return dialogue.id

    def _deserialize_dialogue(self, record: Dict[str, Any]) -> Dict[str, Any]:
        """Deserialize JSON fields in dialogue record"""
        if "participants_json" in record:
            record["participants"] = json.loads(record.pop("participants_json"))
        if "participant_names_json" in record:
            record["participant_names"] = json.loads(record.pop("participant_names_json"))
        if "turns_json" in record:
            record["turns"] = json.loads(record.pop("turns_json"))
        if "languages_json" in record:
            record["languages_used"] = json.loads(record.pop("languages_json"))
        # New multimodal fields
        if "visual_tags_json" in record:
            record["visual_tags"] = json.loads(record.pop("visual_tags_json"))
        if "image_refs_json" in record:
            record["image_refs"] = json.loads(record.pop("image_refs_json"))
        if "perturbation_config_json" in record:
            record["perturbation_config"] = json.loads(record.pop("perturbation_config_json"))
        return record

    def get_dialogues_for_artwork(self, artwork_id: int) -> List[Dict[str, Any]]:
        """Get all dialogues for an artwork"""
        if self.DIALOGUES_TABLE not in self.db.table_names():
            return []
        table = self.db.open_table(self.DIALOGUES_TABLE)
        results = table.search().where(f"artwork_id = {artwork_id}").limit(100).to_list()
        return [self._deserialize_dialogue(r) for r in results]

    def get_dialogue(self, dialogue_id: str) -> Optional[Dict[str, Any]]:
        """Get a single dialogue by ID"""
        if self.DIALOGUES_TABLE not in self.db.table_names():
            return None
        table = self.db.open_table(self.DIALOGUES_TABLE)
        results = table.search().where(f"id = '{dialogue_id}'").limit(1).to_list()
        if results:
            return self._deserialize_dialogue(results[0])
        return None

    def search_dialogues(self, query: str, limit: int = 10) -> List[Dict[str, Any]]:
        """Semantic search for dialogues"""
        if self.DIALOGUES_TABLE not in self.db.table_names():
            return []
        vector = self._generate_embedding(query)
        table = self.db.open_table(self.DIALOGUES_TABLE)
        results = table.search(vector).limit(limit).to_list()
        return [self._deserialize_dialogue(r) for r in results]

    def get_all_dialogues(self, limit: int = 1000) -> List[Dict[str, Any]]:
        """Get all dialogues"""
        if self.DIALOGUES_TABLE not in self.db.table_names():
            return []
        table = self.db.open_table(self.DIALOGUES_TABLE)
        results = table.search().limit(limit).to_list()
        return [self._deserialize_dialogue(r) for r in results]

    def dialogue_exists_for_artwork(self, artwork_id: int) -> bool:
        """Check if a dialogue exists for artwork"""
        if self.DIALOGUES_TABLE not in self.db.table_names():
            return False
        table = self.db.open_table(self.DIALOGUES_TABLE)
        results = table.search().where(f"artwork_id = {artwork_id}").limit(1).to_list()
        return len(results) > 0
