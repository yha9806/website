#!/usr/bin/env python
"""
Import benchmark data directly to Cloud Run production database
"""
import os
import json
import asyncio
from pathlib import Path

# Set production environment
os.environ['ENVIRONMENT'] = 'production'
os.environ['USE_CLOUD_SQL'] = 'True'

# Import after setting environment
from import_benchmark_data import BenchmarkDataImporter

async def main():
    print("="*60)
    print("CLOUD RUN BENCHMARK DATA IMPORT")
    print("="*60)
    print(f"Environment: {os.environ.get('ENVIRONMENT')}")
    print(f"Cloud SQL: {os.environ.get('USE_CLOUD_SQL')}")
    
    importer = BenchmarkDataImporter()
    await importer.import_all_data()
    
    print("\nCloud Run import completed!")

if __name__ == "__main__":
    asyncio.run(main())