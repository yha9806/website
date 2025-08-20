"""
Validate comprehensive data before import
Checks data integrity and generates preview report
"""
import json
import sys
import io
from pathlib import Path
from typing import Dict, List, Any
from datetime import datetime

# Set UTF-8 encoding
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')


class DataValidator:
    def __init__(self):
        self.data_file = Path("benchmark_results/reports/comprehensive_v2.json")
        self.provider_files = {
            "openai": Path("benchmark_results/openai/openai_results.json"),
            "anthropic": Path("benchmark_results/anthropic/anthropic_complete_v2.json"),
            "deepseek": Path("benchmark_results/deepseek/deepseek_benchmark_report.json"),
            "qwen": Path("benchmark_results/qwen/qwen_complete.json")
        }
        self.validation_report = {
            'timestamp': datetime.now().isoformat(),
            'files_checked': [],
            'models_found': [],
            'issues': [],
            'statistics': {}
        }
    
    def check_file_exists(self, file_path: Path, file_type: str) -> bool:
        """Check if a file exists and is readable"""
        if not file_path.exists():
            self.validation_report['issues'].append(f"Missing {file_type} file: {file_path}")
            return False
        
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                json.load(f)
            self.validation_report['files_checked'].append(str(file_path))
            return True
        except json.JSONDecodeError as e:
            self.validation_report['issues'].append(f"Invalid JSON in {file_type}: {e}")
            return False
        except Exception as e:
            self.validation_report['issues'].append(f"Cannot read {file_type}: {e}")
            return False
    
    def validate_model_data(self, model: Dict[str, Any]) -> List[str]:
        """Validate individual model data structure"""
        issues = []
        required_fields = ['model_id', 'provider', 'average_score']
        
        for field in required_fields:
            if field not in model:
                issues.append(f"Missing required field: {field}")
        
        # Check score validity
        if 'average_score' in model:
            score = model['average_score']
            if not isinstance(score, (int, float)) or score < 0 or score > 100:
                issues.append(f"Invalid score: {score}")
        
        # Check dimensions
        if 'average_dimensions' in model:
            dims = model['average_dimensions']
            expected_dims = ['rhythm', 'composition', 'narrative', 'emotion', 'creativity', 'cultural']
            for dim in expected_dims:
                if dim not in dims:
                    issues.append(f"Missing dimension: {dim}")
                elif not isinstance(dims[dim], (int, float)):
                    issues.append(f"Invalid {dim} score: {dims[dim]}")
        
        return issues
    
    def analyze_highlights_weaknesses(self, provider: str, provider_data: Dict) -> Dict:
        """Analyze highlights and weaknesses in provider data"""
        stats = {
            'total_models': 0,
            'models_with_highlights': 0,
            'models_with_weaknesses': 0,
            'total_highlights': 0,
            'total_weaknesses': 0,
            'sample_highlights': [],
            'sample_weaknesses': []
        }
        
        # Find test results
        results = []
        if 'all_results' in provider_data:
            results = provider_data['all_results']
        elif 'test_results' in provider_data:
            results = provider_data['test_results']
        
        models_processed = set()
        
        for result in results:
            model_id = result.get('model_id', '')
            if model_id and model_id not in models_processed:
                models_processed.add(model_id)
                stats['total_models'] += 1
            
            if 'score_details' in result:
                details = result['score_details']
                
                if 'highlights' in details and details['highlights']:
                    stats['models_with_highlights'] += 1
                    stats['total_highlights'] += len(details['highlights'])
                    if len(stats['sample_highlights']) < 3:
                        stats['sample_highlights'].extend(details['highlights'][:2])
                
                if 'weaknesses' in details and details['weaknesses']:
                    stats['models_with_weaknesses'] += 1
                    stats['total_weaknesses'] += len(details['weaknesses'])
                    if len(stats['sample_weaknesses']) < 3:
                        stats['sample_weaknesses'].extend(details['weaknesses'][:2])
        
        return stats
    
    def validate_comprehensive_data(self):
        """Main validation function"""
        print("=" * 60)
        print("DATA VALIDATION REPORT")
        print("=" * 60)
        
        # Check main file
        print("\n[1] Checking comprehensive data file...")
        if not self.check_file_exists(self.data_file, "comprehensive"):
            print("  ❌ Comprehensive file not found")
            return False
        
        with open(self.data_file, 'r', encoding='utf-8') as f:
            comprehensive_data = json.load(f)
        
        # Validate structure
        print("\n[2] Validating data structure...")
        if 'global_rankings' not in comprehensive_data:
            self.validation_report['issues'].append("Missing 'global_rankings' in comprehensive data")
            print("  ❌ Invalid structure")
            return False
        
        rankings = comprehensive_data['global_rankings']
        print(f"  ✅ Found {len(rankings)} models in rankings")
        
        # Validate each model
        print("\n[3] Validating model data...")
        for model in rankings:
            model_id = model.get('model_id', 'unknown')
            issues = self.validate_model_data(model)
            
            if issues:
                print(f"  ⚠️  {model_id}: {len(issues)} issues")
                for issue in issues:
                    self.validation_report['issues'].append(f"{model_id}: {issue}")
            else:
                print(f"  ✅ {model_id}: Valid")
            
            self.validation_report['models_found'].append({
                'id': model_id,
                'provider': model.get('provider', 'unknown'),
                'score': model.get('average_score', 0),
                'rank': model.get('rank', 999)
            })
        
        # Check provider files
        print("\n[4] Checking provider data files...")
        provider_stats = {}
        
        for provider, file_path in self.provider_files.items():
            print(f"\n  Checking {provider}...")
            if self.check_file_exists(file_path, provider):
                with open(file_path, 'r', encoding='utf-8') as f:
                    provider_data = json.load(f)
                
                stats = self.analyze_highlights_weaknesses(provider, provider_data)
                provider_stats[provider] = stats
                
                print(f"    Models: {stats['total_models']}")
                print(f"    Highlights: {stats['total_highlights']}")
                print(f"    Weaknesses: {stats['total_weaknesses']}")
            else:
                print(f"    ❌ File not found")
        
        self.validation_report['statistics'] = provider_stats
        
        # Generate summary
        print("\n" + "=" * 60)
        print("VALIDATION SUMMARY")
        print("=" * 60)
        
        print(f"\n✅ Files checked: {len(self.validation_report['files_checked'])}")
        print(f"📊 Models found: {len(self.validation_report['models_found'])}")
        print(f"⚠️  Issues found: {len(self.validation_report['issues'])}")
        
        if self.validation_report['issues']:
            print("\n⚠️  Issues to address:")
            for issue in self.validation_report['issues'][:10]:  # Show first 10
                print(f"  - {issue}")
            if len(self.validation_report['issues']) > 10:
                print(f"  ... and {len(self.validation_report['issues']) - 10} more")
        
        # Save report
        report_file = Path(f"validation_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json")
        with open(report_file, 'w', encoding='utf-8') as f:
            json.dump(self.validation_report, f, indent=2, ensure_ascii=False)
        
        print(f"\n📄 Full report saved to: {report_file}")
        
        # Data preview
        print("\n" + "=" * 60)
        print("DATA PREVIEW")
        print("=" * 60)
        
        print("\nTop 5 Models by Score:")
        sorted_models = sorted(self.validation_report['models_found'], 
                             key=lambda x: x['score'], 
                             reverse=True)[:5]
        for i, model in enumerate(sorted_models, 1):
            print(f"  {i}. {model['id']} ({model['provider']}): {model['score']:.1f}")
        
        print("\nSample Highlights:")
        for provider, stats in provider_stats.items():
            if stats['sample_highlights']:
                print(f"  [{provider}]")
                for highlight in stats['sample_highlights'][:2]:
                    print(f"    • {highlight[:100]}...")
                break
        
        print("\nSample Weaknesses:")
        for provider, stats in provider_stats.items():
            if stats['sample_weaknesses']:
                print(f"  [{provider}]")
                for weakness in stats['sample_weaknesses'][:2]:
                    print(f"    • {weakness[:100]}...")
                break
        
        # Final verdict
        print("\n" + "=" * 60)
        if len(self.validation_report['issues']) == 0:
            print("✅ VALIDATION PASSED - Data is ready for import")
            return True
        elif len(self.validation_report['issues']) < 10:
            print("⚠️  VALIDATION PASSED WITH WARNINGS - Minor issues found")
            return True
        else:
            print("❌ VALIDATION FAILED - Too many issues found")
            return False


def main():
    """Main validation entry point"""
    validator = DataValidator()
    success = validator.validate_comprehensive_data()
    
    if success:
        print("\n✅ Data validation successful!")
        print("You can now run: python import_comprehensive_data.py")
    else:
        print("\n❌ Data validation failed!")
        print("Please fix the issues before importing")
    
    return success


if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)