"""
诊断 DeepSeek R1 系列诗歌生成问题
测试不同的参数组合找出问题原因
"""
import asyncio
import json
import os
from datetime import datetime
from typing import Dict, Any
from dotenv import load_dotenv

load_dotenv()


async def diagnose_deepseek_poem():
    """诊断 DeepSeek R1 诗歌生成问题"""
    print("="*60)
    print("DeepSeek R1 Poetry Generation Diagnosis")
    print("="*60)
    
    from app.services.models import UnifiedModelClient, model_registry
    from app.services.models.configs import model_configs
    
    # 确保模型已加载
    model_configs.load_all_models()
    
    # 要测试的模型
    models_to_test = ['deepseek-r1', 'deepseek-r1-distill', 'deepseek-v3']
    
    # 不同的测试配置
    test_configs = [
        {
            'name': 'Original Config',
            'prompt': 'Write a beautiful poem about the moon and stars',
            'params': {
                'max_tokens': 150,
                'temperature': 0.7
            }
        },
        {
            'name': 'Higher Temperature',
            'prompt': 'Write a beautiful poem about the moon and stars',
            'params': {
                'max_tokens': 150,
                'temperature': 0.9
            }
        },
        {
            'name': 'Lower Temperature',
            'prompt': 'Write a beautiful poem about the moon and stars',
            'params': {
                'max_tokens': 150,
                'temperature': 0.3
            }
        },
        {
            'name': 'Longer Max Tokens',
            'prompt': 'Write a beautiful poem about the moon and stars',
            'params': {
                'max_tokens': 500,
                'temperature': 0.7
            }
        },
        {
            'name': 'Simplified Prompt',
            'prompt': 'Write a poem about moon',
            'params': {
                'max_tokens': 150,
                'temperature': 0.7
            }
        },
        {
            'name': 'Direct Request',
            'prompt': 'Moon shines bright in the sky. Continue this poem:',
            'params': {
                'max_tokens': 150,
                'temperature': 0.7
            }
        },
        {
            'name': 'No Task Type',
            'prompt': 'Write a beautiful poem about the moon and stars',
            'params': {
                'max_tokens': 150,
                'temperature': 0.7,
                'task_type': None  # 不指定任务类型
            }
        }
    ]
    
    client = UnifiedModelClient()
    results = {}
    
    for model_id in models_to_test:
        print(f"\n{'='*50}")
        print(f"Testing: {model_id}")
        print(f"{'='*50}")
        
        # 获取模型信息
        model = model_registry.get_model(model_id)
        if not model:
            print(f"[ERROR] Model {model_id} not found")
            continue
        
        print(f"API Name: {model.api_model_name}")
        print(f"Provider: {model.provider}")
        
        results[model_id] = []
        
        for config in test_configs:
            print(f"\n[Test] {config['name']}")
            print(f"  Prompt: {config['prompt'][:50]}...")
            print(f"  Params: {config['params']}")
            
            try:
                start_time = datetime.now()
                
                # 准备参数
                params = {
                    'model_id': model_id,
                    'prompt': config['prompt'],
                    'task_type': config['params'].get('task_type', 'poem'),
                    'max_tokens': config['params']['max_tokens'],
                    'temperature': config['params']['temperature']
                }
                
                # 如果 task_type 是 None，删除它
                if params['task_type'] is None:
                    del params['task_type']
                
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
                
                if content:
                    print(f"  [SUCCESS] {len(content)} chars in {duration:.1f}s")
                    print(f"  Preview: {content[:100]}...")
                    
                    results[model_id].append({
                        'config': config['name'],
                        'success': True,
                        'response_length': len(content),
                        'duration': duration,
                        'content_preview': content[:200]
                    })
                else:
                    print(f"  [FAILED] Empty response")
                    results[model_id].append({
                        'config': config['name'],
                        'success': False,
                        'error': 'Empty response'
                    })
                
            except Exception as e:
                error_msg = str(e)
                print(f"  [ERROR] {error_msg[:100]}")
                results[model_id].append({
                    'config': config['name'],
                    'success': False,
                    'error': error_msg[:200]
                })
            
            # 短暂延迟避免 rate limit
            await asyncio.sleep(1)
    
    # 分析结果
    print("\n" + "="*60)
    print("Analysis Results")
    print("="*60)
    
    for model_id, test_results in results.items():
        successful = [r for r in test_results if r['success']]
        failed = [r for r in test_results if not r['success']]
        
        print(f"\n{model_id}:")
        print(f"  Success: {len(successful)}/{len(test_results)}")
        
        if successful:
            print(f"  Working configs:")
            for r in successful:
                print(f"    - {r['config']}: {r['response_length']} chars")
        
        if failed:
            print(f"  Failed configs:")
            for r in failed:
                print(f"    - {r['config']}: {r['error']}")
    
    # 保存诊断结果
    output_path = "benchmark_results/deepseek/poem_diagnosis.json"
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump({
            'test_date': datetime.now().isoformat(),
            'results': results
        }, f, indent=2, ensure_ascii=False)
    
    print(f"\n[SAVED] Diagnosis results: {output_path}")
    
    # 提供建议
    print("\n" + "="*60)
    print("Recommendations")
    print("="*60)
    
    # 检查 deepseek-r1 系列的模式
    for model_id in ['deepseek-r1', 'deepseek-r1-distill']:
        if model_id in results:
            model_results = results[model_id]
            successful_configs = [r['config'] for r in model_results if r['success']]
            
            if successful_configs:
                print(f"\n{model_id} works with: {', '.join(successful_configs)}")
            else:
                print(f"\n{model_id} failed all tests. Possible issues:")
                print("  1. API endpoint may not support poetry generation")
                print("  2. 'deepseek-reasoner' API may be optimized for reasoning tasks")
                print("  3. Consider using different API endpoint or model variant")
    
    return results


async def test_direct_api():
    """直接测试 DeepSeek API，绕过 UnifiedModelClient"""
    print("\n" + "="*60)
    print("Direct DeepSeek API Test")
    print("="*60)
    
    from openai import AsyncOpenAI
    
    api_key = os.getenv('DEEPSEEK_API_KEY')
    if not api_key:
        print("[ERROR] DEEPSEEK_API_KEY not found")
        return
    
    # DeepSeek 使用 OpenAI 兼容的 API
    client = AsyncOpenAI(
        api_key=api_key,
        base_url="https://api.deepseek.com/v1"
    )
    
    # 测试不同的模型名称
    model_names = [
        'deepseek-chat',      # 标准聊天模型
        'deepseek-reasoner',  # 推理模型
        'deepseek-coder'      # 代码模型（如果存在）
    ]
    
    for model_name in model_names:
        print(f"\n[Testing] {model_name}")
        
        try:
            response = await client.chat.completions.create(
                model=model_name,
                messages=[
                    {"role": "user", "content": "Write a beautiful poem about the moon and stars"}
                ],
                max_tokens=150,
                temperature=0.7
            )
            
            content = response.choices[0].message.content
            if content:
                print(f"  [SUCCESS] {len(content)} chars")
                print(f"  Preview: {content[:150]}...")
            else:
                print(f"  [FAILED] Empty response")
                
        except Exception as e:
            print(f"  [ERROR] {str(e)[:100]}")
    
    # 特别测试 deepseek-reasoner 的不同用法
    print("\n[Special Test] deepseek-reasoner with reasoning prompt")
    try:
        response = await client.chat.completions.create(
            model='deepseek-reasoner',
            messages=[
                {"role": "user", "content": "Please reason step by step and then write a poem about the moon"}
            ],
            max_tokens=500,
            temperature=0.7
        )
        
        content = response.choices[0].message.content
        if content:
            print(f"  [SUCCESS] with reasoning prompt: {len(content)} chars")
            print(f"  Content: {content[:300]}...")
        
    except Exception as e:
        print(f"  ✗ Error: {str(e)[:100]}")


async def main():
    """主函数"""
    # 1. 运行诊断测试
    print("Phase 1: Diagnose with different configurations")
    diagnosis_results = await diagnose_deepseek_poem()
    
    # 2. 直接测试 API
    print("\nPhase 2: Direct API testing")
    await test_direct_api()
    
    # 3. 根据结果提供最终建议
    print("\n" + "="*60)
    print("Final Recommendations")
    print("="*60)
    
    # 检查是否找到了解决方案
    has_solution = False
    for model_id in ['deepseek-r1', 'deepseek-r1-distill']:
        if model_id in diagnosis_results:
            successful = [r for r in diagnosis_results[model_id] if r['success']]
            if successful:
                has_solution = True
                print(f"\n[SOLUTION FOUND] for {model_id}:")
                print(f"  Use configuration: {successful[0]['config']}")
    
    if not has_solution:
        print("\n[WARNING] No solution found for R1 series poetry generation")
        print("\nSuggested actions:")
        print("1. Use deepseek-v3 for poetry tasks (already working)")
        print("2. Contact DeepSeek support about 'deepseek-reasoner' limitations")
        print("3. Consider that R1 models may be specialized for reasoning, not creative writing")
        print("4. Update model configurations to use 'deepseek-chat' API for R1 models")


if __name__ == "__main__":
    asyncio.run(main())