"""Intent templates for SimUserAgent creation cycles.

9 traditions x 2+ intents each. Used by SimUserAgent.run_create_cycle()
to generate diverse creation sessions.
"""

from __future__ import annotations

INTENT_TEMPLATES: dict[str, list[str]] = {
    "default": [
        "Create a colorful abstract composition",
        "Generate an expressive portrait study",
        "Make a landscape with dramatic lighting",
    ],
    "chinese_xieyi": [
        "Paint a freehand ink wash mountain landscape",
        "Create a xieyi-style bamboo in morning mist",
        "Generate spontaneous ink plum blossoms",
    ],
    "chinese_gongbi": [
        "Create a meticulous court lady painting",
        "Paint detailed gongbi-style peonies with gold leaf",
        "Generate a fine brushwork bird-and-flower composition",
    ],
    "western_academic": [
        "Paint an oil still life with chiaroscuro lighting",
        "Create a Renaissance-inspired figure study",
        "Generate a classical landscape with atmospheric perspective",
    ],
    "islamic_geometric": [
        "Create an intricate geometric tessellation pattern",
        "Generate an arabesque medallion design",
        "Design a muqarnas-inspired geometric composition",
    ],
    "japanese_traditional": [
        "Paint a ukiyo-e style ocean wave",
        "Create a nihonga autumn mountain scene",
        "Generate a wabi-sabi tea ceremony still life",
    ],
    "watercolor": [
        "Paint a loose watercolor coastal scene",
        "Create a wet-on-wet floral watercolor study",
        "Generate a watercolor urban sketch with splashes",
    ],
    "african_traditional": [
        "Create an adinkra-inspired pattern composition",
        "Generate a Benin bronze-style portrait",
        "Design a kente-inspired geometric textile art",
    ],
    "south_asian": [
        "Create a Mughal miniature garden scene",
        "Paint a rangoli-inspired mandala design",
        "Generate a Rajput court scene miniature",
    ],
}


def get_intents_for_tradition(tradition: str) -> list[str]:
    """Return intent templates for a tradition, falling back to default."""
    return INTENT_TEMPLATES.get(tradition, INTENT_TEMPLATES["default"])
