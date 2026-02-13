"""Critic checkpoint persistence — save / load critique run metadata."""

from __future__ import annotations

import json
import re
from pathlib import Path

from app.prototype.agents.critic_types import CritiqueOutput

_CHECKPOINT_ROOT = Path(__file__).resolve().parent / "critique"
_SAFE_TASK_ID_RE = re.compile(r"[^A-Za-z0-9._-]+")


def save_critic_checkpoint(output: CritiqueOutput) -> str:
    """Persist a CritiqueOutput as ``run.json``.

    Directory layout::

        checkpoints/critique/{task_id}/
            run.json

    Returns the path to ``run.json``.
    """
    task_dir = _CHECKPOINT_ROOT / _safe_task_dirname(output.task_id)
    task_dir.mkdir(parents=True, exist_ok=True)

    run_path = task_dir / "run.json"
    run_path.write_text(
        json.dumps(output.to_dict(), indent=2, ensure_ascii=False),
        encoding="utf-8",
    )
    return str(run_path)


def load_critic_checkpoint(task_id: str) -> dict | None:
    """Load an existing critique checkpoint for *task_id*, or return ``None``."""
    run_path = _CHECKPOINT_ROOT / _safe_task_dirname(task_id) / "run.json"
    if not run_path.exists():
        return None
    return json.loads(run_path.read_text(encoding="utf-8"))


def _safe_task_dirname(task_id: str) -> str:
    """Convert task_id into a filesystem-safe directory name."""
    cleaned = _SAFE_TASK_ID_RE.sub("_", task_id).strip("._")
    return cleaned or "task"
