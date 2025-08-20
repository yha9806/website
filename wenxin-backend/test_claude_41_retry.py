"""
Test Claude 4.1 models with retry mechanism for handling server errors
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

from anthropic import AsyncAnthropic, APIError, APIStatusError
from openai import AsyncOpenAI

class Claude41Benchmark:
    def __init__(self):
        self.anthropic_client = AsyncAnthropic(api_key=os.environ['ANTHROPIC_API_KEY'])
        self.openai_client = AsyncOpenAI(api_key=os.environ['OPENAI_API_KEY'])
        
        # Claude 4.1 models to test (using correct model ID from search)
        self.models_to_test = [
            'claude-opus-4-1-20250805',  # Correct model ID according to search
        ]
        
        # Model display names for reporting
        self.model_names = {
            'claude-opus-4-1-20250805': 'Claude Opus 4.1 (2025-08-05)',
        }
        
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
        
        # Retry configuration
        self.max_retries = 3
        self.retry_delays = [5, 10, 20]  # Increasing delays in seconds
    
    async def test_model_with_retry(self, model_id: str, test_id: str, prompt: str) -> Dict:
        """Test a model with retry mechanism for handling server errors"""
        display_name = self.model_names.get(model_id, model_id)
        
        for attempt in range(self.max_retries):
            print(f"  Testing {display_name} with {test_id}... (Attempt {attempt + 1}/{self.max_retries})")
            
            result = {
                'model_id': model_id,
                'display_name': display_name,
                'test_id': test_id,
                'timestamp': datetime.now().isoformat(),
                'attempt': attempt + 1
            }
            
            try:
                start_time = time.time()
                
                # Phase 1: Call the actual model (without temperature AND top_p)
                # According to search results, Opus 4.1 doesn't allow both
                response = await self.anthropic_client.messages.create(
                    model=model_id,
                    messages=[{"role": "user", "content": prompt}],
                    max_tokens=500,
                    temperature=0.7  # Only use temperature, not top_p
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
                
                print(f"    Success! Score: {result.get('overall_score', 0):.1f}/100")
                return result  # Success, return immediately
                
            except APIStatusError as e:
                # Handle specific API status errors
                error_msg = f"Status {e.status_code}: {str(e)}"
                print(f"    API Error: {error_msg}")
                
                if e.status_code == 500 or e.status_code == 503:
                    # Server error, worth retrying
                    if attempt < self.max_retries - 1:
                        delay = self.retry_delays[attempt]
                        print(f"    Server error, retrying in {delay} seconds...")
                        await asyncio.sleep(delay)
                        continue
                
                # Final attempt failed or non-retryable error
                result.update({
                    'success': False,
                    'duration': time.time() - start_time,
                    'error': error_msg,
                    'error_code': e.status_code,
                    'response': '',
                    'score_details': self._empty_score_details(error_msg),
                    'overall_score': 0,
                    'dimensions': self._empty_dimensions()
                })
                return result
                
            except Exception as e:
                # General exception
                error_msg = str(e)[:200]
                print(f"    Error: {error_msg}")
                
                if attempt < self.max_retries - 1:
                    delay = self.retry_delays[attempt]
                    print(f"    Retrying in {delay} seconds...")
                    await asyncio.sleep(delay)
                    continue
                
                # Final attempt failed
                result.update({
                    'success': False,
                    'duration': time.time() - start_time,
                    'error': error_msg,
                    'response': '',
                    'score_details': self._empty_score_details(error_msg),
                    'overall_score': 0,
                    'dimensions': self._empty_dimensions()
                })
                return result
        
        # Should not reach here
        return result
    
    def _empty_dimensions(self) -> Dict:
        """Return empty dimensions structure"""
        return {
            'rhythm': 0,
            'composition': 0,
            'narrative': 0,
            'emotion': 0,
            'creativity': 0,
            'cultural': 0
        }
    
    def _empty_score_details(self, error_msg: str) -> Dict:
        """Return empty score details with error"""
        return {
            'total_score': 0,
            'dimensions': self._empty_dimensions(),
            'highlights': [],
            'weaknesses': [f"Failed: {error_msg}"]
        }
    
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
        """Run all tests for Claude 4.1 models"""
        print("="*70)
        print("CLAUDE 4.1 MODELS BENCHMARK TEST (WITH RETRY)")
        print("="*70)
        print(f"Models to test: {len(self.models_to_test)}")
        for model_id in self.models_to_test:
            print(f"  - {self.model_names.get(model_id, model_id)}")
        print(f"Test cases: {', '.join(self.test_cases.keys())}")
        print(f"Retry configuration: {self.max_retries} attempts with delays {self.retry_delays}")
        print()
        
        all_results = []
        
        for model_id in self.models_to_test:
            display_name = self.model_names.get(model_id, model_id)
            print(f"\nTesting {display_name}:")
            for test_id, test_info in self.test_cases.items():
                result = await self.test_model_with_retry(model_id, test_id, test_info['prompt'])
                all_results.append(result)
                await asyncio.sleep(2)  # Rate limiting between tests
        
        # Calculate statistics
        successful_tests = [r for r in all_results if r.get('success')]
        failed_tests = [r for r in all_results if not r.get('success')]
        
        # Create report
        report = {
            'provider': 'Anthropic',
            'test_suite': 'Claude 4.1 Retry Test',
            'test_date': datetime.now().isoformat(),
            'models_tested': len(self.models_to_test),
            'models': self.models_to_test,
            'total_tests': len(all_results),
            'successful_tests': len(successful_tests),
            'failed_tests': len(failed_tests),
            'retry_configuration': {
                'max_retries': self.max_retries,
                'retry_delays': self.retry_delays
            },
            'all_results': all_results
        }
        
        # Calculate rankings if we have successful tests
        if successful_tests:
            model_scores = {}
            for result in successful_tests:
                model_id = result['model_id']
                if model_id not in model_scores:
                    model_scores[model_id] = {
                        'display_name': result['display_name'],
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
                    'display_name': data['display_name'],
                    'average_score': avg_score,
                    'average_dimensions': avg_dimensions,
                    'tests_completed': len(data['scores'])
                })
            
            rankings.sort(key=lambda x: x['average_score'], reverse=True)
            report['rankings'] = rankings
        
        # Save results
        output_dir = Path("benchmark_results/anthropic")
        output_dir.mkdir(parents=True, exist_ok=True)
        
        output_file = output_dir / "claude_41_retry.json"
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(report, f, indent=2, ensure_ascii=False)
        
        print(f"\n[SAVED] Results to {output_file}")
        
        # Print summary
        print("\n" + "="*70)
        print("TEST SUMMARY")
        print("="*70)
        print(f"Total tests: {report['total_tests']}")
        print(f"Successful: {report['successful_tests']}")
        print(f"Failed: {report['failed_tests']}")
        
        if failed_tests:
            print("\nFailed Tests:")
            for result in failed_tests:
                error = result.get('error', 'Unknown error')
                attempts = result.get('attempt', 1)
                print(f"  - {result['model_id']} / {result['test_id']}: {error} (after {attempts} attempts)")
        
        if 'rankings' in report:
            print("\nModel Performance:")
            for rank in report['rankings']:
                print(f"  {rank['display_name']}: {rank['average_score']:.1f}/100 ({rank['tests_completed']} tests)")
        
        return report


async def main():
    """Main function"""
    benchmark = Claude41Benchmark()
    report = await benchmark.run_all_tests()
    
    # Generate markdown report
    md_content = f"""# Claude 4.1 Models Benchmark Report (With Retry)
**Test Date**: {datetime.now().strftime('%Y-%m-%d %H:%M')}  
**Models Tested**: {report['models_tested']}  
**Total Tests**: {report['total_tests']}  
**Successful Tests**: {report['successful_tests']}  
**Failed Tests**: {report['failed_tests']}  

## Retry Configuration
- Max Retries: {report['retry_configuration']['max_retries']}
- Retry Delays: {report['retry_configuration']['retry_delays']} seconds

## Test Results
"""
    
    for result in report['all_results']:
        status = "✅ SUCCESS" if result['success'] else "❌ FAILED"
        md_content += f"\n### {result['model_id']} - {result['test_id']}\n"
        md_content += f"- Status: {status}\n"
        md_content += f"- Attempts: {result.get('attempt', 1)}\n"
        
        if result['success']:
            md_content += f"- Score: {result.get('overall_score', 0):.1f}/100\n"
            md_content += f"- Duration: {result.get('duration', 0):.2f}s\n"
            if 'dimensions' in result:
                dims = result['dimensions']
                md_content += f"- Dimensions: R:{dims.get('rhythm', 0):.0f} C:{dims.get('composition', 0):.0f} "
                md_content += f"N:{dims.get('narrative', 0):.0f} E:{dims.get('emotion', 0):.0f} "
                md_content += f"Cr:{dims.get('creativity', 0):.0f} Cu:{dims.get('cultural', 0):.0f}\n"
        else:
            md_content += f"- Error: {result.get('error', 'Unknown error')}\n"
            if 'error_code' in result:
                md_content += f"- Error Code: {result['error_code']}\n"
    
    if 'rankings' in report:
        md_content += "\n## Model Performance Summary\n\n"
        md_content += "| Model | Average Score | Tests Completed |\n"
        md_content += "|-------|---------------|----------------|\n"
        for rank in report['rankings']:
            md_content += f"| {rank['display_name']} | {rank['average_score']:.1f}/100 | {rank['tests_completed']}/3 |\n"
    
    md_content += "\n## Notes\n\n"
    md_content += "- Claude Opus 4.1 (claude-opus-4-1-20250805) is the latest version released on August 5, 2025\n"
    md_content += "- This model improves on agentic tasks, real-world coding, and reasoning\n"
    md_content += "- The model may experience high demand leading to 500/503 errors\n"
    md_content += "- Retry mechanism implemented to handle transient server errors\n"
    md_content += "- Note: temperature and top_p cannot be used together for Opus 4.1\n"
    
    # Save markdown report
    md_file = Path("benchmark_results/anthropic/claude_41_retry.md")
    with open(md_file, 'w', encoding='utf-8') as f:
        f.write(md_content)
    
    print(f"[SAVED] Markdown report to {md_file}")


if __name__ == "__main__":
    asyncio.run(main())