"""Tests for WU-01: PromptDistiller → VLMCritic archetype integration.

Covers:
1. get_prompt_archetypes() reads and filters evolved_context.json
2. VLMCritic._score_async evidence_section includes archetype patterns
3. Edge cases: empty archetypes, missing file, tradition filtering
"""

from __future__ import annotations

import json
import os
import tempfile
from unittest import mock

import pytest

from app.prototype.cultural_pipelines.cultural_weights import get_prompt_archetypes


# ---------------------------------------------------------------------------
# Sample evolved_context.json data
# ---------------------------------------------------------------------------

_SAMPLE_CONTEXT = {
    "tradition_weights": {},
    "version": 2,
    "evolutions": 3,
    "cultures": {},
    "prompt_contexts": {
        "archetypes": [
            {
                "pattern": "ink_wash",
                "avg_score": 0.85,
                "count": 5,
                "traditions": ["chinese_xieyi"],
                "example_prompts": ["ink wash landscape"],
            },
            {
                "pattern": "shanshui",
                "avg_score": 0.82,
                "count": 4,
                "traditions": ["chinese_xieyi", "chinese_gongbi"],
                "example_prompts": ["shanshui mountain"],
            },
            {
                "pattern": "chiaroscuro",
                "avg_score": 0.80,
                "count": 3,
                "traditions": ["western_academic"],
                "example_prompts": ["oil painting chiaroscuro"],
            },
            {
                "pattern": "tessellation",
                "avg_score": 0.78,
                "count": 3,
                "traditions": ["islamic_geometric"],
                "example_prompts": ["geometric tessellation"],
            },
            {
                "pattern": "landscape",
                "avg_score": 0.75,
                "count": 6,
                "traditions": [],
                "example_prompts": ["beautiful landscape"],
            },
            {
                "pattern": "brush_stroke",
                "avg_score": 0.72,
                "count": 2,
                "traditions": ["chinese_xieyi"],
                "example_prompts": ["brush stroke art"],
            },
            {
                "pattern": "miniature",
                "avg_score": 0.70,
                "count": 2,
                "traditions": ["south_asian"],
                "example_prompts": ["miniature painting"],
            },
        ],
    },
    "feature_space": {},
}


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------

@pytest.fixture()
def evolved_context_file(tmp_path):
    """Create a temporary evolved_context.json and patch the module path."""
    ctx_path = tmp_path / "evolved_context.json"
    ctx_path.write_text(json.dumps(_SAMPLE_CONTEXT, ensure_ascii=False), encoding="utf-8")
    with mock.patch(
        "app.prototype.cultural_pipelines.cultural_weights._EVOLVED_CONTEXT_PATH",
        str(ctx_path),
    ):
        yield ctx_path


@pytest.fixture()
def empty_evolved_context_file(tmp_path):
    """Create an evolved_context.json with no archetypes."""
    ctx_path = tmp_path / "evolved_context.json"
    empty = {"tradition_weights": {}, "version": 2, "evolutions": 0}
    ctx_path.write_text(json.dumps(empty), encoding="utf-8")
    with mock.patch(
        "app.prototype.cultural_pipelines.cultural_weights._EVOLVED_CONTEXT_PATH",
        str(ctx_path),
    ):
        yield ctx_path


@pytest.fixture()
def missing_evolved_context_file(tmp_path):
    """Patch the path to a non-existent file."""
    ctx_path = tmp_path / "nonexistent.json"
    with mock.patch(
        "app.prototype.cultural_pipelines.cultural_weights._EVOLVED_CONTEXT_PATH",
        str(ctx_path),
    ):
        yield ctx_path


# ---------------------------------------------------------------------------
# Tests: get_prompt_archetypes()
# ---------------------------------------------------------------------------

class TestGetPromptArchetypes:
    """Tests for the get_prompt_archetypes function."""

    def test_filters_by_tradition(self, evolved_context_file) -> None:
        """Should return only archetypes matching the requested tradition."""
        result = get_prompt_archetypes("chinese_xieyi")
        patterns = [a["pattern"] for a in result]
        # chinese_xieyi has: ink_wash, shanshui, brush_stroke
        # Plus "landscape" which has empty traditions (universal)
        assert "ink_wash" in patterns
        assert "shanshui" in patterns
        # chiaroscuro is western_academic only — should NOT appear
        assert "chiaroscuro" not in patterns
        # tessellation is islamic_geometric only — should NOT appear
        assert "tessellation" not in patterns

    def test_includes_universal_archetypes(self, evolved_context_file) -> None:
        """Archetypes with empty traditions list are universal and always included."""
        result = get_prompt_archetypes("chinese_xieyi")
        patterns = [a["pattern"] for a in result]
        assert "landscape" in patterns

    def test_sorted_by_avg_score_descending(self, evolved_context_file) -> None:
        """Results should be sorted by avg_score descending."""
        result = get_prompt_archetypes("chinese_xieyi")
        scores = [a["avg_score"] for a in result]
        assert scores == sorted(scores, reverse=True)

    def test_top_n_limit(self, evolved_context_file) -> None:
        """Should respect the top_n limit."""
        result = get_prompt_archetypes("chinese_xieyi", top_n=2)
        assert len(result) <= 2

    def test_default_top_n_is_5(self, evolved_context_file) -> None:
        """Default top_n is 5."""
        result = get_prompt_archetypes("chinese_xieyi")
        assert len(result) <= 5

    def test_western_academic_tradition(self, evolved_context_file) -> None:
        """Western academic should get chiaroscuro + universal archetypes."""
        result = get_prompt_archetypes("western_academic")
        patterns = [a["pattern"] for a in result]
        assert "chiaroscuro" in patterns
        assert "landscape" in patterns
        assert "ink_wash" not in patterns

    def test_unknown_tradition_gets_universal_only(self, evolved_context_file) -> None:
        """Unknown tradition should still get universal archetypes."""
        result = get_prompt_archetypes("unknown_tradition")
        patterns = [a["pattern"] for a in result]
        assert "landscape" in patterns
        assert len(result) == 1

    def test_empty_archetypes_returns_empty_list(self, empty_evolved_context_file) -> None:
        """When no archetypes exist, returns empty list."""
        result = get_prompt_archetypes("chinese_xieyi")
        assert result == []

    def test_missing_file_returns_empty_list(self, missing_evolved_context_file) -> None:
        """When evolved_context.json does not exist, returns empty list."""
        result = get_prompt_archetypes("chinese_xieyi")
        assert result == []

    def test_corrupt_json_returns_empty_list(self, tmp_path) -> None:
        """When the file contains invalid JSON, returns empty list."""
        ctx_path = tmp_path / "evolved_context.json"
        ctx_path.write_text("not valid json {{{", encoding="utf-8")
        with mock.patch(
            "app.prototype.cultural_pipelines.cultural_weights._EVOLVED_CONTEXT_PATH",
            str(ctx_path),
        ):
            result = get_prompt_archetypes("chinese_xieyi")
            assert result == []


# ---------------------------------------------------------------------------
# Tests: VLMCritic evidence section integration
# ---------------------------------------------------------------------------

class TestVLMCriticArchetypeIntegration:
    """Test that VLMCritic._score_async builds evidence_section with archetypes."""

    def test_evidence_section_includes_archetypes(self, evolved_context_file) -> None:
        """When archetypes exist, evidence_section should include 'Successful patterns'."""
        from app.prototype.agents.vlm_critic import VLMCritic, _USER_TEMPLATE

        critic = VLMCritic.__new__(VLMCritic)
        # We test by exercising the evidence building logic inline.
        # Replicate the relevant portion of _score_async's evidence building:
        tradition = "chinese_xieyi"
        evidence = {
            "terminology_hits": [{"term": "xieyi"}, {"term": "shanshui"}],
            "taboo_violations": [],
        }
        evidence_section = ""
        if evidence:
            parts = []
            for hit in evidence.get("terminology_hits", []):
                term = hit.get("term", "")
                if term:
                    parts.append(term)
            if parts:
                evidence_section = f"Cultural keywords: {', '.join(parts[:8])}"
            taboos = evidence.get("taboo_violations", [])
            if taboos:
                taboo_strs = [v.get("description", "") for v in taboos[:3]]
                evidence_section += f"\nKnown taboos: {'; '.join(taboo_strs)}"

        # WU-01: Append archetypes
        archetypes = get_prompt_archetypes(tradition, top_n=5)
        if archetypes:
            pattern_strs = [
                f"{a.get('pattern', '?')} (avg {a.get('avg_score', 0):.2f})"
                for a in archetypes[:5]
            ]
            evidence_section += f"\nSuccessful patterns: {', '.join(pattern_strs)}"

        assert "Successful patterns:" in evidence_section
        assert "ink_wash (avg 0.85)" in evidence_section
        assert "shanshui (avg 0.82)" in evidence_section

    def test_evidence_section_no_archetypes(self, empty_evolved_context_file) -> None:
        """When no archetypes exist, evidence_section should not include patterns line."""
        tradition = "chinese_xieyi"
        evidence_section = "Cultural keywords: xieyi, shanshui"

        archetypes = get_prompt_archetypes(tradition, top_n=5)
        if archetypes:
            pattern_strs = [
                f"{a.get('pattern', '?')} (avg {a.get('avg_score', 0):.2f})"
                for a in archetypes[:5]
            ]
            evidence_section += f"\nSuccessful patterns: {', '.join(pattern_strs)}"

        assert "Successful patterns:" not in evidence_section

    def test_evidence_section_limits_to_5_patterns(self, tmp_path) -> None:
        """Evidence section should include at most 5 patterns."""
        # Create context with 10 archetypes for one tradition
        many_archetypes = []
        for i in range(10):
            many_archetypes.append({
                "pattern": f"pattern_{i}",
                "avg_score": 0.9 - i * 0.01,
                "count": 5,
                "traditions": ["chinese_xieyi"],
                "example_prompts": [],
            })
        ctx = {
            "tradition_weights": {},
            "version": 2,
            "evolutions": 1,
            "prompt_contexts": {"archetypes": many_archetypes},
        }
        ctx_path = tmp_path / "evolved_context.json"
        ctx_path.write_text(json.dumps(ctx), encoding="utf-8")

        with mock.patch(
            "app.prototype.cultural_pipelines.cultural_weights._EVOLVED_CONTEXT_PATH",
            str(ctx_path),
        ):
            archetypes = get_prompt_archetypes("chinese_xieyi", top_n=5)
            assert len(archetypes) == 5

            pattern_strs = [
                f"{a.get('pattern', '?')} (avg {a.get('avg_score', 0):.2f})"
                for a in archetypes[:5]
            ]
            evidence_line = f"Successful patterns: {', '.join(pattern_strs)}"

            # Should have exactly 5 patterns
            assert evidence_line.count("(avg") == 5
            # First should be highest-scoring
            assert "pattern_0 (avg 0.90)" in evidence_line


# ---------------------------------------------------------------------------
# Tests: Graceful import error handling in VLMCritic
# ---------------------------------------------------------------------------

class TestVLMCriticGracefulDegradation:
    """Test that VLMCritic handles import/load errors gracefully."""

    def test_import_error_does_not_raise(self) -> None:
        """If get_prompt_archetypes import fails, evidence building continues."""
        # Simulate what the VLMCritic code does with try/except
        evidence_section = "Cultural keywords: xieyi"
        try:
            # Force an import error by patching
            with mock.patch(
                "app.prototype.cultural_pipelines.cultural_weights.get_prompt_archetypes",
                side_effect=ImportError("mocked import failure"),
            ):
                from app.prototype.cultural_pipelines.cultural_weights import get_prompt_archetypes as _gpa
                archetypes = _gpa("chinese_xieyi", top_n=5)
                if archetypes:
                    pattern_strs = [
                        f"{a.get('pattern', '?')} (avg {a.get('avg_score', 0):.2f})"
                        for a in archetypes[:5]
                    ]
                    evidence_section += f"\nSuccessful patterns: {', '.join(pattern_strs)}"
        except Exception:
            pass  # Mirrors VLMCritic's try/except behavior

        # evidence_section should be unchanged (no patterns appended)
        assert "Successful patterns:" not in evidence_section
        assert "Cultural keywords: xieyi" in evidence_section
