"""Unified API connection validator for all 4 API-backed models.

Tests:
1. DeepSeek V3.2  — litellm.completion("deepseek/deepseek-chat")
2. Gemini 2.5 Flash-Lite — litellm.completion("gemini/gemini-2.5-flash-lite")
3. GPT-4o-mini — litellm.completion("gpt-4o-mini")
4. Together.ai FLUX — HTTP POST image generation

Usage:
    ./run_prototype.sh python3 app/prototype/tools/validate_api_connections.py
"""

from __future__ import annotations

import base64
import os
import sys
import time


def _check_env_keys() -> dict[str, str]:
    """Return available API keys from environment."""
    keys = {
        "DEEPSEEK_API_KEY": os.environ.get("DEEPSEEK_API_KEY", ""),
        "GOOGLE_API_KEY": os.environ.get("GOOGLE_API_KEY", ""),
        "GEMINI_API_KEY": os.environ.get("GEMINI_API_KEY", ""),
        "OPENAI_API_KEY": os.environ.get("OPENAI_API_KEY", ""),
        "TOGETHER_API_KEY": os.environ.get("TOGETHER_API_KEY", ""),
    }
    return keys


def test_deepseek(verbose: bool = True) -> bool:
    """Test DeepSeek V3.2 via LiteLLM."""
    import litellm

    if not os.environ.get("DEEPSEEK_API_KEY"):
        print("[SKIP] DeepSeek: DEEPSEEK_API_KEY not set")
        return False

    t0 = time.monotonic()
    try:
        resp = litellm.completion(
            model="deepseek/deepseek-chat",
            messages=[{"role": "user", "content": "Reply with only the word: PONG"}],
            max_tokens=10,
            temperature=0.0,
        )
        text = resp.choices[0].message.content.strip()
        ms = int((time.monotonic() - t0) * 1000)
        usage = resp.usage
        cost = (usage.prompt_tokens * 0.14 + usage.completion_tokens * 0.28) / 1_000_000
        if verbose:
            print(f"  Response: {text!r}")
            print(f"  Tokens: {usage.prompt_tokens}+{usage.completion_tokens}, Cost: ${cost:.6f}, Latency: {ms}ms")
        print(f"[PASS] DeepSeek V3.2 ({ms}ms)")
        return True
    except Exception as exc:
        ms = int((time.monotonic() - t0) * 1000)
        print(f"[FAIL] DeepSeek V3.2 ({ms}ms): {exc}")
        return False


def test_gemini(verbose: bool = True) -> bool:
    """Test Gemini 2.5 Flash-Lite via LiteLLM."""
    import litellm

    if not (os.environ.get("GOOGLE_API_KEY") or os.environ.get("GEMINI_API_KEY")):
        print("[SKIP] Gemini: GOOGLE_API_KEY / GEMINI_API_KEY not set")
        return False

    t0 = time.monotonic()
    try:
        resp = litellm.completion(
            model="gemini/gemini-2.5-flash-lite",
            messages=[{"role": "user", "content": "Reply with only the word: PONG"}],
            max_tokens=10,
            temperature=0.0,
        )
        text = resp.choices[0].message.content.strip()
        ms = int((time.monotonic() - t0) * 1000)
        if verbose:
            print(f"  Response: {text!r}")
            print(f"  Latency: {ms}ms")
        print(f"[PASS] Gemini 2.5 Flash-Lite ({ms}ms)")
        return True
    except Exception as exc:
        ms = int((time.monotonic() - t0) * 1000)
        print(f"[FAIL] Gemini 2.5 Flash-Lite ({ms}ms): {exc}")
        return False


def test_gpt4o_mini(verbose: bool = True) -> bool:
    """Test GPT-4o-mini via LiteLLM."""
    import litellm

    if not os.environ.get("OPENAI_API_KEY"):
        print("[SKIP] GPT-4o-mini: OPENAI_API_KEY not set")
        return False

    t0 = time.monotonic()
    try:
        resp = litellm.completion(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": "Reply with only the word: PONG"}],
            max_tokens=10,
            temperature=0.0,
        )
        text = resp.choices[0].message.content.strip()
        ms = int((time.monotonic() - t0) * 1000)
        usage = resp.usage
        cost = (usage.prompt_tokens * 0.15 + usage.completion_tokens * 0.6) / 1_000_000
        if verbose:
            print(f"  Response: {text!r}")
            print(f"  Tokens: {usage.prompt_tokens}+{usage.completion_tokens}, Cost: ${cost:.6f}, Latency: {ms}ms")
        print(f"[PASS] GPT-4o-mini ({ms}ms)")
        return True
    except Exception as exc:
        ms = int((time.monotonic() - t0) * 1000)
        print(f"[FAIL] GPT-4o-mini ({ms}ms): {exc}")
        return False


def test_together_flux(verbose: bool = True) -> bool:
    """Test Together.ai FLUX image generation."""
    import requests

    api_key = os.environ.get("TOGETHER_API_KEY", "")
    if not api_key:
        print("[SKIP] Together.ai FLUX: TOGETHER_API_KEY not set")
        return False

    t0 = time.monotonic()
    try:
        resp = requests.post(
            "https://api.together.xyz/v1/images/generations",
            json={
                "model": "black-forest-labs/FLUX.1-schnell",
                "prompt": "a red circle on white background, simple test",
                "width": 256,
                "height": 256,
                "steps": 1,
                "n": 1,
                "response_format": "b64_json",
            },
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
            },
            timeout=60,
        )
        resp.raise_for_status()
        data = resp.json()
        b64_str = data["data"][0]["b64_json"]
        img_bytes = base64.b64decode(b64_str)
        ms = int((time.monotonic() - t0) * 1000)

        # Verify image format
        fmt = "unknown"
        if img_bytes[:4] == b"\x89PNG":
            fmt = "PNG"
        elif img_bytes[:2] == b"\xff\xd8":
            fmt = "JPEG"
        elif img_bytes[:4] == b"RIFF":
            fmt = "WebP"

        if verbose:
            print(f"  Format: {fmt}, Size: {len(img_bytes)} bytes")
            print(f"  Latency: {ms}ms")
        print(f"[PASS] Together.ai FLUX ({ms}ms, {fmt} {len(img_bytes)}B)")
        return True
    except Exception as exc:
        ms = int((time.monotonic() - t0) * 1000)
        print(f"[FAIL] Together.ai FLUX ({ms}ms): {exc}")
        return False


def main() -> int:
    print("=" * 60)
    print("VULCA Prototype — API Connection Validator")
    print("=" * 60)

    keys = _check_env_keys()
    print("\nEnvironment keys:")
    for k, v in keys.items():
        status = f"set ({len(v)} chars)" if v else "NOT SET"
        print(f"  {k}: {status}")

    print("\n--- Testing API connections ---\n")

    results = {
        "DeepSeek V3.2": test_deepseek(),
        "Gemini 2.5 Flash-Lite": test_gemini(),
        "GPT-4o-mini": test_gpt4o_mini(),
        "Together.ai FLUX": test_together_flux(),
    }

    print("\n--- Summary ---\n")
    passed = sum(1 for v in results.values() if v)
    total = len(results)
    for name, ok in results.items():
        print(f"  {'PASS' if ok else 'FAIL/SKIP'} {name}")
    print(f"\n{passed}/{total} API connections verified.")

    return 0 if passed == total else 1


if __name__ == "__main__":
    sys.exit(main())
