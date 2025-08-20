"""
Test Anthropic models with provided API key
"""
import asyncio
import json
import os
from datetime import datetime
from pathlib import Path
import time
from typing import Dict, List, Any

# Set the API keys
os.environ['ANTHROPIC_API_KEY'] = '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'
os.environ['OPENAI_API_KEY'] = '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'

from app.services.models.unified_client import UnifiedModelClient
from openai import AsyncOpenAI

class AnthropicTester:
    def __init__(self):
        self.client = UnifiedModelClient()
        self.openai_client = AsyncOpenAI(api_key=os.getenv('OPENAI_API_KEY'))
        
        # Anthropic models to test (matching registered model IDs)
        self.models_to_test = [
            'claude-3.5-sonnet',  # Maps to claude-3-5-sonnet-20241022
            'claude-sonnet-4',
            'claude-opus-4.1'
        ]
        
        # Standard test cases
        self.test_cases = {
            'poem_moon': {
                'prompt': 'Write a beautiful poem about the moon and stars',
                'type': 'creative'
            },
            'story_robot': {
                'prompt': 'Write a short story about a robot learning to paint',
                'type': 'narrative'
            },
            'code_fibonacci': {
                'prompt': 'Write a Python function to generate Fibonacci sequence',
                'type': 'technical'
            }
        }
        
    async def test_model(self, model_id: str, test_id: str, prompt: str) -> Dict:
        """Test a single model with a single prompt"""
        print(f"  Testing {model_id} with {test_id}...")
        
        result = {
            'model_id': model_id,
            'test_id': test_id,
            'timestamp': datetime.now().isoformat()
        }
        
        try:
            start_time = time.time()
            
            # Phase 1: Call the actual model
            response = await self.client.generate(
                model_id=model_id,
                prompt=prompt,
                max_tokens=500,
                temperature=0.7
            )
            
            duration = time.time() - start_time
            
            result.update({
                'success': True,
                'duration': duration,
                'response': response[:1000] if isinstance(response, str) else str(response)[:1000],  # Truncate for storage
                'response_length': len(response) if isinstance(response, str) else len(str(response))
            })
            
            # Phase 2: Score with GPT-4o-mini
            score_result = await self.score_response(response, test_id)
            result.update(score_result)
            
            print(f"    Success! Score: {result.get('overall_score', 0):.1f}/100")
            
        except Exception as e:
            result.update({
                'success': False,
                'duration': time.time() - start_time,
                'error': str(e),
                'response': '',
                'score_details': {
                    'total_score': 0,
                    'dimensions': {
                        'rhythm': 0,
                        'composition': 0,
                        'narrative': 0,
                        'emotion': 0,
                        'creativity': 0,
                        'cultural': 0
                    },
                    'highlights': [],
                    'weaknesses': [f"Failed: {str(e)}"]
                },
                'overall_score': 0,
                'dimensions': {
                    'rhythm': 0,
                    'composition': 0,
                    'narrative': 0,
                    'emotion': 0,
                    'creativity': 0,
                    'cultural': 0
                }
            })
            print(f"    Failed: {str(e)[:100]}")
        
        return result
    
    async def score_response(self, response: str, test_type: str) -> Dict:
        """Score a response using GPT-4o-mini"""
        scoring_prompt = f"""
        Score the following {test_type} response on these dimensions (0-100):
        - Rhythm: Flow and pacing
        - Composition: Structure and organization  
        - Narrative: Storytelling quality
        - Emotion: Emotional expression
        - Creativity: Originality
        - Cultural: Cultural appropriateness

        Response to score:
        {response[:2000]}

        Provide scores in JSON format:
        {{
            "dimensions": {{
                "rhythm": <score>,
                "composition": <score>,
                "narrative": <score>,
                "emotion": <score>,
                "creativity": <score>,
                "cultural": <score>
            }},
            "total_score": <average of all dimensions>,
            "highlights": ["strength 1", "strength 2"],
            "weaknesses": ["weakness 1"]
        }}
        """
        
        try:
            completion = await self.openai_client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": "You are an expert evaluator of AI-generated content."},
                    {"role": "user", "content": scoring_prompt}
                ],
                temperature=0.3,
                response_format={"type": "json_object"}
            )
            
            score_data = json.loads(completion.choices[0].message.content)
            
            return {
                'overall_score': score_data.get('total_score', 0),
                'dimensions': score_data.get('dimensions', {}),
                'score_details': score_data
            }
            
        except Exception as e:
            print(f"    Warning: Scoring failed: {e}")
            return {
                'overall_score': 0,
                'dimensions': {},
                'score_details': {'error': str(e)}
            }
    
    async def run_all_tests(self):
        """Run all tests for all Anthropic models"""
        print("="*70)
        print("ANTHROPIC MODELS BENCHMARK TEST")
        print("="*70)
        print(f"Models to test: {', '.join(self.models_to_test)}")
        print(f"Test cases: {', '.join(self.test_cases.keys())}")
        print(f"Using Anthropic API Key: {os.environ.get('ANTHROPIC_API_KEY', 'NOT SET')[:20]}...")
        print()
        
        all_results = []
        
        for model_id in self.models_to_test:
            print(f"\nTesting {model_id}:")
            for test_id, test_info in self.test_cases.items():
                result = await self.test_model(model_id, test_id, test_info['prompt'])
                all_results.append(result)
                await asyncio.sleep(1)  # Rate limiting
        
        # Calculate rankings
        model_scores = {}
        for result in all_results:
            if result.get('success') and result.get('overall_score'):
                model_id = result['model_id']
                if model_id not in model_scores:
                    model_scores[model_id] = {
                        'scores': [],
                        'dimensions': {}
                    }
                model_scores[model_id]['scores'].append(result['overall_score'])
                
                if 'dimensions' in result:
                    for dim, score in result['dimensions'].items():
                        if dim not in model_scores[model_id]['dimensions']:
                            model_scores[model_id]['dimensions'][dim] = []
                        model_scores[model_id]['dimensions'][dim].append(score)
        
        rankings = []
        for model_id, data in model_scores.items():
            avg_score = sum(data['scores']) / len(data['scores']) if data['scores'] else 0
            avg_dimensions = {}
            for dim, scores in data['dimensions'].items():
                avg_dimensions[dim] = sum(scores) / len(scores) if scores else 0
            
            rankings.append({
                'model_id': model_id,
                'average_score': avg_score,
                'average_dimensions': avg_dimensions,
                'tests_completed': len(data['scores'])
            })
        
        rankings.sort(key=lambda x: x['average_score'], reverse=True)
        for i, rank in enumerate(rankings):
            rank['rank'] = i + 1
        
        # Create report
        report = {
            'provider': 'Anthropic',
            'test_date': datetime.now().isoformat(),
            'models_tested': len(self.models_to_test),
            'models': self.models_to_test,
            'total_tests': len(all_results),
            'successful_tests': len([r for r in all_results if r.get('success')]),
            'all_results': all_results,
            'rankings': rankings
        }
        
        # Save results
        output_dir = Path("benchmark_results/anthropic")
        output_dir.mkdir(parents=True, exist_ok=True)
        
        output_file = output_dir / "anthropic_results.json"
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(report, f, indent=2, ensure_ascii=False)
        
        print(f"\n[SAVED] Results to {output_file}")
        
        # Print summary
        print("\n" + "="*70)
        print("TEST SUMMARY")
        print("="*70)
        print(f"Total tests: {report['total_tests']}")
        print(f"Successful: {report['successful_tests']}")
        print(f"Failed: {report['total_tests'] - report['successful_tests']}")
        
        if rankings:
            print("\nModel Rankings:")
            for rank in rankings:
                print(f"  {rank['rank']}. {rank['model_id']}: {rank['average_score']:.1f}/100 ({rank['tests_completed']} tests)")
        
        return report


async def main():
    """Main function"""
    tester = AnthropicTester()
    report = await tester.run_all_tests()
    
    # Generate markdown report
    md_content = f"""# Anthropic Models Benchmark Report
**Test Date**: {datetime.now().strftime('%Y-%m-%d %H:%M')}  
**Models Tested**: {report['models_tested']}  
**Total Tests**: {report['total_tests']}  
**Successful Tests**: {report['successful_tests']}  

## Model Rankings

| Rank | Model | Average Score | Tests Completed |
|------|-------|---------------|-----------------|
"""
    
    for rank in report.get('rankings', []):
        md_content += f"| {rank['rank']} | **{rank['model_id']}** | {rank['average_score']:.1f}/100 | {rank['tests_completed']}/3 |\n"
    
    if report.get('rankings'):
        md_content += "\n## Dimension Scores\n\n"
        md_content += "| Model | Rhythm | Composition | Narrative | Emotion | Creativity | Cultural |\n"
        md_content += "|-------|--------|-------------|-----------|---------|------------|----------|\n"
        
        for rank in report['rankings']:
            dims = rank['average_dimensions']
            md_content += f"| {rank['model_id']} "
            for dim in ['rhythm', 'composition', 'narrative', 'emotion', 'creativity', 'cultural']:
                score = dims.get(dim, 0)
                md_content += f"| {score:.0f} "
            md_content += "|\n"
    
    md_content += "\n## Test Results Summary\n\n"
    
    # Group results by model
    model_results = {}
    for result in report['all_results']:
        model_id = result['model_id']
        if model_id not in model_results:
            model_results[model_id] = []
        model_results[model_id].append(result)
    
    for model_id, results in model_results.items():
        md_content += f"\n### {model_id}\n"
        for result in results:
            status = "SUCCESS" if result['success'] else "FAILED"
            score = result.get('overall_score', 0)
            md_content += f"- {result['test_id']}: {status} "
            if result['success']:
                md_content += f"Score: {score:.1f}/100\n"
            else:
                error_msg = result.get('error', 'Unknown error')[:100]
                md_content += f"Error: {error_msg}\n"
    
    # Save markdown report
    md_file = Path("benchmark_results/anthropic/anthropic_report.md")
    with open(md_file, 'w', encoding='utf-8') as f:
        f.write(md_content)
    
    print(f"[SAVED] Markdown report to {md_file}")


if __name__ == "__main__":
    asyncio.run(main())