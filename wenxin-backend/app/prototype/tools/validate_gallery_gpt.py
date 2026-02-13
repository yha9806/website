"""Validate GalleryGPT painting-specialized VLM provider.

Tests:
1. GalleryGPTProvider instantiation
2. Mock analysis (CPU fallback)
3. Layer-specific prompts
4. Real 4-bit inference with --with-gpu flag

Usage:
    ./run_prototype.sh python3 app/prototype/tools/validate_gallery_gpt.py
    ./run_prototype.sh python3 app/prototype/tools/validate_gallery_gpt.py --with-gpu
"""

from __future__ import annotations

import sys
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


def _make_test_image() -> Image.Image:
    """Create a simple test image."""
    return Image.new("RGB", (256, 256), (150, 100, 80))


def test_instantiation():
    """Test 1: Provider instantiation."""
    print("\n--- Test 1: Instantiation ---")
    from app.prototype.agents.gallery_gpt_provider import GalleryGPTProvider

    provider = GalleryGPTProvider()
    _check("GalleryGPTProvider created", provider is not None)
    _check("model_ref correct", provider.model_ref == "gallery-gpt-7b-4bit")
    _check(f"GPU available = {provider.available}", True)  # Report status
    return provider


def test_mock_analysis(provider):
    """Test 2: Mock analysis."""
    print("\n--- Test 2: Mock analysis ---")
    from app.prototype.agents.gallery_gpt_provider import GalleryGPTProvider

    for layer in ["L1", "L2", "L3", "L4", "L5"]:
        result = GalleryGPTProvider._mock_analysis(layer)
        _check(f"mock {layer} returns dict", isinstance(result, dict))
        _check(f"mock {layer} has analysis", bool(result.get("analysis")))
        _check(f"mock {layer} success=True", result.get("success") is True)


def test_layer_prompts():
    """Test 3: Layer-specific prompts."""
    print("\n--- Test 3: Layer prompts ---")
    from app.prototype.agents.gallery_gpt_provider import GalleryGPTProvider

    for layer in ["L1", "L2", "L3", "L4", "L5"]:
        prompt = GalleryGPTProvider._layer_prompt(layer)
        _check(f"{layer} prompt non-empty", len(prompt) > 20, f"len={len(prompt)}")

    # Unknown layer falls back to L1
    fallback = GalleryGPTProvider._layer_prompt("L99")
    _check("unknown layer falls back to L1", len(fallback) > 20)


def test_analyze_mock(provider):
    """Test 4: analyze_artwork in mock mode."""
    print("\n--- Test 4: analyze_artwork (mock) ---")

    image = _make_test_image()
    t0 = time.monotonic()
    result = provider.analyze_artwork(image=image, layer="L1")
    ms = int((time.monotonic() - t0) * 1000)

    _check("result is dict", isinstance(result, dict))
    _check("result has analysis", bool(result.get("analysis")))
    _check("result success", result.get("success") is True)
    _check("model_ref set", bool(result.get("model_ref")))
    print(f"  Analysis time: {ms}ms")
    if result.get("analysis"):
        print(f"  Preview: {result['analysis'][:100]}...")


def test_real_inference(provider, with_gpu: bool):
    """Test 5: Real 4-bit inference."""
    if not with_gpu:
        print("\n--- Test 5: Real inference [SKIP - add --with-gpu] ---")
        return

    print("\n--- Test 5: Real 4-bit inference ---")
    image = _make_test_image()

    t0 = time.monotonic()
    result = provider.analyze_artwork(image=image, layer="L1")
    ms = int((time.monotonic() - t0) * 1000)

    _check("real inference success", result.get("success") is True, result.get("error", ""))
    if result.get("analysis"):
        _check("analysis length > 50 chars", len(result["analysis"]) > 50)
        print(f"  Analysis ({len(result['analysis'])} chars): {result['analysis'][:200]}...")
    print(f"  Inference time: {ms}ms")

    # Check VRAM
    try:
        import torch
        if torch.cuda.is_available():
            vram_mb = torch.cuda.max_memory_allocated() / 1024 / 1024
            _check(f"VRAM usage: {vram_mb:.0f}MB (< 4096MB)", vram_mb < 4096)
    except ImportError:
        pass

    provider.release()


def test_model_router_integration():
    """Test 6: ModelRouter integration."""
    print("\n--- Test 6: ModelRouter integration ---")
    from app.prototype.agents.model_router import MODELS

    _check("gallery_gpt in MODELS", "gallery_gpt" in MODELS)
    if "gallery_gpt" in MODELS:
        spec = MODELS["gallery_gpt"]
        _check("gallery_gpt supports VLM", spec.supports_vlm is True)
        _check("gallery_gpt cost = $0", spec.cost_per_call_usd == 0.0)
        _check("gallery_gpt is local", "local" in spec.litellm_id)


def main() -> int:
    with_gpu = "--with-gpu" in sys.argv

    print("=" * 60)
    print("VULCA Prototype — GalleryGPT VLM Validator")
    print(f"Mode: {'GPU (--with-gpu)' if with_gpu else 'Mock/CPU'}")
    print("=" * 60)

    provider = test_instantiation()
    test_mock_analysis(provider)
    test_layer_prompts()
    test_analyze_mock(provider)

    # When --with-gpu is passed, force GPU path to bypass available check
    if with_gpu:
        provider._available = True
    test_real_inference(provider, with_gpu)
    test_model_router_integration()

    print(f"\n{'=' * 60}")
    print(f"Results: {_passed} passed, {_failed} failed")
    print(f"{'=' * 60}")
    return 0 if _failed == 0 else 1


if __name__ == "__main__":
    sys.exit(main())
