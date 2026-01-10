# 基准测试数据结构文档

## 📁 文件路径结构

```
I:\website\wenxin-backend\benchmark_results\
├── openai\                              # OpenAI模型测试结果（主要目录）
│   ├── openai_benchmark_report.json     # 完整的JSON数据（包含所有提供商）
│   └── openai_benchmark_report.md       # Markdown格式报告
├── complete\                             # 完整测试备份
│   ├── complete_benchmark_report.json   # 所有模型的完整数据
│   └── complete_benchmark_report.md     # 所有模型的Markdown报告
└── simple_test\                          # 简单测试结果
    └── simple_test_results.json         # 初步测试数据
```

## 📊 JSON数据结构

### 主报告文件: `openai_benchmark_report.json`

```json
{
  "test_date": "2025-08-19T11:20:19.177192",    // 测试时间
  "models_tested": 20,                           // 测试的模型总数
  "test_cases": 3,                               // 测试用例数量
  "total_tests": 60,                             // 总测试次数
  
  // 排名列表 - 按平均分排序
  "rankings": [
    {
      "rank": 1,                                 // 排名
      "model_id": "o1",                          // 模型ID
      "average_score": 88.33333333333333,        // 平均分
      "average_dimensions": {                    // 6个维度的平均分
        "rhythm": 85.0,                          // 节奏
        "composition": 92.0,                     // 构成
        "narrative": 82.0,                       // 叙事
        "emotion": 77.0,                         // 情感
        "creativity": 85.0,                      // 创造力
        "cultural": 93.0                         // 文化相关性
      },
      "tests_completed": 3                       // 完成的测试数
    },
    // ... 更多模型排名
  ],
  
  // 模型汇总信息
  "model_summaries": {
    "gpt-4o": {
      "average_score": 87.33333333333333,
      "average_dimensions": { /* 6维度分数 */ },
      "test_results": [ /* 详细测试结果数组 */ ],
      "total_score": 262,
      "dimension_totals": { /* 维度总分 */ },
      "success_count": 3
    },
    // ... 其他模型汇总
  },
  
  // 所有测试结果详情
  "all_results": [
    {
      "model_id": "gpt-4o",                      // 模型ID
      "test_id": "poem_moon",                    // 测试用例ID
      "success": true,                           // 是否成功
      "duration": 10.328471422195435,            // 响应时间（秒）
      "response": "完整的模型响应内容...",        // 模型生成的内容
      "response_length": 1048,                   // 响应长度
      "overall_score": 92,                       // 总分
      "dimensions": {                            // 6个维度得分
        "rhythm": 90,
        "composition": 95,
        "narrative": 85,
        "emotion": 95,
        "creativity": 90,
        "cultural": 90
      },
      "score_details": {                         // 详细评分信息
        "total_score": 92,
        "dimensions": { /* 同上 */ },
        "highlights": [                          // 亮点
          {
            "text": "Beautiful imagery and language",
            "score_point": "+5",
            "reason": "Exceptional use of metaphors"
          }
        ],
        "weaknesses": [                          // 不足
          "Narrative could be more pronounced"
        ],
        "suggestions": "改进建议..."             // 改进建议
      },
      "timestamp": "2025-08-19T11:04:00.123456"  // 测试时间戳
    },
    // ... 更多测试结果（总共60条）
  ]
}
```

## 🧪 测试用例结构

### 3个标准测试用例：

1. **poem_moon** - 诗歌创作测试
   - 类型: poem
   - 提示: "Write a beautiful poem about the moon and stars"
   - 最大tokens: 150

2. **story_robot** - 故事创作测试
   - 类型: story
   - 提示: "Write a short story about a robot learning to paint"
   - 最大tokens: 250

3. **code_fibonacci** - 代码生成测试
   - 类型: code
   - 提示: "Write a Python function to generate Fibonacci sequence"
   - 最大tokens: 200

## 📈 评分维度说明

每个响应在6个维度上评分（0-100）：

| 维度 | 英文 | 说明 |
|------|------|------|
| 节奏 | rhythm | 内容的流畅性和节奏感 |
| 构成 | composition | 结构和组织 |
| 叙事 | narrative | 故事讲述能力 |
| 情感 | emotion | 情感表达能力 |
| 创造力 | creativity | 原创性和想象力 |
| 文化 | cultural | 文化相关性和适当性 |

## 🏆 当前模型状态

### 成功测试的模型（9个）
- o1, gpt-4o, gpt-4.5, gpt-4o-mini, gpt-4-turbo, gpt-4
- deepseek-v3
- gpt-5, gpt-5-mini（部分成功）

### 失败的模型（11个）
- o1-mini, o3-mini（system角色问题 - 已修复）
- claude系列（API密钥未配置）
- deepseek-r1系列（模型名称问题 - 已修复）
- qwen系列（API密钥未配置）
- gpt-5-nano（响应为空）

## 🔍 数据访问示例

### Python读取数据
```python
import json

# 读取完整报告
with open('benchmark_results/openai/openai_benchmark_report.json', 'r') as f:
    data = json.load(f)

# 获取排名第一的模型
top_model = data['rankings'][0]
print(f"最佳模型: {top_model['model_id']} - {top_model['average_score']:.1f}分")

# 获取特定模型的所有测试结果
model_results = [r for r in data['all_results'] if r['model_id'] == 'gpt-4o']

# 按测试类型分组
test_types = {}
for result in data['all_results']:
    test_id = result['test_id']
    if test_id not in test_types:
        test_types[test_id] = []
    test_types[test_id].append(result)
```

### 数据统计
```python
# 统计成功率
total = len(data['all_results'])
success = len([r for r in data['all_results'] if r['success']])
success_rate = (success / total) * 100
print(f"总体成功率: {success_rate:.1f}%")

# 按提供商统计
providers = {
    'OpenAI': ['gpt', 'o1', 'o3'],
    'DeepSeek': ['deepseek'],
    'Anthropic': ['claude'],
    'Qwen': ['qwen']
}

for provider, keywords in providers.items():
    results = [r for r in data['all_results'] 
               if any(k in r['model_id'] for k in keywords)]
    if results:
        success_count = len([r for r in results if r['success']])
        print(f"{provider}: {success_count}/{len(results)} 成功")
```

## 📝 Markdown报告结构

`openai_benchmark_report.md` 包含：
- 测试概览统计
- 完整排名表格
- 提供商性能汇总
- 维度分数详情

## 🔄 数据更新流程

1. 运行 `run_all_models_benchmark.py` 生成新数据
2. 自动保存到 `benchmark_results/openai/` 目录
3. 同时更新 `complete/` 备份目录
4. JSON和Markdown文件同步更新

## 💾 数据库迁移

要将结果迁移到数据库：
```python
# 读取JSON数据
data = json.load(open('benchmark_results/openai/openai_benchmark_report.json'))

# 更新数据库
for ranking in data['rankings']:
    model_id = ranking['model_id']
    score = ranking['average_score']
    dimensions = ranking['average_dimensions']
    
    # 更新ai_models表
    # UPDATE ai_models 
    # SET overall_score = score,
    #     rhythm_score = dimensions['rhythm'],
    #     composition_score = dimensions['composition'],
    #     ... 
    # WHERE model_id = model_id
```

## 🎯 关键路径总结

- **主数据文件**: `I:\website\wenxin-backend\benchmark_results\openai\openai_benchmark_report.json`
- **包含内容**: 20个模型 × 3个测试 = 60条完整测试记录
- **数据完整性**: 每条记录包含响应内容、6维度评分、亮点、不足等
- **最新更新**: 2025-08-19 11:20:19