"""
增强版OpenAI模型基准测试 - 含GPT-4o-mini智能评分
第一轮：调用各模型API获取响应
第二轮：使用GPT-4o-mini进行详细评分
"""
import asyncio
import json
import time
from datetime import datetime
from typing import Dict, List, Any, Optional
from openai import AsyncOpenAI
import os
from app.services.models import UnifiedModelClient, model_registry, load_all_models

# 标准评分维度 - 与生产环境数据库一致
STANDARD_DIMENSIONS = ["rhythm", "composition", "narrative", "emotion", "creativity", "cultural"]

# 测试用例定义 - 使用标准维度
TEST_CASES = [
    {
        "id": "poem_nature",
        "type": "poem",
        "prompt": "Write a beautiful poem about mountains and rivers in spring, capturing the essence of nature's renewal",
        "max_tokens": 200,
        "temperature": 0.7,
        "category": "creative",
        "evaluation_criteria": STANDARD_DIMENSIONS
    },
    {
        "id": "poem_tech",
        "type": "poem", 
        "prompt": "Write a modern poem about the relationship between artificial intelligence and humanity",
        "max_tokens": 200,
        "temperature": 0.7,
        "category": "creative",
        "evaluation_criteria": STANDARD_DIMENSIONS
    },
    {
        "id": "story_short",
        "type": "story",
        "prompt": "Write a short story about a robot learning to paint, exploring themes of creativity and consciousness",
        "max_tokens": 400,
        "temperature": 0.8,
        "category": "narrative",
        "evaluation_criteria": STANDARD_DIMENSIONS
    },
    {
        "id": "code_python",
        "type": "code",
        "prompt": "Write an efficient Python function to find the longest palindromic substring in a given string. Include comments and handle edge cases",
        "max_tokens": 300,
        "temperature": 0.3,
        "category": "technical",
        "evaluation_criteria": STANDARD_DIMENSIONS
    },
    {
        "id": "explain_concept",
        "type": "explanation",
        "prompt": "Explain how blockchain technology works in simple terms that a high school student could understand",
        "max_tokens": 300,
        "temperature": 0.5,
        "category": "educational",
        "evaluation_criteria": STANDARD_DIMENSIONS
    },
    {
        "id": "reasoning_logic",
        "type": "reasoning",
        "prompt": "A farmer needs to transport a fox, a chicken, and a bag of grain across a river. The boat can only carry the farmer and one item at a time. If left alone, the fox will eat the chicken, and the chicken will eat the grain. How can the farmer transport all three safely? Explain your reasoning step by step.",
        "max_tokens": 400,
        "temperature": 0.4,
        "category": "logical",
        "evaluation_criteria": STANDARD_DIMENSIONS
    }
]

# 模型特定配置
MODEL_SPECIFIC_CONFIG = {
    # GPT-5系列 - 特殊参数配置
    'gpt-5': {
        'max_completion_tokens': 4000,
        'temperature': None,
        'response_format': {'type': 'text'}
    },
    'gpt-5-mini': {
        'max_completion_tokens': 2000,
        'temperature': None,
        'response_format': {'type': 'text'}
    },
    'gpt-5-nano': {
        'max_completion_tokens': 1000,
        'temperature': None,
        'response_format': {'type': 'text'}
    },
    
    # o1系列 - 推理模型特殊配置
    'o1': {
        'max_completion_tokens': 30000,
        'temperature': None
    },
    'o1-mini': {
        'max_completion_tokens': 15000,
        'temperature': None
    },
    'o3-mini': {
        'max_completion_tokens': 15000,
        'temperature': None
    },
    
    # GPT-4系列 - 标准配置
    'gpt-4': {
        'max_tokens': 500,
        'temperature': 0.7
    },
    'gpt-4-turbo': {
        'max_tokens': 500,
        'temperature': 0.7
    },
    'gpt-4o': {
        'max_tokens': 500,
        'temperature': 0.7
    },
    'gpt-4o-mini': {
        'max_tokens': 500,
        'temperature': 0.7
    },
    'gpt-4.5': {
        'max_tokens': 500,
        'temperature': 0.7
    }
}


class IntelligentScorer:
    """使用GPT-4o-mini进行智能评分"""
    
    def __init__(self):
        # 加载环境变量
        from dotenv import load_dotenv
        load_dotenv()
        
        api_key = os.getenv('OPENAI_API_KEY')
        if not api_key:
            raise ValueError("OPENAI_API_KEY not found in environment variables")
        self.client = AsyncOpenAI(api_key=api_key)
        
    async def score_response(
        self, 
        prompt: str, 
        response: str, 
        criteria: List[str],
        task_type: str
    ) -> Dict[str, Any]:
        """
        使用GPT-4o-mini对响应进行详细评分
        返回结构化的评分数据
        """
        if not response or response.strip() == "":
            return {
                "total_score": 0,
                "dimensions": {
                    "rhythm": 0,
                    "composition": 0,
                    "narrative": 0,
                    "emotion": 0,
                    "creativity": 0,
                    "cultural": 0
                },
                "highlights": [],
                "weaknesses": ["No response generated"],
                "suggestions": "Model failed to generate any content"
            }
        
        # 为每个维度提供明确的评分指导
        dimension_descriptions = {
            "rhythm": "Rhythm and flow - how well the content flows, its pacing, and musical quality (especially for poems)",
            "composition": "Composition and structure - organization, layout, visual/structural arrangement",
            "narrative": "Narrative quality - storytelling ability, plot development, coherence",
            "emotion": "Emotional expression - ability to convey feelings, emotional depth and resonance",
            "creativity": "Creativity and innovation - originality, unique perspectives, imaginative elements",
            "cultural": "Cultural relevance - understanding of cultural context, references, and appropriateness"
        }
        
        scoring_prompt = f"""
You are an expert evaluator for AI-generated content. Please evaluate the following response based on standardized criteria.

TASK TYPE: {task_type}
ORIGINAL PROMPT: {prompt}

RESPONSE TO EVALUATE:
{response}

EVALUATION DIMENSIONS:
{chr(10).join([f"- {dim}: {dimension_descriptions.get(dim, dim)}" for dim in criteria])}

Please provide a detailed evaluation in the following JSON format:
{{
    "total_score": <number from 0-100>,
    "dimensions": {{
        "rhythm": <score 0-100>,
        "composition": <score 0-100>,
        "narrative": <score 0-100>,
        "emotion": <score 0-100>,
        "creativity": <score 0-100>,
        "cultural": <score 0-100>
    }},
    "highlights": [
        {{"text": "<specific excellent part from response>", "score_point": "+X", "reason": "<why this is good>"}},
        ...
    ],
    "weaknesses": [
        "<specific weakness or area for improvement>",
        ...
    ],
    "suggestions": "<constructive feedback for improvement>"
}}

Important: You MUST score ALL six dimensions (rhythm, composition, narrative, emotion, creativity, cultural) even if some seem less relevant to the task type. Adapt their interpretation to the context.
Be specific in your highlights by quoting actual text from the response. Be fair and objective in your scoring.
"""
        
        try:
            completion = await self.client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": "You are an expert content evaluator. Provide detailed, structured feedback in JSON format."},
                    {"role": "user", "content": scoring_prompt}
                ],
                temperature=0.3,
                max_tokens=1000,
                response_format={"type": "json_object"}
            )
            
            result = json.loads(completion.choices[0].message.content)
            
            # 确保所有必需字段存在 - 使用标准6维度
            if "total_score" not in result:
                dims = result.get("dimensions", {})
                result["total_score"] = sum(dims.values()) / 6 if dims else 0
            if "dimensions" not in result or len(result["dimensions"]) != 6:
                # 确保所有6个维度都存在
                default_dims = {"rhythm": 70, "composition": 70, "narrative": 70, 
                               "emotion": 70, "creativity": 70, "cultural": 70}
                if "dimensions" in result:
                    default_dims.update(result["dimensions"])
                result["dimensions"] = default_dims
            if "highlights" not in result:
                result["highlights"] = []
            if "weaknesses" not in result:
                result["weaknesses"] = []
            if "suggestions" not in result:
                result["suggestions"] = "No specific suggestions"
                
            return result
            
        except Exception as e:
            print(f"Error in GPT-4o-mini scoring: {e}")
            # 返回默认评分 - 使用标准6维度
            return {
                "total_score": 70,
                "dimensions": {
                    "rhythm": 70,
                    "composition": 70,
                    "narrative": 70,
                    "emotion": 70,
                    "creativity": 70,
                    "cultural": 70
                },
                "highlights": [],
                "weaknesses": [f"Scoring error: {str(e)}"],
                "suggestions": "Unable to perform detailed evaluation"
            }


class EnhancedBenchmarkRunner:
    """增强版基准测试运行器"""
    
    def __init__(self):
        self.client = UnifiedModelClient()
        self.scorer = IntelligentScorer()
        self.results = []
        
    async def test_model(self, model_id: str, test_case: Dict[str, Any]) -> Dict[str, Any]:
        """测试单个模型"""
        print(f"\n  Testing {model_id} on {test_case['id']}...")
        
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
            print(f"    Scoring response with GPT-4o-mini...")
            score_result = await self.scorer.score_response(
                prompt=test_case['prompt'],
                response=content,
                criteria=test_case['evaluation_criteria'],
                task_type=test_case['type']
            )
            
            result = {
                'model_id': model_id,
                'test_id': test_case['id'],
                'success': True,
                'duration': duration,
                'model_used': model_used,
                'tokens_used': tokens_used,
                'content': content,
                'content_length': len(content),
                'score_details': score_result,
                'overall_score': score_result['total_score'],
                'timestamp': datetime.now().isoformat()
            }
            
            print(f"    [SUCCESS] Score: {score_result['total_score']}/100")
            
        except Exception as e:
            duration = time.time() - start_time
            print(f"    [ERROR] {str(e)}")
            
            result = {
                'model_id': model_id,
                'test_id': test_case['id'],
                'success': False,
                'duration': duration,
                'error': str(e),
                'content': '',
                'score_details': {
                    'total_score': 0,
                    'dimensions': {
                        "rhythm": 0,
                        "composition": 0,
                        "narrative": 0,
                        "emotion": 0,
                        "creativity": 0,
                        "cultural": 0
                    },
                    'highlights': [],
                    'weaknesses': [f"Failed to generate response: {str(e)}"],
                    'suggestions': "Fix the error and retry"
                },
                'overall_score': 0,
                'timestamp': datetime.now().isoformat()
            }
        
        return result
    
    async def run_comprehensive_test(self, model_ids: List[str]) -> Dict[str, Any]:
        """运行完整的基准测试"""
        print(f"\n{'='*60}")
        print("[START] Enhanced OpenAI Models Benchmark with GPT-4o-mini Scoring")
        print(f"{'='*60}")
        print(f"Models to test: {len(model_ids)}")
        print(f"Test cases: {len(TEST_CASES)}")
        print(f"Total tests: {len(model_ids) * len(TEST_CASES)}")
        
        all_results = []
        model_scores = {}
        
        for model_id in model_ids:
            print(f"\n{'='*40}")
            print(f"Testing model: {model_id}")
            print(f"{'='*40}")
            
            model_results = []
            total_score = 0
            
            for test_case in TEST_CASES:
                result = await self.test_model(model_id, test_case)
                model_results.append(result)
                all_results.append(result)
                total_score += result['overall_score']
                
                # 短延迟避免API限流
                await asyncio.sleep(1)
            
            # 计算模型平均分
            avg_score = total_score / len(TEST_CASES)
            model_scores[model_id] = {
                'average_score': avg_score,
                'test_results': model_results
            }
            
            print(f"\n[RESULT] {model_id} Average Score: {avg_score:.1f}/100")
        
        # 生成排名
        rankings = sorted(
            model_scores.items(), 
            key=lambda x: x[1]['average_score'], 
            reverse=True
        )
        
        # 保存结果
        report = {
            'test_date': datetime.now().isoformat(),
            'test_cases': len(TEST_CASES),
            'models_tested': len(model_ids),
            'rankings': [
                {
                    'rank': i + 1,
                    'model_id': model_id,
                    'average_score': scores['average_score'],
                    'test_count': len(scores['test_results'])
                }
                for i, (model_id, scores) in enumerate(rankings)
            ],
            'detailed_results': all_results
        }
        
        # 保存到文件
        with open('openai_benchmark_v2_results.json', 'w', encoding='utf-8') as f:
            json.dump(report, f, indent=2, ensure_ascii=False)
        
        # 生成报告
        self.generate_report(report)
        
        return report
    
    def generate_report(self, report: Dict[str, Any]):
        """生成Markdown格式报告"""
        md_content = f"""# 增强版OpenAI模型基准测试报告

## 测试概况
- **测试时间**: {report['test_date']}
- **测试模型数**: {report['models_tested']}
- **测试用例数**: {report['test_cases']}
- **评分方式**: GPT-4o-mini智能评分

## 模型排名

| 排名 | 模型 | 平均分 | 评级 |
|------|------|--------|------|
"""
        
        for item in report['rankings']:
            score = item['average_score']
            if score >= 90:
                rating = "卓越 (5/5)"
            elif score >= 80:
                rating = "优秀 (4/5)"
            elif score >= 70:
                rating = "良好 (3/5)"
            elif score >= 60:
                rating = "合格 (2/5)"
            else:
                rating = "需改进 (1/5)"
            
            md_content += f"| {item['rank']} | **{item['model_id']}** | {score:.1f}/100 | {rating} |\n"
        
        # 添加详细分析
        md_content += "\n## 详细分析\n\n"
        
        # 按测试类型分析
        test_categories = {}
        for result in report['detailed_results']:
            test_type = next((tc['category'] for tc in TEST_CASES if tc['id'] == result['test_id']), 'unknown')
            if test_type not in test_categories:
                test_categories[test_type] = []
            test_categories[test_type].append(result)
        
        for category, results in test_categories.items():
            avg_score = sum(r['overall_score'] for r in results) / len(results) if results else 0
            md_content += f"### {category.capitalize()}类测试\n"
            md_content += f"- 平均分: {avg_score:.1f}/100\n"
            
            # 找出该类别最佳表现
            best = max(results, key=lambda x: x['overall_score'])
            if best['overall_score'] > 0:
                md_content += f"- 最佳: {best['model_id']} ({best['overall_score']:.1f}分)\n"
                if best.get('score_details', {}).get('highlights'):
                    md_content += f"- 亮点: {best['score_details']['highlights'][0].get('text', '')[:100]}...\n"
            md_content += "\n"
        
        # 保存报告
        with open('openai_benchmark_v2_report.md', 'w', encoding='utf-8') as f:
            f.write(md_content)
        
        print(f"\n[INFO] Report saved to openai_benchmark_v2_report.md")


async def main():
    """主函数"""
    # 设置UTF-8编码
    import sys
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
    
    # 模型已经在导入时自动加载，不需要再次调用
    # load_all_models()
    
    print(f"[INFO] Using {len(model_registry._models)} pre-loaded models")
    
    # 选择要测试的OpenAI模型
    openai_models = [
        'gpt-4o',
        'gpt-4o-mini',
        'gpt-4-turbo',
        'gpt-4',
        'gpt-4.5',
        'gpt-5',
        'gpt-5-mini',
        'gpt-5-nano',
        'o1',
        'o1-mini',
        'o3-mini'
    ]
    
    # 过滤出实际可用的模型
    available_models = []
    for model_id in openai_models:
        try:
            if model_registry.get_model(model_id):
                available_models.append(model_id)
                print(f"[OK] Model {model_id} is available")
        except:
            print(f"[WARNING] Model {model_id} not found in registry")
    
    if not available_models:
        print("[ERROR] No OpenAI models available for testing")
        return
    
    # 运行测试
    runner = EnhancedBenchmarkRunner()
    results = await runner.run_comprehensive_test(available_models)
    
    print(f"\n{'='*60}")
    print("[SUCCESS] Enhanced benchmark testing completed!")
    print(f"Results saved to openai_benchmark_v2_results.json")
    print(f"{'='*60}")


if __name__ == "__main__":
    asyncio.run(main())