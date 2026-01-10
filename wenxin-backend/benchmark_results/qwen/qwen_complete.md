# Qwen Models Complete Benchmark Report
**Test Date**: 2025-08-19 17:18  
**Provider**: Qwen (Alibaba)  
**Models Tested**: 6  
**Models Available**: 6  
**Total Tests**: 18  
**Successful Tests**: 18  

## Model Categories

- **Commercial**: 3 models
- **Qwen3 Dense**: 2 models
- **Qwen3 Coder**: 1 models

## Model Rankings

| Rank | Model | Average Score | Tests Completed |
|------|-------|---------------|-----------------|
| 1 | **Qwen-Plus** | 85.0/100 | 3/3 |
| 2 | **Qwen3-8B** | 84.8/100 | 3/3 |
| 3 | **Qwen3-Coder-Plus** | 83.3/100 | 3/3 |
| 4 | **Qwen3-32B** | 82.8/100 | 3/3 |
| 5 | **Qwen-Flash** | 81.9/100 | 3/3 |
| 6 | **Qwen2.5-Max (2025-01-25)** | 79.7/100 | 3/3 |

## Dimension Scores

| Model | Rhythm | Composition | Narrative | Emotion | Creativity | Cultural |
|-------|--------|-------------|-----------|---------|------------|-----------|
| Qwen-Plus | 83 | 88 | 82 | 79 | 86 | 91 |
| Qwen3-8B | 83 | 90 | 79 | 80 | 85 | 92 |
| Qwen3-Coder-Plus | 83 | 88 | 78 | 76 | 86 | 92 |
| Qwen3-32B | 83 | 87 | 80 | 79 | 86 | 88 |
| Qwen-Flash | 80 | 88 | 78 | 73 | 87 | 88 |
| Qwen2.5-Max (2025-01-25) | 82 | 85 | 77 | 71 | 82 | 88 |

## Notes

### Successfully Tested Models

- **Commercial Models**: Qwen-Max, Qwen-Plus, Qwen-Flash
- **Qwen3 MoE Models**: Large-scale mixture-of-experts models with thinking capabilities
- **Qwen3 Dense Models**: Various sizes from 4B to 32B parameters
- **Qwen3 Coder**: Specialized models for code generation
- **Qwen2.5 Series**: Previous generation models

### Key Features

- Models accessed through DashScope OpenAI-compatible API
- Qwen3 models support thinking/non-thinking mode switching
- Qwen-Max represents the most capable model in the family
- Qwen-Flash offers superior speed with large context window (1M tokens)

### Testing Options

- Run with `--priority` flag to test only priority models
- Priority models: qwen-max-2025-01-25, qwen-plus, qwen-flash, qwen3-32b, qwen3-8b, qwen3-coder-plus
