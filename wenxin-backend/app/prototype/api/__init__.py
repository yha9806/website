"""Prototype REST API — pipeline runs, SSE events, HITL actions."""


def get_prototype_router():
    """Lazy import to avoid FastAPI import at module level."""
    from app.prototype.api.routes import router
    return router


# For backward compat when FastAPI is available
try:
    from app.prototype.api.routes import router as prototype_router
except ImportError:
    prototype_router = None  # type: ignore[assignment]

__all__ = ["prototype_router", "get_prototype_router"]
