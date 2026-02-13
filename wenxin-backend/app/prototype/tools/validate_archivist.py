#!/usr/bin/env python3
"""D9 validation — Archivist Agent archive generation.

Usage::

    cd wenxin-backend
    python3 app/prototype/tools/validate_archivist.py

Exit code 0 = ALL CHECKS PASSED, 1 = failures detected.
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

_PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent.parent
if str(_PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(_PROJECT_ROOT))

from app.prototype.agents.archivist_agent import ArchivistAgent  # noqa: E402
from app.prototype.agents.archivist_types import ArchivistInput, ArchivistOutput  # noqa: E402
from app.prototype.agents.critic_config import CriticConfig  # noqa: E402
from app.prototype.agents.draft_config import DraftConfig  # noqa: E402
from app.prototype.agents.queen_config import QueenConfig  # noqa: E402
from app.prototype.checkpoints.pipeline_checkpoint import (  # noqa: E402
    load_pipeline_output,
    load_pipeline_stage,
)
from app.prototype.pipeline.pipeline_types import PipelineInput  # noqa: E402
from app.prototype.pipeline.run_pipeline import run_pipeline  # noqa: E402

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
# Case 1: Normal archival from pipeline run
# ---------------------------------------------------------------------------

def test_case_1_normal() -> None:
    print(f"\n{'='*60}")
    print("  Case 1: Normal archival (chinese_xieyi)")
    print(f"{'='*60}")

    # Run pipeline first
    task_id = "d9-archive-chinese-001"
    d_cfg = DraftConfig(provider="mock", n_candidates=4, seed_base=42)
    cr_cfg = CriticConfig()
    q_cfg = QueenConfig()

    inp = PipelineInput(
        task_id=task_id,
        subject="Dong Yuan landscape",
        cultural_tradition="chinese_xieyi",
    )
    pipe_out = run_pipeline(inp, d_cfg, cr_cfg, q_cfg)
    check("Pipeline success", pipe_out.success)

    # Collect data for archivist
    scout_ev = load_pipeline_stage(task_id, "scout") or {}
    critic_ckpt = load_pipeline_stage(task_id, "critic")
    queen_ckpt = load_pipeline_stage(task_id, "queen")

    archivist_input = ArchivistInput(
        task_id=task_id,
        subject="Dong Yuan landscape",
        cultural_tradition="chinese_xieyi",
        pipeline_output_dict=pipe_out.to_dict(),
        scout_evidence_dict=scout_ev,
        critique_dicts=[critic_ckpt] if critic_ckpt else [],
        queen_dicts=[queen_ckpt] if queen_ckpt else [],
        draft_config_dict=d_cfg.to_dict(),
        critic_config_dict=cr_cfg.to_dict(),
        queen_config_dict=q_cfg.to_dict(),
    )

    archivist = ArchivistAgent()
    arch_out = archivist.run(archivist_input)

    check("Archivist success", arch_out.success)

    # Check evidence_chain.json
    chain_path = Path(arch_out.evidence_chain_path)
    check("evidence_chain.json exists", chain_path.exists())
    if chain_path.exists():
        chain = json.loads(chain_path.read_text(encoding="utf-8"))
        check("evidence_chain has task_id", chain.get("task_id") == task_id)
        check("evidence_chain has rounds", len(chain.get("rounds", [])) >= 1)
        check("evidence_chain has final_decision", chain.get("final_decision") != "")
        check("evidence_chain has created_at", chain.get("created_at") != "")

        # Round structure
        r0 = chain["rounds"][0]
        check("round 1 has scout", "scout" in r0)
        check("round 1 has critic", "critic" in r0)
        check("round 1 has queen", "queen" in r0)
        check("round 1 scout has sample_matches", "sample_matches" in r0["scout"])

    # Check critique_card.md
    card_path = Path(arch_out.critique_card_path)
    check("critique_card.md exists", card_path.exists())
    if card_path.exists():
        card = card_path.read_text(encoding="utf-8")
        check("card has title", "# Critique Card:" in card)
        check("card has L1-L5 table", "| Dimension |" in card)
        check("card has Evidence Summary", "## Evidence Summary" in card)
        check("card has cultural tradition", "chinese_xieyi" in card)

    # Check params_snapshot.json
    params_path = Path(arch_out.params_snapshot_path)
    check("params_snapshot.json exists", params_path.exists())
    if params_path.exists():
        params = json.loads(params_path.read_text(encoding="utf-8"))
        check("params has draft_config", "draft_config" in params)
        check("params has critic_config", "critic_config" in params)
        check("params has queen_config", "queen_config" in params)
        check("params has archived_at", "archived_at" in params)

    # to_dict()
    od = arch_out.to_dict()
    expected = {"task_id", "evidence_chain_path", "critique_card_path",
                "params_snapshot_path", "success", "error"}
    check("ArchivistOutput.to_dict() has all keys", set(od.keys()) >= expected)


# ---------------------------------------------------------------------------
# Case 2: Taboo case archive
# ---------------------------------------------------------------------------

def test_case_2_taboo() -> None:
    print(f"\n{'='*60}")
    print("  Case 2: Taboo case archival")
    print(f"{'='*60}")

    task_id = "d9-archive-taboo-001"
    d_cfg = DraftConfig(provider="mock", n_candidates=2, seed_base=100)
    cr_cfg = CriticConfig()
    q_cfg = QueenConfig(max_rounds=2)

    inp = PipelineInput(
        task_id=task_id,
        subject="primitive art tribal art savage",
        cultural_tradition="western_academic",
    )
    pipe_out = run_pipeline(inp, d_cfg, cr_cfg, q_cfg)

    scout_ev = load_pipeline_stage(task_id, "scout") or {}
    critic_ckpt = load_pipeline_stage(task_id, "critic")
    queen_ckpt = load_pipeline_stage(task_id, "queen")

    archivist_input = ArchivistInput(
        task_id=task_id,
        subject="primitive art tribal art savage",
        cultural_tradition="western_academic",
        pipeline_output_dict=pipe_out.to_dict(),
        scout_evidence_dict=scout_ev,
        critique_dicts=[critic_ckpt] if critic_ckpt else [],
        queen_dicts=[queen_ckpt] if queen_ckpt else [],
        draft_config_dict=d_cfg.to_dict(),
        critic_config_dict=cr_cfg.to_dict(),
        queen_config_dict=q_cfg.to_dict(),
    )

    archivist = ArchivistAgent()
    arch_out = archivist.run(archivist_input)

    check("Taboo archivist success", arch_out.success)

    # Critique card should mention risk tags
    card_path = Path(arch_out.critique_card_path)
    if card_path.exists():
        card = card_path.read_text(encoding="utf-8")
        check("card has Risk Assessment section", "## Risk Assessment" in card)


# ---------------------------------------------------------------------------
# Case 3: Data contract validation
# ---------------------------------------------------------------------------

def test_case_3_data_contracts() -> None:
    print(f"\n{'='*60}")
    print("  Case 3: Data contract validation")
    print(f"{'='*60}")

    # ArchivistInput
    ai = ArchivistInput(
        task_id="test",
        subject="test",
        cultural_tradition="default",
        pipeline_output_dict={},
        scout_evidence_dict={},
        critique_dicts=[],
        queen_dicts=[],
    )
    ai_d = ai.to_dict()
    expected = {"task_id", "subject", "cultural_tradition", "pipeline_output",
                "scout_evidence", "critique_dicts", "queen_dicts",
                "draft_config", "critic_config", "queen_config"}
    check("ArchivistInput.to_dict() has all keys", set(ai_d.keys()) >= expected)

    # ArchivistOutput
    ao = ArchivistOutput(task_id="test")
    ao_d = ao.to_dict()
    expected_out = {"task_id", "evidence_chain_path", "critique_card_path",
                    "params_snapshot_path", "success", "error"}
    check("ArchivistOutput.to_dict() has all keys", set(ao_d.keys()) >= expected_out)

    # JSON round-trip
    check("ArchivistInput JSON round-trips", json.loads(json.dumps(ai_d)) == ai_d)
    check("ArchivistOutput JSON round-trips", json.loads(json.dumps(ao_d)) == ao_d)


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main() -> None:
    global passed, failed

    print("=" * 60)
    print("  D9 Archivist Validation")
    print("=" * 60)

    test_case_1_normal()
    test_case_2_taboo()
    test_case_3_data_contracts()

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
