# VULCA UI一致性问题 - 设计解决方案

**创建时间**: 2025-09-06 21:00
**状态**: 设计中

## 数据架构分析

### 后端数据模型
1. **AIModel表** (`ai_models`)
   - 包含基础模型信息
   - 存储VULCA数据字段：
     - `vulca_scores_47d` (JSON) - 47维度分数
     - `vulca_cultural_perspectives` (JSON) - 8个文化视角
     - `vulca_evaluation_date` - 评估日期
     - `vulca_sync_status` - 同步状态
   - 包含overall_score和metrics (6维度基础分数)

2. **VULCA服务架构**
   - 6D→47D扩展算法已实现
   - 8个文化视角评估
   - API端点：
     - `/api/v1/vulca/evaluate` - 评估模型
     - `/api/v1/vulca/compare` - 比较模型
     - `/api/v1/vulca/dimensions` - 获取47维度定义
     - `/api/v1/vulca/cultural-perspectives` - 获取文化视角

3. **数据流向**
   - 后端存储真实VULCA数据在`ai_models`表
   - 通过`/api/v1/models/`返回包含VULCA数据的模型列表
   - 前端通过`modelsService`获取数据

## 设计解决方案

### 1. 主页数据加载问题

**问题根源**：
- useLeaderboard hook在主页返回空数组
- API调用可能失败或数据未正确处理

**数据来源**：
- 后端：`/api/v1/models/` 端点
- 包含42个模型的完整数据
- 每个模型包含overall_score、metrics、VULCA数据

**解决方案**：
```typescript
// 在HomePage.tsx中直接调用API获取数据
import modelsService from '../services/models.service';

// 使用useEffect获取数据
useEffect(() => {
  const fetchModels = async () => {
    try {
      const models = await modelsService.getModels({ is_active: true });
      // 转换为LeaderboardEntry格式
      const entries = models.map((model, index) => ({
        rank: index + 1,
        model: modelsService.convertToFrontendModel(model),
        score: model.overall_score
      }));
      setLeaderboardData(entries);
    } catch (error) {
      console.error('Failed to load models:', error);
    }
  };
  fetchModels();
}, []);
```

### 2. 真实47D VULCA数据集成

**问题根源**：
- 当前显示"Dim 0-9"而非真实47维度
- 数据存在但未正确解析和显示

**数据来源**：
- 后端已存储在`vulca_scores_47d`字段
- 通过`/api/v1/vulca/dimensions`获取维度定义
- 真实47个维度名称和描述

**解决方案**：
```typescript
// 获取47维度定义
const fetchDimensions = async () => {
  const response = await apiClient.get('/vulca/dimensions');
  return response.data; // 返回47个维度的定义
};

// 在LeaderboardTable中正确解析VULCA数据
const parseVulcaData = (model) => {
  if (model.vulca_scores_47d) {
    // 数据已经是JSON格式，直接使用
    return {
      scores47D: model.vulca_scores_47d,
      culturalPerspectives: model.vulca_cultural_perspectives,
      evaluationDate: model.vulca_evaluation_date
    };
  }
  return null;
};
```

### 3. 数据一致性问题

**问题根源**：
- 47D显示平均分97.0与Overall Score 90.3不一致
- 不同的计算逻辑

**数据来源**：
- Overall Score: 来自`ai_models.overall_score`字段
- 47D分数：来自`vulca_scores_47d`的平均值

**解决方案**：
```typescript
// 统一分数计算逻辑
const calculateVulcaScore = (scores47D) => {
  if (!scores47D) return null;
  const values = Object.values(scores47D);
  const average = values.reduce((a, b) => a + b, 0) / values.length;
  return average;
};

// 显示时使用overall_score为主要分数
// 47D平均分作为补充信息
<div>
  <div>Overall Score: {model.overall_score}</div>
  <div>VULCA 47D Average: {calculateVulcaScore(model.vulca_scores_47d)}</div>
</div>
```

### 4. VULCA页面API修复

**问题根源**：
- `/api/v1/vulca/compare` 返回400错误
- 请求参数格式问题

**解决方案**：
```typescript
// 修复VULCADemoPage的API调用
const compareModels = async (modelIds) => {
  try {
    // 确保model_ids是正确格式
    const response = await apiClient.post('/vulca/compare', {
      model_ids: modelIds.map(id => String(id)), // 确保是字符串数组
      include_details: true
    });
    return response.data;
  } catch (error) {
    // 如果比较失败，获取单个模型数据作为备选
    const models = await Promise.all(
      modelIds.map(id => modelsService.getModelById(id))
    );
    return { models, fallback: true };
  }
};
```

### 5. 统一数据源架构

**核心原则**：
- 单一数据源：所有数据从`/api/v1/models/`获取
- 包含完整信息：基础分数、VULCA 47D、文化视角
- 缓存优化：使用React Query或SWR管理数据缓存

**实现架构**：
```
后端API
  ↓
modelsService (统一数据获取)
  ↓
数据缓存层 (React Query)
  ↓
各个组件使用统一数据
- HomePage
- LeaderboardPage  
- ModelDetailPage
- VULCADemoPage
```

## 实施优先级

1. **优先级1**：修复主页数据加载
   - 最影响用户体验
   - 实现简单，直接调用API

2. **优先级2**：统一分数显示
   - 避免用户困惑
   - 明确显示不同分数的含义

3. **优先级3**：集成真实47D数据
   - 展示完整VULCA功能
   - 需要正确解析和展示

4. **优先级4**：修复VULCA页面
   - 独立功能页面
   - 可以逐步完善

5. **优先级5**：优化数据架构
   - 长期改进
   - 提升整体性能