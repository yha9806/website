"""REST endpoints for the self-evolution system.

Provides agent status, evolution history, and manual trigger.
"""

from __future__ import annotations

import json
import logging
from datetime import datetime, timezone
from pathlib import Path

from fastapi import APIRouter, Depends

from app.prototype.api.auth import verify_api_key

logger = logging.getLogger(__name__)

evolution_router = APIRouter(prefix="/api/v1/evolution", tags=["evolution"])

_DATA_DIR = Path(__file__).parent.parent / "data"
_EVOLVED_CONTEXT = _DATA_DIR / "evolved_context.json"
_QUALITY_BASELINE = _DATA_DIR / "quality_baseline.json"
_AGENT_LOGS_DIR = _DATA_DIR / "agent_logs"
_REPORTS_DIR = _DATA_DIR / "reports"


def _read_json(path: Path) -> dict | None:
    if not path.exists():
        return None
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except (json.JSONDecodeError, OSError):
        return None


def _read_last_log_entry(agent_name: str) -> dict | None:
    log_path = _AGENT_LOGS_DIR / f"{agent_name}.jsonl"
    if not log_path.exists():
        return None
    last_line = None
    try:
        with open(log_path, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if line:
                    last_line = line
        return json.loads(last_line) if last_line else None
    except (json.JSONDecodeError, OSError):
        return None


def _agent_status(name: str, description: str) -> dict:
    """Build status dict for a single agent."""
    last_entry = _read_last_log_entry(name)
    last_run = last_entry["timestamp"] if last_entry else None
    last_action = last_entry["action"] if last_entry else None
    details = last_entry.get("details", {}) if last_entry else {}

    return {
        "name": name,
        "description": description,
        "status": "healthy" if last_entry else "idle",
        "lastRun": last_run,
        "lastAction": last_action,
        "details": details,
    }


@evolution_router.get("/status")
async def get_evolution_status() -> dict:
    """Public endpoint - return current evolution system status."""
    # Agent statuses
    agents = [
        _agent_status("evolution", "Drives weight adjustments and principle extraction"),
        _agent_status("quality", "Monitors evaluation quality and detects drift"),
        _agent_status("admin", "Orchestrates sub-agents and generates weekly reports"),
    ]

    # Evolved context
    evolved = _read_json(_EVOLVED_CONTEXT)
    principles_count = len(evolved.get("principles", [])) if evolved else 0
    last_evolved = evolved.get("last_evolved") if evolved else None
    feedback_count = evolved.get("feedback_count", 0) if evolved else 0

    # Quality baseline
    baseline = _read_json(_QUALITY_BASELINE)
    avg_score = baseline.get("avg_score") if baseline else None

    # Enrich evolution agent with principles count
    for a in agents:
        if a["name"] == "evolution":
            a["principlesDistilled"] = principles_count
        elif a["name"] == "quality":
            a["avgScore"] = avg_score

    # Latest report
    latest_report = None
    if _REPORTS_DIR.exists():
        reports = sorted(_REPORTS_DIR.glob("weekly_*.md"), reverse=True)
        if reports:
            latest_report = reports[0].name
            for a in agents:
                if a["name"] == "admin":
                    a["lastReport"] = latest_report

    # Timeline from agent logs
    timeline = _build_timeline()

    return {
        "agents": agents,
        "evolved_context": {
            "principles_count": principles_count,
            "last_evolved": last_evolved,
            "feedback_count": feedback_count,
        },
        "quality": {
            "avg_score": avg_score,
        },
        "latest_report": latest_report,
        "timeline": timeline,
    }


def _build_timeline(limit: int = 10) -> list[dict]:
    """Build a recent timeline from admin agent logs."""
    log_path = _AGENT_LOGS_DIR / "admin.jsonl"
    entries: list[dict] = []

    if not log_path.exists():
        # Fallback: try evolution agent logs
        log_path = _AGENT_LOGS_DIR / "evolution.jsonl"
        if not log_path.exists():
            return []

    try:
        with open(log_path, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if not line:
                    continue
                try:
                    entry = json.loads(line)
                    action = entry.get("action", "")
                    if action in ("cycle_complete", "drift_detected", "anomalies_flagged", "context_written"):
                        details = entry.get("details", {})
                        status = "warning" if "drift" in action or "anomal" in action else "healthy"
                        event = _format_event(action, details)
                        entries.append({
                            "date": entry.get("timestamp", "")[:10],
                            "event": event,
                            "status": status,
                        })
                except json.JSONDecodeError:
                    continue
    except OSError:
        return []

    # Return most recent entries
    return entries[-limit:][::-1]


def _format_event(action: str, details: dict) -> str:
    """Format a log action into a human-readable event string."""
    if action == "cycle_complete":
        principles = details.get("principles", 0)
        adjustments = details.get("adjustments", {})
        adj_count = len(adjustments) if isinstance(adjustments, dict) else 0
        return f"Evolved {principles} principles, adjusted {adj_count} tradition weights"
    if action == "drift_detected":
        delta = details.get("delta", 0)
        return f"Quality drift detected (delta: {delta:.3f})"
    if action == "anomalies_flagged":
        count = details.get("count", 0)
        return f"{count} anomalies flagged in evaluations"
    if action == "context_written":
        return "Evolved context written to disk"
    return action.replace("_", " ").title()


@evolution_router.post("/run")
async def trigger_evolution_cycle(_key: str = Depends(verify_api_key)) -> dict:
    """Trigger one evolution cycle manually (auth required)."""
    from app.prototype.evolution.admin_agent import AdminAgent

    agent = AdminAgent()
    result = await agent.run_cycle()
    return {
        "status": "completed",
        "result": result,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }
