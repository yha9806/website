"""
Clean up and restructure benchmark results directory
Separate mixed data and create clear organization
"""
import json
import shutil
from pathlib import Path
from datetime import datetime


def archive_existing_files():
    """Archive all existing files to _archive directory"""
    print("Step 1: Archiving existing files...")
    
    results_dir = Path("benchmark_results")
    archive_dir = results_dir / "_archive" / datetime.now().strftime("%Y%m%d_%H%M%S")
    archive_dir.mkdir(parents=True, exist_ok=True)
    
    # Directories to archive
    dirs_to_archive = ['openai', 'deepseek', 'anthropic', 'qwen', 'google', 'xai', 
                       'complete', 'final', 'backup', 'moonshot', 'simple_test']
    
    archived_count = 0
    for dir_name in dirs_to_archive:
        src = results_dir / dir_name
        if src.exists():
            dst = archive_dir / dir_name
            shutil.copytree(src, dst)
            print(f"  Archived {dir_name}/ to _archive/")
            archived_count += 1
    
    print(f"  Total: {archived_count} directories archived")
    return archive_dir


def extract_and_separate_data(archive_dir):
    """Extract and separate mixed data from archived files"""
    print("\nStep 2: Extracting and separating data...")
    
    results_dir = Path("benchmark_results")
    
    # Load the mixed data file
    mixed_file = archive_dir / "openai" / "openai_benchmark_report.json"
    if not mixed_file.exists():
        print("  ERROR: Mixed data file not found")
        return
    
    with open(mixed_file, 'r', encoding='utf-8') as f:
        mixed_data = json.load(f)
    
    # Separate by provider
    separated_data = {
        'openai': [],
        'deepseek': [],
        'anthropic': [],
        'qwen': []
    }
    
    for result in mixed_data.get('all_results', []):
        model_id = result.get('model_id', '')
        
        if any(x in model_id for x in ['gpt', 'o1', 'o3']):
            separated_data['openai'].append(result)
        elif 'deepseek' in model_id:
            separated_data['deepseek'].append(result)
        elif 'claude' in model_id:
            separated_data['anthropic'].append(result)
        elif 'qwen' in model_id:
            separated_data['qwen'].append(result)
    
    # Save separated data
    for provider, results in separated_data.items():
        if results:
            provider_dir = results_dir / provider
            provider_dir.mkdir(parents=True, exist_ok=True)
            
            # Calculate statistics
            models = list(set(r['model_id'] for r in results))
            successful = [r for r in results if r.get('success')]
            
            # Calculate rankings for successful tests
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
            
            # Create report
            report = {
                'provider': provider.title(),
                'test_date': datetime.now().isoformat(),
                'models_tested': len(models),
                'models': sorted(models),
                'total_tests': len(results),
                'successful_tests': len(successful),
                'all_results': results,
                'rankings': rankings
            }
            
            # Save JSON
            output_file = provider_dir / f"{provider}_results.json"
            with open(output_file, 'w', encoding='utf-8') as f:
                json.dump(report, f, indent=2, ensure_ascii=False)
            
            print(f"  {provider}: {len(models)} models, {len(results)} tests → {output_file}")


def merge_deepseek_data(archive_dir):
    """Merge DeepSeek data from multiple sources"""
    print("\nStep 3: Merging DeepSeek data...")
    
    results_dir = Path("benchmark_results")
    deepseek_dir = results_dir / "deepseek"
    
    # Load existing separated data
    existing_file = deepseek_dir / "deepseek_results.json"
    if existing_file.exists():
        with open(existing_file, 'r', encoding='utf-8') as f:
            existing_data = json.load(f)
    else:
        existing_data = {'all_results': []}
    
    # Load additional DeepSeek test data
    additional_file = archive_dir / "deepseek" / "deepseek_benchmark_report.json"
    if additional_file.exists():
        with open(additional_file, 'r', encoding='utf-8') as f:
            additional_data = json.load(f)
        
        # Merge results, avoiding duplicates
        existing_tests = {(r['model_id'], r['test_id']) for r in existing_data['all_results'] if 'test_id' in r}
        
        for result in additional_data.get('all_results', []):
            test_key = (result.get('model_id'), result.get('test_id'))
            if test_key not in existing_tests and test_key[0] and test_key[1]:
                existing_data['all_results'].append(result)
                print(f"  Added: {test_key[0]} - {test_key[1]}")
    
    # Check R1 poetry verification
    poetry_file = archive_dir / "deepseek" / "r1_poetry_verification.json"
    if poetry_file.exists():
        with open(poetry_file, 'r', encoding='utf-8') as f:
            poetry_data = json.load(f)
        
        print(f"  Found R1 poetry verification: {len(poetry_data.get('results', []))} tests")
        # Note: These are successful but without scores
    
    # Recalculate statistics
    models = list(set(r['model_id'] for r in existing_data['all_results']))
    successful = [r for r in existing_data['all_results'] if r.get('success')]
    
    existing_data.update({
        'provider': 'DeepSeek',
        'test_date': datetime.now().isoformat(),
        'models_tested': len(models),
        'models': sorted(models),
        'total_tests': len(existing_data['all_results']),
        'successful_tests': len(successful)
    })
    
    # Save updated data
    with open(existing_file, 'w', encoding='utf-8') as f:
        json.dump(existing_data, f, indent=2, ensure_ascii=False)
    
    print(f"  Merged data saved: {len(models)} models, {len(existing_data['all_results'])} tests")
    
    # Create status report
    model_test_status = {}
    for r in existing_data['all_results']:
        model = r.get('model_id', 'unknown')
        test = r.get('test_id', 'unknown')
        if model not in model_test_status:
            model_test_status[model] = {'poem_moon': False, 'story_robot': False, 'code_fibonacci': False}
        if test in model_test_status[model]:
            model_test_status[model][test] = r.get('success', False)
    
    print("\n  DeepSeek Model Test Status:")
    for model, tests in model_test_status.items():
        missing = [t for t, success in tests.items() if not success]
        if missing:
            print(f"    {model}: Missing {', '.join(missing)}")
        else:
            print(f"    {model}: All tests complete ✓")
    
    return model_test_status


def create_directory_structure():
    """Create clean directory structure"""
    print("\nStep 4: Creating clean directory structure...")
    
    results_dir = Path("benchmark_results")
    
    # Create main directories
    dirs = ['openai', 'deepseek', 'anthropic', 'qwen', 'reports']
    for dir_name in dirs:
        (results_dir / dir_name).mkdir(parents=True, exist_ok=True)
    
    print("  Created standard directory structure")


def cleanup_old_directories(archive_dir):
    """Remove old directories after archiving"""
    print("\nStep 5: Cleaning up old directories...")
    
    results_dir = Path("benchmark_results")
    dirs_to_remove = ['complete', 'final', 'backup', 'moonshot', 'simple_test', 'google', 'xai']
    
    removed_count = 0
    for dir_name in dirs_to_remove:
        dir_path = results_dir / dir_name
        if dir_path.exists() and dir_path != archive_dir.parent:
            shutil.rmtree(dir_path)
            print(f"  Removed {dir_name}/")
            removed_count += 1
    
    print(f"  Total: {removed_count} directories removed")


def main():
    """Main cleanup and restructure process"""
    print("="*60)
    print("BENCHMARK RESULTS CLEANUP AND RESTRUCTURE")
    print("="*60)
    
    # Step 1: Archive existing files
    archive_dir = archive_existing_files()
    
    # Step 2: Extract and separate data
    extract_and_separate_data(archive_dir)
    
    # Step 3: Merge DeepSeek data
    deepseek_status = merge_deepseek_data(archive_dir)
    
    # Step 4: Create directory structure
    create_directory_structure()
    
    # Step 5: Cleanup old directories
    cleanup_old_directories(archive_dir)
    
    print("\n" + "="*60)
    print("CLEANUP COMPLETE")
    print("="*60)
    
    print("\nNew structure:")
    print("  benchmark_results/")
    print("    ├── _archive/        # All original files")
    print("    ├── openai/          # OpenAI test results")
    print("    ├── deepseek/        # DeepSeek test results")
    print("    ├── anthropic/       # Anthropic test results")
    print("    ├── qwen/            # Qwen test results")
    print("    └── reports/         # Summary reports")
    
    # Return status for next steps
    return deepseek_status


if __name__ == "__main__":
    status = main()