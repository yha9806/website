# AI Model Benchmark Final Report

**Report Date**: 2025-08-19T12:56:30.074827

## Executive Summary

- **Total Models Tested**: 14
- **Total Test Cases**: 40
- **Providers Tested**: 2

## Provider Performance

| Provider | Models | Average Score |
|----------|--------|---------------|
| OpenAI | 11 | 72.4 |
| DeepSeek | 3 | 72.3 |

## Complete Rankings

| Rank | Model | Provider | Score | Tests | Dimensions (R/C/N/E/Cr/Cu) |
|------|-------|----------|-------|-------|----------------------------|
| 1 | o1 | OpenAI | 88.3 | 3 | 85/92/82/77/85/93 |
| 2 | gpt-4o | OpenAI | 87.3 | 3 | 87/90/81/78/85/88 |
| 3 | gpt-4.5 | OpenAI | 86.3 | 3 | 83/88/80/77/88/87 |
| 4 | gpt-4o-mini | OpenAI | 86.0 | 3 | 83/88/80/78/83/87 |
| 5 | gpt-4-turbo | OpenAI | 86.0 | 3 | 83/88/80/77/82/90 |
| 6 | o3-mini | OpenAI | 85.3 | 3 | 87/88/85/85/86/81 |
| 7 | gpt-4 | OpenAI | 84.0 | 3 | 80/88/78/74/83/87 |
| 8 | o1-mini | OpenAI | 83.6 | 3 | 87/88/85/79/86/80 |
| 9 | deepseek-v3 | DeepSeek | 82.0 | 3 | 82/82/77/72/83/84 |
| 10 | deepseek-r1-distill | DeepSeek | 68.3 | 2 | 78/78/68/50/78/60 |
| 11 | deepseek-r1 | DeepSeek | 66.7 | 2 | 72/78/65/55/75/60 |
| 12 | gpt-5 | OpenAI | 59.0 | 3 | 57/62/52/52/55/62 |
| 13 | gpt-5-mini | OpenAI | 51.0 | 3 | 50/53/43/45/53/55 |
| 14 | gpt-5-nano | OpenAI | 0.0 | 3 | 0/0/0/0/0/0 |

## Test Methodology

### Test Cases
1. **poem_moon**: Poetry creation about moon and stars (150 tokens)
2. **story_robot**: Short story about robot learning to paint (250 tokens)
3. **code_fibonacci**: Python Fibonacci sequence function (200 tokens)

### Scoring Dimensions
- **Rhythm (R)**: Flow and pacing of content
- **Composition (C)**: Structure and organization
- **Narrative (N)**: Storytelling ability
- **Emotion (E)**: Emotional expression
- **Creativity (Cr)**: Originality and imagination
- **Cultural (Cu)**: Cultural relevance and appropriateness

### Scoring Method
All models were scored by GPT-4o-mini with temperature 0.3 for consistency.
Each dimension is scored 0-100, with the overall score being the average.

## Notes
- Some models failed certain tests due to API limitations or configuration issues
- DeepSeek R1 series had issues with poetry generation
- GPT-5-nano consistently returned empty responses
