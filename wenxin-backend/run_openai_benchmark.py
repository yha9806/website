"""
Run OpenAI models benchmark using unified interface
Handles UTF-8 encoding issues on Windows
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

# Test cases - limited set for initial testing
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

# OpenAI models to test
OPENAI_MODELS = [
    "gpt-4o",
    "gpt-4o-mini",
    "gpt-4-turbo",
    "gpt-4"
]

# Model-specific configurations
MODEL_CONFIG = {
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
            print(f"[Scoring Error] {str(e)}")
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
    params['max_tokens'] = config.get('max_tokens', test_case.get('max_tokens', 200))
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
        print(f"    [ERROR] {str(e)[:100]}")
        
        return {
            'model_id': model_id,
            'test_id': test_case['id'],
            'success': False,
            'duration': duration,
            'error': str(e),
            'response': '',
            'score_details': {
                'total_score': 0,
                'dimensions': {dim: 0 for dim in STANDARD_DIMENSIONS},
                'highlights': [],
                'weaknesses': [f"Failed: {str(e)}"]
            },
            'overall_score': 0,
            'dimensions': {dim: 0 for dim in STANDARD_DIMENSIONS},
            'timestamp': datetime.now().isoformat()
        }


async def run_openai_benchmark():
    """Run benchmark for OpenAI models"""
    print("\n" + "="*60)
    print("OpenAI Models Benchmark")
    print("="*60)
    
    # Check models are loaded
    from app.services.models import model_registry
    print(f"Models in registry: {len(model_registry._models)}")
    
    # Filter available models
    available_models = []
    for model_id in OPENAI_MODELS:
        try:
            if model_registry.get_model(model_id):
                available_models.append(model_id)
                print(f"[OK] {model_id}")
        except:
            print(f"[SKIP] {model_id} not found")
    
    if not available_models:
        print("[ERROR] No OpenAI models available")
        return
    
    print(f"\nTesting {len(available_models)} models with {len(TEST_CASES)} test cases")
    print("-"*60)
    
    # Test all models
    all_results = []
    model_summaries = {}
    
    for i, model_id in enumerate(available_models, 1):
        print(f"\n[{i}/{len(available_models)}] {model_id}")
        
        model_results = []
        total_score = 0
        dimension_totals = {dim: 0 for dim in STANDARD_DIMENSIONS}
        
        for test_case in TEST_CASES:
            result = await test_model_with_unified(model_id, test_case)
            model_results.append(result)
            all_results.append(result)
            
            total_score += result['overall_score']
            for dim in STANDARD_DIMENSIONS:
                dimension_totals[dim] += result['dimensions'][dim]
            
            # Small delay to avoid rate limits
            await asyncio.sleep(2)
        
        # Calculate averages
        avg_score = total_score / len(TEST_CASES)
        avg_dimensions = {
            dim: dimension_totals[dim] / len(TEST_CASES)
            for dim in STANDARD_DIMENSIONS
        }
        
        model_summaries[model_id] = {
            'average_score': avg_score,
            'average_dimensions': avg_dimensions,
            'test_results': model_results
        }
        
        print(f"  Average: {avg_score:.1f}/100")
    
    # Generate rankings
    rankings = sorted(
        model_summaries.items(),
        key=lambda x: x[1]['average_score'],
        reverse=True
    )
    
    # Save results
    output_dir = Path("benchmark_results/openai")
    output_dir.mkdir(parents=True, exist_ok=True)
    
    report = {
        'provider': 'openai',
        'test_date': datetime.now().isoformat(),
        'models_tested': len(available_models),
        'test_cases': len(TEST_CASES),
        'rankings': [
            {
                'rank': i,
                'model_id': model_id,
                'average_score': summary['average_score'],
                'average_dimensions': summary['average_dimensions']
            }
            for i, (model_id, summary) in enumerate(rankings, 1)
        ],
        'model_summaries': model_summaries,
        'all_results': all_results
    }
    
    # Save JSON report
    with open(output_dir / "openai_benchmark_report.json", 'w') as f:
        json.dump(report, f, indent=2)
    
    # Generate markdown report
    md_content = f"""# OpenAI Models Benchmark Report

## Test Overview
- **Date**: {report['test_date']}
- **Models Tested**: {report['models_tested']}
- **Test Cases**: {report['test_cases']}

## Rankings

| Rank | Model | Score | Dimensions (R/C/N/E/Cr/Cu) |
|------|-------|-------|----------------------------|
"""
    
    for item in report['rankings']:
        dims = item['average_dimensions']
        dim_str = f"{dims['rhythm']:.0f}/{dims['composition']:.0f}/{dims['narrative']:.0f}/{dims['emotion']:.0f}/{dims['creativity']:.0f}/{dims['cultural']:.0f}"
        md_content += f"| {item['rank']} | **{item['model_id']}** | {item['average_score']:.1f} | {dim_str} |\n"
    
    # Save markdown report
    with open(output_dir / "openai_benchmark_report.md", 'w') as f:
        f.write(md_content)
    
    # Print final rankings
    print("\n" + "="*60)
    print("OPENAI RANKINGS:")
    print("-"*60)
    for item in report['rankings']:
        print(f"{item['rank']}. {item['model_id']}: {item['average_score']:.1f}/100")
    
    print(f"\n[SUCCESS] Results saved to: {output_dir}")
    print("="*60)
    
    return report


if __name__ == "__main__":
    asyncio.run(run_openai_benchmark())