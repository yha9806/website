"""
Health check endpoints for monitoring system status
"""
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, text
from typing import Dict, Any, List

from app.core.database import get_db
from app.models import AIModel

router = APIRouter()


@router.get("/database")
async def check_database_health(db: AsyncSession = Depends(get_db)) -> Dict[str, Any]:
    """
    Comprehensive database health check
    Returns detailed information about database status
    """
    health = {
        "status": "healthy",
        "checks": {},
        "errors": []
    }
    
    try:
        # 1. Check database connection
        await db.execute(text("SELECT 1"))
        health["checks"]["connection"] = {"status": "ok", "message": "Database is reachable"}
    except Exception as e:
        health["status"] = "unhealthy"
        health["checks"]["connection"] = {"status": "error", "message": str(e)}
        health["errors"].append(f"Database connection failed: {e}")
        return health
    
    # 2. Check table existence
    try:
        tables_query = text("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' OR table_type = 'table'
        """)
        result = await db.execute(tables_query)
        tables = [row[0] for row in result]
        
        required_tables = ["ai_models", "users", "evaluation_tasks", "battles"]
        missing_tables = [t for t in required_tables if t not in tables]
        
        if missing_tables:
            health["status"] = "warning"
            health["checks"]["tables"] = {
                "status": "warning",
                "missing": missing_tables,
                "found": [t for t in required_tables if t in tables]
            }
        else:
            health["checks"]["tables"] = {
                "status": "ok",
                "message": f"All {len(required_tables)} required tables exist"
            }
    except Exception as e:
        # SQLite doesn't have information_schema, use a different approach
        try:
            # Check if we can query the main table
            await db.execute(select(AIModel).limit(1))
            health["checks"]["tables"] = {
                "status": "ok",
                "message": "ai_models table accessible"
            }
        except Exception as table_error:
            health["status"] = "unhealthy"
            health["checks"]["tables"] = {
                "status": "error",
                "message": f"Table check failed: {table_error}"
            }
            health["errors"].append(f"Table check failed: {table_error}")
    
    # 3. Check column integrity for ai_models
    try:
        # Try to query all score columns
        score_columns_query = select(
            AIModel.id,
            AIModel.name,
            AIModel.overall_score,
            AIModel.rhythm_score,
            AIModel.composition_score,
            AIModel.narrative_score,
            AIModel.emotion_score,
            AIModel.creativity_score,
            AIModel.cultural_score
        ).limit(1)
        
        await db.execute(score_columns_query)
        health["checks"]["columns"] = {
            "status": "ok",
            "message": "All score columns are present"
        }
    except Exception as e:
        health["status"] = "warning"
        error_msg = str(e)
        missing_columns = []
        
        # Parse error to find missing columns
        for col in ["rhythm_score", "composition_score", "narrative_score", 
                   "emotion_score", "creativity_score", "cultural_score"]:
            if col in error_msg:
                missing_columns.append(col)
        
        health["checks"]["columns"] = {
            "status": "error" if missing_columns else "warning",
            "message": f"Column check failed: {error_msg[:100]}",
            "missing": missing_columns
        }
        if missing_columns:
            health["errors"].append(f"Missing columns: {', '.join(missing_columns)}")
    
    # 4. Check data integrity
    try:
        # Count total models
        total_count = await db.scalar(select(sa.func.count(AIModel.id)))
        
        # Count models with scores
        with_scores = await db.scalar(
            select(sa.func.count(AIModel.id))
            .where(AIModel.overall_score.isnot(None))
        )
        
        # Count models without scores
        without_scores = await db.scalar(
            select(sa.func.count(AIModel.id))
            .where(AIModel.overall_score.is_(None))
        )
        
        # Get top models
        top_models_query = select(
            AIModel.name,
            AIModel.organization,
            AIModel.overall_score
        ).where(
            AIModel.overall_score.isnot(None)
        ).order_by(
            AIModel.overall_score.desc()
        ).limit(3)
        
        result = await db.execute(top_models_query)
        top_models = [
            {"name": row[0], "org": row[1], "score": row[2]}
            for row in result
        ]
        
        health["checks"]["data"] = {
            "status": "ok" if total_count > 0 else "warning",
            "total_models": total_count,
            "models_with_scores": with_scores,
            "models_without_scores": without_scores,
            "top_models": top_models
        }
        
        if total_count == 0:
            health["status"] = "warning"
            health["errors"].append("No models found in database")
            
    except Exception as e:
        health["checks"]["data"] = {
            "status": "error",
            "message": f"Data check failed: {str(e)[:100]}"
        }
    
    # 5. Set overall status
    if health["errors"]:
        health["status"] = "unhealthy" if any("error" in str(e).lower() for e in health["errors"]) else "warning"
    
    return health


@router.get("/")
async def health_check() -> Dict[str, Any]:
    """
    Basic health check endpoint
    """
    return {
        "status": "healthy",
        "service": "wenxin-backend",
        "version": "1.0.0"
    }


@router.get("/ready")
async def readiness_check(db: AsyncSession = Depends(get_db)) -> Dict[str, Any]:
    """
    Readiness check for Kubernetes/Cloud Run
    Returns 503 if not ready
    """
    try:
        # Quick database check
        await db.execute(text("SELECT 1"))
        
        # Check if we have data
        count = await db.scalar(select(sa.func.count(AIModel.id)))
        
        if count == 0:
            return {
                "status": "not_ready",
                "reason": "No data in database"
            }
        
        return {
            "status": "ready",
            "model_count": count
        }
    except Exception as e:
        return {
            "status": "not_ready",
            "reason": str(e)
        }


# Fix import for sqlalchemy functions
import sqlalchemy as sa