"""Generic fallback chain configuration for pipeline providers.

This module provides a convenience factory to build a FallbackProvider
from a list of provider names.

Default Draft fallback chain: together_flux → koala → diffusers → mock
"""

from __future__ import annotations

from app.prototype.agents.draft_provider import (
    AbstractProvider,
    DiffusersProvider,
    FallbackProvider,
    FaultInjectProvider,
    MockProvider,
    TogetherFluxProvider,
)


_PROVIDER_REGISTRY: dict[str, type[AbstractProvider]] = {
    "mock": MockProvider,
    "together_flux": TogetherFluxProvider,
    "diffusers": DiffusersProvider,
}

# Default Draft generation fallback order
DEFAULT_DRAFT_FALLBACK = ["together_flux", "koala", "diffusers", "mock"]


def build_fallback_provider(
    provider_names: list[str] | None = None,
    max_retries: int = 2,
    backoff_base_ms: int = 0,
    api_key: str = "",
) -> FallbackProvider:
    """Build a FallbackProvider from a list of provider names.

    Unknown names are skipped. Always ensures MockProvider is the final fallback.
    For together_flux, an api_key must be provided.
    If provider_names is None, uses DEFAULT_DRAFT_FALLBACK.
    """
    if provider_names is None:
        provider_names = list(DEFAULT_DRAFT_FALLBACK)

    providers: list[AbstractProvider] = []
    seen: set[str] = set()

    for name in provider_names:
        if name in seen:
            continue
        seen.add(name)
        if name == "together_flux":
            if api_key:
                providers.append(TogetherFluxProvider(api_key=api_key))
        elif name == "koala":
            try:
                from app.prototype.agents.koala_provider import KoalaProvider
                kp = KoalaProvider()
                if kp.available:
                    from app.prototype.agents.draft_agent import _KoalaProviderAdapter
                    providers.append(_KoalaProviderAdapter(kp))
            except ImportError:
                pass
        elif name == "diffusers":
            try:
                providers.append(DiffusersProvider())
            except Exception:
                pass
        elif name == "mock":
            providers.append(MockProvider())

    # Ensure mock is always last fallback
    if "mock" not in seen:
        providers.append(MockProvider())

    return FallbackProvider(
        providers=providers,
        max_retries_per_provider=max_retries,
        backoff_base_ms=backoff_base_ms,
    )
