"""
Test Claude 4 models with correct API identifiers
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

class Claude4Benchmark:
    def __init__(self):
        self.anthropic_client = AsyncAnthropic(api_key=os.environ['ANTHROPIC_API_KEY'])
        self.openai_client = AsyncOpenAI(api_key=os.environ['OPENAI_API_KEY'])
        
        # Claude 4 models with correct API identifiers from docs
        self.models_to_test = {
            'claude-opus-4-1-20250805': 'Claude Opus 4.1',
            'claude-opus-4-1': 'Claude Opus 4.1 (alias)',
            'claude-opus-4-20250514': 'Claude Opus 4',
            'claude-opus-4-0': 'Claude Opus 4 (alias)',
            'claude-sonnet-4-20250514': 'Claude Sonnet 4',
            'claude-sonnet-4-0': 'Claude Sonnet 4 (alias)'
        }
        
        # Load existing results to avoid retesting
        self.existing_results = self.load_existing_results()
        
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
    
    def load_existing_results(self) -> set:
        """Load already tested models from existing results"""
        tested_models = set()
        
        # Check existing Anthropic results
        result_files = [
            'benchmark_results/anthropic/anthropic_final.json',
            'benchmark_results/anthropic/anthropic_results.json',
            'benchmark_results/anthropic/claude_4_test_results.json'
        ]
        
        for file_path in result_files:
            if Path(file_path).exists():
                try:
                    with open(file_path, 'r', encoding='utf-8') as f:
                        data = json.load(f)
                        if 'all_results' in data:
                            for result in data['all_results']:
                                if result.get('success'):
                                    model_id = result.get('model_id')
                                    if model_id:
                                        tested_models.add(model_id)
                except Exception as e:
                    print(f"Error loading {file_path}: {e}")
        
        return tested_models
    
    async def test_model(self, model_id: str, display_name: str, test_id: str, prompt: str) -> Dict:
        """Test a single model with a single prompt"""
        print(f"  Testing {display_name} with {test_id}...")
        
        result = {
            'model_id': model_id,
            'display_name': display_name,
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
                print(f"    Model not available")
            elif "401" in error_msg or "authentication" in error_msg:
                print(f"    Authentication error")
            else:
                print(f"    Failed: {error_msg[:60]}")
        
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
        print("CLAUDE 4 MODELS BENCHMARK TEST")
        print("="*70)
        print(f"Models to test: {len(self.models_to_test)}")
        print(f"Already tested models: {len(self.existing_results)}")
        print()
        
        # Filter out already tested models
        models_to_test = {}
        for model_id, display_name in self.models_to_test.items():
            if model_id in self.existing_results:
                print(f"  [SKIP] {display_name} - already tested")
            else:
                models_to_test[model_id] = display_name
                print(f"  [TEST] {display_name}")
        
        if not models_to_test:
            print("\nAll Claude 4 models have already been tested.")
            return None
        
        print(f"\nWill test {len(models_to_test)} new models")
        print()
        
        all_results = []
        available_models = []
        
        for model_id, display_name in models_to_test.items():
            print(f"\nTesting {display_name} ({model_id}):")
            model_available = False
            
            for test_id, test_info in self.test_cases.items():
                result = await self.test_model(model_id, display_name, test_id, test_info['prompt'])
                all_results.append(result)
                
                if result.get('success'):
                    model_available = True
                
                await asyncio.sleep(1)  # Rate limiting
            
            if model_available:
                available_models.append(model_id)
        
        if not all_results:
            print("\nNo new tests were performed.")
            return None
        
        # Calculate rankings
        model_scores = {}
        for result in all_results:
            if result.get('success') and result.get('overall_score'):
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
        for i, rank in enumerate(rankings):
            rank['rank'] = i + 1
        
        # Create report
        report = {
            'test_type': 'Claude 4 Models',
            'test_date': datetime.now().isoformat(),
            'models_tested': len(models_to_test),
            'models_available': len(available_models),
            'available_models': available_models,
            'total_tests': len(all_results),
            'successful_tests': len([r for r in all_results if r.get('success')]),
            'all_results': all_results,
            'rankings': rankings
        }
        
        # Save results to existing structure
        output_dir = Path("benchmark_results/anthropic")
        output_dir.mkdir(parents=True, exist_ok=True)
        
        # Save new results
        output_file = output_dir / "claude_4_final.json"
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(report, f, indent=2, ensure_ascii=False)
        
        print(f"\n[SAVED] Results to {output_file}")
        
        # Merge with existing Anthropic results if needed
        self.merge_with_existing_results(report)
        
        # Print summary
        print("\n" + "="*70)
        print("TEST SUMMARY")
        print("="*70)
        print(f"Models tested: {len(models_to_test)}")
        print(f"Models available: {len(available_models)}")
        print(f"Total tests: {report['total_tests']}")
        print(f"Successful: {report['successful_tests']}")
        
        if rankings:
            print("\nModel Rankings:")
            for rank in rankings:
                print(f"  {rank['rank']}. {rank['display_name']}: {rank['average_score']:.1f}/100 ({rank['tests_completed']} tests)")
        
        return report
    
    def merge_with_existing_results(self, new_report):
        """Merge new results with existing Anthropic results"""
        main_file = Path("benchmark_results/anthropic/anthropic_final.json")
        
        if main_file.exists():
            try:
                with open(main_file, 'r', encoding='utf-8') as f:
                    existing_data = json.load(f)
                
                # Add new results to existing data
                if 'all_results' in existing_data and new_report.get('all_results'):
                    existing_data['all_results'].extend(new_report['all_results'])
                    existing_data['total_tests'] = len(existing_data['all_results'])
                    existing_data['successful_tests'] = len([r for r in existing_data['all_results'] if r.get('success')])
                    
                    # Update model count
                    unique_models = set()
                    for result in existing_data['all_results']:
                        if result.get('success'):
                            unique_models.add(result.get('model_id'))
                    existing_data['models_tested'] = len(unique_models)
                    
                    # Save merged results
                    with open(main_file, 'w', encoding='utf-8') as f:
                        json.dump(existing_data, f, indent=2, ensure_ascii=False)
                    
                    print(f"[MERGED] Results added to {main_file}")
                    
            except Exception as e:
                print(f"Error merging results: {e}")


async def main():
    """Main function"""
    benchmark = Claude4Benchmark()
    report = await benchmark.run_tests()
    
    if report and report.get('rankings'):
        # Generate markdown report
        md_content = f"""# Claude 4 Models Benchmark Report
**Test Date**: {datetime.now().strftime('%Y-%m-%d %H:%M')}  
**Models Tested**: {report['models_tested']}  
**Models Available**: {report['models_available']}  
**Total Tests**: {report['total_tests']}  
**Successful Tests**: {report['successful_tests']}  

## Model Rankings

| Rank | Model | Average Score | Tests Completed |
|------|-------|---------------|-----------------|
"""
        
        for rank in report.get('rankings', []):
            md_content += f"| {rank['rank']} | **{rank['display_name']}** | {rank['average_score']:.1f}/100 | {rank['tests_completed']}/3 |\n"
        
        if report.get('rankings'):
            md_content += "\n## Dimension Scores\n\n"
            md_content += "| Model | Rhythm | Composition | Narrative | Emotion | Creativity | Cultural |\n"
            md_content += "|-------|--------|-------------|-----------|---------|------------|----------|\n"
            
            for rank in report['rankings']:
                dims = rank['average_dimensions']
                md_content += f"| {rank['display_name']} "
                for dim in ['rhythm', 'composition', 'narrative', 'emotion', 'creativity', 'cultural']:
                    score = dims.get(dim, 0)
                    md_content += f"| {score:.0f} "
                md_content += "|\n"
        
        md_content += "\n## Notes\n\n"
        if report['models_available'] > 0:
            md_content += "- Claude 4 models were successfully tested with the provided API key\n"
            md_content += "- These represent the latest generation of Claude models with enhanced capabilities\n"
        else:
            md_content += "- Claude 4 models were not available with the current API key\n"
            md_content += "- These models may require special access or different API endpoints\n"
        
        # Save markdown report
        md_file = Path("benchmark_results/anthropic/claude_4_final.md")
        with open(md_file, 'w', encoding='utf-8') as f:
            f.write(md_content)
        
        print(f"[SAVED] Markdown report to {md_file}")


if __name__ == "__main__":
    asyncio.run(main())