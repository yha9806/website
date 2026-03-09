# Video Script V6: Three Lines of Code

> **Duration**: 30-45 seconds
> **Style**: Developer-focused screen recording — fast, clean, no fluff
> **Music**: Lo-fi coding beats, minimal
> **Target**: Software engineers, ML engineers, DevOps, technical product managers

---

## [0:00-0:04] — HOOK

**[SCENE]** Dark terminal. Cursor blinks.

**[SCREEN]** Text types out: "Cultural AI evaluation in 3 lines of Python."

**[VO]** "Three lines of Python. That's all it takes."

**[DURATION]** 4 seconds

---

## [0:04-0:12] — INSTALL

**[SCENE]** Screen recording — terminal with clean monospace font, dark theme.

**[SCREEN]** Terminal:
```
$ pip install vulca
Collecting vulca...
Successfully installed vulca-0.2.0
```

**[VO]** "Pip install vulca. One dependency. All batteries included."

**[DURATION]** 8 seconds

---

## [0:12-0:22] — THE THREE LINES

**[SCENE]** Screen recording — code editor (VS Code, dark theme). File: `audit.py`

**[SCREEN]** Code appears line by line with syntax highlighting:
```python
from vulca import evaluate

result = evaluate("artwork.png")

print(result.dimensions)
```

Output appears in terminal below:
```json
{
  "creativity": 84.2,
  "technique": 91.7,
  "emotion": 76.3,
  "context": 34.1,
  "innovation": 79.8,
  "impact": 68.5,
  "cultural_flags": ["anachronistic_elements"],
  "perspectives": {
    "chinese": {"overall": 82.4, ...},
    "islamic": {"overall": 58.7, ...},
    ...
  }
}
```

**[VO]** "Import evaluate. Pass an image. Print the results. Forty-seven dimensions. Eight cultural perspectives. Cultural flags with specific issues. All in one response object."

**[DURATION]** 10 seconds

---

## [0:22-0:32] — ADVANCED USAGE

**[SCENE]** Same editor. New code examples flash through quickly.

**[SCREEN]** Quick sequence of code snippets (2-3 seconds each):

Snippet 1 — Batch evaluation:
```python
from vulca import evaluate_batch

results = evaluate_batch("./generated_images/")
report = results.to_report()
report.save("audit_report.html")
```

Snippet 2 — CI/CD integration:
```python
# In your test suite
def test_cultural_safety():
    result = evaluate("output.png")
    assert result.context > 60, "Cultural context below threshold"
    assert len(result.cultural_flags) == 0, f"Flags: {result.cultural_flags}"
```

Snippet 3 — Specific perspectives:
```python
result = evaluate("output.png", perspectives=["chinese", "islamic"])
print(result.perspectives["islamic"].context)  # 58.7
```

**[VO]** "Batch evaluate entire directories. Integrate into your test suite — fail the build if cultural context drops below threshold. Filter by specific cultural perspectives. All the same clean API."

**[DURATION]** 10 seconds

---

## [0:32-0:40] — CTA

**[SCENE]** Terminal and editor side by side.

**[SCREEN]**
```
pip install vulca
```

Three icons:
- PyPI: vulca
- GitHub: github.com/yha9806/website
- Web: vulcaart.art

Text: "Three lines. Zero cultural blind spots."

**[VO]** "Three lines of code. Zero cultural blind spots. Pip install vulca. Ship with confidence."

**[DURATION]** 8 seconds

---

## Production Notes

- **Speed**: This video is fast and dense by design. The target audience (developers) prefers efficiency over atmosphere.
- **Font**: JetBrains Mono or Fira Code, size 18+, dark theme
- **Code must be real**: Every code snippet shown must actually work. Record real terminal sessions, not mockups.
- **No transitions**: Hard cuts only. Developers hate swoosh transitions.
- **Aspect Ratio**: 16:9 primary (code readability), 9:16 vertical cut with larger font
- **Captions**: EN only (code is universal)
- **Thumbnail**: Dark terminal showing the three lines of code, with "3 Lines" in large text overlay
