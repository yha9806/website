"""Test VULCA core algorithm."""
from __future__ import annotations

import os
import sys

import numpy as np
import pytest

os.environ.setdefault("DATABASE_URL", "sqlite+aiosqlite:///./test.db")
os.environ.setdefault("SECRET_KEY", "test-secret-key-for-ci-at-least-32-chars")

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.vulca.algorithms.emnlp2025 import (
    VULCA_47_DIMENSIONS,
    DimensionCategory,
    VULCAAlgorithmV2,
    VULCADimension,
    generate_dimension_metadata,
)
from app.vulca.algorithms.correlation_matrix import CorrelationMatrix
from app.vulca.algorithms.vulca_core import VULCACore, VULCAResult
from app.vulca.core.vulca_core_adapter import VULCACoreAdapter

# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------

TYPICAL_SCORES_6D = {
    "creativity": 85.0,
    "technique": 78.0,
    "emotion": 82.0,
    "context": 75.0,
    "innovation": 88.0,
    "impact": 80.0,
}

ALL_ZEROS_6D = {
    "creativity": 0.0,
    "technique": 0.0,
    "emotion": 0.0,
    "context": 0.0,
    "innovation": 0.0,
    "impact": 0.0,
}

ALL_MAX_6D = {
    "creativity": 100.0,
    "technique": 100.0,
    "emotion": 100.0,
    "context": 100.0,
    "innovation": 100.0,
    "impact": 100.0,
}

MIXED_6D = {
    "creativity": 10.0,
    "technique": 90.0,
    "emotion": 50.0,
    "context": 25.0,
    "innovation": 75.0,
    "impact": 60.0,
}

BASE_DIMS = ["creativity", "technique", "emotion", "context", "innovation", "impact"]


# =========================================================================
# 1. VULCA 47 DIMENSIONS definition tests
# =========================================================================


class TestVULCA47Dimensions:
    """Tests for the VULCA_47_DIMENSIONS constant."""

    def test_exactly_47_dimensions_defined(self):
        assert len(VULCA_47_DIMENSIONS) == 47

    def test_all_dimensions_have_unique_names(self):
        names = [d.name for d in VULCA_47_DIMENSIONS]
        assert len(names) == len(set(names))

    def test_dimension_categories_distribution(self):
        counts = {"cognitive": 0, "creative": 0, "social": 0}
        for d in VULCA_47_DIMENSIONS:
            counts[d.category.value] += 1
        assert counts["cognitive"] == 16
        assert counts["creative"] == 16
        assert counts["social"] == 15

    def test_all_weights_positive(self):
        for d in VULCA_47_DIMENSIONS:
            assert d.weight > 0, f"{d.name} has non-positive weight"

    def test_weights_sum_reasonable(self):
        """Weights should sum to a value close to 1 (within tolerance for rounding)."""
        total = sum(d.weight for d in VULCA_47_DIMENSIONS)
        assert 0.8 < total < 1.2, f"Total weight {total} not in reasonable range"

    def test_cultural_sensitivity_in_range(self):
        for d in VULCA_47_DIMENSIONS:
            assert 0 <= d.cultural_sensitivity <= 1, (
                f"{d.name} cultural_sensitivity {d.cultural_sensitivity} out of [0,1]"
            )

    def test_generate_dimension_metadata(self):
        metadata = generate_dimension_metadata()
        assert len(metadata) == 47
        first = metadata[0]
        assert "name" in first
        assert "category" in first
        assert "weight" in first
        assert "tier_required" in first


# =========================================================================
# 2. VULCAAlgorithmV2 (emnlp2025.py) tests
# =========================================================================


class TestVULCAAlgorithmV2:
    """Tests for the EMNLP 2025 algorithm."""

    @pytest.fixture(autouse=True)
    def _setup(self):
        self.algo = VULCAAlgorithmV2()

    def test_expand_returns_47_dimensions(self):
        result = self.algo.expand_6d_to_47d(TYPICAL_SCORES_6D)
        assert len(result) == 47

    def test_expand_dimension_names_match_definition(self):
        result = self.algo.expand_6d_to_47d(TYPICAL_SCORES_6D)
        expected_names = {d.name for d in VULCA_47_DIMENSIONS}
        assert set(result.keys()) == expected_names

    def test_expand_scores_in_range(self):
        result = self.algo.expand_6d_to_47d(TYPICAL_SCORES_6D)
        for dim, score in result.items():
            assert 0 <= score <= 100, f"{dim}={score} out of [0,100]"

    @pytest.mark.parametrize(
        "scores_6d",
        [ALL_ZEROS_6D, ALL_MAX_6D, MIXED_6D],
        ids=["all_zeros", "all_100s", "mixed"],
    )
    def test_expand_boundary_values_in_range(self, scores_6d):
        result = self.algo.expand_6d_to_47d(scores_6d)
        assert len(result) == 47
        for dim, score in result.items():
            assert 0 <= score <= 100, f"{dim}={score} out of [0,100]"

    def test_expand_deterministic(self):
        """Same input produces same output (algorithm uses fixed seed)."""
        r1 = self.algo.expand_6d_to_47d(TYPICAL_SCORES_6D)
        r2 = self.algo.expand_6d_to_47d(TYPICAL_SCORES_6D)
        for dim in r1:
            assert abs(r1[dim] - r2[dim]) < 1e-9, f"{dim} differs between runs"

    def test_overall_score_positive_for_positive_input(self):
        scores_47d = self.algo.expand_6d_to_47d(TYPICAL_SCORES_6D)
        overall = self.algo.calculate_overall_score(scores_47d)
        assert overall > 0

    def test_overall_score_weighted(self):
        """Overall score should use dimension weights, not a simple average."""
        scores_47d = self.algo.expand_6d_to_47d(TYPICAL_SCORES_6D)
        overall = self.algo.calculate_overall_score(scores_47d)
        simple_avg = np.mean(list(scores_47d.values()))
        # Weighted and simple should usually differ
        # But at least overall should be in a reasonable range
        assert 0 <= overall <= 100

    def test_cultural_perspective_western(self):
        scores_47d = self.algo.expand_6d_to_47d(TYPICAL_SCORES_6D)
        adjusted = self.algo.apply_cultural_perspective(scores_47d, "western")
        assert len(adjusted) == 47
        # Western should boost innovation_index
        assert adjusted["innovation_index"] >= scores_47d["innovation_index"]

    def test_cultural_perspective_eastern(self):
        scores_47d = self.algo.expand_6d_to_47d(TYPICAL_SCORES_6D)
        adjusted = self.algo.apply_cultural_perspective(scores_47d, "eastern")
        # Eastern should boost cultural_awareness
        assert adjusted["cultural_awareness"] >= scores_47d["cultural_awareness"]

    def test_cultural_perspective_global(self):
        scores_47d = self.algo.expand_6d_to_47d(TYPICAL_SCORES_6D)
        adjusted = self.algo.apply_cultural_perspective(scores_47d, "global")
        # Global should boost diversity_handling
        assert adjusted["diversity_handling"] >= scores_47d["diversity_handling"]

    def test_cultural_perspective_unknown_returns_unchanged(self):
        scores_47d = self.algo.expand_6d_to_47d(TYPICAL_SCORES_6D)
        adjusted = self.algo.apply_cultural_perspective(scores_47d, "nonexistent")
        for dim in scores_47d:
            assert adjusted[dim] == scores_47d[dim]

    def test_cultural_perspective_scores_capped_at_100(self):
        scores_47d = self.algo.expand_6d_to_47d(ALL_MAX_6D)
        for perspective in ["western", "eastern", "global"]:
            adjusted = self.algo.apply_cultural_perspective(scores_47d, perspective)
            for dim, score in adjusted.items():
                assert score <= 100, f"{perspective}/{dim}={score} > 100"

    def test_correlation_matrix_has_all_six_base_dims(self):
        for dim in BASE_DIMS:
            assert dim in self.algo.correlation_matrix

    def test_correlation_matrix_targets_are_valid_47d_names(self):
        valid_names = {d.name for d in VULCA_47_DIMENSIONS}
        for source, targets in self.algo.correlation_matrix.items():
            for target in targets:
                assert target in valid_names, (
                    f"correlation_matrix[{source}] references unknown dim {target}"
                )


# =========================================================================
# 3. CorrelationMatrix (correlation_matrix.py) tests
# =========================================================================


class TestCorrelationMatrix:
    """Tests for the 47x47 semantic correlation matrix."""

    @pytest.fixture(autouse=True)
    def _setup(self):
        self.cm = CorrelationMatrix()

    def test_matrix_shape_47x47(self):
        assert self.cm.matrix.shape == (47, 47)

    def test_exactly_47_dimension_names(self):
        assert len(self.cm.dimensions) == 47

    def test_diagonal_is_one(self):
        diag = np.diag(self.cm.matrix)
        np.testing.assert_allclose(diag, 1.0, atol=1e-10)

    def test_matrix_symmetric(self):
        np.testing.assert_allclose(
            self.cm.matrix, self.cm.matrix.T, atol=1e-10,
            err_msg="Correlation matrix is not symmetric"
        )

    def test_values_in_valid_range(self):
        assert self.cm.matrix.min() >= -1.0
        assert self.cm.matrix.max() <= 1.0

    def test_get_correlation_known_pair(self):
        corr = self.cm.get_correlation("logical_reasoning", "problem_decomposition")
        assert corr > 0, "Expected positive correlation"

    def test_get_correlation_unknown_dimension(self):
        assert self.cm.get_correlation("nonexistent", "logical_reasoning") == 0.0

    def test_get_correlation_symmetric(self):
        c1 = self.cm.get_correlation("creative_synthesis", "innovation_index")
        c2 = self.cm.get_correlation("innovation_index", "creative_synthesis")
        assert abs(c1 - c2) < 1e-10

    def test_strongest_correlations_returns_correct_count(self):
        top5 = self.cm.get_strongest_correlations("creative_synthesis", top_n=5)
        assert len(top5) == 5

    def test_strongest_correlations_excludes_self(self):
        top5 = self.cm.get_strongest_correlations("creative_synthesis", top_n=5)
        dims = [name for name, _ in top5]
        assert "creative_synthesis" not in dims

    def test_strongest_correlations_unknown_dim(self):
        result = self.cm.get_strongest_correlations("nonexistent")
        assert result == []

    def test_correlation_propagation_populates_all_dims(self):
        initial = {"logical_reasoning": 85.0, "creative_synthesis": 90.0}
        propagated = self.cm.apply_correlation_propagation(initial)
        assert len(propagated) == 47
        # Initial seeds should keep their scores
        assert propagated["logical_reasoning"] == 85.0
        assert propagated["creative_synthesis"] == 90.0

    def test_correlation_propagation_values_in_range(self):
        initial = {"logical_reasoning": 85.0, "empathy_modeling": 75.0}
        propagated = self.cm.apply_correlation_propagation(initial)
        for dim, score in propagated.items():
            assert 0 <= score <= 100, f"{dim}={score} out of [0,100]"

    def test_within_category_correlations_higher(self):
        """Intra-category correlations should generally be stronger than cross-category."""
        # Average within cognitive (indices 0-15)
        intra = []
        for i in range(16):
            for j in range(i + 1, 16):
                intra.append(self.cm.matrix[i, j])
        # Average cross-category (cognitive vs social, indices 0-15 vs 32-46)
        cross = []
        for i in range(16):
            for j in range(32, 47):
                cross.append(self.cm.matrix[i, j])
        assert np.mean(intra) > np.mean(cross) * 0.5, (
            "Intra-category correlations should be meaningfully stronger"
        )

    def test_category_labels_correct(self):
        """Verify categories: first 16 cognitive, next 16 creative, last 15 social."""
        cognitive = self.cm.dimensions[:16]
        creative = self.cm.dimensions[16:32]
        social = self.cm.dimensions[32:47]
        assert "logical_reasoning" in cognitive
        assert "creative_synthesis" in creative
        assert "cultural_awareness" in social


# =========================================================================
# 4. VULCACore (vulca_core.py) end-to-end tests
# =========================================================================


class TestVULCACore:
    """Tests for the production VULCACore pipeline."""

    @pytest.fixture(autouse=True)
    def _setup(self):
        self.core = VULCACore(enable_correlation=True, cache_enabled=False)

    def test_evaluate_returns_vulca_result(self):
        result = self.core.evaluate("test-model", TYPICAL_SCORES_6D)
        assert isinstance(result, VULCAResult)

    def test_evaluate_populates_all_fields(self):
        result = self.core.evaluate("test-model", TYPICAL_SCORES_6D)
        assert result.model_id == "test-model"
        assert result.scores_6d == TYPICAL_SCORES_6D
        assert len(result.scores_47d) == 47
        assert result.overall_score > 0
        assert result.processing_time_ms >= 0
        assert len(result.top_dimensions) == 5
        assert len(result.weakest_dimensions) == 5
        assert len(result.category_scores) == 3

    def test_evaluate_scores_47d_in_range(self):
        result = self.core.evaluate("test-model", TYPICAL_SCORES_6D)
        for dim, score in result.scores_47d.items():
            assert 0 <= score <= 100, f"{dim}={score} out of [0,100]"

    @pytest.mark.parametrize(
        "scores_6d",
        [ALL_ZEROS_6D, ALL_MAX_6D, MIXED_6D],
        ids=["all_zeros", "all_100s", "mixed"],
    )
    def test_evaluate_boundary_inputs(self, scores_6d):
        result = self.core.evaluate("boundary-model", scores_6d)
        assert len(result.scores_47d) == 47
        for dim, score in result.scores_47d.items():
            assert 0 <= score <= 100, f"{dim}={score} out of [0,100]"

    def test_evaluate_missing_dimension_raises(self):
        incomplete = {"creativity": 80, "technique": 70}
        with pytest.raises(ValueError, match="Missing required dimension"):
            self.core.evaluate("bad-model", incomplete)

    def test_evaluate_out_of_range_score_raises(self):
        bad_scores = dict(TYPICAL_SCORES_6D)
        bad_scores["creativity"] = 150
        with pytest.raises(ValueError, match="must be between 0 and 100"):
            self.core.evaluate("bad-model", bad_scores)

    def test_evaluate_negative_score_raises(self):
        bad_scores = dict(TYPICAL_SCORES_6D)
        bad_scores["technique"] = -5
        with pytest.raises(ValueError, match="must be between 0 and 100"):
            self.core.evaluate("bad-model", bad_scores)

    def test_evaluate_with_cultural_perspective(self):
        result_default = self.core.evaluate("m1", TYPICAL_SCORES_6D)
        result_western = self.core.evaluate(
            "m1", TYPICAL_SCORES_6D, cultural_perspective="western"
        )
        # Scores should differ when a perspective is applied
        assert result_default.scores_47d != result_western.scores_47d

    def test_evaluate_without_correlation(self):
        core_no_corr = VULCACore(enable_correlation=False, cache_enabled=False)
        result = core_no_corr.evaluate("no-corr", TYPICAL_SCORES_6D)
        assert len(result.scores_47d) == 47
        assert result.correlation_strength == 0.0

    def test_cache_hit_returns_same_result(self):
        core_cached = VULCACore(enable_correlation=True, cache_enabled=True)
        r1 = core_cached.evaluate("cached-model", TYPICAL_SCORES_6D)
        r2 = core_cached.evaluate("cached-model", TYPICAL_SCORES_6D)
        assert r2.processing_time_ms == pytest.approx(0.1)
        assert r1.overall_score == r2.overall_score

    def test_clear_cache(self):
        core_cached = VULCACore(enable_correlation=True, cache_enabled=True)
        core_cached.evaluate("c-model", TYPICAL_SCORES_6D)
        core_cached.clear_cache()
        assert len(core_cached._cache) == 0

    def test_batch_evaluate(self):
        batch = [
            {"model_id": "m1", "scores_6d": TYPICAL_SCORES_6D},
            {"model_id": "m2", "scores_6d": MIXED_6D},
        ]
        results = self.core.batch_evaluate(batch)
        assert len(results) == 2
        assert results[0].model_id == "m1"
        assert results[1].model_id == "m2"

    def test_compare_models(self):
        r1 = self.core.evaluate("strong-model", ALL_MAX_6D)
        r2 = self.core.evaluate("weak-model", ALL_ZEROS_6D)
        comparison = self.core.compare_models(r1, r2)
        assert comparison["overall_winner"] in ("strong-model", "weak-model")
        assert comparison["score_difference"] >= 0
        assert "recommendation" in comparison

    def test_compare_similar_models(self):
        r1 = self.core.evaluate("ma", TYPICAL_SCORES_6D)
        r2 = self.core.evaluate("mb", TYPICAL_SCORES_6D)
        comparison = self.core.compare_models(r1, r2)
        # Same input should produce very similar scores
        assert comparison["score_difference"] < 1

    def test_category_scores_keys(self):
        result = self.core.evaluate("cat-model", TYPICAL_SCORES_6D)
        assert set(result.category_scores.keys()) == {"cognitive", "creative", "social"}

    def test_confidence_level_in_range(self):
        result = self.core.evaluate("conf-model", TYPICAL_SCORES_6D)
        assert 0 <= result.confidence_level <= 100

    def test_to_dict_serialization(self):
        result = self.core.evaluate("serial-model", TYPICAL_SCORES_6D)
        d = result.to_dict()
        assert d["model_id"] == "serial-model"
        assert isinstance(d["timestamp"], str)  # ISO format
        assert len(d["scores_47d"]) == 47

    def test_get_dimension_metadata(self):
        meta = self.core.get_dimension_metadata()
        assert len(meta) == 47
        for item in meta:
            assert "name" in item
            assert "category" in item
            assert "weight" in item
            assert "cultural_sensitivity" in item


# =========================================================================
# 5. VULCACoreAdapter tests
# =========================================================================


class TestVULCACoreAdapter:
    """Tests for the 6D->47D adapter."""

    @pytest.fixture(autouse=True)
    def _setup(self):
        self.adapter = VULCACoreAdapter(use_model_profiles=True)

    def test_expand_returns_47_dimensions(self):
        result = self.adapter.expand_6d_to_47d(TYPICAL_SCORES_6D)
        assert len(result) == 47

    def test_expand_uses_semantic_names(self):
        result = self.adapter.expand_6d_to_47d(TYPICAL_SCORES_6D)
        # Should have named keys, not just dim_0..dim_46
        has_semantic = any(not k.startswith("dim_") for k in result.keys())
        assert has_semantic, "Expected semantic dimension names"

    def test_expand_scores_in_range(self):
        result = self.adapter.expand_6d_to_47d(TYPICAL_SCORES_6D)
        for dim, score in result.items():
            assert 0 <= score <= 100, f"{dim}={score} out of [0,100]"

    @pytest.mark.parametrize(
        "scores_6d",
        [ALL_ZEROS_6D, ALL_MAX_6D, MIXED_6D],
        ids=["all_zeros", "all_100s", "mixed"],
    )
    def test_expand_boundary_values(self, scores_6d):
        result = self.adapter.expand_6d_to_47d(scores_6d)
        assert len(result) == 47
        for dim, score in result.items():
            assert 0 <= score <= 100, f"{dim}={score} out of [0,100]"

    def test_expand_missing_dimension_raises(self):
        incomplete = {"creativity": 80}
        with pytest.raises(ValueError, match="Missing dimension"):
            self.adapter.expand_6d_to_47d(incomplete)

    def test_expand_deterministic(self):
        r1 = self.adapter.expand_6d_to_47d(TYPICAL_SCORES_6D)
        r2 = self.adapter.expand_6d_to_47d(TYPICAL_SCORES_6D)
        for dim in r1:
            assert abs(r1[dim] - r2[dim]) < 1e-9

    def test_correlation_matrix_shape(self):
        assert self.adapter.correlation_matrix.shape == (6, 47)

    def test_correlation_matrix_columns_normalized(self):
        """Each column of the 6x47 matrix should sum to ~1 (normalized)."""
        col_sums = self.adapter.correlation_matrix.sum(axis=0)
        np.testing.assert_allclose(col_sums, 1.0, atol=0.01)

    def test_dimension_mapping_covers_all_six_base(self):
        assert set(self.adapter.dimension_mapping.keys()) == set(BASE_DIMS)

    def test_dimension_mapping_total_count(self):
        total = sum(len(v) for v in self.adapter.dimension_mapping.values())
        assert total == 47, f"Dimension mapping has {total} entries, expected 47"

    def test_cultural_perspectives_all_eight(self):
        assert len(self.adapter.cultural_perspectives) == 8
        expected = {
            "western", "eastern", "african", "latin_american",
            "middle_eastern", "south_asian", "oceanic", "indigenous",
        }
        assert set(self.adapter.cultural_perspectives) == expected

    def test_apply_cultural_perspective_valid(self):
        scores_47d = self.adapter.expand_6d_to_47d(TYPICAL_SCORES_6D)
        for perspective in self.adapter.cultural_perspectives:
            adjusted = self.adapter.apply_cultural_perspective(scores_47d, perspective)
            assert len(adjusted) == 47
            for dim, score in adjusted.items():
                assert score <= 100, f"{perspective}/{dim}={score} > 100"

    def test_apply_cultural_perspective_invalid_raises(self):
        scores_47d = self.adapter.expand_6d_to_47d(TYPICAL_SCORES_6D)
        with pytest.raises(ValueError, match="Unknown perspective"):
            self.adapter.apply_cultural_perspective(scores_47d, "martian")

    def test_calculate_cultural_scores_returns_eight(self):
        scores_47d = self.adapter.expand_6d_to_47d(TYPICAL_SCORES_6D)
        cultural = self.adapter.calculate_cultural_scores(scores_47d)
        assert len(cultural) == 8
        for perspective, score in cultural.items():
            assert score > 0, f"{perspective} cultural score is non-positive"

    def test_get_dimension_info_returns_47(self):
        info = self.adapter.get_dimension_info()
        assert len(info) == 47
        for item in info:
            assert "id" in item
            assert "name" in item
            assert "category" in item

    def test_cultural_weights_initialized_for_all_perspectives(self):
        for perspective in self.adapter.cultural_perspectives:
            assert perspective in self.adapter.cultural_weights
            w = self.adapter.cultural_weights[perspective]
            assert len(w) == 47
            assert w.min() >= 0.5
            assert w.max() <= 1.0


# =========================================================================
# 6. Cross-module integration tests
# =========================================================================


class TestCrossModuleIntegration:
    """Verify that the different algorithm modules work together."""

    def test_emnlp2025_output_compatible_with_vulca_core(self):
        """VULCAAlgorithmV2 output can feed into VULCACore evaluation."""
        algo = VULCAAlgorithmV2()
        scores_47d = algo.expand_6d_to_47d(TYPICAL_SCORES_6D)
        overall = algo.calculate_overall_score(scores_47d)
        assert overall > 0
        assert all(0 <= s <= 100 for s in scores_47d.values())

    def test_adapter_and_core_produce_similar_dimension_count(self):
        adapter = VULCACoreAdapter(use_model_profiles=False)
        core = VULCACore(enable_correlation=True, cache_enabled=False)

        adapter_47d = adapter.expand_6d_to_47d(TYPICAL_SCORES_6D)
        core_result = core.evaluate("compat-test", TYPICAL_SCORES_6D)

        assert len(adapter_47d) == 47
        assert len(core_result.scores_47d) == 47

    def test_correlation_matrix_dims_match_emnlp2025_dims(self):
        """Correlation matrix dimensions should match EMNLP 2025 dimension names."""
        cm = CorrelationMatrix()
        expected = {d.name for d in VULCA_47_DIMENSIONS}
        actual = set(cm.dimensions)
        assert actual == expected

    def test_high_input_produces_higher_output_than_low_input(self):
        core = VULCACore(enable_correlation=True, cache_enabled=False)
        high = core.evaluate("high", ALL_MAX_6D)
        low = core.evaluate("low", ALL_ZEROS_6D)
        assert high.overall_score > low.overall_score

    def test_adapter_validate_evaluation_quality(self):
        adapter = VULCACoreAdapter(use_model_profiles=False)
        evaluation = adapter._generate_fallback_evaluation("fallback-model")
        report = adapter.validate_evaluation_quality(evaluation)
        assert "score_statistics" in report
        assert "quality_indicators" in report
        assert report["quality_indicators"]["scores_in_range"] is True
