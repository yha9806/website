# S1: Together.ai Flux Provider Integration Report

**Date**: 2026-02-08
**Baseline**: `v1.0-prototype` (fcc87ae)

## Summary

Implemented `TogetherFluxProvider` — a real image generation provider using Together.ai's FLUX.1-schnell model. Integrated into Draft Agent with fallback chain support.

## Changes

| File | Operation | Description |
|------|-----------|-------------|
| `agents/draft_provider.py` | Modified | Added `TogetherFluxProvider` class (110 lines) |
| `agents/draft_agent.py` | Modified | `_get_provider()` supports `together_flux` with config |
| `agents/draft_config.py` | Modified | Added `api_key` and `provider_model` fields |
| `pipeline/fallback_chain.py` | Modified | Registry + `build_fallback_provider()` supports `api_key` |
| `tools/validate_provider_real.py` | Created | 8 mock tests + optional real API test |
| `requirements.prototype.txt` | Modified | Added `requests>=2.31.0` |

## TogetherFluxProvider Design

- **API**: Together.ai Images API (`/v1/images/generations`)
- **Response format**: `b64_json` (avoids second HTTP download)
- **Exception mapping**: `requests.*` → `TimeoutError/ConnectionError/OSError` (compatible with FallbackProvider)
- **Call logging**: Every call records model, prompt_len, dimensions, status, latency, error, timestamp
- **Lazy import**: `import requests` inside `generate()` to avoid impact on mock-only paths
- **Sampler**: Silently ignored (Together.ai doesn't support it)

## Configuration Layers

```python
# Development
DraftConfig(provider="mock")

# Staging (single provider)
DraftConfig(provider="together_flux", api_key="...", provider_model="black-forest-labs/FLUX.1-schnell")

# Production (fallback chain)
build_fallback_provider(["together_flux", "mock"], api_key="...", max_retries=2, backoff_base_ms=1000)
```

## Validation Results

| Suite | Checks | Status |
|-------|--------|--------|
| validate_provider_real.py | 35/35 | PASS |
| validate_critic.py | 66/66 | PASS |
| validate_queen.py | 34/34 | PASS |
| validate_pipeline_e2e.py | 35/35 | PASS |
| validate_archivist.py | 28/28 | PASS |
| validate_fallback.py | 19/19 | PASS |
| validate_regression.py | 13/13 | PASS |
| **Total** | **230/230** | **ALL PASS** |

## Test Coverage (8 mock + 1 real scenario)

**Mock tests (no API key needed):**
1. Normal b64_json response → file written + call_log
2. HTTP 422 (safety filter) → OSError + error logged
3. HTTP 429 (rate limit) → OSError + status logged
4. Connection timeout → TimeoutError
5. No API key → ValueError (env var temporarily unset)
6. Fallback chain: together_flux → mock
7. Config layer resolution: mock/staging/prod
8. `_get_provider` with config parameters

**Real API test (with TOGETHER_API_KEY):**
9. FLUX.1-schnell 256×256 image generation → **726ms latency, 5600 bytes JPEG**

## Real API Call Results

| Metric | Value |
|--------|-------|
| Model | black-forest-labs/FLUX.1-schnell |
| Resolution | 256×256 |
| Steps | 4 |
| Latency | 726ms |
| File size | 5600 bytes |
| Format | JPEG (b64_json decoded) |
| Status | 200 OK |

> Note: Together.ai FLUX.1-schnell returns JPEG images (not PNG) via b64_json.
> The $5 minimum deposit is required for API access (not a per-call charge).
