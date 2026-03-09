"""NB2 real E2E tests — require GOOGLE_API_KEY and network access.

Run with:
    GOOGLE_API_KEY=xxx pytest tests/test_nb2_real_e2e.py -v -m slow --timeout=300
"""

from __future__ import annotations

import os

import pytest

_HAS_KEY = bool(os.getenv("GOOGLE_API_KEY") or os.getenv("GEMINI_API_KEY"))
_skip = pytest.mark.skipif(not _HAS_KEY, reason="GOOGLE_API_KEY not set")


@pytest.mark.slow
@_skip
class TestNB2RealGenerate:
    """Test NB2Provider.generate() with real Gemini API."""

    def test_generates_valid_image(self, tmp_path):
        """NB2 generates a valid PNG file."""
        from app.prototype.agents.nb2_provider import NB2Provider

        api_key = os.getenv("GOOGLE_API_KEY") or os.getenv("GEMINI_API_KEY", "")
        provider = NB2Provider(api_key=api_key)

        out_path = str(tmp_path / "test_output.png")
        result = provider.generate(
            prompt="A simple red circle on white background, minimalist",
            negative_prompt="",
            seed=42,
            width=512,
            height=512,
            steps=20,
            sampler="default",
            output_path=out_path,
        )

        assert os.path.exists(result), f"Output file not found: {result}"
        # Verify it's a valid PNG (starts with PNG magic bytes)
        with open(result, "rb") as f:
            header = f.read(8)
        assert header[:4] == b"\x89PNG", "Output is not a valid PNG"
        # File should be non-trivial size (>1KB)
        assert os.path.getsize(result) > 1024, "PNG too small — likely empty"


@pytest.mark.slow
@_skip
class TestFullPipelineE2E:
    """Test complete Scout→Draft→Critic→Queen pipeline with real NB2."""

    def test_pipeline_completes_with_scores(self, tmp_path, monkeypatch):
        """Full pipeline produces stages and a best candidate."""
        from app.prototype.orchestrator.orchestrator import PipelineOrchestrator
        from app.prototype.pipeline.pipeline_types import PipelineInput
        from app.prototype.agents.draft_config import DraftConfig

        # Use tmp_path for checkpoints to avoid polluting repo
        monkeypatch.setenv("VULCA_CHECKPOINT_DIR", str(tmp_path))

        api_key = os.getenv("GOOGLE_API_KEY") or os.getenv("GEMINI_API_KEY", "")
        draft_cfg = DraftConfig(
            provider="nb2",
            api_key=api_key,
            n_candidates=1,  # minimal for speed
        )

        orch = PipelineOrchestrator(
            draft_config=draft_cfg,
            enable_hitl=False,
            enable_evidence_loop=True,
            enable_agent_critic=False,  # use rule-based critic for speed
        )

        pipe_input = PipelineInput(
            task_id="e2e-test-001",
            subject="bamboo in morning mist",
            cultural_tradition="chinese_xieyi",
        )

        result = orch.run_sync(pipe_input)

        # Pipeline should complete
        assert result is not None
        assert result.success is True, f"Pipeline failed: {result.error}"

        # Should have gone through stages
        stage_names = [s.stage for s in (result.stages or [])]
        # At minimum, draft and critic stages should exist
        assert len(result.stages or []) >= 2, f"Too few stages: {stage_names}"

        # Best candidate should be identified
        assert result.best_candidate_id, "No best candidate identified"


@pytest.mark.slow
@_skip
class TestSessionDigestPersistence:
    """Test that SessionDigest can be persisted to SessionStore."""

    def test_session_stored_and_retrieved(self, tmp_path, monkeypatch):
        """SessionStore correctly appends and retrieves a SessionDigest."""
        import app.prototype.session.store as store_module
        from app.prototype.session.store import SessionStore
        from app.prototype.session.types import SessionDigest

        # Use a temp file for session store
        store_path = str(tmp_path / "sessions.jsonl")
        monkeypatch.setattr(store_module, "_DEFAULT_PATH", store_path)

        # Reset singleton to use new path
        SessionStore._instance = None
        store = SessionStore(path=store_path)

        initial_count = store.count()

        # Create and persist a synthetic digest
        digest = SessionDigest(
            mode="create",
            intent="test bamboo painting",
            tradition="chinese_xieyi",
            subject="bamboo",
            user_type="human",
            final_scores={"L1": 0.8, "L2": 0.7, "L3": 0.9, "L4": 0.6, "L5": 0.75},
            final_weighted_total=0.75,
            total_rounds=1,
        )
        store.append(digest)

        assert store.count() == initial_count + 1

        # Verify data roundtrip
        all_sessions = store.get_all()
        last = all_sessions[-1]
        assert last["tradition"] == "chinese_xieyi"
        assert last["final_scores"]["L1"] == 0.8

        # Cleanup singleton
        SessionStore._instance = None
