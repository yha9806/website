"""Digestion system API routes."""

from __future__ import annotations

import logging

from fastapi import APIRouter

from app.prototype.digestion.aggregator import DigestAggregator
from app.prototype.digestion.context_evolver import ContextEvolver
from app.prototype.digestion.pattern_detector import PatternDetector
from app.prototype.digestion.preference_learner import PreferenceLearner
from app.prototype.session.store import SessionStore

logger = logging.getLogger("vulca")

digestion_router = APIRouter(prefix="/api/v1/digestion", tags=["digestion"])


@digestion_router.get("/status")
async def digestion_status() -> dict:
    """Return current digestion system status and aggregate stats."""
    store = SessionStore.get()
    aggregator = DigestAggregator(store)

    stats = aggregator.aggregate()
    return {
        "total_sessions": store.count(),
        "traditions": {k: v.to_dict() for k, v in stats.items()},
    }


@digestion_router.post("/run")
async def run_digestion() -> dict:
    """Trigger a full digestion + evolution cycle."""
    evolver = ContextEvolver()
    result = evolver.evolve()

    detector = PatternDetector()
    patterns = detector.detect()

    learner = PreferenceLearner()
    preferences = learner.learn()

    return {
        "evolution": result.to_dict(),
        "patterns": [p.to_dict() for p in patterns],
        "preferences": {k: v.to_dict() for k, v in preferences.items()},
    }
