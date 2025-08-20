# AI Model Benchmark Comprehensive Report V2

**Report Date**: 2025-08-20 11:10

## Executive Summary

- **Total Providers**: 4
- **Total Models Tested**: 28
- **Total Tests Run**: 109
- **Successful Tests**: 97
- **Failed Tests**: 12

## Provider Statistics

| Provider | Models Configured | Models Tested | Tests Run | Success Rate | Avg Score | Top Model |
|----------|------------------|---------------|-----------|--------------|-----------|-----------|
| Openai | 11 | 11 | 33 | 100.0% | 85.2 | gpt-5 |
| Anthropic | 5 | 9 | 51 | 76.5% | 80.9 | claude-opus-4-0 |
| Deepseek | 0 | 3 | 7 | 100.0% | 70.6 | deepseek-v3 |
| Qwen | 0 | 6 | 18 | 100.0% | 82.9 | qwen-plus |

## Global Rankings (Top 20)

| Rank | Model | Provider | Score | Tests | Coverage |
|------|-------|----------|-------|-------|----------|
| 1 | **gpt-5** | OpenAI | 88.5 | 2 | code_fibonacci, poem_moon |
| 2 | **o1** | OpenAI | 88.3 | 3 | code_fibonacci, poem_moon, story_robot |
| 3 | **gpt-4o** | OpenAI | 87.3 | 3 | code_fibonacci, poem_moon, story_robot |
| 4 | **gpt-4.5** | OpenAI | 86.3 | 3 | code_fibonacci, poem_moon, story_robot |
| 5 | **gpt-4o-mini** | OpenAI | 86.0 | 3 | code_fibonacci, poem_moon, story_robot |
| 6 | **gpt-4-turbo** | OpenAI | 86.0 | 3 | code_fibonacci, poem_moon, story_robot |
| 7 | **o3-mini** | OpenAI | 85.3 | 3 | code_fibonacci, poem_moon, story_robot |
| 8 | **Qwen-Plus** | Qwen | 85.0 | 3 | code_fibonacci, poem_moon, story_robot |
| 9 | **Qwen3-8B** | Qwen | 84.8 | 3 | code_fibonacci, poem_moon, story_robot |
| 10 | **gpt-4** | OpenAI | 84.0 | 3 | code_fibonacci, poem_moon, story_robot |
| 11 | **o1-mini** | OpenAI | 83.6 | 3 | code_fibonacci, poem_moon, story_robot |
| 12 | **Qwen3-Coder-Plus** | Qwen | 83.3 | 3 | code_fibonacci, poem_moon, story_robot |
| 13 | **Claude Opus 4 (alias)** | Anthropic | 82.8 | 6 | code_fibonacci, poem_moon, story_robot |
| 14 | **Qwen3-32B** | Qwen | 82.8 | 3 | code_fibonacci, poem_moon, story_robot |
| 15 | **Claude Opus 4** | Anthropic | 82.7 | 6 | code_fibonacci, poem_moon, story_robot |
| 16 | **Claude Sonnet 4 (alias)** | Anthropic | 82.5 | 6 | code_fibonacci, poem_moon, story_robot |
| 17 | **Claude 3.5 Haiku** | Anthropic | 82.1 | 3 | code_fibonacci, poem_moon, story_robot |
| 18 | **Qwen-Flash** | Qwen | 81.9 | 3 | code_fibonacci, poem_moon, story_robot |
| 19 | **Claude 3.5 Sonnet** | Anthropic | 80.6 | 3 | code_fibonacci, poem_moon, story_robot |
| 20 | **Claude Sonnet 4** | Anthropic | 80.3 | 6 | code_fibonacci, poem_moon, story_robot |

## Dimension Analysis (Top 10)

| Model | Rhythm | Composition | Narrative | Emotion | Creativity | Cultural | Average |
|-------|--------|-------------|-----------|---------|------------|----------|----------|
| gpt-5 | 85 | 92 | 78 | 78 | 82 | 92 | 88.5 |
| o1 | 85 | 92 | 82 | 77 | 85 | 93 | 88.3 |
| gpt-4o | 87 | 90 | 81 | 78 | 85 | 88 | 87.3 |
| gpt-4.5 | 83 | 88 | 80 | 77 | 88 | 87 | 86.3 |
| gpt-4o-mini | 83 | 88 | 80 | 78 | 83 | 87 | 86.0 |
| gpt-4-turbo | 83 | 88 | 80 | 77 | 82 | 90 | 86.0 |
| o3-mini | 87 | 88 | 85 | 85 | 86 | 81 | 85.3 |
| Qwen-Plus | 83 | 88 | 82 | 79 | 86 | 91 | 85.0 |
| Qwen3-8B | 83 | 90 | 79 | 80 | 85 | 92 | 84.8 |
| gpt-4 | 80 | 88 | 78 | 74 | 83 | 87 | 84.0 |

## Key Findings

### Claude 4.1 Update
- Successfully tested Claude Opus 4.1 (claude-opus-4-1-20250805)
- Average score: 80.3/100 across 3 tests
- All tests passed on first attempt (no retries needed)

### Provider Performance
- Best performing provider: **Openai** (avg score: 85.2)

### Model Categories
- **Text Generation**: GPT, Claude, Qwen, DeepSeek models
- **Reasoning Models**: o1, o3-mini, Claude 4.x series
- **Efficient Models**: Haiku, Flash, Mini variants
- **Specialized**: Qwen3-Coder for code generation

## Notes

- All models tested with standardized prompts (poem_moon, story_robot, code_fibonacci)
- Scoring performed by GPT-4o-mini for consistency
- Claude 4.1 tested with retry mechanism for handling server errors
- Qwen models tested via DashScope international endpoint
