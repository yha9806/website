"""Model Router — selects the optimal LLM for each layer and task.

Routes requests through LiteLLM for unified API access. Supports:
- Per-layer model assignment (L1/L2 VLM, L3-L5 text LLM)
- Budget-aware fallback chains
- Confidence-based escalation
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any


# ---------------------------------------------------------------------------
# Model definitions
# ---------------------------------------------------------------------------

@dataclass
class ModelSpec:
    """Specification for an LLM model."""

    litellm_id: str            # e.g. "deepseek/deepseek-chat"
    display_name: str          # e.g. "DeepSeek V3.2"
    cost_per_call_usd: float   # estimated cost per single Critic call
    supports_fc: bool = True   # function calling
    supports_vlm: bool = False # vision/multimodal
    max_tokens: int = 2048
    temperature: float = 0.3

    def to_dict(self) -> dict:
        return {
            "litellm_id": self.litellm_id,
            "display_name": self.display_name,
            "cost_per_call_usd": self.cost_per_call_usd,
            "supports_fc": self.supports_fc,
            "supports_vlm": self.supports_vlm,
        }


# Pre-defined model catalog
MODELS = {
    "deepseek_v3": ModelSpec(
        litellm_id="deepseek/deepseek-chat",
        display_name="DeepSeek V3.2",
        cost_per_call_usd=0.002,
        supports_fc=True,
        supports_vlm=False,
        temperature=0.3,
    ),
    "gemini_flash_lite": ModelSpec(
        litellm_id="gemini/gemini-2.5-flash-lite",
        display_name="Gemini 2.5 Flash-Lite",
        cost_per_call_usd=0.001,
        supports_fc=True,
        supports_vlm=True,
        temperature=0.3,
    ),
    "qwen_72b": ModelSpec(
        litellm_id="deepinfra/Qwen/Qwen2.5-72B-Instruct",
        display_name="Qwen2.5-72B",
        cost_per_call_usd=0.0007,
        supports_fc=True,
        supports_vlm=False,
        temperature=0.3,
    ),
    "gpt4o_mini": ModelSpec(
        litellm_id="gpt-4o-mini",
        display_name="GPT-4o-mini",
        cost_per_call_usd=0.0009,
        supports_fc=True,
        supports_vlm=True,
        temperature=0.3,
    ),
    "gallery_gpt": ModelSpec(
        litellm_id="local/gallery-gpt-7b",
        display_name="GalleryGPT-7B (local)",
        cost_per_call_usd=0.0,
        supports_fc=False,
        supports_vlm=True,
        temperature=0.3,
    ),
}


# ---------------------------------------------------------------------------
# Default layer → model mapping
# ---------------------------------------------------------------------------

DEFAULT_LAYER_MODELS: dict[str, str] = {
    "visual_perception": "gemini_flash_lite",      # L1: needs VLM
    "technical_analysis": "gemini_flash_lite",      # L2: needs VLM
    "cultural_context": "deepseek_v3",              # L3: FC + best Chinese
    "critical_interpretation": "deepseek_v3",       # L4: FC + reasoning
    "philosophical_aesthetic": "deepseek_v3",       # L5: FC + deep reasoning
}

# Fallback chain per model tier
FALLBACK_CHAINS: dict[str, list[str]] = {
    "deepseek_v3": ["gpt4o_mini"],
    "gemini_flash_lite": ["gpt4o_mini"],
    "gpt4o_mini": [],
}


# ---------------------------------------------------------------------------
# ModelRouter
# ---------------------------------------------------------------------------

@dataclass
class ModelRouter:
    """Routes layer evaluation requests to the appropriate LLM.

    Supports budget constraints, VLM requirements, and fallback chains.
    """

    layer_models: dict[str, str] = field(
        default_factory=lambda: dict(DEFAULT_LAYER_MODELS)
    )
    budget_remaining_usd: float = 5.0

    def select_model(
        self,
        layer_id: str,
        requires_vlm: bool = False,
        budget_remaining: float | None = None,
    ) -> ModelSpec | None:
        """Select the best model for a given layer.

        Returns None if no model is affordable or suitable.
        """
        budget = budget_remaining if budget_remaining is not None else self.budget_remaining_usd
        model_key = self.layer_models.get(layer_id, "deepseek_v3")

        # Try primary model
        spec = MODELS.get(model_key)
        if spec and spec.cost_per_call_usd <= budget:
            if not requires_vlm or spec.supports_vlm:
                return spec

        # Try fallback chain
        fallbacks = FALLBACK_CHAINS.get(model_key, [])
        for fb_key in fallbacks:
            fb_spec = MODELS.get(fb_key)
            if fb_spec and fb_spec.cost_per_call_usd <= budget:
                if not requires_vlm or fb_spec.supports_vlm:
                    return fb_spec

        return None

    def record_cost(self, cost_usd: float) -> None:
        """Deduct cost from remaining budget."""
        self.budget_remaining_usd = max(0.0, self.budget_remaining_usd - cost_usd)

    def to_dict(self) -> dict:
        return {
            "layer_models": self.layer_models,
            "budget_remaining_usd": round(self.budget_remaining_usd, 6),
        }
