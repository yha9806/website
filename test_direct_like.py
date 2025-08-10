#!/usr/bin/env python3
"""
Test script to test like endpoint directly without the full application
"""
import sys
import os

# Add the backend directory to Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'wenxin-backend'))

from fastapi import FastAPI
from fastapi.testclient import TestClient
import asyncio
from app.api.v1.artworks import router
from app.core.database import init_db, get_db

async def test_like_endpoint():
    """Test the like endpoint directly"""
    print("Testing like endpoint...")
    
    # Create a test app
    app = FastAPI()
    app.include_router(router, prefix="/artworks", tags=["Test Artworks"])
    
    # Initialize database
    await init_db()
    
    # Create test client
    client = TestClient(app)
    
    # Get all artworks first
    response = client.get("/artworks/")
    print(f"GET /artworks/ - Status: {response.status_code}")
    if response.status_code == 200:
        artworks = response.json()["artworks"]
        if artworks:
            artwork_id = artworks[0]["id"]
            print(f"Using artwork ID: {artwork_id}")
            
            # Test the like endpoint
            like_response = client.post(f"/artworks/{artwork_id}/like")
            print(f"POST /artworks/{artwork_id}/like - Status: {like_response.status_code}")
            print(f"Response: {like_response.json()}")
        else:
            print("No artworks found in database")
    else:
        print(f"Failed to get artworks: {response.text}")

if __name__ == "__main__":
    asyncio.run(test_like_endpoint())