"""Test Critic dynamic cultural keywords with fallback."""
from __future__ import annotations
import pytest
from unittest.mock import patch, MagicMock

from app.prototype.agents.critic_rules import (
    _get_cultural_keywords,
    _LEGACY_CULTURE_KEYWORDS,
    _CULTURE_KEYWORDS,
    CriticRules,
)


class TestGetCulturalKeywords:
    """Test the 2-tier fallback for dynamic cultural keywords."""

    def test_legacy_alias_preserved(self):
        """_CULTURE_KEYWORDS should be the same object as _LEGACY_CULTURE_KEYWORDS."""
        assert _CULTURE_KEYWORDS is _LEGACY_CULTURE_KEYWORDS

    def test_legacy_fallback_for_unknown_tradition(self):
        """Unknown tradition with no YAML should fall back to legacy default."""
        with patch("app.prototype.cultural_pipelines.tradition_loader.get_tradition", return_value=None):
            result = _get_cultural_keywords("nonexistent_tradition")
        assert result == _LEGACY_CULTURE_KEYWORDS["default"]

    def test_known_tradition_returns_keywords(self):
        result = _get_cultural_keywords("chinese_xieyi")
        assert isinstance(result, list)
        assert len(result) > 0

    def test_yaml_tier_used_when_available(self):
        """When tradition_loader returns config with terminology, extract keywords."""
        mock_tc = MagicMock()
        mock_term = MagicMock()
        mock_term.term = "TestBrush"
        mock_term.aliases = ["tb_alias"]
        mock_tc.terminology = [mock_term]

        with patch("app.prototype.cultural_pipelines.tradition_loader.get_tradition", return_value=mock_tc):
            result = _get_cultural_keywords("test_tradition")
        assert "testbrush" in result
        assert "tb_alias" in result

    def test_scorer_uses_dynamic_keywords(self):
        """CriticRules.score() should use _get_cultural_keywords indirectly."""
        scorer = CriticRules()
        candidate = {"prompt": "ink brush painting", "steps": 10, "sampler": "", "model_ref": ""}
        evidence = {"terminology_hits": [], "sample_matches": [], "taboo_violations": []}
        scores = scorer.score(candidate, evidence, "chinese_xieyi", use_vlm=False)
        assert len(scores) == 5
