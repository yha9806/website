"""
Fix import script to match actual model names in database
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
        
        # Map test result model names to actual database model names
        self.model_name_mapping = {
            # OpenAI models
            "gpt-4o": "GPT-4o",
            "gpt-4o-mini": "GPT-4o-mini", 
            "gpt-4-turbo": "GPT-4 Turbo",
            "gpt-4": "GPT-4",
            "gpt-4.5": "GPT-4.5",
            "gpt-5": "GPT-5",
            "gpt-5-mini": "GPT-5-mini",
            "gpt-5-nano": "GPT-5-nano",
            "o1": "o1",
            "o1-mini": "o1-mini",
            "o3-mini": "o3-mini",
            
            # Anthropic models
            "claude-3-5-sonnet-20241022": "Claude 3.5 Sonnet",
            "claude-3-5-haiku-20241022": "Claude 3.5 Haiku",
            "claude-3-opus-20240229": "Claude 3 Opus",
            "claude-3-haiku-20240307": "Claude 3 Haiku",
            "claude-opus-4-1-20250805": "Claude Opus 4.1",
            "claude-opus-4-1": "Claude Opus 4.1",
            "claude-opus-4-20250514": "Claude Opus 4.0",
            "claude-opus-4-0": "Claude Opus 4.0",
            "claude-sonnet-4-20250514": "Claude Sonnet 4.0",
            "claude-sonnet-4-0": "Claude Sonnet 4.0",
            
            # DeepSeek models
            "deepseek-v3": "DeepSeek V3",
            "deepseek-r1": "DeepSeek R1",
            "deepseek-r1-distill": "DeepSeek R1 Distill",
            
            # Qwen models
            "qwen-max-2025-01-25": "Qwen Max",
            "qwen-max": "Qwen Max",
            "qwen-plus": "Qwen Plus",
            "qwen-flash": "Qwen Flash",
            "qwen3-32b": "Qwen3 32B",
            "qwen3-8b": "Qwen3 8B"
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
                
                # Map to actual database name
                db_model_name = self.model_name_mapping.get(model_id, model_id)
                    
                if db_model_name not in model_data:
                    model_data[db_model_name] = {
                        'benchmark_responses': {},
                        'score_highlights': [],
                        'score_weaknesses': [],
                        'scoring_details': {}
                    }
                
                # Add benchmark response
                test_id = result.get('test_id', '')
                if test_id and 'response' in result:
                    model_data[db_model_name]['benchmark_responses'][test_id] = {
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
                        model_data[db_model_name]['score_highlights'].extend(details['highlights'])
                    if 'weaknesses' in details:
                        model_data[db_model_name]['score_weaknesses'].extend(details['weaknesses'])
                    
                    # Store scoring details
                    model_data[db_model_name]['scoring_details'][test_id] = details
        
        # Remove duplicates from highlights/weaknesses
        for model_name in model_data:
            model_data[model_name]['score_highlights'] = list(set(model_data[model_name]['score_highlights']))
            model_data[model_name]['score_weaknesses'] = list(set(model_data[model_name]['score_weaknesses']))
        
        return model_data
    
    async def process_anthropic_data(self, data: Dict) -> Dict[str, Dict]:
        """Process Anthropic benchmark data"""
        # Anthropic data structure is similar to OpenAI
        if 'all_results' in data:
            return await self.process_openai_data(data)
        elif 'test_results' in data:
            # Alternative structure
            data['all_results'] = data['test_results']
            return await self.process_openai_data(data)
        
        return {}
    
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
            # Find the model by name
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
            print(f"  - Responses: {len(data.get('benchmark_responses', {}))} entries")
            print(f"  - Highlights: {len(data.get('score_highlights', []))} items")
            print(f"  - Weaknesses: {len(data.get('score_weaknesses', []))} items")
            return True
            
        except Exception as e:
            print(f"[ERROR] Failed to update {model_name}: {e}")
            await session.rollback()
            return False
    
    async def import_all_data(self):
        """Main import function"""
        async with AsyncSessionLocal() as session:
            # First, list all models in the database
            result = await session.execute(select(AIModel.name))
            db_models = set(result.scalars().all())
            print(f"\nFound {len(db_models)} models in database")
            print("Models:", sorted(db_models))
            
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
                    if model_name in db_models:
                        success = await self.update_model_in_db(session, model_name, model_info)
                        if success:
                            total_updated += 1
                    else:
                        print(f"[SKIP] Model {model_name} not in database")
            
            print(f"\n{'='*50}")
            print(f"Import Complete: {total_updated} models updated")
            print(f"{'='*50}")
            
            # Verify the import
            result = await session.execute(
                text("""
                    SELECT name, 
                           LENGTH(benchmark_responses) as resp_len,
                           LENGTH(score_highlights) as high_len,
                           LENGTH(score_weaknesses) as weak_len,
                           benchmark_score
                    FROM ai_models
                    WHERE benchmark_responses IS NOT NULL 
                      AND benchmark_responses != '{}'
                    ORDER BY name
                """)
            )
            
            print("\nModels with benchmark data:")
            for row in result:
                print(f"  - {row.name}: score={row.benchmark_score:.1f}, responses={row.resp_len} chars, "
                      f"highlights={row.high_len} chars, weaknesses={row.weak_len} chars")


async def main():
    """Run the import"""
    print("Starting benchmark data import...")
    print(f"Database: {os.environ.get('DATABASE_URL', 'configured via settings')}")
    
    importer = BenchmarkDataImporter()
    await importer.import_all_data()
    
    print("\nImport completed!")


if __name__ == "__main__":
    asyncio.run(main())