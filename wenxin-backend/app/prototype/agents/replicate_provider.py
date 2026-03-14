"""Flux provider via Replicate API."""

import os
import logging
import httpx
from pathlib import Path

from app.prototype.agents.draft_provider import AbstractProvider, ProviderRegistry

logger = logging.getLogger(__name__)


@ProviderRegistry.register("replicate", aliases=["flux"])
class ReplicateProvider(AbstractProvider):
    """Generate images via Replicate (Flux, SD3, etc.)."""

    def __init__(self, api_key: str = "", model_id: str = "black-forest-labs/flux-schnell"):
        self.api_key = api_key or os.environ.get("REPLICATE_API_TOKEN", "")
        if not self.api_key:
            raise ValueError("REPLICATE_API_TOKEN required for Replicate provider")
        self.model_id = model_id

    @property
    def model_ref(self) -> str:
        return self.model_id.split("/")[-1]

    def generate(
        self,
        prompt: str,
        negative_prompt: str,
        seed: int,
        width: int,
        height: int,
        steps: int,
        sampler: str,
        output_path: str,
    ) -> str:
        import replicate

        client = replicate.Client(api_token=self.api_key)
        output = client.run(
            self.model_id,
            input={
                "prompt": prompt,
                "num_inference_steps": min(steps, 4),  # Flux schnell is 1-4 steps
                "width": _snap(width),
                "height": _snap(height),
                "seed": seed,
            },
        )

        # output is a list of URLs or FileOutput objects
        image_url = str(output[0]) if isinstance(output, list) else str(output)

        with httpx.Client(timeout=60) as http:
            resp = http.get(image_url)
            resp.raise_for_status()

        out = Path(output_path)
        out.parent.mkdir(parents=True, exist_ok=True)
        out.write_bytes(resp.content)
        return str(out)


def _snap(v: int, multiple: int = 8) -> int:
    """Snap dimension to nearest multiple."""
    return max(multiple, (v // multiple) * multiple)
