"""Tests for WU-04: dynamic _CULTURE_KEYWORDS in SkillSelector.

Validates that:
- _get_culture_keywords() returns base English and Chinese keywords
- YAML tradition terminology gets loaded into the keyword set
- Rule 5 fires on both English and Chinese culture keywords
- Cache invalidation works correctly
"""

from __future__ import annotations

from unittest.mock import MagicMock, patch

import pytest

from app.prototype.intent.skill_selector import (
    SkillSelector,
    _CULTURE_KEYWORDS_BASE_EN,
    _CULTURE_KEYWORDS_BASE_ZH,
    _get_culture_keywords,
    invalidate_culture_keywords_cache,
)
from app.prototype.intent.types import IntentResult
from app.prototype.skills import SkillRegistry


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------


@pytest.fixture(autouse=True)
def _clear_cache():
    """Ensure culture keywords cache is cleared before and after each test."""
    invalidate_culture_keywords_cache()
    yield
    invalidate_culture_keywords_cache()


@pytest.fixture
def registry() -> SkillRegistry:
    """A fresh, empty SkillRegistry."""
    return SkillRegistry()


@pytest.fixture
def selector(registry: SkillRegistry) -> SkillSelector:
    return SkillSelector(registry=registry)


def _make_intent(raw: str, tradition: str = "default", context: str = "") -> IntentResult:
    return IntentResult(
        raw_intent=raw,
        tradition=tradition,
        context=context,
        confidence=0.9,
    )


# ---------------------------------------------------------------------------
# Test: base keywords always present
# ---------------------------------------------------------------------------


class TestGetCultureKeywords:
    """Tests for _get_culture_keywords() function."""

    def test_returns_set(self):
        result = _get_culture_keywords()
        assert isinstance(result, set)

    def test_contains_base_english_keywords(self):
        keywords = _get_culture_keywords()
        for word in _CULTURE_KEYWORDS_BASE_EN:
            assert word in keywords, f"Missing base English keyword: {word}"

    def test_contains_base_chinese_keywords(self):
        keywords = _get_culture_keywords()
        for word in _CULTURE_KEYWORDS_BASE_ZH:
            assert word in keywords, f"Missing base Chinese keyword: {word}"

    def test_contains_specific_english_words(self):
        keywords = _get_culture_keywords()
        assert "culture" in keywords
        assert "heritage" in keywords
        assert "taboo" in keywords
        assert "folklore" in keywords
        assert "indigenous" in keywords

    def test_contains_specific_chinese_words(self):
        keywords = _get_culture_keywords()
        assert "文化" in keywords
        assert "传统" in keywords
        assert "禁忌" in keywords
        assert "民俗" in keywords

    def test_caching_returns_same_object(self):
        """Second call returns the same cached set object."""
        first = _get_culture_keywords()
        second = _get_culture_keywords()
        assert first is second

    def test_invalidate_cache_forces_rebuild(self):
        first = _get_culture_keywords()
        invalidate_culture_keywords_cache()
        second = _get_culture_keywords()
        # Same content but different object (rebuilt)
        assert first == second
        assert first is not second


# ---------------------------------------------------------------------------
# Test: YAML tradition terms get loaded
# ---------------------------------------------------------------------------


class TestYAMLIntegration:
    """Tests that YAML tradition terminology enriches the keyword set."""

    def test_yaml_terms_included(self):
        """Mock tradition_loader to verify YAML keywords get included."""
        mock_term = MagicMock()
        mock_term.term = "shanshui"
        mock_term.term_zh = "山水"
        mock_term.aliases = ["landscape painting"]

        mock_config = MagicMock()
        mock_config.terminology = [mock_term]

        # The import is lazy inside _get_culture_keywords:
        #   from app.prototype.cultural_pipelines.tradition_loader import get_all_traditions
        # So we patch at the module where it's defined.
        invalidate_culture_keywords_cache()
        with patch(
            "app.prototype.cultural_pipelines.tradition_loader.get_all_traditions",
            return_value={"chinese_painting": mock_config},
        ):
            keywords = _get_culture_keywords()

        assert "shanshui" in keywords
        assert "山水" in keywords
        assert "landscape painting" in keywords

    def test_short_terms_excluded(self):
        """Terms with <= 2 chars (English) or <= 1 char (Chinese) are excluded."""
        mock_term = MagicMock()
        mock_term.term = "qi"  # len 2 — excluded
        mock_term.term_zh = "气"  # len 1 — excluded
        mock_term.aliases = ["ab"]  # len 2 — excluded

        mock_config = MagicMock()
        mock_config.terminology = [mock_term]

        invalidate_culture_keywords_cache()
        with patch(
            "app.prototype.cultural_pipelines.tradition_loader.get_all_traditions",
            return_value={"test": mock_config},
        ):
            keywords = _get_culture_keywords()

        assert "qi" not in keywords
        assert "气" not in keywords
        assert "ab" not in keywords

    def test_tradition_loader_failure_graceful(self):
        """If tradition_loader raises, base keywords still work."""
        invalidate_culture_keywords_cache()
        with patch(
            "app.prototype.cultural_pipelines.tradition_loader.get_all_traditions",
            side_effect=ImportError("no yaml"),
        ):
            keywords = _get_culture_keywords()

        # Base keywords must still be present
        assert "culture" in keywords
        assert "文化" in keywords
        assert len(keywords) >= len(_CULTURE_KEYWORDS_BASE_EN) + len(_CULTURE_KEYWORDS_BASE_ZH)


# ---------------------------------------------------------------------------
# Test: Rule 5 matching in SkillSelector.select()
# ---------------------------------------------------------------------------


class TestRule5CultureMatching:
    """Tests that Rule 5 correctly fires on culture keywords."""

    def test_english_culture_keyword_triggers_rule5(self, selector: SkillSelector):
        intent = _make_intent("analyze cultural heritage of this artwork")
        plan = selector.select(intent)
        assert any(s.name == "cultural_evaluation" for s in plan.skills)
        assert plan.include_evidence is True

    def test_chinese_culture_keyword_triggers_rule5(self, selector: SkillSelector):
        # Chinese keywords must appear as separate tokens (split by spaces)
        # since Rule 5 uses set intersection on whitespace-split tokens.
        intent = _make_intent("分析这幅画的 传统 文化 内涵")
        plan = selector.select(intent)
        assert any(s.name == "cultural_evaluation" for s in plan.skills)
        assert plan.include_evidence is True

    def test_mixed_language_triggers_rule5(self, selector: SkillSelector):
        intent = _make_intent("discuss the 禁忌 in this painting")
        plan = selector.select(intent)
        assert any(s.name == "cultural_evaluation" for s in plan.skills)

    def test_new_keyword_folklore_triggers_rule5(self, selector: SkillSelector):
        """'folklore' is a new keyword not in the original static set."""
        intent = _make_intent("explore japanese folklore imagery")
        plan = selector.select(intent)
        assert any(s.name == "cultural_evaluation" for s in plan.skills)
        assert plan.include_evidence is True

    def test_new_keyword_indigenous_triggers_rule5(self, selector: SkillSelector):
        """'indigenous' is a new keyword not in the original static set."""
        intent = _make_intent("indigenous art patterns")
        plan = selector.select(intent)
        assert any(s.name == "cultural_evaluation" for s in plan.skills)

    def test_no_culture_keyword_falls_through(self, selector: SkillSelector):
        """Without culture keywords, Rule 5 doesn't add cultural_evaluation via evidence."""
        intent = _make_intent("make a nice landscape photo")
        plan = selector.select(intent)
        # Falls back to cultural_evaluation anyway (fallback rule), but evidence should be False
        assert plan.include_evidence is False

    def test_rule1_takes_precedence_over_rule5(self, selector: SkillSelector):
        """If tradition is already set (Rule 1), Rule 5 should not duplicate."""
        intent = _make_intent("cultural tradition analysis", tradition="chinese_painting")
        plan = selector.select(intent)
        culture_skills = [s for s in plan.skills if s.name == "cultural_evaluation"]
        assert len(culture_skills) == 1, "cultural_evaluation should appear exactly once"
