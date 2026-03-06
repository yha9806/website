"""Image download and decoding utilities for the evaluate API."""

from __future__ import annotations

import base64
import tempfile
from pathlib import Path

import httpx

MAX_IMAGE_SIZE = 10 * 1024 * 1024  # 10 MB
DOWNLOAD_TIMEOUT = 30.0
ALLOWED_TYPES = {b"\xff\xd8\xff": ".jpg", b"\x89PNG": ".png", b"RIFF": ".webp"}


_HEADERS = {"User-Agent": "VULCA-API/1.0 (https://vulcaart.art)"}


async def download_image(url: str) -> str:
    """Download image from URL to a temp file. Returns file path."""
    async with httpx.AsyncClient(
        timeout=DOWNLOAD_TIMEOUT, follow_redirects=True, headers=_HEADERS,
    ) as client:
        resp = await client.get(url)
        resp.raise_for_status()
        data = resp.content
    if len(data) > MAX_IMAGE_SIZE:
        raise ValueError(f"Image exceeds {MAX_IMAGE_SIZE // (1024 * 1024)}MB limit")
    ext = _detect_ext(data)
    return _write_temp(data, ext)


def decode_base64_image(data: str) -> str:
    """Decode base64 string to a temp file. Returns file path."""
    # Strip optional data URI prefix (e.g. "data:image/png;base64,")
    if "," in data[:64]:
        data = data.split(",", 1)[1]
    raw = base64.b64decode(data)
    if len(raw) > MAX_IMAGE_SIZE:
        raise ValueError(f"Image exceeds {MAX_IMAGE_SIZE // (1024 * 1024)}MB limit")
    ext = _detect_ext(raw)
    return _write_temp(raw, ext)


async def resolve_image_input(url: str | None, image_base64: str | None) -> str:
    """Unified entry: return temp file path from either URL or base64."""
    if image_base64:
        return decode_base64_image(image_base64)
    if url:
        return await download_image(url)
    raise ValueError("No image input provided")


def cleanup_temp_image(path: str) -> None:
    """Remove temporary image file if it exists."""
    try:
        Path(path).unlink(missing_ok=True)
    except OSError:
        pass


def _detect_ext(data: bytes) -> str:
    for magic, ext in ALLOWED_TYPES.items():
        if data[:len(magic)] == magic:
            return ext
    return ".png"  # fallback


def _write_temp(data: bytes, ext: str) -> str:
    tmp = tempfile.NamedTemporaryFile(suffix=ext, delete=False, prefix="vulca_eval_")
    tmp.write(data)
    tmp.close()
    return tmp.name
