"""Validate ControlNet canny/depth conditional inpainting.

Tests:
1. ControlNetInpaintProvider instantiation (canny + depth)
2. Layer → ControlNet type mapping
3. Canny edge detection (CPU)
4. Depth map generation (CPU)
5. Mock inpainting
6. Real inpainting with --with-diffusers flag
7. Orchestrator integration (ControlNet type selection)

Usage:
    ./run_prototype.sh python3 app/prototype/tools/validate_controlnet.py
    ./run_prototype.sh python3 app/prototype/tools/validate_controlnet.py --with-diffusers
"""

from __future__ import annotations

import sys
import tempfile
import time
from pathlib import Path

import numpy as np
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


def _make_test_image(size: tuple = (512, 512)) -> Image.Image:
    """Create a test image with some structure for edge/depth detection."""
    arr = np.zeros((size[1], size[0], 3), dtype=np.uint8)
    # Draw horizontal gradient
    for y in range(size[1]):
        arr[y, :, 0] = int(255 * y / size[1])
    # Draw vertical gradient
    for x in range(size[0]):
        arr[:, x, 1] = int(255 * x / size[0])
    # Draw a rectangle in the center
    h, w = size[1], size[0]
    arr[h // 4 : 3 * h // 4, w // 4 : 3 * w // 4, 2] = 200
    return Image.fromarray(arr)


def _make_mask(size: tuple = (512, 512)) -> Image.Image:
    """Create a center mask (white = repaint)."""
    mask = Image.new("L", size, 0)
    pixels = mask.load()
    h, w = size
    for y in range(h // 4, 3 * h // 4):
        for x in range(w // 4, 3 * w // 4):
            pixels[x, y] = 255
    return mask


def test_instantiation():
    """Test 1: Provider instantiation."""
    print("\n--- Test 1: Instantiation ---")
    from app.prototype.agents.controlnet_provider import ControlNetInpaintProvider

    canny = ControlNetInpaintProvider(controlnet_type="canny")
    _check("canny provider created", canny is not None)
    _check("canny model_ref", canny.model_ref == "controlnet-canny-sd15")

    depth = ControlNetInpaintProvider(controlnet_type="depth")
    _check("depth provider created", depth is not None)
    _check("depth model_ref", depth.model_ref == "controlnet-depth-sd15")

    try:
        bad = ControlNetInpaintProvider(controlnet_type="invalid")
        _check("invalid type raises ValueError", False)
    except ValueError:
        _check("invalid type raises ValueError", True)


def test_layer_mapping():
    """Test 2: L1-L5 → ControlNet type mapping."""
    print("\n--- Test 2: Layer mapping ---")
    from app.prototype.agents.controlnet_provider import get_controlnet_type_for_layer, LAYER_CONTROLNET_MAP

    _check("L1 → canny", get_controlnet_type_for_layer("visual_perception") == "canny")
    _check("L2 → depth", get_controlnet_type_for_layer("technical_analysis") == "depth")
    _check("L3 → depth", get_controlnet_type_for_layer("cultural_context") == "depth")
    _check("L4 → canny", get_controlnet_type_for_layer("critical_interpretation") == "canny")
    _check("L5 → None", get_controlnet_type_for_layer("philosophical_aesthetic") is None)
    _check("all 5 layers mapped", len(LAYER_CONTROLNET_MAP) == 5)


def test_canny_detection():
    """Test 3: Canny edge detection (CPU)."""
    print("\n--- Test 3: Canny edge detection ---")
    from app.prototype.agents.controlnet_provider import ControlNetInpaintProvider

    provider = ControlNetInpaintProvider(controlnet_type="canny")
    image = _make_test_image()

    canny_img = provider._generate_canny(image)
    _check("canny output is Image", isinstance(canny_img, Image.Image))
    _check("canny output is RGB", canny_img.mode == "RGB")
    _check("canny output size matches", canny_img.size == image.size)

    # Edges should have some non-zero pixels
    arr = np.array(canny_img)
    _check("canny has edge pixels", arr.max() > 0, f"max={arr.max()}")


def test_depth_estimation():
    """Test 4: Depth map generation (CPU)."""
    print("\n--- Test 4: Depth estimation ---")
    from app.prototype.agents.controlnet_provider import ControlNetInpaintProvider

    provider = ControlNetInpaintProvider(controlnet_type="depth")
    image = _make_test_image()

    depth_img = provider._generate_depth_simple(image)
    _check("depth output is Image", isinstance(depth_img, Image.Image))
    _check("depth output is RGB", depth_img.mode == "RGB")
    _check("depth output size matches", depth_img.size == image.size)

    arr = np.array(depth_img)
    _check("depth has variation", arr.std() > 1.0, f"std={arr.std():.2f}")


def test_mock_inpaint():
    """Test 5: Mock inpainting (CPU)."""
    print("\n--- Test 5: Mock inpainting ---")
    from app.prototype.agents.controlnet_provider import ControlNetInpaintProvider

    provider = ControlNetInpaintProvider(controlnet_type="canny")
    image = _make_test_image()
    mask = _make_mask()

    with tempfile.TemporaryDirectory() as tmpdir:
        out_path = str(Path(tmpdir) / "mock_cn.png")
        result = provider._mock_inpaint(image, mask, out_path)
        _check("mock output exists", Path(result).exists())
        if Path(result).exists():
            out = Image.open(result)
            _check("mock output is valid image", out.size == (512, 512))


def test_real_inpaint(with_diffusers: bool):
    """Test 6: Real inpainting (GPU)."""
    if not with_diffusers:
        print("\n--- Test 6: Real inpainting [SKIP - add --with-diffusers] ---")
        return

    print("\n--- Test 6: Real inpainting (GPU) ---")
    from app.prototype.agents.controlnet_provider import ControlNetInpaintProvider

    for cn_type in ("canny", "depth"):
        provider = ControlNetInpaintProvider(controlnet_type=cn_type)
        if not provider.available:
            print(f"  [SKIP] {cn_type}: GPU not available")
            continue

        image = _make_test_image()
        mask = _make_mask()

        with tempfile.TemporaryDirectory() as tmpdir:
            out_path = str(Path(tmpdir) / f"real_{cn_type}.png")
            t0 = time.monotonic()
            result = provider.inpaint_with_control(
                image=image,
                mask=mask,
                prompt="beautiful landscape painting",
                seed=42,
                output_path=out_path,
            )
            ms = int((time.monotonic() - t0) * 1000)
            _check(f"{cn_type} output exists", Path(result).exists())
            print(f"  {cn_type} inference: {ms}ms")
            provider.release()


def test_inpaint_provider_adapter():
    """Test 7: InpaintProvider adapter integration."""
    print("\n--- Test 7: InpaintProvider adapter ---")
    from app.prototype.agents.inpaint_provider import get_inpaint_provider

    canny_adapter = get_inpaint_provider("controlnet_canny")
    _check("controlnet_canny adapter created", canny_adapter is not None)
    _check(
        "canny adapter model_ref",
        "controlnet" in canny_adapter.model_ref,
        canny_adapter.model_ref,
    )

    depth_adapter = get_inpaint_provider("controlnet_depth")
    _check("controlnet_depth adapter created", depth_adapter is not None)


def main() -> int:
    with_diffusers = "--with-diffusers" in sys.argv

    print("=" * 60)
    print("VULCA Prototype — ControlNet Inpainting Validator")
    print(f"Mode: {'GPU (--with-diffusers)' if with_diffusers else 'Mock/CPU'}")
    print("=" * 60)

    test_instantiation()
    test_layer_mapping()
    test_canny_detection()
    test_depth_estimation()
    test_mock_inpaint()
    test_real_inpaint(with_diffusers)
    test_inpaint_provider_adapter()

    print(f"\n{'=' * 60}")
    print(f"Results: {_passed} passed, {_failed} failed")
    print(f"{'=' * 60}")
    return 0 if _failed == 0 else 1


if __name__ == "__main__":
    sys.exit(main())
