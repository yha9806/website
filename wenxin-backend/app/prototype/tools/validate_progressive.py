"""Validate Step 2: Progressive Deepening L1→L5 serial evaluation.

Tests:
1. LayerState.analysis_text field exists
2. LayerState.get_accumulated_context() works correctly
3. read_layer_analysis tool returns analysis_text when available
4. CriticLLM(progressive=True) uses _escalate_serial path
5. _escalate_serial builds accumulated context correctly
6. E2E mock: progressive mode produces valid scores
7. Prior layer analysis flows to downstream layers

Run:
    python3 app/prototype/tools/validate_progressive.py
"""

from __future__ import annotations

import os
import sys

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


def test_layer_state_analysis_text():
    """Test 1: LayerState has analysis_text field."""
    print("\n=== Test 1: LayerState.analysis_text ===")
    from app.prototype.agents.layer_state import LayerState

    ls = LayerState()
    check("analysis_text defaults to empty", ls.analysis_text == "")

    ls.analysis_text = "Test analysis of L1 visual composition"
    check("analysis_text can be set", ls.analysis_text == "Test analysis of L1 visual composition")

    d = ls.to_dict()
    check("analysis_text in to_dict", "analysis_text" in d)
    check("analysis_text truncated to 500", len(d.get("analysis_text", "")) <= 500)


def test_get_accumulated_context():
    """Test 2: LayerState.get_accumulated_context()."""
    print("\n=== Test 2: get_accumulated_context ===")
    from app.prototype.agents.layer_state import LayerState, init_layer_states

    states = init_layer_states()
    # Set L1 and L2 analysis
    states["visual_perception"].score = 0.7
    states["visual_perception"].confidence = 0.8
    states["visual_perception"].analysis_text = "Strong composition with balanced forms."
    states["technical_analysis"].score = 0.6
    states["technical_analysis"].confidence = 0.7
    states["technical_analysis"].analysis_text = "Brushwork shows confident technique."

    # L3 asks for context up to L3 → should get L1 + L2
    ctx = states["cultural_context"].get_accumulated_context(
        all_states=states, up_to="cultural_context",
    )
    check("L3 context includes L1", "L1 Analysis" in ctx)
    check("L3 context includes L2", "L2 Analysis" in ctx)
    check("L3 context has L1 text", "Strong composition" in ctx)
    check("L3 context has L2 text", "Brushwork" in ctx)

    # L2 asks for context → should only get L1
    ctx_l2 = states["technical_analysis"].get_accumulated_context(
        all_states=states, up_to="technical_analysis",
    )
    check("L2 context includes L1", "L1 Analysis" in ctx_l2)
    check("L2 context excludes L2", "L2 Analysis" not in ctx_l2)

    # L1 asks for context → should be empty
    ctx_l1 = states["visual_perception"].get_accumulated_context(
        all_states=states, up_to="visual_perception",
    )
    check("L1 context is empty", ctx_l1 == "")

    # L5 asks for context → should get L1+L2 (L3/L4 have no text)
    ctx_l5 = states["philosophical_aesthetic"].get_accumulated_context(
        all_states=states, up_to="philosophical_aesthetic",
    )
    check("L5 context includes L1", "L1 Analysis" in ctx_l5)
    check("L5 context includes L2", "L2 Analysis" in ctx_l5)

    # No all_states → empty
    ctx_none = states["cultural_context"].get_accumulated_context()
    check("No all_states → empty", ctx_none == "")


def test_read_layer_analysis_tool():
    """Test 3: read_layer_analysis returns analysis_text."""
    print("\n=== Test 3: read_layer_analysis tool ===")
    from app.prototype.agents.layer_state import LayerState, init_layer_states
    from app.prototype.agents.tool_registry import build_critic_tool_registry

    states = init_layer_states()
    states["visual_perception"].score = 0.7
    states["visual_perception"].confidence = 0.8
    states["visual_perception"].analysis_text = "Good visual composition"

    registry = build_critic_tool_registry(layer_states=states)

    import asyncio

    # L1 has analysis
    result = asyncio.run(registry.execute("read_layer_analysis", {"layer": "L1"}))
    check("L1 status is completed", result.get("status") == "completed")
    check("L1 has analysis_text", "analysis_text" in result)
    check("L1 analysis_text correct", result.get("analysis_text") == "Good visual composition")
    check("L1 has score", result.get("score") == 0.7)

    # L3 has no analysis
    result_l3 = asyncio.run(registry.execute("read_layer_analysis", {"layer": "L3"}))
    check("L3 status is not_yet_evaluated", result_l3.get("status") == "not_yet_evaluated")
    check("L3 has hint", "hint" in result_l3)


def test_critic_llm_progressive_flag():
    """Test 4: CriticLLM(progressive=True) uses serial path."""
    print("\n=== Test 4: progressive flag ===")
    from app.prototype.agents.critic_llm import CriticLLM

    critic = CriticLLM(progressive=True)
    check("progressive flag stored", critic._progressive is True)

    critic_default = CriticLLM()
    check("default progressive=False", critic_default._progressive is False)

    import inspect
    src = inspect.getsource(CriticLLM.run)
    check("run() branches on progressive", "_escalate_serial" in src)


def test_escalate_serial_method_exists():
    """Test 5: _escalate_serial method exists and has correct structure."""
    print("\n=== Test 5: _escalate_serial structure ===")
    from app.prototype.agents.critic_llm import CriticLLM
    import inspect

    check("_escalate_serial method exists", hasattr(CriticLLM, "_escalate_serial"))

    src = inspect.getsource(CriticLLM._escalate_serial)
    check("serial uses dim order", "_DIM_ORDER" in src or "visual_perception" in src)
    check("serial uses get_accumulated_context", "get_accumulated_context" in src)
    check("serial stores analysis_text", "analysis_text" in src)
    check("serial uses AgentContext", "AgentContext" in src)
    check("serial merges scores", "merged_score" in src)


def test_e2e_progressive_mock():
    """Test 6-7: E2E progressive mode (mock, no API key)."""
    print("\n=== Test 6-7: E2E progressive mock ===")
    from app.prototype.agents.critic_llm import CriticLLM
    from app.prototype.agents.critic_config import CriticConfig
    from app.prototype.agents.critic_types import CritiqueInput

    config = CriticConfig()
    critic = CriticLLM(config=config, progressive=True)
    inp = CritiqueInput(
        task_id="progressive-e2e",
        subject="Mountain landscape painting",
        cultural_tradition="chinese_xieyi",
        evidence={
            "sample_matches": [{"sample_id": "s1", "score": 0.8}],
            "terminology_hits": [{"term": "写意", "confidence": 0.9}],
            "taboo_violations": [],
        },
        candidates=[
            {
                "candidate_id": "c1",
                "prompt": "Mountain landscape in xieyi style",
                "model_ref": "mock",
                "steps": 20,
                "sampler": "euler",
                "image_url": "https://example.com/img.jpg",
            },
        ],
    )

    output = critic.run(inp)
    check("progressive output success", output.success)
    check("has scored candidates", len(output.scored_candidates) > 0)
    if output.scored_candidates:
        sc = output.scored_candidates[0]
        check("weighted_total > 0", sc.weighted_total > 0)
        for ds in sc.dimension_scores:
            check(f"progressive {ds.dimension} score in [0,1]", 0.0 <= ds.score <= 1.0)

    # Without API key, both modes should produce same results (100% rule fallback)
    critic_parallel = CriticLLM(config=config, progressive=False)
    output_parallel = critic_parallel.run(inp)
    if output.scored_candidates and output_parallel.scored_candidates:
        s1 = output.scored_candidates[0].weighted_total
        s2 = output_parallel.scored_candidates[0].weighted_total
        check("progressive == parallel in mock (no API)", abs(s1 - s2) < 0.01, f"{s1:.4f} vs {s2:.4f}")


def main():
    print("=" * 60)
    print("Step 2 Validation: Progressive Deepening L1→L5")
    print("=" * 60)

    test_layer_state_analysis_text()
    test_get_accumulated_context()
    test_read_layer_analysis_tool()
    test_critic_llm_progressive_flag()
    test_escalate_serial_method_exists()
    test_e2e_progressive_mock()

    print("\n" + "=" * 60)
    total = _pass + _fail
    print(f"Results: {_pass}/{total} passed, {_fail} failed")
    print("=" * 60)

    return 0 if _fail == 0 else 1


if __name__ == "__main__":
    sys.exit(main())
