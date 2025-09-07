#!/usr/bin/env python3
"""Debug VULCA comparison issue"""

import asyncio
import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.vulca.services.vulca_service import VULCAService

async def debug_vulca():
    """Debug VULCA comparison issue"""
    print("=== VULCA Debug Session ===")
    
    # Initialize service
    service = VULCAService()
    
    print("1. Testing sample data generation...")
    
    try:
        # Test compare with no database (should generate sample data)
        result = await service.compare_models([1, 2], include_details=True)
        
        print(f"SUCCESS: Compare result keys: {list(result.keys())}")
        
        if 'error' in result:
            print(f"ERROR: Error in result: {result['error']}")
        else:
            print(f"SUCCESS: Models count: {len(result.get('models', []))}")
            print(f"SUCCESS: Difference matrix shape: {len(result.get('difference_matrix', []))}")
            
    except Exception as e:
        print(f"EXCEPTION: Exception occurred: {str(e)}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(debug_vulca())