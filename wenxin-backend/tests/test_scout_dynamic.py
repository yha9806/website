"""Test Scout dynamic composition/style with fallback."""
from __future__ import annotations
import pytest
from unittest.mock import patch, MagicMock

from app.prototype.tools.scout_service import (
    _get_composition_dynamic,
    _get_style_dynamic,
    _get_composition_references,
    _get_style_constraints,
    _LEGACY_COMPOSITION_MAP,
    _LEGACY_SCOUT_STYLE_MAP,
)


class TestCompositionDynamic:
    def test_legacy_fallback_for_known_tradition(self):
        result = _get_composition_dynamic("chinese_xieyi")
        assert isinstance(result, list)
        assert len(result) > 0

    def test_legacy_fallback_for_unknown(self):
        result = _get_composition_dynamic("nonexistent")
        assert result == []

    def test_yaml_tier_when_available(self):
        mock_tc = MagicMock()
        mock_term = MagicMock()
        mock_term.category = "composition"
        mock_term.term = "test_comp"
        mock_term.term_zh = "测试构图"
        mock_term.definition = "A test composition technique"
        mock_tc.terminology = [mock_term]

        with patch("app.prototype.cultural_pipelines.tradition_loader.get_tradition", return_value=mock_tc):
            result = _get_composition_dynamic("test_tradition")
        assert len(result) == 1
        assert "test_comp" in result[0]["example_prompt_fragment"]


class TestStyleDynamic:
    def test_legacy_fallback_for_known(self):
        result = _get_style_dynamic("chinese_xieyi")
        assert isinstance(result, list)
        assert len(result) > 0

    def test_composition_references_returns_objects(self):
        refs = _get_composition_references("chinese_xieyi")
        assert all(hasattr(r, "description") for r in refs)

    def test_style_constraints_returns_objects(self):
        constraints = _get_style_constraints("chinese_xieyi")
        assert all(hasattr(c, "attribute") for c in constraints)
