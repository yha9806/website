"""Rule-based router + fallback chain.

Re-exports from cultural_pipelines for backward compatibility.
"""

from app.prototype.cultural_pipelines.pipeline_router import (
    CulturalPipelineRouter,
    PipelineRoute,
    PipelineVariant,
)

__all__ = [
    "CulturalPipelineRouter",
    "PipelineRoute",
    "PipelineVariant",
]
