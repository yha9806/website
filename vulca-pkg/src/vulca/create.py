"""Create API client — POST /api/v1/create for full pipeline creation."""

from __future__ import annotations

import asyncio
import os

import httpx

from vulca.types import CreateResult


async def acreate(
    intent: str,
    *,
    tradition: str = "",
    subject: str = "",
    provider: str = "nb2",
    base_url: str = "",
    api_key: str = "",
) -> CreateResult:
    """Create artwork via the VULCA API (async).

    Parameters
    ----------
    intent:
        Natural language description of what to create.
    tradition:
        Cultural tradition. If empty, auto-detected.
    subject:
        Optional artwork subject/title.
    provider:
        Image generation provider (nb2 | mock).
    base_url:
        VULCA API base URL. Defaults to VULCA_API_URL env or localhost.
    api_key:
        API key. Defaults to VULCA_API_KEY env.

    Returns
    -------
    CreateResult
        Complete creation result with session ID, rounds, and scores.
    """
    url = base_url or os.environ.get("VULCA_API_URL", "http://localhost:8001")
    key = api_key or os.environ.get("VULCA_API_KEY", "")

    body = {
        "intent": intent,
        "tradition": tradition or "default",
        "subject": subject or intent,
        "provider": provider,
        "stream": False,
    }

    headers = {"Content-Type": "application/json"}
    if key:
        headers["Authorization"] = f"Bearer {key}"

    async with httpx.AsyncClient(timeout=120) as client:
        resp = await client.post(
            f"{url}/api/v1/create",
            json=body,
            headers=headers,
        )
        resp.raise_for_status()
        data = resp.json()

    return CreateResult(
        session_id=data.get("session_id", ""),
        mode=data.get("mode", "create"),
        tradition=data.get("tradition", "default"),
        scores=data.get("scores") or {},
        weighted_total=data.get("weighted_total") or 0.0,
        best_candidate_id=data.get("best_candidate_id") or "",
        best_image_url=data.get("best_image_url") or "",
        total_rounds=data.get("total_rounds") or 0,
        rounds=data.get("rounds") or [],
        summary=data.get("summary") or "",
        recommendations=data.get("recommendations") or [],
        latency_ms=data.get("latency_ms", 0),
        cost_usd=data.get("cost_usd", 0.0),
        raw=data,
    )


def create(
    intent: str,
    *,
    tradition: str = "",
    subject: str = "",
    provider: str = "nb2",
    base_url: str = "",
    api_key: str = "",
) -> CreateResult:
    """Create artwork via the VULCA API (synchronous wrapper).

    See :func:`acreate` for parameter documentation.
    """
    try:
        loop = asyncio.get_running_loop()
    except RuntimeError:
        loop = None

    if loop and loop.is_running():
        import concurrent.futures

        with concurrent.futures.ThreadPoolExecutor(max_workers=1) as pool:
            future = pool.submit(
                asyncio.run,
                acreate(
                    intent,
                    tradition=tradition,
                    subject=subject,
                    provider=provider,
                    base_url=base_url,
                    api_key=api_key,
                ),
            )
            return future.result()
    else:
        return asyncio.run(
            acreate(
                intent,
                tradition=tradition,
                subject=subject,
                provider=provider,
                base_url=base_url,
                api_key=api_key,
            )
        )
