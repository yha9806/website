"""Base agent stub for community agents.

If WU-12 delivers the canonical BaseAgent, replace this stub with an import
from the shared location.
"""

from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from pathlib import Path
import json
import logging
from datetime import datetime

logger = logging.getLogger(__name__)


@dataclass
class BaseAgent(ABC):
    """Minimal base agent providing logging and lifecycle hooks."""

    name: str
    client: "VulcaAPIClient" = field(default=None)  # type: ignore[assignment]
    log_path: Path = field(default=None)  # type: ignore[assignment]

    def __post_init__(self) -> None:
        if self.log_path is None:
            self.log_path = (
                Path(__file__).parent.parent / "data" / "agent_logs" / f"{self.name}.jsonl"
            )
        self.log_path.parent.mkdir(parents=True, exist_ok=True)

    @abstractmethod
    async def run_cycle(self) -> dict:
        """Execute one agent cycle and return a summary dict."""
        ...

    def should_run(self) -> bool:
        """Gate check before ``run_cycle``.  Override for scheduling logic."""
        return True

    def log_action(self, action: str, details: dict | None = None) -> None:
        record = {
            "agent": self.name,
            "action": action,
            "timestamp": datetime.utcnow().isoformat(),
            "details": details or {},
        }
        with open(self.log_path, "a") as f:
            f.write(json.dumps(record) + "\n")
