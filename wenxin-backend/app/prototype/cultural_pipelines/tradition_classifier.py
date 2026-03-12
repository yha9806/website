"""Tradition classifier — heuristic-based cultural tradition detection.

Provides a fast (<50ms) tradition classification from free-text subject descriptions.
Uses a two-tier approach:
  1. Fast keyword matching (exact term lookup, instant)
  2. Rich heuristic scoring with weighted cultural indicators covering:
     - Botanical/nature references
     - Art technique terms
     - Geographic/cultural references
     - Philosophical concepts
     - Material and medium terms
     - Temporal/period references

Public API:
    classify_tradition(subject: str) -> TraditionClassification
"""

from __future__ import annotations

import logging
import re
from dataclasses import dataclass, field

logger = logging.getLogger(__name__)


@dataclass
class TraditionClassification:
    """Result of tradition classification."""

    tradition: str
    confidence: float
    method: str  # "keyword" | "heuristic" | "default"
    runner_up: str | None = None
    runner_up_confidence: float = 0.0


# ---------------------------------------------------------------------------
# Tier 1: Fast keyword matching (same logic as frontend TRADITION_KEYWORDS)
# ---------------------------------------------------------------------------

_KEYWORD_MAP: list[tuple[list[str], str]] = [
    (["japanese", "zen", "ukiyo", "wabi", "sabi"], "japanese_wabi_sabi"),
    (["persian", "islamic", "miniature", "arabesque"], "persian_miniature"),
    (["african", "mask", "ubuntu"], "african_ubuntu"),
    (["indian", "mughal", "rajput"], "indian_miniature"),
    (["korean", "hangul", "joseon"], "korean_minhwa"),
    (["western", "oil", "renaissance", "baroque"], "western_classical"),
    (["aboriginal", "dreamtime"], "aboriginal_dreamtime"),
    (["chinese", "ink", "\u6c34\u58a8", "\u5de5\u7b14", "xieyi"], "chinese_xieyi"),
]


def _keyword_match(text: str) -> str | None:
    """Tier 1: fast exact keyword match. Returns tradition or None."""
    lower = text.lower()
    for keywords, tradition in _KEYWORD_MAP:
        if any(kw in lower for kw in keywords):
            return tradition
    return None


# ---------------------------------------------------------------------------
# Tier 2: Rich heuristic scoring
# ---------------------------------------------------------------------------

# Each indicator: (pattern, tradition, weight)
# Patterns are compiled regexes for word-boundary matching where useful.
# Weight range: 0.1 (weak signal) to 0.5 (strong signal)

@dataclass
class _Indicator:
    """A cultural indicator with regex pattern, target tradition, and weight."""
    pattern: re.Pattern[str]
    tradition: str
    weight: float


def _build_indicators() -> list[_Indicator]:
    """Build the full indicator database. Called once at module load."""
    raw: list[tuple[str, str, float]] = [
        # ── Japanese (japanese_wabi_sabi) ──
        # Botanical
        (r"\bcherry\s*blossom", "japanese_wabi_sabi", 0.45),
        (r"\bsakura\b", "japanese_wabi_sabi", 0.50),
        (r"\bbamboo\b", "japanese_wabi_sabi", 0.15),  # shared with Chinese
        (r"\bplum\s*blossom", "japanese_wabi_sabi", 0.15),  # shared with Chinese
        (r"\bmoss\b", "japanese_wabi_sabi", 0.10),
        (r"\bmaple\b", "japanese_wabi_sabi", 0.15),
        (r"\bpine\b", "japanese_wabi_sabi", 0.10),
        # Technique
        (r"\bsumi[-\s]?e\b", "japanese_wabi_sabi", 0.50),
        (r"\bukiyo[-\s]?e\b", "japanese_wabi_sabi", 0.50),
        (r"\bkintsugi\b", "japanese_wabi_sabi", 0.50),
        (r"\bshodo\b", "japanese_wabi_sabi", 0.45),
        (r"\byamato[-\s]?e\b", "japanese_wabi_sabi", 0.50),
        (r"\bnihonga\b", "japanese_wabi_sabi", 0.50),
        (r"\brakuware\b", "japanese_wabi_sabi", 0.40),
        # Philosophy
        (r"\bwabi[-\s]?sabi\b", "japanese_wabi_sabi", 0.50),
        (r"\bmono\s*no\s*aware\b", "japanese_wabi_sabi", 0.50),
        (r"\bma\b", "japanese_wabi_sabi", 0.10),  # too short, weak
        (r"\bshibui\b", "japanese_wabi_sabi", 0.40),
        (r"\bkanso\b", "japanese_wabi_sabi", 0.40),
        (r"\bfukinsei\b", "japanese_wabi_sabi", 0.45),
        (r"\bimperman", "japanese_wabi_sabi", 0.15),  # impermanence
        # Geography
        (r"\bkyoto\b", "japanese_wabi_sabi", 0.40),
        (r"\btokyo\b", "japanese_wabi_sabi", 0.25),
        (r"\bjapan(?:ese)?\b", "japanese_wabi_sabi", 0.35),
        (r"\bshinto\b", "japanese_wabi_sabi", 0.35),
        (r"\btorii\b", "japanese_wabi_sabi", 0.40),
        (r"\bgeisha\b", "japanese_wabi_sabi", 0.30),
        (r"\bsamurai\b", "japanese_wabi_sabi", 0.25),
        (r"\bkimono\b", "japanese_wabi_sabi", 0.30),
        # Nature/Season
        (r"\bspring\s*rain\b", "japanese_wabi_sabi", 0.20),
        (r"\bautumn\s*lea(?:f|ves)\b", "japanese_wabi_sabi", 0.15),
        (r"\bfalling\s*petal", "japanese_wabi_sabi", 0.25),
        (r"\bfog\b", "japanese_wabi_sabi", 0.05),
        (r"\btranquil", "japanese_wabi_sabi", 0.08),
        (r"\bserene\b", "japanese_wabi_sabi", 0.08),

        # ── Chinese (chinese_xieyi) ──
        # Botanical
        (r"\blotus\b", "chinese_xieyi", 0.30),
        (r"\bchrysanthemum\b", "chinese_xieyi", 0.35),
        (r"\borchid\b", "chinese_xieyi", 0.25),
        (r"\bprunus\b", "chinese_xieyi", 0.30),
        (r"\bpeony\b", "chinese_xieyi", 0.30),
        (r"\bplum\b", "chinese_xieyi", 0.15),
        (r"\bbamboo\b", "chinese_xieyi", 0.20),
        # Technique
        (r"\bgongbi\b", "chinese_xieyi", 0.50),
        (r"\bxieyi\b", "chinese_xieyi", 0.50),
        (r"\bshan\s*shui\b", "chinese_xieyi", 0.50),
        (r"\bink\s*wash\b", "chinese_xieyi", 0.45),
        (r"\bcalligraph", "chinese_xieyi", 0.30),  # calligraphy/calligraphic
        (r"\bbrush\s*stroke", "chinese_xieyi", 0.25),
        (r"\bhemp[-\s]?fiber\b", "chinese_xieyi", 0.50),
        (r"\btexture\s*stroke", "chinese_xieyi", 0.35),
        (r"\bcun\b", "chinese_xieyi", 0.40),  # Chinese painting strokes
        (r"\bpomo\b", "chinese_xieyi", 0.45),  # splash ink
        (r"\bsplash\s*ink\b", "chinese_xieyi", 0.45),
        (r"\bbone\s*method\b", "chinese_xieyi", 0.40),
        (r"\bsix\s*principles\b", "chinese_xieyi", 0.40),
        (r"\bscroll\s*painting\b", "chinese_xieyi", 0.35),
        # Chinese text
        (r"\u6c34\u58a8", "chinese_xieyi", 0.50),  # 水墨
        (r"\u5de5\u7b14", "chinese_xieyi", 0.50),  # 工笔
        (r"\u5199\u610f", "chinese_xieyi", 0.50),  # 写意
        (r"\u5c71\u6c34", "chinese_xieyi", 0.50),  # 山水
        (r"\u82b1\u9e1f", "chinese_xieyi", 0.45),  # 花鸟
        # Philosophy
        (r"\bqi\b", "chinese_xieyi", 0.25),
        (r"\bdao\b", "chinese_xieyi", 0.30),
        (r"\btao\b", "chinese_xieyi", 0.30),
        (r"\byin\s*yang\b", "chinese_xieyi", 0.35),
        (r"\bqi\s*yun\b", "chinese_xieyi", 0.45),  # 气韵
        (r"\bwu\s*wei\b", "chinese_xieyi", 0.40),  # 无为
        (r"\bspirit\s*resonance\b", "chinese_xieyi", 0.40),
        (r"\bempty\s*space\b", "chinese_xieyi", 0.20),
        (r"\bvoid\b", "chinese_xieyi", 0.10),
        # Geography/Culture
        (r"\bchinese\b", "chinese_xieyi", 0.35),
        (r"\bchina\b", "chinese_xieyi", 0.30),
        (r"\btang\s*dynasty\b", "chinese_xieyi", 0.45),
        (r"\bsong\s*dynasty\b", "chinese_xieyi", 0.45),
        (r"\bming\s*dynasty\b", "chinese_xieyi", 0.40),
        (r"\bdong\s*yuan\b", "chinese_xieyi", 0.50),  # Famous painter
        (r"\bni\s*zan\b", "chinese_xieyi", 0.50),
        (r"\bwang\s*wei\b", "chinese_xieyi", 0.45),
        (r"\bqi\s*baishi\b", "chinese_xieyi", 0.50),
        (r"\bzhang\s*daqian\b", "chinese_xieyi", 0.50),
        (r"\bhuangshan\b", "chinese_xieyi", 0.35),
        (r"\bguilin\b", "chinese_xieyi", 0.30),
        (r"\bsuzhou\b", "chinese_xieyi", 0.30),
        (r"\bdragon\b", "chinese_xieyi", 0.15),
        (r"\bphoenix\b", "chinese_xieyi", 0.12),
        (r"\bmist\b", "chinese_xieyi", 0.08),
        (r"\bmountain", "chinese_xieyi", 0.08),

        # ── Persian (persian_miniature) ──
        # Botanical
        (r"\btulip\b", "persian_miniature", 0.30),
        (r"\brose\s*garden\b", "persian_miniature", 0.25),
        (r"\biris\b", "persian_miniature", 0.15),
        (r"\bcypress\b", "persian_miniature", 0.25),
        # Technique
        (r"\bminiat(?:ure|urist)\b", "persian_miniature", 0.20),
        (r"\barabesque\b", "persian_miniature", 0.45),
        (r"\bislimi\b", "persian_miniature", 0.50),
        (r"\btezhip\b", "persian_miniature", 0.50),
        (r"\bnegargari\b", "persian_miniature", 0.50),
        (r"\bkhatam\b", "persian_miniature", 0.45),
        (r"\btile\s*work\b", "persian_miniature", 0.30),
        (r"\btilework\b", "persian_miniature", 0.30),
        (r"\bgeometric\s+(?:pattern|design|tile|motif|arabesque)", "persian_miniature", 0.40),
        (r"\binterlacing\b", "persian_miniature", 0.20),
        (r"\btessellation\b", "persian_miniature", 0.25),
        (r"\bmuqarnas\b", "persian_miniature", 0.45),
        (r"\bcalligraph", "persian_miniature", 0.15),
        (r"\bnastaliq\b", "persian_miniature", 0.50),
        (r"\bgolden\s*ratio\b", "persian_miniature", 0.10),
        # Philosophy
        (r"\bsufi\b", "persian_miniature", 0.40),
        (r"\brumi\b", "persian_miniature", 0.40),
        (r"\bparadise\s*garden\b", "persian_miniature", 0.40),
        # Geography/Culture
        (r"\bpersi(?:a|an)\b", "persian_miniature", 0.45),
        (r"\biran(?:ian)?\b", "persian_miniature", 0.40),
        (r"\bislam(?:ic)?\b", "persian_miniature", 0.35),
        (r"\bsafavid\b", "persian_miniature", 0.50),
        (r"\bqajar\b", "persian_miniature", 0.45),
        (r"\btimurid\b", "persian_miniature", 0.45),
        (r"\botto?man\b", "persian_miniature", 0.30),
        (r"\bisfahan\b", "persian_miniature", 0.40),
        (r"\bshiraz\b", "persian_miniature", 0.35),
        (r"\bmosque\b", "persian_miniature", 0.25),
        (r"\bminaret\b", "persian_miniature", 0.30),
        (r"\bshah(?:nameh)?\b", "persian_miniature", 0.40),

        # ── African (african_ubuntu) ──
        # Culture/Philosophy
        (r"\bubuntu\b", "african_ubuntu", 0.50),
        (r"\bcommunal\b", "african_ubuntu", 0.20),
        (r"\bancestor", "african_ubuntu", 0.20),
        (r"\btribal\b", "african_ubuntu", 0.30),
        (r"\brite\b", "african_ubuntu", 0.15),
        (r"\britual\b", "african_ubuntu", 0.15),
        # Technique/Art form
        (r"\bmask\b", "african_ubuntu", 0.25),
        (r"\bkente\b", "african_ubuntu", 0.50),
        (r"\bbatik\b", "african_ubuntu", 0.25),
        (r"\bndebele\b", "african_ubuntu", 0.50),
        (r"\badinkra\b", "african_ubuntu", 0.50),
        (r"\bwood\s*carving\b", "african_ubuntu", 0.25),
        (r"\bsculptur", "african_ubuntu", 0.10),
        (r"\bbeadwork\b", "african_ubuntu", 0.30),
        (r"\btextile\b", "african_ubuntu", 0.10),
        # Geography
        (r"\bafrican?\b", "african_ubuntu", 0.35),
        (r"\bsahara\b", "african_ubuntu", 0.35),
        (r"\bsavann?a\b", "african_ubuntu", 0.25),
        (r"\bserengeti\b", "african_ubuntu", 0.30),
        (r"\byoruba\b", "african_ubuntu", 0.45),
        (r"\bmaasai\b", "african_ubuntu", 0.45),
        (r"\bzulu\b", "african_ubuntu", 0.40),
        (r"\bashanti\b", "african_ubuntu", 0.40),
        (r"\bbenin\b", "african_ubuntu", 0.35),
        (r"\bnigeria\b", "african_ubuntu", 0.30),
        (r"\bghana\b", "african_ubuntu", 0.30),
        (r"\bkenya\b", "african_ubuntu", 0.25),
        (r"\bethiopi", "african_ubuntu", 0.25),
        (r"\btimbuktu\b", "african_ubuntu", 0.35),

        # ── Indian (indian_miniature) ──
        # Botanical
        (r"\blotus\b", "indian_miniature", 0.20),  # also Chinese, lower weight
        (r"\bjasmine\b", "indian_miniature", 0.25),
        (r"\bmarigold\b", "indian_miniature", 0.25),
        (r"\bbanyan\b", "indian_miniature", 0.30),
        # Technique
        (r"\brangoli\b", "indian_miniature", 0.50),
        (r"\bmandala\b", "indian_miniature", 0.30),
        (r"\bmehndi\b", "indian_miniature", 0.45),
        (r"\bkolam\b", "indian_miniature", 0.45),
        (r"\bpattachitra\b", "indian_miniature", 0.50),
        (r"\bwarli\b", "indian_miniature", 0.50),
        (r"\btanjore\b", "indian_miniature", 0.45),
        (r"\bmadhubani\b", "indian_miniature", 0.50),
        (r"\bpichwai\b", "indian_miniature", 0.50),
        # Philosophy
        (r"\bkarma\b", "indian_miniature", 0.25),
        (r"\bdharma\b", "indian_miniature", 0.30),
        (r"\brasa\b", "indian_miniature", 0.35),
        (r"\bbhakti\b", "indian_miniature", 0.40),
        (r"\brahimsa\b", "indian_miniature", 0.35),
        # Geography/Culture
        (r"\bindia(?:n)?\b", "indian_miniature", 0.35),
        (r"\bmughal\b", "indian_miniature", 0.50),
        (r"\brajput\b", "indian_miniature", 0.50),
        (r"\brajasthan", "indian_miniature", 0.40),
        (r"\bhindu\b", "indian_miniature", 0.30),
        (r"\bvedic\b", "indian_miniature", 0.35),
        (r"\bganesh", "indian_miniature", 0.35),
        (r"\bkrishna\b", "indian_miniature", 0.35),
        (r"\btaj\s*mahal\b", "indian_miniature", 0.40),

        # ── Western (western_classical) ──
        # Technique
        (r"\boil\s*paint", "western_classical", 0.35),
        (r"\bimpasto\b", "western_classical", 0.45),
        (r"\bchiaroscuro\b", "western_classical", 0.50),
        (r"\bsfumato\b", "western_classical", 0.50),
        (r"\btrompe\s*l.oeil\b", "western_classical", 0.45),
        (r"\bfresco\b", "western_classical", 0.40),
        (r"\bglaz(?:e|ing)\b", "western_classical", 0.20),
        (r"\bencaustic\b", "western_classical", 0.30),
        (r"\bgouache\b", "western_classical", 0.20),
        (r"\bwatercolor\b", "western_classical", 0.20),
        (r"\bcanvas\b", "western_classical", 0.15),
        (r"\bacrylic\b", "western_classical", 0.20),
        (r"\bperspective\b", "western_classical", 0.15),
        (r"\babstract\b", "western_classical", 0.20),
        (r"\bstill\s*life\b", "western_classical", 0.25),
        (r"\bportrait\b", "western_classical", 0.15),
        (r"\blandscape\b", "western_classical", 0.10),
        (r"\ben\s*plein\s*air\b", "western_classical", 0.40),
        # Period/Movement
        (r"\brenaissance\b", "western_classical", 0.45),
        (r"\bbaroque\b", "western_classical", 0.45),
        (r"\brococco?\b", "western_classical", 0.40),
        (r"\bimpressioni", "western_classical", 0.40),
        (r"\bexpressioni", "western_classical", 0.35),
        (r"\bcubis[mt]\b", "western_classical", 0.35),
        (r"\bsurrealis", "western_classical", 0.35),
        (r"\bpre[-\s]?raphael", "western_classical", 0.40),
        (r"\bneoclassic", "western_classical", 0.40),
        (r"\bfauvis", "western_classical", 0.40),
        (r"\bpost[-\s]?impression", "western_classical", 0.40),
        (r"\bart\s*nouveau\b", "western_classical", 0.35),
        (r"\bpointillis", "western_classical", 0.40),
        (r"\brealis[mt]\b", "western_classical", 0.25),
        (r"\bromantic", "western_classical", 0.20),
        # Artists (strong signals)
        (r"\bmonet\b", "western_classical", 0.45),
        (r"\bvan\s*gogh\b", "western_classical", 0.45),
        (r"\bpicasso\b", "western_classical", 0.40),
        (r"\bda\s*vinci\b", "western_classical", 0.45),
        (r"\bmichelangelo\b", "western_classical", 0.40),
        (r"\brembrandt\b", "western_classical", 0.45),
        (r"\bvermeer\b", "western_classical", 0.45),
        (r"\bcaravaggio\b", "western_classical", 0.45),
        (r"\bcezanne\b", "western_classical", 0.40),
        (r"\bmatisse\b", "western_classical", 0.40),
        (r"\bkandinsky\b", "western_classical", 0.35),
        (r"\bklim[mt]\b", "western_classical", 0.35),
        (r"\bdali\b", "western_classical", 0.35),
        # Geography
        (r"\bwestem|western\b", "western_classical", 0.20),
        (r"\beuropean?\b", "western_classical", 0.25),
        (r"\bflorence\b", "western_classical", 0.30),
        (r"\bparis\b", "western_classical", 0.15),
        (r"\brome\b", "western_classical", 0.15),

        # ── Korean (korean_minhwa) ──
        (r"\bkorea(?:n)?\b", "korean_minhwa", 0.40),
        (r"\bminhwa\b", "korean_minhwa", 0.50),
        (r"\bhangul\b", "korean_minhwa", 0.45),
        (r"\bjoseon\b", "korean_minhwa", 0.50),
        (r"\bhanbang\b", "korean_minhwa", 0.40),
        (r"\bceladon\b", "korean_minhwa", 0.40),
        (r"\bbuncheong\b", "korean_minhwa", 0.50),
        (r"\bhanji\b", "korean_minhwa", 0.45),
        (r"\bgyeongbok", "korean_minhwa", 0.40),

        # ── Aboriginal (aboriginal_dreamtime) ──
        (r"\baboriginal\b", "aboriginal_dreamtime", 0.50),
        (r"\bdreamtime\b", "aboriginal_dreamtime", 0.50),
        (r"\bdot\s*painting\b", "aboriginal_dreamtime", 0.45),
        (r"\bsongline\b", "aboriginal_dreamtime", 0.45),
        (r"\btjukurpa\b", "aboriginal_dreamtime", 0.50),
        (r"\bwanderlust\s*trail\b", "aboriginal_dreamtime", 0.30),
        (r"\bdesert\s*art\b", "aboriginal_dreamtime", 0.30),
        (r"\bx[-\s]?ray\s*art\b", "aboriginal_dreamtime", 0.40),
        (r"\bbark\s*painting\b", "aboriginal_dreamtime", 0.40),
    ]

    indicators = []
    for pattern_str, tradition, weight in raw:
        try:
            indicators.append(_Indicator(
                pattern=re.compile(pattern_str, re.IGNORECASE),
                tradition=tradition,
                weight=weight,
            ))
        except re.error as e:
            logger.warning("Bad indicator pattern %r: %s", pattern_str, e)

    return indicators


# Module-level compiled indicators (loaded once)
_INDICATORS: list[_Indicator] = _build_indicators()


def _heuristic_score(text: str) -> dict[str, float]:
    """Score all traditions using indicator matching. Returns {tradition: score}."""
    scores: dict[str, float] = {}
    for ind in _INDICATORS:
        matches = ind.pattern.findall(text)
        if matches:
            # Each match adds the weight; cap contribution per-indicator to avoid
            # a repeated keyword inflating scores unreasonably.
            contribution = ind.weight * min(len(matches), 2)
            scores[ind.tradition] = scores.get(ind.tradition, 0.0) + contribution
    return scores


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def classify_tradition(subject: str) -> TraditionClassification:
    """Classify the cultural tradition of a subject description.

    Fast path: keyword match returns immediately with confidence 0.95.
    Slow path: heuristic scoring with weighted indicator database.

    Returns TraditionClassification with tradition, confidence (0-1), and method.
    """
    if not subject or not subject.strip():
        return TraditionClassification(
            tradition="chinese_xieyi",
            confidence=0.0,
            method="default",
        )

    # Tier 1: fast keyword match
    kw_result = _keyword_match(subject)
    if kw_result:
        return TraditionClassification(
            tradition=kw_result,
            confidence=0.95,
            method="keyword",
        )

    # Tier 2: heuristic scoring
    scores = _heuristic_score(subject)

    if not scores:
        return TraditionClassification(
            tradition="chinese_xieyi",
            confidence=0.0,
            method="default",
        )

    # Sort by score descending
    ranked = sorted(scores.items(), key=lambda x: x[1], reverse=True)
    best_tradition, best_score = ranked[0]

    # Normalize confidence: use a sigmoid-like mapping
    # A score of 0.5+ is fairly confident, 1.0+ is very confident
    confidence = min(best_score / 1.2, 1.0)  # Linear scale capped at 1.0
    confidence = round(confidence, 2)

    runner_up = None
    runner_up_conf = 0.0
    if len(ranked) >= 2:
        runner_up = ranked[1][0]
        runner_up_conf = round(min(ranked[1][1] / 1.2, 1.0), 2)

    return TraditionClassification(
        tradition=best_tradition,
        confidence=confidence,
        method="heuristic",
        runner_up=runner_up,
        runner_up_confidence=runner_up_conf,
    )
