#!/usr/bin/env python3
"""
Update production database with all AI models
This script connects to the production API to populate the database
"""

import requests
import json

# Production API endpoint
API_BASE_URL = "https://wenxin-moyun-api-229980166599.asia-east1.run.app"

def test_api_connection():
    """Test if the API is accessible"""
    try:
        response = requests.get(f"{API_BASE_URL}/api/v1/models/")
        print(f"API Status: {response.status_code}")
        data = response.json()
        print(f"Current models in production: {len(data)} models")
        return True
    except Exception as e:
        print(f"Error connecting to API: {e}")
        return False

def call_admin_endpoint():
    """Call the admin endpoint to populate all models"""
    try:
        # Try the migrate endpoint that should populate all benchmark data
        response = requests.post(f"{API_BASE_URL}/api/v1/admin/migrate-all-benchmark-data")
        if response.status_code == 200:
            print("Successfully populated production database!")
            print(response.json())
            return True
        else:
            print(f"Error: {response.status_code}")
            print(response.text)
            return False
    except Exception as e:
        print(f"Error calling admin endpoint: {e}")
        return False

if __name__ == "__main__":
    print("Testing production API connection...")
    if test_api_connection():
        print("\nAttempting to populate production database...")
        if call_admin_endpoint():
            print("\nVerifying data...")
            test_api_connection()
        else:
            print("\nAdmin endpoint not accessible. You may need to:")
            print("1. Deploy the backend with the admin endpoints")
            print("2. Or use Cloud SQL direct connection")
            print("3. Or push the initialized database through CI/CD")