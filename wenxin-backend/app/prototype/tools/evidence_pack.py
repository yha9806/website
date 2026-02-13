"""EvidencePack — structured evidence protocol between Scout and Draft.

Layer 1a: Scout outputs a rich EvidencePack that Draft consumes to build
precise, culturally-grounded generation prompts.
"""

from __future__ import annotations

import time
from dataclasses import dataclass, field


@dataclass
class TerminologyAnchor:
    """A terminology term with usage context for prompt construction."""

    term: str
    definition: str
    usage_hint: str  # e.g. "use for texture description"
    source: str  # e.g. "terms_v1_chinese_xieyi"
    confidence: float  # [0, 1]
    l_levels: list[str] = field(default_factory=list)  # e.g. ["L2", "L3"]

    def to_dict(self) -> dict:
        return {
            "term": self.term,
            "definition": self.definition,
            "usage_hint": self.usage_hint,
            "source": self.source,
            "confidence": round(self.confidence, 4),
            "l_levels": self.l_levels,
        }

    @classmethod
    def from_dict(cls, d: dict) -> TerminologyAnchor:
        return cls(
            term=d["term"],
            definition=d["definition"],
            usage_hint=d.get("usage_hint", ""),
            source=d.get("source", ""),
            confidence=d.get("confidence", 0.0),
            l_levels=d.get("l_levels", []),
        )


@dataclass
class CompositionReference:
    """Spatial/compositional guidance for image generation."""

    description: str
    spatial_strategy: str  # e.g. "rule_of_thirds", "centre_focus", "layered_depth"
    example_prompt_fragment: str  # ready-to-use prompt snippet

    def to_dict(self) -> dict:
        return {
            "description": self.description,
            "spatial_strategy": self.spatial_strategy,
            "example_prompt_fragment": self.example_prompt_fragment,
        }

    @classmethod
    def from_dict(cls, d: dict) -> CompositionReference:
        return cls(
            description=d["description"],
            spatial_strategy=d.get("spatial_strategy", ""),
            example_prompt_fragment=d.get("example_prompt_fragment", ""),
        )


@dataclass
class StyleConstraint:
    """A style attribute that should be enforced in generation."""

    attribute: str  # e.g. "brush_texture", "color_palette"
    value: str  # e.g. "dry brush with visible fiber strokes"
    tradition_source: str

    def to_dict(self) -> dict:
        return {
            "attribute": self.attribute,
            "value": self.value,
            "tradition_source": self.tradition_source,
        }

    @classmethod
    def from_dict(cls, d: dict) -> StyleConstraint:
        return cls(
            attribute=d["attribute"],
            value=d["value"],
            tradition_source=d.get("tradition_source", ""),
        )


@dataclass
class TabooConstraint:
    """Something that must NOT appear in the generated image."""

    description: str
    severity: str  # "low" | "medium" | "high" | "critical"
    tradition_source: str

    def to_dict(self) -> dict:
        return {
            "description": self.description,
            "severity": self.severity,
            "tradition_source": self.tradition_source,
        }

    @classmethod
    def from_dict(cls, d: dict) -> TabooConstraint:
        return cls(
            description=d["description"],
            severity=d.get("severity", "medium"),
            tradition_source=d.get("tradition_source", ""),
        )


@dataclass
class EvidencePack:
    """Structured evidence bundle passed from Scout to Draft.

    Contains everything Draft needs to build a culturally-precise prompt.
    """

    subject: str
    tradition: str
    anchors: list[TerminologyAnchor] = field(default_factory=list)
    compositions: list[CompositionReference] = field(default_factory=list)
    styles: list[StyleConstraint] = field(default_factory=list)
    taboos: list[TabooConstraint] = field(default_factory=list)
    coverage: float = 0.0  # [0, 1] evidence coverage score
    timestamp: float = 0.0

    def __post_init__(self) -> None:
        if self.timestamp == 0.0:
            self.timestamp = time.time()

    def to_prompt_context(self) -> str:
        """Build a structured prompt context string for Draft consumption."""
        sections: list[str] = []

        # Terminology anchors with usage hints
        if self.anchors:
            anchor_lines = []
            for a in self.anchors:
                line = a.term
                if a.usage_hint:
                    line += f" ({a.usage_hint})"
                if a.definition:
                    line += f": {a.definition[:80]}"
                anchor_lines.append(line)
            sections.append("Terminology: " + "; ".join(anchor_lines))

        # Composition references
        if self.compositions:
            frags = [c.example_prompt_fragment for c in self.compositions if c.example_prompt_fragment]
            if frags:
                sections.append("Composition: " + ", ".join(frags))

        # Style constraints
        if self.styles:
            style_parts = [f"{s.attribute}: {s.value}" for s in self.styles]
            sections.append("Style: " + "; ".join(style_parts))

        # Taboo constraints (for negative prompt)
        if self.taboos:
            taboo_parts = [t.description for t in self.taboos]
            sections.append("Avoid: " + ", ".join(taboo_parts))

        return "\n".join(sections)

    def get_negative_prompt_additions(self) -> list[str]:
        """Extract taboo descriptions for negative prompt."""
        return [t.description for t in self.taboos if t.description]

    def to_dict(self) -> dict:
        return {
            "subject": self.subject,
            "tradition": self.tradition,
            "anchors": [a.to_dict() for a in self.anchors],
            "compositions": [c.to_dict() for c in self.compositions],
            "styles": [s.to_dict() for s in self.styles],
            "taboos": [t.to_dict() for t in self.taboos],
            "coverage": round(self.coverage, 4),
            "timestamp": self.timestamp,
        }

    @classmethod
    def from_dict(cls, d: dict) -> EvidencePack:
        return cls(
            subject=d.get("subject", ""),
            tradition=d.get("tradition", ""),
            anchors=[TerminologyAnchor.from_dict(a) for a in d.get("anchors", [])],
            compositions=[CompositionReference.from_dict(c) for c in d.get("compositions", [])],
            styles=[StyleConstraint.from_dict(s) for s in d.get("styles", [])],
            taboos=[TabooConstraint.from_dict(t) for t in d.get("taboos", [])],
            coverage=d.get("coverage", 0.0),
            timestamp=d.get("timestamp", 0.0),
        )
