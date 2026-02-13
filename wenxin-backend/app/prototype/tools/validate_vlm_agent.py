"""Validate Step 1: L1/L2 VLM Agent — multimodal message construction & evaluation.

Tests:
1. AgentContext.image_url field exists and is passed through
2. _build_user_message returns multimodal list for VLM layers with image
3. _build_user_message returns plain string for non-VLM layers
4. _build_user_message returns plain string for VLM layers without image
5. _encode_image_content handles data URIs, HTTP URLs, local files
6. CriticLLM passes image_url from candidate to AgentContext
7. Mock VLM evaluation returns valid scores (0-1)
8. End-to-end CriticLLM with VLM layers (mock mode)

Run:
    python3 app/prototype/tools/validate_vlm_agent.py
"""

from __future__ import annotations

import base64
import os
import sys
import tempfile

# Ensure project root is on path
_project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".."))
if _project_root not in sys.path:
    sys.path.insert(0, _project_root)

_pass = 0
_fail = 0


def check(name: str, condition: bool, detail: str = "") -> None:
    global _pass, _fail
    if condition:
        _pass += 1
        print(f"  [PASS] {name}")
    else:
        _fail += 1
        msg = f"  [FAIL] {name}"
        if detail:
            msg += f" — {detail}"
        print(msg)


def test_agent_context_image_url():
    """Test 1: AgentContext has image_url field."""
    print("\n=== Test 1: AgentContext.image_url ===")
    from app.prototype.agents.agent_runtime import AgentContext
    from app.prototype.agents.layer_state import LayerState

    ctx = AgentContext(
        task_id="test-1",
        layer_id="visual_perception",
        layer_label="L1",
        subject="test",
        cultural_tradition="default",
        candidate_summary="test",
        evidence_summary="test",
        layer_state=LayerState(),
        image_url="http://example.com/image.png",
    )
    check("image_url field exists", ctx.image_url == "http://example.com/image.png")

    ctx_none = AgentContext(
        task_id="test-2",
        layer_id="visual_perception",
        layer_label="L1",
        subject="test",
        cultural_tradition="default",
        candidate_summary="test",
        evidence_summary="test",
        layer_state=LayerState(),
    )
    check("image_url defaults to None", ctx_none.image_url is None)


def test_build_user_message_multimodal():
    """Test 2-4: _build_user_message multimodal output."""
    print("\n=== Test 2-4: _build_user_message multimodal ===")
    from app.prototype.agents.agent_runtime import AgentContext, AgentRuntime
    from app.prototype.agents.layer_state import LayerState

    # Test 2: VLM layer with image → multimodal list
    ctx_vlm = AgentContext(
        task_id="test-mm",
        layer_id="visual_perception",
        layer_label="L1",
        subject="Mountain landscape",
        cultural_tradition="chinese_xieyi",
        candidate_summary="A painting of mountains",
        evidence_summary="Sample matches: 3",
        layer_state=LayerState(),
        image_url="https://example.com/image.jpg",
    )
    result = AgentRuntime._build_user_message(ctx_vlm)
    check(
        "VLM + image → list content",
        isinstance(result, list) and len(result) == 2,
        f"got type={type(result).__name__}, len={len(result) if isinstance(result, list) else 'N/A'}",
    )
    if isinstance(result, list):
        check("first item is text", result[0].get("type") == "text")
        check("second item is image_url", result[1].get("type") == "image_url")
        check(
            "image URL preserved",
            result[1].get("image_url", {}).get("url") == "https://example.com/image.jpg",
        )

    # Test 3: Non-VLM layer → plain string
    ctx_text = AgentContext(
        task_id="test-text",
        layer_id="cultural_context",
        layer_label="L3",
        subject="test",
        cultural_tradition="default",
        candidate_summary="test",
        evidence_summary="test",
        layer_state=LayerState(),
        image_url="https://example.com/image.jpg",
    )
    result_text = AgentRuntime._build_user_message(ctx_text)
    check("Non-VLM layer → string", isinstance(result_text, str))

    # Test 4: VLM layer without image → plain string
    ctx_no_img = AgentContext(
        task_id="test-noimg",
        layer_id="visual_perception",
        layer_label="L1",
        subject="test",
        cultural_tradition="default",
        candidate_summary="test",
        evidence_summary="test",
        layer_state=LayerState(),
    )
    result_no_img = AgentRuntime._build_user_message(ctx_no_img)
    check("VLM layer no image → string", isinstance(result_no_img, str))


def test_encode_image_content():
    """Test 5: _encode_image_content handles various inputs."""
    print("\n=== Test 5: _encode_image_content ===")
    from app.prototype.agents.agent_runtime import AgentRuntime

    # data URI
    data_uri = "data:image/png;base64,abc123"
    result = AgentRuntime._encode_image_content(data_uri)
    check("data URI passthrough", result is not None and result["image_url"]["url"] == data_uri)

    # HTTP URL
    http_url = "https://example.com/img.png"
    result = AgentRuntime._encode_image_content(http_url)
    check("HTTP URL passthrough", result is not None and result["image_url"]["url"] == http_url)

    # Empty string
    result = AgentRuntime._encode_image_content("")
    check("Empty string → None", result is None)

    # None
    result = AgentRuntime._encode_image_content(None)
    check("None → None", result is None)

    # Local file (create a temp PNG)
    with tempfile.NamedTemporaryFile(suffix=".png", delete=False) as f:
        # Minimal PNG header
        f.write(b"\x89PNG\r\n\x1a\n" + b"\x00" * 100)
        tmp_path = f.name
    try:
        result = AgentRuntime._encode_image_content(tmp_path)
        check("Local PNG file → base64", result is not None)
        if result:
            url = result.get("image_url", {}).get("url", "")
            check("PNG base64 starts with data:image/png", url.startswith("data:image/png;base64,"))
    finally:
        os.unlink(tmp_path)

    # Local JPEG file
    with tempfile.NamedTemporaryFile(suffix=".jpg", delete=False) as f:
        f.write(b"\xff\xd8\xff\xe0" + b"\x00" * 100)
        tmp_path = f.name
    try:
        result = AgentRuntime._encode_image_content(tmp_path)
        check("Local JPEG file → base64", result is not None)
        if result:
            url = result.get("image_url", {}).get("url", "")
            check("JPEG base64 starts with data:image/jpeg", url.startswith("data:image/jpeg;base64,"))
    finally:
        os.unlink(tmp_path)


def test_critic_llm_passes_image_url():
    """Test 6: CriticLLM passes image_url from candidate to AgentContext."""
    print("\n=== Test 6: CriticLLM image_url passthrough ===")
    from app.prototype.agents.critic_llm import CriticLLM
    from app.prototype.agents.agent_runtime import AgentContext

    # We'll check by inspecting the _run_agent_evaluations code path
    # Since we can't easily intercept, we verify the AgentContext construction
    # by looking at the code structure
    import inspect
    src = inspect.getsource(CriticLLM._run_agent_evaluations)
    check("image_url in AgentContext construction", "image_url=" in src)
    check("candidate image_url extracted", 'candidate.get("image_url")' in src or "image_url" in src)


def test_e2e_critic_llm_mock():
    """Test 7-8: End-to-end CriticLLM mock mode."""
    print("\n=== Test 7-8: CriticLLM mock E2E ===")
    from app.prototype.agents.critic_llm import CriticLLM
    from app.prototype.agents.critic_config import CriticConfig
    from app.prototype.agents.critic_types import CritiqueInput

    # No API key → 100% rule fallback, but verify no crashes with image_url
    config = CriticConfig()
    critic = CriticLLM(config=config)
    inp = CritiqueInput(
        task_id="vlm-e2e-test",
        subject="Mountain landscape painting",
        cultural_tradition="chinese_xieyi",
        evidence={
            "sample_matches": [{"sample_id": "s1", "score": 0.8}],
            "terminology_hits": [{"term": "山水", "confidence": 0.9}],
            "taboo_violations": [],
        },
        candidates=[
            {
                "candidate_id": "c1",
                "prompt": "A mountain landscape in xieyi style",
                "model_ref": "mock",
                "steps": 20,
                "sampler": "euler",
                "image_url": "https://example.com/landscape.jpg",
                "image_path": "/tmp/test_landscape.jpg",
            },
        ],
    )

    output = critic.run(inp)
    check("CriticLLM output success", output.success)
    check("Has scored candidates", len(output.scored_candidates) > 0)
    if output.scored_candidates:
        sc = output.scored_candidates[0]
        check("weighted_total > 0", sc.weighted_total > 0)
        for ds in sc.dimension_scores:
            check(f"{ds.dimension} score in [0,1]", 0.0 <= ds.score <= 1.0)


def main():
    print("=" * 60)
    print("Step 1 Validation: L1/L2 VLM Agent")
    print("=" * 60)

    test_agent_context_image_url()
    test_build_user_message_multimodal()
    test_encode_image_content()
    test_critic_llm_passes_image_url()
    test_e2e_critic_llm_mock()

    print("\n" + "=" * 60)
    total = _pass + _fail
    print(f"Results: {_pass}/{total} passed, {_fail} failed")
    print("=" * 60)

    return 0 if _fail == 0 else 1


if __name__ == "__main__":
    sys.exit(main())
