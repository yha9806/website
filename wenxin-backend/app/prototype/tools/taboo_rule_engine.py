"""TabooRuleEngine — cultural taboo trigger-pattern detection (zero-cost, no LLM)."""

from __future__ import annotations

import json
import re
from pathlib import Path

from app.prototype.tools.scout_types import TabooViolationResult

_DATA_DIR = Path(__file__).resolve().parent.parent / "data" / "terminology"
_TABOO_FILE = _DATA_DIR / "taboo_rules.v1.json"
_CJK_PATTERN = re.compile(r"[\u4e00-\u9fff\u3400-\u4dbf]")


class TabooRuleEngine:
    """Check text against cultural taboo rules via trigger-pattern substring matching."""

    def __init__(self) -> None:
        with open(_TABOO_FILE, encoding="utf-8") as f:
            data = json.load(f)
        self._rules: list[dict] = data.get("rules", [])

    @staticmethod
    def _pattern_matches(text_lower: str, pattern: str) -> bool:
        pattern_lower = pattern.strip().lower()
        if not pattern_lower:
            return False

        # For CJK patterns, keep direct substring matching.
        if _CJK_PATTERN.search(pattern_lower):
            return pattern_lower in text_lower

        # For Latin-script phrases, require token boundaries to reduce false positives
        # (e.g. "oriental" should not match "orientalism").
        escaped = re.escape(pattern_lower).replace(r"\ ", r"(?:[\s\-_]+)")
        boundary_pattern = rf"(?<![a-z0-9]){escaped}(?![a-z0-9])"
        return re.search(boundary_pattern, text_lower) is not None

    def check(
        self,
        text: str,
        cultural_tradition: str,
    ) -> list[TabooViolationResult]:
        text_lower = text.lower()
        results: list[TabooViolationResult] = []

        for rule in self._rules:
            rule_tradition = rule.get("cultural_tradition", "")
            # Rule applies if: wildcard (*), matches requested tradition, or is "default"
            if rule_tradition not in ("*", cultural_tradition, "default"):
                continue

            # Check trigger patterns
            trigger_patterns = rule.get("trigger_patterns", [])
            for pattern in trigger_patterns:
                if self._pattern_matches(text_lower, pattern):
                    results.append(TabooViolationResult(
                        rule_id=rule["rule_id"],
                        description=rule.get("description", ""),
                        severity=rule.get("severity", "medium"),
                    ))
                    break  # One trigger per rule is enough

        return results
