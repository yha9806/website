"""Color harmony skill executor."""

from app.prototype.skills.executors.base import BaseSkillExecutor
from app.prototype.skills.types import SkillResult

COLOR_HARMONY_PROMPT = (
    "Analyze this image for color harmony and palette effectiveness. "
    "Evaluate each dimension on a 0-1 scale:\n"
    "- palette_coherence: How well the colors work together as a unified "
    "palette (complementary, analogous, triadic, etc.)\n"
    "- contrast_balance: Effective use of light/dark contrast for "
    "readability, depth, and visual interest\n"
    "- emotional_resonance: How strongly the color choices evoke an "
    "intended mood or emotional response\n"
    "- cultural_appropriateness: Whether color usage respects cultural "
    "associations and avoids unintended symbolism\n\n"
    "Respond ONLY with JSON (no markdown):\n"
    '{"palette_coherence": <0-1>, "contrast_balance": <0-1>, '
    '"emotional_resonance": <0-1>, "cultural_appropriateness": <0-1>, '
    '"dominant_colors": ["<color1>", "<color2>", "<color3>"], '
    '"harmony_type": "<complementary|analogous|triadic|split-complementary|monochromatic|other>", '
    '"summary": "<brief assessment>", "suggestions": ["<suggestion>", ...]}'
)

# Weights for computing the composite score
_WEIGHTS = {
    "palette_coherence": 0.30,
    "contrast_balance": 0.25,
    "emotional_resonance": 0.25,
    "cultural_appropriateness": 0.20,
}


class ColorHarmonyExecutor(BaseSkillExecutor):
    """Evaluates color harmony and palette quality of visual content."""

    SKILL_NAME = "color_harmony"

    def __init__(self) -> None:
        super().__init__(skill_name="color_harmony")

    async def execute(
        self, image_path: str, context: dict | None = None
    ) -> SkillResult:
        raw = await self._call_gemini(image_path, COLOR_HARMONY_PROMPT)
        data = self._parse_json(raw)

        # Extract sub-scores with fallback
        palette = float(data.get("palette_coherence", 0.5))
        contrast = float(data.get("contrast_balance", 0.5))
        emotional = float(data.get("emotional_resonance", 0.5))
        cultural = float(data.get("cultural_appropriateness", 0.5))

        # Weighted composite score
        score = (
            _WEIGHTS["palette_coherence"] * palette
            + _WEIGHTS["contrast_balance"] * contrast
            + _WEIGHTS["emotional_resonance"] * emotional
            + _WEIGHTS["cultural_appropriateness"] * cultural
        )

        summary = data.get("summary", "Color harmony analysis complete.")
        suggestions = data.get("suggestions", [])
        if isinstance(suggestions, str):
            suggestions = [suggestions]

        return SkillResult(
            skill_name=self.skill_name,
            score=round(score, 3),
            summary=summary,
            details={
                "palette_coherence": palette,
                "contrast_balance": contrast,
                "emotional_resonance": emotional,
                "cultural_appropriateness": cultural,
                "dominant_colors": data.get("dominant_colors", []),
                "harmony_type": data.get("harmony_type", "unknown"),
                "weights": _WEIGHTS,
            },
            suggestions=suggestions,
        )
