"""Test DraftAgent dynamic style with 3-tier fallback."""
from __future__ import annotations
import pytest
from unittest.mock import patch, MagicMock

from app.prototype.agents.draft_agent import (
    _get_style_for_tradition,
    _LEGACY_STYLE_MAP,
    _llm_style_cache,
)


class TestGetStyleForTradition:
    """Test the 3-tier fallback for dynamic style."""

    def setup_method(self):
        _llm_style_cache.clear()

    def test_legacy_fallback_for_unknown_tradition(self):
        """Unknown tradition with no YAML and no LLM should fall back to legacy default."""
        with patch("app.prototype.cultural_pipelines.tradition_loader.get_tradition", return_value=None), \
             patch("litellm.completion", side_effect=Exception("no key")):
            result = _get_style_for_tradition("nonexistent_tradition")
        assert result == _LEGACY_STYLE_MAP["default"]

    def test_known_tradition_returns_valid_dict(self):
        result = _get_style_for_tradition("chinese_xieyi")
        assert "style" in result
        assert "negative" in result
        assert isinstance(result["style"], str)
        assert len(result["style"]) > 0

    def test_default_tradition(self):
        result = _get_style_for_tradition("default")
        assert "style" in result
        assert "negative" in result

    def test_yaml_tier_used_when_available(self):
        """When tradition_loader returns a config with terminology, it should be used."""
        mock_tc = MagicMock()
        mock_term = MagicMock()
        mock_term.category = "technique"
        mock_term.term = "test_brush"
        mock_term.definition = "a special brush technique"
        mock_tc.terminology = [mock_term]
        mock_tc.taboos = []

        with patch("app.prototype.cultural_pipelines.tradition_loader.get_tradition", return_value=mock_tc):
            result = _get_style_for_tradition("test_tradition")
        assert "test_brush" in result["style"]

    def test_tier2_llm_returns_valid_style(self):
        """Tier-2: LLM returns valid JSON → result cached and used."""
        mock_response = MagicMock()
        mock_response.choices = [MagicMock()]
        mock_response.choices[0].message.content = '{"style": "bold brushwork, vivid colors", "negative": "blurry"}'

        with patch("app.prototype.cultural_pipelines.tradition_loader.get_tradition", return_value=None), \
             patch("litellm.completion", return_value=mock_response):
            result = _get_style_for_tradition("tier2_test_tradition")

        assert result["style"] == "bold brushwork, vivid colors"
        assert result["negative"] == "blurry"
        # Should be cached
        assert "tier2_test_tradition" in _llm_style_cache

    def test_tier2_llm_failure_falls_to_tier3(self):
        """Tier-2: LLM throws exception → falls back to legacy."""
        with patch("app.prototype.cultural_pipelines.tradition_loader.get_tradition", return_value=None), \
             patch("litellm.completion", side_effect=RuntimeError("API down")):
            result = _get_style_for_tradition("failing_tradition")

        assert result == _LEGACY_STYLE_MAP["default"]
        assert "failing_tradition" not in _llm_style_cache

    def test_tier2_llm_empty_style_falls_to_tier3(self):
        """Tier-2: LLM returns empty style → falls back to legacy (I1 fix)."""
        mock_response = MagicMock()
        mock_response.choices = [MagicMock()]
        mock_response.choices[0].message.content = '{"style": "", "negative": "blurry"}'

        with patch("app.prototype.cultural_pipelines.tradition_loader.get_tradition", return_value=None), \
             patch("litellm.completion", return_value=mock_response):
            result = _get_style_for_tradition("empty_style_tradition")

        assert result == _LEGACY_STYLE_MAP["default"]
        assert "empty_style_tradition" not in _llm_style_cache

    def test_legacy_map_preserved(self):
        """_LEGACY_STYLE_MAP should have all original entries."""
        assert "chinese_xieyi" in _LEGACY_STYLE_MAP
        assert "default" in _LEGACY_STYLE_MAP
        assert "western_academic" in _LEGACY_STYLE_MAP
