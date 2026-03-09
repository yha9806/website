"""Test ImageScorer dynamic reference text with fallback."""
from __future__ import annotations
import pytest
from unittest.mock import patch, MagicMock

from app.prototype.agents.image_scorer import (
    _get_references_dynamic,
    _LEGACY_TRADITION_REFERENCES,
)


class TestGetReferencesDynamic:
    def test_legacy_fallback_for_unknown(self):
        with patch("app.prototype.cultural_pipelines.tradition_loader.get_tradition", return_value=None):
            result = _get_references_dynamic("nonexistent")
        assert result == _LEGACY_TRADITION_REFERENCES["default"]

    def test_known_tradition_returns_valid_refs(self):
        result = _get_references_dynamic("chinese_xieyi")
        assert "L1" in result
        assert "L3" in result
        assert "L5" in result

    def test_yaml_tier_when_available(self):
        mock_tc = MagicMock()
        mock_tc.display_name = {"en": "Test Art"}
        terms = []
        for name, levels in [("brush", ["L1", "L3"]), ("ink", ["L1"]), ("philosophy", ["L5"]), ("harmony", ["L3", "L5"])]:
            t = MagicMock()
            t.term = name
            t.l_levels = levels
            terms.append(t)
        mock_tc.terminology = terms

        with patch("app.prototype.cultural_pipelines.tradition_loader.get_tradition", return_value=mock_tc):
            result = _get_references_dynamic("test_tradition")
        assert "L1" in result
        assert "brush" in result["L1"]

    def test_default_always_available(self):
        result = _get_references_dynamic("default")
        assert "L1" in result
        assert "L3" in result
        assert "L5" in result
