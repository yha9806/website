"""
D2 Schema Validation Script
Validates the Cultural Intent Card JSON Schema and example data files.

Usage:
    cd wenxin-backend
    ./venv/bin/python app/prototype/validate_schema.py
"""

import json
import sys
from datetime import datetime
from pathlib import Path
from uuid import UUID

from jsonschema import Draft202012Validator


BASE_DIR = Path(__file__).resolve().parent
SCHEMA_PATH = BASE_DIR / "data" / "intent_card.schema.json"
SAMPLES_DIR = BASE_DIR / "data" / "samples"

# Expected results: True = should pass, False = should fail
EXAMPLES = [
    ("example_full_generation.json", True),
    ("example_partial_rerun.json", True),
    ("example_invalid.json", False),
    ("example_invalid_format.json", False),
]


def _is_valid_uuid(value: str) -> bool:
    try:
        UUID(value)
        return True
    except (ValueError, TypeError):
        return False


def _is_valid_datetime(value: str) -> bool:
    try:
        # Accept trailing Z and timezone offsets.
        parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
        # RFC 3339 date-time requires timezone information.
        return parsed.tzinfo is not None
    except (ValueError, TypeError, AttributeError):
        return False


def _resolve_local_ref(root_schema: dict, ref: str) -> dict | None:
    if not ref.startswith("#/"):
        return None

    node: object = root_schema
    for part in ref[2:].split("/"):
        if not isinstance(node, dict) or part not in node:
            return None
        node = node[part]
    return node if isinstance(node, dict) else None


def collect_format_checks(schema: dict) -> list[tuple[tuple[str, ...], str]]:
    """
    Collect all string `format` checks from schema paths, including `$ref`,
    so new format fields are automatically covered by strict validation.
    """
    checks: list[tuple[tuple[str, ...], str]] = []
    seen: set[tuple[tuple[str, ...], str]] = set()

    def walk(node: dict, path: tuple[str, ...]) -> None:
        ref = node.get("$ref")
        if isinstance(ref, str):
            resolved = _resolve_local_ref(schema, ref)
            if resolved is not None:
                walk(resolved, path)

        fmt = node.get("format")
        if node.get("type") == "string" and isinstance(fmt, str):
            entry = (path, fmt)
            if entry not in seen:
                seen.add(entry)
                checks.append(entry)

        for combinator in ("allOf", "anyOf", "oneOf"):
            subschemas = node.get(combinator)
            if isinstance(subschemas, list):
                for sub in subschemas:
                    if isinstance(sub, dict):
                        walk(sub, path)

        properties = node.get("properties")
        if isinstance(properties, dict):
            for key, sub in properties.items():
                if isinstance(sub, dict):
                    walk(sub, path + (key,))

        items = node.get("items")
        if isinstance(items, dict):
            walk(items, path + ("*",))

    walk(schema, ())
    return checks


def _iter_values_at_path(data: dict, path: tuple[str, ...]) -> list[object]:
    values: list[object] = [data]
    for segment in path:
        next_values: list[object] = []
        for value in values:
            if segment == "*":
                if isinstance(value, list):
                    next_values.extend(value)
                continue
            if isinstance(value, dict) and segment in value:
                next_values.append(value[segment])
        values = next_values
        if not values:
            break
    return values


def collect_strict_format_issues(
    data: dict,
    format_checks: list[tuple[tuple[str, ...], str]],
    schema_format_error_paths: set[tuple[str, ...]],
) -> list[tuple[str, str]]:
    """Fallback format checks for runtime environments with partial support."""
    validators = {
        "uuid": _is_valid_uuid,
        "date-time": _is_valid_datetime,
    }
    issues: list[tuple[str, str]] = []
    seen_issues: set[tuple[str, str]] = set()

    def add_issue(path: tuple[str, ...], message: str) -> None:
        display = " → ".join(path) if path else "(root)"
        entry = (display, message)
        if entry not in seen_issues:
            seen_issues.add(entry)
            issues.append(entry)

    for path, fmt in format_checks:
        if path in schema_format_error_paths:
            # Already reported by jsonschema format checker for this path.
            continue

        validator = validators.get(fmt)
        if validator is None:
            continue

        values = _iter_values_at_path(data, path)
        for value in values:
            if value is None:
                continue
            if not isinstance(value, str):
                add_issue(path, f"must be a string for format '{fmt}'")
                continue
            if not validator(value):
                if fmt == "uuid":
                    add_issue(path, "must be a valid UUID")
                elif fmt == "date-time":
                    add_issue(path, "must be a valid ISO 8601 date-time")
                else:
                    add_issue(path, f"must match format '{fmt}'")

    return issues


def load_json(path: Path) -> dict:
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def validate_schema_itself(schema: dict) -> bool:
    """Check that the schema document is a valid JSON Schema Draft 2020-12."""
    print("=" * 60)
    print("Step 1: Validate schema document itself")
    print("=" * 60)
    try:
        Draft202012Validator.check_schema(schema)
        print("  PASS  Schema is a valid JSON Schema Draft 2020-12")
        return True
    except Exception as e:
        print(f"  FAIL  Schema document is invalid: {e}")
        return False


def validate_example(
    validator: Draft202012Validator,
    format_checks: list[tuple[tuple[str, ...], str]],
    name: str,
    data: dict,
    should_pass: bool,
) -> bool:
    """Validate a single example and check against expected result."""
    errors = list(validator.iter_errors(data))
    schema_format_error_paths = {
        tuple(str(part) for part in err.absolute_path)
        for err in errors
        if err.validator == "format"
    }
    strict_format_issues = collect_strict_format_issues(
        data,
        format_checks,
        schema_format_error_paths,
    )
    total_issues = len(errors) + len(strict_format_issues)

    if should_pass:
        if total_issues == 0:
            print(f"  PASS  {name} — valid (as expected)")
            return True
        else:
            print(f"  FAIL  {name} — expected valid but got {total_issues} error(s):")
            for err in errors:
                path = " → ".join(str(p) for p in err.absolute_path) or "(root)"
                print(f"         [{path}] {err.message}")
            for path, message in strict_format_issues:
                print(f"         [{path}] {message}")
            return False
    else:
        if total_issues > 0:
            print(f"  PASS  {name} — invalid (as expected), {total_issues} error(s):")
            for err in errors:
                path = " → ".join(str(p) for p in err.absolute_path) or "(root)"
                print(f"         [{path}] {err.message}")
            for path, message in strict_format_issues:
                print(f"         [{path}] {message}")
            return True
        else:
            print(f"  FAIL  {name} — expected invalid but it passed validation")
            return False


def main() -> int:
    print()
    print("Cultural Intent Card — Schema Validation (D2)")
    print("=" * 60)
    print()

    # Load schema
    if not SCHEMA_PATH.exists():
        print(f"ERROR: Schema file not found: {SCHEMA_PATH}")
        return 1

    schema = load_json(SCHEMA_PATH)

    # Step 1: Validate schema itself
    if not validate_schema_itself(schema):
        return 1

    # Build validator
    validator = Draft202012Validator(
        schema,
        format_checker=Draft202012Validator.FORMAT_CHECKER,
    )
    format_checks = collect_format_checks(schema)

    # Step 2: Validate each example
    print()
    print("=" * 60)
    print("Step 2: Validate example data files")
    print("=" * 60)

    all_ok = True
    for filename, should_pass in EXAMPLES:
        path = SAMPLES_DIR / filename
        if not path.exists():
            print(f"  FAIL  {filename} — file not found")
            all_ok = False
            continue

        data = load_json(path)
        ok = validate_example(validator, format_checks, filename, data, should_pass)
        if not ok:
            all_ok = False
        print()

    # Summary
    print("=" * 60)
    if all_ok:
        print("ALL CHECKS PASSED — D2 Schema validation complete")
    else:
        print("SOME CHECKS FAILED — see details above")
    print("=" * 60)
    print()

    return 0 if all_ok else 1


if __name__ == "__main__":
    sys.exit(main())
