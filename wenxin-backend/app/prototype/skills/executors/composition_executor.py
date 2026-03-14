"""Composition balance skill executor."""

from app.prototype.skills.executors.base import BaseSkillExecutor
from app.prototype.skills.types import SkillResult

COMPOSITION_PROMPT = (
    "Analyze this image for compositional quality. Evaluate each dimension "
    "on a 0-1 scale:\n"
    "- spatial_balance: Overall balance of visual weight — symmetry, rule of "
    "thirds, golden ratio, or intentional asymmetry\n"
    "- visual_flow: How effectively the eye is guided through the image via "
    "leading lines, contrast, and placement\n"
    "- focal_clarity: Presence and strength of a clear focal point that draws "
    "immediate attention\n"
    "- depth_layering: Effective use of foreground, midground, and background "
    "to create spatial depth\n\n"
    "Respond ONLY with JSON (no markdown):\n"
    '{"spatial_balance": <0-1>, "visual_flow": <0-1>, '
    '"focal_clarity": <0-1>, "depth_layering": <0-1>, '
    '"composition_type": "<rule-of-thirds|centered|diagonal|golden-ratio|radial|other>", '
    '"summary": "<brief assessment>", "suggestions": ["<suggestion>", ...]}'
)

# Weights for computing the composite score
_WEIGHTS = {
    "spatial_balance": 0.30,
    "visual_flow": 0.25,
    "focal_clarity": 0.25,
    "depth_layering": 0.20,
}


class CompositionExecutor(BaseSkillExecutor):
    """Evaluates compositional balance and structure of visual content."""

    SKILL_NAME = "composition_balance"

    def __init__(self) -> None:
        super().__init__(skill_name="composition_balance")

    async def execute(
        self, image_path: str, context: dict | None = None
    ) -> SkillResult:
        raw = await self._call_gemini(image_path, COMPOSITION_PROMPT)
        data = self._parse_json(raw)

        # Extract sub-scores with fallback
        spatial = float(data.get("spatial_balance", 0.5))
        flow = float(data.get("visual_flow", 0.5))
        focal = float(data.get("focal_clarity", 0.5))
        depth = float(data.get("depth_layering", 0.5))

        # Weighted composite score
        score = (
            _WEIGHTS["spatial_balance"] * spatial
            + _WEIGHTS["visual_flow"] * flow
            + _WEIGHTS["focal_clarity"] * focal
            + _WEIGHTS["depth_layering"] * depth
        )

        summary = data.get("summary", "Composition analysis complete.")
        suggestions = data.get("suggestions", [])
        if isinstance(suggestions, str):
            suggestions = [suggestions]

        return SkillResult(
            skill_name=self.skill_name,
            score=round(score, 3),
            summary=summary,
            details={
                "spatial_balance": spatial,
                "visual_flow": flow,
                "focal_clarity": focal,
                "depth_layering": depth,
                "composition_type": data.get("composition_type", "unknown"),
                "weights": _WEIGHTS,
            },
            suggestions=suggestions,
        )
