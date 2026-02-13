"""TerminologyLoader — three-tier cultural terminology matching (zero-cost, no LLM).

Supports optional FAISS semantic search via ``mode`` parameter:
- ``"string"`` (default): three-tier exact/alias/fuzzy string matching
- ``"semantic"``: FAISS cosine similarity merged with string matches
- ``"auto"``: FAISS if available, else string
"""

from __future__ import annotations

import json
import re
from pathlib import Path
from typing import TYPE_CHECKING

from app.prototype.tools.scout_types import TerminologyHitResult

if TYPE_CHECKING:
    from app.prototype.tools.faiss_index_service import FaissIndexService

_DATA_DIR = Path(__file__).resolve().parent.parent / "data" / "terminology"
_TERMS_FILE = _DATA_DIR / "terms.v1.json"


class TerminologyLoader:
    """Match text against the VULCA cultural terminology dictionary."""

    def __init__(self, faiss_service: FaissIndexService | None = None) -> None:
        with open(_TERMS_FILE, encoding="utf-8") as f:
            data = json.load(f)
        self._traditions: dict[str, list[dict]] = {}
        self._term_lookup: dict[str, dict] = {}  # term_id -> entry dict
        for tradition, info in data.get("traditions", {}).items():
            terms = info.get("terms", [])
            self._traditions[tradition] = terms
            for entry in terms:
                self._term_lookup[entry["id"]] = {**entry, "_tradition": tradition}
        self._faiss_service = faiss_service

    def get_term_entry(self, term_text: str, tradition: str) -> dict | None:
        """Look up the full term entry dict by term text and tradition."""
        for trad_key in (tradition, "default"):
            for entry in self._traditions.get(trad_key, []):
                if (entry.get("term_zh") == term_text
                        or entry.get("term_en", "").lower() == term_text.lower()):
                    return entry
                if any(a.lower() == term_text.lower() for a in entry.get("aliases", [])):
                    return entry
        return None

    def get_term_entry_by_id(self, term_id: str) -> dict | None:
        """Look up the full term entry dict by term ID."""
        return self._term_lookup.get(term_id)

    def match(
        self,
        text: str,
        cultural_tradition: str,
        mode: str = "string",
    ) -> list[TerminologyHitResult]:
        # Resolve mode
        use_faiss = False
        if mode == "semantic":
            use_faiss = True
        elif mode == "auto":
            use_faiss = self._faiss_service is not None and self._faiss_service.available

        # Always run string matching first (for exact/alias hits)
        string_results = self._match_string(text, cultural_tradition)

        if use_faiss and self._faiss_service is not None:
            return self._merge_with_semantic(string_results, text, cultural_tradition)

        return string_results

    def _match_string(
        self,
        text: str,
        cultural_tradition: str,
    ) -> list[TerminologyHitResult]:
        """Original three-tier string matching."""
        text_lower = text.lower()

        # Collect terms from the requested tradition + default
        terms_to_check: list[tuple[str, dict]] = []  # (tradition_key, term_entry)
        for trad_key in (cultural_tradition, "default"):
            for term_entry in self._traditions.get(trad_key, []):
                terms_to_check.append((trad_key, term_entry))

        # Deduplicate: same term id should not appear twice
        seen_ids: set[str] = set()
        results: list[TerminologyHitResult] = []

        for trad_key, entry in terms_to_check:
            term_id = entry["id"]
            if term_id in seen_ids:
                continue

            hit = self._check_term(text_lower, entry, trad_key)
            if hit is not None:
                seen_ids.add(term_id)
                results.append(hit)

        return results

    def _merge_with_semantic(
        self,
        string_results: list[TerminologyHitResult],
        text: str,
        cultural_tradition: str,
    ) -> list[TerminologyHitResult]:
        """Merge string matches with FAISS semantic results, deduplicating by term_id."""
        assert self._faiss_service is not None

        # Index existing string results by a derived term_id
        seen_term_ids: set[str] = set()
        merged: list[TerminologyHitResult] = []

        # String results with exact/alias confidence >= 0.9 take priority
        for hit in string_results:
            # Find term_id from the term text
            tid = self._resolve_term_id(hit.term, hit.dictionary_ref)
            if tid:
                seen_term_ids.add(tid)
            merged.append(hit)

        # Add FAISS results that are not already present
        faiss_hits = self._faiss_service.search_terms(text, cultural_tradition, top_k=5)
        for fhit in faiss_hits:
            if fhit.doc_id in seen_term_ids:
                continue
            seen_term_ids.add(fhit.doc_id)
            entry = self._term_lookup.get(fhit.doc_id)
            if entry is None:
                continue
            trad = entry.get("_tradition", "default")
            dict_ref = f"terms_v1_{trad}"
            term_text = entry.get("term_en", entry.get("term_zh", fhit.doc_id))
            merged.append(TerminologyHitResult(
                term=term_text,
                matched=True,
                confidence=round(fhit.similarity * 0.8, 4),  # Scale to max 0.8 for semantic
                dictionary_ref=dict_ref,
            ))

        return merged

    def _resolve_term_id(self, term_text: str, dictionary_ref: str) -> str | None:
        """Resolve a matched term text back to its term_id."""
        # Extract tradition from dictionary_ref like "terms_v1_chinese_xieyi"
        prefix = "terms_v1_"
        trad = dictionary_ref[len(prefix):] if dictionary_ref.startswith(prefix) else "default"

        for entry in self._traditions.get(trad, []):
            if entry.get("term_zh") == term_text or entry.get("term_en", "").lower() == term_text.lower():
                return entry["id"]
            if any(a.lower() == term_text.lower() for a in entry.get("aliases", [])):
                return entry["id"]
        # Try default tradition too
        for entry in self._traditions.get("default", []):
            if entry.get("term_zh") == term_text or entry.get("term_en", "").lower() == term_text.lower():
                return entry["id"]
            if any(a.lower() == term_text.lower() for a in entry.get("aliases", [])):
                return entry["id"]
        return None

    def _check_term(
        self,
        text_lower: str,
        entry: dict,
        tradition_key: str,
    ) -> TerminologyHitResult | None:
        """Three-tier matching: exact > alias > fuzzy. Returns highest confidence hit or None."""
        term_zh = entry.get("term_zh", "")
        term_en = entry.get("term_en", "")
        aliases = entry.get("aliases", [])
        dict_ref = f"terms_v1_{tradition_key}"

        # Tier 1: Exact match (confidence=1.0)
        if term_zh and term_zh in text_lower:
            return TerminologyHitResult(
                term=term_zh, matched=True, confidence=1.0, dictionary_ref=dict_ref,
            )
        if term_en and term_en.lower() in text_lower:
            return TerminologyHitResult(
                term=term_en, matched=True, confidence=1.0, dictionary_ref=dict_ref,
            )

        # Tier 2: Alias match (confidence=0.9)
        for alias in aliases:
            if alias.lower() in text_lower:
                return TerminologyHitResult(
                    term=alias, matched=True, confidence=0.9, dictionary_ref=dict_ref,
                )

        # Tier 3: Fuzzy match on term_en main words (confidence=0.7)
        if term_en:
            main_words = [w.lower() for w in re.findall(r"[a-zA-Z]+", term_en) if len(w) > 3]
            if main_words:
                matched_count = sum(1 for w in main_words if w in text_lower)
                if matched_count / len(main_words) >= 0.5:
                    return TerminologyHitResult(
                        term=term_en, matched=True, confidence=0.7, dictionary_ref=dict_ref,
                    )

        return None
