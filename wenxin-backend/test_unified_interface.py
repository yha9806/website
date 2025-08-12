"""
Test script for Unified Model Interface
"""
import asyncio
import logging
from app.services.models import UnifiedModelClient, model_registry

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


async def test_unified_interface():
    """Test the unified model interface with different models"""
    
    client = UnifiedModelClient()
    
    # Test models to verify
    test_models = [
        'gpt-4o-mini',  # Should work with real API
        'gpt-5',        # Should use special handling
        'o1-mini',      # Should use special handling
        'deepseek-v3',  # Should fail (no API key)
        'claude-3.5-sonnet'  # Should fail (no API key)
    ]
    
    test_prompt = "Write a haiku about artificial intelligence"
    
    for model_id in test_models:
        print(f"\n{'='*60}")
        print(f"Testing model: {model_id}")
        print('='*60)
        
        # Check if model is registered
        try:
            config = model_registry.get_model(model_id)
            print(f"OK: Model found in registry")
            print(f"  Provider: {config.provider}")
            print(f"  API Name: {config.api_model_name}")
            print(f"  Special handling: {config.requires_special_handling}")
        except KeyError:
            print(f"ERROR: Model not found in registry")
            continue
        
        # Try to generate content
        try:
            response = await client.generate(
                model_id=model_id,
                prompt=test_prompt,
                max_tokens=100
            )
            
            print(f"OK: Generation successful!")
            print(f"  Model used: {response.get('model_used', 'unknown')}")
            print(f"  Content length: {len(response.get('content', ''))}")
            print(f"  Content preview: {response.get('content', '')[:100]}...")
            
        except Exception as e:
            print(f"ERROR: Generation failed: {e}")
    
    # Show registry statistics
    print(f"\n{'='*60}")
    print("Registry Statistics")
    print('='*60)
    stats = model_registry.get_stats()
    print(f"Total models: {stats['total_models']}")
    print(f"By provider:")
    for provider, count in stats['by_provider'].items():
        print(f"  {provider}: {count} models")
    print(f"By type:")
    for model_type, count in stats['by_type'].items():
        print(f"  {model_type}: {count} models")


async def test_benchmark_integration():
    """Test that BenchmarkRunner can use the new interface"""
    from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
    from sqlalchemy.orm import sessionmaker
    from app.services.benchmark.benchmark_runner import BenchmarkRunner
    
    # Create test database session
    engine = create_async_engine("sqlite+aiosqlite:///./wenxin.db")
    AsyncSessionLocal = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    async with AsyncSessionLocal() as session:
        runner = BenchmarkRunner(session)
        print("\nOK: BenchmarkRunner initialized with Unified Model Interface")
        
        # The runner should now use unified_client instead of provider_manager
        assert hasattr(runner, 'unified_client'), "BenchmarkRunner should have unified_client"
        assert not hasattr(runner, 'provider_manager'), "BenchmarkRunner should not have provider_manager"
        print("OK: BenchmarkRunner correctly uses UnifiedModelClient")


if __name__ == "__main__":
    print("Testing Unified Model Interface...")
    asyncio.run(test_unified_interface())
    
    print("\n" + "="*60)
    print("Testing Benchmark Integration...")
    asyncio.run(test_benchmark_integration())