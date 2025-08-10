#!/usr/bin/env python3
"""
Test script to verify artworks API routes are working correctly
"""
import asyncio
import sys
import os

# Add the backend directory to Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'wenxin-backend'))

from app.api.v1.artworks import router
from fastapi.testclient import TestClient
from fastapi import FastAPI

def test_routes():
    """Test artworks API routes"""
    app = FastAPI()
    app.include_router(router, prefix="/api/v1/artworks", tags=["Artworks"])
    
    # Print all routes
    print("Available routes in artworks router:")
    for route in router.routes:
        print(f"  {route.methods} {route.path}")
    
    # Test with client
    client = TestClient(app)
    
    # Test basic routes
    print("\nTesting routes...")
    
    # Test like endpoint specifically
    test_id = "test-artwork-id"
    response = client.post(f"/api/v1/artworks/{test_id}/like")
    print(f"POST /api/v1/artworks/{test_id}/like - Status: {response.status_code}")
    if response.status_code == 404:
        print("  Content:", response.json())
    
if __name__ == "__main__":
    test_routes()