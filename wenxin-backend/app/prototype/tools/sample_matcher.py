"""SampleMatcher — keyword-based VULCA-Bench sample retrieval (zero-cost, no LLM).

Supports optional FAISS semantic search via ``mode`` parameter:
- ``"jaccard"`` (default): keyword-based Jaccard similarity
- ``"semantic"``: FAISS cosine similarity (requires FaissIndexService)
- ``"auto"``: FAISS if available, else Jaccard
"""

from __future__ import annotations

import json
import re
from pathlib import Path
from typing import TYPE_CHECKING

from app.prototype.tools.scout_types import SampleMatchResult

if TYPE_CHECKING:
    from app.prototype.tools.faiss_index_service import FaissIndexService

_DATA_DIR = Path(__file__).resolve().parent.parent / "data" / "samples"
_INDEX_FILE = _DATA_DIR / "index.v1.json"


def _tokenize(text: str) -> list[str]:
    """Split text into tokens: English words (lowered) + individual CJK characters."""
    tokens: list[str] = []
    # English words
    tokens.extend(re.findall(r"[a-zA-Z]+", text.lower()))
    # CJK characters (each char is a token)
    tokens.extend(re.findall(r"[\u4e00-\u9fff\u3400-\u4dbf]", text))
    return tokens


class SampleMatcher:
    """Match a subject string against the VULCA-Bench sample index."""

    def __init__(self, faiss_service: FaissIndexService | None = None) -> None:
        with open(_INDEX_FILE, encoding="utf-8") as f:
            data = json.load(f)
        self._samples: list[dict] = data["samples"]
        self._faiss_service = faiss_service

    def match(
        self,
        subject: str,
        cultural_tradition: str,
        top_k: int = 3,
        mode: str = "jaccard",
    ) -> list[SampleMatchResult]:
        if not isinstance(top_k, int):
            raise TypeError("top_k must be an int")
        if top_k <= 0:
            return []

        # Resolve mode
        use_faiss = False
        if mode == "semantic":
            use_faiss = True
        elif mode == "auto":
            use_faiss = self._faiss_service is not None and self._faiss_service.available

        if use_faiss and self._faiss_service is not None:
            return self._match_semantic(subject, cultural_tradition, top_k)

        query_tokens = _tokenize(subject)
        if not query_tokens:
            return []

        # Filter by tradition, with default fallback
        candidates = [
            s for s in self._samples
            if s["cultural_tradition"] == cultural_tradition
        ]
        if not candidates:
            candidates = [
                s for s in self._samples
                if s["cultural_tradition"] == "default"
            ]

        scored: list[tuple[float, dict]] = []
        for sample in candidates:
            score = self._score(query_tokens, sample)
            if score > 0:
                scored.append((score, sample))

        scored.sort(key=lambda x: x[0], reverse=True)

        results: list[SampleMatchResult] = []
        for sim, sample in scored[:top_k]:
            results.append(SampleMatchResult(
                sample_id=sample["sample_id"],
                similarity=min(sim, 1.0),
                source=sample.get("source", "VULCA-Bench-v1"),
            ))
        return results

    def _match_semantic(
        self,
        subject: str,
        cultural_tradition: str,
        top_k: int,
    ) -> list[SampleMatchResult]:
        """Semantic search via FAISS."""
        assert self._faiss_service is not None
        hits = self._faiss_service.search_samples(subject, cultural_tradition, top_k=top_k)
        results: list[SampleMatchResult] = []
        for hit in hits:
            # Look up source from sample data
            source = "VULCA-Bench-v1"
            for s in self._samples:
                if s["sample_id"] == hit.doc_id:
                    source = s.get("source", "VULCA-Bench-v1")
                    break
            results.append(SampleMatchResult(
                sample_id=hit.doc_id,
                similarity=min(hit.similarity, 1.0),
                source=source,
            ))
        return results

    def _score(self, query_tokens: list[str], sample: dict) -> float:
        """Compute weighted Jaccard-like similarity between query and sample."""
        # Build candidate token bag from sample fields
        candidate_tokens: list[str] = []
        candidate_tokens.extend(_tokenize(sample.get("subject_en", "")))
        candidate_tokens.extend(_tokenize(sample.get("subject_zh", "")))

        # Tags are exact tokens — added raw (lowered)
        tags = [t.lower().replace("_", " ") for t in sample.get("tags", [])]
        tag_words: list[str] = []
        for tag in tags:
            tag_words.extend(tag.split())

        candidate_set = set(candidate_tokens)
        tag_set = set(tag_words)

        query_set = set(query_tokens)

        # Base intersection
        base_match = len(query_set & candidate_set)
        # Tag bonus: promote explicit tag-word hits.
        tag_match = len(query_set & tag_set)
        weighted_match = base_match + tag_match

        denominator = max(len(query_set), len(candidate_set))
        if denominator == 0:
            return 0.0
        return weighted_match / denominator
