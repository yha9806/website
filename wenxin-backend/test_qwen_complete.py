"""
Test Qwen models including Qwen3 series with benchmark tests
Note: Requires QWEN_API_KEY environment variable to be set
"""
import asyncio
import json
import os
from datetime import datetime
from pathlib import Path
import time
from typing import Dict, List, Any

# Set the API keys
os.environ['QWEN_API_KEY'] = 'sk-906c1e5cd7494bc3b45bc3b738c273ac'
os.environ['OPENAI_API_KEY'] = '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'
# Hugging Face API keys (for future use)
# os.environ['HUGGINGFACE_API_KEY'] = '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'
# os.environ['HUGGINGFACE_API_KEY_2'] = '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'

from openai import AsyncOpenAI

class QwenCompleteBenchmark:
    def __init__(self):
        # Check if API key is set
        self.api_key = os.getenv('QWEN_API_KEY')
        if not self.api_key:
            print("WARNING: QWEN_API_KEY not set. Please set it before running tests.")
            print("You can get an API key from: https://dashscope.aliyun.com/")
            return
        
        # Qwen client using OpenAI-compatible interface
        # Try international endpoint first
        self.qwen_client = AsyncOpenAI(
            api_key=self.api_key,
            base_url="https://dashscope-intl.aliyuncs.com/compatible-mode/v1"
        )
        
        # OpenAI client for scoring
        self.openai_client = AsyncOpenAI(api_key=os.environ['OPENAI_API_KEY'])
        
        # Complete list of Qwen models available through DashScope
        self.models_to_test = {
            # Qwen2.5-Max (Latest flagship)
            'qwen-max-2025-01-25': 'Qwen2.5-Max (2025-01-25)',
            'qwen-max-latest': 'Qwen-Max (Latest)',
            'qwen-max': 'Qwen-Max (Stable)',
            
            # Standard commercial models
            'qwen-plus': 'Qwen-Plus',
            'qwen-flash': 'Qwen-Flash',
            'qwen-turbo': 'Qwen-Turbo (Legacy)',
            
            # Qwen3 series - MoE models with thinking capabilities
            'qwen3-235b-a22b-thinking-2507': 'Qwen3-235B-A22B (Thinking)',
            'qwen3-235b-a22b-instruct-2507': 'Qwen3-235B-A22B (Instruct)',
            'qwen3-30b-a3b-thinking-2507': 'Qwen3-30B-A3B (Thinking)',
            'qwen3-30b-a3b-instruct-2507': 'Qwen3-30B-A3B (Instruct)',
            
            # Qwen3 open source dense models
            'qwen3-32b': 'Qwen3-32B',
            'qwen3-14b': 'Qwen3-14B',
            'qwen3-8b': 'Qwen3-8B',
            'qwen3-4b': 'Qwen3-4B',
            
            # Qwen3 Coder models
            'qwen3-coder-plus': 'Qwen3-Coder-Plus',
            
            # Qwen2.5 series (if available)
            'qwen2.5-72b-instruct': 'Qwen2.5-72B-Instruct',
            'qwen2.5-32b-instruct': 'Qwen2.5-32B-Instruct',
            'qwen2.5-14b-instruct': 'Qwen2.5-14B-Instruct',
            'qwen2.5-7b-instruct': 'Qwen2.5-7B-Instruct',
        }
        
        # Models to prioritize for testing
        self.priority_models = [
            'qwen-max-2025-01-25',
            'qwen-plus',
            'qwen-flash',
            'qwen3-32b',
            'qwen3-8b',
            'qwen3-coder-plus'
        ]
        
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
        
        # Check existing Qwen results
        result_files = [
            'benchmark_results/qwen/qwen_final.json',
            'benchmark_results/qwen/qwen_complete.json',
            'benchmark_results/qwen/qwen_results.json'
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
            
            # Prepare messages based on model type
            messages = [{"role": "user", "content": prompt}]
            
            # Add system message for non-thinking models
            if 'thinking' not in model_id.lower():
                messages.insert(0, {"role": "system", "content": "You are a helpful assistant."})
            
            # Phase 1: Call the actual model
            params = {
                'model': model_id,
                'messages': messages,
                'max_tokens': 500,
                'temperature': 0.7
            }
            
            # Add thinking mode parameter for Qwen3 models
            if 'qwen3' in model_id and 'thinking' not in model_id and 'instruct' not in model_id:
                params['extra_body'] = {'enable_thinking': False}
            
            response = await self.qwen_client.chat.completions.create(**params)
            
            # Extract text from response
            response_text = response.choices[0].message.content if response.choices else ""
            
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
                print(f"    Authentication error - check QWEN_API_KEY")
            elif "400" in error_msg:
                print(f"    Bad request - model may not support this operation")
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
    
    async def run_tests(self, test_priority_only=False):
        """Run tests for Qwen models"""
        if not self.api_key:
            print("\n" + "="*70)
            print("QWEN MODELS BENCHMARK TEST - SKIPPED")
            print("="*70)
            print("ERROR: QWEN_API_KEY not set")
            print("\nTo test Qwen models, you need to:")
            print("1. Register at: https://dashscope.aliyun.com/")
            print("2. Get your API key from the dashboard")
            print("3. Set the QWEN_API_KEY environment variable")
            print("\nExample:")
            print("  export QWEN_API_KEY='your-api-key-here'")
            print("  python test_qwen_complete.py")
            return None
        
        print("="*70)
        print("QWEN MODELS COMPLETE BENCHMARK TEST")
        print("="*70)
        print(f"Total models configured: {len(self.models_to_test)}")
        print(f"Priority models: {len(self.priority_models)}")
        print(f"Already tested models: {len(self.existing_results)}")
        print()
        
        # Determine which models to test
        if test_priority_only:
            models_to_test = {k: v for k, v in self.models_to_test.items() 
                            if k in self.priority_models}
            print("Testing priority models only")
        else:
            models_to_test = self.models_to_test
        
        # Filter out already tested models
        final_models = {}
        for model_id, display_name in models_to_test.items():
            if model_id in self.existing_results:
                print(f"  [SKIP] {display_name} - already tested")
            else:
                final_models[model_id] = display_name
                print(f"  [TEST] {display_name}")
        
        if not final_models:
            print("\nAll selected Qwen models have already been tested.")
            return None
        
        print(f"\nWill test {len(final_models)} new models")
        print()
        
        all_results = []
        available_models = []
        model_categories = {
            'commercial': [],
            'qwen3_moe': [],
            'qwen3_dense': [],
            'qwen3_coder': [],
            'qwen2.5': []
        }
        
        for model_id, display_name in final_models.items():
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
                # Categorize models
                if model_id in ['qwen-max', 'qwen-max-latest', 'qwen-max-2025-01-25', 'qwen-plus', 'qwen-flash', 'qwen-turbo']:
                    model_categories['commercial'].append(model_id)
                elif 'qwen3' in model_id and ('235b' in model_id or '30b' in model_id):
                    model_categories['qwen3_moe'].append(model_id)
                elif 'qwen3' in model_id and 'coder' in model_id:
                    model_categories['qwen3_coder'].append(model_id)
                elif 'qwen3' in model_id:
                    model_categories['qwen3_dense'].append(model_id)
                elif 'qwen2.5' in model_id:
                    model_categories['qwen2.5'].append(model_id)
        
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
            'provider': 'Qwen (Alibaba)',
            'test_date': datetime.now().isoformat(),
            'models_tested': len(final_models),
            'models_available': len(available_models),
            'available_models': available_models,
            'model_categories': model_categories,
            'total_tests': len(all_results),
            'successful_tests': len([r for r in all_results if r.get('success')]),
            'all_results': all_results,
            'rankings': rankings
        }
        
        # Save results to existing structure
        output_dir = Path("benchmark_results/qwen")
        output_dir.mkdir(parents=True, exist_ok=True)
        
        # Save new results
        output_file = output_dir / "qwen_complete.json"
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(report, f, indent=2, ensure_ascii=False)
        
        print(f"\n[SAVED] Results to {output_file}")
        
        # Print summary
        print("\n" + "="*70)
        print("TEST SUMMARY")
        print("="*70)
        print(f"Models tested: {len(final_models)}")
        print(f"Models available: {len(available_models)}")
        print(f"Total tests: {report['total_tests']}")
        print(f"Successful: {report['successful_tests']}")
        
        # Print category summary
        print("\nModels by Category:")
        for category, models in model_categories.items():
            if models:
                print(f"  {category.replace('_', ' ').title()}: {len(models)} models")
        
        if rankings:
            print("\nTop 5 Model Rankings:")
            for rank in rankings[:5]:
                print(f"  {rank['rank']}. {rank['display_name']}: {rank['average_score']:.1f}/100 ({rank['tests_completed']} tests)")
        
        return report


async def main():
    """Main function"""
    import sys
    
    # Check command line arguments
    test_priority_only = '--priority' in sys.argv
    
    benchmark = QwenCompleteBenchmark()
    report = await benchmark.run_tests(test_priority_only=test_priority_only)
    
    if report and report.get('rankings'):
        # Generate markdown report
        md_content = f"""# Qwen Models Complete Benchmark Report
**Test Date**: {datetime.now().strftime('%Y-%m-%d %H:%M')}  
**Provider**: Qwen (Alibaba)  
**Models Tested**: {report['models_tested']}  
**Models Available**: {report['models_available']}  
**Total Tests**: {report['total_tests']}  
**Successful Tests**: {report['successful_tests']}  

## Model Categories

"""
        for category, models in report['model_categories'].items():
            if models:
                md_content += f"- **{category.replace('_', ' ').title()}**: {len(models)} models\n"
        
        md_content += """
## Model Rankings

| Rank | Model | Average Score | Tests Completed |
|------|-------|---------------|-----------------|
"""
        
        for rank in report.get('rankings', []):
            md_content += f"| {rank['rank']} | **{rank['display_name']}** | {rank['average_score']:.1f}/100 | {rank['tests_completed']}/3 |\n"
        
        if report.get('rankings'):
            md_content += "\n## Dimension Scores\n\n"
            md_content += "| Model | Rhythm | Composition | Narrative | Emotion | Creativity | Cultural |\n"
            md_content += "|-------|--------|-------------|-----------|---------|------------|-----------|\n"
            
            for rank in report['rankings'][:10]:  # Top 10 only
                dims = rank['average_dimensions']
                md_content += f"| {rank['display_name']} "
                for dim in ['rhythm', 'composition', 'narrative', 'emotion', 'creativity', 'cultural']:
                    score = dims.get(dim, 0)
                    md_content += f"| {score:.0f} "
                md_content += "|\n"
        
        md_content += "\n## Notes\n\n"
        if report['models_available'] > 0:
            md_content += "### Successfully Tested Models\n\n"
            md_content += "- **Commercial Models**: Qwen-Max, Qwen-Plus, Qwen-Flash\n"
            md_content += "- **Qwen3 MoE Models**: Large-scale mixture-of-experts models with thinking capabilities\n"
            md_content += "- **Qwen3 Dense Models**: Various sizes from 4B to 32B parameters\n"
            md_content += "- **Qwen3 Coder**: Specialized models for code generation\n"
            md_content += "- **Qwen2.5 Series**: Previous generation models\n\n"
            md_content += "### Key Features\n\n"
            md_content += "- Models accessed through DashScope OpenAI-compatible API\n"
            md_content += "- Qwen3 models support thinking/non-thinking mode switching\n"
            md_content += "- Qwen-Max represents the most capable model in the family\n"
            md_content += "- Qwen-Flash offers superior speed with large context window (1M tokens)\n"
        else:
            md_content += "- Qwen models require a valid API key from DashScope\n"
            md_content += "- Register at: https://dashscope.aliyun.com/\n"
            md_content += "- Set QWEN_API_KEY environment variable before testing\n"
        
        md_content += "\n### Testing Options\n\n"
        md_content += "- Run with `--priority` flag to test only priority models\n"
        md_content += "- Priority models: qwen-max-2025-01-25, qwen-plus, qwen-flash, qwen3-32b, qwen3-8b, qwen3-coder-plus\n"
        
        # Save markdown report
        md_file = Path("benchmark_results/qwen/qwen_complete.md")
        with open(md_file, 'w', encoding='utf-8') as f:
            f.write(md_content)
        
        print(f"[SAVED] Markdown report to {md_file}")
    elif not benchmark.api_key:
        # Create a placeholder report explaining how to test
        md_content = """# Qwen Models Complete Benchmark Report

## Status: Not Tested

Qwen models have not been tested yet because the API key is not configured.

## How to Test Qwen Models

1. **Register for DashScope Account**
   - Visit: https://dashscope.aliyun.com/
   - Sign up for an account (requires Alibaba Cloud account)

2. **Get API Key**
   - Go to your DashScope dashboard
   - Navigate to API Keys section
   - Create a new API key

3. **Set Environment Variable**
   ```bash
   export QWEN_API_KEY='your-api-key-here'
   ```

4. **Run Tests**
   ```bash
   # Test all models
   python test_qwen_complete.py
   
   # Test priority models only
   python test_qwen_complete.py --priority
   ```

## Available Models

### Commercial Models
- **qwen-max-2025-01-25**: Latest Qwen2.5-Max model
- **qwen-max-latest**: Rolling latest version
- **qwen-max**: Stable version
- **qwen-plus**: Enhanced performance model
- **qwen-flash**: Speed-optimized with 1M token context
- **qwen-turbo**: Legacy speed-optimized model

### Qwen3 Series
- **MoE Models**: qwen3-235b-a22b, qwen3-30b-a3b (thinking/instruct variants)
- **Dense Models**: qwen3-32b, qwen3-14b, qwen3-8b, qwen3-4b
- **Coder Models**: qwen3-coder-plus

### Qwen2.5 Series
- qwen2.5-72b-instruct, qwen2.5-32b-instruct, qwen2.5-14b-instruct, qwen2.5-7b-instruct

## API Information

- **Endpoint (China)**: https://dashscope.aliyuncs.com/compatible-mode/v1
- **Endpoint (International)**: https://dashscope-intl.aliyuncs.com/compatible-mode/v1
- **Interface**: OpenAI-compatible
"""
        
        # Save placeholder report
        output_dir = Path("benchmark_results/qwen")
        output_dir.mkdir(parents=True, exist_ok=True)
        
        md_file = output_dir / "qwen_complete.md"
        with open(md_file, 'w', encoding='utf-8') as f:
            f.write(md_content)
        
        print(f"\n[SAVED] Placeholder report to {md_file}")


if __name__ == "__main__":
    asyncio.run(main())