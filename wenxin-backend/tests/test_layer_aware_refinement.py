"""Tests for layer-aware refinement strategies (Phase 4 Step 2).

Covers:
- _LAYER_REFINEMENT_STRATEGIES completeness
- EvidencePack.filter_by_layers() filtering + normalization + graceful degradation
- _build_layer_aware_prompt_delta() strategy assembly
"""
from __future__ import annotations

import pytest

from app.prototype.agents.critic_config import DIMENSIONS
from app.prototype.agents.draft_agent import (
    _LAYER_REFINEMENT_STRATEGIES,
    _build_layer_aware_prompt_delta,
    _resolve_layer_name,
)
from app.prototype.tools.evidence_pack import EvidencePack, TerminologyAnchor


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------


def _make_anchor(term: str, l_levels: list[str]) -> TerminologyAnchor:
    return TerminologyAnchor(
        term=term,
        definition=f"Definition of {term}",
        usage_hint="test hint",
        source="test",
        confidence=0.9,
        l_levels=l_levels,
    )


def _make_pack() -> EvidencePack:
    """Build a sample EvidencePack with anchors spanning L1-L5."""
    return EvidencePack(
        subject="mountain landscape",
        tradition="chinese_xieyi",
        anchors=[
            _make_anchor("composition balance", ["L1"]),
            _make_anchor("brushwork", ["L2"]),
            _make_anchor("cultural symbol", ["L3"]),
            _make_anchor("narrative depth", ["L4"]),
            _make_anchor("philosophical meaning", ["L5"]),
            _make_anchor("cross-layer term", ["L2", "L3"]),
        ],
    )


# ---------------------------------------------------------------------------
# Part A: Layer refinement strategies
# ---------------------------------------------------------------------------


class TestLayerRefinementStrategies:
    """Verify _LAYER_REFINEMENT_STRATEGIES covers all DIMENSIONS."""

    def test_layer_refinement_strategies_cover_all_dimensions(self):
        """Every dimension in DIMENSIONS must have a corresponding strategy."""
        for dim in DIMENSIONS:
            assert dim in _LAYER_REFINEMENT_STRATEGIES, (
                f"Missing refinement strategy for dimension: {dim}"
            )
            assert len(_LAYER_REFINEMENT_STRATEGIES[dim]) > 20, (
                f"Strategy for {dim} is too short"
            )

    def test_no_extra_strategies(self):
        """Strategies dict should not have keys outside DIMENSIONS."""
        for key in _LAYER_REFINEMENT_STRATEGIES:
            assert key in DIMENSIONS, f"Unexpected strategy key: {key}"

    def test_resolve_layer_name_l_labels(self):
        """L1-L5 labels resolve to dimension names."""
        assert _resolve_layer_name("L1") == "visual_perception"
        assert _resolve_layer_name("L3") == "cultural_context"
        assert _resolve_layer_name("L5") == "philosophical_aesthetic"

    def test_resolve_layer_name_dimension_names(self):
        """Full dimension names resolve to themselves."""
        assert _resolve_layer_name("cultural_context") == "cultural_context"
        assert _resolve_layer_name("technical_analysis") == "technical_analysis"

    def test_resolve_layer_name_case_insensitive(self):
        """L-labels are case-insensitive."""
        assert _resolve_layer_name("l3") == "cultural_context"
        assert _resolve_layer_name("l1") == "visual_perception"

    def test_build_layer_aware_prompt_delta_single(self):
        """Single layer produces the corresponding strategy text."""
        delta = _build_layer_aware_prompt_delta(["L3"])
        assert "cultural authenticity" in delta
        assert "tradition-specific symbols" in delta

    def test_build_layer_aware_prompt_delta_multiple(self):
        """Multiple layers produce combined strategy text."""
        delta = _build_layer_aware_prompt_delta(["L1", "L5"])
        assert "visual composition" in delta
        assert "philosophical dimension" in delta

    def test_build_layer_aware_prompt_delta_fallback(self):
        """Unknown layers fall back to generic improvement text."""
        delta = _build_layer_aware_prompt_delta(["UNKNOWN"])
        assert "improve" in delta
        assert "UNKNOWN" in delta

    def test_build_layer_aware_prompt_delta_empty(self):
        """Empty target_layers falls back to generic improvement."""
        delta = _build_layer_aware_prompt_delta([])
        assert "improve" in delta

    def test_build_layer_aware_prompt_delta_by_name(self):
        """Dimension names (not L-labels) also work."""
        delta = _build_layer_aware_prompt_delta(["cultural_context"])
        assert "cultural authenticity" in delta


# ---------------------------------------------------------------------------
# Part B: EvidencePack.filter_by_layers()
# ---------------------------------------------------------------------------


class TestEvidencePackFilterByLayers:
    """Test EvidencePack.filter_by_layers()."""

    def test_filter_by_l3_keeps_only_l3_anchors(self):
        """Filtering by L3 should keep only anchors with L3 in l_levels."""
        pack = _make_pack()
        filtered = pack.filter_by_layers(["L3"])
        # Should keep: "cultural symbol" (L3), "cross-layer term" (L2, L3)
        assert len(filtered.anchors) == 2
        terms = {a.term for a in filtered.anchors}
        assert "cultural symbol" in terms
        assert "cross-layer term" in terms

    def test_filter_preserves_non_anchor_fields(self):
        """Filtering should not alter subject, tradition, compositions, styles, taboos."""
        pack = _make_pack()
        filtered = pack.filter_by_layers(["L1"])
        assert filtered.subject == pack.subject
        assert filtered.tradition == pack.tradition
        assert filtered.compositions == pack.compositions
        assert filtered.styles == pack.styles
        assert filtered.taboos == pack.taboos
        assert filtered.coverage == pack.coverage

    def test_filter_preserves_all_when_empty_result(self):
        """If no anchors match, return the original pack unchanged."""
        pack = _make_pack()
        # No anchor has "L99" in its l_levels
        filtered = pack.filter_by_layers(["L99"])
        assert filtered is pack  # Same object (identity check)
        assert len(filtered.anchors) == len(pack.anchors)

    def test_filter_normalizes_labels(self):
        """'L3' and 'cultural_context' should produce the same filtered result."""
        pack = _make_pack()
        by_label = pack.filter_by_layers(["L3"])
        by_name = pack.filter_by_layers(["cultural_context"])
        assert len(by_label.anchors) == len(by_name.anchors)
        assert {a.term for a in by_label.anchors} == {a.term for a in by_name.anchors}

    def test_filter_multiple_layers(self):
        """Filtering by multiple layers keeps anchors matching any of them."""
        pack = _make_pack()
        filtered = pack.filter_by_layers(["L1", "L5"])
        terms = {a.term for a in filtered.anchors}
        assert "composition balance" in terms  # L1
        assert "philosophical meaning" in terms  # L5
        # L2, L3, L4 only anchors should be excluded
        assert "brushwork" not in terms
        assert "cultural symbol" not in terms
        assert "narrative depth" not in terms

    def test_filter_with_cross_layer_anchor(self):
        """An anchor with ['L2', 'L3'] should appear when filtering by either."""
        pack = _make_pack()
        by_l2 = pack.filter_by_layers(["L2"])
        by_l3 = pack.filter_by_layers(["L3"])
        assert any(a.term == "cross-layer term" for a in by_l2.anchors)
        assert any(a.term == "cross-layer term" for a in by_l3.anchors)

    def test_filter_case_insensitive_l_labels(self):
        """Lowercase l-labels like 'l3' should work too."""
        pack = _make_pack()
        filtered = pack.filter_by_layers(["l3"])
        assert len(filtered.anchors) == 2  # cultural symbol + cross-layer term
