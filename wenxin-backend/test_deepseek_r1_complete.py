"""
Complete test for DeepSeek R1 models with fixed configuration
Tests all 3 standard cases including poetry generation
"""
import asyncio
import json
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Any


class DeepSeekR1Tester:
    """Complete tester for DeepSeek R1 models"""
    
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
        
        # Models to test - only R1 models that need complete testing
        self.models_to_test = ['deepseek-r1', 'deepseek-r1-distill', 'deepseek-v3']
        
    async def initialize(self):
        """Initialize the unified client"""
        from app.services.models import UnifiedModelClient, model_registry
        from app.services.models.configs import model_configs
        
        # Load all models
        model_configs.load_all_models()
        
        # Initialize client
        self.client = UnifiedModelClient()
        
        # Check configuration
        for model_id in self.models_to_test:
            model = model_registry.get_model(model_id)
            if model:
                print(f"  {model_id}: API={model.api_model_name}, Provider={model.provider}")
    
    async def test_model(self, model_id: str) -> List[Dict]:
        """Test a single model with all test cases"""
        results = []
        
        print(f"\nTesting {model_id}:")
        print("-" * 40)
        
        for test_case in self.test_cases:
            print(f"  {test_case['test_id']}...", end=' ')
            
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
                    print(f"[SUCCESS] {len(content)} chars in {duration:.1f}s")
                    
                    # Try to score with GPT-4o-mini
                    score_result = await self.score_with_gpt4(
                        test_case['prompt'],
                        content,
                        test_case.get('task_type', 'general')
                    )
                    
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
                        print(f"    Score: {score_result.get('total_score', 0):.1f}/100")
                    
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
    
    async def score_with_gpt4(self, prompt: str, response: str, task_type: str) -> Dict:
        """Score response using GPT-4o-mini"""
        try:
            scoring_prompt = f"""You are an expert evaluator. Score this {task_type} response on 6 dimensions.

Original prompt: {prompt}

Response to evaluate:
{response}

Score each dimension from 0-100:
1. Rhythm (flow and pacing)
2. Composition (structure and organization) 
3. Narrative (storytelling quality)
4. Emotion (emotional expression)
5. Creativity (originality)
6. Cultural (cultural appropriateness)

Return ONLY a JSON object with this exact format:
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
  "highlights": ["point1", "point2"],
  "weaknesses": ["point1"]
}}"""

            # Use GPT-4o-mini for scoring
            score_response = await self.client.generate(
                model_id='gpt-4o-mini',
                prompt=scoring_prompt,
                max_tokens=300,
                temperature=0.3
            )
            
            # Extract content
            if isinstance(score_response, dict):
                score_content = score_response.get('content', '')
            elif hasattr(score_response, 'choices') and score_response.choices:
                score_content = score_response.choices[0].message.content
            else:
                score_content = str(score_response) if score_response else ''
            
            # Parse JSON from response
            if score_content:
                # Try to extract JSON
                import re
                json_match = re.search(r'\{[\s\S]*\}', score_content)
                if json_match:
                    return json.loads(json_match.group())
            
        except Exception as e:
            print(f"    [Scoring error: {str(e)[:50]}]")
        
        return None


async def main():
    """Main test function"""
    print("="*60)
    print("DEEPSEEK R1 COMPLETE TESTING")
    print("="*60)
    print("\nConfiguration:")
    
    tester = DeepSeekR1Tester()
    await tester.initialize()
    
    # Load existing results to check what's missing
    existing_file = Path("benchmark_results/deepseek/deepseek_results.json")
    if existing_file.exists():
        with open(existing_file, 'r', encoding='utf-8') as f:
            existing_data = json.load(f)
        existing_tests = {(r['model_id'], r['test_id']) 
                         for r in existing_data.get('all_results', []) 
                         if 'test_id' in r and r.get('success')}
    else:
        existing_data = {'all_results': []}
        existing_tests = set()
    
    print(f"\nExisting successful tests: {len(existing_tests)}")
    
    # Test all models
    all_results = []
    
    for model_id in tester.models_to_test:
        # Check what's missing for this model
        missing_tests = []
        for test_case in tester.test_cases:
            if (model_id, test_case['test_id']) not in existing_tests:
                missing_tests.append(test_case['test_id'])
        
        if missing_tests:
            print(f"\n{model_id} needs: {', '.join(missing_tests)}")
            results = await tester.test_model(model_id)
            all_results.extend(results)
        else:
            print(f"\n{model_id}: All tests already complete, skipping")
    
    # Merge with existing data
    if all_results:
        print("\n" + "="*60)
        print("MERGING RESULTS")
        print("="*60)
        
        # Add new results to existing data
        for result in all_results:
            # Check if this test already exists
            exists = False
            for i, existing in enumerate(existing_data['all_results']):
                if (existing.get('model_id') == result['model_id'] and 
                    existing.get('test_id') == result['test_id']):
                    # Replace with new result
                    existing_data['all_results'][i] = result
                    exists = True
                    print(f"  Updated: {result['model_id']} - {result['test_id']}")
                    break
            
            if not exists:
                existing_data['all_results'].append(result)
                print(f"  Added: {result['model_id']} - {result['test_id']}")
    
    # Calculate final statistics and rankings
    models = list(set(r['model_id'] for r in existing_data['all_results']))
    successful = [r for r in existing_data['all_results'] if r.get('success')]
    
    # Calculate rankings
    model_scores = {}
    for r in successful:
        if r.get('overall_score'):
            model_id = r['model_id']
            if model_id not in model_scores:
                model_scores[model_id] = {
                    'scores': [],
                    'dimensions': {}
                }
            model_scores[model_id]['scores'].append(r['overall_score'])
            
            if 'dimensions' in r:
                for dim, score in r['dimensions'].items():
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
    
    # Update report
    existing_data.update({
        'provider': 'DeepSeek',
        'test_date': datetime.now().isoformat(),
        'models_tested': len(models),
        'models': sorted(models),
        'total_tests': len(existing_data['all_results']),
        'successful_tests': len(successful),
        'rankings': rankings
    })
    
    # Save updated results
    output_file = Path("benchmark_results/deepseek/deepseek_complete.json")
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(existing_data, f, indent=2, ensure_ascii=False)
    
    print(f"\n[SAVED] Complete results to {output_file}")
    
    # Generate markdown report
    md_content = f"""# DeepSeek Models Benchmark Report
**Test Date**: {datetime.now().strftime('%Y-%m-%d')}  
**Models Tested**: {len(models)}  
**Total Tests**: {len(existing_data['all_results'])}  
**Successful Tests**: {len(successful)}  

## Model Rankings

| Rank | Model | Average Score | Tests |
|------|-------|---------------|-------|
"""
    
    for rank in rankings:
        md_content += f"| {rank['rank']} | **{rank['model_id']}** | {rank['average_score']:.1f}/100 | {rank['tests_completed']} |\n"
    
    md_content += "\n## Test Coverage\n\n"
    
    # Check test coverage
    test_coverage = {}
    for r in existing_data['all_results']:
        model = r.get('model_id', 'unknown')
        test = r.get('test_id', 'unknown')
        if model not in test_coverage:
            test_coverage[model] = {'poem_moon': '❌', 'story_robot': '❌', 'code_fibonacci': '❌'}
        if test in test_coverage[model] and r.get('success'):
            test_coverage[model][test] = '✅'
    
    md_content += "| Model | Poem | Story | Code |\n"
    md_content += "|-------|------|-------|------|\n"
    for model in sorted(test_coverage.keys()):
        tests = test_coverage[model]
        md_content += f"| {model} | {tests.get('poem_moon', '❌')} | {tests.get('story_robot', '❌')} | {tests.get('code_fibonacci', '❌')} |\n"
    
    # Save markdown report
    md_file = Path("benchmark_results/deepseek/deepseek_complete.md")
    with open(md_file, 'w', encoding='utf-8') as f:
        f.write(md_content)
    
    print(f"[SAVED] Markdown report to {md_file}")
    
    print("\n" + "="*60)
    print("TESTING COMPLETE")
    print("="*60)
    
    # Final summary
    print("\nFinal Summary:")
    for rank in rankings[:5]:
        print(f"  {rank['rank']}. {rank['model_id']}: {rank['average_score']:.1f}/100")


if __name__ == "__main__":
    asyncio.run(main())