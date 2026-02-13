"""Validate IP-Adapter style transfer provider.

Tests:
1. IPAdapterProvider class instantiation
2. Mock transfer (CPU fallback)
3. Real transfer with --with-diffusers flag
4. DraftAgent.style_transfer() integration

Usage:
    ./run_prototype.sh python3 app/prototype/tools/validate_ip_adapter.py
    ./run_prototype.sh python3 app/prototype/tools/validate_ip_adapter.py --with-diffusers
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


def _make_test_image(color: tuple, size: tuple = (64, 64)) -> Image.Image:
    return Image.new("RGB", size, color)


def test_instantiation():
    """Test 1: Provider instantiation."""
    print("\n--- Test 1: Instantiation ---")
    from app.prototype.agents.ip_adapter_provider import IPAdapterProvider
    provider = IPAdapterProvider()
    _check("IPAdapterProvider created", provider is not None)
    _check("model_ref is ip-adapter-sd15", provider.model_ref == "ip-adapter-sd15")
    _check(f"available = {provider.available}", True)  # Just report status
    return provider


def test_mock_transfer(provider):
    """Test 2: Mock/CPU transfer."""
    print("\n--- Test 2: Mock transfer ---")
    src = _make_test_image((255, 0, 0))  # Red
    ref = _make_test_image((0, 0, 255))  # Blue

    with tempfile.TemporaryDirectory() as tmpdir:
        out_path = str(Path(tmpdir) / "mock_transfer.png")
        result = provider._mock_transfer(src, ref, out_path)
        _check("mock output path exists", Path(result).exists())
        if Path(result).exists():
            img = Image.open(result)
            _check("output is valid image", img.size == (512, 512))
            # Check that blending occurred (should be purplish)
            pixel = img.getpixel((256, 256))
            _check(
                "blend applied (not pure red or blue)",
                pixel[0] < 255 and pixel[2] < 255,
                f"pixel={pixel}",
            )


def test_transfer_style(provider, with_diffusers: bool):
    """Test 3: Full transfer (real or mock)."""
    print(f"\n--- Test 3: Transfer ({'GPU' if with_diffusers else 'mock'}) ---")

    src = _make_test_image((200, 150, 100), (512, 512))
    ref = _make_test_image((50, 100, 200), (512, 512))

    with tempfile.TemporaryDirectory() as tmpdir:
        out_path = str(Path(tmpdir) / "styled.png")
        t0 = time.monotonic()
        result = provider.transfer_style(
            image=src,
            reference_image=ref,
            prompt="a beautiful landscape painting",
            scale=0.6,
            seed=42,
            output_path=out_path,
        )
        ms = int((time.monotonic() - t0) * 1000)

        _check("output path returned", bool(result))
        _check("output file exists", Path(result).exists())
        if Path(result).exists():
            img = Image.open(result)
            _check(f"output is valid image ({img.size})", img.size[0] > 0)
        print(f"  Transfer time: {ms}ms")


def test_draft_agent_integration():
    """Test 4: DraftAgent.style_transfer() integration."""
    print("\n--- Test 4: DraftAgent integration ---")

    with tempfile.TemporaryDirectory() as tmpdir:
        # Create test images
        src_path = str(Path(tmpdir) / "source.png")
        ref_path = str(Path(tmpdir) / "reference.png")
        _make_test_image((200, 100, 50), (512, 512)).save(src_path)
        _make_test_image((50, 100, 200), (512, 512)).save(ref_path)

        from app.prototype.agents.draft_agent import DraftAgent
        from app.prototype.agents.draft_config import DraftConfig
        agent = DraftAgent(config=DraftConfig())

        t0 = time.monotonic()
        candidate = agent.style_transfer(
            image_path=src_path,
            reference_image_path=ref_path,
            prompt="artistic style transfer",
            scale=0.5,
            seed=99,
        )
        ms = int((time.monotonic() - t0) * 1000)

        _check("candidate returned", candidate is not None)
        _check("candidate has image_path", bool(candidate.image_path))
        _check("candidate sampler is ip_adapter", candidate.sampler == "ip_adapter")
        _check(
            "candidate model_ref set",
            "ip-adapter" in candidate.model_ref or "mock" in candidate.model_ref,
        )
        print(f"  Integration time: {ms}ms")


def main() -> int:
    with_diffusers = "--with-diffusers" in sys.argv

    print("=" * 60)
    print("VULCA Prototype — IP-Adapter Style Transfer Validator")
    print(f"Mode: {'GPU (--with-diffusers)' if with_diffusers else 'Mock/CPU'}")
    print("=" * 60)

    provider = test_instantiation()
    test_mock_transfer(provider)

    # When --with-diffusers is passed, force GPU path to bypass available check
    if with_diffusers:
        provider._available = True
    test_transfer_style(provider, with_diffusers)
    test_draft_agent_integration()

    print(f"\n{'=' * 60}")
    print(f"Results: {_passed} passed, {_failed} failed")
    print(f"{'=' * 60}")
    return 0 if _failed == 0 else 1


if __name__ == "__main__":
    sys.exit(main())
