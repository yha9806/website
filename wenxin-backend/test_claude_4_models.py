"""
Test Claude 4.0 and 4.1 models availability and performance
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

from anthropic import AsyncAnthropic
from openai import AsyncOpenAI

class Claude4Tester:
    def __init__(self):
        self.anthropic_client = AsyncAnthropic(api_key=os.environ['ANTHROPIC_API_KEY'])
        self.openai_client = AsyncOpenAI(api_key=os.environ['OPENAI_API_KEY'])
        
        # Claude 4 models to test
        self.models_to_test = [
            # Claude 4 series (hypothetical model names)
            'claude-4',
            'claude-4.0',
            'claude-4-20250819',
            'claude-4-opus',
            'claude-4.1',
            'claude-4.1-opus',
            'claude-opus-4.1',
            'claude-sonnet-4',
            'claude-4-sonnet',
            'claude-4.1-sonnet',
            
            # Also try with date suffixes
            'claude-4-opus-20250819',
            'claude-4-sonnet-20250819',
            'claude-4.1-opus-20250819',
            'claude-4.1-sonnet-20250819',
            
            # Try latest versions
            'claude-4-latest',
            'claude-4.1-latest',
            'claude-opus-latest',
            'claude-sonnet-latest'
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
    
    async def check_model_availability(self, model_id: str) -> bool:
        """Check if a model is available"""
        try:
            response = await self.anthropic_client.messages.create(
                model=model_id,
                messages=[{"role": "user", "content": "Hi"}],
                max_tokens=10
            )
            return True
        except Exception as e:
            return False
    
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
            response = await self.anthropic_client.messages.create(
                model=model_id,
                messages=[{"role": "user", "content": prompt}],
                max_tokens=500,
                temperature=0.7
            )
            
            # Extract text from response
            response_text = response.content[0].text if response.content else ""
            
            duration = time.time() - start_time
            
            result.update({
                'success': True,
                'duration': duration,
                'response': response_text[:1000],  # Truncate for storage
                'response_length': len(response_text)
            })
            
            # Phase 2: Score with GPT-4o-mini
            score_result = await self.score_response(response_text, test_id)
            result.update(score_result)
            
            print(f"    SUCCESS! Score: {result.get('overall_score', 0):.1f}/100")
            
        except Exception as e:
            result.update({
                'success': False,
                'duration': time.time() - start_time,
                'error': str(e),
                'response': '',
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
            error_msg = str(e)
            if "404" in error_msg or "not_found" in error_msg:
                print(f"    Model not found")
            else:
                print(f"    Failed: {error_msg[:50]}")
        
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
            return {
                'overall_score': 0,
                'dimensions': {},
                'score_details': {'error': str(e)}
            }
    
    async def run_tests(self):
        """Run tests for Claude 4 models"""
        print("="*70)
        print("CLAUDE 4.0/4.1 MODEL TESTING")
        print("="*70)
        print(f"Checking {len(self.models_to_test)} potential model names...")
        print()
        
        # First, check which models are available
        print("Phase 1: Checking model availability...")
        print("-"*40)
        available_models = []
        for model_id in self.models_to_test:
            print(f"Checking {model_id}...", end=" ")
            is_available = await self.check_model_availability(model_id)
            if is_available:
                print("AVAILABLE!")
                available_models.append(model_id)
            else:
                print("not found")
            await asyncio.sleep(0.5)  # Rate limiting
        
        print()
        print("="*70)
        
        if not available_models:
            print("NO CLAUDE 4.0/4.1 MODELS FOUND")
            print("These models may not be released yet or require special access.")
            return None
        
        print(f"Found {len(available_models)} available Claude 4 models:")
        for model in available_models:
            print(f"  - {model}")
        print()
        
        # Phase 2: Test available models
        print("Phase 2: Running benchmark tests...")
        print("-"*40)
        
        all_results = []
        for model_id in available_models:
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
            'test_type': 'Claude 4.0/4.1 Models',
            'test_date': datetime.now().isoformat(),
            'models_checked': len(self.models_to_test),
            'models_available': len(available_models),
            'available_models': available_models,
            'total_tests': len(all_results),
            'successful_tests': len([r for r in all_results if r.get('success')]),
            'all_results': all_results,
            'rankings': rankings
        }
        
        # Save results
        output_dir = Path("benchmark_results/anthropic")
        output_dir.mkdir(parents=True, exist_ok=True)
        
        output_file = output_dir / "claude_4_test_results.json"
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(report, f, indent=2, ensure_ascii=False)
        
        print(f"\n[SAVED] Results to {output_file}")
        
        # Print summary
        print("\n" + "="*70)
        print("TEST SUMMARY")
        print("="*70)
        print(f"Models checked: {len(self.models_to_test)}")
        print(f"Models available: {len(available_models)}")
        
        if rankings:
            print(f"Total tests: {report['total_tests']}")
            print(f"Successful: {report['successful_tests']}")
            print("\nModel Rankings:")
            for rank in rankings:
                print(f"  {rank['rank']}. {rank['model_id']}: {rank['average_score']:.1f}/100 ({rank['tests_completed']} tests)")
        
        return report


async def main():
    """Main function"""
    tester = Claude4Tester()
    report = await tester.run_tests()
    
    if report and report.get('rankings'):
        # Generate markdown report
        md_content = f"""# Claude 4.0/4.1 Models Test Report
**Test Date**: {datetime.now().strftime('%Y-%m-%d %H:%M')}  
**Models Checked**: {report['models_checked']}  
**Models Available**: {report['models_available']}  
**Total Tests**: {report['total_tests']}  
**Successful Tests**: {report['successful_tests']}  

## Available Models
"""
        for model in report['available_models']:
            md_content += f"- {model}\n"
        
        md_content += "\n## Model Rankings\n\n"
        md_content += "| Rank | Model | Average Score | Tests Completed |\n"
        md_content += "|------|-------|---------------|-----------------|\n"
        
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
        
        # Save markdown report
        md_file = Path("benchmark_results/anthropic/claude_4_test_report.md")
        with open(md_file, 'w', encoding='utf-8') as f:
            f.write(md_content)
        
        print(f"[SAVED] Markdown report to {md_file}")
    else:
        print("\nNo Claude 4.0/4.1 models were found available.")
        print("These models may not be released yet or require special API access.")


if __name__ == "__main__":
    asyncio.run(main())