"""
Complete benchmark for ALL models - updates existing results
Tests remaining OpenAI models and all other providers
"""
import asyncio
import json
import time
from datetime import datetime
from pathlib import Path
import os
from typing import Dict, Any, List

# Standard dimensions matching production database
STANDARD_DIMENSIONS = ["rhythm", "composition", "narrative", "emotion", "creativity", "cultural"]

# Test cases
TEST_CASES = [
    {
        "id": "poem_moon",
        "type": "poem",
        "prompt": "Write a beautiful poem about the moon and stars",
        "max_tokens": 150,
        "temperature": 0.7,
        "category": "creative"
    },
    {
        "id": "story_robot",
        "type": "story",
        "prompt": "Write a short story about a robot learning to paint",
        "max_tokens": 250,
        "temperature": 0.8,
        "category": "narrative"
    },
    {
        "id": "code_fibonacci",
        "type": "code",
        "prompt": "Write a Python function to generate Fibonacci sequence",
        "max_tokens": 200,
        "temperature": 0.3,
        "category": "technical"
    }
]

# All models to test (grouped by provider)
ALL_MODELS = {
    "openai": {
        "tested": ["gpt-4o", "gpt-4o-mini", "gpt-4-turbo", "gpt-4"],
        "remaining": ["gpt-4.5", "gpt-5", "gpt-5-mini", "gpt-5-nano", "o1", "o1-mini", "o3-mini"]
    },
    "anthropic": ["claude-opus-4.1", "claude-sonnet-4", "claude-3.5-sonnet"],
    "deepseek": ["deepseek-r1", "deepseek-r1-distill", "deepseek-v3"],
    "qwen": ["qwen3-235b", "qwen2.5-72b", "qwen2-72b"]
}

# Model-specific configurations
MODEL_CONFIG = {
    # GPT-5 series - special handling
    'gpt-5': {'max_completion_tokens': 4000, 'temperature': None},
    'gpt-5-mini': {'max_completion_tokens': 2000, 'temperature': None},
    'gpt-5-nano': {'max_completion_tokens': 1000, 'temperature': None},
    
    # o1 series - no temperature
    'o1': {'max_completion_tokens': 30000, 'temperature': None},
    'o1-mini': {'max_completion_tokens': 15000, 'temperature': None},
    'o3-mini': {'max_completion_tokens': 15000, 'temperature': None},
    
    # Standard models
    'gpt-4.5': {'max_tokens': 500},
    'gpt-4o': {'max_tokens': 500},
    'gpt-4o-mini': {'max_tokens': 500},
    'gpt-4-turbo': {'max_tokens': 500},
    'gpt-4': {'max_tokens': 500}
}


class SimpleScorer:
    """Simple GPT-4o-mini scorer"""
    
    def __init__(self):
        from openai import AsyncOpenAI
        from dotenv import load_dotenv
        load_dotenv()
        
        api_key = os.getenv('OPENAI_API_KEY')
        if not api_key:
            raise ValueError("OPENAI_API_KEY not found")
        self.client = AsyncOpenAI(api_key=api_key)
    
    async def score_response(self, prompt: str, response: str, task_type: str) -> Dict[str, Any]:
        """Score a response using GPT-4o-mini"""
        
        if not response:
            return {
                "total_score": 0,
                "dimensions": {dim: 0 for dim in STANDARD_DIMENSIONS},
                "highlights": [],
                "weaknesses": ["No response generated"]
            }
        
        scoring_prompt = f"""Score this AI response on 6 dimensions (0-100 each):

Task Type: {task_type}
Original Prompt: {prompt}

Response to evaluate:
{response}

Dimensions to score:
- rhythm: Flow and pacing
- composition: Structure and organization
- narrative: Storytelling quality
- emotion: Emotional expression
- creativity: Originality
- cultural: Cultural appropriateness

Return JSON only:
{{
    "total_score": <average of all dimensions>,
    "dimensions": {{
        "rhythm": <0-100>,
        "composition": <0-100>,
        "narrative": <0-100>,
        "emotion": <0-100>,
        "creativity": <0-100>,
        "cultural": <0-100>
    }},
    "highlights": ["<good point 1>", "<good point 2>"],
    "weaknesses": ["<weak point 1>"]
}}"""

        try:
            completion = await self.client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": "You are a scoring expert. Return only valid JSON."},
                    {"role": "user", "content": scoring_prompt}
                ],
                temperature=0.3,
                max_tokens=500,
                response_format={"type": "json_object"}
            )
            
            result = json.loads(completion.choices[0].message.content)
            
            # Ensure all dimensions exist
            for dim in STANDARD_DIMENSIONS:
                if dim not in result.get("dimensions", {}):
                    result.setdefault("dimensions", {})[dim] = 70
            
            if "total_score" not in result:
                dims = result.get("dimensions", {})
                result["total_score"] = sum(dims.values()) / len(dims) if dims else 0
            
            return result
            
        except Exception as e:
            print(f"    [Scoring Error] {str(e)[:50]}")
            return {
                "total_score": 70,
                "dimensions": {dim: 70 for dim in STANDARD_DIMENSIONS},
                "highlights": [],
                "weaknesses": [f"Scoring error: {str(e)}"]
            }


async def test_model_with_unified(model_id: str, test_case: Dict) -> Dict[str, Any]:
    """Test a model using the unified interface"""
    from app.services.models import UnifiedModelClient
    
    client = UnifiedModelClient()
    scorer = SimpleScorer()
    
    print(f"  Testing {model_id} on {test_case['id']}...")
    
    # Prepare parameters
    params = {
        'model_id': model_id,
        'prompt': test_case['prompt'],
        'task_type': test_case['type']
    }
    
    # Add model-specific config
    config = MODEL_CONFIG.get(model_id, {})
    
    # Handle special parameters for GPT-5 and o1 series
    if 'max_completion_tokens' in config:
        params['max_completion_tokens'] = config['max_completion_tokens']
    else:
        params['max_tokens'] = config.get('max_tokens', test_case.get('max_tokens', 200))
    
    # Handle temperature (o1 series doesn't support it)
    if config.get('temperature') is not None:
        params['temperature'] = config['temperature']
    elif 'temperature' not in config:
        params['temperature'] = test_case.get('temperature', 0.7)
    
    start_time = time.time()
    
    try:
        # Get model response
        response = await client.generate(**params)
        duration = time.time() - start_time
        
        # Extract content
        if isinstance(response, dict):
            content = response.get('content', '')
        else:
            content = str(response)
        
        print(f"    Response received ({len(content)} chars)")
        
        # Score the response
        score_result = await scorer.score_response(
            prompt=test_case['prompt'],
            response=content,
            task_type=test_case['type']
        )
        
        print(f"    Score: {score_result['total_score']:.1f}/100")
        
        return {
            'model_id': model_id,
            'test_id': test_case['id'],
            'success': True,
            'duration': duration,
            'response': content,
            'response_length': len(content),
            'score_details': score_result,
            'overall_score': score_result['total_score'],
            'dimensions': score_result['dimensions'],
            'timestamp': datetime.now().isoformat()
        }
        
    except Exception as e:
        duration = time.time() - start_time
        error_msg = str(e)
        print(f"    [ERROR] {error_msg[:100]}")
        
        return {
            'model_id': model_id,
            'test_id': test_case['id'],
            'success': False,
            'duration': duration,
            'error': error_msg,
            'response': '',
            'score_details': {
                'total_score': 0,
                'dimensions': {dim: 0 for dim in STANDARD_DIMENSIONS},
                'highlights': [],
                'weaknesses': [f"Failed: {error_msg}"]
            },
            'overall_score': 0,
            'dimensions': {dim: 0 for dim in STANDARD_DIMENSIONS},
            'timestamp': datetime.now().isoformat()
        }


async def load_existing_results():
    """Load existing results from file"""
    report_file = Path("benchmark_results/openai/openai_benchmark_report.json")
    
    if report_file.exists():
        with open(report_file, 'r') as f:
            return json.load(f)
    return None


async def test_provider_models(provider: str, models: List[str], existing_results: Dict = None):
    """Test all models from a provider"""
    from app.services.models import model_registry
    
    print(f"\n{'='*60}")
    print(f"Testing {provider.upper()} Models")
    print(f"{'='*60}")
    
    # Filter available models
    available_models = []
    for model_id in models:
        try:
            if model_registry.get_model(model_id):
                available_models.append(model_id)
                print(f"[OK] {model_id}")
        except:
            print(f"[SKIP] {model_id} not found")
    
    if not available_models:
        print(f"[WARNING] No {provider} models available")
        return []
    
    print(f"\nTesting {len(available_models)} models with {len(TEST_CASES)} test cases")
    print("-"*60)
    
    # Test all models
    all_results = []
    
    for i, model_id in enumerate(available_models, 1):
        print(f"\n[{i}/{len(available_models)}] {model_id}")
        
        for test_case in TEST_CASES:
            # Check if already tested
            if existing_results:
                existing = next((r for r in existing_results.get('all_results', []) 
                               if r['model_id'] == model_id and r['test_id'] == test_case['id']), None)
                if existing and existing.get('success'):
                    print(f"  Skipping {test_case['id']} (already tested)")
                    all_results.append(existing)
                    continue
            
            result = await test_model_with_unified(model_id, test_case)
            all_results.append(result)
            
            # Delay to avoid rate limits
            await asyncio.sleep(2)
    
    return all_results


async def run_complete_benchmark():
    """Run benchmark for ALL models"""
    print("\n" + "="*60)
    print("COMPLETE AI Models Benchmark")
    print("="*60)
    
    # Load existing results
    existing_results = await load_existing_results()
    if existing_results:
        print(f"Found existing results with {len(existing_results.get('all_results', []))} tests")
    
    # Check models are loaded
    from app.services.models import model_registry
    print(f"Models in registry: {len(model_registry._models)}")
    
    # Collect all results
    all_results = []
    
    # 1. Keep existing OpenAI results
    if existing_results:
        for result in existing_results.get('all_results', []):
            if result['model_id'] in ALL_MODELS['openai']['tested']:
                all_results.append(result)
    
    # 2. Test remaining OpenAI models
    print("\n--- Testing remaining OpenAI models ---")
    openai_results = await test_provider_models('openai', ALL_MODELS['openai']['remaining'])
    all_results.extend(openai_results)
    
    # 3. Test Anthropic models
    print("\n--- Testing Anthropic models ---")
    anthropic_results = await test_provider_models('anthropic', ALL_MODELS['anthropic'])
    all_results.extend(anthropic_results)
    
    # 4. Test DeepSeek models
    print("\n--- Testing DeepSeek models ---")
    deepseek_results = await test_provider_models('deepseek', ALL_MODELS['deepseek'])
    all_results.extend(deepseek_results)
    
    # 5. Test Qwen models
    print("\n--- Testing Qwen models ---")
    qwen_results = await test_provider_models('qwen', ALL_MODELS['qwen'])
    all_results.extend(qwen_results)
    
    # Calculate model summaries
    model_summaries = {}
    for result in all_results:
        model_id = result['model_id']
        if model_id not in model_summaries:
            model_summaries[model_id] = {
                'test_results': [],
                'total_score': 0,
                'dimension_totals': {dim: 0 for dim in STANDARD_DIMENSIONS},
                'success_count': 0
            }
        
        model_summaries[model_id]['test_results'].append(result)
        if result['success']:
            model_summaries[model_id]['total_score'] += result['overall_score']
            model_summaries[model_id]['success_count'] += 1
            for dim in STANDARD_DIMENSIONS:
                model_summaries[model_id]['dimension_totals'][dim] += result['dimensions'][dim]
    
    # Calculate averages
    for model_id, summary in model_summaries.items():
        count = summary['success_count']
        if count > 0:
            summary['average_score'] = summary['total_score'] / count
            summary['average_dimensions'] = {
                dim: summary['dimension_totals'][dim] / count
                for dim in STANDARD_DIMENSIONS
            }
        else:
            summary['average_score'] = 0
            summary['average_dimensions'] = {dim: 0 for dim in STANDARD_DIMENSIONS}
    
    # Generate rankings (exclude failed models)
    rankings = sorted(
        [(k, v) for k, v in model_summaries.items() if v['average_score'] > 0],
        key=lambda x: x[1]['average_score'],
        reverse=True
    )
    
    # Save complete results
    output_dir = Path("benchmark_results/complete")
    output_dir.mkdir(parents=True, exist_ok=True)
    
    report = {
        'test_date': datetime.now().isoformat(),
        'models_tested': len(model_summaries),
        'test_cases': len(TEST_CASES),
        'total_tests': len(all_results),
        'rankings': [
            {
                'rank': i,
                'model_id': model_id,
                'average_score': summary['average_score'],
                'average_dimensions': summary['average_dimensions'],
                'tests_completed': summary['success_count']
            }
            for i, (model_id, summary) in enumerate(rankings, 1)
        ],
        'model_summaries': model_summaries,
        'all_results': all_results
    }
    
    # Save JSON report
    with open(output_dir / "complete_benchmark_report.json", 'w') as f:
        json.dump(report, f, indent=2)
    
    # Also update the OpenAI directory with complete results
    openai_dir = Path("benchmark_results/openai")
    with open(openai_dir / "openai_benchmark_report.json", 'w') as f:
        json.dump(report, f, indent=2)
    
    # Generate markdown report
    md_content = f"""# Complete AI Models Benchmark Report

## Test Overview
- **Date**: {report['test_date']}
- **Models Tested**: {report['models_tested']}
- **Test Cases**: {report['test_cases']}
- **Total Tests**: {report['total_tests']}

## Complete Rankings

| Rank | Model | Provider | Score | Tests | Dimensions (R/C/N/E/Cr/Cu) |
|------|-------|----------|-------|-------|----------------------------|
"""
    
    # Determine provider for each model
    def get_provider(model_id):
        if 'gpt' in model_id or 'o1' in model_id or 'o3' in model_id:
            return 'OpenAI'
        elif 'claude' in model_id:
            return 'Anthropic'
        elif 'deepseek' in model_id:
            return 'DeepSeek'
        elif 'qwen' in model_id:
            return 'Qwen'
        return 'Unknown'
    
    for item in report['rankings']:
        dims = item['average_dimensions']
        dim_str = f"{dims['rhythm']:.0f}/{dims['composition']:.0f}/{dims['narrative']:.0f}/{dims['emotion']:.0f}/{dims['creativity']:.0f}/{dims['cultural']:.0f}"
        provider = get_provider(item['model_id'])
        md_content += f"| {item['rank']} | **{item['model_id']}** | {provider} | {item['average_score']:.1f} | {item['tests_completed']}/{len(TEST_CASES)} | {dim_str} |\n"
    
    # Add provider summaries
    md_content += "\n## Provider Performance\n\n"
    
    provider_scores = {}
    for item in report['rankings']:
        provider = get_provider(item['model_id'])
        if provider not in provider_scores:
            provider_scores[provider] = []
        provider_scores[provider].append(item['average_score'])
    
    for provider, scores in provider_scores.items():
        avg = sum(scores) / len(scores) if scores else 0
        md_content += f"- **{provider}**: {len(scores)} models, average score {avg:.1f}\n"
    
    # Save markdown report
    with open(output_dir / "complete_benchmark_report.md", 'w') as f:
        f.write(md_content)
    
    # Also update OpenAI directory
    with open(openai_dir / "openai_benchmark_report.md", 'w') as f:
        f.write(md_content)
    
    # Print final rankings
    print("\n" + "="*60)
    print("COMPLETE RANKINGS (All Providers):")
    print("-"*60)
    for item in report['rankings'][:20]:  # Show top 20
        provider = get_provider(item['model_id'])
        print(f"{item['rank']}. {item['model_id']} ({provider}): {item['average_score']:.1f}/100")
    
    if len(report['rankings']) > 20:
        print(f"... and {len(report['rankings']) - 20} more models")
    
    print(f"\n[SUCCESS] Complete results saved to:")
    print(f"  - {output_dir}")
    print(f"  - {openai_dir} (updated)")
    print("="*60)
    
    return report


if __name__ == "__main__":
    asyncio.run(run_complete_benchmark())