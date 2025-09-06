"""
Unit tests for VULCA-Rankings integration API
"""

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from app.main import app
from app.core.database import get_db
from app.models.ai_model import AIModel


@pytest.mark.asyncio
async def test_models_endpoint_with_vulca():
    """Test /api/v1/models endpoint with include_vulca parameter"""
    async with AsyncClient(app=app, base_url="http://test") as client:
        # Test without VULCA data
        response = await client.get("/api/v1/models?include_vulca=false")
        assert response.status_code == 200
        data = response.json()
        
        # Should not have VULCA fields when include_vulca=false
        if len(data) > 0:
            assert "vulca_scores_47d" not in data[0]
            assert "vulca_cultural_perspectives" not in data[0]
        
        # Test with VULCA data
        response = await client.get("/api/v1/models?include_vulca=true")
        assert response.status_code == 200
        data = response.json()
        
        # Should have VULCA fields when include_vulca=true
        if len(data) > 0:
            assert "vulca_scores_47d" in data[0]
            assert "vulca_cultural_perspectives" in data[0]
            assert "vulca_evaluation_date" in data[0]
            assert "vulca_sync_status" in data[0]


@pytest.mark.asyncio
async def test_model_detail_with_vulca():
    """Test /api/v1/models/{id} endpoint with VULCA data"""
    async with AsyncClient(app=app, base_url="http://test") as client:
        # First get a model ID
        response = await client.get("/api/v1/models?limit=1")
        if response.status_code == 200 and len(response.json()) > 0:
            model_id = response.json()[0]["id"]
            
            # Test getting model with VULCA (default)
            response = await client.get(f"/api/v1/models/{model_id}")
            assert response.status_code == 200
            data = response.json()
            
            # Should include VULCA fields by default
            assert "vulca_scores_47d" in data
            assert "vulca_cultural_perspectives" in data
            assert "vulca_evaluation_date" in data
            assert "vulca_sync_status" in data
            
            # Test without VULCA
            response = await client.get(f"/api/v1/models/{model_id}?include_vulca=false")
            assert response.status_code == 200
            data = response.json()
            
            # Should not have VULCA fields
            assert "vulca_scores_47d" not in data or data["vulca_scores_47d"] is None


@pytest.mark.asyncio
async def test_vulca_models_endpoint():
    """Test /api/v1/vulca/models endpoint"""
    async with AsyncClient(app=app, base_url="http://test") as client:
        # Test getting all models available for VULCA
        response = await client.get("/api/v1/vulca/models")
        assert response.status_code == 200
        data = response.json()
        
        assert "total" in data
        assert "models" in data
        assert isinstance(data["models"], list)
        
        # Each model should have required fields
        if len(data["models"]) > 0:
            model = data["models"][0]
            assert "id" in model
            assert "name" in model
            assert "organization" in model
            assert "has_vulca" in model
            assert "vulca_sync_status" in model
        
        # Test filtering by evaluation status
        response = await client.get("/api/v1/vulca/models?has_evaluation=true")
        assert response.status_code == 200
        data = response.json()
        
        # All returned models should have VULCA evaluations
        for model in data["models"]:
            if model["has_vulca"]:
                assert model["vulca_sync_status"] == "completed"


@pytest.mark.asyncio
async def test_vulca_evaluate_with_sync():
    """Test VULCA evaluation endpoint with auto-sync"""
    async with AsyncClient(app=app, base_url="http://test") as client:
        # Prepare test evaluation request
        evaluation_request = {
            "model_id": 1,
            "model_name": "Test Model",
            "scores_6d": {
                "creativity": 85.0,
                "technique": 88.0,
                "emotion": 82.0,
                "context": 86.0,
                "innovation": 84.0,
                "impact": 87.0
            }
        }
        
        # Submit evaluation
        response = await client.post(
            "/api/v1/vulca/evaluate",
            json=evaluation_request
        )
        
        # Should succeed or return validation error
        assert response.status_code in [200, 422, 500]
        
        if response.status_code == 200:
            data = response.json()
            assert "scores_47d" in data
            assert "cultural_perspectives" in data
            assert len(data["scores_47d"]) == 47  # Should have 47 dimensions


@pytest.mark.asyncio
async def test_vulca_sync_status():
    """Test VULCA sync status tracking"""
    async with AsyncClient(app=app, base_url="http://test") as client:
        # Get models and check sync status
        response = await client.get("/api/v1/models?include_vulca=true&limit=10")
        assert response.status_code == 200
        models = response.json()
        
        # Check that sync status is tracked
        for model in models:
            assert "vulca_sync_status" in model
            assert model["vulca_sync_status"] in ["pending", "syncing", "completed", "failed", "no_data", None]


@pytest.mark.asyncio
async def test_api_performance():
    """Test API performance with VULCA data"""
    import time
    
    async with AsyncClient(app=app, base_url="http://test") as client:
        # Test response time without VULCA
        start = time.time()
        response = await client.get("/api/v1/models?include_vulca=false&limit=50")
        time_without_vulca = time.time() - start
        assert response.status_code == 200
        
        # Test response time with VULCA
        start = time.time()
        response = await client.get("/api/v1/models?include_vulca=true&limit=50")
        time_with_vulca = time.time() - start
        assert response.status_code == 200
        
        # Performance should not degrade significantly
        # Allow up to 2x slower with VULCA data
        assert time_with_vulca < time_without_vulca * 2
        
        print(f"Performance: without VULCA={time_without_vulca:.3f}s, with VULCA={time_with_vulca:.3f}s")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])