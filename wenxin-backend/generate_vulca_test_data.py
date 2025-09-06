"""
Generate VULCA test data for integration verification
"""

import asyncio
import json
import random
from datetime import datetime
from typing import Dict, Any

import httpx
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import AsyncSessionLocal
from app.models.ai_model import AIModel
from app.services.vulca_sync_service import VULCASyncService

# VULCA评估测试数据生成器
class VULCATestDataGenerator:
    """生成VULCA测试数据用于集成验证"""
    
    def __init__(self):
        self.sync_service = VULCASyncService()
        
    def generate_47d_scores(self) -> Dict[str, float]:
        """生成47维评分数据"""
        dimensions = [
            # Creativity dimensions (8)
            "originality", "imagination", "innovation", "uniqueness",
            "artistic_vision", "creative_risk", "experimental_approach", "boundary_pushing",
            
            # Technical dimensions (8)
            "technical_precision", "skill_mastery", "craftsmanship", "execution_quality",
            "professional_polish", "technical_innovation", "medium_expertise", "tool_proficiency",
            
            # Emotional dimensions (8)
            "emotional_depth", "empathy", "mood_conveyance", "feeling_authenticity",
            "emotional_range", "sentiment_clarity", "psychological_insight", "emotional_resonance",
            
            # Contextual dimensions (8)
            "cultural_relevance", "historical_awareness", "social_commentary", "contemporary_significance",
            "contextual_appropriateness", "cultural_sensitivity", "global_perspective", "local_authenticity",
            
            # Innovation dimensions (8)
            "novelty", "trendsetting", "paradigm_shift", "breakthrough_thinking",
            "future_orientation", "disruptive_potential", "revolutionary_approach", "pioneering_spirit",
            
            # Impact dimensions (7)
            "audience_engagement", "memorable_impression", "lasting_influence", "transformative_power",
            "inspirational_value", "thought_provocation", "behavioral_impact"
        ]
        
        # 生成具有一定模式的评分
        base_score = random.uniform(70, 95)
        scores = {}
        for dimension in dimensions:
            # 添加一些随机变化
            variation = random.uniform(-10, 10)
            score = max(0, min(100, base_score + variation))
            scores[dimension] = round(score, 2)
        
        return scores
    
    def generate_cultural_perspectives(self) -> Dict[str, float]:
        """生成8个文化视角评分"""
        perspectives = {
            "western": random.uniform(75, 95),
            "eastern": random.uniform(70, 90),
            "african": random.uniform(65, 85),
            "latin": random.uniform(70, 88),
            "indigenous": random.uniform(60, 80),
            "modern": random.uniform(80, 95),
            "traditional": random.uniform(65, 85),
            "global": random.uniform(75, 92)
        }
        
        return {k: round(v, 2) for k, v in perspectives.items()}
    
    def generate_6d_scores(self) -> Dict[str, float]:
        """生成6维基础评分"""
        return {
            "creativity": random.uniform(75, 95),
            "technique": random.uniform(70, 92),
            "emotion": random.uniform(72, 90),
            "context": random.uniform(68, 88),
            "innovation": random.uniform(73, 93),
            "impact": random.uniform(70, 91)
        }
    
    async def generate_for_model(self, model_id: str, model_name: str) -> Dict[str, Any]:
        """为单个模型生成VULCA数据"""
        vulca_data = {
            "model_id": model_id,
            "model_name": model_name,
            "scores_6d": self.generate_6d_scores(),
            "scores_47d": self.generate_47d_scores(),
            "cultural_perspectives": self.generate_cultural_perspectives(),
            "evaluation_date": datetime.utcnow().isoformat(),
            "evaluation_type": "test_data",
            "confidence_score": random.uniform(0.85, 0.98)
        }
        
        return vulca_data
    
    async def sync_to_database(self, vulca_data: Dict[str, Any]) -> bool:
        """同步VULCA数据到数据库"""
        async with AsyncSessionLocal() as db:
            try:
                # 使用同步服务更新数据
                success = await self.sync_service.sync_evaluation_to_model(
                    model_id=vulca_data["model_id"],
                    vulca_evaluation=vulca_data,
                    db=db
                )
                
                if success:
                    print(f"[SUCCESS] Synced VULCA data for {vulca_data['model_name']}")
                else:
                    print(f"[FAILED] Failed to sync {vulca_data['model_name']}")
                
                return success
                
            except Exception as e:
                print(f"Error syncing {vulca_data['model_name']}: {e}")
                return False
    
    async def generate_test_data(self, limit: int = 5):
        """生成测试数据并同步到数据库"""
        async with AsyncSessionLocal() as db:
            # 获取前N个模型
            result = await db.execute(
                select(AIModel)
                .where(AIModel.is_active == True)
                .order_by(AIModel.overall_score.desc())
                .limit(limit)
            )
            models = result.scalars().all()
            
            if not models:
                print("No models found in database")
                return
            
            print(f"\nGenerating VULCA test data for {len(models)} models...\n")
            
            results = []
            for model in models:
                # 生成VULCA数据
                vulca_data = await self.generate_for_model(model.id, model.name)
                
                # 同步到数据库
                success = await self.sync_to_database(vulca_data)
                
                results.append({
                    "model": model.name,
                    "success": success,
                    "data": vulca_data if success else None
                })
                
                # 短暂延迟避免过快
                await asyncio.sleep(0.5)
            
            # 保存结果到文件
            with open("vulca_test_data_results.json", "w", encoding="utf-8") as f:
                json.dump(results, f, indent=2, ensure_ascii=False, default=str)
            
            # 打印摘要
            successful = sum(1 for r in results if r["success"])
            print(f"\nSummary:")
            print(f"  Total models: {len(models)}")
            print(f"  Successful syncs: {successful}")
            print(f"  Failed syncs: {len(models) - successful}")
            print(f"  Results saved to: vulca_test_data_results.json")
            
            # 测试API端点
            await self.test_api_endpoints()
    
    async def test_api_endpoints(self):
        """测试API端点确认集成效果"""
        print(f"\nTesting API endpoints...\n")
        
        async with httpx.AsyncClient(base_url="http://localhost:8001") as client:
            try:
                # 测试获取模型列表（包含VULCA数据）
                response = await client.get("/api/v1/models?include_vulca=true&limit=5")
                if response.status_code == 200:
                    models = response.json()
                    vulca_count = sum(1 for m in models if m.get("vulca_scores_47d"))
                    print(f"[OK] /api/v1/models: {len(models)} models, {vulca_count} with VULCA data")
                else:
                    print(f"[ERROR] /api/v1/models failed: {response.status_code}")
                
                # 测试单个模型（包含VULCA）
                if models:
                    model_id = models[0]["id"]
                    response = await client.get(f"/api/v1/models/{model_id}?include_vulca=true")
                    if response.status_code == 200:
                        model = response.json()
                        has_vulca = "vulca_scores_47d" in model and model["vulca_scores_47d"]
                        print(f"[OK] /api/v1/models/{model_id}: {'Has' if has_vulca else 'No'} VULCA data")
                    else:
                        print(f"[ERROR] /api/v1/models/{model_id} failed: {response.status_code}")
                
            except Exception as e:
                print(f"[ERROR] API test failed: {e}")


async def main():
    """主函数"""
    generator = VULCATestDataGenerator()
    
    # 生成前10个模型的测试数据
    await generator.generate_test_data(limit=10)


if __name__ == "__main__":
    print("=" * 60)
    print("VULCA Integration Test Data Generator")
    print("=" * 60)
    asyncio.run(main())