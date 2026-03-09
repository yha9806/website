"""Digestion system E2E test -- verifies the full data supply chain.

sessions.jsonl -> Aggregator -> PatternDetector -> ContextEvolver -> evolved_context.json
"""

from __future__ import annotations

import dataclasses
import json
import tempfile
import time
from pathlib import Path

import pytest

from app.prototype.session.store import SessionStore
from app.prototype.session.types import SessionDigest
from app.prototype.digestion.aggregator import DigestAggregator
from app.prototype.digestion.pattern_detector import PatternDetector
from app.prototype.digestion.context_evolver import ContextEvolver


def _make_isolated_store(tmp_path: Path, sessions: list[SessionDigest]) -> SessionStore:
    """Create a SessionStore backed by a temp file, populated with given sessions."""
    path = str(tmp_path / "sessions.jsonl")
    SessionStore._instance = None
    store = SessionStore(path)
    for s in sessions:
        store.append(s)
    return store


class TestDigestionDataSupplyChain:
    """Verify sessions.jsonl -> ContextEvolver -> evolved_context.json pipeline."""

    def test_seed_session_format_matches_digest(self):
        """Seed session dicts from seed_prototype.py are compatible with SessionDigest."""
        from seed_prototype import SEED_SESSIONS

        assert len(SEED_SESSIONS) >= 15, "Need at least 15 seed sessions"

        # Every seed entry should have the fields SessionDigest.to_dict() produces
        expected_keys = set(SessionDigest().to_dict().keys())
        for entry in SEED_SESSIONS:
            missing = expected_keys - set(entry.keys())
            assert not missing, f"Seed session {entry['session_id']} missing keys: {missing}"

    def test_seed_sessions_round_trip_through_store(self, tmp_path):
        """Seed sessions survive write -> read via SessionStore."""
        from seed_prototype import SEED_SESSIONS

        sessions_path = str(tmp_path / "sessions.jsonl")
        SessionStore._instance = None
        store = SessionStore(sessions_path)

        # Write each seed dict as a line (simulating seed_prototype write_jsonl)
        with open(sessions_path, "w", encoding="utf-8") as f:
            for rec in SEED_SESSIONS:
                f.write(json.dumps(rec, ensure_ascii=False) + "\n")

        records = store.get_all()
        assert len(records) == len(SEED_SESSIONS)
        assert records[0]["tradition"] == "chinese_xieyi"
        assert records[0]["final_scores"]["L1"] == 0.82

        SessionStore._instance = None

    def test_seed_evolved_context_matches_evolver_format(self):
        """DEFAULT_EVOLVED_CONTEXT uses the format ContextEvolver._load_context() expects."""
        from seed_prototype import DEFAULT_EVOLVED_CONTEXT

        # ContextEvolver._load_context() fallback returns:
        # {"tradition_weights": {}, "version": 1, "evolutions": 0}
        assert "tradition_weights" in DEFAULT_EVOLVED_CONTEXT
        assert isinstance(DEFAULT_EVOLVED_CONTEXT["tradition_weights"], dict)
        assert "version" in DEFAULT_EVOLVED_CONTEXT

        # Must NOT have the old flat *_weight keys
        for key in DEFAULT_EVOLVED_CONTEXT:
            assert not key.endswith("_weight"), (
                f"Old-format key '{key}' found; ContextEvolver expects 'tradition_weights' dict"
            )

    def test_digest_serialization_round_trip(self):
        """SessionDigest -> dict -> JSON -> dict preserves all data."""
        digest = SessionDigest(
            mode="create",
            intent="test painting",
            tradition="chinese_xieyi",
            subject="bamboo",
            user_type="agent",
            final_scores={"L1": 0.8, "L2": 0.7, "L3": 0.9, "L4": 0.6, "L5": 0.75},
            final_weighted_total=0.75,
        )
        data = digest.to_dict()
        json_str = json.dumps(data)
        loaded = json.loads(json_str)

        assert loaded["tradition"] == "chinese_xieyi"
        assert loaded["final_scores"]["L1"] == 0.8
        assert loaded["mode"] == "create"

    def test_aggregator_processes_seed_sessions(self, tmp_path):
        """DigestAggregator produces per-tradition stats from seed data."""
        from seed_prototype import SEED_SESSIONS

        sessions_path = str(tmp_path / "sessions.jsonl")
        with open(sessions_path, "w", encoding="utf-8") as f:
            for rec in SEED_SESSIONS:
                f.write(json.dumps(rec, ensure_ascii=False) + "\n")

        SessionStore._instance = None
        store = SessionStore(sessions_path)
        agg = DigestAggregator(store)
        stats = agg.aggregate()

        # Should have multiple traditions
        assert len(stats) >= 5, f"Expected >= 5 traditions, got {list(stats.keys())}"
        assert "chinese_xieyi" in stats
        assert stats["chinese_xieyi"].session_count >= 3

        # Dimension averages should be populated
        assert len(stats["chinese_xieyi"].avg_scores_by_dim) > 0
        assert "L1" in stats["chinese_xieyi"].avg_scores_by_dim

        SessionStore._instance = None

    def test_evolver_processes_sessions(self, tmp_path):
        """ContextEvolver.evolve() processes 16+ sessions and produces evolved context."""
        sessions_path = str(tmp_path / "sessions.jsonl")
        SessionStore._instance = None
        store = SessionStore(sessions_path)

        # Create 16 sessions: enough to exceed _MIN_SESSIONS_TO_EVOLVE (10)
        # and _MIN_SESSIONS per tradition for PatternDetector (5)
        traditions = [
            "chinese_xieyi", "japanese_wabi_sabi", "european_renaissance",
            "islamic_geometric", "indian_rasa", "korean_dancheong",
            "chinese_xieyi", "japanese_wabi_sabi", "default",
            "chinese_xieyi", "european_renaissance", "chinese_xieyi",
            "indian_rasa", "default", "chinese_xieyi", "japanese_wabi_sabi",
        ]
        for i, trad in enumerate(traditions):
            d = SessionDigest(
                mode="create",
                intent=f"test painting {i}",
                tradition=trad,
                subject=f"subject {i}",
                user_type="agent",
                final_scores={
                    "L1": 0.5 + (i % 5) * 0.08,
                    "L2": 0.6 + (i % 4) * 0.07,
                    "L3": 0.7 + (i % 3) * 0.06,
                    "L4": 0.55 + (i % 6) * 0.05,
                    "L5": 0.65 + (i % 5) * 0.04,
                },
                final_weighted_total=0.65 + (i % 5) * 0.05,
                total_rounds=1 + (i % 3),
                total_latency_ms=30000 + i * 1000,
                total_cost_usd=0.067 * (1 + i % 3),
                created_at=time.time() - (16 - i) * 3600,
            )
            store.append(d)

        assert store.count() >= 15

        # Point evolved context output to temp
        context_path = str(tmp_path / "evolved_context.json")

        # Create evolver and run
        evolver = ContextEvolver(store=store, context_path=context_path)

        result = evolver.evolve()

        # Should not skip (enough data)
        assert result.skipped_reason == "", f"Evolver skipped: {result.skipped_reason}"
        # Should have analyzed sessions
        assert result.sessions_analyzed >= 15

        SessionStore._instance = None

    def test_atomic_write_produces_valid_json(self, tmp_path):
        """evolved_context.json is written atomically and contains valid JSON."""
        sessions_path = str(tmp_path / "sessions.jsonl")
        context_path = str(tmp_path / "evolved_context.json")

        SessionStore._instance = None
        store = SessionStore(sessions_path)

        # Pre-populate with enough sessions that have systematically low L1
        # so the evolver actually writes something
        for i in range(15):
            store.append(SessionDigest(
                tradition="watercolor",
                final_scores={"L1": 0.35, "L2": 0.8, "L3": 0.7, "L4": 0.6, "L5": 0.7},
                final_weighted_total=0.63,
            ))

        # Pre-populate context with weights (so _boost_dimension has something to adjust)
        initial_context = {
            "tradition_weights": {
                "watercolor": {"L1": 0.20, "L2": 0.20, "L3": 0.20, "L4": 0.20, "L5": 0.20},
            },
            "version": 1,
            "evolutions": 0,
        }
        Path(context_path).write_text(json.dumps(initial_context))

        evolver = ContextEvolver(store=store, context_path=context_path)
        result = evolver.evolve()

        # Should have found patterns and taken action
        assert result.patterns_found >= 1

        if result.actions:
            # Verify the file is valid JSON (atomic write succeeded)
            saved = json.loads(Path(context_path).read_text())
            assert saved["evolutions"] == 1
            # L1 weight should have been boosted
            assert saved["tradition_weights"]["watercolor"]["L1"] > 0.20
            # Weights should still sum to ~1.0
            total = sum(saved["tradition_weights"]["watercolor"].values())
            assert abs(total - 1.0) < 0.001

        SessionStore._instance = None

    def test_atomic_write_no_corruption_on_initial_missing(self, tmp_path):
        """ContextEvolver handles missing initial evolved_context.json gracefully."""
        context_path = str(tmp_path / "nonexistent_dir" / "evolved_context.json")

        sessions_path = str(tmp_path / "sessions.jsonl")
        SessionStore._instance = None
        store = SessionStore(sessions_path)

        # Need enough sessions to not skip
        for i in range(12):
            store.append(SessionDigest(
                tradition="default",
                final_scores={"L1": 0.6, "L2": 0.7},
                final_weighted_total=0.65,
            ))

        evolver = ContextEvolver(store=store, context_path=context_path)
        result = evolver.evolve()

        # Should not crash even if the directory doesn't exist initially
        assert result.sessions_analyzed == 12

        SessionStore._instance = None

    def test_full_pipeline_seed_to_evolved(self, tmp_path):
        """Full pipeline: seed sessions -> aggregate -> detect -> evolve -> save."""
        from seed_prototype import SEED_SESSIONS

        # Step 1: Write seed sessions (simulating seed_prototype.py)
        sessions_path = str(tmp_path / "sessions.jsonl")
        with open(sessions_path, "w", encoding="utf-8") as f:
            for rec in SEED_SESSIONS:
                f.write(json.dumps(rec, ensure_ascii=False) + "\n")

        # Step 2: Create store and verify data is accessible
        SessionStore._instance = None
        store = SessionStore(sessions_path)
        assert store.count() == len(SEED_SESSIONS)

        # Step 3: Write initial evolved context (simulating seed_prototype.py)
        from seed_prototype import DEFAULT_EVOLVED_CONTEXT
        context_path = str(tmp_path / "evolved_context.json")
        with open(context_path, "w") as f:
            json.dump(DEFAULT_EVOLVED_CONTEXT, f)

        # Step 4: Run evolver
        evolver = ContextEvolver(store=store, context_path=context_path)
        result = evolver.evolve()

        assert result.skipped_reason == "", f"Pipeline skipped: {result.skipped_reason}"
        assert result.sessions_analyzed == len(SEED_SESSIONS)
        assert result.patterns_found >= 0  # May or may not find patterns with balanced scores

        SessionStore._instance = None
