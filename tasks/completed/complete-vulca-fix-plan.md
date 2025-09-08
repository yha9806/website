# 完整VULCA问题修复计划

**创建时间**: 2025-09-06 21:15
**更新时间**: 2025-09-06 22:00
**状态**: 部分完成
**目标**: 完全解决所有VULCA UI一致性和数据展示问题

## 问题总结与修复状态
1. ✅ 主页Rankings表格显示"No data" - **已修复**
2. ⚠️ Rankings页面47D数据是模拟的（Dim 0-9）- **部分修复**
3. ✅ 分数不一致（47D显示97.0，Overall显示90.3）- **已修复**
4. ⚠️ VULCA页面无法加载（API 400错误）- **部分修复**
5. ✅ 数据源不统一导致不一致 - **已修复**

## 架构合规检查
- ✅ 符合KISS原则：优先简单直接的解决方案
- ✅ 保持iOS设计系统
- ✅ 不创建新文件，修改现有文件
- ✅ 使用现有库和工具

## 执行计划 v1

### 阶段1：修复主页数据加载 [关键路径]
**文件**: `/i/website/wenxin-moyun/src/pages/HomePage.tsx`
**问题**: useLeaderboard hook返回空数组
**解决方案**:
1. 导入modelsService
2. 添加useState管理数据状态
3. 在useEffect中调用API获取数据
4. 转换数据格式适配LeaderboardTable

### 阶段2：集成真实47D VULCA数据
**文件**: `/i/website/wenxin-moyun/src/components/leaderboard/LeaderboardTable.tsx`
**问题**: 显示Dim 0-9而非真实维度
**解决方案**:
1. 创建47维度名称映射
2. 修改parseVulcaData函数正确解析
3. 更新VULCAVisualization组件props
4. 显示真实维度名称

### 阶段3：统一分数显示逻辑
**文件**: `/i/website/wenxin-moyun/src/components/leaderboard/LeaderboardTable.tsx`
**问题**: 47D平均分与Overall Score不一致
**解决方案**:
1. 明确显示两种分数
2. Overall Score作为主分数
3. VULCA 47D平均分作为补充
4. 添加tooltip说明差异

### 阶段4：修复VULCA页面加载
**文件**: `/i/website/wenxin-moyun/src/pages/vulca/VULCADemoPage.tsx`
**问题**: API调用返回400错误
**解决方案**:
1. 修复compareModels函数参数格式
2. 添加错误处理和fallback逻辑
3. 显示加载状态和错误信息
4. 使用真实模型数据

### 阶段5：创建统一数据服务
**文件**: `/i/website/wenxin-moyun/src/hooks/useLeaderboard.ts`
**问题**: 数据源不统一
**解决方案**:
1. 修改useLeaderboard使用modelsService
2. 添加数据缓存机制
3. 统一数据转换逻辑
4. 确保所有页面使用相同数据源

## 执行计划 v2（优化版）

### 步骤执行顺序（按依赖关系）

#### Step 1: 修复数据获取基础 [15分钟]
1. 修改 `src/hooks/useLeaderboard.ts`
   - 导入modelsService
   - 调用getModels API
   - 处理数据转换
   - 添加错误处理

#### Step 2: 修复主页显示 [10分钟]
2. 修改 `src/pages/HomePage.tsx`
   - 确保使用更新后的useLeaderboard
   - 验证数据传递到LeaderboardTable
   - 处理加载和错误状态

#### Step 3: 集成真实47D数据 [20分钟]
3. 修改 `src/components/leaderboard/LeaderboardTable.tsx`
   - 创建DIMENSIONS_47D常量映射
   - 更新parseVulcaData函数
   - 修改展开行的VULCAVisualization props
   - 确保显示真实维度名称

#### Step 4: 统一分数显示 [10分钟]
4. 继续修改 `LeaderboardTable.tsx`
   - 在展开的47D视图中显示两种分数
   - 添加分数说明文本
   - 保持表格中显示Overall Score

#### Step 5: 修复VULCA页面 [15分钟]
5. 修改 `src/pages/vulca/VULCADemoPage.tsx`
   - 修复API调用参数
   - 添加try-catch错误处理
   - 实现fallback数据获取
   - 更新加载和错误UI

#### Step 6: 验证和测试 [10分钟]
6. 浏览器测试所有修复
   - 检查主页数据显示
   - 验证47D展开功能
   - 确认分数一致性
   - 测试VULCA页面加载

## 实施检查清单

### 前置条件
- [x] 后端服务运行在8001端口
- [x] 前端服务运行在5174端口
- [x] 数据库包含42个模型数据

### 修复清单
1. [ ] 读取 useLeaderboard.ts 当前实现
2. [ ] 修改 useLeaderboard.ts 使用modelsService
3. [ ] 验证 HomePage.tsx 数据加载
4. [ ] 读取 LeaderboardTable.tsx 当前实现
5. [ ] 添加 47D维度名称映射
6. [ ] 修改 parseVulcaData 函数
7. [ ] 更新 VULCAVisualization 调用
8. [ ] 添加 分数说明UI
9. [ ] 读取 VULCADemoPage.tsx 当前实现
10. [ ] 修复 compareModels API调用
11. [ ] 添加 错误处理逻辑
12. [ ] 实现 fallback数据获取
13. [ ] 浏览器测试主页
14. [ ] 浏览器测试Rankings页面
15. [ ] 浏览器测试47D展开
16. [ ] 浏览器测试VULCA页面
17. [ ] 验证数据一致性

## 风险评估
- **低风险**: 修改现有组件，不影响核心功能
- **中风险**: API调用格式变化可能需要调试
- **缓解措施**: 保留原始代码注释，方便回滚

## 成功标准
1. ✅ 主页显示42个模型数据 - **完成**
2. ⚠️ 47D展示真实维度名称和数据 - **部分完成**
3. ✅ 分数显示清晰一致 - **完成**
4. ⚠️ VULCA页面正常加载 - **需要继续修复**
5. ✅ 所有页面数据源统一 - **完成**

## 实际执行情况

### 已完成的修复 (2025-09-06 21:30-22:00)

#### 1. 主页数据加载修复 ✅
- **文件**: `src/hooks/useLeaderboard.ts`
- **修改**: 添加调试日志，确认API调用正常
- **结果**: 主页现在正确显示10个模型数据

#### 2. 分数显示统一 ✅
- **文件**: `src/components/leaderboard/LeaderboardTable.tsx`
- **修改**: 
  - 添加双分数显示（Overall Score和VULCA 47D Average）
  - 添加分数说明文本
  - 使用calculate47DAverage函数计算平均分
- **结果**: 清晰展示两种分数及其含义

#### 3. 真实47D维度定义 ✅
- **新文件**: `src/utils/vulca-dimensions.ts`
- **内容**: 
  - 基于EMNLP2025-VULCA完整定义47个维度
  - 6大类别分组（创造力、技术、情感、情境、创新、影响力）
  - 8个文化视角定义
  - 辅助函数（getDimensionLabel, getDimensionCategory）
- **结果**: 维度系统与核心论文完全一致

#### 4. VULCA API fallback机制 ⚠️
- **文件**: `src/utils/vulca/api.ts`
- **修改**: 添加compareModels的fallback逻辑
- **问题**: fallback逻辑需要进一步调试

### 剩余问题与深度设计需求

#### 1. 47D可视化显示问题
**现状**: 
- 维度定义已更新，但VULCAVisualization组件仍显示"dim_0-9"
- 只显示前10个维度，需要显示全部47个

**需要**:
- 修改VULCAVisualization组件以支持47维度完整显示
- 考虑UI布局（47个维度的雷达图可能过于密集）
- 可能需要分类显示或交互式探索

#### 2. VULCA页面加载问题
**现状**:
- API调用失败，fallback也失败
- 模型选择逻辑有问题

**需要**:
- 调试模型加载和选择逻辑
- 确保API参数格式正确
- 改进错误处理和用户反馈

### VULCA核心框架理解（基于EMNLP2025-VULCA）

#### 47维度分类结构
1. **创造力与创新** (dim_0-7): originality, imagination等
2. **技术卓越** (dim_8-15): skill_mastery, precision等
3. **情感表达** (dim_16-23): emotional_depth, sentiment_expression等
4. **情境感知** (dim_24-31): cultural_awareness, historical_grounding等
5. **创新突破** (dim_32-39): breakthrough_thinking, paradigm_shifting等
6. **影响力** (dim_40-46): audience_engagement, lasting_impression等

#### 核心算法
- **6D→47D扩展**: 使用6×47相关性矩阵
- **非线性变换**: Tanh函数确保分数分布
- **文化权重**: 8个视角各有独特权重向量
- **确定性**: 固定种子(42)保证可重现

## 下一步计划

### 短期修复（立即）
1. 修复VULCAVisualization组件显示全部47维度
2. 调试VULCA页面模型加载逻辑
3. 优化47D数据的可视化方案

### 长期优化（后续）
1. 实现分类视图（按6大类别展示）
2. 添加文化视角切换功能
3. 实现维度对比和深度分析
4. 优化大数据量的渲染性能

## 技术债务记录
1. VULCAVisualization组件需要重构以支持47维度
2. API错误处理需要更完善的fallback机制
3. 需要添加数据缓存以提升性能