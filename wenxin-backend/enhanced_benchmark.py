"""
增强版OpenAI模型基准测试
包含6维度评分和详细内容分析
"""
import asyncio
import json
import time
from datetime import datetime
from typing import Dict, List, Any, Optional
from app.services.models import UnifiedModelClient, model_registry, load_all_models
from app.services.intelligent_scoring.ai_scorer import IntelligentScorer

# 6维度测试用例定义
DIMENSION_TEST_CASES = {
    "rhythm": {
        "name": "韵律节奏",
        "weight": 1.0,
        "test_cases": [
            {
                "id": "rhythm_001",
                "prompt": "请创作一首五言绝句，描写春天的早晨，要求格律工整，韵律优美",
                "max_tokens": 100,
                "temperature": 0.7,
                "evaluation_criteria": ["格律准确性", "音韵和谐度", "节奏流畅性"],
                "scoring_prompt": "评估这首诗的格律、韵律和节奏，给出0-100分"
            },
            {
                "id": "rhythm_002",
                "prompt": "将这段话改写为押韵的诗句：'阳光穿过树叶洒在小路上，微风轻轻吹动花朵摇晃'",
                "max_tokens": 100,
                "temperature": 0.7,
                "evaluation_criteria": ["韵脚运用", "平仄搭配", "意境保留"],
                "scoring_prompt": "评估改写后的韵律质量，给出0-100分"
            },
            {
                "id": "rhythm_003",
                "prompt": "创作一段朗朗上口的广告词，推广环保理念，要求有韵律感",
                "max_tokens": 80,
                "temperature": 0.8,
                "evaluation_criteria": ["韵律感", "记忆度", "节奏感"],
                "scoring_prompt": "评估广告词的韵律和节奏感，给出0-100分"
            }
        ]
    },
    "composition": {
        "name": "构图布局",
        "weight": 1.0,
        "test_cases": [
            {
                "id": "comp_001",
                "prompt": "描述一幅中国山水画的构图，包含远山、近水、亭台、树木，要求层次分明",
                "max_tokens": 200,
                "temperature": 0.7,
                "evaluation_criteria": ["空间层次", "布局平衡", "细节描写"],
                "scoring_prompt": "评估描述的构图质量和空间感，给出0-100分"
            },
            {
                "id": "comp_002",
                "prompt": "设计一个产品介绍页面的布局，包括标题、图片、特点、价格等元素的排列",
                "max_tokens": 200,
                "temperature": 0.7,
                "evaluation_criteria": ["布局合理性", "视觉层次", "信息组织"],
                "scoring_prompt": "评估布局设计的合理性和美观度，给出0-100分"
            },
            {
                "id": "comp_003",
                "prompt": "描述一个舞台剧的场景布置，包括道具摆放、灯光设计、演员站位",
                "max_tokens": 200,
                "temperature": 0.7,
                "evaluation_criteria": ["空间利用", "视觉焦点", "整体协调"],
                "scoring_prompt": "评估舞台布置的构图效果，给出0-100分"
            }
        ]
    },
    "narrative": {
        "name": "叙事逻辑",
        "weight": 1.0,
        "test_cases": [
            {
                "id": "narr_001",
                "prompt": "续写故事：'深夜，图书馆的灯突然全部熄灭了，小明听到书架后传来奇怪的声音...' 要求情节连贯，有悬念",
                "max_tokens": 300,
                "temperature": 0.8,
                "evaluation_criteria": ["情节连贯性", "逻辑合理性", "悬念设置"],
                "scoring_prompt": "评估故事的叙事逻辑和情节发展，给出0-100分"
            },
            {
                "id": "narr_002",
                "prompt": "用倒叙手法讲述一个关于'错过的机会'的故事，要求结构清晰",
                "max_tokens": 300,
                "temperature": 0.8,
                "evaluation_criteria": ["叙事结构", "时间线清晰", "因果关系"],
                "scoring_prompt": "评估叙事结构和逻辑的清晰度，给出0-100分"
            },
            {
                "id": "narr_003",
                "prompt": "写一个包含转折的微型小说，200字以内，要求有开端、发展、高潮、结局",
                "max_tokens": 250,
                "temperature": 0.8,
                "evaluation_criteria": ["故事完整性", "转折合理性", "节奏控制"],
                "scoring_prompt": "评估故事结构的完整性和转折的巧妙程度，给出0-100分"
            }
        ]
    },
    "emotion": {
        "name": "情感表达",
        "weight": 1.0,
        "test_cases": [
            {
                "id": "emo_001",
                "prompt": "写一段关于'乡愁'的散文，要求情感真挚，能引起共鸣，200字左右",
                "max_tokens": 250,
                "temperature": 0.8,
                "evaluation_criteria": ["情感真挚度", "共鸣能力", "表达细腻度"],
                "scoring_prompt": "评估文字的情感表达力和感染力，给出0-100分"
            },
            {
                "id": "emo_002",
                "prompt": "描写一个人收到意外惊喜时的心理活动和表情变化",
                "max_tokens": 200,
                "temperature": 0.8,
                "evaluation_criteria": ["心理描写", "情绪转换", "细节刻画"],
                "scoring_prompt": "评估情感描写的生动性和准确性，给出0-100分"
            },
            {
                "id": "emo_003",
                "prompt": "写一封道歉信，表达真诚的歉意和改正的决心",
                "max_tokens": 200,
                "temperature": 0.7,
                "evaluation_criteria": ["诚意表达", "情感适度", "语气恰当"],
                "scoring_prompt": "评估情感表达的恰当性和真诚度，给出0-100分"
            }
        ]
    },
    "creativity": {
        "name": "创意创新",
        "weight": 1.0,
        "test_cases": [
            {
                "id": "create_001",
                "prompt": "设想一个全新的节日，描述它的起源、庆祝方式、特色活动和文化意义",
                "max_tokens": 300,
                "temperature": 0.9,
                "evaluation_criteria": ["独创性", "想象力", "可行性"],
                "scoring_prompt": "评估创意的新颖程度和想象力，给出0-100分"
            },
            {
                "id": "create_002",
                "prompt": "设计一种结合了三种不同动物特征的幻想生物，描述其外观、习性和栖息地",
                "max_tokens": 250,
                "temperature": 0.9,
                "evaluation_criteria": ["创造力", "细节想象", "内在逻辑"],
                "scoring_prompt": "评估设计的创意性和想象的丰富度，给出0-100分"
            },
            {
                "id": "create_003",
                "prompt": "提出一个解决城市交通拥堵的创新方案，要求与现有方案不同",
                "max_tokens": 250,
                "temperature": 0.8,
                "evaluation_criteria": ["创新性", "实用性", "独特视角"],
                "scoring_prompt": "评估方案的创新程度和独特性，给出0-100分"
            }
        ]
    },
    "cultural": {
        "name": "文化契合",
        "weight": 1.0,
        "test_cases": [
            {
                "id": "culture_001",
                "prompt": "解释'君子和而不同'的含义，并举现代生活中的例子说明",
                "max_tokens": 250,
                "temperature": 0.7,
                "evaluation_criteria": ["文化理解", "现代诠释", "例证恰当"],
                "scoring_prompt": "评估对中国文化的理解深度和诠释准确性，给出0-100分"
            },
            {
                "id": "culture_002",
                "prompt": "描述中秋节的传统习俗，并说明其文化内涵",
                "max_tokens": 250,
                "temperature": 0.7,
                "evaluation_criteria": ["文化知识", "内涵理解", "表达准确"],
                "scoring_prompt": "评估对传统文化的了解和理解程度，给出0-100分"
            },
            {
                "id": "culture_003",
                "prompt": "用现代语言重新诠释'知行合一'的哲学思想，并说明其现实意义",
                "max_tokens": 250,
                "temperature": 0.7,
                "evaluation_criteria": ["哲学理解", "现代转化", "实践意义"],
                "scoring_prompt": "评估对传统哲学的理解和现代化诠释能力，给出0-100分"
            }
        ]
    }
}

class EnhancedBenchmarkRunner:
    def __init__(self):
        self.client = UnifiedModelClient()
        self.scorer = IntelligentScorer()
        self.models = [
            "gpt-5", "gpt-5-mini", "gpt-5-nano",
            "o1", "o1-mini", "o3-mini",
            "gpt-4o", "gpt-4o-mini", "gpt-4-turbo", 
            "gpt-4", "gpt-4.5"
        ]
        
    async def run_single_test(self, model_id: str, test_case: Dict) -> Dict:
        """运行单个测试用例"""
        try:
            # 1. 调用模型生成内容
            start_time = time.time()
            response = await self.client.generate(
                model_id=model_id,
                prompt=test_case["prompt"],
                max_tokens=test_case.get("max_tokens", 200),
                temperature=test_case.get("temperature", 0.7)
            )
            elapsed_time = time.time() - start_time
            
            # response是字典，需要从中提取content
            response_content = response.get("content", "")
            tokens_used = response.get("tokens_used", 0)
            
            # 2. 使用GPT-4o-mini评分
            score = await self.scorer.score(
                prompt=test_case["prompt"],
                response=response_content,
                criteria=test_case.get("evaluation_criteria", []),
                scoring_prompt=test_case.get("scoring_prompt", "Rate this response from 0-100")
            )
            
            # 3. 获取详细分析
            analysis = await self.scorer.analyze_response(
                response_content,
                test_case.get("evaluation_criteria", [])
            )
            
            return {
                "test_id": test_case["id"],
                "prompt": test_case["prompt"],
                "response": response_content,
                "score": score,
                "analysis": analysis,
                "response_time": elapsed_time,
                "tokens_used": tokens_used,
                "timestamp": datetime.now().isoformat()
            }
            
        except Exception as e:
            print(f"Error in test {test_case['id']} for model {model_id}: {e}")
            return {
                "test_id": test_case["id"],
                "prompt": test_case["prompt"],
                "response": None,
                "score": 0,
                "error": str(e),
                "timestamp": datetime.now().isoformat()
            }
    
    async def run_dimension_tests(self, model_id: str, dimension: str, test_cases: List[Dict]) -> Dict:
        """运行某个维度的所有测试"""
        print(f"  Testing dimension: {dimension}")
        results = []
        scores = []
        
        for test_case in test_cases:
            result = await self.run_single_test(model_id, test_case)
            results.append(result)
            if result.get("score"):
                scores.append(result["score"])
            
            # 添加延迟避免API限流
            await asyncio.sleep(1)
        
        # 计算维度平均分
        avg_score = sum(scores) / len(scores) if scores else 0
        
        return {
            "dimension": dimension,
            "average_score": avg_score,
            "test_results": results,
            "test_count": len(test_cases),
            "success_count": len(scores)
        }
    
    async def run_model_benchmark(self, model_id: str) -> Dict:
        """运行单个模型的完整基准测试"""
        print(f"\nTesting model: {model_id}")
        print("-" * 40)
        
        model_results = {
            "model_id": model_id,
            "timestamp": datetime.now().isoformat(),
            "dimensions": {},
            "metrics": {},
            "overall_score": 0,
            "test_summary": {
                "total_tests": 0,
                "successful_tests": 0,
                "total_time": 0
            }
        }
        
        total_time = 0
        
        # 测试每个维度
        for dimension, config in DIMENSION_TEST_CASES.items():
            start_time = time.time()
            
            dimension_result = await self.run_dimension_tests(
                model_id, 
                dimension,
                config["test_cases"]
            )
            
            elapsed = time.time() - start_time
            total_time += elapsed
            
            model_results["dimensions"][dimension] = dimension_result
            model_results["metrics"][dimension] = dimension_result["average_score"]
            
            print(f"    {dimension}: {dimension_result['average_score']:.1f} ({elapsed:.1f}s)")
        
        # 计算总分
        if model_results["metrics"]:
            model_results["overall_score"] = sum(model_results["metrics"].values()) / len(model_results["metrics"])
        
        # 更新统计信息
        model_results["test_summary"]["total_tests"] = sum(
            len(config["test_cases"]) for config in DIMENSION_TEST_CASES.values()
        )
        model_results["test_summary"]["successful_tests"] = sum(
            d["success_count"] for d in model_results["dimensions"].values()
        )
        model_results["test_summary"]["total_time"] = total_time
        
        print(f"  Overall Score: {model_results['overall_score']:.1f}")
        print(f"  Total Time: {total_time:.1f}s")
        
        return model_results
    
    async def run_complete_benchmark(self):
        """运行完整的基准测试"""
        print("\n" + "="*50)
        print("Enhanced OpenAI Model Benchmark")
        print("="*50)
        
        # 加载模型配置
        load_all_models()
        
        all_results = {
            "benchmark_id": f"enhanced_{datetime.now().strftime('%Y%m%d_%H%M%S')}",
            "start_time": datetime.now().isoformat(),
            "models": {}
        }
        
        # 测试每个模型
        for model_id in self.models:
            try:
                model_result = await self.run_model_benchmark(model_id)
                all_results["models"][model_id] = model_result
                
                # 保存中间结果
                with open(f"enhanced_benchmark_partial_{model_id}.json", "w", encoding="utf-8") as f:
                    json.dump(model_result, f, indent=2, ensure_ascii=False)
                    
            except Exception as e:
                print(f"Failed to test {model_id}: {e}")
                all_results["models"][model_id] = {
                    "error": str(e),
                    "timestamp": datetime.now().isoformat()
                }
        
        all_results["end_time"] = datetime.now().isoformat()
        
        # 保存完整结果
        output_file = "enhanced_benchmark_results.json"
        with open(output_file, "w", encoding="utf-8") as f:
            json.dump(all_results, f, indent=2, ensure_ascii=False)
        
        print(f"\n{'='*50}")
        print(f"Benchmark completed!")
        print(f"Results saved to: {output_file}")
        
        # 生成摘要报告
        self.generate_summary_report(all_results)
        
        return all_results
    
    def generate_summary_report(self, results: Dict):
        """生成摘要报告"""
        print("\n" + "="*50)
        print("BENCHMARK SUMMARY")
        print("="*50)
        
        # 收集所有模型的分数
        model_scores = []
        for model_id, data in results["models"].items():
            if "overall_score" in data and data["overall_score"] > 0:
                model_scores.append({
                    "model": model_id,
                    "overall": data["overall_score"],
                    "metrics": data.get("metrics", {})
                })
        
        # 按总分排序
        model_scores.sort(key=lambda x: x["overall"], reverse=True)
        
        # 打印排名
        print("\nModel Rankings:")
        print("-" * 40)
        for i, item in enumerate(model_scores, 1):
            print(f"{i}. {item['model']:<15} Overall: {item['overall']:.1f}")
            if item["metrics"]:
                metrics_str = " | ".join([f"{k}: {v:.1f}" for k, v in item["metrics"].items()])
                print(f"   {metrics_str}")
        
        # 维度分析
        print("\nDimension Analysis:")
        print("-" * 40)
        for dimension in DIMENSION_TEST_CASES.keys():
            scores = []
            for model_id, data in results["models"].items():
                if "metrics" in data and dimension in data["metrics"]:
                    scores.append(data["metrics"][dimension])
            
            if scores:
                avg = sum(scores) / len(scores)
                print(f"{dimension:<12} Avg: {avg:.1f} | Max: {max(scores):.1f} | Min: {min(scores):.1f}")

async def main():
    runner = EnhancedBenchmarkRunner()
    await runner.run_complete_benchmark()

if __name__ == "__main__":
    asyncio.run(main())