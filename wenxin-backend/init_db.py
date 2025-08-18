#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Initialize database with sample data"""

import asyncio
import sys
import io
from pathlib import Path

# Set standard output to UTF-8 encoding
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

# Add parent directory to path
sys.path.append(str(Path(__file__).parent))

from app.core.database import engine, Base
from app.core.security import get_password_hash
from app.models import User, AIModel, EvaluationDimension
from app.models.battle import Battle, BattleVote, BattleStatus, TaskType, Difficulty, VoteChoice
from app.models.artwork import Artwork, ArtworkType
from app.models.evaluation_task import EvaluationTask, TaskStatus
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import sessionmaker
from datetime import datetime, timedelta
import random

AsyncSessionLocal = sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False
)

async def init_dimensions(session: AsyncSession):
    """Initialize evaluation dimensions"""
    dimensions = [
        {"name": "rhythm", "category": "technical", "weight": 1.0, "description": "Rhythm and Harmony"},
        {"name": "composition", "category": "aesthetic", "weight": 1.0, "description": "Composition Aesthetics"},
        {"name": "narrative", "category": "content", "weight": 1.0, "description": "Narrative Ability"},
        {"name": "emotion", "category": "content", "weight": 1.0, "description": "Emotional Expression"},
        {"name": "creativity", "category": "aesthetic", "weight": 1.0, "description": "Innovation"},
        {"name": "cultural", "category": "cultural", "weight": 1.0, "description": "Cultural Connotation"},
    ]
    
    for dim in dimensions:
        dimension = EvaluationDimension(**dim)
        session.add(dimension)
    
    await session.commit()
    print(f"[OK] Created {len(dimensions)} evaluation dimensions")

async def init_models(session: AsyncSession):
    """Initialize sample AI models with comprehensive test data - 42 models from 15 organizations"""
    models = [
        # OpenAI Models (10 models)
        {
            "name": "GPT-4o",
            "organization": "OpenAI",
            "version": "4.0",
            "category": "multimodal",
            "description": "Most advanced multimodal model with exceptional reasoning capabilities",
            "overall_score": 94.2,
            "metrics": {
                "rhythm": 92,
                "composition": 95,
                "narrative": 96,
                "emotion": 93,
                "creativity": 95,
                "cultural": 91
            },
            "tags": ["Multimodal", "Reasoning", "State-of-the-art"],
            "avatar_url": "https://picsum.photos/seed/gpt4o/200/200"
        },
        {
            "name": "GPT-4 Turbo",
            "organization": "OpenAI",
            "version": "4.0-turbo",
            "category": "text",
            "description": "Enhanced version of GPT-4 with improved speed and capabilities",
            "overall_score": 92.8,
            "metrics": {
                "rhythm": 90,
                "composition": 93,
                "narrative": 94,
                "emotion": 92,
                "creativity": 94,
                "cultural": 89
            },
            "tags": ["Text Generation", "Fast", "Versatile"],
            "avatar_url": "https://picsum.photos/seed/gpt4turbo/200/200"
        },
        {
            "name": "GPT-4",
            "organization": "OpenAI",
            "version": "4.0",
            "category": "text",
            "description": "Flagship model with strong reasoning and generation capabilities",
            "overall_score": 91.5,
            "metrics": {
                "rhythm": 88,
                "composition": 92,
                "narrative": 93,
                "emotion": 91,
                "creativity": 93,
                "cultural": 88
            },
            "tags": ["Text Generation", "Reasoning", "Flagship"],
            "avatar_url": "https://picsum.photos/seed/gpt4/200/200"
        },
        {
            "name": "GPT-3.5 Turbo",
            "organization": "OpenAI",
            "version": "3.5-turbo",
            "category": "text",
            "description": "Fast and efficient model for various text generation tasks",
            "overall_score": 85.3,
            "metrics": {
                "rhythm": 82,
                "composition": 85,
                "narrative": 87,
                "emotion": 85,
                "creativity": 86,
                "cultural": 82
            },
            "tags": ["Text Generation", "Efficient", "Popular"],
            "avatar_url": "https://picsum.photos/seed/gpt35/200/200"
        },
        {
            "name": "o1-preview",
            "organization": "OpenAI",
            "version": "1.0",
            "category": "reasoning",
            "description": "Specialized model for complex reasoning and problem-solving",
            "overall_score": 93.7,
            "metrics": {
                "rhythm": 85,
                "composition": 88,
                "narrative": 92,
                "emotion": 87,
                "creativity": 91,
                "cultural": 84
            },
            "tags": ["Reasoning", "Problem Solving", "Advanced"],
            "avatar_url": "https://picsum.photos/seed/o1preview/200/200"
        },
        {
            "name": "o1-mini",
            "organization": "OpenAI",
            "version": "1.0-mini",
            "category": "reasoning",
            "description": "Compact version of o1 with efficient reasoning capabilities",
            "overall_score": 88.4,
            "metrics": {
                "rhythm": 81,
                "composition": 84,
                "narrative": 87,
                "emotion": 83,
                "creativity": 86,
                "cultural": 80
            },
            "tags": ["Reasoning", "Efficient", "Compact"],
            "avatar_url": "https://picsum.photos/seed/o1mini/200/200"
        },
        {
            "name": "DALL-E 3",
            "organization": "OpenAI",
            "version": "3.0",
            "category": "image",
            "description": "Advanced text-to-image generation with precise control",
            "overall_score": None,  # Image models don't have text scores
            "metrics": {
                "rhythm": 0,
                "composition": 95,
                "narrative": 85,
                "emotion": 90,
                "creativity": 96,
                "cultural": 86
            },
            "tags": ["Image Generation", "Creative", "Precise Control"],
            "avatar_url": "https://picsum.photos/seed/dalle3/200/200"
        },
        {
            "name": "DALL-E 2",
            "organization": "OpenAI",
            "version": "2.0",
            "category": "image",
            "description": "Previous generation image model with artistic capabilities",
            "overall_score": None,
            "metrics": {
                "rhythm": 0,
                "composition": 90,
                "narrative": 80,
                "emotion": 85,
                "creativity": 91,
                "cultural": 82
            },
            "tags": ["Image Generation", "Artistic", "Classic"],
            "avatar_url": "https://picsum.photos/seed/dalle2/200/200"
        },
        {
            "name": "Whisper",
            "organization": "OpenAI",
            "version": "1.0",
            "category": "audio",
            "description": "State-of-the-art speech recognition and transcription",
            "overall_score": 89.2,
            "metrics": {
                "rhythm": 95,
                "composition": 78,
                "narrative": 82,
                "emotion": 85,
                "creativity": 75,
                "cultural": 88
            },
            "tags": ["Audio", "Speech Recognition", "Transcription"],
            "avatar_url": "https://picsum.photos/seed/whisper/200/200"
        },
        {
            "name": "Codex",
            "organization": "OpenAI",
            "version": "1.0",
            "category": "code",
            "description": "Specialized model for code generation and understanding",
            "overall_score": 87.6,
            "metrics": {
                "rhythm": 80,
                "composition": 88,
                "narrative": 85,
                "emotion": 75,
                "creativity": 90,
                "cultural": 72
            },
            "tags": ["Code Generation", "Programming", "Technical"],
            "avatar_url": "https://picsum.photos/seed/codex/200/200"
        },
        
        # Anthropic Models (5 models)
        {
            "name": "Claude 3.5 Sonnet",
            "organization": "Anthropic",
            "version": "3.5",
            "category": "text",
            "description": "Most capable Claude model with enhanced reasoning and creativity",
            "overall_score": 93.8,
            "metrics": {
                "rhythm": 91,
                "composition": 94,
                "narrative": 96,
                "emotion": 94,
                "creativity": 95,
                "cultural": 90
            },
            "tags": ["Creative Writing", "Reasoning", "Advanced"],
            "avatar_url": "https://picsum.photos/seed/claude35/200/200"
        },
        {
            "name": "Claude 3 Opus",
            "organization": "Anthropic",
            "version": "3.0",
            "category": "multimodal",
            "description": "Powerful multimodal model with strong creative abilities",
            "overall_score": 92.5,
            "metrics": {
                "rhythm": 89,
                "composition": 93,
                "narrative": 95,
                "emotion": 93,
                "creativity": 94,
                "cultural": 88
            },
            "tags": ["Multimodal", "Creative", "Powerful"],
            "avatar_url": "https://picsum.photos/seed/claudeopus/200/200"
        },
        {
            "name": "Claude 3 Sonnet",
            "organization": "Anthropic",
            "version": "3.0",
            "category": "text",
            "description": "Balanced model with strong performance across tasks",
            "overall_score": 90.3,
            "metrics": {
                "rhythm": 87,
                "composition": 91,
                "narrative": 92,
                "emotion": 91,
                "creativity": 92,
                "cultural": 86
            },
            "tags": ["Balanced", "Versatile", "Reliable"],
            "avatar_url": "https://picsum.photos/seed/claudesonnet/200/200"
        },
        {
            "name": "Claude 3 Haiku",
            "organization": "Anthropic",
            "version": "3.0",
            "category": "text",
            "description": "Fast and efficient model for quick responses",
            "overall_score": 86.7,
            "metrics": {
                "rhythm": 84,
                "composition": 86,
                "narrative": 88,
                "emotion": 87,
                "creativity": 87,
                "cultural": 83
            },
            "tags": ["Fast", "Efficient", "Compact"],
            "avatar_url": "https://picsum.photos/seed/claudehaiku/200/200"
        },
        {
            "name": "Claude 2.1",
            "organization": "Anthropic",
            "version": "2.1",
            "category": "text",
            "description": "Previous generation Claude with solid capabilities",
            "overall_score": 88.1,
            "metrics": {
                "rhythm": 85,
                "composition": 88,
                "narrative": 90,
                "emotion": 88,
                "creativity": 89,
                "cultural": 84
            },
            "tags": ["Classic", "Reliable", "Proven"],
            "avatar_url": "https://picsum.photos/seed/claude2/200/200"
        },
        
        # Google Models (5 models)
        {
            "name": "Gemini 1.5 Pro",
            "organization": "Google",
            "version": "1.5",
            "category": "multimodal",
            "description": "Advanced multimodal model with long context window",
            "overall_score": 91.8,
            "metrics": {
                "rhythm": 88,
                "composition": 92,
                "narrative": 93,
                "emotion": 90,
                "creativity": 93,
                "cultural": 87
            },
            "tags": ["Multimodal", "Long Context", "Advanced"],
            "avatar_url": "https://picsum.photos/seed/gemini15/200/200"
        },
        {
            "name": "Gemini 1.5 Flash",
            "organization": "Google",
            "version": "1.5-flash",
            "category": "multimodal",
            "description": "Fast multimodal model optimized for speed",
            "overall_score": 87.4,
            "metrics": {
                "rhythm": 84,
                "composition": 87,
                "narrative": 88,
                "emotion": 86,
                "creativity": 88,
                "cultural": 83
            },
            "tags": ["Fast", "Multimodal", "Efficient"],
            "avatar_url": "https://picsum.photos/seed/geminiflash/200/200"
        },
        {
            "name": "Gemini Pro",
            "organization": "Google",
            "version": "1.0",
            "category": "text",
            "description": "Versatile model for various text tasks",
            "overall_score": 88.9,
            "metrics": {
                "rhythm": 85,
                "composition": 89,
                "narrative": 90,
                "emotion": 88,
                "creativity": 90,
                "cultural": 85
            },
            "tags": ["Versatile", "Text Generation", "Reliable"],
            "avatar_url": "https://picsum.photos/seed/geminipro/200/200"
        },
        {
            "name": "PaLM 2",
            "organization": "Google",
            "version": "2.0",
            "category": "text",
            "description": "Powerful language model with strong reasoning",
            "overall_score": 89.6,
            "metrics": {
                "rhythm": 86,
                "composition": 90,
                "narrative": 91,
                "emotion": 89,
                "creativity": 91,
                "cultural": 86
            },
            "tags": ["Language Model", "Reasoning", "Powerful"],
            "avatar_url": "https://picsum.photos/seed/palm2/200/200"
        },
        {
            "name": "Imagen 2",
            "organization": "Google",
            "version": "2.0",
            "category": "image",
            "description": "Advanced text-to-image generation model",
            "overall_score": None,
            "metrics": {
                "rhythm": 0,
                "composition": 94,
                "narrative": 83,
                "emotion": 89,
                "creativity": 95,
                "cultural": 85
            },
            "tags": ["Image Generation", "Advanced", "High Quality"],
            "avatar_url": "https://picsum.photos/seed/imagen2/200/200"
        },
        
        # Chinese Models - Alibaba (3 models)
        {
            "name": "Qwen2-72B",
            "organization": "Alibaba",
            "version": "2.0",
            "category": "text",
            "description": "Qwen second-generation large model, excelling in Chinese literary creation",
            "overall_score": 92.5,
            "metrics": {
                "rhythm": 95,
                "composition": 88,
                "narrative": 94,
                "emotion": 91,
                "creativity": 89,
                "cultural": 96
            },
            "tags": ["Chinese Excellence", "Literary Creation", "Poetry Specialist"],
            "avatar_url": "https://picsum.photos/seed/qwen/200/200"
        },
        {
            "name": "Qwen-VL",
            "organization": "Alibaba",
            "version": "1.0",
            "category": "multimodal",
            "description": "Demonstrates exceptional ability in creative writing and artistic understanding",
            "overall_score": 90.8,
            "metrics": {
                "rhythm": 87,
                "composition": 92,
                "narrative": 95,
                "emotion": 93,
                "creativity": 94,
                "cultural": 85
            },
            "tags": ["Creative Writing", "Multimodal", "Narrative Master"],
            "avatar_url": "https://picsum.photos/seed/claude/200/200"
        },
        {
            "name": "GPT-4 Vision",
            "organization": "OpenAI",
            "version": "4.0",
            "category": "multimodal",
            "description": "Benchmark model for multimodal understanding and generation capabilities",
            "overall_score": 89.2,
            "metrics": {
                "rhythm": 84,
                "composition": 91,
                "narrative": 92,
                "emotion": 88,
                "creativity": 91,
                "cultural": 83
            },
            "tags": ["Multimodal", "Visual Understanding", "Creative Generation"],
            "avatar_url": "https://picsum.photos/seed/gpt4/200/200"
        },
        {
            "name": "ERNIE 4.0",
            "organization": "Baidu",
            "version": "4.0",
            "category": "text",
            "description": "Baidu's self-developed large model, deeply understanding Chinese cultural essence",
            "overall_score": 88.7,
            "metrics": {
                "rhythm": 92,
                "composition": 85,
                "narrative": 88,
                "emotion": 89,
                "creativity": 86,
                "cultural": 94
            },
            "tags": ["Chinese Specialty", "Cultural Understanding", "Classical Poetry"],
            "avatar_url": "https://picsum.photos/seed/wenxin/200/200"
        },
        {
            "name": "Gemini Pro Vision",
            "organization": "Google",
            "version": "1.5",
            "category": "multimodal",
            "description": "Google's latest multimodal model with outstanding visual understanding capabilities",
            "overall_score": 87.3,
            "metrics": {
                "rhythm": 82,
                "composition": 89,
                "narrative": 87,
                "emotion": 86,
                "creativity": 90,
                "cultural": 81
            },
            "tags": ["Multimodal", "Visual Analysis", "Creative Design"],
            "avatar_url": "https://picsum.photos/seed/gemini/200/200"
        },
        {
            "name": "ChatGLM3-6B",
            "organization": "Zhipu AI",
            "version": "3.0",
            "category": "text",
            "description": "Tsinghua Zhipu open-source model, lightweight and efficient",
            "overall_score": 85.2,
            "metrics": {
                "rhythm": 86,
                "composition": 82,
                "narrative": 85,
                "emotion": 84,
                "creativity": 83,
                "cultural": 89
            },
            "tags": ["Open Source", "Lightweight", "Chinese Optimized"],
            "avatar_url": "https://picsum.photos/seed/chatglm/200/200"
        },
        {
            "name": "Midjourney V6",
            "organization": "Midjourney",
            "version": "6.0",
            "category": "image",
            "description": "Image generation model focused on artistic creation",
            "overall_score": 91.5,
            "metrics": {
                "rhythm": 78,
                "composition": 96,
                "narrative": 85,
                "emotion": 92,
                "creativity": 97,
                "cultural": 88
            },
            "tags": ["Image Generation", "Artistic Creation", "Stylization"],
            "avatar_url": "https://picsum.photos/seed/midjourney/200/200"
        },
        {
            "name": "DALL-E 3",
            "organization": "OpenAI",
            "version": "3.0",
            "category": "image",
            "description": "Pioneer model for text-to-image generation",
            "overall_score": 88.9,
            "metrics": {
                "rhythm": 75,
                "composition": 93,
                "narrative": 82,
                "emotion": 88,
                "creativity": 94,
                "cultural": 84
            },
            "tags": ["Image Generation", "Creative Design", "Precise Control"],
            "avatar_url": "https://picsum.photos/seed/dalle/200/200"
        },
        {
            "name": "LLaMA 2-70B",
            "organization": "Meta",
            "version": "2.0",
            "category": "text",
            "description": "Meta's open-source large language model",
            "overall_score": 86.4,
            "metrics": {
                "rhythm": 83,
                "composition": 85,
                "narrative": 89,
                "emotion": 85,
                "creativity": 87,
                "cultural": 82
            },
            "tags": ["Open Source", "Multilingual", "General Purpose"],
            "avatar_url": "https://picsum.photos/seed/llama/200/200"
        },
        {
            "name": "Stable Diffusion XL",
            "organization": "Stability AI",
            "version": "1.0",
            "category": "image",
            "description": "Representative work of open-source image generation models",
            "overall_score": 87.1,
            "metrics": {
                "rhythm": 72,
                "composition": 91,
                "narrative": 80,
                "emotion": 86,
                "creativity": 92,
                "cultural": 83
            },
            "tags": ["Open Source", "Image Generation", "Community Driven"],
            "avatar_url": "https://picsum.photos/seed/sdxl/200/200"
        }
    ]
    
    created_models = []
    for model_data in models:
        model = AIModel(**model_data)
        session.add(model)
        created_models.append(model)
    
    await session.commit()
    
    # Refresh all models to get their IDs
    for model in created_models:
        await session.refresh(model)
    
    print(f"[OK] Created {len(created_models)} AI models")
    return created_models  # Return model objects for use in other init functions

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

async def init_battles(session: AsyncSession, models):
    """Initialize sample battles"""
    battles_data = [
        {
            "model_a_id": models[0].id,  # Qwen2-72B
            "model_b_id": models[1].id,  # Claude 3 Opus
            "task_type": TaskType.poem,
            "task_prompt": "Create a seven-character quatrain on the theme of 'Spring River Flower Moon Night'",
            "task_category": "Classical Poetry",
            "difficulty": Difficulty.medium,
            "votes_a": 156,
            "votes_b": 143,
            "status": BattleStatus.active
        },
        {
            "model_a_id": models[2].id,  # GPT-4 Vision
            "model_b_id": models[3].id,  # ERNIE 4.0
            "task_type": TaskType.painting,
            "task_prompt": "Create a landscape painting in the style of 'A Thousand Li of Rivers and Mountains'",
            "task_category": "Landscape Painting",
            "difficulty": Difficulty.hard,
            "votes_a": 87,
            "votes_b": 102,
            "status": BattleStatus.active
        },
        {
            "model_a_id": models[4].id,  # DALL-E 3
            "model_b_id": models[5].id,  # Midjourney V6
            "task_type": TaskType.painting,
            "task_prompt": "Merge Eastern and Western art styles to create a 'Cyberpunk Version of Along the River During Qingming Festival'",
            "task_category": "Creative Painting",
            "difficulty": Difficulty.hard,
            "votes_a": 234,
            "votes_b": 267,
            "status": BattleStatus.active
        },
        {
            "model_a_id": models[1].id,  # Claude 3 Opus
            "model_b_id": models[6].id,  # Gemini Ultra
            "task_type": TaskType.story,
            "task_prompt": "Create a 500-word micro fiction on the theme of 'The Butterfly Effect'",
            "task_category": "Modern Literature",
            "difficulty": Difficulty.medium,
            "votes_a": 178,
            "votes_b": 165,
            "status": BattleStatus.completed,
            "completed_at": datetime.now() - timedelta(days=1)
        }
    ]
    
    for battle_data in battles_data:
        if "completed_at" in battle_data:
            completed_at = battle_data.pop("completed_at")
            battle = Battle(**battle_data, completed_at=completed_at)
        else:
            battle = Battle(**battle_data)
        session.add(battle)
    
    await session.commit()
    print(f"[OK] Created {len(battles_data)} sample battles")

async def init_artworks(session: AsyncSession, models):
    """Initialize sample artworks for each model"""
    artworks_data = [
        # Qwen2-72B works
        {
            "model_id": models[0].id,
            "type": ArtworkType.poem,
            "title": "Spring River Flower Moon Night",
            "content": """The spring river's tide level with the sea,
The bright moon rises with the ocean's swell.
Waves shimmer for thousands of miles away,
Where on the spring river is there no moonlight?
The river winds around fragrant meadows,
Moonlight on flowering trees like falling frost.
Frost seems to fly through the empty air,
White sand on the shore cannot be seen.""",
            "prompt": "Create a poem describing the beautiful scenery of spring river under moonlight",
            "score": 95.5,
            "extra_metadata": {"style": "Tang Poetry", "meter": "Seven-character Ancient Poem"}
        },
        {
            "model_id": models[0].id,
            "type": ArtworkType.poem,
            "title": "Quiet Night Thoughts",
            "content": """Bright moonlight before my bed,
I suspect it is frost on the ground.
Looking up, I gaze at the bright moon,
Lowering my head, I think of my hometown.""",
            "prompt": "Create a five-character quatrain expressing homesickness",
            "score": 93.2,
            "extra_metadata": {"style": "Tang Poetry", "meter": "Five-character Quatrain"}
        },
        # Claude 3 Opus works
        {
            "model_id": models[1].id,
            "type": ArtworkType.story,
            "title": "The Last Leaf",
            "content": "The autumn wind rustled as she lay in the hospital room, gazing at the old tree outside. The doctor said her life was like the leaves on the tree - when the last one fell... But that leaf never fell, even through storms. Only after recovery did she learn it was painted by her artist neighbor on his last night of life.",
            "prompt": "Create a micro fiction about hope",
            "score": 94.8,
            "extra_metadata": {"genre": "Touching Story", "word_count": 100}
        },
        # GPT-4 Vision works
        {
            "model_id": models[2].id,
            "type": ArtworkType.painting,
            "title": "Cyber Chang'an",
            "image_url": "https://picsum.photos/seed/cyberchangan/800/600",
            "prompt": "Combine Tang Dynasty Chang'an City with cyberpunk style",
            "score": 91.3,
            "extra_metadata": {"style": "Cyberpunk", "theme": "Ancient-Modern Fusion"}
        },
        # DALL-E 3 works
        {
            "model_id": models[4].id,
            "type": ArtworkType.painting,
            "title": "Dreamscape",
            "image_url": "https://picsum.photos/seed/dreamscape/800/600",
            "prompt": "Create a surrealist-style Chinese landscape painting",
            "score": 92.7,
            "extra_metadata": {"style": "Surrealism", "medium": "Digital Art"}
        },
        # Midjourney works
        {
            "model_id": models[5].id,
            "type": ArtworkType.painting,
            "title": "Oriental Mythology",
            "image_url": "https://picsum.photos/seed/mythology/800/600",
            "prompt": "Depict the auspicious dragon and phoenix scene from Chinese mythology",
            "score": 94.1,
            "extra_metadata": {"style": "Fantasy Art", "theme": "Chinese Mythology"}
        }
    ]
    
    for artwork_data in artworks_data:
        artwork = Artwork(**artwork_data)
        session.add(artwork)
    
    await session.commit()
    print(f"[OK] Created {len(artworks_data)} sample artworks")

async def init_evaluation_tasks(session: AsyncSession, models):
    """Initialize sample evaluation tasks"""
    tasks_data = [
        {
            "model_id": models[0].id,  # Qwen2-72B
            "task_type": "poem",
            "prompt": "Create a five-character quatrain describing autumn",
            "parameters": {"style": "Tang Poetry"},
            "status": TaskStatus.COMPLETED,
            "result": {
                "title": "Autumn Thoughts",
                "content": "Autumn wind rises, leaves fall,\nGeese fly south in formation.\nSitting alone by the window,\nFrost glimmers on the ground."
            },
            "auto_score": 88.5,
            "human_score": 92.0,
            "final_score": 89.9,
            "evaluation_metrics": {
                "rhythm": 0.9,
                "imagery": 0.85,
                "emotion": 0.88,
                "creativity": 0.86,
                "cultural_relevance": 0.92
            }
        },
        {
            "model_id": models[1].id,  # Claude 3 Opus
            "task_type": "story",
            "prompt": "Write a 300-word short story about time travel",
            "parameters": {"max_length": 300},
            "status": TaskStatus.COMPLETED,
            "result": {
                "title": "The Last Second",
                "content": "When I pressed the button on the time machine, the world suddenly froze. Pedestrians on the street were suspended in mid-air, birds hovered in the clouds...",
                "word_count": 298
            },
            "auto_score": 91.2,
            "final_score": 91.2,
            "evaluation_metrics": {
                "narrative_structure": 0.92,
                "character_development": 0.88,
                "plot_coherence": 0.91,
                "creativity": 0.93,
                "engagement": 0.90
            }
        },
        {
            "model_id": models[2].id,  # GPT-4 Vision
            "task_type": "painting",
            "prompt": "Create a cyberpunk-style future city",
            "parameters": {"style": "cyberpunk"},
            "status": TaskStatus.RUNNING,
            "started_at": datetime.utcnow()
        },
        {
            "model_id": models[3].id,  # ERNIE 4.0
            "task_type": "poem",
            "prompt": "Create a ci poem on the theme of 'Plum Blossoms'",
            "parameters": {"style": "Song Ci"},
            "status": TaskStatus.PENDING
        }
    ]
    
    for task_data in tasks_data:
        # Handle datetime fields
        if task_data["status"] == TaskStatus.COMPLETED:
            task_data["completed_at"] = datetime.utcnow() - timedelta(hours=random.randint(1, 48))
            task_data["started_at"] = task_data["completed_at"] - timedelta(minutes=random.randint(1, 10))
            task_data["created_at"] = task_data["started_at"] - timedelta(minutes=random.randint(1, 30))
        elif "started_at" not in task_data and task_data["status"] == TaskStatus.RUNNING:
            task_data["created_at"] = datetime.utcnow() - timedelta(minutes=random.randint(5, 60))
        else:
            task_data["created_at"] = datetime.utcnow() - timedelta(hours=random.randint(1, 24))
        
        task = EvaluationTask(**task_data)
        session.add(task)
    
    await session.commit()
    print(f"[OK] Created {len(tasks_data)} sample evaluation tasks")

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
        models = await init_models(session)
        await init_admin_user(session)
        await init_battles(session, models)
        await init_artworks(session, models)
        await init_evaluation_tasks(session, models)
    
    print("[DONE] Database initialization complete!")

if __name__ == "__main__":
    asyncio.run(main())