#!/usr/bin/env python
"""
Run production import with proper environment setup
"""
import os
import sys
import subprocess
import time

def main():
    print("Setting up production environment...")
    
    # Set environment variables
    os.environ['ENVIRONMENT'] = 'production'
    os.environ['DATABASE_URL'] = 'postgresql+asyncpg://postgres:Qnqwdn7800@127.0.0.1:5432/wenxin'
    
    print(f"Environment: {os.environ.get('ENVIRONMENT')}")
    print(f"Database URL: {os.environ.get('DATABASE_URL')[:50]}...")
    
    # Wait a moment for proxy to be ready
    print("\nWaiting for Cloud SQL proxy to be ready...")
    time.sleep(3)
    
    # Run the import script
    print("\nRunning production import...")
    result = subprocess.run([sys.executable, 'production_import.py'], 
                          capture_output=False, text=True)
    
    return result.returncode

if __name__ == "__main__":
    exit_code = main()
    sys.exit(exit_code)