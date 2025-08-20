"""
Import benchmark test data with responses into database
This script imports actual test responses, highlights, and weaknesses from benchmark results
"""
import asyncio
import json
import sys
import os
from pathlib import Path
from datetime import datetime
from typing import Dict, List, Any
import uuid

# Add project root to path
sys.path.insert(0, str(Path(__file__).parent))

from sqlalchemy import select, text, update
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import AsyncSessionLocal, engine
from app.models.ai_model import AIModel


class BenchmarkDataImporter:
    def __init__(self):
        self.providers = {
            "openai": "benchmark_results/openai/openai_results.json",
            "anthropic": "benchmark_results/anthropic/anthropic_complete_v2.json", 
            "deepseek": "benchmark_results/deepseek/deepseek_benchmark_report.json",
            "qwen": "benchmark_results/qwen/qwen_complete.json"
        }
        
    async def load_provider_data(self, provider: str, file_path: str) -> Dict:
        """Load benchmark data for a provider"""
        if not os.path.exists(file_path):
            print(f"[WARNING] File not found: {file_path}")
            return {}
            
        with open(file_path, 'r', encoding='utf-8') as f:
            return json.load(f)
    
    async def process_openai_data(self, data: Dict) -> Dict[str, Dict]:
        """Process OpenAI benchmark data"""
        model_data = {}
        
        if 'all_results' in data:
            # Group results by model
            for result in data['all_results']:
                model_id = result.get('model_id', '')
                if not model_id:
                    continue
                    
                if model_id not in model_data:
                    model_data[model_id] = {
                        'benchmark_responses': {},
                        'score_highlights': [],
                        'score_weaknesses': [],
                        'scoring_details': {}
                    }
                
                # Add benchmark response
                test_id = result.get('test_id', '')
                if test_id and 'response' in result:
                    model_data[model_id]['benchmark_responses'][test_id] = {
                        'prompt': test_id,  # Using test_id as prompt identifier
                        'response': result['response'],
                        'score': result.get('overall_score', 0),
                        'dimensions': result.get('dimensions', {}),
                        'duration': result.get('duration', 0),
                        'analysis': {
                            'highlights': result.get('score_details', {}).get('highlights', []),
                            'weaknesses': result.get('score_details', {}).get('weaknesses', [])
                        }
                    }
                
                # Collect highlights and weaknesses
                if 'score_details' in result:
                    details = result['score_details']
                    if 'highlights' in details:
                        model_data[model_id]['score_highlights'].extend(details['highlights'])
                    if 'weaknesses' in details:
                        model_data[model_id]['score_weaknesses'].extend(details['weaknesses'])
                    
                    # Store scoring details
                    model_data[model_id]['scoring_details'][test_id] = details
        
        # Remove duplicates from highlights/weaknesses
        for model_id in model_data:
            model_data[model_id]['score_highlights'] = list(set(model_data[model_id]['score_highlights']))
            model_data[model_id]['score_weaknesses'] = list(set(model_data[model_id]['score_weaknesses']))
        
        return model_data
    
    async def process_anthropic_data(self, data: Dict) -> Dict[str, Dict]:
        """Process Anthropic benchmark data"""
        model_data = {}
        
        # Anthropic data structure is similar to OpenAI
        if 'all_results' in data:
            return await self.process_openai_data(data)
        elif 'test_results' in data:
            # Alternative structure
            data['all_results'] = data['test_results']
            return await self.process_openai_data(data)
        
        return model_data
    
    async def process_deepseek_data(self, data: Dict) -> Dict[str, Dict]:
        """Process DeepSeek benchmark data"""
        # DeepSeek uses similar structure
        return await self.process_openai_data(data)
    
    async def process_qwen_data(self, data: Dict) -> Dict[str, Dict]:
        """Process Qwen benchmark data"""
        # Qwen uses similar structure
        return await self.process_openai_data(data)
    
    async def update_model_in_db(self, session: AsyncSession, model_name: str, data: Dict):
        """Update a model's benchmark data in the database"""
        try:
            # Find the model
            result = await session.execute(
                select(AIModel).where(AIModel.name == model_name)
            )
            model = result.scalar_one_or_none()
            
            if not model:
                print(f"[WARNING] Model not found in DB: {model_name}")
                return False
            
            # Update the model
            model.benchmark_responses = json.dumps(data.get('benchmark_responses', {}))
            model.scoring_details = json.dumps(data.get('scoring_details', {}))
            model.score_highlights = json.dumps(data.get('score_highlights', []))
            model.score_weaknesses = json.dumps(data.get('score_weaknesses', []))
            model.last_benchmark_at = datetime.utcnow()
            
            # Calculate benchmark score from responses
            if data.get('benchmark_responses'):
                scores = []
                for response_data in data['benchmark_responses'].values():
                    if 'score' in response_data:
                        scores.append(response_data['score'])
                if scores:
                    model.benchmark_score = sum(scores) / len(scores)
            
            await session.commit()
            print(f"[SUCCESS] Updated model: {model_name}")
            print(f"  - Responses: {len(data.get('benchmark_responses', {}))}")
            print(f"  - Highlights: {len(data.get('score_highlights', []))}")
            print(f"  - Weaknesses: {len(data.get('score_weaknesses', []))}")
            return True
            
        except Exception as e:
            print(f"[ERROR] Failed to update {model_name}: {e}")
            await session.rollback()
            return False
    
    async def import_all_data(self):
        """Main import function"""
        async with AsyncSessionLocal() as session:
            total_updated = 0
            
            for provider, file_path in self.providers.items():
                print(f"\n{'='*50}")
                print(f"Processing {provider.upper()}")
                print(f"{'='*50}")
                
                # Load provider data
                data = await self.load_provider_data(provider, file_path)
                if not data:
                    continue
                
                # Process based on provider
                if provider == "openai":
                    model_data = await self.process_openai_data(data)
                elif provider == "anthropic":
                    model_data = await self.process_anthropic_data(data)
                elif provider == "deepseek":
                    model_data = await self.process_deepseek_data(data)
                elif provider == "qwen":
                    model_data = await self.process_qwen_data(data)
                else:
                    continue
                
                # Update each model
                for model_name, model_info in model_data.items():
                    success = await self.update_model_in_db(session, model_name, model_info)
                    if success:
                        total_updated += 1
            
            print(f"\n{'='*50}")
            print(f"Import Complete: {total_updated} models updated")
            print(f"{'='*50}")
            
            # Verify the import
            result = await session.execute(
                text("""
                    SELECT name, 
                           LENGTH(benchmark_responses) as resp_len,
                           LENGTH(score_highlights) as high_len,
                           LENGTH(score_weaknesses) as weak_len
                    FROM ai_models
                    WHERE benchmark_responses IS NOT NULL 
                      AND benchmark_responses != '{}'
                    ORDER BY name
                """)
            )
            
            print("\nModels with benchmark data:")
            for row in result:
                print(f"  - {row.name}: responses={row.resp_len} chars, "
                      f"highlights={row.high_len} chars, weaknesses={row.weak_len} chars")


async def main():
    """Run the import"""
    print("Starting benchmark data import...")
    print(f"Database: {os.environ.get('DATABASE_URL', 'local SQLite')}")
    
    importer = BenchmarkDataImporter()
    await importer.import_all_data()
    
    print("\nImport completed!")


if __name__ == "__main__":
    asyncio.run(main())