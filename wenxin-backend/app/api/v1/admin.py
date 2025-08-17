"""
管理API端点 - 用于数据迁移和管理操作
"""

import json
import sqlite3
from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text, select, delete
from app.core.database import get_db
from app.models.ai_model import AIModel

router = APIRouter()

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