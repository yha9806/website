"""
D3 Resource Validation Script
Validates the three anchoring resource files: terminology dictionary, taboo rules, and sample index.

Usage:
    cd wenxin-backend
    ./venv/bin/python app/prototype/tools/validate_resources.py
"""

import json
import sys
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
TERMS_PATH = BASE_DIR / "data" / "terminology" / "terms.v1.json"
TABOO_PATH = BASE_DIR / "data" / "terminology" / "taboo_rules.v1.json"
INDEX_PATH = BASE_DIR / "data" / "samples" / "index.v1.json"

VALID_TRADITIONS = {
    "chinese_xieyi",
    "chinese_gongbi",
    "western_academic",
    "islamic_geometric",
    "watercolor",
    "african_traditional",
    "south_asian",
    "default",
}

VALID_CATEGORIES = {"technique", "composition", "aesthetics", "philosophy", "material"}
VALID_SEVERITIES = {"low", "medium", "high", "critical"}
VALID_L_LEVELS = {"L1", "L2", "L3", "L4", "L5"}
VALID_DIFFICULTIES = {"easy", "medium", "hard"}

# V1 first-batch traditions require more entries
V1_FIRST_BATCH = {"chinese_xieyi", "western_academic", "default"}
MIN_TERMS_FIRST_BATCH = 5
MIN_TERMS_OTHER = 3
MIN_SAMPLES_FIRST_BATCH = 4
MIN_SAMPLES_OTHER = 2


def load_json(path: Path) -> dict:
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def validate_terms(data: dict) -> list[str]:
    """Validate terminology dictionary structure and coverage."""
    errors: list[str] = []

    if "version" not in data:
        errors.append("terms: missing 'version' field")
    if "traditions" not in data:
        errors.append("terms: missing 'traditions' field")
        return errors

    traditions = data["traditions"]
    all_ids: list[str] = []

    # Check all 8 traditions are present
    for t in VALID_TRADITIONS:
        if t not in traditions:
            errors.append(f"terms: missing tradition '{t}'")

    for tradition_key, tradition_data in traditions.items():
        if tradition_key not in VALID_TRADITIONS:
            errors.append(f"terms: unknown tradition '{tradition_key}'")
            continue

        if "terms" not in tradition_data:
            errors.append(f"terms[{tradition_key}]: missing 'terms' array")
            continue

        terms = tradition_data["terms"]

        # Check minimum count
        min_required = MIN_TERMS_FIRST_BATCH if tradition_key in V1_FIRST_BATCH else MIN_TERMS_OTHER
        if len(terms) < min_required:
            errors.append(
                f"terms[{tradition_key}]: has {len(terms)} terms, "
                f"need >= {min_required}"
            )

        for i, term in enumerate(terms):
            prefix = f"terms[{tradition_key}][{i}]"

            # Required fields
            for field in ("id", "term_zh", "term_en", "category", "l_levels"):
                if field not in term:
                    errors.append(f"{prefix}: missing required field '{field}'")

            # ID uniqueness
            if "id" in term:
                if term["id"] in all_ids:
                    errors.append(f"{prefix}: duplicate id '{term['id']}'")
                all_ids.append(term["id"])

            # Category validation
            if "category" in term and term["category"] not in VALID_CATEGORIES:
                errors.append(
                    f"{prefix}: invalid category '{term['category']}', "
                    f"must be one of {VALID_CATEGORIES}"
                )

            # L-levels validation
            if "l_levels" in term:
                for level in term["l_levels"]:
                    if level not in VALID_L_LEVELS:
                        errors.append(f"{prefix}: invalid l_level '{level}'")

    return errors


def validate_taboo_rules(data: dict) -> list[str]:
    """Validate taboo rules structure and coverage."""
    errors: list[str] = []

    if "version" not in data:
        errors.append("taboo: missing 'version' field")
    if "rules" not in data:
        errors.append("taboo: missing 'rules' field")
        return errors

    rules = data["rules"]
    all_ids: list[str] = []

    # Track which traditions are covered (including wildcard)
    covered_traditions: set[str] = set()
    has_wildcard = False

    for i, rule in enumerate(rules):
        prefix = f"taboo[{i}]"

        # Required fields
        for field in ("rule_id", "description", "severity", "trigger_patterns"):
            if field not in rule:
                errors.append(f"{prefix}: missing required field '{field}'")

        # ID uniqueness
        if "rule_id" in rule:
            if rule["rule_id"] in all_ids:
                errors.append(f"{prefix}: duplicate rule_id '{rule['rule_id']}'")
            all_ids.append(rule["rule_id"])

        # Severity validation
        if "severity" in rule and rule["severity"] not in VALID_SEVERITIES:
            errors.append(
                f"{prefix}: invalid severity '{rule['severity']}', "
                f"must be one of {VALID_SEVERITIES}"
            )

        # Cultural tradition validation
        if "cultural_tradition" in rule:
            ct = rule["cultural_tradition"]
            if ct == "*":
                has_wildcard = True
            elif ct not in VALID_TRADITIONS:
                errors.append(f"{prefix}: invalid cultural_tradition '{ct}'")
            else:
                covered_traditions.add(ct)

        # Trigger patterns must be non-empty array
        if "trigger_patterns" in rule:
            if not isinstance(rule["trigger_patterns"], list) or len(rule["trigger_patterns"]) == 0:
                errors.append(f"{prefix}: trigger_patterns must be a non-empty array")

    # Coverage check: each tradition must have >= 1 rule or wildcard covers it
    for t in VALID_TRADITIONS:
        if t not in covered_traditions and not has_wildcard:
            errors.append(f"taboo: tradition '{t}' has no rules and no wildcard (*) rules exist")

    # Wildcard count check
    wildcard_count = sum(1 for r in rules if r.get("cultural_tradition") == "*")
    if wildcard_count < 2:
        errors.append(f"taboo: need >= 2 wildcard (*) rules, found {wildcard_count}")

    return errors


def validate_sample_index(data: dict) -> list[str]:
    """Validate sample index structure and coverage."""
    errors: list[str] = []

    if "version" not in data:
        errors.append("index: missing 'version' field")
    if "samples" not in data:
        errors.append("index: missing 'samples' field")
        return errors

    samples = data["samples"]
    all_ids: list[str] = []

    # Track samples per tradition
    tradition_counts: dict[str, int] = {t: 0 for t in VALID_TRADITIONS}

    for i, sample in enumerate(samples):
        prefix = f"index[{i}]"

        # Required fields
        for field in ("sample_id", "cultural_tradition", "tags", "source"):
            if field not in sample:
                errors.append(f"{prefix}: missing required field '{field}'")

        # ID uniqueness
        if "sample_id" in sample:
            if sample["sample_id"] in all_ids:
                errors.append(f"{prefix}: duplicate sample_id '{sample['sample_id']}'")
            all_ids.append(sample["sample_id"])

        # Cultural tradition validation
        if "cultural_tradition" in sample:
            ct = sample["cultural_tradition"]
            if ct not in VALID_TRADITIONS:
                errors.append(f"{prefix}: invalid cultural_tradition '{ct}'")
            else:
                tradition_counts[ct] += 1

        # Tags must be non-empty array
        if "tags" in sample:
            if not isinstance(sample["tags"], list) or len(sample["tags"]) == 0:
                errors.append(f"{prefix}: tags must be a non-empty array")

        # Difficulty validation
        if "difficulty" in sample and sample["difficulty"] not in VALID_DIFFICULTIES:
            errors.append(
                f"{prefix}: invalid difficulty '{sample['difficulty']}', "
                f"must be one of {VALID_DIFFICULTIES}"
            )

        # L-levels validation
        if "l_levels_covered" in sample:
            for level in sample["l_levels_covered"]:
                if level not in VALID_L_LEVELS:
                    errors.append(f"{prefix}: invalid l_level '{level}'")

    # Coverage check
    for t in VALID_TRADITIONS:
        min_required = MIN_SAMPLES_FIRST_BATCH if t in V1_FIRST_BATCH else MIN_SAMPLES_OTHER
        if tradition_counts[t] < min_required:
            errors.append(
                f"index: tradition '{t}' has {tradition_counts[t]} samples, "
                f"need >= {min_required}"
            )

    # Total count verification
    if "total_samples" in data:
        if data["total_samples"] != len(samples):
            errors.append(
                f"index: total_samples ({data['total_samples']}) "
                f"!= actual count ({len(samples)})"
            )

    return errors


def run_query_demo(terms_data: dict, taboo_data: dict, index_data: dict) -> None:
    """Run a simple query demonstration for each tradition."""
    print()
    print("=" * 60)
    print("Query Demonstration (1 per tradition)")
    print("=" * 60)

    for tradition in sorted(VALID_TRADITIONS):
        print(f"\n  --- {tradition} ---")

        # Terms query
        t_terms = terms_data.get("traditions", {}).get(tradition, {}).get("terms", [])
        if t_terms:
            t = t_terms[0]
            print(f"  [term]   {{source: \"terms_v1_{tradition}\", snippet: \"{t['term_en']}\", id: \"{t['id']}\"}}")
        else:
            print(f"  [term]   (no terms found)")

        # Taboo query
        matching_rules = [
            r for r in taboo_data.get("rules", [])
            if r.get("cultural_tradition") in (tradition, "*")
        ]
        if matching_rules:
            r = matching_rules[0]
            desc_snippet = r["description"][:60] + "..." if len(r["description"]) > 60 else r["description"]
            print(f"  [taboo]  {{source: \"taboo_v1\", snippet: \"{desc_snippet}\", id: \"{r['rule_id']}\"}}")
        else:
            print(f"  [taboo]  (no rules found)")

        # Sample query
        matching_samples = [
            s for s in index_data.get("samples", [])
            if s.get("cultural_tradition") == tradition
        ]
        if not matching_samples and tradition == "default":
            matching_samples = [
                s for s in index_data.get("samples", [])
                if s.get("cultural_tradition") == "default"
            ]
        if matching_samples:
            s = matching_samples[0]
            print(f"  [sample] {{source: \"{s['source']}\", snippet: \"{s['subject_en'][:60]}...\", id: \"{s['sample_id']}\"}}")
        else:
            print(f"  [sample] (no samples found)")


def main() -> int:
    print()
    print("VULCA D3 Resource Validation")
    print("=" * 60)
    print()

    all_errors: list[str] = []

    # Step 1: Load files
    print("Step 1: Loading resource files")
    print("-" * 40)
    files = {
        "terms": TERMS_PATH,
        "taboo_rules": TABOO_PATH,
        "sample_index": INDEX_PATH,
    }
    loaded: dict[str, dict] = {}
    for name, path in files.items():
        if not path.exists():
            print(f"  FAIL  {name}: file not found at {path}")
            all_errors.append(f"{name}: file not found")
            continue
        try:
            loaded[name] = load_json(path)
            print(f"  OK    {name}: loaded ({path.name})")
        except json.JSONDecodeError as e:
            print(f"  FAIL  {name}: invalid JSON — {e}")
            all_errors.append(f"{name}: invalid JSON")

    if len(loaded) != 3:
        print(f"\nCannot proceed: {3 - len(loaded)} file(s) failed to load")
        return 1

    # Step 2: Structural validation
    print()
    print("Step 2: Structural validation")
    print("-" * 40)

    terms_errors = validate_terms(loaded["terms"])
    taboo_errors = validate_taboo_rules(loaded["taboo_rules"])
    index_errors = validate_sample_index(loaded["sample_index"])

    for err in terms_errors:
        print(f"  FAIL  {err}")
    for err in taboo_errors:
        print(f"  FAIL  {err}")
    for err in index_errors:
        print(f"  FAIL  {err}")

    all_errors.extend(terms_errors)
    all_errors.extend(taboo_errors)
    all_errors.extend(index_errors)

    if not terms_errors and not taboo_errors and not index_errors:
        print("  OK    All structural checks passed")

    # Step 3: Coverage summary
    print()
    print("Step 3: Coverage summary")
    print("-" * 40)

    traditions = loaded["terms"].get("traditions", {})
    terms_count = sum(len(t.get("terms", [])) for t in traditions.values())
    rules_count = len(loaded["taboo_rules"].get("rules", []))
    samples_count = len(loaded["sample_index"].get("samples", []))

    print(f"  Terms:   {terms_count} entries across {len(traditions)} traditions")
    print(f"  Taboo:   {rules_count} rules")
    print(f"  Samples: {samples_count} entries")

    # Per-tradition breakdown
    print()
    print("  Tradition             Terms  Taboo  Samples")
    print("  " + "-" * 50)
    for t in sorted(VALID_TRADITIONS):
        t_count = len(traditions.get(t, {}).get("terms", []))
        r_count = sum(
            1 for r in loaded["taboo_rules"].get("rules", [])
            if r.get("cultural_tradition") == t
        )
        r_wildcard = sum(
            1 for r in loaded["taboo_rules"].get("rules", [])
            if r.get("cultural_tradition") == "*"
        )
        s_count = sum(
            1 for s in loaded["sample_index"].get("samples", [])
            if s.get("cultural_tradition") == t
        )
        taboo_display = f"{r_count}+{r_wildcard}*"
        print(f"  {t:<22} {t_count:>5}  {taboo_display:>5}  {s_count:>7}")

    # Step 4: Cross-reference checks
    print()
    print("Step 4: Cross-reference checks")
    print("-" * 40)

    # Check all term IDs are unique globally
    all_term_ids = []
    for t_data in traditions.values():
        for term in t_data.get("terms", []):
            all_term_ids.append(term.get("id", ""))
    all_rule_ids = [r.get("rule_id", "") for r in loaded["taboo_rules"].get("rules", [])]
    all_sample_ids = [s.get("sample_id", "") for s in loaded["sample_index"].get("samples", [])]

    all_global_ids = all_term_ids + all_rule_ids + all_sample_ids
    dupes = [x for x in all_global_ids if all_global_ids.count(x) > 1]
    if dupes:
        unique_dupes = set(dupes)
        for d in unique_dupes:
            print(f"  FAIL  Global ID collision: '{d}'")
            all_errors.append(f"Global ID collision: '{d}'")
    else:
        print(f"  OK    All {len(all_global_ids)} IDs globally unique")

    # Step 5: Query demo
    run_query_demo(loaded["terms"], loaded["taboo_rules"], loaded["sample_index"])

    # Final summary
    print()
    print("=" * 60)
    if all_errors:
        print(f"VALIDATION FAILED — {len(all_errors)} error(s):")
        for err in all_errors:
            print(f"  - {err}")
    else:
        print("ALL CHECKS PASSED — D3 Resource validation complete")
    print("=" * 60)
    print()

    return 0 if not all_errors else 1


if __name__ == "__main__":
    sys.exit(main())
