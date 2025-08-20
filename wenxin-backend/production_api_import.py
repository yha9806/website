"""
Production API Import Script
使用API方式直接连接生产数据库进行数据导入
"""
import asyncio
import json
import os
import sys
import io
from datetime import datetime
from typing import Dict, Any
import uuid

# 设置UTF-8编码
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

# 设置环境变量
os.environ['ENVIRONMENT'] = 'production'
os.environ['DATABASE_URL'] = 'postgresql+asyncpg://postgres:Qnqwdn7800@35.221.183.182:5432/wenxin'

from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import delete, select, func, text
from app.models.ai_model import AIModel
from app.core.database import Base

class ProductionImporter:
    def __init__(self):
        # 使用公网IP直接连接
        self.database_url = 'postgresql+asyncpg://postgres:Qnqwdn7800@35.221.183.182:5432/wenxin'
        self.engine = None
        self.async_session = None
        
    async def connect(self):
        """建立数据库连接"""
        try:
            print("正在连接到生产数据库...")
            self.engine = create_async_engine(
                self.database_url,
                echo=False,
                pool_pre_ping=True,
                pool_size=5,
                max_overflow=10
            )
            
            self.async_session = sessionmaker(
                self.engine, 
                class_=AsyncSession, 
                expire_on_commit=False
            )
            
            # 测试连接
            async with self.async_session() as session:
                result = await session.execute(text("SELECT version()"))
                version = result.scalar()
                print(f"✅ 成功连接到PostgreSQL: {version}")
                
                # 检查当前用户
                result = await session.execute(text("SELECT current_user"))
                user = result.scalar()
                print(f"✅ 当前用户: {user}")
                
                # 检查权限
                result = await session.execute(text("""
                    SELECT has_table_privilege(current_user, 'ai_models', 'DELETE'),
                           has_table_privilege(current_user, 'ai_models', 'INSERT'),
                           has_table_privilege(current_user, 'ai_models', 'UPDATE')
                """))
                privs = result.first()
                print(f"✅ 权限状态 - DELETE: {privs[0]}, INSERT: {privs[1]}, UPDATE: {privs[2]}")
                
            return True
        except Exception as e:
            print(f"❌ 连接失败: {e}")
            return False
    
    async def clean_database(self, session: AsyncSession):
        """清理数据库中的旧数据"""
        try:
            print("\n📋 清理旧数据...")
            
            # 统计现有数据
            result = await session.execute(
                select(func.count(AIModel.id))
                .where(AIModel.data_source == 'benchmark')
            )
            old_count = result.scalar()
            print(f"  发现 {old_count} 条benchmark数据")
            
            if old_count > 0:
                # 删除benchmark数据
                await session.execute(
                    delete(AIModel).where(AIModel.data_source == 'benchmark')
                )
                await session.commit()
                print(f"  ✅ 已删除 {old_count} 条benchmark数据")
            
            # 统计所有数据
            result = await session.execute(select(func.count(AIModel.id)))
            total_count = result.scalar()
            print(f"  剩余 {total_count} 条数据")
            
            return True
        except Exception as e:
            print(f"❌ 清理失败: {e}")
            await session.rollback()
            return False
    
    async def import_models(self, session: AsyncSession):
        """导入新的模型数据"""
        try:
            print("\n📥 导入新数据...")
            
            # 读取comprehensive_v2.json
            with open('benchmark_results/reports/comprehensive_v2.json', 'r', encoding='utf-8') as f:
                data = json.load(f)
            
            models = data.get('models', [])
            print(f"  准备导入 {len(models)} 个模型")
            
            imported = 0
            for model_data in models:
                # 跳过没有分数的模型
                if not model_data.get('overall_score') or model_data['overall_score'] <= 0:
                    continue
                
                # 创建模型实例
                model = AIModel(
                    id=str(uuid.uuid4()),
                    name=model_data['name'],
                    organization=model_data['organization'],
                    version='1.0',
                    category='text',
                    description=f"{model_data['organization']} {model_data['name']} - Advanced AI Model",
                    
                    # 分数
                    overall_score=model_data['overall_score'],
                    rhythm_score=model_data.get('rhythm_score', 0),
                    composition_score=model_data.get('composition_score', 0),
                    narrative_score=model_data.get('narrative_score', 0),
                    emotion_score=model_data.get('emotion_score', 0),
                    creativity_score=model_data.get('creativity_score', 0),
                    cultural_score=model_data.get('cultural_score', 0),
                    
                    # 元数据
                    metrics=model_data.get('dimensions', {}),
                    data_source='benchmark',
                    benchmark_score=model_data['overall_score'],
                    benchmark_metadata={
                        'rank': model_data.get('rank', 0),
                        'tests_completed': model_data.get('tests_completed', 0),
                        'test_coverage': model_data.get('test_coverage', [])
                    },
                    scoring_details={
                        'total_score': model_data['overall_score'],
                        'dimensions': model_data.get('dimensions', {})
                    },
                    
                    # 高亮和弱点
                    score_highlights=model_data.get('highlights', []),
                    score_weaknesses=model_data.get('weaknesses', []),
                    
                    # 状态
                    is_active=True,
                    is_verified=True,
                    verification_count=model_data.get('tests_completed', 1),
                    confidence_level=model_data.get('confidence', 0.95),
                    
                    # 时间和标签
                    release_date='2024-01',
                    tags=['benchmark', 'tested', model_data['organization'].lower()],
                    last_benchmark_at=datetime.utcnow(),
                    created_at=datetime.utcnow()
                )
                
                session.add(model)
                imported += 1
                
                if imported % 5 == 0:
                    await session.commit()
                    print(f"  已导入 {imported} 个模型...")
            
            # 最终提交
            await session.commit()
            print(f"✅ 成功导入 {imported} 个模型")
            
            return True
        except Exception as e:
            print(f"❌ 导入失败: {e}")
            await session.rollback()
            return False
    
    async def verify_import(self, session: AsyncSession):
        """验证导入结果"""
        try:
            print("\n✅ 验证导入结果...")
            
            # 统计总数
            result = await session.execute(
                select(func.count(AIModel.id))
                .where(AIModel.data_source == 'benchmark')
            )
            total = result.scalar()
            print(f"  总计: {total} 个benchmark模型")
            
            # 获取前5名
            result = await session.execute(
                select(AIModel)
                .where(AIModel.data_source == 'benchmark')
                .order_by(AIModel.overall_score.desc())
                .limit(5)
            )
            top_models = result.scalars().all()
            
            print("\n  🏆 Top 5 模型:")
            for i, model in enumerate(top_models, 1):
                print(f"    {i}. {model.name} ({model.organization}): {model.overall_score:.1f}分")
                if model.score_highlights:
                    print(f"       高亮: {model.score_highlights[:2]}")
            
            return True
        except Exception as e:
            print(f"❌ 验证失败: {e}")
            return False
    
    async def run(self):
        """执行完整的导入流程"""
        print("="*60)
        print("🚀 开始生产环境数据导入")
        print("="*60)
        
        # 连接数据库
        if not await self.connect():
            return False
        
        try:
            async with self.async_session() as session:
                # 1. 清理旧数据
                if not await self.clean_database(session):
                    print("⚠️ 清理失败，继续导入...")
                
                # 2. 导入新数据
                if not await self.import_models(session):
                    return False
                
                # 3. 验证结果
                await self.verify_import(session)
                
            print("\n✅ 导入完成！")
            return True
            
        except Exception as e:
            print(f"\n❌ 导入过程出错: {e}")
            return False
        finally:
            if self.engine:
                await self.engine.dispose()

async def main():
    importer = ProductionImporter()
    success = await importer.run()
    
    if success:
        print("\n🎉 数据已成功导入生产环境!")
        print("📱 请访问前端查看效果:")
        print("   https://storage.googleapis.com/wenxin-moyun-prod-new-static/index.html#/")
    else:
        print("\n❌ 导入失败，请检查错误信息")
        sys.exit(1)

if __name__ == "__main__":
    # 确保在正确的目录
    os.chdir('I:\\website\\wenxin-backend')
    
    # 添加当前目录到Python路径
    sys.path.insert(0, os.getcwd())
    
    asyncio.run(main())