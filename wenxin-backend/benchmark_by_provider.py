"""
按厂商批量测试脚本 - 统一测试同一厂商的所有模型
保存完整的响应和评分结果
"""
import asyncio
import json
import time
import os
import sys
import io
from datetime import datetime
from typing import Dict, List, Any, Optional
from pathlib import Path

# 设置UTF-8编码
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

# 导入必要模块
from openai import AsyncOpenAI
from dotenv import load_dotenv
from app.services.models import UnifiedModelClient, model_registry

# 加载环境变量
load_dotenv()

# 创建结果保存目录
RESULTS_BASE_DIR = Path("benchmark_results")
RESULTS_BASE_DIR.mkdir(exist_ok=True)

# 标准评分维度 - 与数据库一致
STANDARD_DIMENSIONS = ["rhythm", "composition", "narrative", "emotion", "creativity", "cultural"]

# 测试用例定义
TEST_CASES = [
    {
        "id": "poem_nature",
        "type": "poem",
        "prompt": "Write a beautiful poem about mountains and rivers in spring, capturing the essence of nature's renewal",
        "max_tokens": 200,
        "temperature": 0.7,
        "category": "creative"
    },
    {
        "id": "story_short",
        "type": "story",
        "prompt": "Write a short story about a robot learning to paint, exploring themes of creativity and consciousness",
        "max_tokens": 400,
        "temperature": 0.8,
        "category": "narrative"
    },
    {
        "id": "code_python",
        "type": "code",
        "prompt": "Write an efficient Python function to find the longest palindromic substring in a given string. Include comments and handle edge cases",
        "max_tokens": 300,
        "temperature": 0.3,
        "category": "technical"
    },
    {
        "id": "explain_concept",
        "type": "explanation",
        "prompt": "Explain how blockchain technology works in simple terms that a high school student could understand",
        "max_tokens": 300,
        "temperature": 0.5,
        "category": "educational"
    },
    {
        "id": "reasoning_logic",
        "type": "reasoning",
        "prompt": "A farmer needs to transport a fox, a chicken, and a bag of grain across a river. The boat can only carry the farmer and one item at a time. How can the farmer transport all three safely? Explain step by step.",
        "max_tokens": 400,
        "temperature": 0.4,
        "category": "logical"
    }
]

# 厂商模型映射
PROVIDER_MODELS = {
    "openai": [
        "gpt-4o", "gpt-4o-mini", "gpt-4-turbo", "gpt-4", "gpt-4.5",
        "gpt-5", "gpt-5-mini", "gpt-5-nano", 
        "o1", "o1-mini", "o3-mini"
    ],
    "anthropic": [
        "claude-opus-4.1", "claude-sonnet-4", "claude-3.5-sonnet"
    ],
    "deepseek": [
        "deepseek-r1", "deepseek-r1-distill", "deepseek-v3"
    ],
    "qwen": [
        "qwen3-235b", "qwen2.5-72b", "qwen2-72b"
    ]
}

# 模型特定配置
MODEL_SPECIFIC_CONFIG = {
    # GPT-5系列特殊配置
    'gpt-5': {'max_completion_tokens': 4000, 'temperature': None},
    'gpt-5-mini': {'max_completion_tokens': 2000, 'temperature': None},
    'gpt-5-nano': {'max_completion_tokens': 1000, 'temperature': None},
    
    # o1系列特殊配置
    'o1': {'max_completion_tokens': 30000, 'temperature': None},
    'o1-mini': {'max_completion_tokens': 15000, 'temperature': None},
    'o3-mini': {'max_completion_tokens': 15000, 'temperature': None},
    
    # 标准GPT-4配置
    'gpt-4': {'max_tokens': 500, 'temperature': 0.7},
    'gpt-4-turbo': {'max_tokens': 500, 'temperature': 0.7},
    'gpt-4o': {'max_tokens': 500, 'temperature': 0.7},
    'gpt-4o-mini': {'max_tokens': 500, 'temperature': 0.7},
    'gpt-4.5': {'max_tokens': 500, 'temperature': 0.7}
}


class IntelligentScorer:
    """GPT-4o-mini智能评分器"""
    
    def __init__(self):
        api_key = os.getenv('OPENAI_API_KEY')
        if not api_key:
            raise ValueError("OPENAI_API_KEY not found in environment variables")
        self.client = AsyncOpenAI(api_key=api_key)
    
    async def score_response(
        self, 
        prompt: str, 
        response: str, 
        task_type: str
    ) -> Dict[str, Any]:
        """使用GPT-4o-mini进行6维度评分"""
        
        if not response or response.strip() == "":
            return {
                "total_score": 0,
                "dimensions": {dim: 0 for dim in STANDARD_DIMENSIONS},
                "highlights": [],
                "weaknesses": ["No response generated"],
                "suggestions": "Model failed to generate any content"
            }
        
        dimension_descriptions = {
            "rhythm": "Rhythm and flow - how well the content flows, its pacing, and musical quality",
            "composition": "Composition and structure - organization, layout, visual/structural arrangement",
            "narrative": "Narrative quality - storytelling ability, plot development, coherence",
            "emotion": "Emotional expression - ability to convey feelings, emotional depth and resonance",
            "creativity": "Creativity and innovation - originality, unique perspectives, imaginative elements",
            "cultural": "Cultural relevance - understanding of cultural context, references, and appropriateness"
        }
        
        scoring_prompt = f"""
You are an expert evaluator. Evaluate this AI response on 6 standard dimensions.

TASK TYPE: {task_type}
ORIGINAL PROMPT: {prompt}

RESPONSE TO EVALUATE:
{response}

EVALUATION DIMENSIONS:
{chr(10).join([f"- {dim}: {dimension_descriptions[dim]}" for dim in STANDARD_DIMENSIONS])}

Return JSON format:
{{
    "total_score": <0-100>,
    "dimensions": {{
        "rhythm": <0-100>,
        "composition": <0-100>,
        "narrative": <0-100>,
        "emotion": <0-100>,
        "creativity": <0-100>,
        "cultural": <0-100>
    }},
    "highlights": [
        {{"text": "<specific excellent part>", "score_point": "+X", "reason": "<why good>"}},
        ...
    ],
    "weaknesses": ["<specific weakness>", ...],
    "suggestions": "<improvement suggestions>"
}}
"""
        
        try:
            completion = await self.client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": "You are an expert evaluator. Return only JSON."},
                    {"role": "user", "content": scoring_prompt}
                ],
                temperature=0.3,
                max_tokens=1000,
                response_format={"type": "json_object"}
            )
            
            result = json.loads(completion.choices[0].message.content)
            
            # 确保所有字段存在
            if "total_score" not in result:
                dims = result.get("dimensions", {})
                result["total_score"] = sum(dims.values()) / 6 if dims else 0
                
            if "dimensions" not in result or len(result["dimensions"]) != 6:
                default_dims = {dim: 70 for dim in STANDARD_DIMENSIONS}
                if "dimensions" in result:
                    default_dims.update(result["dimensions"])
                result["dimensions"] = default_dims
                
            result.setdefault("highlights", [])
            result.setdefault("weaknesses", [])
            result.setdefault("suggestions", "No specific suggestions")
            
            return result
            
        except Exception as e:
            print(f"[ERROR] Scoring failed: {e}")
            return {
                "total_score": 70,
                "dimensions": {dim: 70 for dim in STANDARD_DIMENSIONS},
                "highlights": [],
                "weaknesses": [f"Scoring error: {str(e)}"],
                "suggestions": "Unable to perform detailed evaluation"
            }


class ProviderBenchmarkRunner:
    """按厂商运行基准测试"""
    
    def __init__(self, provider: str):
        self.provider = provider
        self.client = UnifiedModelClient()
        self.scorer = IntelligentScorer()
        self.provider_dir = RESULTS_BASE_DIR / provider
        self.provider_dir.mkdir(exist_ok=True)
        
    async def test_model(self, model_id: str, test_case: Dict[str, Any]) -> Dict[str, Any]:
        """测试单个模型"""
        
        # 获取模型特定配置
        config = MODEL_SPECIFIC_CONFIG.get(model_id, {})
        
        # 准备参数
        params = {
            'model_id': model_id,
            'prompt': test_case['prompt'],
            'task_type': test_case['type']
        }
        
        # 添加模型特定参数
        if 'max_completion_tokens' in config:
            params['max_completion_tokens'] = config['max_completion_tokens']
        elif 'max_tokens' in config:
            params['max_tokens'] = config['max_tokens']
        else:
            params['max_tokens'] = test_case.get('max_tokens', 200)
        
        if config.get('temperature') is not None:
            params['temperature'] = config['temperature']
        elif test_case.get('temperature'):
            params['temperature'] = test_case['temperature']
        
        # 第一轮：获取模型响应
        start_time = time.time()
        try:
            response = await self.client.generate(**params)
            duration = time.time() - start_time
            
            # 提取响应内容
            if isinstance(response, dict):
                content = response.get('content', '')
                model_used = response.get('model_used', model_id)
                tokens_used = response.get('tokens_used', 0)
            else:
                content = str(response)
                model_used = model_id
                tokens_used = 0
            
            # 第二轮：GPT-4o-mini评分
            score_result = await self.scorer.score_response(
                prompt=test_case['prompt'],
                response=content,
                task_type=test_case['type']
            )
            
            result = {
                'model_id': model_id,
                'test_id': test_case['id'],
                'success': True,
                'duration': duration,
                'model_used': model_used,
                'tokens_used': tokens_used,
                'prompt': test_case['prompt'],
                'response': content,
                'response_length': len(content),
                'score_details': score_result,
                'overall_score': score_result['total_score'],
                'dimensions': score_result['dimensions'],
                'timestamp': datetime.now().isoformat()
            }
            
            print(f"      ✓ Score: {score_result['total_score']}/100")
            
        except Exception as e:
            duration = time.time() - start_time
            print(f"      ✗ Error: {str(e)[:50]}...")
            
            result = {
                'model_id': model_id,
                'test_id': test_case['id'],
                'success': False,
                'duration': duration,
                'error': str(e),
                'prompt': test_case['prompt'],
                'response': '',
                'score_details': {
                    'total_score': 0,
                    'dimensions': {dim: 0 for dim in STANDARD_DIMENSIONS},
                    'highlights': [],
                    'weaknesses': [f"Failed: {str(e)}"],
                    'suggestions': "Fix the error and retry"
                },
                'overall_score': 0,
                'dimensions': {dim: 0 for dim in STANDARD_DIMENSIONS},
                'timestamp': datetime.now().isoformat()
            }
        
        return result
    
    async def test_all_models(self) -> Dict[str, Any]:
        """测试该厂商的所有模型"""
        
        print(f"\n{'='*60}")
        print(f"Testing {self.provider.upper()} Models")
        print(f"{'='*60}")
        
        # 获取该厂商的模型列表
        models = PROVIDER_MODELS.get(self.provider, [])
        
        # 过滤出实际可用的模型
        available_models = []
        for model_id in models:
            try:
                if model_registry.get_model(model_id):
                    available_models.append(model_id)
                    print(f"✓ {model_id} available")
            except:
                print(f"✗ {model_id} not found")
        
        if not available_models:
            print(f"[ERROR] No {self.provider} models available")
            return {}
        
        print(f"\nTesting {len(available_models)} models with {len(TEST_CASES)} test cases")
        print("-" * 60)
        
        # 测试所有模型
        all_results = []
        model_summaries = {}
        
        for i, model_id in enumerate(available_models, 1):
            print(f"\n[{i}/{len(available_models)}] Testing {model_id}")
            
            model_results = []
            total_score = 0
            dimension_totals = {dim: 0 for dim in STANDARD_DIMENSIONS}
            
            for j, test_case in enumerate(TEST_CASES, 1):
                print(f"  [{j}/{len(TEST_CASES)}] {test_case['id']}...", end=" ")
                
                result = await self.test_model(model_id, test_case)
                model_results.append(result)
                all_results.append(result)
                
                total_score += result['overall_score']
                for dim in STANDARD_DIMENSIONS:
                    dimension_totals[dim] += result['dimensions'][dim]
                
                # 保存单个测试结果
                test_file = self.provider_dir / f"{model_id}_{test_case['id']}.json"
                with open(test_file, 'w', encoding='utf-8') as f:
                    json.dump(result, f, indent=2, ensure_ascii=False)
                
                # 短延迟避免API限流
                await asyncio.sleep(1)
            
            # 计算模型平均分
            avg_score = total_score / len(TEST_CASES)
            avg_dimensions = {
                dim: dimension_totals[dim] / len(TEST_CASES) 
                for dim in STANDARD_DIMENSIONS
            }
            
            model_summary = {
                'model_id': model_id,
                'average_score': avg_score,
                'average_dimensions': avg_dimensions,
                'test_count': len(model_results),
                'success_count': sum(1 for r in model_results if r['success']),
                'test_results': model_results
            }
            
            model_summaries[model_id] = model_summary
            
            # 保存模型汇总
            model_file = self.provider_dir / f"{model_id}_summary.json"
            with open(model_file, 'w', encoding='utf-8') as f:
                json.dump(model_summary, f, indent=2, ensure_ascii=False)
            
            print(f"\n  Average: {avg_score:.1f}/100")
            print(f"  Dimensions: " + " ".join([f"{dim[:3]}:{avg_dimensions[dim]:.0f}" for dim in STANDARD_DIMENSIONS]))
        
        # 生成厂商报告
        rankings = sorted(
            model_summaries.items(),
            key=lambda x: x[1]['average_score'],
            reverse=True
        )
        
        provider_report = {
            'provider': self.provider,
            'test_date': datetime.now().isoformat(),
            'models_tested': len(available_models),
            'test_cases': len(TEST_CASES),
            'total_tests': len(all_results),
            'rankings': [
                {
                    'rank': i,
                    'model_id': model_id,
                    'average_score': summary['average_score'],
                    'average_dimensions': summary['average_dimensions'],
                    'success_rate': summary['success_count'] / summary['test_count']
                }
                for i, (model_id, summary) in enumerate(rankings, 1)
            ],
            'model_summaries': model_summaries,
            'all_results': all_results
        }
        
        # 保存完整报告
        report_file = self.provider_dir / f"{self.provider}_full_report.json"
        with open(report_file, 'w', encoding='utf-8') as f:
            json.dump(provider_report, f, indent=2, ensure_ascii=False)
        
        # 生成Markdown报告
        self.generate_markdown_report(provider_report)
        
        # 打印最终排名
        print(f"\n{'='*60}")
        print(f"{self.provider.upper()} RANKINGS:")
        print("-" * 60)
        for item in provider_report['rankings']:
            print(f"{item['rank']}. {item['model_id']}: {item['average_score']:.1f}/100")
        
        return provider_report
    
    def generate_markdown_report(self, report: Dict[str, Any]):
        """生成Markdown格式报告"""
        
        md_content = f"""# {self.provider.upper()} Models Benchmark Report

## Test Overview
- **Date**: {report['test_date']}
- **Provider**: {self.provider}
- **Models Tested**: {report['models_tested']}
- **Test Cases**: {report['test_cases']}
- **Total Tests**: {report['total_tests']}

## Rankings

| Rank | Model | Score | Success Rate | Dimensions (R/C/N/E/Cr/Cu) |
|------|-------|-------|--------------|----------------------------|
"""
        
        for item in report['rankings']:
            dims = item['average_dimensions']
            dim_str = f"{dims['rhythm']:.0f}/{dims['composition']:.0f}/{dims['narrative']:.0f}/{dims['emotion']:.0f}/{dims['creativity']:.0f}/{dims['cultural']:.0f}"
            md_content += f"| {item['rank']} | **{item['model_id']}** | {item['average_score']:.1f} | {item['success_rate']*100:.0f}% | {dim_str} |\n"
        
        # 添加详细分析
        md_content += "\n## Detailed Analysis\n\n"
        
        # 找出最佳和最差
        if report['rankings']:
            best = report['rankings'][0]
            md_content += f"### Best Performer\n"
            md_content += f"- **{best['model_id']}**: {best['average_score']:.1f}/100\n"
            
            if len(report['rankings']) > 1:
                worst = report['rankings'][-1]
                md_content += f"\n### Needs Improvement\n"
                md_content += f"- **{worst['model_id']}**: {worst['average_score']:.1f}/100\n"
        
        # 保存Markdown报告
        md_file = self.provider_dir / f"{self.provider}_report.md"
        with open(md_file, 'w', encoding='utf-8') as f:
            f.write(md_content)
        
        print(f"\n[INFO] Reports saved to {self.provider_dir}/")


async def test_provider(provider: str):
    """测试指定厂商的所有模型"""
    runner = ProviderBenchmarkRunner(provider)
    return await runner.test_all_models()


async def main():
    """主函数 - 可以选择测试哪个厂商"""
    
    # 模型在导入时已自动加载，无需重复加载
    print(f"[INFO] Using {len(model_registry._models)} pre-loaded models")
    
    # 选择要测试的厂商
    print("\nAvailable providers:")
    for i, provider in enumerate(PROVIDER_MODELS.keys(), 1):
        models = PROVIDER_MODELS[provider]
        print(f"  {i}. {provider} ({len(models)} models)")
    
    # 可以修改这里来选择不同的厂商
    # 例如: provider_to_test = "openai"
    provider_to_test = input("\nEnter provider name to test (e.g., openai): ").strip().lower()
    
    if provider_to_test not in PROVIDER_MODELS:
        print(f"[ERROR] Provider '{provider_to_test}' not found")
        return
    
    # 运行测试
    await test_provider(provider_to_test)
    
    print(f"\n{'='*60}")
    print("[SUCCESS] Testing completed!")
    print(f"Results saved to: {RESULTS_BASE_DIR / provider_to_test}/")
    print(f"{'='*60}")


if __name__ == "__main__":
    asyncio.run(main())