"""Validate KOALA-Lightning 700M image generation provider.

Tests:
1. KoalaProvider instantiation
2. Mock generation (CPU fallback)
3. Real generation with --with-diffusers flag
4. FallbackChain integration (koala in fallback)
5. DraftAgent koala provider integration

Usage:
    ./run_prototype.sh python3 app/prototype/tools/validate_koala.py
    ./run_prototype.sh python3 app/prototype/tools/validate_koala.py --with-diffusers
"""

from __future__ import annotations

import sys
import tempfile
import time
from pathlib import Path

from PIL import Image

_ROOT = Path(__file__).resolve().parent.parent.parent.parent
sys.path.insert(0, str(_ROOT))

_passed = 0
_failed = 0


def _check(label: str, condition: bool, detail: str = "") -> None:
    global _passed, _failed
    if condition:
        _passed += 1
        print(f"  [PASS] {label}")
    else:
        _failed += 1
        msg = f"  [FAIL] {label}"
        if detail:
            msg += f" — {detail}"
        print(msg)


def test_instantiation():
    """Test 1: Provider instantiation."""
    print("\n--- Test 1: Instantiation ---")
    from app.prototype.agents.koala_provider import KoalaProvider

    provider = KoalaProvider()
    _check("KoalaProvider created", provider is not None)
    _check("model_ref correct", provider.model_ref == "koala-lightning-700m")
    _check(f"GPU available = {provider.available}", True)  # Report status
    return provider


def test_mock_generation(provider):
    """Test 2: Mock generation (CPU)."""
    print("\n--- Test 2: Mock generation ---")

    with tempfile.TemporaryDirectory() as tmpdir:
        out_path = str(Path(tmpdir) / "koala_mock.png")
        t0 = time.monotonic()
        result = provider._mock_generate(
            prompt="test landscape",
            seed=42,
            width=1024,
            height=1024,
            output_path=out_path,
        )
        ms = int((time.monotonic() - t0) * 1000)

        _check("mock output path returned", bool(result))
        _check("mock output exists", Path(result).exists())
        if Path(result).exists():
            img = Image.open(result)
            _check(f"mock output is 1024x1024", img.size == (1024, 1024))
        print(f"  Mock time: {ms}ms")


def test_generate(provider, with_diffusers: bool):
    """Test 3: Full generation."""
    if not with_diffusers:
        print("\n--- Test 3: Real generation [SKIP - add --with-diffusers] ---")
        return

    print("\n--- Test 3: Real generation (GPU) ---")
    with tempfile.TemporaryDirectory() as tmpdir:
        out_path = str(Path(tmpdir) / "koala_real.png")
        t0 = time.monotonic()
        result = provider.generate(
            prompt="a beautiful mountain landscape, digital art",
            seed=42,
            width=1024,
            height=1024,
            steps=10,
            output_path=out_path,
        )
        ms = int((time.monotonic() - t0) * 1000)

        _check("real output exists", Path(result).exists())
        if Path(result).exists():
            img = Image.open(result)
            _check(f"output is 1024x1024", img.size == (1024, 1024))
            _check("output is RGB", img.mode == "RGB")
        print(f"  Real inference: {ms}ms")

        # Check VRAM
        try:
            import torch
            if torch.cuda.is_available():
                vram_mb = torch.cuda.max_memory_allocated() / 1024 / 1024
                _check(f"VRAM: {vram_mb:.0f}MB (< 8192MB)", vram_mb < 8192)
        except ImportError:
            pass

        provider.release()


def test_fallback_chain_integration():
    """Test 4: FallbackChain includes koala."""
    print("\n--- Test 4: FallbackChain integration ---")
    from app.prototype.pipeline.fallback_chain import DEFAULT_DRAFT_FALLBACK

    _check("koala in DEFAULT_DRAFT_FALLBACK", "koala" in DEFAULT_DRAFT_FALLBACK)
    _check(
        "koala after together_flux",
        DEFAULT_DRAFT_FALLBACK.index("koala") > DEFAULT_DRAFT_FALLBACK.index("together_flux"),
    )
    _check(
        "koala before mock",
        DEFAULT_DRAFT_FALLBACK.index("koala") < DEFAULT_DRAFT_FALLBACK.index("mock"),
    )


def test_draft_agent_integration():
    """Test 5: DraftAgent with koala provider."""
    print("\n--- Test 5: DraftAgent integration ---")
    from app.prototype.agents.draft_agent import DraftAgent
    from app.prototype.agents.draft_config import DraftConfig

    config = DraftConfig(provider="koala", n_candidates=1, steps=10, width=512, height=512)
    agent = DraftAgent(config=config)
    _check("DraftAgent with koala config created", agent is not None)

    # Test _get_provider resolution
    from app.prototype.agents.draft_agent import _get_provider
    try:
        p = _get_provider("koala", config)
        _check("koala provider resolved", p is not None)
        _check("koala adapter model_ref", "koala" in p.model_ref)
    except Exception as exc:
        _check("koala provider resolved", False, str(exc))


def main() -> int:
    with_diffusers = "--with-diffusers" in sys.argv

    print("=" * 60)
    print("VULCA Prototype — KOALA-Lightning 700M Validator")
    print(f"Mode: {'GPU (--with-diffusers)' if with_diffusers else 'Mock/CPU'}")
    print("=" * 60)

    provider = test_instantiation()
    test_mock_generation(provider)

    # When --with-diffusers is passed, force GPU path to bypass available check
    if with_diffusers:
        provider._available = True
    test_generate(provider, with_diffusers)
    test_fallback_chain_integration()
    test_draft_agent_integration()

    print(f"\n{'=' * 60}")
    print(f"Results: {_passed} passed, {_failed} failed")
    print(f"{'=' * 60}")
    return 0 if _failed == 0 else 1


if __name__ == "__main__":
    sys.exit(main())
