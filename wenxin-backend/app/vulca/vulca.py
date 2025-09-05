"""
VULCA API Routes
FastAPI endpoints for VULCA evaluation system
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List, Dict, Optional, Any
from sqlalchemy.ext.asyncio import AsyncSession

from .services.vulca_service import VULCAService
from .schemas.vulca_schema import (
    VULCAEvaluationRequest,
    VULCAEvaluationResponse,
    VULCAComparisonRequest,
    VULCAComparisonResponse,
    VULCADimensionInfo,
    VULCACulturalPerspective
)
from ..core.database import get_db

router = APIRouter(
    prefix="/api/v1/vulca",
    tags=["VULCA"]
)

async def get_vulca_service(db: AsyncSession = Depends(get_db)) -> VULCAService:
    """Dependency to get VULCA service instance"""
    return VULCAService(db)

@router.get("/info")
async def get_vulca_info():
    """
    Get VULCA system information
    
    Returns basic information about the VULCA evaluation system
    """
    return {
        "version": "2.0",
        "name": "VULCA - Vision-Understanding and Language-based Cultural Adaptability",
        "description": "Multi-dimensional AI model evaluation framework",
        "dimensions": {
            "original": 6,
            "extended": 47
        },
        "cultural_perspectives": 8,
        "algorithm": "correlation_matrix_expansion",
        "features": [
            "6D to 47D intelligent expansion",
            "8 cultural perspective evaluations",
            "Model comparison and ranking",
            "Historical tracking"
        ]
    }

@router.post("/evaluate")
async def evaluate_model(
    request: VULCAEvaluationRequest,
    service: VULCAService = Depends(get_vulca_service)
):
    """
    Evaluate a model using VULCA framework
    
    Expands 6D scores to 47D and calculates cultural perspectives
    """
    try:
        result = await service.evaluate_model(
            model_id=request.model_id,
            scores_6d=request.scores_6d.dict(),
            model_name=request.model_name
        )
        
        return VULCAEvaluationResponse(
            model_id=result['model_id'],
            model_name=result['model_name'],
            scores_6d=result['scores_6d'],
            scores_47d=result['scores_47d'],
            cultural_perspectives=result['cultural_perspectives'],
            evaluation_date=result['evaluation_date'],
            metadata=result['metadata']
        )
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Evaluation failed: {str(e)}")

@router.post("/compare")
async def compare_models(
    request: VULCAComparisonRequest,
    service: VULCAService = Depends(get_vulca_service)
):
    """
    Compare multiple models using VULCA metrics
    
    Generates difference matrix and comparison summary
    """
    try:
        if len(request.model_ids) < 2:
            raise ValueError("At least 2 models required for comparison")
        
        if len(request.model_ids) > 10:
            raise ValueError("Maximum 10 models allowed for comparison")
            
        result = await service.compare_models(
            model_ids=request.model_ids,
            include_details=request.include_details
        )
        
        return VULCAComparisonResponse(**result)
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Comparison failed: {str(e)}")

@router.get("/dimensions", response_model=List[VULCADimensionInfo])
async def get_dimensions(
    service: VULCAService = Depends(get_vulca_service)
):
    """
    Get detailed information about all 47 dimensions
    
    Returns dimension names, categories, descriptions, and weights
    """
    try:
        dimensions = await service.get_dimensions_info()
        return dimensions
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get dimensions: {str(e)}")

@router.get("/cultural-perspectives", response_model=List[VULCACulturalPerspective])
async def get_cultural_perspectives(
    service: VULCAService = Depends(get_vulca_service)
):
    """
    Get information about all 8 cultural perspectives
    
    Returns perspective names, descriptions, and weight ranges
    """
    try:
        perspectives = await service.get_cultural_perspectives()
        return perspectives
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get perspectives: {str(e)}")

@router.get("/history/{model_id}")
async def get_model_history(
    model_id: int,
    limit: int = Query(10, ge=1, le=100),
    service: VULCAService = Depends(get_vulca_service)
):
    """
    Get evaluation history for a specific model
    
    Returns historical VULCA evaluations with timestamps
    """
    try:
        history = await service.get_model_history(model_id, limit)
        
        if not history:
            raise HTTPException(status_code=404, detail=f"No history found for model {model_id}")
            
        return {
            "model_id": model_id,
            "total_evaluations": len(history),
            "evaluations": history
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get history: {str(e)}")

@router.get("/sample-evaluation/{model_id}")
async def get_sample_evaluation(model_id: int):
    """
    Generate a sample VULCA evaluation for testing
    
    Creates random 6D scores and performs full evaluation
    """
    import numpy as np
    
    # Generate random 6D scores
    np.random.seed(model_id)  # Consistent samples for same model ID
    scores_6d = {
        'creativity': float(np.random.uniform(70, 95)),
        'technique': float(np.random.uniform(75, 92)),
        'emotion': float(np.random.uniform(68, 90)),
        'context': float(np.random.uniform(72, 88)),
        'innovation': float(np.random.uniform(70, 93)),
        'impact': float(np.random.uniform(73, 91))
    }
    
    # Create service without database
    service = VULCAService(None)
    
    try:
        result = await service.evaluate_model(
            model_id=model_id,
            scores_6d=scores_6d,
            model_name=f"Sample_Model_{model_id}"
        )
        
        return {
            "message": "Sample evaluation generated successfully",
            "note": "This is test data only",
            "evaluation": result
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Sample generation failed: {str(e)}")

@router.get("/demo-comparison")
async def get_demo_comparison():
    """
    Generate a demo comparison between 3 sample models
    
    Useful for testing the comparison functionality
    """
    # Create service without database
    service = VULCAService(None)
    
    try:
        result = await service.compare_models(
            model_ids=[1, 2, 3],
            include_details=True
        )
        
        return {
            "message": "Demo comparison generated successfully",
            "note": "This is test data only",
            "comparison": result
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Demo generation failed: {str(e)}")