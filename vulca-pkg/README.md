# VULCA — Cultural-Aware AI Art Evaluation

[![PyPI](https://img.shields.io/pypi/v/vulca)](https://pypi.org/project/vulca/)
[![License](https://img.shields.io/badge/license-Apache%202.0-blue.svg)](LICENSE)
[![Paper](https://img.shields.io/badge/EMNLP%202025-Findings-green)](https://arxiv.org/abs/2601.07986)

**3 lines of code to evaluate any artwork across 5 cultural dimensions.**

VULCA (Visual Understanding and Linguistic Cultural Assessment) is the first cultural-aware AI art evaluation framework. It scores artworks on 5 levels (L1-L5) with cultural tradition-specific weights, powered by Gemini Vision.

## Quick Start

```bash
pip install vulca
export GOOGLE_API_KEY="your-gemini-api-key"
```

```python
import vulca

result = vulca.evaluate("painting.jpg")
print(result.score)        # 0.82
print(result.tradition)    # "default"
print(result.dimensions)   # {"L1": 0.75, "L2": 0.82, "L3": 0.80, ...}
```

## Cultural-Aware Evaluation

VULCA adjusts evaluation weights based on cultural tradition:

```python
# Chinese ink wash — emphasizes L5 (philosophical aesthetics)
result = vulca.evaluate("ink_painting.jpg", tradition="chinese_xieyi")

# Islamic geometric — emphasizes L1+L2 (visual + technical precision)
result = vulca.evaluate("mosaic.jpg", tradition="islamic_geometric")

# Auto-detect tradition from natural language
result = vulca.evaluate("artwork.jpg", intent="evaluate this Japanese ukiyo-e print")
print(result.tradition)  # "japanese_traditional"
```

## Five Evaluation Dimensions (L1-L5)

| Level | Dimension | What It Measures |
|-------|-----------|-----------------|
| L1 | Visual Perception | Composition, layout, color harmony |
| L2 | Technical Execution | Rendering quality, craftsmanship |
| L3 | Cultural Context | Tradition fidelity, motif usage |
| L4 | Critical Interpretation | Cultural sensitivity, respectful representation |
| L5 | Philosophical Aesthetics | Artistic depth, emotional resonance |

## Nine Cultural Traditions

`default` · `chinese_xieyi` · `chinese_gongbi` · `western_academic` · `islamic_geometric` · `japanese_traditional` · `watercolor` · `african_traditional` · `south_asian`

## Extra Skills

```python
result = vulca.evaluate(
    "poster.jpg",
    intent="check brand consistency for Gen Z",
    skills=["brand", "audience", "trend"],
)

print(result.skills["brand"].score)       # 0.78
print(result.skills["audience"].summary)  # "Strong Gen Z appeal..."
```

## CLI

```bash
vulca evaluate painting.jpg
vulca evaluate painting.jpg --intent "check ink wash style" --json
vulca evaluate painting.jpg --tradition chinese_xieyi --skills brand,trend
vulca traditions  # list all traditions and their weight emphasis
```

## Async Support

```python
import asyncio
import vulca

async def main():
    result = await vulca.aevaluate("painting.jpg", intent="check composition")
    print(result.score)

asyncio.run(main())
```

## Cost

~$0.001 per evaluation (Gemini Flash). Add ~$0.0002 per extra skill.

## Research

Based on the VULCA framework published at EMNLP 2025 Findings:

- **VULCA Framework**: [EMNLP 2025 Findings](https://arxiv.org/abs/2601.07986) — Five-dimension evaluation framework
- **VULCA-Bench**: 7,410 samples across L1-L5 levels
- **Online Demo**: [vulcaart.art](https://vulcaart.art)

## License

Apache 2.0
