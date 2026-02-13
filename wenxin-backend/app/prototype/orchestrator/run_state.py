"""RunState — tracks the status of a single pipeline run."""

from __future__ import annotations

from dataclasses import dataclass, field
from enum import Enum
from threading import Event


class RunStatus(Enum):
    """Pipeline run lifecycle."""

    PENDING = "pending"
    RUNNING = "running"
    WAITING_HUMAN = "waiting_human"
    COMPLETED = "completed"
    FAILED = "failed"


@dataclass
class HumanAction:
    """A single human-in-the-loop action."""

    action: str           # "approve" | "reject" | "rerun" | "lock_dimensions" | "force_accept"
    locked_dimensions: list[str] = field(default_factory=list)
    rerun_dimensions: list[str] = field(default_factory=list)
    candidate_id: str = ""
    reason: str = ""


@dataclass
class RunState:
    """Mutable state for a single pipeline run."""

    task_id: str
    status: RunStatus = RunStatus.PENDING
    current_stage: str = ""
    current_round: int = 0

    # HITL synchronization
    _human_event: Event = field(default_factory=Event, repr=False)
    _human_action: HumanAction | None = field(default=None, repr=False)

    def wait_for_human(self, timeout: float | None = None) -> HumanAction | None:
        """Block until a human action is submitted (or timeout)."""
        self.status = RunStatus.WAITING_HUMAN
        # Handle pre-submitted actions first. This avoids losing a human action
        # that arrives immediately after HUMAN_REQUIRED is emitted.
        if self._human_action is not None:
            action = self._human_action
            self._human_action = None
            self._human_event.clear()
            self.status = RunStatus.RUNNING
            return action

        got = self._human_event.wait(timeout=timeout)
        if got and self._human_action is not None:
            action = self._human_action
            self._human_action = None
            self._human_event.clear()
            self.status = RunStatus.RUNNING
            return action

        self._human_event.clear()
        self.status = RunStatus.RUNNING
        return None

    def submit_human_action(self, action: HumanAction) -> None:
        """Submit a human action to unblock the pipeline."""
        self._human_action = action
        self._human_event.set()
