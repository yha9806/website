"""Pipeline-level checkpoint — persist and restore per-stage state."""

from __future__ import annotations

import json
import re
from pathlib import Path

_CHECKPOINT_ROOT = Path(__file__).resolve().parent / "pipeline"
_SAFE_TASK_ID_RE = re.compile(r"[^A-Za-z0-9._-]+")


def save_pipeline_stage(task_id: str, stage: str, data: dict) -> str:
    """Save checkpoint for a specific pipeline stage.

    Layout::

        checkpoints/pipeline/{task_id}/stage_{stage}.json

    Returns the path to the saved file.
    """
    task_dir = _CHECKPOINT_ROOT / _safe(task_id)
    task_dir.mkdir(parents=True, exist_ok=True)
    path = task_dir / f"stage_{stage}.json"
    path.write_text(json.dumps(data, indent=2, ensure_ascii=False), encoding="utf-8")
    return str(path)


def load_pipeline_stage(task_id: str, stage: str) -> dict | None:
    """Load checkpoint for a specific pipeline stage, or None if missing."""
    path = _CHECKPOINT_ROOT / _safe(task_id) / f"stage_{stage}.json"
    if not path.exists():
        return None
    return json.loads(path.read_text(encoding="utf-8"))


def save_pipeline_output(task_id: str, data: dict) -> str:
    """Save the final pipeline output."""
    task_dir = _CHECKPOINT_ROOT / _safe(task_id)
    task_dir.mkdir(parents=True, exist_ok=True)
    path = task_dir / "pipeline_output.json"
    path.write_text(json.dumps(data, indent=2, ensure_ascii=False), encoding="utf-8")
    return str(path)


def load_pipeline_output(task_id: str) -> dict | None:
    """Load the final pipeline output, or None."""
    path = _CHECKPOINT_ROOT / _safe(task_id) / "pipeline_output.json"
    if not path.exists():
        return None
    return json.loads(path.read_text(encoding="utf-8"))


def update_runs_index(task_id: str, entry: dict) -> None:
    """Update the runs index with a new or updated entry.

    Maintains ``checkpoints/runs_index.json`` as a lightweight metadata
    store mapping task_id to status, decision, cost, latency, etc.
    """
    index_path = _CHECKPOINT_ROOT / "runs_index.json"
    index: dict = {}
    if index_path.exists():
        try:
            index = json.loads(index_path.read_text(encoding="utf-8"))
        except (json.JSONDecodeError, OSError):
            index = {}
    index[task_id] = entry
    index_path.write_text(
        json.dumps(index, indent=2, ensure_ascii=False), encoding="utf-8"
    )


def load_runs_index() -> dict:
    """Load the full runs index."""
    index_path = _CHECKPOINT_ROOT / "runs_index.json"
    if not index_path.exists():
        return {}
    try:
        return json.loads(index_path.read_text(encoding="utf-8"))
    except (json.JSONDecodeError, OSError):
        return {}


def _safe(task_id: str) -> str:
    cleaned = _SAFE_TASK_ID_RE.sub("_", task_id).strip("._")
    return cleaned or "task"
