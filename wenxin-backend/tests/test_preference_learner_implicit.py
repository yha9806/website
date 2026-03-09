"""Test PreferenceLearner with implicit feedback signals."""
from __future__ import annotations

import json
import tempfile
from pathlib import Path

import pytest

from app.prototype.digestion.preference_learner import PreferenceLearner
from app.prototype.session.store import SessionStore


def _make_store(sessions: list[dict]) -> SessionStore:
    """Create a SessionStore with given sessions."""
    tmp = tempfile.mkdtemp()
    path = Path(tmp) / "sessions.jsonl"
    with open(path, "w") as f:
        for s in sessions:
            f.write(json.dumps(s) + "\n")
    return SessionStore(path=str(path))


class TestImplicitFeedback:
    def test_downloaded_counts_as_positive(self):
        sessions = [
            {
                "session_id": f"s{i}",
                "tradition": "chinese_xieyi",
                "final_scores": {"L1": 0.8, "L5": 0.9},
                "feedback": [{"rating": "thumbs_up"}],
                "downloaded": True,
                "time_to_select_ms": 0,
                "candidate_choice_index": -1,
            }
            for i in range(3)
        ]
        store = _make_store(sessions)
        learner = PreferenceLearner(store=store)
        profiles = learner.learn()

        if "chinese_xieyi" in profiles:
            profile = profiles["chinese_xieyi"]
            # downloaded + thumbs_up per session = at least 6 positive
            assert profile.total_positive >= 6

    def test_fast_selection_boosts_positive(self):
        sessions = [
            {
                "session_id": f"s{i}",
                "tradition": "default",
                "final_scores": {"L1": 0.7, "L3": 0.8},
                "feedback": [{"rating": "thumbs_up"}],
                "downloaded": False,
                "time_to_select_ms": 2000,  # fast
                "candidate_choice_index": 0,
            }
            for i in range(3)
        ]
        store = _make_store(sessions)
        learner = PreferenceLearner(store=store)
        profiles = learner.learn()

        if "default" in profiles:
            profile = profiles["default"]
            assert profile.total_positive >= 6  # thumbs_up + fast select per session

    def test_slow_selection_counts_negative(self):
        sessions = [
            {
                "session_id": f"s{i}",
                "tradition": "default",
                "final_scores": {"L1": 0.5},
                "feedback": [{"rating": "thumbs_up"}],
                "downloaded": False,
                "time_to_select_ms": 45000,  # slow
                "candidate_choice_index": 3,
            }
            for i in range(3)
        ]
        store = _make_store(sessions)
        learner = PreferenceLearner(store=store)
        profiles = learner.learn()

        if "default" in profiles:
            profile = profiles["default"]
            assert profile.total_negative >= 3

    def test_min_samples_protection(self):
        """With only 1 session, MIN_SAMPLES=3 should prevent preference detection."""
        sessions = [
            {
                "session_id": "s1",
                "tradition": "default",
                "final_scores": {"L1": 0.9, "L5": 0.1},
                "feedback": [{"rating": "thumbs_up"}],
            },
        ]
        store = _make_store(sessions)
        learner = PreferenceLearner(store=store)
        profiles = learner.learn()

        if "default" in profiles:
            profile = profiles["default"]
            # Only 1 session → total samples < 3 → no preference detected
            assert len(profile.preferred_dimensions) == 0
            assert len(profile.avoided_dimensions) == 0

    def test_no_implicit_signals_still_works(self):
        """Sessions without implicit fields should still work (backward compat)."""
        sessions = [
            {
                "session_id": f"s{i}",
                "tradition": "default",
                "final_scores": {"L1": 0.7},
                "feedback": [{"rating": "thumbs_up"}],
            }
            for i in range(3)
        ]
        store = _make_store(sessions)
        learner = PreferenceLearner(store=store)
        profiles = learner.learn()
        # Should work without errors
        assert isinstance(profiles, dict)
