"""Draft checkpoint persistence — save / load run metadata + images."""

from __future__ import annotations

import json
import re
from pathlib import Path

from app.prototype.agents.draft_types import DraftOutput

_CHECKPOINT_ROOT = Path(__file__).resolve().parent / "draft"
_SAFE_TASK_ID_RE = re.compile(r"[^A-Za-z0-9._-]+")


def save_draft_checkpoint(output: DraftOutput) -> str:
    """Persist a DraftOutput as ``run.json`` alongside its images.

    Directory layout::

        checkpoints/draft/{task_id}/
            run.json
            draft-{task_id}-0.{png|jpg|webp}
            draft-{task_id}-1.{png|jpg|webp}
            ...

    Returns the path to ``run.json``.
    """
    task_dir = _CHECKPOINT_ROOT / _safe_task_dirname(output.task_id)
    task_dir.mkdir(parents=True, exist_ok=True)

    run_path = task_dir / "run.json"
    run_data = {
        "task_id": output.task_id,
        "created_at": output.created_at,
        "config": _extract_config(output),
        "candidates": [c.to_dict() for c in output.candidates],
        "latency_ms": output.latency_ms,
        "success": output.success,
        "error": output.error,
    }
    run_path.write_text(json.dumps(run_data, indent=2, ensure_ascii=False), encoding="utf-8")
    return str(run_path)


def load_draft_checkpoint(task_id: str) -> dict | None:
    """Load an existing checkpoint for *task_id*, or return ``None``."""
    run_path = _CHECKPOINT_ROOT / _safe_task_dirname(task_id) / "run.json"
    if not run_path.exists():
        return None
    return json.loads(run_path.read_text(encoding="utf-8"))


def _extract_config(output: DraftOutput) -> dict:
    """Best-effort config extraction from the first candidate."""
    if not output.candidates:
        return {}
    c = output.candidates[0]
    return {
        "width": c.width,
        "height": c.height,
        "steps": c.steps,
        "sampler": c.sampler,
        "model_ref": c.model_ref,
    }


def _safe_task_dirname(task_id: str) -> str:
    cleaned = _SAFE_TASK_ID_RE.sub("_", task_id).strip("._")
    return cleaned or "task"
