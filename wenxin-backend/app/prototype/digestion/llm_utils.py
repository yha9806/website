"""Shared LLM utilities for digestion layer components."""

from __future__ import annotations


def has_llm_api_key() -> bool:
    """Check if an LLM API key is available for digestion tasks.

    Checks the ``gemini_direct`` model spec in the model router.
    Returns False on any error (zero regression).
    """
    try:
        from app.prototype.agents.model_router import MODELS

        spec = MODELS.get("gemini_direct")
        if spec and spec.get_api_key():
            return True
    except Exception:
        pass
    return False


def strip_markdown_fences(text: str) -> str:
    """Strip markdown code fences from LLM output.

    Handles ````` ```json ````` / ````` ``` ````` wrappers that LLMs
    commonly add around JSON responses.

    >>> strip_markdown_fences('```json\\n{"a": 1}\\n```')
    '{"a": 1}'
    >>> strip_markdown_fences('plain text')
    'plain text'
    """
    text = text.strip()
    if not text.startswith("```"):
        return text
    # Remove opening fence line (```json, ```python, or bare ```)
    if "\n" in text:
        text = text.split("\n", 1)[1]
    else:
        return ""
    # Remove closing fence
    if text.rstrip().endswith("```"):
        text = text.rstrip()[:-3]
    return text.strip()
