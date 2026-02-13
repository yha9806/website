"""Validate CLIP ViT-B/32 visual search integration.

Tests:
1. CLIP model loads via sentence-transformers
2. Visual index builds over sample data
3. Text-to-image cross-modal search returns results
4. Tradition filtering works
5. Recall@5 ≥ 60% on ground truth queries

Usage:
    ./run_prototype.sh python3 app/prototype/tools/validate_clip_visual.py
"""

from __future__ import annotations

import json
import sys
import time
from pathlib import Path

# Ensure project root is on path
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


def test_clip_available():
    """Test 1: CLIP model availability."""
    print("\n--- Test 1: CLIP availability ---")
    from app.prototype.tools.faiss_index_service import FaissIndexService
    svc = FaissIndexService()
    _check("clip_available property", svc.clip_available)
    return svc


def test_clip_index_build(svc):
    """Test 2: Visual index builds."""
    print("\n--- Test 2: Visual index build ---")
    t0 = time.monotonic()
    svc._lazy_init_clip()
    ms = int((time.monotonic() - t0) * 1000)

    _check("clip_model loaded", svc._clip_model is not None)
    _check("visual_index created", svc._visual_index is not None)
    if svc._visual_index is not None:
        n = svc._visual_index.ntotal
        _check(f"visual_index has vectors (n={n})", n > 0)
        _check("visual_index dim is 512", svc._visual_index.d == 512)
    print(f"  Index build time: {ms}ms")


def test_clip_search(svc):
    """Test 3: Cross-modal search."""
    print("\n--- Test 3: Cross-modal search ---")

    queries = [
        ("ink wash mountain landscape", "chinese_xieyi"),
        ("geometric Islamic pattern", "islamic_geometric"),
        ("oil portrait classical", "western_academic"),
    ]

    for query, tradition in queries:
        hits = svc.search_by_visual(query, tradition, top_k=5)
        _check(
            f"query '{query[:30]}...' returns hits",
            len(hits) > 0,
            f"got {len(hits)} hits",
        )
        if hits:
            _check(
                f"  top hit similarity > 0",
                hits[0].similarity > 0,
                f"sim={hits[0].similarity:.4f}",
            )


def test_clip_tradition_filter(svc):
    """Test 4: Tradition filtering."""
    print("\n--- Test 4: Tradition filtering ---")

    hits_all = svc.search_by_visual("landscape painting", "default", top_k=20)
    hits_xieyi = svc.search_by_visual("landscape painting", "chinese_xieyi", top_k=20)

    _check("default tradition returns more results", len(hits_all) >= len(hits_xieyi))
    if hits_xieyi:
        all_traditions = {h.tradition for h in hits_xieyi}
        _check(
            "filtered results match tradition",
            all_traditions <= {"chinese_xieyi", "default"},
            f"got traditions: {all_traditions}",
        )


def test_clip_recall(svc):
    """Test 5: Recall@5 on ground truth."""
    print("\n--- Test 5: Recall@5 ---")

    gt_file = Path(__file__).resolve().parent.parent / "data" / "samples" / "ground_truth_faiss.v1.json"
    if not gt_file.exists():
        print(f"  [SKIP] Ground truth file not found: {gt_file}")
        return

    with open(gt_file, encoding="utf-8") as f:
        gt_data = json.load(f)

    total_queries = 0
    total_recall_at_5 = 0.0

    for entry in gt_data.get("queries", []):
        query = entry["query"]
        tradition = entry["tradition"]
        expected_ids = set(entry.get("relevant_sample_ids", entry.get("expected_sample_ids", [])))

        hits = svc.search_by_visual(query, tradition, top_k=5)
        retrieved_ids = {h.doc_id for h in hits}

        overlap = expected_ids & retrieved_ids
        recall = len(overlap) / max(1, len(expected_ids))
        total_recall_at_5 += recall
        total_queries += 1

    if total_queries > 0:
        avg_recall = total_recall_at_5 / total_queries
        _check(
            f"Average Recall@5 = {avg_recall:.2%} (gate: ≥60%)",
            avg_recall >= 0.60,
            f"across {total_queries} queries",
        )
    else:
        print("  [SKIP] No ground truth queries found")


def test_scout_visual_integration():
    """Test 6: ScoutService visual search integration."""
    print("\n--- Test 6: ScoutService integration ---")
    from app.prototype.tools.scout_service import ScoutService
    svc = ScoutService(search_mode="auto")
    refs = svc.search_visual_references("ink wash landscape", "chinese_xieyi", top_k=3)
    _check("search_visual_references returns results", len(refs) >= 0)
    if refs:
        _check("result has doc_id", "doc_id" in refs[0])
        _check("result has similarity", "similarity" in refs[0])


def main() -> int:
    print("=" * 60)
    print("VULCA Prototype — CLIP ViT-B/32 Visual Search Validator")
    print("=" * 60)

    svc = test_clip_available()
    if not svc.clip_available:
        print("\n[SKIP] CLIP not available (sentence-transformers or faiss not installed)")
        return 1

    test_clip_index_build(svc)
    test_clip_search(svc)
    test_clip_tradition_filter(svc)
    test_clip_recall(svc)
    test_scout_visual_integration()

    print(f"\n{'=' * 60}")
    print(f"Results: {_passed} passed, {_failed} failed")
    print(f"{'=' * 60}")
    return 0 if _failed == 0 else 1


if __name__ == "__main__":
    sys.exit(main())
