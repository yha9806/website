"""DALL-E 3 provider via OpenAI API."""

import os
import logging
import httpx
from pathlib import Path

from app.prototype.agents.draft_provider import AbstractProvider

logger = logging.getLogger(__name__)


class OpenAIProvider(AbstractProvider):
    """Generate images via OpenAI DALL-E 3 API."""

    def __init__(self, api_key: str = ""):
        self.api_key = api_key or os.environ.get("OPENAI_API_KEY", "")
        if not self.api_key:
            raise ValueError("OPENAI_API_KEY required for OpenAI provider")

    @property
    def model_ref(self) -> str:
        return "dall-e-3"

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
        # Map to DALL-E 3 supported sizes
        size = _map_size(width, height)

        with httpx.Client(timeout=120) as client:
            resp = client.post(
                "https://api.openai.com/v1/images/generations",
                headers={"Authorization": f"Bearer {self.api_key}"},
                json={
                    "model": "dall-e-3",
                    "prompt": prompt,
                    "n": 1,
                    "size": size,
                    "quality": "standard",
                    "response_format": "b64_json",
                },
            )
            resp.raise_for_status()
            data = resp.json()

        import base64
        image_b64 = data["choices"][0]["b64_json"] if "choices" in data else data["data"][0]["b64_json"]
        image_bytes = base64.b64decode(image_b64)

        out = Path(output_path)
        out.parent.mkdir(parents=True, exist_ok=True)
        out.write_bytes(image_bytes)
        return str(out)


def _map_size(width: int, height: int) -> str:
    """Map arbitrary dimensions to DALL-E 3 supported sizes."""
    aspect = width / height if height else 1.0
    if aspect > 1.3:
        return "1792x1024"
    elif aspect < 0.77:
        return "1024x1792"
    return "1024x1024"
