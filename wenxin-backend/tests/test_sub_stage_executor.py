"""Tests for SubStageExecutor — execution ordering, failure handling, callbacks."""

from __future__ import annotations

import pytest

from app.prototype.media.types import (
    CreationRecipe,
    MediaType,
    SubStageArtifact,
    SubStageDef,
    SubStageResult,
)
from app.prototype.media.sub_stage_executor import SubStageExecutor
from app.prototype.media.image_handlers import get_image_handlers
from app.prototype.media.recipes import IMAGE_STANDARD_RECIPE


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _make_simple_recipe(n_stages: int = 3, required: bool = True) -> CreationRecipe:
    """Create a simple test recipe with N stages."""
    stages = tuple(
        SubStageDef(
            name=f"stage_{i}",
            display_name=f"Stage {i}",
            description=f"Test stage {i}",
            order=i,
            required=required,
            input_artifact_names=() if i == 0 else (f"stage_{i-1}",),
            output_artifact_type="text",
        )
        for i in range(n_stages)
    )
    return CreationRecipe(
        media_type=MediaType.IMAGE,
        name="test_recipe",
        display_name="Test Recipe",
        sub_stages=stages,
    )


async def _mock_handler(stage_def: SubStageDef, context: dict) -> SubStageArtifact:
    """Simple mock handler that returns a text artifact."""
    return SubStageArtifact(
        stage_name=stage_def.name,
        artifact_type="text",
        data=f"output_of_{stage_def.name}",
        metadata={"mock": True},
    )


async def _failing_handler(stage_def: SubStageDef, context: dict) -> SubStageArtifact:
    """Handler that always fails."""
    raise RuntimeError(f"Simulated failure in {stage_def.name}")


# ---------------------------------------------------------------------------
# Basic execution
# ---------------------------------------------------------------------------

class TestSubStageExecutorBasic:
    @pytest.mark.asyncio
    async def test_execute_all_stages(self):
        recipe = _make_simple_recipe(3)
        handlers = {f"stage_{i}": _mock_handler for i in range(3)}
        executor = SubStageExecutor(recipe=recipe, handlers=handlers)

        results = await executor.execute({"task_id": "test-1"})
        assert len(results) == 3
        assert all(r.status == "completed" for r in results)

    @pytest.mark.asyncio
    async def test_stage_ordering(self):
        recipe = _make_simple_recipe(4)
        order_log: list[str] = []

        async def tracking_handler(stage_def, ctx):
            order_log.append(stage_def.name)
            return SubStageArtifact(
                stage_name=stage_def.name,
                artifact_type="text",
                data=f"done_{stage_def.name}",
            )

        handlers = {f"stage_{i}": tracking_handler for i in range(4)}
        executor = SubStageExecutor(recipe=recipe, handlers=handlers)

        await executor.execute({})
        assert order_log == ["stage_0", "stage_1", "stage_2", "stage_3"]

    @pytest.mark.asyncio
    async def test_artifact_passing(self):
        recipe = _make_simple_recipe(2)
        received_artifacts: list[dict] = []

        async def capturing_handler(stage_def, ctx):
            received_artifacts.append(dict(ctx.get("input_artifacts", {})))
            return SubStageArtifact(
                stage_name=stage_def.name,
                artifact_type="text",
                data=f"data_{stage_def.name}",
            )

        handlers = {"stage_0": capturing_handler, "stage_1": capturing_handler}
        executor = SubStageExecutor(recipe=recipe, handlers=handlers)

        await executor.execute({})
        # stage_0 should have no input artifacts
        assert len(received_artifacts[0]) == 0
        # stage_1 should have stage_0's artifact
        assert "stage_0" in received_artifacts[1]
        assert received_artifacts[1]["stage_0"].data == "data_stage_0"

    @pytest.mark.asyncio
    async def test_duration_tracked(self):
        recipe = _make_simple_recipe(1)
        executor = SubStageExecutor(
            recipe=recipe,
            handlers={"stage_0": _mock_handler},
        )

        results = await executor.execute({})
        assert results[0].duration_ms >= 0

    @pytest.mark.asyncio
    async def test_empty_recipe(self):
        recipe = CreationRecipe(
            media_type=MediaType.IMAGE,
            name="empty",
            display_name="Empty",
            sub_stages=(),
        )
        executor = SubStageExecutor(recipe=recipe)
        results = await executor.execute({})
        assert results == []


# ---------------------------------------------------------------------------
# Failure handling
# ---------------------------------------------------------------------------

class TestSubStageExecutorFailure:
    @pytest.mark.asyncio
    async def test_required_stage_failure_stops_pipeline(self):
        recipe = _make_simple_recipe(3, required=True)
        handlers = {
            "stage_0": _mock_handler,
            "stage_1": _failing_handler,
            "stage_2": _mock_handler,
        }
        executor = SubStageExecutor(recipe=recipe, handlers=handlers)

        results = await executor.execute({})
        assert len(results) == 3
        assert results[0].status == "completed"
        assert results[1].status == "failed"
        assert "Simulated failure" in results[1].error
        assert results[2].status == "skipped"

    @pytest.mark.asyncio
    async def test_optional_stage_failure_continues(self):
        recipe = CreationRecipe(
            media_type=MediaType.IMAGE,
            name="opt",
            display_name="Opt",
            sub_stages=(
                SubStageDef(name="a", display_name="A", description="d", order=0, required=True),
                SubStageDef(name="b", display_name="B", description="d", order=1, required=False),
                SubStageDef(name="c", display_name="C", description="d", order=2, required=True),
            ),
        )
        handlers = {
            "a": _mock_handler,
            "b": _failing_handler,
            "c": _mock_handler,
        }
        executor = SubStageExecutor(recipe=recipe, handlers=handlers)

        results = await executor.execute({})
        assert len(results) == 3
        assert results[0].status == "completed"
        assert results[1].status == "failed"  # optional, continues
        assert results[2].status == "completed"

    @pytest.mark.asyncio
    async def test_missing_handler_required(self):
        recipe = _make_simple_recipe(2)
        # Only register handler for stage_0, not stage_1
        executor = SubStageExecutor(
            recipe=recipe,
            handlers={"stage_0": _mock_handler},
        )

        results = await executor.execute({})
        assert results[1].status == "failed"
        assert "No handler registered" in results[1].error

    @pytest.mark.asyncio
    async def test_missing_handler_optional(self):
        recipe = CreationRecipe(
            media_type=MediaType.IMAGE,
            name="opt2",
            display_name="Opt2",
            sub_stages=(
                SubStageDef(name="x", display_name="X", description="d", order=0, required=False),
                SubStageDef(name="y", display_name="Y", description="d", order=1, required=True),
            ),
        )
        executor = SubStageExecutor(
            recipe=recipe,
            handlers={"y": _mock_handler},
        )

        results = await executor.execute({})
        assert results[0].status == "skipped"
        assert results[1].status == "completed"


# ---------------------------------------------------------------------------
# Callbacks
# ---------------------------------------------------------------------------

class TestSubStageExecutorCallbacks:
    @pytest.mark.asyncio
    async def test_on_stage_start_called(self):
        recipe = _make_simple_recipe(2)
        started: list[str] = []

        def on_start(stage_def):
            started.append(stage_def.name)

        executor = SubStageExecutor(
            recipe=recipe,
            handlers={f"stage_{i}": _mock_handler for i in range(2)},
        )
        await executor.execute({}, on_stage_start=on_start)
        assert started == ["stage_0", "stage_1"]

    @pytest.mark.asyncio
    async def test_on_stage_complete_called(self):
        recipe = _make_simple_recipe(2)
        completed: list[str] = []

        def on_complete(result):
            completed.append(f"{result.stage_name}:{result.status}")

        executor = SubStageExecutor(
            recipe=recipe,
            handlers={f"stage_{i}": _mock_handler for i in range(2)},
        )
        await executor.execute({}, on_stage_complete=on_complete)
        assert completed == ["stage_0:completed", "stage_1:completed"]

    @pytest.mark.asyncio
    async def test_callback_error_does_not_break_execution(self):
        recipe = _make_simple_recipe(2)

        def bad_callback(stage_def):
            raise ValueError("callback error")

        executor = SubStageExecutor(
            recipe=recipe,
            handlers={f"stage_{i}": _mock_handler for i in range(2)},
        )
        # Should not raise despite callback error
        results = await executor.execute({}, on_stage_start=bad_callback)
        assert len(results) == 2
        assert all(r.status == "completed" for r in results)


# ---------------------------------------------------------------------------
# Register handler
# ---------------------------------------------------------------------------

class TestSubStageExecutorRegister:
    @pytest.mark.asyncio
    async def test_register_handler_after_init(self):
        recipe = _make_simple_recipe(1)
        executor = SubStageExecutor(recipe=recipe)

        # No handler initially — required stage would fail
        results = await executor.execute({})
        assert results[0].status == "failed"

        # Register handler
        executor.register_handler("stage_0", _mock_handler)
        results = await executor.execute({})
        assert results[0].status == "completed"


# ---------------------------------------------------------------------------
# IMAGE handlers integration
# ---------------------------------------------------------------------------

class TestImageHandlersIntegration:
    @pytest.mark.asyncio
    async def test_image_standard_recipe_with_handlers(self):
        """Run the full IMAGE_STANDARD_RECIPE with stub handlers."""
        handlers = get_image_handlers()
        executor = SubStageExecutor(
            recipe=IMAGE_STANDARD_RECIPE,
            handlers=handlers,
        )

        results = await executor.execute({
            "task_id": "test-img-001",
            "subject": "Mountain landscape",
            "cultural_tradition": "chinese_xieyi",
        })

        assert len(results) == 6
        assert all(r.status == "completed" for r in results), [
            f"{r.stage_name}:{r.status}:{r.error}" for r in results
        ]

        # Verify all results have artifacts
        for r in results:
            assert r.artifact is not None
            assert r.artifact.stage_name == r.stage_name

    @pytest.mark.asyncio
    async def test_image_handler_receives_context(self):
        """Verify image handlers receive the expected context keys."""
        handlers = get_image_handlers()
        executor = SubStageExecutor(
            recipe=IMAGE_STANDARD_RECIPE,
            handlers=handlers,
        )

        results = await executor.execute({
            "task_id": "ctx-test",
            "subject": "Test subject",
            "cultural_tradition": "default",
            "evidence": {"terminology_hits": []},
        })

        # mood_palette should reference the tradition
        palette_result = results[0]
        assert palette_result.artifact.metadata.get("tradition") == "default"
