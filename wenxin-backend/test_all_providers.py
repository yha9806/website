"""
Comprehensive testing script for all AI model providers
Tests models from Anthropic, Qwen, Google, xAI and other providers
"""
import asyncio
import json
import os
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Any, Optional
from dotenv import load_dotenv

load_dotenv()


class ProviderTester:
    """Base class for testing AI models from different providers"""
    
    def __init__(self):
        self.test_cases = [
            {
                'test_id': 'poem_moon',
                'prompt': 'Write a beautiful poem about the moon and stars, focusing on their beauty and the emotions they evoke',
                'task_type': 'poem',
                'max_tokens': 150,
                'temperature': 0.7
            },
            {
                'test_id': 'story_robot',
                'prompt': 'Write a short story about a robot learning to paint for the first time',
                'task_type': 'story',
                'max_tokens': 200,
                'temperature': 0.8
            },
            {
                'test_id': 'code_fibonacci',
                'prompt': 'Write a Python function to generate the Fibonacci sequence up to n terms',
                'task_type': 'code',
                'max_tokens': 150,
                'temperature': 0.3
            }
        ]
        
        self.client = None
        self.eval_service = None
        
    async def initialize(self):
        """Initialize the unified client and evaluation service"""
        from app.services.models import UnifiedModelClient, model_registry
        from app.services.models.configs import model_configs
        
        # Load all models
        model_configs.load_all_models()
        
        # Initialize client
        self.client = UnifiedModelClient()
        
        # Try to initialize evaluation service
        try:
            from base_tester import BaseTester
            tester = BaseTester()
            self.eval_service = tester
        except:
            print("[WARNING] Evaluation service not available, will test without scoring")
            self.eval_service = None
    
    async def test_model(self, model_id: str) -> List[Dict]:
        """Test a single model with all test cases"""
        results = []
        
        for test_case in self.test_cases:
            print(f"    Testing {test_case['test_id']}...", end=' ')
            
            try:
                # Generate response
                start_time = datetime.now()
                
                response = await self.client.generate(
                    model_id=model_id,
                    prompt=test_case['prompt'],
                    task_type=test_case.get('task_type'),
                    max_tokens=test_case['max_tokens'],
                    temperature=test_case['temperature']
                )
                
                duration = (datetime.now() - start_time).total_seconds()
                
                # Extract content
                if isinstance(response, dict):
                    content = response.get('content', '')
                elif hasattr(response, 'choices') and response.choices:
                    content = response.choices[0].message.content
                else:
                    content = str(response) if response else ''
                
                if content:
                    # Try to score if evaluation service is available
                    score_result = None
                    if self.eval_service:
                        try:
                            score_result = await self.eval_service.score_with_gpt4(
                                test_case['prompt'],
                                content,
                                test_case.get('task_type', 'general')
                            )
                        except:
                            pass
                    
                    result = {
                        'model_id': model_id,
                        'test_id': test_case['test_id'],
                        'success': True,
                        'duration': duration,
                        'response': content[:1000],  # Truncate for storage
                        'response_length': len(content),
                        'timestamp': datetime.now().isoformat()
                    }
                    
                    if score_result:
                        result.update({
                            'overall_score': score_result.get('total_score'),
                            'dimensions': score_result.get('dimensions'),
                            'score_details': score_result
                        })
                        print(f"[SUCCESS] Score: {score_result.get('total_score', 0):.1f}")
                    else:
                        print("[SUCCESS] No score")
                    
                    results.append(result)
                else:
                    print("[FAILED] Empty response")
                    results.append({
                        'model_id': model_id,
                        'test_id': test_case['test_id'],
                        'success': False,
                        'error': 'Empty response',
                        'timestamp': datetime.now().isoformat()
                    })
                    
            except Exception as e:
                error_msg = str(e)[:200]
                print(f"[ERROR] {error_msg[:50]}")
                results.append({
                    'model_id': model_id,
                    'test_id': test_case['test_id'],
                    'success': False,
                    'error': error_msg,
                    'timestamp': datetime.now().isoformat()
                })
            
            # Rate limit protection
            await asyncio.sleep(2)
        
        return results
    
    async def test_provider(self, provider: str, model_ids: List[str]) -> Dict:
        """Test all models from a provider"""
        print(f"\n{'='*60}")
        print(f"Testing {provider.upper()} Models")
        print(f"{'='*60}")
        
        # Check API key
        api_key_name = f"{provider.upper()}_API_KEY"
        if provider == 'qwen':
            api_key_name = "QWEN_API_KEY"
        elif provider == 'xai':
            api_key_name = "XAI_API_KEY"
            
        api_key = os.getenv(api_key_name)
        if not api_key:
            print(f"[WARNING] {api_key_name} not configured, skipping {provider}")
            return {
                'provider': provider,
                'status': 'skipped',
                'reason': 'API key not configured',
                'models_tested': 0
            }
        
        all_results = []
        
        for model_id in model_ids:
            print(f"\n  Testing {model_id}:")
            
            try:
                results = await self.test_model(model_id)
                all_results.extend(results)
            except Exception as e:
                print(f"  [ERROR] Failed to test {model_id}: {str(e)[:100]}")
                all_results.append({
                    'model_id': model_id,
                    'success': False,
                    'error': str(e)[:200]
                })
        
        # Calculate rankings
        model_scores = {}
        for result in all_results:
            if result.get('success') and result.get('overall_score'):
                model_id = result['model_id']
                if model_id not in model_scores:
                    model_scores[model_id] = []
                model_scores[model_id].append(result['overall_score'])
        
        rankings = []
        for model_id, scores in model_scores.items():
            avg_score = sum(scores) / len(scores) if scores else 0
            rankings.append({
                'model_id': model_id,
                'average_score': avg_score,
                'tests_completed': len(scores)
            })
        
        rankings.sort(key=lambda x: x['average_score'], reverse=True)
        for i, ranking in enumerate(rankings):
            ranking['rank'] = i + 1
        
        # Save provider results
        output_dir = Path(f"benchmark_results/{provider}")
        output_dir.mkdir(parents=True, exist_ok=True)
        
        report = {
            'provider': provider.title(),
            'test_date': datetime.now().isoformat(),
            'all_results': all_results,
            'models_tested': len(model_ids),
            'total_tests': len(all_results),
            'successful_tests': len([r for r in all_results if r.get('success')]),
            'rankings': rankings,
            'average_score': sum(r['average_score'] for r in rankings) / len(rankings) if rankings else 0
        }
        
        # Save JSON report
        with open(output_dir / f"{provider}_benchmark_report.json", 'w', encoding='utf-8') as f:
            json.dump(report, f, indent=2, ensure_ascii=False)
        
        print(f"\n[SAVED] Results to benchmark_results/{provider}/")
        
        return report


async def test_anthropic():
    """Test Anthropic Claude models"""
    tester = ProviderTester()
    await tester.initialize()
    
    models = [
        'claude-opus-4.1',
        'claude-sonnet-4', 
        'claude-3.5-sonnet'
    ]
    
    return await tester.test_provider('anthropic', models)


async def test_qwen():
    """Test Alibaba Qwen models"""
    tester = ProviderTester()
    await tester.initialize()
    
    models = [
        'qwen3-235b',
        'qwen2.5-72b',
        'qwen2-72b'
    ]
    
    return await tester.test_provider('qwen', models)


async def test_gemini():
    """Test Google Gemini models"""
    tester = ProviderTester()
    await tester.initialize()
    
    # Check if there are any Gemini models configured
    from app.services.models import model_registry
    
    gemini_models = []
    for model_id in model_registry._models.keys():
        model = model_registry.get_model(model_id)
        if model and model.provider == 'gemini':
            gemini_models.append(model_id)
    
    if not gemini_models:
        print("\n[INFO] No Gemini models configured in model_configs.py")
        return {
            'provider': 'gemini',
            'status': 'no_models',
            'models_tested': 0
        }
    
    return await tester.test_provider('gemini', gemini_models)


async def test_xai():
    """Test xAI Grok models"""
    tester = ProviderTester()
    await tester.initialize()
    
    # Check if there are any xAI models configured
    from app.services.models import model_registry
    
    xai_models = []
    for model_id in model_registry._models.keys():
        model = model_registry.get_model(model_id)
        if model and model.provider == 'xai':
            xai_models.append(model_id)
    
    if not xai_models:
        print("\n[INFO] No xAI models configured in model_configs.py")
        return {
            'provider': 'xai',
            'status': 'no_models',
            'models_tested': 0
        }
    
    return await tester.test_provider('xai', xai_models)


async def main():
    """Main function to test all providers"""
    print("="*70)
    print("COMPREHENSIVE AI MODEL TESTING - ALL PROVIDERS")
    print("="*70)
    
    results = {}
    
    # Test each provider
    print("\n1. Testing Anthropic Claude models...")
    results['anthropic'] = await test_anthropic()
    
    print("\n2. Testing Alibaba Qwen models...")
    results['qwen'] = await test_qwen()
    
    print("\n3. Testing Google Gemini models...")
    results['gemini'] = await test_gemini()
    
    print("\n4. Testing xAI Grok models...")
    results['xai'] = await test_xai()
    
    # Generate comprehensive report
    print("\n" + "="*70)
    print("TESTING COMPLETE - GENERATING FINAL REPORT")
    print("="*70)
    
    # Collect all results
    all_provider_results = []
    total_models = 0
    total_tests = 0
    successful_tests = 0
    
    for provider, report in results.items():
        if isinstance(report, dict) and 'all_results' in report:
            all_provider_results.extend(report['all_results'])
            total_models += report.get('models_tested', 0)
            total_tests += report.get('total_tests', 0)
            successful_tests += report.get('successful_tests', 0)
    
    # Load existing results from OpenAI and DeepSeek
    existing_providers = ['openai', 'deepseek']
    for provider in existing_providers:
        report_file = Path(f"benchmark_results/{provider}/{provider}_benchmark_report.json")
        if report_file.exists():
            with open(report_file, 'r', encoding='utf-8') as f:
                data = json.load(f)
                if 'all_results' in data:
                    all_provider_results.extend(data['all_results'])
                    total_models += data.get('models_tested', 0)
                    total_tests += data.get('total_tests', 0)
                    successful_tests += data.get('successful_tests', 0)
    
    # Calculate global rankings
    model_scores = {}
    for result in all_provider_results:
        if result.get('success') and result.get('overall_score'):
            model_id = result['model_id']
            if model_id not in model_scores:
                model_scores[model_id] = {
                    'scores': [],
                    'dimensions': {}
                }
            model_scores[model_id]['scores'].append(result['overall_score'])
            
            # Aggregate dimensions
            if 'dimensions' in result and result['dimensions']:
                for dim, score in result['dimensions'].items():
                    if dim not in model_scores[model_id]['dimensions']:
                        model_scores[model_id]['dimensions'][dim] = []
                    model_scores[model_id]['dimensions'][dim].append(score)
    
    global_rankings = []
    for model_id, data in model_scores.items():
        avg_score = sum(data['scores']) / len(data['scores']) if data['scores'] else 0
        
        avg_dimensions = {}
        for dim, scores in data['dimensions'].items():
            avg_dimensions[dim] = sum(scores) / len(scores) if scores else 0
        
        global_rankings.append({
            'model_id': model_id,
            'average_score': avg_score,
            'average_dimensions': avg_dimensions,
            'tests_completed': len(data['scores'])
        })
    
    global_rankings.sort(key=lambda x: x['average_score'], reverse=True)
    for i, ranking in enumerate(global_rankings):
        ranking['rank'] = i + 1
    
    # Save final comprehensive report
    final_report = {
        'test_date': datetime.now().isoformat(),
        'providers_tested': len(results) + len(existing_providers),
        'total_models': total_models,
        'total_tests': total_tests,
        'successful_tests': successful_tests,
        'global_rankings': global_rankings[:20],  # Top 20
        'provider_summaries': {
            provider: {
                'models_tested': report.get('models_tested', 0),
                'average_score': report.get('average_score', 0),
                'status': report.get('status', 'completed')
            }
            for provider, report in results.items()
            if isinstance(report, dict)
        }
    }
    
    output_dir = Path("benchmark_results/final")
    output_dir.mkdir(parents=True, exist_ok=True)
    
    with open(output_dir / "comprehensive_benchmark_report.json", 'w', encoding='utf-8') as f:
        json.dump(final_report, f, indent=2, ensure_ascii=False)
    
    # Print summary
    print("\n" + "="*70)
    print("FINAL SUMMARY")
    print("="*70)
    print(f"\nTotal Providers Tested: {final_report['providers_tested']}")
    print(f"Total Models Tested: {final_report['total_models']}")
    print(f"Total Test Cases Run: {final_report['total_tests']}")
    print(f"Successful Tests: {final_report['successful_tests']}")
    
    print("\nTOP 10 MODELS:")
    for ranking in global_rankings[:10]:
        print(f"  {ranking['rank']}. {ranking['model_id']}: {ranking['average_score']:.1f}/100")
    
    print(f"\n[SAVED] Final report to benchmark_results/final/")
    print("\nTesting complete!")


if __name__ == "__main__":
    asyncio.run(main())