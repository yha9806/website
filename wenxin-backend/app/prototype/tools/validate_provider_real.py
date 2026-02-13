#!/usr/bin/env python3
"""S1 validation — TogetherFluxProvider integration tests.

All 8 core tests use mock HTTP (no real API key needed).
If TOGETHER_API_KEY is set, one additional real API call is made.

Usage::

    cd wenxin-backend
    python3 app/prototype/tools/validate_provider_real.py

Exit code 0 = ALL CHECKS PASSED, 1 = failures detected.
"""

from __future__ import annotations

import base64
import json
import os
import struct
import sys
import tempfile
import zlib
from pathlib import Path
from unittest.mock import MagicMock, patch

_PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent.parent
if str(_PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(_PROJECT_ROOT))

from app.prototype.agents.draft_config import DraftConfig
from app.prototype.agents.draft_provider import (
    AllProvidersFailedError,
    FallbackProvider,
    MockProvider,
    TogetherFluxProvider,
)
from app.prototype.agents.draft_agent import _get_provider
from app.prototype.pipeline.fallback_chain import build_fallback_provider

# ---------------------------------------------------------------------------
passed = 0
failed = 0


def check(label: str, condition: bool, detail: str = "") -> None:
    global passed, failed
    if condition:
        passed += 1
        print(f"  [PASS] {label}")
    else:
        failed += 1
        msg = f"  [FAIL] {label}"
        if detail:
            msg += f" — {detail}"
        print(msg)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _make_tiny_png() -> bytes:
    """Create a minimal 2x2 PNG for mocking API responses."""

    def _chunk(chunk_type: bytes, data: bytes) -> bytes:
        length = struct.pack(">I", len(data))
        crc = struct.pack(">I", zlib.crc32(chunk_type + data) & 0xFFFFFFFF)
        return length + chunk_type + data + crc

    signature = b"\x89PNG\r\n\x1a\n"
    ihdr_data = struct.pack(">IIBBBBB", 2, 2, 8, 2, 0, 0, 0)
    ihdr = _chunk(b"IHDR", ihdr_data)
    row = bytes([0, 255, 0, 0, 255, 0, 0])
    raw = row * 2
    idat = _chunk(b"IDAT", zlib.compress(raw))
    iend = _chunk(b"IEND", b"")
    return signature + ihdr + idat + iend


def _mock_success_response() -> MagicMock:
    """Mock a successful Together.ai API response."""
    png_bytes = _make_tiny_png()
    b64_str = base64.b64encode(png_bytes).decode()
    resp = MagicMock()
    resp.status_code = 200
    resp.json.return_value = {"data": [{"b64_json": b64_str}]}
    resp.raise_for_status = MagicMock()
    return resp


def _mock_error_response(status_code: int, text: str = "error") -> MagicMock:
    """Mock a failed Together.ai API response."""
    import requests as _requests

    resp = MagicMock()
    resp.status_code = status_code
    resp.text = text
    resp.raise_for_status.side_effect = _requests.exceptions.HTTPError(
        f"{status_code} Error", response=resp
    )
    return resp


# ---------------------------------------------------------------------------
# Tests
# ---------------------------------------------------------------------------

def test_1_normal_b64_response() -> None:
    """Test 1: Normal b64_json response → image file written + call_log."""
    import requests as _requests

    provider = TogetherFluxProvider(api_key="test-key-123")

    with tempfile.TemporaryDirectory() as tmpdir:
        out_path = os.path.join(tmpdir, "output.png")

        with patch.object(_requests, "post", return_value=_mock_success_response()) as mock_post:
            result = provider.generate(
                prompt="A mountain landscape",
                negative_prompt="blurry",
                seed=42,
                width=512,
                height=512,
                steps=4,
                sampler="euler_a",
                output_path=out_path,
            )

        check("T1: image file written", Path(result).exists())
        check("T1: file is valid PNG", Path(result).read_bytes()[:4] == b"\x89PNG")
        check("T1: call_log has 1 entry", len(provider.call_log) == 1)
        log_entry = provider.call_log[0]
        check("T1: call_log status_code=200", log_entry["status_code"] == 200)
        check("T1: call_log error is None", log_entry["error"] is None)
        check("T1: call_log has latency_ms", log_entry["latency_ms"] >= 0)
        check("T1: call_log has timestamp", "timestamp" in log_entry)

        # Verify request payload
        call_args = mock_post.call_args
        payload = call_args.kwargs.get("json") or call_args[1].get("json")
        check("T1: payload has b64_json format", payload["response_format"] == "b64_json")
        check("T1: payload has negative_prompt", payload.get("negative_prompt") == "blurry")


def test_2_http_422_safety_filter() -> None:
    """Test 2: HTTP 422 (safety filter) → OSError + call_log error."""
    import requests as _requests

    provider = TogetherFluxProvider(api_key="test-key-123")

    with tempfile.TemporaryDirectory() as tmpdir:
        out_path = os.path.join(tmpdir, "output.png")

        with patch.object(_requests, "post", return_value=_mock_error_response(422, "content filtered")):
            try:
                provider.generate(
                    prompt="test", negative_prompt="", seed=1,
                    width=512, height=512, steps=4, sampler="euler_a",
                    output_path=out_path,
                )
                check("T2: should raise OSError", False)
            except OSError as exc:
                check("T2: raises OSError on 422", True)
                check("T2: error mentions 422", "422" in str(exc))

        check("T2: call_log records error", provider.call_log[-1]["error"] is not None)


def test_3_http_429_rate_limit() -> None:
    """Test 3: HTTP 429 (rate limit) → OSError, catchable by FallbackProvider."""
    import requests as _requests

    provider = TogetherFluxProvider(api_key="test-key-123")

    with tempfile.TemporaryDirectory() as tmpdir:
        out_path = os.path.join(tmpdir, "output.png")

        with patch.object(_requests, "post", return_value=_mock_error_response(429, "rate limited")):
            try:
                provider.generate(
                    prompt="test", negative_prompt="", seed=1,
                    width=512, height=512, steps=4, sampler="euler_a",
                    output_path=out_path,
                )
                check("T3: should raise OSError", False)
            except OSError:
                check("T3: raises OSError on 429", True)

        check("T3: call_log records 429", provider.call_log[-1]["status_code"] == 429)


def test_4_connection_timeout() -> None:
    """Test 4: Connection timeout → TimeoutError, triggers fallback."""
    import requests as _requests

    provider = TogetherFluxProvider(api_key="test-key-123", timeout=5)

    with tempfile.TemporaryDirectory() as tmpdir:
        out_path = os.path.join(tmpdir, "output.png")

        with patch.object(
            _requests, "post",
            side_effect=_requests.exceptions.Timeout("read timed out"),
        ):
            try:
                provider.generate(
                    prompt="test", negative_prompt="", seed=1,
                    width=512, height=512, steps=4, sampler="euler_a",
                    output_path=out_path,
                )
                check("T4: should raise TimeoutError", False)
            except TimeoutError as exc:
                check("T4: raises TimeoutError", True)
                check("T4: error message", "timeout" in str(exc).lower())


def test_5_no_api_key() -> None:
    """Test 5: No API key → ValueError."""
    # Temporarily unset env var to test the ValueError path
    saved = os.environ.pop("TOGETHER_API_KEY", None)
    try:
        _get_provider("together_flux", DraftConfig(provider="together_flux", api_key=""))
        check("T5: should raise ValueError", False)
    except ValueError as exc:
        check("T5: raises ValueError without key", True)
        check("T5: error mentions TOGETHER_API_KEY", "TOGETHER_API_KEY" in str(exc))
    finally:
        if saved is not None:
            os.environ["TOGETHER_API_KEY"] = saved


def test_6_fallback_chain_together_to_mock() -> None:
    """Test 6: Fallback chain: together_flux → mock succeeds via mock."""
    import requests as _requests

    with tempfile.TemporaryDirectory() as tmpdir:
        out_path = os.path.join(tmpdir, "output.png")

        fb = build_fallback_provider(
            ["together_flux", "mock"],
            api_key="test-key",
            max_retries=1,
            backoff_base_ms=0,
        )

        # Make together_flux fail, mock should succeed
        with patch.object(
            _requests, "post",
            side_effect=_requests.exceptions.Timeout("timeout"),
        ):
            result = fb.generate(
                prompt="test", negative_prompt="", seed=42,
                width=512, height=512, steps=4, sampler="euler_a",
                output_path=out_path,
            )

        check("T6: fallback produces file", Path(result).exists())
        check("T6: route_log has entries", len(fb.route_log) >= 2)
        # Last entry should be mock success
        last_log = fb.route_log[-1]
        check("T6: final provider is mock", last_log["provider"] == "mock-v1")
        check("T6: final status is success", last_log["status"] == "success")


def test_7_config_layer_resolution() -> None:
    """Test 7: Configuration layers: mock/staging/prod resolve correctly."""
    # Mock config
    mock_cfg = DraftConfig(provider="mock")
    p1 = _get_provider(mock_cfg.provider, mock_cfg)
    check("T7: mock config → MockProvider", isinstance(p1, MockProvider))

    # together_flux config with key
    flux_cfg = DraftConfig(
        provider="together_flux",
        api_key="staging-key-123",
        provider_model="black-forest-labs/FLUX.1-schnell",
    )
    p2 = _get_provider(flux_cfg.provider, flux_cfg)
    check("T7: flux config → TogetherFluxProvider", isinstance(p2, TogetherFluxProvider))
    check("T7: flux model_ref correct", "FLUX.1-schnell" in p2.model_ref)

    # Fallback chain (prod)
    fb = build_fallback_provider(
        ["together_flux", "mock"],
        api_key="prod-key-456",
        max_retries=2,
        backoff_base_ms=1000,
    )
    check("T7: fallback has 2 providers", "fallback(" in fb.model_ref)
    check("T7: fallback model_ref contains together", "together" in fb.model_ref)
    check("T7: fallback model_ref contains mock", "mock" in fb.model_ref)


def test_8_get_provider_with_config() -> None:
    """Test 8: _get_provider correctly uses config api_key and model."""
    cfg = DraftConfig(
        provider="together_flux",
        api_key="my-secret-key",
        provider_model="black-forest-labs/FLUX.1-dev",
    )
    p = _get_provider("together_flux", cfg)
    check("T8: provider is TogetherFluxProvider", isinstance(p, TogetherFluxProvider))
    check("T8: model_ref has FLUX.1-dev", "FLUX.1-dev" in p.model_ref)

    # Verify unknown provider
    try:
        _get_provider("unknown_provider")
        check("T8: unknown provider raises ValueError", False)
    except ValueError:
        check("T8: unknown provider raises ValueError", True)


def test_optional_real_api() -> None:
    """Optional: Real API call if TOGETHER_API_KEY is set."""
    api_key = os.environ.get("TOGETHER_API_KEY", "")
    if not api_key:
        print("\n  [SKIP] TOGETHER_API_KEY not set — skipping real API test")
        return

    print("\n  [INFO] Running real API call...")
    provider = TogetherFluxProvider(api_key=api_key, timeout=120)

    with tempfile.TemporaryDirectory() as tmpdir:
        out_path = os.path.join(tmpdir, "real_test.png")
        try:
            result = provider.generate(
                prompt="A simple red circle on white background, minimal",
                negative_prompt="complex, detailed",
                seed=42,
                width=256,
                height=256,
                steps=4,
                sampler="euler_a",
                output_path=out_path,
            )
            check("REAL: image generated", Path(result).exists())
            size = Path(result).stat().st_size
            check(f"REAL: file size > 1KB ({size} bytes)", size > 1024)
            header = Path(result).read_bytes()[:4]
            is_png = header[:4] == b"\x89PNG"
            is_jpeg = header[:2] == b"\xff\xd8"
            is_webp = header[:4] == b"RIFF"
            check("REAL: valid image header (PNG/JPEG/WebP)",
                  is_png or is_jpeg or is_webp,
                  f"got {header.hex()}")
            log = provider.call_log[-1]
            check(f"REAL: latency {log['latency_ms']}ms", log["latency_ms"] > 0)
            print(f"  [INFO] Real API latency: {log['latency_ms']}ms, file size: {size} bytes")
        except Exception as exc:
            check(f"REAL: API call succeeded", False, str(exc))


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main() -> None:
    global passed, failed

    print("=" * 60)
    print("  S1 Provider Integration (TogetherFluxProvider)")
    print("=" * 60)

    test_1_normal_b64_response()
    test_2_http_422_safety_filter()
    test_3_http_429_rate_limit()
    test_4_connection_timeout()
    test_5_no_api_key()
    test_6_fallback_chain_together_to_mock()
    test_7_config_layer_resolution()
    test_8_get_provider_with_config()
    test_optional_real_api()

    print(f"\n{'='*60}")
    total = passed + failed
    print(f"  Results: {passed}/{total} checks passed, {failed} failed")
    if failed == 0:
        print("  ALL CHECKS PASSED")
    else:
        print("  SOME CHECKS FAILED")
    print("=" * 60)
    sys.exit(0 if failed == 0 else 1)


if __name__ == "__main__":
    main()
