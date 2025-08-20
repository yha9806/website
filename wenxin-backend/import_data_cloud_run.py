"""
Cloud Run Job to import comprehensive data directly in production
This runs inside Cloud Run with direct Cloud SQL access
"""
import os
import sys
import asyncio
from pathlib import Path

# Set environment for production
os.environ['ENVIRONMENT'] = 'production'
os.environ['USE_CLOUD_SQL'] = 'True'
os.environ['CLOUD_SQL_INSTANCE'] = 'wenxin-moyun-prod-new:asia-east1:wenxin-postgres'

# Import the existing import script
sys.path.insert(0, str(Path(__file__).parent))
from import_comprehensive_data import main

if __name__ == "__main__":
    print("Starting Cloud Run data import job...")
    print(f"Environment: {os.environ.get('ENVIRONMENT')}")
    print(f"Cloud SQL Instance: {os.environ.get('CLOUD_SQL_INSTANCE')}")
    
    # Run the import
    asyncio.run(main())
    
    print("Cloud Run import job completed!")