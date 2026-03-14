"""Style transfer skill executor."""

from app.prototype.skills.executors.base import BaseSkillExecutor
from app.prototype.skills.types import SkillResult

STYLE_TRANSFER_PROMPT = (
    "Analyze this image for style transfer quality. Evaluate how effectively "
    "a target artistic style has been applied while preserving content integrity. "
    "Score each dimension on a 0-1 scale:\n"
    "- style_fidelity: How faithfully the target style is captured (brushwork, "
    "texture, palette choices characteristic of the style)\n"
    "- content_preservation: How well the original subject/content remains "
    "recognizable and intact\n"
    "- technique_quality: Technical execution quality (no artifacts, smooth "
    "transitions, consistent application)\n"
    "- coherence: Overall harmony between style and content — does the result "
    "look like a unified artwork rather than a filter overlay?\n\n"
    "Respond ONLY with JSON (no markdown):\n"
    '{"style_fidelity": <0-1>, "content_preservation": <0-1>, '
    '"technique_quality": <0-1>, "coherence": <0-1>, '
    '"detected_style": "<detected artistic style>", '
    '"summary": "<brief assessment>", "suggestions": ["<suggestion>", ...]}'
)

# Weights for computing the composite score
_WEIGHTS = {
    "style_fidelity": 0.30,
    "content_preservation": 0.25,
    "technique_quality": 0.25,
    "coherence": 0.20,
}


class StyleTransferExecutor(BaseSkillExecutor):
    """Evaluates style transfer quality of visual content."""

    SKILL_NAME = "style_transfer"

    def __init__(self) -> None:
        super().__init__(skill_name="style_transfer")

    async def execute(
        self, image_path: str, context: dict | None = None
    ) -> SkillResult:
        raw = await self._call_gemini(image_path, STYLE_TRANSFER_PROMPT)
        data = self._parse_json(raw)

        # Extract sub-scores with fallback
        fidelity = float(data.get("style_fidelity", 0.5))
        preservation = float(data.get("content_preservation", 0.5))
        technique = float(data.get("technique_quality", 0.5))
        coherence = float(data.get("coherence", 0.5))

        # Weighted composite score
        score = (
            _WEIGHTS["style_fidelity"] * fidelity
            + _WEIGHTS["content_preservation"] * preservation
            + _WEIGHTS["technique_quality"] * technique
            + _WEIGHTS["coherence"] * coherence
        )

        summary = data.get("summary", "Style transfer analysis complete.")
        suggestions = data.get("suggestions", [])
        if isinstance(suggestions, str):
            suggestions = [suggestions]

        return SkillResult(
            skill_name=self.skill_name,
            score=round(score, 3),
            summary=summary,
            details={
                "style_fidelity": fidelity,
                "content_preservation": preservation,
                "technique_quality": technique,
                "coherence": coherence,
                "detected_style": data.get("detected_style", "unknown"),
                "weights": _WEIGHTS,
            },
            suggestions=suggestions,
        )
