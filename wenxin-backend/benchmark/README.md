# AI Model Benchmark Testing Structure

## 📁 Directory Structure

```
benchmark/
├── scripts/                    # 测试脚本
│   ├── openai/                # OpenAI 测试脚本
│   │   ├── test_openai_all.py
│   │   └── test_openai_remaining.py
│   ├── deepseek/              # DeepSeek 测试脚本
│   │   └── test_deepseek_all.py
│   ├── anthropic/             # Anthropic (Claude) 测试脚本
│   │   └── test_anthropic_all.py
│   ├── google/                # Google (Gemini) 测试脚本
│   │   └── test_gemini_all.py
│   ├── xai/                   # X.AI (Grok) 测试脚本
│   │   └── test_xai_all.py
│   ├── moonshot/              # Moonshot (Kimi) 测试脚本
│   │   └── test_moonshot_all.py
│   └── base_tester.py         # 基础测试类
│
├── results/                    # 测试结果
│   ├── openai/                # OpenAI 结果
│   │   ├── raw/              # 原始测试数据
│   │   │   ├── o1_results.json
│   │   │   ├── gpt-4o_results.json
│   │   │   └── ...
│   │   ├── openai_summary.json
│   │   └── openai_report.md
│   ├── deepseek/              # DeepSeek 结果
│   │   ├── raw/
│   │   ├── deepseek_summary.json
│   │   └── deepseek_report.md
│   ├── anthropic/             # Anthropic 结果
│   ├── google/                # Google 结果
│   ├── xai/                   # X.AI 结果
│   ├── moonshot/              # Moonshot 结果
│   └── complete/              # 完整汇总
│       ├── all_models_summary.json
│       ├── all_models_rankings.json
│       └── complete_report.md
│
└── configs/                    # 配置文件
    ├── test_cases.json        # 标准测试用例
    └── scoring_prompt.txt     # 评分提示模板
```

## 🎯 Testing Standards

### 1. Test Cases (3 standard tests)
- **poem_moon**: Poetry creation about moon and stars
- **story_robot**: Short story about robot learning to paint  
- **code_fibonacci**: Python Fibonacci sequence function

### 2. Scoring Dimensions (0-100 each)
- **Rhythm**: Flow and pacing
- **Composition**: Structure and organization
- **Narrative**: Storytelling ability
- **Emotion**: Emotional expression
- **Creativity**: Originality and imagination
- **Cultural**: Cultural relevance

### 3. Scoring Method
- All models scored by GPT-4o-mini
- Temperature: 0.3 for consistency
- JSON response format enforced
- NO FALLBACK scoring allowed

## 📊 Data Structure

### Raw Result Format
```json
{
  "model_id": "gpt-4o",
  "test_id": "poem_moon",
  "success": true,
  "timestamp": "2025-08-19T12:00:00",
  "duration": 5.2,
  "response": "model response text...",
  "response_length": 1234,
  "score_details": {
    "total_score": 87,
    "dimensions": {
      "rhythm": 85,
      "composition": 90,
      "narrative": 82,
      "emotion": 88,
      "creativity": 86,
      "cultural": 91
    },
    "highlights": ["point 1", "point 2"],
    "weaknesses": ["point 1"]
  }
}
```

### Summary Format
```json
{
  "provider": "OpenAI",
  "test_date": "2025-08-19",
  "models_tested": 12,
  "successful_tests": 30,
  "failed_tests": 6,
  "rankings": [
    {
      "rank": 1,
      "model_id": "o1",
      "average_score": 88.3,
      "tests_completed": 3
    }
  ]
}
```

## 🚀 Usage

### Test single provider
```bash
python benchmark/scripts/openai/test_openai_remaining.py
```

### Test all providers
```bash
python benchmark/scripts/run_all_providers.py
```

### Generate reports
```bash
python benchmark/scripts/generate_reports.py
```

## 📈 Current Status

| Provider | Models | Tested | Success | Average Score |
|----------|--------|--------|---------|---------------|
| OpenAI | 12 | 9 | 8 | 82.1 |
| DeepSeek | 3 | 1 | 1 | 82.0 |
| Anthropic | 3 | 0 | 0 | - |
| Google | 1 | 0 | 0 | - |
| X.AI | 2 | 0 | 0 | - |
| Moonshot | 2 | 0 | 0 | - |