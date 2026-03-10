"""IMAGE sub-stage handlers — stub implementations that delegate to existing providers.

Each handler follows the StageHandler protocol:
    async (stage_def: SubStageDef, context: dict) -> SubStageArtifact

These are currently stubs returning placeholder artifacts.  Real implementations
will wire into the existing Draft provider infrastructure (NB2, diffusers, etc.)
in a future iteration.
"""

from __future__ import annotations

import json
import logging
from typing import Any

from app.prototype.media.types import SubStageArtifact, SubStageDef

logger = logging.getLogger(__name__)


async def handle_mood_palette(stage_def: SubStageDef, context: dict[str, Any]) -> SubStageArtifact:
    """Generate a mood palette (color palette + mood board) as JSON.

    Stub: returns a placeholder palette based on the cultural tradition.
    """
    tradition = context.get("cultural_tradition", "default")
    subject = context.get("subject", "")

    palette_data = {
        "tradition": tradition,
        "subject": subject,
        "colors": ["#2C3E50", "#E74C3C", "#ECF0F1", "#3498DB", "#F39C12"],
        "mood": "contemplative",
        "warmth": 0.6,
    }

    return SubStageArtifact(
        stage_name=stage_def.name,
        artifact_type="json",
        data=json.dumps(palette_data),
        metadata={"source": "stub", "tradition": tradition},
    )


async def handle_composition_sketch(stage_def: SubStageDef, context: dict[str, Any]) -> SubStageArtifact:
    """Generate a rough composition sketch.

    Stub: returns a placeholder path.  Real implementation will call
    the existing DraftAgent provider with reduced resolution/steps.
    """
    task_id = context.get("task_id", "unknown")

    return SubStageArtifact(
        stage_name=stage_def.name,
        artifact_type="image",
        data=f"stub://composition_sketch/{task_id}.png",
        metadata={"source": "stub", "resolution": "256x256"},
    )


async def handle_element_studies(stage_def: SubStageDef, context: dict[str, Any]) -> SubStageArtifact:
    """Generate detail studies for key elements.

    Stub: returns a placeholder.  Depends on composition_sketch artifact.
    """
    input_artifacts = context.get("input_artifacts", {})
    comp_artifact = input_artifacts.get("composition_sketch")
    task_id = context.get("task_id", "unknown")

    return SubStageArtifact(
        stage_name=stage_def.name,
        artifact_type="image",
        data=f"stub://element_studies/{task_id}.png",
        metadata={
            "source": "stub",
            "based_on": comp_artifact.stage_name if comp_artifact else None,
        },
    )


async def handle_style_reference(stage_def: SubStageDef, context: dict[str, Any]) -> SubStageArtifact:
    """Apply cultural style reference.

    Stub: returns a placeholder.  Depends on mood_palette artifact.
    """
    input_artifacts = context.get("input_artifacts", {})
    palette_artifact = input_artifacts.get("mood_palette")
    tradition = context.get("cultural_tradition", "default")
    task_id = context.get("task_id", "unknown")

    return SubStageArtifact(
        stage_name=stage_def.name,
        artifact_type="image",
        data=f"stub://style_reference/{task_id}.png",
        metadata={
            "source": "stub",
            "tradition": tradition,
            "palette_used": palette_artifact is not None,
        },
    )


async def handle_storyboard(stage_def: SubStageDef, context: dict[str, Any]) -> SubStageArtifact:
    """Compose final layout with all elements.

    Stub: returns a placeholder.  Depends on composition_sketch, element_studies, style_reference.
    """
    input_artifacts = context.get("input_artifacts", {})
    task_id = context.get("task_id", "unknown")

    return SubStageArtifact(
        stage_name=stage_def.name,
        artifact_type="image",
        data=f"stub://storyboard/{task_id}.png",
        metadata={
            "source": "stub",
            "inputs_available": list(input_artifacts.keys()),
        },
    )


async def handle_final_render(stage_def: SubStageDef, context: dict[str, Any]) -> SubStageArtifact:
    """High-quality final render.

    Stub: returns a placeholder.  Real implementation will call
    the DraftAgent provider at full resolution.
    """
    task_id = context.get("task_id", "unknown")

    return SubStageArtifact(
        stage_name=stage_def.name,
        artifact_type="image",
        data=f"stub://final_render/{task_id}.png",
        metadata={"source": "stub", "resolution": "512x512"},
    )


# ---------------------------------------------------------------------------
# Handler registry for IMAGE sub-stages
# ---------------------------------------------------------------------------

IMAGE_HANDLERS: dict[str, Any] = {
    "mood_palette": handle_mood_palette,
    "composition_sketch": handle_composition_sketch,
    "element_studies": handle_element_studies,
    "style_reference": handle_style_reference,
    "storyboard": handle_storyboard,
    "final_render": handle_final_render,
}


def get_image_handlers() -> dict[str, Any]:
    """Return a copy of the IMAGE sub-stage handler registry."""
    return dict(IMAGE_HANDLERS)
