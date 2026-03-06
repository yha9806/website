"""API Key authentication and rate limiting for B2B evaluate API."""

from __future__ import annotations

import os
import time
from collections import defaultdict, deque

from fastapi import Header, HTTPException

# Keys loaded from env: comma-separated list
_KEYS: set[str] | None = None

# Sliding window rate limiter: key -> deque of timestamps
_RATE_WINDOWS: dict[str, deque[float]] = defaultdict(lambda: deque())
RATE_LIMIT_PER_MINUTE = 30


def _load_keys() -> set[str]:
    global _KEYS
    if _KEYS is None:
        raw = os.environ.get("VULCA_API_KEYS", "")
        _KEYS = {k.strip() for k in raw.split(",") if k.strip()}
    return _KEYS


def _check_rate_limit(api_key: str) -> None:
    now = time.monotonic()
    window = _RATE_WINDOWS[api_key]
    # Purge entries older than 60s
    while window and window[0] < now - 60:
        window.popleft()
    if len(window) >= RATE_LIMIT_PER_MINUTE:
        raise HTTPException(status_code=429, detail="Rate limit exceeded (30 req/min)")
    window.append(now)


async def verify_api_key(authorization: str | None = Header(default=None, alias="Authorization")) -> str:
    """FastAPI dependency — validates Bearer token and applies rate limit.

    Returns the validated API key string.
    """
    if not authorization:
        raise HTTPException(status_code=401, detail="Missing Authorization header")

    keys = _load_keys()
    if not keys:
        raise HTTPException(status_code=503, detail="API keys not configured")

    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid Authorization format, expected: Bearer <token>")

    token = authorization[7:]  # strip "Bearer "
    if not token or token not in keys:
        raise HTTPException(status_code=403, detail="Invalid API key")

    _check_rate_limit(token)
    return token
