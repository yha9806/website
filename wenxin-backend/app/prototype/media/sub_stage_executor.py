"""SubStageExecutor — runs a CreationRecipe's sub-stages in order.

Provides callbacks for progress reporting (on_stage_start, on_stage_complete)
and collects artifacts across stages so downstream stages can access upstream outputs.
"""

from __future__ import annotations

import logging
import time
from typing import Any, Callable, Awaitable

from app.prototype.media.types import (
    CreationRecipe,
    SubStageArtifact,
    SubStageDef,
    SubStageResult,
)

logger = logging.getLogger(__name__)

# Type alias for stage handler functions
# Handler receives: (stage_def, context_with_artifacts) -> SubStageArtifact
StageHandler = Callable[[SubStageDef, dict[str, Any]], Awaitable[SubStageArtifact]]


class SubStageExecutor:
    """Runs a CreationRecipe's sub-stages in order.

    Each sub-stage is executed via a handler function looked up by stage name.
    If no handler is found for a stage, it is skipped (if optional) or fails (if required).
    Artifacts from completed stages are accumulated and passed to downstream stages.
    """

    def __init__(
        self,
        recipe: CreationRecipe,
        handlers: dict[str, StageHandler] | None = None,
    ) -> None:
        self._recipe = recipe
        self._handlers: dict[str, StageHandler] = handlers or {}

    @property
    def recipe(self) -> CreationRecipe:
        return self._recipe

    def register_handler(self, stage_name: str, handler: StageHandler) -> None:
        """Register a handler for a specific sub-stage."""
        self._handlers[stage_name] = handler

    async def execute(
        self,
        initial_context: dict[str, Any],
        on_stage_start: Callable[[SubStageDef], Any] | None = None,
        on_stage_complete: Callable[[SubStageResult], Any] | None = None,
    ) -> list[SubStageResult]:
        """Execute all sub-stages in order.

        Parameters
        ----------
        initial_context : dict
            Initial context passed to the first stage. Contains at minimum:
            - subject, cultural_tradition, evidence, task_id
        on_stage_start : callable, optional
            Called when each stage begins execution.
        on_stage_complete : callable, optional
            Called when each stage finishes (success or failure).

        Returns
        -------
        list[SubStageResult]
            Results for each sub-stage, in execution order.
        """
        results: list[SubStageResult] = []
        artifacts: dict[str, SubStageArtifact] = {}

        for stage_def in self._recipe.sub_stages:
            # Notify start
            if on_stage_start is not None:
                try:
                    on_stage_start(stage_def)
                except Exception:
                    logger.debug("on_stage_start callback error for %s", stage_def.name)

            handler = self._handlers.get(stage_def.name)
            if handler is None:
                if stage_def.required:
                    result = SubStageResult(
                        stage_name=stage_def.name,
                        status="failed",
                        error=f"No handler registered for required stage '{stage_def.name}'",
                    )
                else:
                    result = SubStageResult(
                        stage_name=stage_def.name,
                        status="skipped",
                    )
                results.append(result)
                if on_stage_complete is not None:
                    try:
                        on_stage_complete(result)
                    except Exception:
                        pass
                if result.status == "failed":
                    # Fail fast on required stage missing handler
                    _mark_remaining_skipped(self._recipe, stage_def.order, results)
                    break
                continue

            # Build context with upstream artifacts
            context = dict(initial_context)
            context["artifacts"] = artifacts
            context["input_artifacts"] = {
                name: artifacts[name]
                for name in stage_def.input_artifact_names
                if name in artifacts
            }

            t0 = time.monotonic()
            try:
                artifact = await handler(stage_def, context)
                duration_ms = int((time.monotonic() - t0) * 1000)

                result = SubStageResult(
                    stage_name=stage_def.name,
                    status="completed",
                    artifact=artifact,
                    duration_ms=duration_ms,
                )
                artifacts[stage_def.name] = artifact

            except Exception as exc:
                duration_ms = int((time.monotonic() - t0) * 1000)
                logger.warning(
                    "Sub-stage '%s' failed after %dms: %s",
                    stage_def.name,
                    duration_ms,
                    exc,
                )
                result = SubStageResult(
                    stage_name=stage_def.name,
                    status="failed",
                    duration_ms=duration_ms,
                    error=str(exc),
                )

            results.append(result)
            if on_stage_complete is not None:
                try:
                    on_stage_complete(result)
                except Exception:
                    pass

            # If a required stage failed, skip the rest
            if result.status == "failed" and stage_def.required:
                _mark_remaining_skipped(self._recipe, stage_def.order, results)
                break

        return results


def _mark_remaining_skipped(
    recipe: CreationRecipe,
    failed_order: int,
    results: list[SubStageResult],
) -> None:
    """Mark all stages after the failed one as skipped."""
    completed_names = {r.stage_name for r in results}
    for stage in recipe.sub_stages:
        if stage.order > failed_order and stage.name not in completed_names:
            results.append(SubStageResult(
                stage_name=stage.name,
                status="skipped",
            ))
