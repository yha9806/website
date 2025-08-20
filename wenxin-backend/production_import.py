#!/usr/bin/env python
"""
Production data import script for WenXin MoYun
Imports comprehensive_v2.json data to production database
Can run locally with Cloud SQL proxy or directly on Cloud Run
"""
import asyncio
import json
import os
import sys
import io
from datetime import datetime, timezone
from pathlib import Path
import uuid

# Set UTF-8 encoding
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

# Add project root to path
sys.path.insert(0, str(Path(__file__).parent))

from sqlalchemy import select, delete, func
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import AsyncSessionLocal, engine
from app.models.ai_model import AIModel
from app.core.config import settings


class ProductionDataImporter:
    def __init__(self):
        self.comprehensive_file = Path("benchmark_results/reports/comprehensive_v2.json")
        self.provider_files = {
            "openai": Path("benchmark_results/openai/openai_results.json"),
            "anthropic": Path("benchmark_results/anthropic/anthropic_complete_v2.json"),
            "deepseek": Path("benchmark_results/deepseek/deepseek_complete.json"),
            "qwen": Path("benchmark_results/qwen/qwen_complete.json")
        }
        self.imported_count = 0
        self.cleaned_count = 0
        
    async def clean_database(self, session: AsyncSession):
        """Clean all existing data from database"""
        print("\n" + "="*60)
        print("PHASE 1: CLEANING DATABASE")
        print("="*60)
        
        # Count existing models
        result = await session.execute(select(func.count(AIModel.id)))
        existing_count = result.scalar()
        print(f"[INFO] Found {existing_count} existing models")
        
        if existing_count > 0:
            # Delete all models
            await session.execute(delete(AIModel))
            await session.commit()
            self.cleaned_count = existing_count
            print(f"[SUCCESS] Deleted {existing_count} models")
        else:
            print("[INFO] Database is already empty")
        
        return existing_count
    
    async def load_comprehensive_data(self):
        """Load the comprehensive v2 data"""
        if not self.comprehensive_file.exists():
            print(f"[ERROR] File not found: {self.comprehensive_file}")
            return None
        
        with open(self.comprehensive_file, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        print(f"[INFO] Loaded comprehensive_v2.json")
        print(f"  - Report date: {data.get('report_date', 'unknown')}")
        print(f"  - Total models: {len(data.get('global_rankings', []))}")
        
        return data
    
    async def load_provider_highlights(self, provider: str, model_id: str):
        """Load highlights and weaknesses for a specific model from provider data"""
        file_path = self.provider_files.get(provider.lower())
        
        if not file_path or not file_path.exists():
            return [], [], {}
        
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                provider_data = json.load(f)
            
            highlights = []
            weaknesses = []
            responses = {}
            
            # Find test results for this model
            for result in provider_data.get('all_results', []):
                if result.get('model_id') == model_id:
                    # Extract highlights and weaknesses
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
            highlights = list(set(highlights))[:10]  # Limit to 10
            weaknesses = list(set(weaknesses))[:5]   # Limit to 5
            
            return highlights, weaknesses, responses
            
        except Exception as e:
            print(f"[WARNING] Error loading provider data for {provider}: {e}")
            return [], [], {}
    
    async def import_models(self, session: AsyncSession, comprehensive_data: dict):
        """Import all models from comprehensive data"""
        print("\n" + "="*60)
        print("PHASE 2: IMPORTING MODELS")
        print("="*60)
        
        models = comprehensive_data.get('global_rankings', [])
        
        for idx, model_info in enumerate(models, 1):
            model_id = model_info.get('model_id', '')
            provider = model_info.get('provider', 'Unknown')
            
            print(f"\n[{idx}/{len(models)}] Processing {model_id} ({provider})")
            
            # Load highlights and weaknesses from provider data
            highlights, weaknesses, responses = await self.load_provider_highlights(provider, model_id)
            
            # Create model data
            model_data = {
                'id': str(uuid.uuid4()),
                'name': model_info.get('display_name', model_id),
                'organization': provider,
                'version': '1.0',
                'category': 'text',
                'description': f"{provider} {model_info.get('display_name', model_id)} - Advanced AI Model",
                
                # Scores
                'overall_score': model_info.get('average_score', 0),
                'rhythm_score': model_info.get('average_dimensions', {}).get('rhythm', 0),
                'composition_score': model_info.get('average_dimensions', {}).get('composition', 0),
                'narrative_score': model_info.get('average_dimensions', {}).get('narrative', 0),
                'emotion_score': model_info.get('average_dimensions', {}).get('emotion', 0),
                'creativity_score': model_info.get('average_dimensions', {}).get('creativity', 0),
                'cultural_score': model_info.get('average_dimensions', {}).get('cultural', 0),
                
                # Metrics JSON
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
                'score_highlights': highlights,
                'score_weaknesses': weaknesses,
                
                # Status
                'is_active': True,
                'is_verified': True,
                'verification_count': model_info.get('tests_completed', 0),
                'confidence_level': 0.95 if model_info.get('tests_completed', 0) >= 3 else 0.7,
                
                # Metadata
                'release_date': '2024-01',
                'tags': [provider.lower(), 'benchmark', 'tested'],
                'last_benchmark_at': datetime.now(timezone.utc)
            }
            
            # Create and add model
            new_model = AIModel(**model_data)
            session.add(new_model)
            
            print(f"  ✓ Added: {model_data['name']}")
            print(f"    Score: {model_data['overall_score']:.1f}")
            print(f"    Highlights: {len(highlights)}")
            print(f"    Weaknesses: {len(weaknesses)}")
            
            self.imported_count += 1
            
            # Commit every 5 models
            if self.imported_count % 5 == 0:
                await session.commit()
                print(f"\n[COMMIT] Saved {self.imported_count} models")
        
        # Final commit
        await session.commit()
        print(f"\n[SUCCESS] Imported {self.imported_count} models")
    
    async def verify_import(self, session: AsyncSession):
        """Verify the import was successful"""
        print("\n" + "="*60)
        print("PHASE 3: VERIFICATION")
        print("="*60)
        
        # Count models
        result = await session.execute(select(func.count(AIModel.id)))
        total_count = result.scalar()
        
        # Get top 5 models
        result = await session.execute(
            select(AIModel)
            .order_by(AIModel.overall_score.desc())
            .limit(5)
        )
        top_models = result.scalars().all()
        
        print(f"\n[VERIFY] Total models in database: {total_count}")
        print("\nTop 5 Models by Score:")
        for idx, model in enumerate(top_models, 1):
            highlights_count = len(model.score_highlights) if model.score_highlights else 0
            weaknesses_count = len(model.score_weaknesses) if model.score_weaknesses else 0
            print(f"  {idx}. {model.name} ({model.organization})")
            print(f"     Score: {model.overall_score:.1f}")
            print(f"     Highlights: {highlights_count}, Weaknesses: {weaknesses_count}")
        
        return total_count == self.imported_count
    
    async def run(self):
        """Main import process"""
        print("="*60)
        print("PRODUCTION DATA IMPORT TOOL")
        print(f"Environment: {settings.ENVIRONMENT}")
        print(f"Database: {settings.DATABASE_URL.split('@')[0] if '@' in settings.DATABASE_URL else 'local'}")
        print("="*60)
        
        # Load comprehensive data
        comprehensive_data = await self.load_comprehensive_data()
        if not comprehensive_data:
            print("[ERROR] Failed to load comprehensive data")
            return False
        
        async with AsyncSessionLocal() as session:
            # Phase 1: Clean database
            await self.clean_database(session)
            
            # Phase 2: Import models
            await self.import_models(session, comprehensive_data)
            
            # Phase 3: Verify
            success = await self.verify_import(session)
            
            if success:
                print("\n" + "="*60)
                print("✅ IMPORT COMPLETED SUCCESSFULLY!")
                print(f"  - Cleaned: {self.cleaned_count} old models")
                print(f"  - Imported: {self.imported_count} new models")
                print("="*60)
            else:
                print("\n[ERROR] Import verification failed!")
            
            return success


async def main():
    """Entry point"""
    # Check if running in production
    if os.getenv('ENVIRONMENT') == 'production':
        print("[INFO] Running in PRODUCTION mode")
        settings.ENVIRONMENT = 'production'
    else:
        print("[INFO] Running in DEVELOPMENT mode")
        print("[INFO] Set ENVIRONMENT=production to run against production database")
    
    importer = ProductionDataImporter()
    success = await importer.run()
    
    return 0 if success else 1


if __name__ == "__main__":
    exit_code = asyncio.run(main())
    sys.exit(exit_code)