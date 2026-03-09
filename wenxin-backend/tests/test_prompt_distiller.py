"""Test PromptDistiller."""
from __future__ import annotations
import pytest
from app.prototype.digestion.prompt_distiller import PromptDistiller, PromptArchetype


class TestPromptDistiller:
    def test_empty_sessions(self):
        d = PromptDistiller()
        assert d.distill([]) == []

    def test_low_scoring_ignored(self):
        sessions = [
            {"intent": "test art", "final_weighted_total": 0.3, "tradition": "default"}
        ]
        assert PromptDistiller().distill(sessions) == []

    def test_high_scoring_extracted(self):
        sessions = [
            {"intent": "landscape mountain painting", "final_weighted_total": 0.85, "tradition": "chinese_xieyi"},
            {"intent": "mountain landscape scene", "final_weighted_total": 0.80, "tradition": "chinese_xieyi"},
            {"intent": "abstract modern art", "final_weighted_total": 0.75, "tradition": "default"},
        ]
        archetypes = PromptDistiller().distill(sessions)
        # "mountain" and "landscape" appear in 2 sessions each
        patterns = [a.pattern for a in archetypes]
        assert "mountain" in patterns or "landscape" in patterns

    def test_chinese_intent_keywords(self):
        """Chinese bigrams/trigrams should be extracted from intent text."""
        sessions = [
            {"intent": "水墨 landscape", "final_weighted_total": 0.85, "tradition": "chinese_xieyi"},
            {"intent": "水墨 painting style", "final_weighted_total": 0.80, "tradition": "chinese_xieyi"},
            {"intent": "水墨 art", "final_weighted_total": 0.78, "tradition": "chinese_xieyi"},
        ]
        archetypes = PromptDistiller().distill(sessions)
        patterns = [a.pattern for a in archetypes]
        # "水墨" should appear as extracted Chinese keyword (in 3 sessions)
        assert "水墨" in patterns, f"Expected '水墨' in patterns, got {patterns}"

    def test_extract_keywords_mixed(self):
        """Mixed English+Chinese text should extract both."""
        keywords = PromptDistiller._extract_keywords("watercolor 水墨山水 landscape 传统意境")
        en_kw = [w for w in keywords if w.isascii()]
        zh_kw = [w for w in keywords if any(c >= '\u4e00' and c <= '\u9fff' for c in w)]
        assert len(en_kw) > 0, "Should extract English keywords"
        assert len(zh_kw) > 0, "Should extract Chinese keywords"

    def test_archetype_to_dict(self):
        a = PromptArchetype(pattern="test", avg_score=0.8, count=3)
        d = a.to_dict()
        assert d["pattern"] == "test"
        assert d["avg_score"] == 0.8
