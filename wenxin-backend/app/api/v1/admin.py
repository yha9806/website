"""
管理API端点 - 用于数据迁移和管理操作
"""

import json
import sqlite3
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text, select, delete
from pydantic import BaseModel, Field
from app.core.database import get_db
from app.core.auth import get_current_admin_user
from app.models.ai_model import AIModel
from app.models.user import User
from app.repositories import ModelRepository

router = APIRouter()


class UpdateScoresRequest(BaseModel):
    """Request model for updating scores"""
    overall_score: Optional[float] = Field(None, ge=0, le=100)
    rhythm_score: Optional[float] = Field(None, ge=0, le=100)
    composition_score: Optional[float] = Field(None, ge=0, le=100)
    narrative_score: Optional[float] = Field(None, ge=0, le=100)
    emotion_score: Optional[float] = Field(None, ge=0, le=100)
    creativity_score: Optional[float] = Field(None, ge=0, le=100)
    cultural_score: Optional[float] = Field(None, ge=0, le=100)


class BatchUpdateRequest(BaseModel):
    """Request model for batch score updates"""
    updates: List[Dict[str, Any]] = Field(
        ..., 
        description="List of updates with model_id and scores"
    )

@router.delete("/clear-all-mock-models")
async def clear_all_mock_models(db: AsyncSession = Depends(get_db)):
    """
    清除所有mock模型，只保留benchmark数据
    """
    try:
        from app.models.evaluation_task import EvaluationTask
        from app.models.battle import Battle
        from app.models.artwork import Artwork
        
        # 获取所有mock模型的ID
        mock_models_result = await db.execute(
            select(AIModel.id).where(AIModel.data_source == 'mock')
        )
        mock_model_ids = [row[0] for row in mock_models_result.fetchall()]
        
        if mock_model_ids:
            # 删除相关的评测任务
            await db.execute(
                delete(EvaluationTask).where(EvaluationTask.model_id.in_(mock_model_ids))
            )
            
            # 删除相关的对战记录
            await db.execute(
                delete(Battle).where(
                    Battle.model_a_id.in_(mock_model_ids) | 
                    Battle.model_b_id.in_(mock_model_ids)
                )
            )
            
            # 删除相关的艺术作品
            await db.execute(
                delete(Artwork).where(Artwork.model_id.in_(mock_model_ids))
            )
            
            # 删除mock模型
            await db.execute(
                delete(AIModel).where(AIModel.data_source == 'mock')
            )
        
        await db.commit()
        
        # 获取剩余模型统计
        remaining_result = await db.execute(select(AIModel))
        remaining_models = remaining_result.scalars().all()
        
        return {
            "status": "success",
            "message": "All mock models cleared successfully",
            "deleted_count": len(mock_model_ids),
            "remaining_models": len(remaining_models),
            "remaining_by_organization": {
                org: len([m for m in remaining_models if m.organization == org])
                for org in set(m.organization for m in remaining_models)
            }
        }
        
    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to clear mock models: {str(e)}"
        )

@router.post("/migrate-openai-data")
async def migrate_openai_data(db: AsyncSession = Depends(get_db)):
    """
    将SQLite中的真实OpenAI数据迁移到PostgreSQL
    这是一次性管理操作，将覆盖现有的OpenAI模型数据
    """
    try:
        # 读取容器内的SQLite数据库文件
        sqlite_path = "./wenxin.db"
        
        # 连接SQLite并读取OpenAI数据
        sqlite_conn = sqlite3.connect(sqlite_path)
        sqlite_cursor = sqlite_conn.cursor()
        
        # 获取所有OpenAI模型数据
        sqlite_cursor.execute("""
            SELECT name, organization, version, category, description, 
                   overall_score, metrics, tags, avatar_url, data_source, is_active
            FROM ai_models 
            WHERE organization = 'OpenAI' AND data_source = 'benchmark'
            ORDER BY overall_score DESC NULLS LAST
        """)
        
        openai_models_data = []
        for row in sqlite_cursor.fetchall():
            model_data = {
                'name': row[0],
                'organization': row[1],
                'version': row[2],
                'category': row[3],
                'description': row[4],
                'overall_score': row[5],
                'metrics': json.loads(row[6]) if row[6] else {},
                'tags': json.loads(row[7]) if row[7] else [],
                'avatar_url': row[8],
                'data_source': row[9],
                'is_active': bool(row[10]) if row[10] is not None else True
            }
            openai_models_data.append(model_data)
        
        sqlite_conn.close()
        
        if not openai_models_data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No OpenAI benchmark data found in SQLite"
            )
        
        # 处理所有外键约束（级联删除相关数据）
        from app.models.evaluation_task import EvaluationTask
        from app.models.battle import Battle
        from app.models.artwork import Artwork
        
        # 获取所有OpenAI模型ID
        openai_models_result = await db.execute(
            select(AIModel.id).where(AIModel.organization == 'OpenAI')
        )
        openai_model_ids = [row[0] for row in openai_models_result.fetchall()]
        
        if openai_model_ids:
            # 删除相关的评测任务
            await db.execute(
                delete(EvaluationTask).where(EvaluationTask.model_id.in_(openai_model_ids))
            )
            
            # 删除相关的对战记录（包括model_a和model_b）
            await db.execute(
                delete(Battle).where(
                    Battle.model_a_id.in_(openai_model_ids) | 
                    Battle.model_b_id.in_(openai_model_ids)
                )
            )
            
            # 删除相关的艺术作品
            await db.execute(
                delete(Artwork).where(Artwork.model_id.in_(openai_model_ids))
            )
        
        # 删除PostgreSQL中现有的OpenAI模型
        await db.execute(
            delete(AIModel).where(AIModel.organization == 'OpenAI')
        )
        
        # 插入新的OpenAI模型数据
        inserted_count = 0
        for model_data in openai_models_data:
            # 创建新的AIModel实例
            new_model = AIModel(
                name=model_data['name'],
                organization=model_data['organization'],
                version=model_data['version'],
                category=model_data['category'],
                description=model_data['description'],
                overall_score=model_data['overall_score'],
                metrics=model_data['metrics'],
                tags=model_data['tags'],
                avatar_url=model_data['avatar_url'],
                data_source=model_data['data_source'],
                is_active=model_data['is_active']
            )
            
            db.add(new_model)
            inserted_count += 1
        
        # 提交事务
        await db.commit()
        
        # 验证迁移结果
        result = await db.execute(
            select(AIModel).where(
                AIModel.organization == 'OpenAI',
                AIModel.data_source == 'benchmark'
            ).order_by(AIModel.overall_score.desc())
        )
        migrated_models = result.scalars().all()
        
        # 获取总模型数
        total_result = await db.execute(select(AIModel))
        total_models = len(total_result.scalars().all())
        
        return {
            "status": "success",
            "message": "OpenAI data migration completed successfully",
            "details": {
                "migrated_openai_models": len(migrated_models),
                "total_models_in_db": total_models,
                "openai_models": [
                    {
                        "name": model.name,
                        "overall_score": model.overall_score,
                        "data_source": model.data_source
                    }
                    for model in migrated_models
                ]
            }
        }
        
    except FileNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="SQLite database file not found in container"
        )
    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Migration failed: {str(e)}"
        )

@router.post("/migrate-all-benchmark-data")
async def migrate_all_benchmark_data(db: AsyncSession = Depends(get_db)):
    """
    迁移所有SQLite中的benchmark数据到PostgreSQL
    会先清除所有现有数据，然后导入所有真实benchmark数据
    """
    try:
        # 读取SQLite数据库
        sqlite_path = "./wenxin.db"
        sqlite_conn = sqlite3.connect(sqlite_path)
        sqlite_cursor = sqlite_conn.cursor()
        
        # 获取所有benchmark数据（不仅是OpenAI）
        sqlite_cursor.execute("""
            SELECT name, organization, version, category, description, 
                   overall_score, metrics, tags, avatar_url, data_source, is_active
            FROM ai_models 
            WHERE data_source = 'benchmark'
            ORDER BY overall_score DESC NULLS LAST
        """)
        
        benchmark_models_data = []
        for row in sqlite_cursor.fetchall():
            model_data = {
                'name': row[0],
                'organization': row[1],
                'version': row[2],
                'category': row[3],
                'description': row[4],
                'overall_score': row[5],
                'metrics': json.loads(row[6]) if row[6] else {},
                'tags': json.loads(row[7]) if row[7] else [],
                'avatar_url': row[8],
                'data_source': row[9],
                'is_active': bool(row[10]) if row[10] is not None else True
            }
            benchmark_models_data.append(model_data)
        
        sqlite_conn.close()
        
        if not benchmark_models_data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No benchmark data found in SQLite"
            )
        
        # 清除所有现有数据
        from app.models.evaluation_task import EvaluationTask
        from app.models.battle import Battle
        from app.models.artwork import Artwork
        
        # 获取所有模型ID
        all_models_result = await db.execute(select(AIModel.id))
        all_model_ids = [row[0] for row in all_models_result.fetchall()]
        
        if all_model_ids:
            # 删除所有相关数据
            await db.execute(delete(EvaluationTask))
            await db.execute(delete(Battle))
            await db.execute(delete(Artwork))
        
        # 删除所有模型
        await db.execute(delete(AIModel))
        
        # 插入所有benchmark数据
        inserted_count = 0
        for model_data in benchmark_models_data:
            new_model = AIModel(
                name=model_data['name'],
                organization=model_data['organization'],
                version=model_data['version'],
                category=model_data['category'],
                description=model_data['description'],
                overall_score=model_data['overall_score'],
                metrics=model_data['metrics'],
                tags=model_data['tags'],
                avatar_url=model_data['avatar_url'],
                data_source=model_data['data_source'],
                is_active=model_data['is_active']
            )
            db.add(new_model)
            inserted_count += 1
        
        # 提交事务
        await db.commit()
        
        # 验证结果
        result = await db.execute(
            select(AIModel).order_by(AIModel.overall_score.desc())
        )
        all_models = result.scalars().all()
        
        # 按组织统计
        org_stats = {}
        for model in all_models:
            if model.organization not in org_stats:
                org_stats[model.organization] = []
            org_stats[model.organization].append({
                "name": model.name,
                "score": model.overall_score
            })
        
        return {
            "status": "success",
            "message": "All benchmark data migrated successfully",
            "total_models": len(all_models),
            "by_organization": {
                org: len(models) for org, models in org_stats.items()
            },
            "top_10_models": [
                {
                    "name": m.name,
                    "organization": m.organization,
                    "score": m.overall_score
                }
                for m in all_models[:10]
            ]
        }
        
    except FileNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="SQLite database file not found in container"
        )
    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Migration failed: {str(e)}"
        )

@router.get("/database-status")
async def get_database_status(db: AsyncSession = Depends(get_db)):
    """
    获取数据库状态信息
    """
    try:
        # 获取所有模型
        result = await db.execute(select(AIModel))
        all_models = result.scalars().all()
        
        # 按组织分组
        org_stats = {}
        data_source_stats = {}
        
        for model in all_models:
            # 组织统计
            if model.organization not in org_stats:
                org_stats[model.organization] = 0
            org_stats[model.organization] += 1
            
            # 数据源统计
            if model.data_source not in data_source_stats:
                data_source_stats[model.data_source] = 0
            data_source_stats[model.data_source] += 1
        
        # OpenAI模型详情
        openai_result = await db.execute(
            select(AIModel).where(AIModel.organization == 'OpenAI')
            .order_by(AIModel.overall_score.desc())
        )
        openai_models = openai_result.scalars().all()
        
        return {
            "total_models": len(all_models),
            "by_organization": org_stats,
            "by_data_source": data_source_stats,
            "openai_models": [
                {
                    "name": model.name,
                    "overall_score": model.overall_score,
                    "data_source": model.data_source,
                    "category": model.category
                }
                for model in openai_models
            ]
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get database status: {str(e)}"
        )

@router.delete("/clear-mock-data")
async def clear_mock_data(db: AsyncSession = Depends(get_db)):
    """
    清除mock数据，只保留benchmark和manual数据
    """
    try:
        # 删除所有mock数据
        result = await db.execute(
            delete(AIModel).where(AIModel.data_source == 'mock')
        )
        
        await db.commit()
        
        # 获取删除后的状态
        remaining_result = await db.execute(select(AIModel))
        remaining_models = remaining_result.scalars().all()
        
        return {
            "status": "success",
            "message": "Mock data cleared successfully",
            "remaining_models": len(remaining_models),
            "remaining_by_source": {
                source: len([m for m in remaining_models if m.data_source == source])
                for source in set(m.data_source for m in remaining_models)
            }
        }
        
    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to clear mock data: {str(e)}"
        )


@router.put("/models/{model_id}/scores")
async def update_model_scores(
    model_id: str,
    scores: UpdateScoresRequest,
    db: AsyncSession = Depends(get_db),
    current_admin: User = Depends(get_current_admin_user)
):
    """
    Update scores for a specific model
    Requires admin authentication
    """
    repo = ModelRepository(db)
    
    # Get existing model
    model = await repo.get_by_id(model_id)
    if not model:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Model {model_id} not found"
        )
    
    # Prepare update data
    update_data = {}
    if scores.overall_score is not None:
        update_data["overall_score"] = scores.overall_score
    
    # Update individual scores
    score_fields = [
        "rhythm_score", "composition_score", "narrative_score",
        "emotion_score", "creativity_score", "cultural_score"
    ]
    
    for field in score_fields:
        value = getattr(scores, field)
        if value is not None:
            update_data[field] = value
    
    # Also update metrics JSON for backward compatibility
    if any(f in update_data for f in score_fields):
        update_data["metrics"] = {
            "rhythm": scores.rhythm_score if scores.rhythm_score is not None else (model.rhythm_score or 0),
            "composition": scores.composition_score if scores.composition_score is not None else (model.composition_score or 0),
            "narrative": scores.narrative_score if scores.narrative_score is not None else (model.narrative_score or 0),
            "emotion": scores.emotion_score if scores.emotion_score is not None else (model.emotion_score or 0),
            "creativity": scores.creativity_score if scores.creativity_score is not None else (model.creativity_score or 0),
            "cultural": scores.cultural_score if scores.cultural_score is not None else (model.cultural_score or 0)
        }
    
    # Update model
    updated_model = await repo.update(model_id, update_data)
    
    return {
        "message": "Scores updated successfully",
        "model_id": model_id,
        "updated_fields": list(update_data.keys())
    }


@router.post("/models/batch-update-scores")
async def batch_update_scores(
    request: BatchUpdateRequest,
    db: AsyncSession = Depends(get_db),
    current_admin: User = Depends(get_current_admin_user)
):
    """
    Batch update scores for multiple models
    
    Example request:
    {
        "updates": [
            {
                "model_id": "gpt-4o",
                "overall_score": 95.0,
                "creativity_score": 96.0
            },
            {
                "model_id": "claude-3-opus",
                "overall_score": 93.5
            }
        ]
    }
    """
    repo = ModelRepository(db)
    results = []
    errors = []
    
    for update in request.updates:
        model_id = update.get("model_id")
        if not model_id:
            errors.append({"error": "model_id is required", "data": update})
            continue
        
        try:
            # Get existing model
            model = await repo.get_by_id(model_id)
            if not model:
                errors.append({
                    "model_id": model_id,
                    "error": f"Model {model_id} not found"
                })
                continue
            
            # Prepare update data
            update_data = {}
            
            # Update overall score if provided
            if "overall_score" in update:
                update_data["overall_score"] = update["overall_score"]
            
            # Update individual scores
            score_fields = [
                "rhythm_score", "composition_score", "narrative_score",
                "emotion_score", "creativity_score", "cultural_score"
            ]
            
            for field in score_fields:
                if field in update:
                    update_data[field] = update[field]
            
            # Update metrics JSON
            if any(f in update_data for f in score_fields):
                update_data["metrics"] = {
                    "rhythm": update.get("rhythm_score", model.rhythm_score or 0),
                    "composition": update.get("composition_score", model.composition_score or 0),
                    "narrative": update.get("narrative_score", model.narrative_score or 0),
                    "emotion": update.get("emotion_score", model.emotion_score or 0),
                    "creativity": update.get("creativity_score", model.creativity_score or 0),
                    "cultural": update.get("cultural_score", model.cultural_score or 0)
                }
            
            # Update model
            await repo.update(model_id, update_data)
            results.append({
                "model_id": model_id,
                "status": "success",
                "updated_fields": list(update_data.keys())
            })
            
        except Exception as e:
            errors.append({
                "model_id": model_id,
                "error": str(e)
            })
    
    return {
        "message": f"Batch update completed. Success: {len(results)}, Errors: {len(errors)}",
        "successful_updates": results,
        "errors": errors
    }


@router.get("/models/{model_id}/scores")
async def get_model_scores(
    model_id: str,
    db: AsyncSession = Depends(get_db)
):
    """
    Get current scores for a model
    Public endpoint (no auth required for reading)
    """
    repo = ModelRepository(db)
    model = await repo.get_by_id(model_id)
    
    if not model:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Model {model_id} not found"
        )
    
    return {
        "model_id": model_id,
        "name": model.name,
        "overall_score": model.overall_score,
        "scores": {
            "rhythm": model.rhythm_score,
            "composition": model.composition_score,
            "narrative": model.narrative_score,
            "emotion": model.emotion_score,
            "creativity": model.creativity_score,
            "cultural": model.cultural_score
        },
        "metrics": model.metrics
    }


@router.post("/models/reset-to-seed")
async def reset_to_seed_data(
    db: AsyncSession = Depends(get_db),
    current_admin: User = Depends(get_current_admin_user)
):
    """
    Reset all models to seed data scores
    WARNING: This will overwrite all current scores!
    """
    from app.core.seed_data import SEED_DATA
    
    repo = ModelRepository(db)
    updated_count = 0
    
    for seed_model in SEED_DATA:
        model = await repo.get_by_name(seed_model["name"])
        if model:
            # Update with seed data scores
            update_data = {
                "overall_score": seed_model["overall_score"],
                "rhythm_score": seed_model["rhythm_score"],
                "composition_score": seed_model["composition_score"],
                "narrative_score": seed_model["narrative_score"],
                "emotion_score": seed_model["emotion_score"],
                "creativity_score": seed_model["creativity_score"],
                "cultural_score": seed_model["cultural_score"],
                "metrics": seed_model["metrics"]
            }
            await repo.update(model.id, update_data)
            updated_count += 1
    
    return {
        "message": f"Reset complete. Updated {updated_count} models to seed data scores",
        "updated_count": updated_count
    }