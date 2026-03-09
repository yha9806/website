"""Test SessionDigest cultural features extension."""
from __future__ import annotations
import pytest

from app.prototype.session.types import SessionDigest, RoundSnapshot


class TestSessionDigestExtensions:
    def test_new_fields_defaults(self):
        digest = SessionDigest()
        assert digest.cultural_features == {}
        assert digest.critic_insights == []
        assert digest.candidate_choice_index == -1
        assert digest.time_to_select_ms == 0
        assert digest.downloaded is False

    def test_new_fields_in_to_dict(self):
        digest = SessionDigest(
            cultural_features={"l5_emphasis": 0.85},
            critic_insights=["strong L5"],
            candidate_choice_index=2,
            time_to_select_ms=3500,
            downloaded=True,
        )
        d = digest.to_dict()
        assert d["cultural_features"] == {"l5_emphasis": 0.85}
        assert d["critic_insights"] == ["strong L5"]
        assert d["candidate_choice_index"] == 2
        assert d["time_to_select_ms"] == 3500
        assert d["downloaded"] is True

    def test_backward_compat_no_new_fields(self):
        """Existing code that doesn't pass new fields should still work."""
        digest = SessionDigest(
            session_id="test-123",
            mode="create",
            tradition="chinese_xieyi",
        )
        d = digest.to_dict()
        assert d["session_id"] == "test-123"
        assert d["cultural_features"] == {}


class TestExtractCulturalFeatures:
    def test_basic_extraction(self):
        from app.prototype.api.create_routes import _extract_cultural_features
        features = _extract_cultural_features(
            tradition="chinese_xieyi",
            final_scores={"L1": 0.8, "L2": 0.7, "L3": 0.9, "L4": 0.6, "L5": 0.85},
            risk_flags=[],
        )
        assert features["tradition_specificity"] == 0.8
        assert "l5_emphasis" in features
        assert "avg_score" in features
        assert features["risk_level"] == 0.0

    def test_default_tradition_lower_specificity(self):
        from app.prototype.api.create_routes import _extract_cultural_features
        features = _extract_cultural_features("default", {"L1": 0.5}, [])
        assert features["tradition_specificity"] == 0.3

    def test_empty_scores(self):
        from app.prototype.api.create_routes import _extract_cultural_features
        features = _extract_cultural_features("default", {}, [])
        assert features == {}

    def test_risk_flags_increase_risk_level(self):
        from app.prototype.api.create_routes import _extract_cultural_features
        features = _extract_cultural_features(
            "chinese_xieyi",
            {"L1": 0.5},
            ["[critical] taboo", "[high] sensitive"],
        )
        assert features["risk_level"] == 0.5
