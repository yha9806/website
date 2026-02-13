#!/usr/bin/env python3
"""D4 Scout validation — 3 test cases covering 3 cultural traditions."""

from __future__ import annotations

import json
import sys
from pathlib import Path

# Ensure project root is on sys.path
_PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent.parent
if str(_PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(_PROJECT_ROOT))

from app.prototype.tools.sample_matcher import SampleMatcher
from app.prototype.tools.scout_service import ScoutService
from app.prototype.tools.scout_types import (
    SampleMatchResult,
    ScoutEvidence,
    TabooViolationResult,
    TerminologyHitResult,
)

# ---------------------------------------------------------------------------
# Schema field expectations (from intent_card.schema.json $defs)
# ---------------------------------------------------------------------------
SAMPLE_MATCH_KEYS = {"sample_id", "similarity", "source"}
TERMINOLOGY_HIT_KEYS = {"term", "matched", "confidence", "dictionary_ref"}
TABOO_VIOLATION_KEYS = {"rule_id", "description", "severity"}
EVIDENCE_KEYS = {"sample_matches", "terminology_hits", "taboo_violations"}
VALID_SEVERITIES = {"low", "medium", "high", "critical"}

# ---------------------------------------------------------------------------
# Test cases
# ---------------------------------------------------------------------------
TEST_CASES = [
    {
        "id": 1,
        "subject": "Dong Yuan landscape with hemp-fiber texture strokes and atmospheric ink wash",
        "tradition": "chinese_xieyi",
        "expect_sample_min": 1,
        "expect_terms": ["hemp-fiber texture stroke"],
        "expect_taboo_min": 0,
    },
    {
        "id": 2,
        "subject": "Caravaggio's chiaroscuro technique reflects primitive art and tribal art influences",
        "tradition": "western_academic",
        "expect_sample_min": 1,
        "expect_terms": ["chiaroscuro"],
        "expect_taboo_min": 1,
    },
    {
        "id": 3,
        "subject": "Analysis of composition and color theory in cross-cultural context",
        "tradition": "default",
        "expect_sample_min": 1,
        "expect_terms": ["composition", "color theory"],
        "expect_taboo_min": 0,
    },
]


def _check_dict_keys(d: dict, expected: set[str], label: str) -> list[str]:
    """Return list of error messages if keys don't match exactly."""
    errors = []
    extra = set(d.keys()) - expected
    missing = expected - set(d.keys())
    if extra:
        errors.append(f"  {label}: unexpected keys {extra}")
    if missing:
        errors.append(f"  {label}: missing keys {missing}")
    return errors


def validate() -> bool:
    service = ScoutService()
    sample_matcher = SampleMatcher()
    all_passed = True
    total_checks = 0
    passed_checks = 0

    # --- Pre-checks: SampleMatcher top_k guards ---
    total_checks += 1
    if sample_matcher.match("simple query", "default", top_k=0) == []:
        passed_checks += 1
        print("[PASS] SampleMatcher top_k=0 returns []")
    else:
        all_passed = False
        print("[FAIL] SampleMatcher top_k=0 should return []")

    total_checks += 1
    if sample_matcher.match("simple query", "default", top_k=-1) == []:
        passed_checks += 1
        print("[PASS] SampleMatcher top_k<0 returns []")
    else:
        all_passed = False
        print("[FAIL] SampleMatcher top_k<0 should return []")

    total_checks += 1
    try:
        sample_matcher.match("simple query", "default", top_k=1.5)  # type: ignore[arg-type]
        all_passed = False
        print("[FAIL] SampleMatcher non-int top_k should raise TypeError")
    except TypeError:
        passed_checks += 1
        print("[PASS] SampleMatcher non-int top_k raises TypeError")

    for tc in TEST_CASES:
        tc_id = tc["id"]
        print(f"\n{'='*60}")
        print(f"Test Case #{tc_id}: tradition={tc['tradition']}")
        print(f"  Subject: {tc['subject'][:80]}...")
        print(f"{'='*60}")

        evidence = service.gather_evidence(
            subject=tc["subject"],
            cultural_tradition=tc["tradition"],
        )
        ed = evidence.to_dict()
        errors: list[str] = []

        # --- Check 1: Evidence top-level keys ---
        total_checks += 1
        errs = _check_dict_keys(ed, EVIDENCE_KEYS, "Evidence")
        if errs:
            errors.extend(errs)
        else:
            passed_checks += 1
            print("  [PASS] Evidence top-level keys match schema")

        # --- Check 2: sample_matches structure + non-empty ---
        total_checks += 1
        sm = ed.get("sample_matches", [])
        if len(sm) < tc["expect_sample_min"]:
            errors.append(f"  sample_matches: expected >= {tc['expect_sample_min']}, got {len(sm)}")
        else:
            passed_checks += 1
            print(f"  [PASS] sample_matches count: {len(sm)} >= {tc['expect_sample_min']}")

        for i, m in enumerate(sm):
            total_checks += 1
            errs = _check_dict_keys(m, SAMPLE_MATCH_KEYS, f"sample_matches[{i}]")
            if errs:
                errors.extend(errs)
                continue

            # Value range checks
            if not (0 <= m["similarity"] <= 1):
                errors.append(f"  sample_matches[{i}].similarity={m['similarity']} out of [0,1]")
            else:
                passed_checks += 1
                print(f"  [PASS] sample_matches[{i}]: id={m['sample_id']}, sim={m['similarity']:.4f}")

        # --- Check 3: terminology_hits structure ---
        total_checks += 1
        th = ed.get("terminology_hits", [])
        expected_terms_lower = [t.lower() for t in tc.get("expect_terms", [])]
        found_terms_lower = [h["term"].lower() for h in th]
        missing_terms = [t for t in expected_terms_lower if t not in found_terms_lower]
        if missing_terms:
            errors.append(f"  terminology_hits: missing expected terms {missing_terms}")
            errors.append(f"    found terms: {found_terms_lower}")
        else:
            passed_checks += 1
            print(f"  [PASS] terminology_hits contains expected terms: {tc['expect_terms']}")

        for i, h in enumerate(th):
            total_checks += 1
            errs = _check_dict_keys(h, TERMINOLOGY_HIT_KEYS, f"terminology_hits[{i}]")
            if errs:
                errors.extend(errs)
                continue

            if not (0 <= h["confidence"] <= 1):
                errors.append(f"  terminology_hits[{i}].confidence={h['confidence']} out of [0,1]")
            else:
                passed_checks += 1
                print(f"  [PASS] terminology_hits[{i}]: term={h['term']}, conf={h['confidence']}")

        # --- Check 4: taboo_violations ---
        total_checks += 1
        tv = ed.get("taboo_violations", [])
        if len(tv) < tc["expect_taboo_min"]:
            errors.append(f"  taboo_violations: expected >= {tc['expect_taboo_min']}, got {len(tv)}")
        else:
            passed_checks += 1
            print(f"  [PASS] taboo_violations count: {len(tv)} >= {tc['expect_taboo_min']}")

        for i, v in enumerate(tv):
            total_checks += 1
            errs = _check_dict_keys(v, TABOO_VIOLATION_KEYS, f"taboo_violations[{i}]")
            if errs:
                errors.extend(errs)
                continue

            if v["severity"] not in VALID_SEVERITIES:
                errors.append(f"  taboo_violations[{i}].severity={v['severity']} invalid")
            else:
                passed_checks += 1
                print(f"  [PASS] taboo_violations[{i}]: rule={v['rule_id']}, sev={v['severity']}")

        # --- Check 5 (case 2 only): must trigger taboo ---
        if tc_id == 2:
            total_checks += 1
            taboo_ids = [v["rule_id"] for v in tv]
            if not any("taboo" in rid for rid in taboo_ids):
                errors.append("  Case 2: expected taboo violation with 'primitive'/'tribal', got none")
            else:
                passed_checks += 1
                print(f"  [PASS] Case 2 taboo trigger confirmed: {taboo_ids}")

            # Regression check: "orientalism" should not trigger "oriental".
            total_checks += 1
            safe_subject = "Critical study of orientalism in 20th-century art history"
            safe_evidence = service.gather_evidence(
                subject=safe_subject,
                cultural_tradition=tc["tradition"],
            ).to_dict()
            safe_taboo_ids = [v["rule_id"] for v in safe_evidence.get("taboo_violations", [])]
            if "taboo-universal-002" in safe_taboo_ids:
                errors.append(
                    "  Case 2 regression: 'orientalism' falsely triggered taboo-universal-002"
                )
            else:
                passed_checks += 1
                print("  [PASS] Case 2 regression: no false-positive taboo on 'orientalism'")

        # Report errors for this case
        if errors:
            all_passed = False
            print(f"\n  [FAIL] Test Case #{tc_id} errors:")
            for e in errors:
                print(e)

        # Show full JSON for inspection
        print(f"\n  Full evidence JSON:")
        print(json.dumps(ed, indent=2, ensure_ascii=False)[:2000])

    # --- Summary ---
    print(f"\n{'='*60}")
    print(f"SUMMARY: {passed_checks}/{total_checks} checks passed")
    if all_passed:
        print("ALL CHECKS PASSED")
    else:
        print("SOME CHECKS FAILED")
    print(f"{'='*60}")

    return all_passed


if __name__ == "__main__":
    ok = validate()
    sys.exit(0 if ok else 1)
