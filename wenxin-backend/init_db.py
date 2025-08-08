#!/usr/bin/env python3
"""Initialize database with sample data"""

import asyncio
import sys
from pathlib import Path

# Add parent directory to path
sys.path.append(str(Path(__file__).parent))

from app.core.database import engine, Base
from app.core.security import get_password_hash
from app.models import User, AIModel, EvaluationDimension
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import sessionmaker

AsyncSessionLocal = sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False
)

async def init_dimensions(session: AsyncSession):
    """Initialize evaluation dimensions"""
    dimensions = [
        {"name": "rhythm", "category": "technical", "weight": 1.0, "description": "韵律和声"},
        {"name": "composition", "category": "aesthetic", "weight": 1.0, "description": "构图美学"},
        {"name": "narrative", "category": "content", "weight": 1.0, "description": "叙事能力"},
        {"name": "emotion", "category": "content", "weight": 1.0, "description": "情感表达"},
        {"name": "creativity", "category": "aesthetic", "weight": 1.0, "description": "创新性"},
        {"name": "cultural", "category": "cultural", "weight": 1.0, "description": "文化内涵"},
    ]
    
    for dim in dimensions:
        dimension = EvaluationDimension(**dim)
        session.add(dimension)
    
    await session.commit()
    print(f"[OK] Created {len(dimensions)} evaluation dimensions")

async def init_models(session: AsyncSession):
    """Initialize sample AI models with comprehensive test data"""
    models = [
        {
            "name": "Qwen2-72B",
            "organization": "Alibaba",
            "version": "2.0",
            "category": "text",
            "description": "通义千问第二代大模型，在中文文学创作领域表现卓越",
            "overall_score": 92.5,
            "metrics": {
                "rhythm": 95,
                "composition": 88,
                "narrative": 94,
                "emotion": 91,
                "creativity": 89,
                "cultural": 96
            },
            "tags": ["中文优秀", "文学创作", "诗词专精"],
            "avatar_url": "https://picsum.photos/seed/qwen/200/200"
        },
        {
            "name": "Claude 3 Opus",
            "organization": "Anthropic",
            "version": "3.0",
            "category": "multimodal",
            "description": "在创意写作和艺术理解方面展现出卓越能力",
            "overall_score": 90.8,
            "metrics": {
                "rhythm": 87,
                "composition": 92,
                "narrative": 95,
                "emotion": 93,
                "creativity": 94,
                "cultural": 85
            },
            "tags": ["创意写作", "多模态", "叙事大师"],
            "avatar_url": "https://picsum.photos/seed/claude/200/200"
        },
        {
            "name": "GPT-4 Vision",
            "organization": "OpenAI",
            "version": "4.0",
            "category": "multimodal",
            "description": "多模态理解与生成能力的标杆模型",
            "overall_score": 89.2,
            "metrics": {
                "rhythm": 84,
                "composition": 91,
                "narrative": 92,
                "emotion": 88,
                "creativity": 91,
                "cultural": 83
            },
            "tags": ["多模态", "视觉理解", "创意生成"],
            "avatar_url": "https://picsum.photos/seed/gpt4/200/200"
        },
        {
            "name": "文心一言 4.0",
            "organization": "Baidu",
            "version": "4.0",
            "category": "text",
            "description": "百度自研大模型，深谙中国文化精髓",
            "overall_score": 88.7,
            "metrics": {
                "rhythm": 92,
                "composition": 85,
                "narrative": 88,
                "emotion": 89,
                "creativity": 86,
                "cultural": 94
            },
            "tags": ["中文专长", "文化理解", "古诗词"],
            "avatar_url": "https://picsum.photos/seed/wenxin/200/200"
        },
        {
            "name": "Gemini Pro Vision",
            "organization": "Google",
            "version": "1.5",
            "category": "multimodal",
            "description": "谷歌最新多模态模型，视觉理解能力突出",
            "overall_score": 87.3,
            "metrics": {
                "rhythm": 82,
                "composition": 89,
                "narrative": 87,
                "emotion": 86,
                "creativity": 90,
                "cultural": 81
            },
            "tags": ["多模态", "视觉分析", "创意设计"],
            "avatar_url": "https://picsum.photos/seed/gemini/200/200"
        },
        {
            "name": "ChatGLM3-6B",
            "organization": "Zhipu AI",
            "version": "3.0",
            "category": "text",
            "description": "清华智谱开源模型，轻量高效",
            "overall_score": 85.2,
            "metrics": {
                "rhythm": 86,
                "composition": 82,
                "narrative": 85,
                "emotion": 84,
                "creativity": 83,
                "cultural": 89
            },
            "tags": ["开源", "轻量级", "中文优化"],
            "avatar_url": "https://picsum.photos/seed/chatglm/200/200"
        },
        {
            "name": "Midjourney V6",
            "organization": "Midjourney",
            "version": "6.0",
            "category": "image",
            "description": "专注艺术创作的图像生成模型",
            "overall_score": 91.5,
            "metrics": {
                "rhythm": 78,
                "composition": 96,
                "narrative": 85,
                "emotion": 92,
                "creativity": 97,
                "cultural": 88
            },
            "tags": ["图像生成", "艺术创作", "风格化"],
            "avatar_url": "https://picsum.photos/seed/midjourney/200/200"
        },
        {
            "name": "DALL-E 3",
            "organization": "OpenAI",
            "version": "3.0",
            "category": "image",
            "description": "文本到图像生成的先驱模型",
            "overall_score": 88.9,
            "metrics": {
                "rhythm": 75,
                "composition": 93,
                "narrative": 82,
                "emotion": 88,
                "creativity": 94,
                "cultural": 84
            },
            "tags": ["图像生成", "创意设计", "精准控制"],
            "avatar_url": "https://picsum.photos/seed/dalle/200/200"
        },
        {
            "name": "LLaMA 2-70B",
            "organization": "Meta",
            "version": "2.0",
            "category": "text",
            "description": "Meta开源的大语言模型",
            "overall_score": 86.4,
            "metrics": {
                "rhythm": 83,
                "composition": 85,
                "narrative": 89,
                "emotion": 85,
                "creativity": 87,
                "cultural": 82
            },
            "tags": ["开源", "多语言", "通用"],
            "avatar_url": "https://picsum.photos/seed/llama/200/200"
        },
        {
            "name": "Stable Diffusion XL",
            "organization": "Stability AI",
            "version": "1.0",
            "category": "image",
            "description": "开源图像生成模型的代表作",
            "overall_score": 87.1,
            "metrics": {
                "rhythm": 72,
                "composition": 91,
                "narrative": 80,
                "emotion": 86,
                "creativity": 92,
                "cultural": 83
            },
            "tags": ["开源", "图像生成", "社区驱动"],
            "avatar_url": "https://picsum.photos/seed/sdxl/200/200"
        }
    ]
    
    for model_data in models:
        model = AIModel(**model_data)
        session.add(model)
    
    await session.commit()
    print(f"[OK] Created {len(models)} AI models")

async def init_admin_user(session: AsyncSession):
    """Create admin user"""
    admin = User(
        username="admin",
        email="admin@wenxinmoyun.ai",
        full_name="System Administrator",
        hashed_password=get_password_hash("admin123"),
        is_active=True,
        is_superuser=True
    )
    session.add(admin)
    await session.commit()
    print("[OK] Created admin user (username: admin, password: admin123)")

async def main():
    """Main initialization function"""
    print("[INFO] Initializing database...")
    
    # Create tables
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)
    print("[OK] Database tables created")
    
    # Insert sample data
    async with AsyncSessionLocal() as session:
        await init_dimensions(session)
        await init_models(session)
        await init_admin_user(session)
    
    print("[DONE] Database initialization complete!")

if __name__ == "__main__":
    asyncio.run(main())