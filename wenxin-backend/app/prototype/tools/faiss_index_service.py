"""FaissIndexService — FAISS-based semantic search for VULCA samples and terminology.

Lazy-loads sentence-transformers and faiss-cpu on first use. Falls back gracefully
when either dependency is unavailable (available == False).
"""

from __future__ import annotations

import json
import logging
from dataclasses import dataclass
from pathlib import Path

import numpy as np

logger = logging.getLogger(__name__)

_DATA_DIR = Path(__file__).resolve().parent.parent / "data"
_SAMPLE_INDEX_FILE = _DATA_DIR / "samples" / "index.v1.json"
_TERMS_FILE = _DATA_DIR / "terminology" / "terms.v1.json"


@dataclass
class _FaissHit:
    """Internal hit result from FAISS search."""

    doc_id: str
    similarity: float  # cosine similarity [0, 1]
    tradition: str
    text_snippet: str


class FaissIndexService:
    """Semantic search over VULCA samples and terminology using FAISS + MiniLM.

    Also provides CLIP ViT-B/32 visual search via search_by_visual().

    Usage::

        svc = FaissIndexService()
        if svc.available:
            hits = svc.search_samples("ink wash landscape", "chinese_xieyi", top_k=5)
        if svc.clip_available:
            hits = svc.search_by_visual("a misty mountain landscape", "chinese_xieyi")
    """

    def __init__(self) -> None:
        self._model = None
        self._clip_model = None
        self._faiss = None

        # Sample index state (MiniLM)
        self._sample_index = None
        self._sample_ids: list[str] = []
        self._sample_traditions: list[str] = []
        self._sample_texts: list[str] = []

        # Sample visual index state (CLIP)
        self._visual_index = None
        self._visual_sample_ids: list[str] = []
        self._visual_sample_traditions: list[str] = []
        self._visual_sample_texts: list[str] = []

        # Term index state
        self._term_index = None
        self._term_ids: list[str] = []
        self._term_traditions: list[str] = []
        self._term_texts: list[str] = []

        # Trajectory index state
        self._trajectory_index = None
        self._trajectory_records: list = []

        self._initialized = False
        self._clip_initialized = False
        self._available: bool | None = None
        self._clip_available: bool | None = None

    @property
    def available(self) -> bool:
        """Check whether faiss-cpu and sentence-transformers are importable."""
        if self._available is not None:
            return self._available
        try:
            import faiss  # noqa: F401
            import sentence_transformers  # noqa: F401
            self._available = True
        except ImportError:
            self._available = False
        return self._available

    @property
    def clip_available(self) -> bool:
        """Check if CLIP model can be loaded (via sentence-transformers)."""
        if self._clip_available is not None:
            return self._clip_available
        try:
            import faiss  # noqa: F401
            from sentence_transformers import SentenceTransformer  # noqa: F401
            self._clip_available = True
        except ImportError:
            self._clip_available = False
        return self._clip_available

    def _lazy_init(self) -> None:
        """Load model and build indices on first use."""
        if self._initialized:
            return
        self._initialized = True

        if not self.available:
            return

        import faiss
        from sentence_transformers import SentenceTransformer

        # Load model (lazy, ~80MB download on first call)
        logger.info("Loading sentence-transformers model all-MiniLM-L6-v2 ...")
        self._model = SentenceTransformer("all-MiniLM-L6-v2")
        self._faiss = faiss

        # Build sample index
        self._build_sample_index()
        # Build term index
        self._build_term_index()

    def _build_sample_index(self) -> None:
        """Build FAISS IndexFlatIP over sample embeddings."""
        with open(_SAMPLE_INDEX_FILE, encoding="utf-8") as f:
            data = json.load(f)

        for sample in data["samples"]:
            sid = sample["sample_id"]
            tradition = sample["cultural_tradition"]
            subject_en = sample.get("subject_en", "")
            subject_zh = sample.get("subject_zh", "")
            tags = " ".join(sample.get("tags", []))
            text = f"{subject_en} {subject_zh} {tags}"

            self._sample_ids.append(sid)
            self._sample_traditions.append(tradition)
            self._sample_texts.append(text)

        if not self._sample_texts:
            return

        embeddings = self._model.encode(self._sample_texts, normalize_embeddings=True)
        embeddings = np.asarray(embeddings, dtype=np.float32)

        dim = embeddings.shape[1]
        self._sample_index = self._faiss.IndexFlatIP(dim)
        self._sample_index.add(embeddings)
        logger.info("FAISS sample index built: %d vectors, dim=%d", len(self._sample_ids), dim)

    def _build_term_index(self) -> None:
        """Build FAISS IndexFlatIP over terminology embeddings."""
        with open(_TERMS_FILE, encoding="utf-8") as f:
            data = json.load(f)

        for tradition_key, info in data.get("traditions", {}).items():
            for entry in info.get("terms", []):
                tid = entry["id"]
                term_en = entry.get("term_en", "")
                definition = entry.get("definition", "")
                aliases = " ".join(entry.get("aliases", []))
                text = f"{term_en} {definition} {aliases}"

                self._term_ids.append(tid)
                self._term_traditions.append(tradition_key)
                self._term_texts.append(text)

        if not self._term_texts:
            return

        embeddings = self._model.encode(self._term_texts, normalize_embeddings=True)
        embeddings = np.asarray(embeddings, dtype=np.float32)

        dim = embeddings.shape[1]
        self._term_index = self._faiss.IndexFlatIP(dim)
        self._term_index.add(embeddings)
        logger.info("FAISS term index built: %d vectors, dim=%d", len(self._term_ids), dim)

    def search_samples(
        self,
        query: str,
        tradition: str,
        top_k: int = 5,
    ) -> list[_FaissHit]:
        """Semantic search over sample index, filtered by tradition (with default fallback)."""
        self._lazy_init()
        if self._sample_index is None or self._model is None:
            return []

        q_emb = self._model.encode([query], normalize_embeddings=True)
        q_emb = np.asarray(q_emb, dtype=np.float32)

        # Search more than top_k to allow tradition filtering
        search_k = min(len(self._sample_ids), top_k * 3)
        scores, indices = self._sample_index.search(q_emb, search_k)

        hits: list[_FaissHit] = []
        for score, idx in zip(scores[0], indices[0]):
            if idx < 0:
                continue
            sid = self._sample_ids[idx]
            trad = self._sample_traditions[idx]
            # Filter: same tradition or default
            if trad != tradition and trad != "default" and tradition != "default":
                continue
            hits.append(_FaissHit(
                doc_id=sid,
                similarity=float(max(0.0, min(1.0, score))),
                tradition=trad,
                text_snippet=self._sample_texts[idx][:120],
            ))
            if len(hits) >= top_k:
                break

        return hits

    # ------------------------------------------------------------------
    # CLIP visual search
    # ------------------------------------------------------------------

    def _lazy_init_clip(self) -> None:
        """Load CLIP model and build visual sample index on first use."""
        if self._clip_initialized:
            return
        self._clip_initialized = True

        if not self.clip_available:
            return

        import faiss
        from sentence_transformers import SentenceTransformer

        logger.info("Loading CLIP ViT-B/32 model ...")
        self._clip_model = SentenceTransformer("clip-ViT-B-32")

        # Build visual index over sample texts (text-to-image cross-modal)
        with open(_SAMPLE_INDEX_FILE, encoding="utf-8") as f:
            data = json.load(f)

        for sample in data["samples"]:
            sid = sample["sample_id"]
            tradition = sample["cultural_tradition"]
            subject_en = sample.get("subject_en", "")
            subject_zh = sample.get("subject_zh", "")
            tags = " ".join(sample.get("tags", []))
            text = f"{subject_en} {subject_zh} {tags}"

            self._visual_sample_ids.append(sid)
            self._visual_sample_traditions.append(tradition)
            self._visual_sample_texts.append(text)

        if not self._visual_sample_texts:
            return

        embeddings = self._clip_model.encode(
            self._visual_sample_texts, normalize_embeddings=True,
        )
        embeddings = np.asarray(embeddings, dtype=np.float32)

        dim = embeddings.shape[1]  # 512 for CLIP ViT-B/32
        self._visual_index = faiss.IndexFlatIP(dim)
        self._visual_index.add(embeddings)
        logger.info(
            "CLIP visual index built: %d vectors, dim=%d",
            len(self._visual_sample_ids), dim,
        )

    def search_by_visual(
        self,
        query_text: str,
        tradition: str,
        top_k: int = 5,
    ) -> list[_FaissHit]:
        """Text-to-image cross-modal search using CLIP embeddings.

        Encodes the query text with CLIP and searches against CLIP-encoded
        sample descriptions. This captures visual-semantic similarity that
        MiniLM text search may miss.
        """
        self._lazy_init_clip()
        if self._visual_index is None or self._clip_model is None:
            return []

        q_emb = self._clip_model.encode([query_text], normalize_embeddings=True)
        q_emb = np.asarray(q_emb, dtype=np.float32)

        search_k = min(len(self._visual_sample_ids), top_k * 3)
        scores, indices = self._visual_index.search(q_emb, search_k)

        hits: list[_FaissHit] = []
        for score, idx in zip(scores[0], indices[0]):
            if idx < 0:
                continue
            sid = self._visual_sample_ids[idx]
            trad = self._visual_sample_traditions[idx]
            if trad != tradition and trad != "default" and tradition != "default":
                continue
            hits.append(_FaissHit(
                doc_id=sid,
                similarity=float(max(0.0, min(1.0, score))),
                tradition=trad,
                text_snippet=self._visual_sample_texts[idx][:120],
            ))
            if len(hits) >= top_k:
                break

        return hits

    # ------------------------------------------------------------------
    # Layer 2: Trajectory search
    # ------------------------------------------------------------------

    def build_trajectory_index(self, records: list) -> int:
        """Build a FAISS index over trajectory search texts.

        Parameters
        ----------
        records : list[TrajectoryRecord]
            Trajectory records to index.

        Returns
        -------
        int
            Number of records indexed.
        """
        self._lazy_init()
        if self._model is None or not self.available:
            return 0

        texts = [r.to_search_text() for r in records]
        if not texts:
            return 0

        embeddings = self._model.encode(texts, normalize_embeddings=True)
        embeddings = np.asarray(embeddings, dtype=np.float32)

        dim = embeddings.shape[1]
        self._trajectory_index = self._faiss.IndexFlatIP(dim)
        self._trajectory_index.add(embeddings)
        self._trajectory_records = records
        logger.info("Trajectory index built: %d vectors, dim=%d", len(records), dim)
        return len(records)

    def search_trajectories(
        self,
        query: str,
        top_k: int = 3,
    ) -> list:
        """Search trajectory index for similar past executions.

        Returns list of TrajectoryRecord objects.
        """
        self._lazy_init()
        if not hasattr(self, "_trajectory_index") or self._trajectory_index is None:
            return []
        if self._model is None:
            return []

        q_emb = self._model.encode([query], normalize_embeddings=True)
        q_emb = np.asarray(q_emb, dtype=np.float32)

        records = getattr(self, "_trajectory_records", [])
        search_k = min(len(records), top_k)
        if search_k == 0:
            return []

        scores, indices = self._trajectory_index.search(q_emb, search_k)

        results = []
        for score, idx in zip(scores[0], indices[0]):
            if idx < 0 or idx >= len(records):
                continue
            results.append(records[idx])

        return results

    def search_terms(
        self,
        query: str,
        tradition: str,
        top_k: int = 5,
    ) -> list[_FaissHit]:
        """Semantic search over terminology index, filtered by tradition (with default fallback)."""
        self._lazy_init()
        if self._term_index is None or self._model is None:
            return []

        q_emb = self._model.encode([query], normalize_embeddings=True)
        q_emb = np.asarray(q_emb, dtype=np.float32)

        search_k = min(len(self._term_ids), top_k * 3)
        scores, indices = self._term_index.search(q_emb, search_k)

        hits: list[_FaissHit] = []
        for score, idx in zip(scores[0], indices[0]):
            if idx < 0:
                continue
            tid = self._term_ids[idx]
            trad = self._term_traditions[idx]
            if trad != tradition and trad != "default" and tradition != "default":
                continue
            hits.append(_FaissHit(
                doc_id=tid,
                similarity=float(max(0.0, min(1.0, score))),
                tradition=trad,
                text_snippet=self._term_texts[idx][:120],
            ))
            if len(hits) >= top_k:
                break

        return hits
