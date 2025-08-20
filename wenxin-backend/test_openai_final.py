"""
最终测试 OpenAI 剩余模型 (o1-mini, o3-mini, gpt-5-nano)
直接在根目录运行，确保所有修复生效
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


async def test_openai_final():
    """测试 OpenAI 最后的模型"""
    print("="*60)
    print("OpenAI Final Models Testing (o1-mini, o3-mini, gpt-5-nano)")
    print("="*60)
    
    from app.services.models import UnifiedModelClient, model_registry
    from app.services.models.configs import model_configs
    
    # 确保模型已加载
    model_configs.load_all_models()
    
    # 要测试的模型
    models_to_test = ['o1-mini', 'o3-mini', 'gpt-5-nano']
    
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
            print(f"Special: {model.requires_special_handling}")
            
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
                    'task_type': test_case['type']
                }
                
                # o1/o3 系列特殊处理
                if model_id in ['o1-mini', 'o3-mini']:
                    params['max_completion_tokens'] = 2000
                    print(f"    Using max_completion_tokens=2000")
                # GPT-5-nano 特殊处理
                elif model_id == 'gpt-5-nano':
                    params['max_completion_tokens'] = 1500
                    params['temperature'] = 0.9  # 提高温度试试
                    print(f"    Using max_completion_tokens=1500, temp=0.9")
                else:
                    params['max_tokens'] = test_case['max_tokens']
                
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
                
                # 检查是否是 system role 错误
                if 'system' in error.lower() and 'role' in error.lower():
                    print(f"    [WARNING] SYSTEM ROLE ERROR - Fix not working!")
                    print(f"    Need to check openai_adapter.py")
                
                all_results.append({
                    'model_id': model_id,
                    'test_id': test_case['id'],
                    'success': False,
                    'error': error,
                    'timestamp': datetime.now().isoformat()
                })
    
    # 保存结果
    save_final_results(all_results)
    
    # 显示摘要
    print("\n" + "="*60)
    print("Testing Summary")
    print("-"*60)
    
    successful = [r for r in all_results if r.get('success')]
    failed = [r for r in all_results if not r.get('success')]
    
    print(f"Total: {len(all_results)}")
    print(f"Success: {len(successful)}")
    print(f"Failed: {len(failed)}")
    
    if failed:
        print("\nFailed tests:")
        for f in failed:
            print(f"  {f['model_id']}/{f['test_id']}: {f.get('error', '')[:80]}")
    
    if successful:
        print("\nSuccessful models:")
        model_scores = {}
        for r in successful:
            if r['model_id'] not in model_scores:
                model_scores[r['model_id']] = []
            model_scores[r['model_id']].append(r['overall_score'])
        
        for model_id, scores in model_scores.items():
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


def save_final_results(results: List[Dict[str, Any]]):
    """保存最终结果"""
    # 创建目录
    output_dir = Path("benchmark/results/openai/final")
    output_dir.mkdir(parents=True, exist_ok=True)
    
    # 保存结果
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filepath = output_dir / f"openai_final_{timestamp}.json"
    
    with open(filepath, 'w', encoding='utf-8') as f:
        json.dump({
            'test_date': datetime.now().isoformat(),
            'models': ['o1-mini', 'o3-mini', 'gpt-5-nano'],
            'results': results
        }, f, indent=2, ensure_ascii=False)
    
    print(f"\n[SAVED] Results saved to {filepath}")
    
    # 如果有成功的结果，显示如何合并
    successful = [r for r in results if r.get('success')]
    if successful:
        print(f"\n[SUCCESS] {len(successful)} successful tests can be merged")
        print("These results can be added to the main OpenAI benchmark")


if __name__ == "__main__":
    asyncio.run(test_openai_final())