"""
Import comprehensive benchmark test data into database
Reads from benchmark_results/reports/comprehensive_v2.json
"""
import asyncio
import json
import sys
import io
from datetime import datetime
from pathlib import Path
import uuid

# Set UTF-8 encoding
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

# Add project root to path
sys.path.insert(0, str(Path(__file__).parent))

from sqlalchemy import select, delete
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import AsyncSessionLocal, engine
from app.models.ai_model import AIModel
from app.core.config import settings


class ComprehensiveDataImporter:
    def __init__(self):
        self.data_file = Path("benchmark_results/reports/comprehensive_v2.json")
        self.provider_files = {
            "openai": Path("benchmark_results/openai/openai_results.json"),
            "anthropic": Path("benchmark_results/anthropic/anthropic_complete_v2.json"),
            "deepseek": Path("benchmark_results/deepseek/deepseek_benchmark_report.json"),
            "qwen": Path("benchmark_results/qwen/qwen_complete.json")
        }
        
    async def load_comprehensive_data(self):
        """Load comprehensive v2 report data"""
        if not self.data_file.exists():
            print(f"[ERROR] File not found: {self.data_file}")
            return None
            
        with open(self.data_file, 'r', encoding='utf-8') as f:
            data = json.load(f)
            print(f"[INFO] Loaded comprehensive_v2.json")
            print(f"[INFO] Report date: {data.get('report_date', 'unknown')}")
            print(f"[INFO] Total providers: {data.get('summary', {}).get('total_providers', 0)}")
            return data
    
    async def load_provider_details(self, provider: str):
        """Load detailed results for a specific provider"""
        file_path = self.provider_files.get(provider.lower())
        if not file_path or not file_path.exists():
            print(f"[WARNING] Provider file not found: {provider}")
            return None
            
        with open(file_path, 'r', encoding='utf-8') as f:
            return json.load(f)
    
    async def extract_model_data(self, model_info: dict, provider_data: dict = None) -> dict:
        """Extract and format model data for database insertion"""
        model_id = model_info.get('model_id', '')
        
        # Find detailed test results from provider data
        test_results = []
        highlights = []
        weaknesses = []
        responses = {}
        
        if provider_data:
            # Extract test results for this model
            if 'all_results' in provider_data:
                test_results = [r for r in provider_data['all_results'] 
                               if r.get('model_id') == model_id]
            elif 'test_results' in provider_data:
                test_results = [r for r in provider_data['test_results'] 
                               if r.get('model_id') == model_id]
            
            # Extract highlights and weaknesses from score_details
            for result in test_results:
                if 'score_details' in result:
                    details = result['score_details']
                    if 'highlights' in details:
                        highlights.extend(details['highlights'])
                    if 'weaknesses' in details:
                        weaknesses.extend(details['weaknesses'])
                
                # Store response
                test_id = result.get('test_id', '')
                if test_id and 'response' in result:
                    responses[test_id] = {
                        'response': result['response'],
                        'score': result.get('overall_score', 0),
                        'dimensions': result.get('dimensions', {}),
                        'duration': result.get('duration', 0)
                    }
        
        # Remove duplicates
        highlights = list(set(highlights))
        weaknesses = list(set(weaknesses))
        
        # Prepare model data
        return {
            'id': str(uuid.uuid4()),
            'name': model_info.get('display_name', model_id),
            'organization': model_info.get('provider', 'Unknown'),
            'version': model_info.get('version', '1.0'),
            'category': 'text',  # Default to text for LLM models
            'description': f"{model_info.get('provider', '')} {model_info.get('display_name', '')} - Advanced AI Model",
            
            # Scores
            'overall_score': model_info.get('average_score', 0),
            'rhythm_score': model_info.get('average_dimensions', {}).get('rhythm', 0),
            'composition_score': model_info.get('average_dimensions', {}).get('composition', 0),
            'narrative_score': model_info.get('average_dimensions', {}).get('narrative', 0),
            'emotion_score': model_info.get('average_dimensions', {}).get('emotion', 0),
            'creativity_score': model_info.get('average_dimensions', {}).get('creativity', 0),
            'cultural_score': model_info.get('average_dimensions', {}).get('cultural', 0),
            
            # Metrics
            'metrics': model_info.get('average_dimensions', {}),
            
            # Benchmark data
            'data_source': 'benchmark',
            'benchmark_score': model_info.get('average_score', 0),
            'benchmark_metadata': {
                'rank': model_info.get('rank', 999),
                'tests_completed': model_info.get('tests_completed', 0),
                'test_coverage': model_info.get('test_coverage', [])
            },
            'benchmark_responses': responses,
            'scoring_details': {
                'dimensions': model_info.get('average_dimensions', {}),
                'total_score': model_info.get('average_score', 0)
            },
            'score_highlights': highlights[:10],  # Limit to top 10
            'score_weaknesses': weaknesses[:5],   # Limit to top 5
            
            # Status
            'is_active': True,
            'is_verified': True,
            'verification_count': model_info.get('tests_completed', 0),
            'confidence_level': 0.95 if model_info.get('tests_completed', 0) >= 3 else 0.7,
            
            # Metadata
            'release_date': '2024-01',
            'tags': [model_info.get('provider', '').lower(), 'benchmark', 'tested'],
            'last_benchmark_at': datetime.utcnow()
        }
    
    async def import_to_database(self, session: AsyncSession):
        """Import all comprehensive data to database"""
        print("[START] Loading comprehensive data...")
        comprehensive_data = await self.load_comprehensive_data()
        
        if not comprehensive_data:
            print("[ERROR] Failed to load comprehensive data")
            return False
        
        print(f"[INFO] Found {len(comprehensive_data.get('global_rankings', []))} models in rankings")
        
        # Process each model in rankings
        imported_count = 0
        for model_info in comprehensive_data.get('global_rankings', []):
            provider = model_info.get('provider', '').lower()
            model_id = model_info.get('model_id', '')
            
            print(f"\n[PROCESSING] {model_id} from {provider}")
            
            # Load provider-specific details
            provider_data = await self.load_provider_details(provider)
            
            # Extract model data
            model_data = await self.extract_model_data(model_info, provider_data)
            
            # Check if model already exists
            result = await session.execute(
                select(AIModel).where(AIModel.name == model_data['name'])
            )
            existing_model = result.scalar_one_or_none()
            
            if existing_model:
                # Update existing model
                for key, value in model_data.items():
                    if key != 'id':  # Don't update ID
                        setattr(existing_model, key, value)
                print(f"  [UPDATE] Updated existing model: {model_data['name']}")
            else:
                # Create new model
                new_model = AIModel(**model_data)
                session.add(new_model)
                print(f"  [CREATE] Created new model: {model_data['name']}")
            
            imported_count += 1
            
            # Commit every 5 models to avoid memory issues
            if imported_count % 5 == 0:
                await session.commit()
                print(f"[COMMIT] Saved {imported_count} models")
        
        # Final commit
        await session.commit()
        print(f"\n[SUCCESS] Imported {imported_count} models to database")
        return True
    
    async def clean_old_data(self, session: AsyncSession):
        """Clean old test data from database"""
        print("[CLEAN] Removing old mock data...")
        
        # Delete models with data_source = 'mock' or null
        result = await session.execute(
            select(AIModel).where(
                (AIModel.data_source == 'mock') | 
                (AIModel.data_source == None)
            )
        )
        old_models = result.scalars().all()
        
        for model in old_models:
            await session.delete(model)
            print(f"  [DELETE] Removed old model: {model.name}")
        
        await session.commit()
        print(f"[CLEAN] Removed {len(old_models)} old models")
        return len(old_models)


async def main():
    """Main import function"""
    print("=" * 60)
    print("COMPREHENSIVE DATA IMPORT TOOL")
    print("=" * 60)
    
    importer = ComprehensiveDataImporter()
    
    async with AsyncSessionLocal() as session:
        # Clean old data first
        print("\nPhase 1: Cleaning old data")
        print("-" * 40)
        await importer.clean_old_data(session)
        
        # Import new data
        print("\nPhase 2: Importing comprehensive data")
        print("-" * 40)
        success = await importer.import_to_database(session)
        
        if success:
            # Verify import
            print("\nPhase 3: Verification")
            print("-" * 40)
            result = await session.execute(
                select(AIModel).where(AIModel.data_source == 'benchmark')
            )
            benchmark_models = result.scalars().all()
            
            print(f"[VERIFY] Total benchmark models: {len(benchmark_models)}")
            print("\nTop 5 models by score:")
            sorted_models = sorted(benchmark_models, 
                                 key=lambda x: x.overall_score, 
                                 reverse=True)[:5]
            for i, model in enumerate(sorted_models, 1):
                print(f"  {i}. {model.name}: {model.overall_score:.1f}")
            
            print("\n[COMPLETE] Data import successful!")
        else:
            print("\n[FAILED] Data import failed!")


if __name__ == "__main__":
    # Run in development mode
    settings.ENVIRONMENT = "development"
    asyncio.run(main())