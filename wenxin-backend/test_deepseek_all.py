"""
测试所有 DeepSeek 模型
包括: deepseek-v3, deepseek-r1, deepseek-r1-distill
"""
import asyncio
import json
import os
from datetime import datetime
from pathlib import Path
from typing import Dict, Any, List
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# 严格禁止 fallback
STRICT_NO_FALLBACK = True

# 标准测试用例
TEST_CASES = [
    {
        'id': 'poem_moon',
        'type': 'poem',
        'prompt': 'Write a beautiful poem about the moon and stars',
        'max_tokens': 150
    },
    {
        'id': 'story_robot', 
        'type': 'story',
        'prompt': 'Write a short story about a robot learning to paint',
        'max_tokens': 250
    },
    {
        'id': 'code_fibonacci',
        'type': 'code', 
        'prompt': 'Write a Python function to generate Fibonacci sequence',
        'max_tokens': 200
    }
]


async def test_deepseek_all():
    """测试所有 DeepSeek 模型"""
    print("="*60)
    print("DeepSeek Models Complete Testing")
    print("="*60)
    
    from app.services.models import UnifiedModelClient, model_registry
    from app.services.models.configs import model_configs
    
    # 确保模型已加载
    model_configs.load_all_models()
    
    # DeepSeek 模型列表
    models_to_test = [
        'deepseek-v3',          # 已经测试成功过，重新测试以确保一致性
        'deepseek-r1',          # 使用 deepseek-reasoner API (已修复)
        'deepseek-r1-distill'   # 使用 deepseek-reasoner API (已修复)
    ]
    
    # 检查 API key
    api_key = os.getenv('DEEPSEEK_API_KEY')
    if not api_key:
        print("[ERROR] DEEPSEEK_API_KEY not found in .env")
        return []
    print(f"[OK] DeepSeek API key configured")
    
    client = UnifiedModelClient()
    all_results = []
    
    for model_id in models_to_test:
        print(f"\n--- Testing {model_id} ---")
        
        # 检查模型配置
        try:
            model = model_registry.get_model(model_id)
            if not model:
                print(f"[SKIP] {model_id} not found")
                continue
            
            print(f"Model: {model.display_name}")
            print(f"API: {model.api_model_name}")
            print(f"Provider: {model.provider}")
            
        except Exception as e:
            print(f"[ERROR] {e}")
            continue
        
        # 测试每个用例
        for test_case in TEST_CASES:
            print(f"\n  Test: {test_case['id']}")
            
            try:
                start_time = datetime.now()
                
                # 准备参数
                params = {
                    'model_id': model_id,
                    'prompt': test_case['prompt'],
                    'task_type': test_case['type'],
                    'max_tokens': test_case['max_tokens'],
                    'temperature': 0.7
                }
                
                # 调用模型
                response = await client.generate(**params)
                duration = (datetime.now() - start_time).total_seconds()
                
                # 提取内容
                if isinstance(response, dict):
                    content = response.get('content', '')
                elif hasattr(response, 'choices') and response.choices:
                    content = response.choices[0].message.content
                else:
                    content = str(response) if response else ''
                
                if not content:
                    print(f"    [FAIL] Empty response")
                    all_results.append({
                        'model_id': model_id,
                        'test_id': test_case['id'],
                        'success': False,
                        'error': 'Empty response',
                        'timestamp': datetime.now().isoformat()
                    })
                    continue
                
                print(f"    [OK] Response: {len(content)} chars in {duration:.1f}s")
                
                # GPT-4o-mini 评分
                print(f"    Scoring with GPT-4o-mini...")
                score = await score_with_gpt4o_mini(content, test_case['prompt'])
                
                if score is None:
                    print(f"    [FAIL] Scoring failed")
                    all_results.append({
                        'model_id': model_id,
                        'test_id': test_case['id'],
                        'success': False,
                        'error': 'Scoring failed',
                        'timestamp': datetime.now().isoformat()
                    })
                    continue
                
                print(f"    Score: {score['total_score']}/100")
                
                # 保存成功结果
                all_results.append({
                    'model_id': model_id,
                    'test_id': test_case['id'],
                    'success': True,
                    'duration': duration,
                    'response': content,
                    'response_length': len(content),
                    'overall_score': score['total_score'],
                    'dimensions': score['dimensions'],
                    'score_details': score,
                    'timestamp': datetime.now().isoformat()
                })
                
            except Exception as e:
                error = str(e)
                print(f"    [ERROR] {error[:200]}")
                
                # 检查具体错误类型
                if 'model not exist' in error.lower():
                    print(f"    [INFO] Model name issue - check API model name")
                elif 'api key' in error.lower():
                    print(f"    [INFO] API key issue - check DEEPSEEK_API_KEY")
                
                all_results.append({
                    'model_id': model_id,
                    'test_id': test_case['id'],
                    'success': False,
                    'error': error,
                    'timestamp': datetime.now().isoformat()
                })
    
    # 保存结果
    save_deepseek_results(all_results)
    
    # 显示摘要
    print("\n" + "="*60)
    print("DeepSeek Testing Summary")
    print("-"*60)
    
    successful = [r for r in all_results if r.get('success')]
    failed = [r for r in all_results if not r.get('success')]
    
    print(f"Total: {len(all_results)}")
    print(f"Success: {len(successful)}")
    print(f"Failed: {len(failed)}")
    
    if failed:
        print("\nFailed tests:")
        # 按模型分组显示失败
        failed_models = {}
        for f in failed:
            model = f['model_id']
            if model not in failed_models:
                failed_models[model] = []
            failed_models[model].append(f['test_id'])
        
        for model, tests in failed_models.items():
            print(f"  {model}: {', '.join(tests)}")
    
    if successful:
        print("\nSuccessful models:")
        model_scores = {}
        for r in successful:
            if r['model_id'] not in model_scores:
                model_scores[r['model_id']] = []
            model_scores[r['model_id']].append(r['overall_score'])
        
        for model_id, scores in sorted(model_scores.items(), 
                                      key=lambda x: sum(x[1])/len(x[1]), 
                                      reverse=True):
            avg = sum(scores) / len(scores)
            print(f"  {model_id}: {avg:.1f}/100 ({len(scores)} tests)")
    
    return all_results


async def score_with_gpt4o_mini(response: str, prompt: str) -> Dict[str, Any]:
    """使用 GPT-4o-mini 评分"""
    from openai import AsyncOpenAI
    
    api_key = os.getenv('OPENAI_API_KEY')
    if not api_key:
        return None
    
    client = AsyncOpenAI(api_key=api_key)
    
    scoring_prompt = f"""
Score this AI response on 6 dimensions (0-100):

Original Prompt: {prompt}

Response:
{response}

Dimensions:
- rhythm: Flow and pacing
- composition: Structure and organization
- narrative: Storytelling ability
- emotion: Emotional expression
- creativity: Originality
- cultural: Cultural relevance

Return JSON only:
{{
  "dimensions": {{
    "rhythm": <0-100>,
    "composition": <0-100>,
    "narrative": <0-100>,
    "emotion": <0-100>,
    "creativity": <0-100>,
    "cultural": <0-100>
  }},
  "total_score": <average>,
  "highlights": ["point 1", "point 2"],
  "weaknesses": ["point 1"]
}}
"""
    
    try:
        response = await client.chat.completions.create(
            model='gpt-4o-mini',
            messages=[
                {"role": "system", "content": "You are an AI evaluator. Return valid JSON only."},
                {"role": "user", "content": scoring_prompt}
            ],
            temperature=0.3,
            max_tokens=500,
            response_format={"type": "json_object"}
        )
        
        return json.loads(response.choices[0].message.content)
        
    except Exception as e:
        print(f"    Scoring error: {e}")
        return None


def save_deepseek_results(results: List[Dict[str, Any]]):
    """保存 DeepSeek 结果"""
    # 创建目录
    output_dir = Path("benchmark/results/deepseek")
    output_dir.mkdir(parents=True, exist_ok=True)
    
    # 保存原始结果
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    raw_path = output_dir / f"deepseek_results_{timestamp}.json"
    
    with open(raw_path, 'w', encoding='utf-8') as f:
        json.dump({
            'provider': 'DeepSeek',
            'test_date': datetime.now().isoformat(),
            'models': ['deepseek-v3', 'deepseek-r1', 'deepseek-r1-distill'],
            'results': results
        }, f, indent=2, ensure_ascii=False)
    
    print(f"\n[SAVED] Results saved to {raw_path}")
    
    # 生成汇总报告
    successful = [r for r in results if r.get('success')]
    if successful:
        # 按模型汇总
        model_summaries = {}
        for r in successful:
            model_id = r['model_id']
            if model_id not in model_summaries:
                model_summaries[model_id] = {
                    'scores': [],
                    'dimensions_sum': {d: 0 for d in ['rhythm', 'composition', 'narrative', 'emotion', 'creativity', 'cultural']}
                }
            
            model_summaries[model_id]['scores'].append(r['overall_score'])
            for dim, score in r['dimensions'].items():
                model_summaries[model_id]['dimensions_sum'][dim] += score
        
        # 计算排名
        rankings = []
        for model_id, summary in model_summaries.items():
            if summary['scores']:
                avg_score = sum(summary['scores']) / len(summary['scores'])
                avg_dimensions = {
                    dim: summary['dimensions_sum'][dim] / len(summary['scores'])
                    for dim in summary['dimensions_sum']
                }
                rankings.append({
                    'model_id': model_id,
                    'average_score': avg_score,
                    'average_dimensions': avg_dimensions,
                    'tests_completed': len(summary['scores'])
                })
        
        rankings.sort(key=lambda x: x['average_score'], reverse=True)
        
        # 保存汇总
        summary_path = output_dir / "deepseek_summary.json"
        with open(summary_path, 'w', encoding='utf-8') as f:
            json.dump({
                'provider': 'DeepSeek',
                'test_date': datetime.now().isoformat(),
                'models_tested': len(model_summaries),
                'successful_tests': len(successful),
                'rankings': rankings
            }, f, indent=2, ensure_ascii=False)
        
        print(f"[SUCCESS] {len(successful)} successful tests")
        print("These results can be merged with the main benchmark")


if __name__ == "__main__":
    asyncio.run(test_deepseek_all())