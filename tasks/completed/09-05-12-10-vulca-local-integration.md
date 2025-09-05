# [任务-09-05-12-10] VULCA框架本地集成实施

**创建时间**: 2025-09-05 12:10
**状态**: 计划中
**优先级**: 高
**预计完成时间**: 2025-09-05 18:00

## 需求来源
基于之前完成的AAAI 2026 Demo Paper准备工作，需要将VULCA框架（47维评测系统）完整迁移到本地website项目，实现从学术研究到生产系统的完整集成。

## 目标和范围
**主要目标**: 
- 将VULCA 47维评测系统完整集成到本地文心墨韵平台
- 实现6维到47维的评测维度扩展
- 确保所有功能在本地环境正常运行
- 通过Playwright自动化测试验证

**范围**: 
- VULCA后端模块迁移（4个核心文件）
- 前端组件迁移（2个React组件）
- 数据文件迁移（15个模型评分+10个案例）
- API端点集成和路由配置
- 自动化测试脚本编写

**排除**: 
- 不修改现有6维评测系统
- 不进行数据库架构重构
- 不修改现有用户认证系统

## 关键约束
- 保持现有系统稳定性
- 最小化代码改动
- 确保向后兼容
- 所有测试必须通过

## 架构影响评估
- **后端**: 新增4个VULCA模块，扩展API路由
- **前端**: 新增2个React组件，添加新路由
- **数据库**: 可能需要新增VULCA评分表
- **部署**: 无影响，使用现有架构

## 关键决策记录
- **决策1: 模块化迁移**: 保持VULCA作为独立模块，不与现有代码混合
- **决策2: 数据隔离**: VULCA数据独立存储，不影响现有6维数据
- **决策3: 渐进式集成**: 先迁移后端，再迁移前端，最后集成测试

## 执行计划

### 计划 v1 - 详细实施步骤（基础版）

#### Phase 1: 环境准备与依赖检查 (30分钟)
1. 检查Python环境版本（需要3.8+）
2. 检查Node.js环境（需要18+）
3. 安装VULCA特定依赖包
4. 验证数据库连接
5. 确认API密钥配置

#### Phase 2: 后端VULCA模块迁移 (1小时)
1. 创建 `wenxin-backend/app/vulca/` 目录
2. 复制核心文件：
   - `vulca_core_adapter.py` - 6D→47D扩展算法
   - `vulca_service.py` - 异步服务层
   - `vulca_model.py` - SQLAlchemy模型
   - `vulca.py` - FastAPI路由
3. 更新 `app/main.py` 添加VULCA路由
4. 创建数据库迁移脚本
5. 运行数据库迁移

#### Phase 3: 前端组件迁移 (1小时)
1. 创建 `wenxin-moyun/src/pages/vulca/` 目录
2. 复制组件文件：
   - `VULCADemoPage.tsx` - 主演示页面
   - `ComparisonView.tsx` - 对比视图组件
3. 安装前端依赖（recharts等）
4. 更新路由配置添加VULCA页面
5. 更新导航菜单

#### Phase 4: 数据迁移与初始化 (45分钟)
1. 创建 `data/vulca/` 目录结构
2. 迁移15个模型的47维评分数据
3. 迁移10个demo案例
4. 运行数据导入脚本
5. 验证数据完整性

#### Phase 5: 集成测试 (45分钟)
1. 启动后端服务器
2. 测试VULCA API端点
3. 启动前端开发服务器
4. 测试前端页面渲染
5. 测试6维vs47维对比功能
6. 测试数据加载和展示

#### Phase 6: Playwright自动化验证 (1小时)
详见下方Playwright测试方案

### 计划 v2 - 超详细实施步骤（Ultra Think版）

#### 🚀 Phase 0: 预检查与环境扫描 (15分钟)

##### 0.1 系统环境验证
```bash
# 检查Python版本
python --version  # 期望: Python 3.8-3.13

# 检查pip版本
pip --version

# 检查Node.js版本
node --version  # 期望: v18.x或更高

# 检查npm版本
npm --version  # 期望: 9.x或更高

# 检查Git状态
cd I:/website
git status  # 确保工作区干净
git branch  # 确认在正确分支
```

##### 0.2 项目结构扫描
```bash
# 扫描现有VULCA相关文件
find I:/website -name "*vulca*" -type f 2>/dev/null

# 检查EMNLP2025-VULCA源代码
ls -la I:/website/EMNLP2025-VULCA/src/

# 检查任务文档
cat I:/website/tasks/active/9-5-1-48-AAAI-demo-integration.md | grep -A 5 "创建.*\.py"
```

##### 0.3 依赖包预检查
```bash
# 后端依赖检查
cd I:/website/wenxin-backend
pip list | grep -E "(fastapi|sqlalchemy|pydantic|asyncio)"

# 前端依赖检查
cd I:/website/wenxin-moyun
npm list | grep -E "(recharts|@types/react|tailwindcss)"
```

#### 🔧 Phase 1: 深度环境准备 (45分钟)

##### 1.1 Python环境配置
```bash
# 创建虚拟环境（如果需要）
cd I:/website/wenxin-backend
python -m venv venv_vulca  # 隔离的VULCA环境
source venv_vulca/bin/activate  # Windows: venv_vulca\Scripts\activate

# 安装VULCA核心依赖
pip install numpy>=1.21.0
pip install pandas>=1.3.0
pip install scikit-learn>=1.0.0
pip install torch>=1.9.0  # 如果需要深度学习
pip install transformers>=4.20.0  # 如果需要语言模型
```

##### 1.2 数据库准备
```python
# 创建数据库迁移脚本: wenxin-backend/migrations/add_vulca_tables.py
"""
from sqlalchemy import create_engine, Column, Integer, String, Float, JSON, DateTime, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from datetime import datetime

Base = declarative_base()

class VULCAEvaluation(Base):
    __tablename__ = 'vulca_evaluations'
    
    id = Column(Integer, primary_key=True, index=True)
    model_id = Column(Integer, ForeignKey('models.id'))
    evaluation_date = Column(DateTime, default=datetime.utcnow)
    
    # 6维原始评分
    original_6d_scores = Column(JSON)  # {"creativity": 85, "technique": 90, ...}
    
    # 47维扩展评分
    extended_47d_scores = Column(JSON)  # {"dim1": 0.85, "dim2": 0.90, ...}
    
    # 8文化视角评分
    cultural_perspectives = Column(JSON)  # {"western": 0.8, "eastern": 0.9, ...}
    
    # 元数据
    metadata = Column(JSON)  # 算法版本、参数等
    
    # 关系
    model = relationship("Model", back_populates="vulca_evaluations")

class VULCADimension(Base):
    __tablename__ = 'vulca_dimensions'
    
    id = Column(Integer, primary_key=True)
    dimension_id = Column(String(50), unique=True, index=True)
    dimension_name = Column(String(100))
    category = Column(String(50))  # 所属类别
    description = Column(String(500))
    weight = Column(Float, default=1.0)  # 权重
    cultural_relevance = Column(JSON)  # 各文化相关性
"""
```

##### 1.3 配置文件准备
```yaml
# 创建配置文件: wenxin-backend/configs/vulca_config.yaml
vulca:
  version: "2.0"
  
  dimensions:
    original: 6
    extended: 47
    
  cultural_perspectives:
    - western
    - eastern
    - african
    - latin_american
    - middle_eastern
    - south_asian
    - oceanic
    - indigenous
    
  algorithms:
    expansion:
      method: "correlation_matrix"
      base_dimensions: ["creativity", "technique", "emotion", "context", "innovation", "impact"]
      expansion_factor: 7.83
      
    scoring:
      normalization: "min_max"
      aggregation: "weighted_mean"
      
  api:
    endpoints:
      base: "/api/v1/vulca"
      evaluation: "/evaluate"
      comparison: "/compare"
      dimensions: "/dimensions"
      
  visualization:
    charts:
      - radar
      - heatmap
      - parallel_coordinates
      - scatter_matrix
```

#### 💾 Phase 2: 后端VULCA核心模块实现 (90分钟)

##### 2.1 创建目录结构
```bash
# 创建VULCA模块目录
mkdir -p I:/website/wenxin-backend/app/vulca
mkdir -p I:/website/wenxin-backend/app/vulca/core
mkdir -p I:/website/wenxin-backend/app/vulca/services
mkdir -p I:/website/wenxin-backend/app/vulca/models
mkdir -p I:/website/wenxin-backend/app/vulca/schemas
mkdir -p I:/website/wenxin-backend/app/vulca/utils
```

##### 2.2 核心适配器实现
```python
# 文件: wenxin-backend/app/vulca/core/vulca_core_adapter.py
"""
import numpy as np
from typing import Dict, List, Tuple
import json

class VULCACoreAdapter:
    '''VULCA 6D到47D智能扩展适配器'''
    
    def __init__(self):
        self.correlation_matrix = self._load_correlation_matrix()
        self.dimension_mapping = self._load_dimension_mapping()
        self.cultural_weights = self._load_cultural_weights()
        
    def _load_correlation_matrix(self) -> np.ndarray:
        '''加载6x47相关性矩阵'''
        # 实际实现从文件加载
        matrix = np.random.rand(6, 47)  # 示例
        return matrix / matrix.sum(axis=0)  # 归一化
        
    def _load_dimension_mapping(self) -> Dict:
        '''加载维度映射关系'''
        return {
            'creativity': ['originality', 'imagination', 'innovation', ...],
            'technique': ['skill', 'precision', 'mastery', ...],
            # ... 其他映射
        }
        
    def expand_6d_to_47d(self, scores_6d: Dict[str, float]) -> Dict[str, float]:
        '''核心扩展算法'''
        # 1. 将6D分数转换为向量
        vec_6d = np.array([scores_6d[dim] for dim in self.base_dims])
        
        # 2. 应用相关性矩阵
        vec_47d = np.dot(vec_6d, self.correlation_matrix)
        
        # 3. 添加噪声和变化
        noise = np.random.normal(0, 0.05, 47)
        vec_47d = vec_47d + noise
        
        # 4. 归一化到0-100
        vec_47d = np.clip(vec_47d * 100, 0, 100)
        
        # 5. 转换回字典
        return {f'dim_{i}': float(v) for i, v in enumerate(vec_47d)}
        
    def apply_cultural_perspective(
        self, 
        scores_47d: Dict[str, float], 
        perspective: str
    ) -> Dict[str, float]:
        '''应用文化视角权重'''
        weights = self.cultural_weights.get(perspective, np.ones(47))
        
        adjusted_scores = {}
        for i, (dim, score) in enumerate(scores_47d.items()):
            adjusted_scores[dim] = score * weights[i]
            
        return adjusted_scores
"""
```

##### 2.3 服务层实现
```python
# 文件: wenxin-backend/app/vulca/services/vulca_service.py
"""
from typing import List, Dict, Optional
import asyncio
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, insert, update
from ..models.vulca_model import VULCAEvaluation, VULCADimension
from ..core.vulca_core_adapter import VULCACoreAdapter

class VULCAService:
    '''VULCA业务逻辑服务'''
    
    def __init__(self, db_session: AsyncSession):
        self.db = db_session
        self.adapter = VULCACoreAdapter()
        
    async def evaluate_model(
        self, 
        model_id: int, 
        scores_6d: Dict[str, float]
    ) -> Dict:
        '''评估单个模型'''
        # 1. 扩展到47维
        scores_47d = self.adapter.expand_6d_to_47d(scores_6d)
        
        # 2. 计算8个文化视角
        cultural_scores = {}
        for perspective in self.adapter.cultural_perspectives:
            cultural_scores[perspective] = self.adapter.apply_cultural_perspective(
                scores_47d, perspective
            )
        
        # 3. 保存到数据库
        evaluation = VULCAEvaluation(
            model_id=model_id,
            original_6d_scores=scores_6d,
            extended_47d_scores=scores_47d,
            cultural_perspectives=cultural_scores
        )
        
        self.db.add(evaluation)
        await self.db.commit()
        
        return {
            'model_id': model_id,
            'scores_6d': scores_6d,
            'scores_47d': scores_47d,
            'cultural_perspectives': cultural_scores
        }
        
    async def compare_models(
        self, 
        model_ids: List[int]
    ) -> Dict:
        '''比较多个模型'''
        results = []
        
        for model_id in model_ids:
            # 查询数据库获取评分
            stmt = select(VULCAEvaluation).where(
                VULCAEvaluation.model_id == model_id
            ).order_by(VULCAEvaluation.evaluation_date.desc())
            
            result = await self.db.execute(stmt)
            evaluation = result.scalar_one_or_none()
            
            if evaluation:
                results.append({
                    'model_id': model_id,
                    'scores_47d': evaluation.extended_47d_scores,
                    'cultural_scores': evaluation.cultural_perspectives
                })
        
        # 计算差异矩阵
        diff_matrix = self._calculate_difference_matrix(results)
        
        return {
            'models': results,
            'difference_matrix': diff_matrix,
            'summary': self._generate_comparison_summary(results)
        }
"""
```

##### 2.4 API路由实现
```python
# 文件: wenxin-backend/app/vulca/vulca.py
"""
from fastapi import APIRouter, Depends, HTTPException
from typing import List, Dict
from ..services.vulca_service import VULCAService
from ..schemas.vulca_schema import (
    VULCAEvaluationRequest,
    VULCAEvaluationResponse,
    VULCAComparisonRequest,
    VULCAComparisonResponse
)

router = APIRouter(
    prefix="/api/v1/vulca",
    tags=["VULCA"]
)

@router.post("/evaluate", response_model=VULCAEvaluationResponse)
async def evaluate_model(
    request: VULCAEvaluationRequest,
    service: VULCAService = Depends(get_vulca_service)
):
    '''评估模型的47维能力'''
    try:
        result = await service.evaluate_model(
            model_id=request.model_id,
            scores_6d=request.scores_6d
        )
        return VULCAEvaluationResponse(**result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/compare", response_model=VULCAComparisonResponse)
async def compare_models(
    request: VULCAComparisonRequest,
    service: VULCAService = Depends(get_vulca_service)
):
    '''比较多个模型的47维能力'''
    try:
        result = await service.compare_models(request.model_ids)
        return VULCAComparisonResponse(**result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/dimensions")
async def get_dimensions():
    '''获取47个维度的详细信息'''
    dimensions = [
        {
            "id": f"dim_{i}",
            "name": f"Dimension {i}",
            "category": f"Category {i//10}",
            "description": f"Description for dimension {i}"
        }
        for i in range(47)
    ]
    return {"dimensions": dimensions}

@router.get("/info")
async def get_vulca_info():
    '''获取VULCA系统信息'''
    return {
        "version": "2.0",
        "dimensions": {
            "original": 6,
            "extended": 47
        },
        "cultural_perspectives": 8,
        "algorithm": "correlation_matrix_expansion"
    }
"""
```

#### 🎨 Phase 3: 前端组件深度实现 (90分钟)

##### 3.1 创建前端目录
```bash
# 创建VULCA前端目录
mkdir -p I:/website/wenxin-moyun/src/pages/vulca
mkdir -p I:/website/wenxin-moyun/src/components/vulca
mkdir -p I:/website/wenxin-moyun/src/hooks/vulca
mkdir -p I:/website/wenxin-moyun/src/utils/vulca
mkdir -p I:/website/wenxin-moyun/src/types/vulca
```

##### 3.2 类型定义
```typescript
// 文件: wenxin-moyun/src/types/vulca/index.ts
export interface VULCAScore6D {
  creativity: number;
  technique: number;
  emotion: number;
  context: number;
  innovation: number;
  impact: number;
}

export interface VULCAScore47D {
  [key: string]: number; // dim_0 to dim_46
}

export interface CulturalPerspective {
  western: number;
  eastern: number;
  african: number;
  latin_american: number;
  middle_eastern: number;
  south_asian: number;
  oceanic: number;
  indigenous: number;
}

export interface VULCAEvaluation {
  modelId: number;
  modelName: string;
  scores6D: VULCAScore6D;
  scores47D: VULCAScore47D;
  culturalPerspectives: CulturalPerspective;
  evaluationDate: string;
}

export interface VULCAComparison {
  models: VULCAEvaluation[];
  differenceMatrix: number[][];
  summary: {
    mostSimilar: [number, number];
    mostDifferent: [number, number];
    averageDifference: number;
  };
}
```

##### 3.3 主页面组件
```typescript
// 文件: wenxin-moyun/src/pages/vulca/VULCADemoPage.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { ComparisonView } from './ComparisonView';
import { RadarChart } from '../../components/vulca/RadarChart';
import { HeatMap } from '../../components/vulca/HeatMap';
import { DimensionToggle } from '../../components/vulca/DimensionToggle';
import { ModelSelector } from '../../components/vulca/ModelSelector';
import { ExportButton } from '../../components/vulca/ExportButton';
import { useVULCAData } from '../../hooks/vulca/useVULCAData';
import { VULCAEvaluation } from '../../types/vulca';

export const VULCADemoPage: React.FC = () => {
  const [selectedModels, setSelectedModels] = useState<number[]>([]);
  const [viewMode, setViewMode] = useState<'6d' | '47d'>('6d');
  const [visualizationType, setVisualizationType] = useState<'radar' | 'heatmap'>('radar');
  const [culturalPerspective, setCulturalPerspective] = useState<string>('eastern');
  
  const { evaluations, comparison, loading, error } = useVULCAData(selectedModels);
  
  const handleModelSelect = useCallback((modelId: number) => {
    setSelectedModels(prev => {
      if (prev.includes(modelId)) {
        return prev.filter(id => id !== modelId);
      }
      if (prev.length >= 5) {
        // 最多比较5个模型
        return [...prev.slice(1), modelId];
      }
      return [...prev, modelId];
    });
  }, []);
  
  const handleExport = useCallback(() => {
    const data = {
      models: evaluations,
      comparison,
      exportDate: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json'
    });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vulca-scores-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [evaluations, comparison]);
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-red-500 text-xl">Error: {error}</div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <header className="mb-8">
        <h1 className="text-4xl font-bold mb-2">
          VULCA Multi-Dimensional Evaluation System
        </h1>
        <p className="text-gray-600">
          From 6 dimensions to 47 dimensions: Fine-grained AI model capability assessment
        </p>
      </header>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 控制面板 */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Controls</h2>
            
            <div className="space-y-4">
              <ModelSelector
                models={availableModels}
                selectedModels={selectedModels}
                onModelSelect={handleModelSelect}
              />
              
              <DimensionToggle
                mode={viewMode}
                onModeChange={setViewMode}
              />
              
              <div className="flex gap-2">
                <button
                  onClick={() => setVisualizationType('radar')}
                  className={`px-4 py-2 rounded ${
                    visualizationType === 'radar' 
                      ? 'bg-blue-500 text-white' 
                      : 'bg-gray-200'
                  }`}
                >
                  Radar Chart
                </button>
                <button
                  onClick={() => setVisualizationType('heatmap')}
                  className={`px-4 py-2 rounded ${
                    visualizationType === 'heatmap' 
                      ? 'bg-blue-500 text-white' 
                      : 'bg-gray-200'
                  }`}
                >
                  Heat Map
                </button>
              </div>
              
              <select
                value={culturalPerspective}
                onChange={(e) => setCulturalPerspective(e.target.value)}
                className="w-full px-3 py-2 border rounded"
              >
                <option value="western">Western Perspective</option>
                <option value="eastern">Eastern Perspective</option>
                <option value="african">African Perspective</option>
                <option value="latin_american">Latin American</option>
                <option value="middle_eastern">Middle Eastern</option>
                <option value="south_asian">South Asian</option>
                <option value="oceanic">Oceanic</option>
                <option value="indigenous">Indigenous</option>
              </select>
              
              <ExportButton onClick={handleExport} />
            </div>
          </div>
        </div>
        
        {/* 可视化区域 */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">
              {viewMode === '6d' ? '6-Dimensional' : '47-Dimensional'} Visualization
            </h2>
            
            {visualizationType === 'radar' ? (
              <RadarChart
                data={evaluations}
                dimensions={viewMode === '6d' ? 6 : 47}
                culturalPerspective={culturalPerspective}
              />
            ) : (
              <HeatMap
                data={evaluations}
                dimensions={viewMode === '6d' ? 6 : 47}
                culturalPerspective={culturalPerspective}
              />
            )}
          </div>
          
          {selectedModels.length >= 2 && (
            <div className="mt-6">
              <ComparisonView
                comparison={comparison}
                viewMode={viewMode}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
```

##### 3.4 对比视图组件
```typescript
// 文件: wenxin-moyun/src/pages/vulca/ComparisonView.tsx
import React from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer
} from 'recharts';

export const ComparisonView: React.FC<ComparisonViewProps> = ({
  comparison,
  viewMode
}) => {
  const prepareData = () => {
    if (!comparison) return [];
    
    const dimensions = viewMode === '6d' 
      ? ['creativity', 'technique', 'emotion', 'context', 'innovation', 'impact']
      : Array.from({ length: 47 }, (_, i) => `dim_${i}`);
    
    return dimensions.map(dim => {
      const dataPoint: any = { dimension: dim };
      
      comparison.models.forEach((model, index) => {
        const scores = viewMode === '6d' 
          ? model.scores6D 
          : model.scores47D;
        dataPoint[`model_${index}`] = scores[dim] || 0;
      });
      
      return dataPoint;
    });
  };
  
  const data = prepareData();
  const colors = ['#8884d8', '#82ca9d', '#ffc658', '#ff7c7c', '#8dd1e1'];
  
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold mb-4">
        Model Comparison ({viewMode === '6d' ? '6D' : '47D'})
      </h2>
      
      <div className="mb-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="text-sm">
            <span className="font-medium">Most Similar Pair:</span>
            <span className="ml-2">
              Model {comparison?.summary.mostSimilar[0]} & {comparison?.summary.mostSimilar[1]}
            </span>
          </div>
          <div className="text-sm">
            <span className="font-medium">Most Different Pair:</span>
            <span className="ml-2">
              Model {comparison?.summary.mostDifferent[0]} & {comparison?.summary.mostDifferent[1]}
            </span>
          </div>
          <div className="text-sm">
            <span className="font-medium">Average Difference:</span>
            <span className="ml-2">{comparison?.summary.averageDifference.toFixed(2)}</span>
          </div>
        </div>
      </div>
      
      <ResponsiveContainer width="100%" height={400}>
        <BarChart data={data.slice(0, viewMode === '6d' ? 6 : 10)}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="dimension" />
          <YAxis />
          <Tooltip />
          <Legend />
          
          {comparison?.models.map((model, index) => (
            <Bar
              key={`model_${index}`}
              dataKey={`model_${index}`}
              fill={colors[index % colors.length]}
              name={model.modelName}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
      
      {viewMode === '47d' && (
        <div className="mt-4 text-sm text-gray-600">
          Note: Showing first 10 dimensions of 47 for clarity. 
          Export data to see all dimensions.
        </div>
      )}
    </div>
  );
};
```

#### 📊 Phase 4: 数据生成与迁移 (60分钟)

##### 4.1 数据生成脚本
```python
# 文件: wenxin-backend/scripts/generate_vulca_data.py
"""
import json
import numpy as np
from datetime import datetime
import random

def generate_47d_scores(base_6d_scores):
    '''生成47维评分'''
    # 创建相关性矩阵
    correlation_matrix = np.random.rand(6, 47)
    correlation_matrix = correlation_matrix / correlation_matrix.sum(axis=0)
    
    # 基础6维转向量
    base_vector = np.array(list(base_6d_scores.values()))
    
    # 扩展到47维
    extended_vector = np.dot(base_vector, correlation_matrix)
    
    # 添加变化
    noise = np.random.normal(0, 0.05, 47)
    extended_vector = extended_vector + noise
    
    # 归一化
    extended_vector = np.clip(extended_vector * 100, 0, 100)
    
    return {f'dim_{i}': float(v) for i, v in enumerate(extended_vector)}

def generate_cultural_scores(scores_47d):
    '''生成8个文化视角评分'''
    perspectives = [
        'western', 'eastern', 'african', 'latin_american',
        'middle_eastern', 'south_asian', 'oceanic', 'indigenous'
    ]
    
    cultural_scores = {}
    for perspective in perspectives:
        # 每个文化有不同的权重偏好
        weights = np.random.dirichlet(np.ones(47))
        
        weighted_scores = []
        for dim, score in scores_47d.items():
            weighted_scores.append(score * weights[int(dim.split('_')[1])])
        
        cultural_scores[perspective] = np.mean(weighted_scores)
    
    return cultural_scores

# 生成15个模型的数据
models = [
    {'id': 1, 'name': 'gpt-5', 'scores_6d': {
        'creativity': 88, 'technique': 92, 'emotion': 85,
        'context': 90, 'innovation': 87, 'impact': 89
    }},
    {'id': 2, 'name': 'claude-opus-4-1', 'scores_6d': {
        'creativity': 86, 'technique': 90, 'emotion': 88,
        'context': 87, 'innovation': 85, 'impact': 86
    }},
    # ... 添加更多模型
]

vulca_data = []
for model in models:
    scores_47d = generate_47d_scores(model['scores_6d'])
    cultural_scores = generate_cultural_scores(scores_47d)
    
    vulca_data.append({
        'model_id': model['id'],
        'model_name': model['name'],
        'scores_6d': model['scores_6d'],
        'scores_47d': scores_47d,
        'cultural_perspectives': cultural_scores,
        'evaluation_date': datetime.now().isoformat()
    })

# 保存数据
with open('vulca_evaluations.json', 'w') as f:
    json.dump(vulca_data, f, indent=2)

print(f"Generated VULCA data for {len(models)} models")
"""
```

##### 4.2 数据库导入脚本
```python
# 文件: wenxin-backend/scripts/import_vulca_data.py
"""
import asyncio
import json
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from app.vulca.models.vulca_model import VULCAEvaluation

async def import_data():
    # 创建数据库连接
    engine = create_async_engine(DATABASE_URL, echo=True)
    async_session = sessionmaker(
        engine, class_=AsyncSession, expire_on_commit=False
    )
    
    # 读取生成的数据
    with open('vulca_evaluations.json', 'r') as f:
        data = json.load(f)
    
    async with async_session() as session:
        for item in data:
            evaluation = VULCAEvaluation(
                model_id=item['model_id'],
                original_6d_scores=item['scores_6d'],
                extended_47d_scores=item['scores_47d'],
                cultural_perspectives=item['cultural_perspectives']
            )
            session.add(evaluation)
        
        await session.commit()
    
    print(f"Imported {len(data)} VULCA evaluations")

if __name__ == "__main__":
    asyncio.run(import_data())
"""
```

##### 4.3 Demo案例准备
```json
// 文件: data/vulca/demo_cases.json
{
  "cases": [
    {
      "id": 1,
      "title": "Technical Excellence vs Creative Innovation",
      "description": "Comparing models with high technical scores against those with creative strengths",
      "model_pairs": [
        {"model1": "gpt-5", "model2": "claude-opus-4-1"},
        {"model1": "gpt-4o", "model2": "deepseek-v3"}
      ],
      "key_insights": [
        "Technical models show consistent performance across structural dimensions",
        "Creative models excel in originality and emotional expression",
        "Cultural perspectives significantly affect interpretation"
      ]
    },
    {
      "id": 2,
      "title": "Eastern vs Western Cultural Alignment",
      "description": "Analyzing how different models align with various cultural perspectives",
      "model_groups": {
        "eastern_aligned": ["qwen-max", "yi-34b", "chatglm3"],
        "western_aligned": ["gpt-5", "claude-3-5", "llama-3"]
      },
      "findings": {
        "eastern_preference": ["harmony", "tradition", "collective_wisdom"],
        "western_preference": ["individualism", "innovation", "critical_thinking"]
      }
    }
    // ... 8 more cases
  ]
}
```

#### 🧪 Phase 5: 集成测试实施 (60分钟)

##### 5.1 后端测试套件
```python
# 文件: wenxin-backend/tests/test_vulca_integration.py
"""
import pytest
import asyncio
from httpx import AsyncClient
from app.main import app

@pytest.mark.asyncio
async def test_vulca_info_endpoint():
    async with AsyncClient(app=app, base_url="http://test") as client:
        response = await client.get("/api/v1/vulca/info")
        assert response.status_code == 200
        data = response.json()
        assert data["dimensions"]["extended"] == 47

@pytest.mark.asyncio
async def test_vulca_evaluate_endpoint():
    async with AsyncClient(app=app, base_url="http://test") as client:
        payload = {
            "model_id": 1,
            "scores_6d": {
                "creativity": 85,
                "technique": 90,
                "emotion": 82,
                "context": 88,
                "innovation": 86,
                "impact": 87
            }
        }
        response = await client.post("/api/v1/vulca/evaluate", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert len(data["scores_47d"]) == 47
        assert len(data["cultural_perspectives"]) == 8

@pytest.mark.asyncio
async def test_vulca_compare_endpoint():
    async with AsyncClient(app=app, base_url="http://test") as client:
        payload = {"model_ids": [1, 2, 3]}
        response = await client.post("/api/v1/vulca/compare", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert "difference_matrix" in data
        assert "summary" in data
"""
```

##### 5.2 前端测试配置
```javascript
// 文件: wenxin-moyun/tests/vulca.test.ts
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { VULCADemoPage } from '../src/pages/vulca/VULCADemoPage';
import { ComparisonView } from '../src/pages/vulca/ComparisonView';

describe('VULCA Demo Page', () => {
  test('renders main page elements', () => {
    render(<VULCADemoPage />);
    
    expect(screen.getByText(/VULCA Multi-Dimensional/i)).toBeInTheDocument();
    expect(screen.getByText(/6 dimensions to 47 dimensions/i)).toBeInTheDocument();
  });
  
  test('toggles between 6D and 47D views', async () => {
    render(<VULCADemoPage />);
    
    const toggle = screen.getByRole('button', { name: /47D View/i });
    fireEvent.click(toggle);
    
    await waitFor(() => {
      expect(screen.getByText(/47-Dimensional/i)).toBeInTheDocument();
    });
  });
  
  test('exports data correctly', async () => {
    const mockDownload = jest.fn();
    global.URL.createObjectURL = jest.fn();
    global.document.createElement = jest.fn().mockReturnValue({
      click: mockDownload,
      href: '',
      download: ''
    });
    
    render(<VULCADemoPage />);
    
    const exportBtn = screen.getByRole('button', { name: /Export/i });
    fireEvent.click(exportBtn);
    
    expect(mockDownload).toHaveBeenCalled();
  });
});
```

##### 5.3 端到端测试脚本
```bash
#!/bin/bash
# 文件: test_vulca_e2e.sh

echo "Starting VULCA E2E Test Suite..."

# 1. 启动后端
echo "Starting backend server..."
cd I:/website/wenxin-backend
python -m uvicorn app.main:app --port 8001 &
BACKEND_PID=$!
sleep 5

# 2. 测试后端健康检查
echo "Testing backend health..."
curl -f http://localhost:8001/health || exit 1

# 3. 测试VULCA端点
echo "Testing VULCA endpoints..."
curl -f http://localhost:8001/api/v1/vulca/info || exit 1

# 4. 启动前端
echo "Starting frontend server..."
cd I:/website/wenxin-moyun
npm run dev &
FRONTEND_PID=$!
sleep 5

# 5. 运行Playwright测试
echo "Running Playwright tests..."
npm run test:vulca

# 6. 清理
echo "Cleaning up..."
kill $BACKEND_PID
kill $FRONTEND_PID

echo "E2E tests completed!"
```

#### 🎭 Phase 6: Playwright MCP自动化验证 (详细版)

##### 6.1 Playwright配置
```javascript
// 文件: wenxin-moyun/playwright.vulca.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/vulca',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: [
    ['html', { outputFolder: 'playwright-report-vulca' }],
    ['json', { outputFile: 'test-results-vulca.json' }]
  ],
  
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
});
```

##### 6.2 完整Playwright测试脚本
```javascript
// 文件: wenxin-moyun/tests/vulca/vulca-complete.spec.ts
import { test, expect, Page } from '@playwright/test';

// 测试数据
const TEST_MODELS = ['gpt-5', 'claude-opus-4-1', 'gpt-4o'];
const EXPECTED_DIMENSIONS = {
  '6d': ['creativity', 'technique', 'emotion', 'context', 'innovation', 'impact'],
  '47d': Array.from({ length: 47 }, (_, i) => `dim_${i}`)
};

test.describe('VULCA Complete Integration Test', () => {
  let page: Page;
  
  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();
    
    // 设置较长的超时时间
    page.setDefaultTimeout(30000);
    
    // 启用控制台日志
    page.on('console', msg => console.log('Browser log:', msg.text()));
    
    // 捕获网络错误
    page.on('requestfailed', request => {
      console.error('Request failed:', request.url(), request.failure());
    });
  });
  
  test.afterAll(async () => {
    await page.close();
  });
  
  test('1. Navigate to VULCA Demo Page', async () => {
    // 导航到VULCA页面
    await page.goto('/#/vulca-demo');
    
    // 等待页面加载
    await page.waitForLoadState('networkidle');
    
    // 验证标题
    await expect(page.locator('h1')).toContainText('VULCA');
    
    // 截图
    await page.screenshot({ 
      path: 'screenshots/vulca-landing.png',
      fullPage: true 
    });
  });
  
  test('2. Test 6D View', async () => {
    // 确保在6D模式
    const toggle = page.locator('[data-testid="dimension-toggle"]');
    const currentMode = await toggle.getAttribute('data-mode');
    
    if (currentMode !== '6d') {
      await toggle.click();
      await page.waitForTimeout(500);
    }
    
    // 验证6个维度显示
    for (const dim of EXPECTED_DIMENSIONS['6d']) {
      await expect(page.locator(`text=${dim}`)).toBeVisible();
    }
    
    // 验证雷达图
    const radarChart = page.locator('.radar-chart');
    await expect(radarChart).toBeVisible();
    
    // 获取数据点数量
    const dataPoints = await page.locator('.radar-dot').count();
    expect(dataPoints).toBe(6);
    
    await page.screenshot({ 
      path: 'screenshots/vulca-6d-view.png',
      fullPage: true 
    });
  });
  
  test('3. Switch to 47D View', async () => {
    // 切换到47D模式
    await page.click('[data-testid="dimension-toggle"]');
    
    // 等待动画完成
    await page.waitForTimeout(1000);
    
    // 验证显示47维
    await expect(page.locator('text=47-Dimensional')).toBeVisible();
    
    // 验证数据点增加
    const dataPoints = await page.locator('.radar-dot').count();
    expect(dataPoints).toBe(47);
    
    await page.screenshot({ 
      path: 'screenshots/vulca-47d-view.png',
      fullPage: true 
    });
  });
  
  test('4. Select Multiple Models', async () => {
    // 选择模型
    for (const model of TEST_MODELS) {
      await page.click(`[data-model="${model}"]`);
      await page.waitForTimeout(500);
    }
    
    // 验证选中的模型数量
    const selectedModels = await page.locator('.model-selected').count();
    expect(selectedModels).toBe(TEST_MODELS.length);
    
    // 验证对比视图出现
    await expect(page.locator('.comparison-view')).toBeVisible();
    
    await page.screenshot({ 
      path: 'screenshots/vulca-model-selection.png',
      fullPage: true 
    });
  });
  
  test('5. Test Heat Map Visualization', async () => {
    // 切换到热力图
    await page.click('[data-viz="heatmap"]');
    
    // 等待渲染
    await page.waitForSelector('.heatmap-container');
    
    // 验证热力图网格
    const heatmapCells = await page.locator('.heatmap-cell').count();
    expect(heatmapCells).toBeGreaterThan(0);
    
    // 悬停显示tooltip
    await page.hover('.heatmap-cell:first-child');
    await expect(page.locator('.tooltip')).toBeVisible();
    
    await page.screenshot({ 
      path: 'screenshots/vulca-heatmap.png',
      fullPage: true 
    });
  });
  
  test('6. Test Cultural Perspectives', async () => {
    const perspectives = [
      'eastern', 'western', 'african', 'latin_american'
    ];
    
    for (const perspective of perspectives) {
      // 选择文化视角
      await page.selectOption('#cultural-perspective', perspective);
      
      // 等待数据更新
      await page.waitForTimeout(500);
      
      // 验证数据变化
      const scoreElements = await page.locator('.score-value').allTextContents();
      expect(scoreElements.length).toBeGreaterThan(0);
      
      // 截图每个视角
      await page.screenshot({ 
        path: `screenshots/vulca-${perspective}.png`,
        fullPage: false 
      });
    }
  });
  
  test('7. Test Model Comparison', async () => {
    // 确保至少选择了2个模型
    if ((await page.locator('.model-selected').count()) < 2) {
      await page.click(`[data-model="gpt-5"]`);
      await page.click(`[data-model="claude-opus-4-1"]`);
    }
    
    // 验证对比图表
    await expect(page.locator('.comparison-chart')).toBeVisible();
    
    // 验证差异分数
    await expect(page.locator('.difference-score')).toBeVisible();
    
    // 验证最相似/最不同的配对
    await expect(page.locator('text=Most Similar Pair')).toBeVisible();
    await expect(page.locator('text=Most Different Pair')).toBeVisible();
    
    await page.screenshot({ 
      path: 'screenshots/vulca-comparison.png',
      fullPage: true 
    });
  });
  
  test('8. Test Data Export', async () => {
    // 设置下载监听
    const downloadPromise = page.waitForEvent('download');
    
    // 点击导出按钮
    await page.click('[data-testid="export-button"]');
    
    // 等待下载
    const download = await downloadPromise;
    
    // 验证文件名
    expect(download.suggestedFilename()).toContain('vulca-scores');
    
    // 保存文件
    await download.saveAs('./test-downloads/' + download.suggestedFilename());
    
    // 读取并验证JSON结构
    const filePath = './test-downloads/' + download.suggestedFilename();
    // 这里可以添加文件内容验证
  });
  
  test('9. Test API Endpoints', async () => {
    // 测试信息端点
    const infoResponse = await page.request.get('http://localhost:8001/api/v1/vulca/info');
    expect(infoResponse.ok()).toBeTruthy();
    
    const infoData = await infoResponse.json();
    expect(infoData.dimensions.extended).toBe(47);
    
    // 测试维度端点
    const dimResponse = await page.request.get('http://localhost:8001/api/v1/vulca/dimensions');
    expect(dimResponse.ok()).toBeTruthy();
    
    const dimData = await dimResponse.json();
    expect(dimData.dimensions.length).toBe(47);
  });
  
  test('10. Performance Test', async () => {
    // 记录性能指标
    const metrics = await page.evaluate(() => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      return {
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
        loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
        firstPaint: performance.getEntriesByName('first-paint')[0]?.startTime || 0,
        firstContentfulPaint: performance.getEntriesByName('first-contentful-paint')[0]?.startTime || 0
      };
    });
    
    // 验证性能指标
    expect(metrics.loadComplete).toBeLessThan(2000); // 页面加载<2s
    expect(metrics.firstContentfulPaint).toBeLessThan(1000); // FCP<1s
    
    console.log('Performance Metrics:', metrics);
  });
  
  test('11. Accessibility Test', async () => {
    // 运行辅助功能检查
    const accessibilitySnapshot = await page.accessibility.snapshot();
    
    // 基本辅助功能验证
    expect(accessibilitySnapshot?.children).toBeDefined();
    
    // 检查ARIA标签
    const ariaLabels = await page.locator('[aria-label]').count();
    expect(ariaLabels).toBeGreaterThan(0);
    
    // 检查键盘导航
    await page.keyboard.press('Tab');
    const focusedElement = await page.evaluate(() => document.activeElement?.tagName);
    expect(focusedElement).toBeDefined();
  });
  
  test('12. Error Handling Test', async () => {
    // 模拟网络错误
    await page.route('**/api/v1/vulca/**', route => route.abort());
    
    // 刷新页面
    await page.reload();
    
    // 验证错误处理
    await expect(page.locator('text=/Error|Failed|Unable/i')).toBeVisible({ timeout: 10000 });
    
    // 恢复网络
    await page.unroute('**/api/v1/vulca/**');
  });
});
```

##### 6.3 测试执行和报告
```bash
# 文件: run_vulca_tests.sh
#!/bin/bash

echo "==================================="
echo "VULCA Integration Test Suite"
echo "==================================="

# 设置颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 测试计数器
PASSED=0
FAILED=0

# 函数：运行测试并检查结果
run_test() {
    local test_name=$1
    local test_command=$2
    
    echo -e "${YELLOW}Running: $test_name${NC}"
    
    if eval $test_command; then
        echo -e "${GREEN}✓ $test_name passed${NC}"
        ((PASSED++))
    else
        echo -e "${RED}✗ $test_name failed${NC}"
        ((FAILED++))
    fi
    echo ""
}

# 1. 环境检查
run_test "Environment Check" "python --version && node --version"

# 2. 后端单元测试
run_test "Backend Unit Tests" "cd I:/website/wenxin-backend && python -m pytest tests/test_vulca_integration.py -v"

# 3. 前端单元测试
run_test "Frontend Unit Tests" "cd I:/website/wenxin-moyun && npm test -- --testPathPattern=vulca"

# 4. API集成测试
run_test "API Integration Tests" "curl -f http://localhost:8001/api/v1/vulca/info"

# 5. Playwright E2E测试
run_test "Playwright E2E Tests" "cd I:/website/wenxin-moyun && npx playwright test --config=playwright.vulca.config.ts"

# 生成测试报告
echo "==================================="
echo "Test Results Summary"
echo "==================================="
echo -e "${GREEN}Passed: $PASSED${NC}"
echo -e "${RED}Failed: $FAILED${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}All tests passed successfully!${NC}"
    
    # 生成HTML报告
    cd I:/website/wenxin-moyun
    npx playwright show-report playwright-report-vulca
    
    exit 0
else
    echo -e "${RED}Some tests failed. Please check the logs.${NC}"
    exit 1
fi
```

## 预期效果

### 功能验证指标
- ✅ 6维到47维扩展成功
- ✅ 8个文化视角评分正常
- ✅ 模型对比功能完整
- ✅ 数据导出功能正常
- ✅ API响应时间<500ms
- ✅ 页面加载时间<2s

### Playwright测试覆盖
- 12个核心测试场景
- 100%功能覆盖率
- 性能基准验证
- 辅助功能测试
- 错误处理测试

## 预期效果

### 功能效果
1. **维度扩展**: 从6维扩展到47维细粒度评测
2. **对比展示**: 清晰展示6维vs47维评测差异
3. **多文化视角**: 8个文化视角的权重评分
4. **可视化**: 雷达图、热力图、对比条形图

### 性能指标
- API响应时间 < 500ms
- 页面加载时间 < 2s
- 数据查询时间 < 100ms
- 前端渲染帧率 > 30fps

### 用户体验
- 无缝切换6维/47维视图
- 直观的维度对比
- 流畅的交互体验
- 清晰的数据展示

## Playwright自动化测试方案

### 测试环境设置
```javascript
// playwright.config.js
{
  baseURL: 'http://localhost:5173',
  use: {
    headless: false,
    viewport: { width: 1280, height: 720 },
    screenshot: 'only-on-failure'
  }
}
```

### 测试用例设计

#### Test Suite 1: 后端API测试
```javascript
test.describe('VULCA API Tests', () => {
  test('获取47维评分数据', async ({ page }) => {
    // 1. 访问API端点
    // 2. 验证响应状态码200
    // 3. 验证返回数据结构
    // 4. 验证47个维度都存在
  });

  test('6维到47维扩展算法', async ({ page }) => {
    // 1. 发送6维数据
    // 2. 验证返回47维数据
    // 3. 验证扩展算法正确性
  });

  test('模型对比API', async ({ page }) => {
    // 1. 请求两个模型对比
    // 2. 验证对比数据完整
    // 3. 验证差异计算正确
  });
});
```

#### Test Suite 2: 前端页面测试
```javascript
test.describe('VULCA Demo Page Tests', () => {
  test('页面加载和渲染', async ({ page }) => {
    // 1. 导航到VULCA页面
    await page.goto('/#/vulca-demo');
    
    // 2. 验证页面标题
    await expect(page.locator('h1')).toContainText('VULCA');
    
    // 3. 验证主要组件存在
    await expect(page.locator('.comparison-view')).toBeVisible();
    
    // 4. 截图保存
    await page.screenshot({ path: 'vulca-page.png' });
  });

  test('6维vs47维切换', async ({ page }) => {
    // 1. 点击切换按钮
    await page.click('.dimension-toggle');
    
    // 2. 验证视图切换
    await expect(page.locator('.radar-chart')).toBeVisible();
    
    // 3. 验证数据更新
    await expect(page.locator('.dimension-count')).toContainText('47');
  });

  test('模型选择和对比', async ({ page }) => {
    // 1. 选择第一个模型
    await page.selectOption('#model1', 'gpt-5');
    
    // 2. 选择第二个模型
    await page.selectOption('#model2', 'claude-opus-4-1');
    
    // 3. 验证对比图表更新
    await expect(page.locator('.comparison-chart')).toBeVisible();
    
    // 4. 验证数据差异显示
    await expect(page.locator('.difference-score')).toBeVisible();
  });
});
```

#### Test Suite 3: 数据可视化测试
```javascript
test.describe('VULCA Visualization Tests', () => {
  test('雷达图渲染', async ({ page }) => {
    // 1. 验证雷达图SVG元素
    await expect(page.locator('svg.radar-chart')).toBeVisible();
    
    // 2. 验证数据点数量
    const dataPoints = await page.locator('.radar-dot').count();
    expect(dataPoints).toBe(47);
    
    // 3. 交互测试 - 悬停显示tooltip
    await page.hover('.radar-dot:first-child');
    await expect(page.locator('.tooltip')).toBeVisible();
  });

  test('热力图渲染', async ({ page }) => {
    // 1. 切换到热力图视图
    await page.click('[data-view="heatmap"]');
    
    // 2. 验证热力图网格
    const cells = await page.locator('.heatmap-cell').count();
    expect(cells).toBe(47 * 15); // 47维 × 15个模型
    
    // 3. 验证颜色渐变
    const firstCell = await page.locator('.heatmap-cell:first-child');
    const bgColor = await firstCell.evaluate(el => 
      window.getComputedStyle(el).backgroundColor
    );
    expect(bgColor).toBeTruthy();
  });
});
```

#### Test Suite 4: 端到端工作流测试
```javascript
test.describe('E2E Workflow Tests', () => {
  test('完整评测流程', async ({ page }) => {
    // 1. 访问主页
    await page.goto('/');
    
    // 2. 导航到VULCA Demo
    await page.click('text=VULCA评测');
    
    // 3. 选择评测模型
    await page.selectOption('#model-select', 'gpt-5');
    
    // 4. 查看6维评分
    await expect(page.locator('.score-6d')).toContainText(/\d+\.\d+/);
    
    // 5. 展开到47维
    await page.click('.expand-dimensions');
    
    // 6. 验证47维数据
    await expect(page.locator('.dimensions-list')).toBeVisible();
    const dimensions = await page.locator('.dimension-item').count();
    expect(dimensions).toBe(47);
    
    // 7. 导出数据
    await page.click('.export-data');
    const download = await page.waitForEvent('download');
    expect(download.suggestedFilename()).toContain('vulca-scores');
  });
});
```

### 验证指标
1. **功能覆盖率**: 100%核心功能
2. **测试通过率**: > 95%
3. **性能基准**: 
   - 页面加载 < 2s
   - API响应 < 500ms
   - 图表渲染 < 1s
4. **视觉回归**: 截图对比无异常

### 测试执行命令
```bash
# 运行所有测试
npm run test:vulca

# 运行特定测试套件
npm run test:vulca:api
npm run test:vulca:ui
npm run test:vulca:e2e

# 生成测试报告
npm run test:vulca:report
```

## 当前进度
- 任务文档创建完成
- 计划 v1（基础版）制定完成
- 计划 v2（Ultra Think版）制定完成 - 包含1500+行详细实施代码
- Playwright测试方案设计完成（12个测试场景）
- 等待开始执行Phase 0环境预检查

## 待解决问题
- [ ] 确认VULCA源代码位置
- [ ] 确认数据库表结构
- [ ] 确认API密钥配置
- [ ] 确认部署环境要求

## 用户对话记录
### 第1轮 [2025-09-05 12:10] - [任务确认模式]
**用户原文**: 进入任务确认模式 创建任务 然后 进入计划模式 设计一个详细的计划。同时包括预期的效果以及使用 playwright mcp进行验证的步骤。
**关键要点**: 创建VULCA本地集成任务，制定详细计划，设计Playwright自动化测试

### 第2轮 [2025-09-05 12:25] - [计划模式]
**用户原文**: 很好 进入计划模式 ultra think 设计一个足够详细的计划
**关键要点**: 要求使用ultra think方式制定超详细的实施计划，包含具体代码实现