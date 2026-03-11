"""Visual rendering utility — wraps NB2Provider for sub-stage image generation.

Provides an async helper that sub-stage handlers call to render visual artifacts
alongside their text outputs. Falls back gracefully when no API key is available.
"""

from __future__ import annotations

import asyncio
import logging
import os
from pathlib import Path
from typing import Optional

logger = logging.getLogger(__name__)

# Reuse a single NB2Provider instance across calls within a process
_provider_instance = None
_provider_lock = asyncio.Lock()


def _get_nb2_provider():
    """Get or create a shared NB2Provider instance. Returns None if unavailable."""
    global _provider_instance
    if _provider_instance is not None:
        return _provider_instance
    try:
        from app.prototype.agents.nb2_provider import NB2Provider

        api_key = os.environ.get("GOOGLE_API_KEY", "") or os.environ.get(
            "GEMINI_API_KEY", ""
        )
        if not api_key:
            try:
                from app.core.config import settings

                api_key = settings.GOOGLE_API_KEY or settings.GEMINI_API_KEY or ""
            except Exception:
                pass
        if not api_key:
            return None
        _provider_instance = NB2Provider(api_key=api_key, timeout=60)
        return _provider_instance
    except Exception as exc:
        logger.debug("NB2Provider unavailable: %s", exc)
        return None


async def render_visual(
    prompt: str,
    output_dir: str,
    filename: str,
    width: int = 512,
    height: int = 512,
    style_prefix: str = "",
) -> str:
    """Render a visual image using NB2Provider.

    Parameters
    ----------
    prompt : str
        The generation prompt.
    output_dir : str
        Directory to save the image.
    filename : str
        Filename (without extension — .png will be appended).
    width, height : int
        Image dimensions.
    style_prefix : str
        Optional prefix prepended to the prompt (e.g. "rough pencil sketch of").

    Returns
    -------
    str
        Path to the generated image, or "" if rendering failed/unavailable.
    """
    provider = _get_nb2_provider()
    if provider is None:
        return ""

    full_prompt = f"{style_prefix} {prompt}".strip() if style_prefix else prompt
    out_path = str(Path(output_dir) / filename)
    Path(output_dir).mkdir(parents=True, exist_ok=True)

    try:
        actual_path = await asyncio.to_thread(
            provider.generate,
            prompt=full_prompt,
            negative_prompt="",
            seed=0,
            width=width,
            height=height,
            steps=20,
            sampler="",
            output_path=out_path,
        )
        logger.info("Visual render OK: %s", actual_path)
        return actual_path
    except Exception as exc:
        logger.warning("Visual render failed for '%s...': %s", prompt[:60], exc)
        return ""


def get_substage_output_dir(task_id: str) -> str:
    """Return the output directory for sub-stage visual artifacts."""
    base = Path(__file__).resolve().parent.parent / "checkpoints" / "substages"
    d = base / task_id
    d.mkdir(parents=True, exist_ok=True)
    return str(d)
