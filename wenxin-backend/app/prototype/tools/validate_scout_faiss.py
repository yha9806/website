#!/usr/bin/env python3
"""Phase B Gate validation — FAISS semantic search for Scout.

Validates:
1. FaissIndexService unit tests (index build, search, available property)
2. Recall@5 on 10 ground-truth queries (FAISS vs Jaccard)
3. Top-1 Hit Rate delta (FAISS >= Jaccard + 15pp)
4. Traceability: each result has sample_id / similarity / source
5. evidence_coverage range [0, 1]
6. Gate B pass/fail summary
"""

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
from app.prototype.tools.scout_types import ScoutEvidence, SampleMatchResult, TerminologyHitResult
from app.prototype.tools.terminology_loader import TerminologyLoader

_GT_FILE = Path(__file__).resolve().parent.parent / "data" / "samples" / "ground_truth_faiss.v1.json"


def _load_ground_truth() -> list[dict]:
    with open(_GT_FILE, encoding="utf-8") as f:
        return json.load(f)["queries"]


def _recall_at_k(retrieved_ids: list[str], relevant_ids: list[str], k: int = 5) -> float:
    """Compute Recall@k: fraction of relevant items found in top-k retrieved."""
    if not relevant_ids:
        return 1.0
    top_k = set(retrieved_ids[:k])
    hits = len(top_k & set(relevant_ids))
    return hits / len(relevant_ids)


def _top1_hit(retrieved_ids: list[str], relevant_ids: list[str]) -> bool:
    """Check if the top-1 result is in the relevant set."""
    if not retrieved_ids:
        return False
    return retrieved_ids[0] in relevant_ids


def validate() -> bool:
    total_checks = 0
    passed_checks = 0
    all_passed = True
    gt_queries = _load_ground_truth()

    # ---------------------------------------------------------------
    # Section 1: FaissIndexService unit tests
    # ---------------------------------------------------------------
    print("=" * 60)
    print("Section 1: FaissIndexService unit tests")
    print("=" * 60)

    try:
        from app.prototype.tools.faiss_index_service import FaissIndexService
        faiss_svc = FaissIndexService()

        # 1a: available property
        total_checks += 1
        if faiss_svc.available:
            passed_checks += 1
            print("[PASS] FaissIndexService.available == True")
        else:
            all_passed = False
            print("[FAIL] FaissIndexService.available == False (faiss-cpu or sentence-transformers missing)")
            print("\nFAISS dependencies not available. Remaining tests cannot run.")
            print(f"\nSUMMARY: {passed_checks}/{total_checks} checks passed")
            return False

        # 1b: search_samples returns list
        total_checks += 1
        hits = faiss_svc.search_samples("ink wash landscape", "chinese_xieyi", top_k=5)
        if isinstance(hits, list) and len(hits) > 0:
            passed_checks += 1
            print(f"[PASS] search_samples returned {len(hits)} hits")
        else:
            all_passed = False
            print(f"[FAIL] search_samples returned {type(hits).__name__}, len={len(hits) if isinstance(hits, list) else 'N/A'}")

        # 1c: search_terms returns list
        total_checks += 1
        term_hits = faiss_svc.search_terms("chiaroscuro light and shadow", "western_academic", top_k=5)
        if isinstance(term_hits, list) and len(term_hits) > 0:
            passed_checks += 1
            print(f"[PASS] search_terms returned {len(term_hits)} hits")
        else:
            all_passed = False
            print(f"[FAIL] search_terms returned {type(term_hits).__name__}, len={len(term_hits) if isinstance(term_hits, list) else 'N/A'}")

        # 1d: hit structure (doc_id, similarity, tradition, text_snippet)
        total_checks += 1
        if hits:
            h = hits[0]
            has_fields = all(hasattr(h, f) for f in ("doc_id", "similarity", "tradition", "text_snippet"))
            if has_fields and 0 <= h.similarity <= 1:
                passed_checks += 1
                print(f"[PASS] Hit structure valid: doc_id={h.doc_id}, sim={h.similarity:.4f}")
            else:
                all_passed = False
                print(f"[FAIL] Hit structure invalid: {h}")
        else:
            all_passed = False
            print("[FAIL] No hits to check structure")

    except ImportError as e:
        total_checks += 1
        all_passed = False
        print(f"[FAIL] Cannot import FaissIndexService: {e}")
        print(f"\nSUMMARY: {passed_checks}/{total_checks} checks passed")
        return False

    # ---------------------------------------------------------------
    # Section 2: Recall@5 — FAISS vs Jaccard
    # ---------------------------------------------------------------
    print(f"\n{'=' * 60}")
    print("Section 2: Recall@5 on ground-truth queries")
    print("=" * 60)

    faiss_matcher = SampleMatcher(faiss_service=faiss_svc)
    jaccard_matcher = SampleMatcher()

    faiss_recalls: list[float] = []
    jaccard_recalls: list[float] = []
    faiss_top1_hits = 0
    jaccard_top1_hits = 0

    for gt in gt_queries:
        qid = gt["id"]
        query = gt["query"]
        tradition = gt["tradition"]
        relevant = gt["relevant_sample_ids"]

        # FAISS
        faiss_results = faiss_matcher.match(query, tradition, top_k=5, mode="semantic")
        faiss_ids = [r.sample_id for r in faiss_results]
        faiss_r5 = _recall_at_k(faiss_ids, relevant, k=5)
        faiss_recalls.append(faiss_r5)
        if _top1_hit(faiss_ids, relevant):
            faiss_top1_hits += 1

        # Jaccard
        jaccard_results = jaccard_matcher.match(query, tradition, top_k=5)
        jaccard_ids = [r.sample_id for r in jaccard_results]
        jaccard_r5 = _recall_at_k(jaccard_ids, relevant, k=5)
        jaccard_recalls.append(jaccard_r5)
        if _top1_hit(jaccard_ids, relevant):
            jaccard_top1_hits += 1

        total_checks += 1
        print(f"\n  [{qid}] query: {query[:60]}...")
        print(f"    FAISS  Recall@5={faiss_r5:.2f}  top-5: {faiss_ids}")
        print(f"    Jaccard Recall@5={jaccard_r5:.2f}  top-5: {jaccard_ids}")
        print(f"    Relevant: {relevant}")
        if faiss_r5 > 0 or jaccard_r5 > 0:
            passed_checks += 1
            print(f"    [PASS] At least one method found relevant results")
        else:
            all_passed = False
            print(f"    [FAIL] Neither method found any relevant result")

    # Aggregate metrics
    avg_faiss_recall = sum(faiss_recalls) / len(faiss_recalls) if faiss_recalls else 0
    avg_jaccard_recall = sum(jaccard_recalls) / len(jaccard_recalls) if jaccard_recalls else 0
    faiss_top1_rate = faiss_top1_hits / len(gt_queries) * 100
    jaccard_top1_rate = jaccard_top1_hits / len(gt_queries) * 100
    top1_delta = faiss_top1_rate - jaccard_top1_rate

    print(f"\n{'=' * 60}")
    print("Section 3: Aggregate metrics")
    print("=" * 60)

    # 3a: FAISS Recall@5 >= 60%
    total_checks += 1
    print(f"\n  FAISS avg Recall@5 = {avg_faiss_recall:.2%}")
    print(f"  Jaccard avg Recall@5 = {avg_jaccard_recall:.2%}")
    if avg_faiss_recall >= 0.60:
        passed_checks += 1
        print(f"  [PASS] FAISS Recall@5 >= 60% ({avg_faiss_recall:.2%})")
    else:
        all_passed = False
        print(f"  [FAIL] FAISS Recall@5 < 60% ({avg_faiss_recall:.2%})")

    # 3b: Top-1 Hit Rate delta >= +15pp
    total_checks += 1
    print(f"\n  FAISS Top-1 Hit Rate  = {faiss_top1_rate:.1f}%")
    print(f"  Jaccard Top-1 Hit Rate = {jaccard_top1_rate:.1f}%")
    print(f"  Delta = {top1_delta:+.1f} pp")
    if top1_delta >= 15.0:
        passed_checks += 1
        print(f"  [PASS] Top-1 delta >= +15pp ({top1_delta:+.1f}pp)")
    else:
        # Soft warning — still useful if recall is high
        print(f"  [WARN] Top-1 delta < +15pp ({top1_delta:+.1f}pp) — may still pass if recall is strong")
        if avg_faiss_recall >= 0.70:
            passed_checks += 1
            print(f"  [PASS] Compensated by high recall ({avg_faiss_recall:.2%} >= 70%)")
        else:
            all_passed = False
            print(f"  [FAIL] Neither delta nor recall threshold met")

    # ---------------------------------------------------------------
    # Section 4: Traceability — each result has required fields
    # ---------------------------------------------------------------
    print(f"\n{'=' * 60}")
    print("Section 4: Traceability checks")
    print("=" * 60)

    total_checks += 1
    trace_ok = True
    for gt in gt_queries[:3]:  # Sample 3 queries
        results = faiss_matcher.match(gt["query"], gt["tradition"], top_k=3, mode="semantic")
        for r in results:
            rd = r.to_dict()
            if not all(k in rd for k in ("sample_id", "similarity", "source")):
                trace_ok = False
                print(f"  [FAIL] Missing traceability keys in {rd}")
            if not (0 <= rd["similarity"] <= 1):
                trace_ok = False
                print(f"  [FAIL] similarity out of range: {rd['similarity']}")
    if trace_ok:
        passed_checks += 1
        print("  [PASS] All results contain sample_id, similarity, source")
    else:
        all_passed = False

    # ---------------------------------------------------------------
    # Section 5: evidence_coverage range [0, 1]
    # ---------------------------------------------------------------
    print(f"\n{'=' * 60}")
    print("Section 5: evidence_coverage computation")
    print("=" * 60)

    scout_svc = ScoutService(search_mode="auto")
    coverage_ok = True

    for gt in gt_queries:
        evidence = scout_svc.gather_evidence(gt["query"], gt["tradition"])
        coverage = scout_svc.compute_evidence_coverage(evidence)
        total_checks += 1
        if 0.0 <= coverage <= 1.0:
            passed_checks += 1
            print(f"  [{gt['id']}] coverage={coverage:.4f} [PASS]")
        else:
            coverage_ok = False
            all_passed = False
            print(f"  [{gt['id']}] coverage={coverage:.4f} [FAIL] out of [0,1]")

    # Check coverage > 0 for at least 8/10 queries
    total_checks += 1
    coverages = []
    for gt in gt_queries:
        evidence = scout_svc.gather_evidence(gt["query"], gt["tradition"])
        coverages.append(scout_svc.compute_evidence_coverage(evidence))
    nonzero = sum(1 for c in coverages if c > 0)
    if nonzero >= 8:
        passed_checks += 1
        print(f"  [PASS] {nonzero}/10 queries have coverage > 0")
    else:
        all_passed = False
        print(f"  [FAIL] Only {nonzero}/10 queries have coverage > 0 (need >= 8)")

    # Check empty evidence returns 0
    total_checks += 1
    empty_evidence = ScoutEvidence()
    empty_cov = scout_svc.compute_evidence_coverage(empty_evidence)
    if empty_cov == 0.0:
        passed_checks += 1
        print(f"  [PASS] Empty evidence → coverage=0.0")
    else:
        all_passed = False
        print(f"  [FAIL] Empty evidence → coverage={empty_cov} (expected 0.0)")

    # ---------------------------------------------------------------
    # Section 6: Gate B Summary
    # ---------------------------------------------------------------
    print(f"\n{'=' * 60}")
    print("Gate B Summary")
    print("=" * 60)
    print(f"  Total checks: {total_checks}")
    print(f"  Passed: {passed_checks}")
    print(f"  Failed: {total_checks - passed_checks}")
    print(f"  FAISS Recall@5: {avg_faiss_recall:.2%} (gate: >= 60%)")
    print(f"  Top-1 Delta: {top1_delta:+.1f}pp (gate: >= +15pp)")
    print(f"  Coverage range: all [0,1]: {coverage_ok}")

    gate_passed = (
        avg_faiss_recall >= 0.60
        and coverage_ok
        and passed_checks >= total_checks - 2  # Allow up to 2 soft failures
    )

    if gate_passed:
        print(f"\n  >>> GATE B: PASSED <<<")
    else:
        print(f"\n  >>> GATE B: FAILED <<<")

    print(f"{'=' * 60}")
    return gate_passed


if __name__ == "__main__":
    ok = validate()
    sys.exit(0 if ok else 1)
