"""Sync→Async bridge with shared thread pool.

Provides a single function to call async coroutines from synchronous code,
reusing a module-level thread pool instead of creating/destroying one per call.
"""

from __future__ import annotations

import asyncio
import concurrent.futures
from typing import Any

_THREAD_POOL = concurrent.futures.ThreadPoolExecutor(max_workers=4)


def run_async_from_sync(coro: Any, timeout: float = 60.0) -> Any:
    """Run *coro* from a synchronous context.

    If already inside a running event loop (e.g. FastAPI), delegates to a
    shared background thread.  Otherwise calls ``asyncio.run`` directly.
    """
    try:
        loop = asyncio.get_running_loop()
    except RuntimeError:
        loop = None

    if loop is not None and loop.is_running():
        future = _THREAD_POOL.submit(asyncio.run, coro)
        return future.result(timeout=timeout)
    return asyncio.run(coro)
