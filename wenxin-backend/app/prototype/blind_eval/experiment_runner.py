"""Experiment runner for blind evaluation.

Executes the pipeline for each (group, task) pair with deterministic seeding,
saves raw outputs to results/raw/{group}/{task_id}/.
"""

from __future__ import annotations

import hashlib
import json
import logging
import shutil
import time
from dataclasses import asdict
from pathlib import Path

from app.prototype.agents.draft_config import DraftConfig
from app.prototype.agents.critic_config import CriticConfig
from app.prototype.agents.queen_config import QueenConfig
from app.prototype.blind_eval.experiment_config import (
    BlindTask,
    ExperimentConfig,
    ExperimentGroup,
)
from app.prototype.orchestrator.orchestrator import PipelineOrchestrator
from app.prototype.pipeline.pipeline_types import PipelineInput, PipelineOutput

logger = logging.getLogger(__name__)

_RESULTS_ROOT = Path(__file__).resolve().parent / "results"
_DRAFT_CHECKPOINT_ROOT = (
    Path(__file__).resolve().parent.parent / "checkpoints" / "draft"
)


def _deterministic_seed(task_id: str, group_name: str, seed_base: int) -> int:
    """Produce a deterministic seed from (task_id, group_name, seed_base)."""
    payload = f"{task_id}:{group_name}:{seed_base}"
    h = hashlib.sha256(payload.encode()).hexdigest()
    return int(h[:8], 16) % (2**31)


def _build_orchestrator(
    group: ExperimentGroup,
    config: ExperimentConfig,
    seed: int,
) -> PipelineOrchestrator:
    """Build an orchestrator configured for the given experiment group."""
    draft_cfg = DraftConfig(
        provider=config.provider,
        n_candidates=config.n_candidates,
        seed_base=seed,
    )
    critic_cfg = CriticConfig()
    queen_cfg = QueenConfig(max_rounds=config.max_rounds)

    return PipelineOrchestrator(
        draft_config=draft_cfg,
        critic_config=critic_cfg,
        queen_config=queen_cfg,
        enable_hitl=False,
        enable_archivist=False,
        enable_agent_critic=group.enable_agent_critic,
        enable_evidence_loop=group.enable_evidence_loop,
        enable_fix_it_plan=group.enable_fix_it_plan,
    )


def _save_run_output(
    results_dir: Path,
    group_name: str,
    task_id: str,
    pipeline_task_id: str,
    output: PipelineOutput,
    trajectory_dict: dict | None,
    latency_ms: int,
    seed: int,
) -> Path:
    """Save pipeline output and trajectory to disk."""
    task_dir = results_dir / "raw" / group_name / task_id
    task_dir.mkdir(parents=True, exist_ok=True)

    # Pipeline output
    output_dict = {
        "task_id": output.task_id,
        "original_task_id": task_id,
        "success": output.success,
        "error": output.error,
        "final_decision": output.final_decision,
        "best_candidate_id": output.best_candidate_id,
        "total_latency_ms": output.total_latency_ms,
        "total_rounds": output.total_rounds,
        "stages": [asdict(s) for s in output.stages],
        "seed": seed,
        "group": group_name,
        "run_latency_ms": latency_ms,
    }
    (task_dir / "pipeline_output.json").write_text(
        json.dumps(output_dict, indent=2, ensure_ascii=False), encoding="utf-8"
    )

    # Trajectory
    if trajectory_dict:
        (task_dir / "trajectory.json").write_text(
            json.dumps(trajectory_dict, indent=2, ensure_ascii=False), encoding="utf-8"
        )

    # Copy best candidate image from checkpoints (real mode) or create placeholder
    _copy_best_candidate_image(task_dir, pipeline_task_id, output.best_candidate_id)

    return task_dir


def _copy_best_candidate_image(
    task_dir: Path, pipeline_task_id: str, best_candidate_id: str | None
) -> None:
    """Copy best candidate image from draft checkpoints to results dir."""
    dst = task_dir / "best_candidate.png"
    ckpt_dir = _DRAFT_CHECKPOINT_ROOT / pipeline_task_id

    if ckpt_dir.exists():
        # Try exact candidate file
        if best_candidate_id:
            src = ckpt_dir / f"{best_candidate_id}.png"
            if src.exists() and src.stat().st_size > 100:
                shutil.copy2(src, dst)
                logger.debug("Copied image %s → %s", src, dst)
                return
        # Fallback: pick any .png in the checkpoint dir
        for png in sorted(ckpt_dir.glob("*.png")):
            if png.stat().st_size > 100:
                shutil.copy2(png, dst)
                logger.debug("Copied fallback image %s → %s", png, dst)
                return

    # Placeholder if no real image available
    if not dst.exists():
        dst.write_bytes(b"PLACEHOLDER")


class ExperimentRunner:
    """Run blind evaluation experiments."""

    def __init__(
        self,
        config: ExperimentConfig,
        results_dir: Path | None = None,
    ) -> None:
        self.config = config
        self.results_dir = results_dir or _RESULTS_ROOT

    def run_single(
        self,
        group: ExperimentGroup,
        task: BlindTask,
    ) -> tuple[PipelineOutput, int]:
        """Run a single (group, task) pair. Returns (output, latency_ms)."""
        seed = _deterministic_seed(task.task_id, group.name, self.config.seed_base)
        orch = _build_orchestrator(group, self.config, seed)

        # Group-prefix pipeline task_id to avoid checkpoint collisions
        pipeline_task_id = f"{group.name}_{task.task_id}"

        pi = PipelineInput(
            task_id=pipeline_task_id,
            subject=task.subject,
            cultural_tradition=task.tradition,
        )

        t0 = time.monotonic()
        output = orch.run_sync(pi)
        latency_ms = int((time.monotonic() - t0) * 1000)

        # Save results (use original task_id for directory, pipeline_task_id for image lookup)
        _save_run_output(
            self.results_dir, group.name, task.task_id, pipeline_task_id,
            output, None, latency_ms, seed,
        )

        return output, latency_ms

    def run_group(
        self,
        group: ExperimentGroup,
        tasks: list[BlindTask] | None = None,
    ) -> list[tuple[str, PipelineOutput, int]]:
        """Run all tasks for a single group.

        Returns list of (task_id, output, latency_ms).
        """
        tasks = tasks or self.config.tasks
        results: list[tuple[str, PipelineOutput, int]] = []

        for i, task in enumerate(tasks):
            logger.info(
                "[%s] Running task %d/%d: %s",
                group.name, i + 1, len(tasks), task.task_id,
            )
            try:
                output, latency_ms = self.run_single(group, task)
                results.append((task.task_id, output, latency_ms))
            except Exception:
                logger.exception("Failed task %s in group %s", task.task_id, group.name)
                # Create a failure output
                fail_output = PipelineOutput(
                    task_id=task.task_id,
                    success=False,
                    error="ExperimentRunner exception",
                )
                results.append((task.task_id, fail_output, 0))

        return results

    def run_all(
        self,
        tasks: list[BlindTask] | None = None,
    ) -> dict[str, list[tuple[str, PipelineOutput, int]]]:
        """Run all groups × all tasks.

        Returns {group_name: [(task_id, output, latency_ms), ...]}.
        """
        tasks = tasks or self.config.tasks
        all_results: dict[str, list[tuple[str, PipelineOutput, int]]] = {}

        # Save experiment config
        self.results_dir.mkdir(parents=True, exist_ok=True)
        self.config.save(self.results_dir / "experiment_config.json")

        # Save tasks
        from dataclasses import asdict as _asdict
        tasks_data = [_asdict(t) for t in tasks]
        (self.results_dir / "tasks.json").write_text(
            json.dumps(tasks_data, indent=2, ensure_ascii=False), encoding="utf-8"
        )

        for group in self.config.groups:
            logger.info("=== Starting group: %s ===", group.name)
            group_results = self.run_group(group, tasks)
            all_results[group.name] = group_results

            # Summary
            successes = sum(1 for _, o, _ in group_results if o.success)
            total_ms = sum(ms for _, _, ms in group_results)
            logger.info(
                "Group %s complete: %d/%d success, total %dms",
                group.name, successes, len(group_results), total_ms,
            )

        return all_results

    def get_deterministic_seed(self, task_id: str, group_name: str) -> int:
        """Expose seed computation for testing."""
        return _deterministic_seed(task_id, group_name, self.config.seed_base)
