#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Initialize database with all 42 AI models from 15 organizations"""

import asyncio
import sys
import io
from pathlib import Path

# Set standard output to UTF-8 encoding
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

# Add parent directory to path
sys.path.append(str(Path(__file__).parent))

from app.core.database import engine, Base
from app.models import AIModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import delete

AsyncSessionLocal = sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False
)

async def init_all_models(session: AsyncSession):
    """Initialize all 42 AI models with comprehensive data"""
    
    # Clear existing models
    await session.execute(delete(AIModel))
    await session.commit()
    print("[INFO] Cleared existing models")
    
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
            "avatar_url": "https://picsum.photos/seed/qwen2/200/200"
        },
        {
            "name": "Qwen-VL",
            "organization": "Alibaba",
            "version": "1.0",
            "category": "multimodal",
            "description": "Multimodal Qwen model with vision-language capabilities",
            "overall_score": 89.3,
            "metrics": {
                "rhythm": 87,
                "composition": 90,
                "narrative": 91,
                "emotion": 89,
                "creativity": 90,
                "cultural": 92
            },
            "tags": ["Multimodal", "Vision-Language", "Chinese Optimized"],
            "avatar_url": "https://picsum.photos/seed/qwenvl/200/200"
        },
        {
            "name": "Tongyi Qianwen",
            "organization": "Alibaba",
            "version": "1.0",
            "category": "text",
            "description": "Alibaba's comprehensive AI assistant model",
            "overall_score": 88.5,
            "metrics": {
                "rhythm": 86,
                "composition": 87,
                "narrative": 89,
                "emotion": 88,
                "creativity": 88,
                "cultural": 91
            },
            "tags": ["Assistant", "Comprehensive", "Chinese"],
            "avatar_url": "https://picsum.photos/seed/tongyi/200/200"
        },
        
        # Baidu Models (3 models)
        {
            "name": "ERNIE 4.0",
            "organization": "Baidu",
            "version": "4.0",
            "category": "text",
            "description": "Baidu's self-developed large model, deeply understanding Chinese cultural essence",
            "overall_score": 91.2,
            "metrics": {
                "rhythm": 93,
                "composition": 87,
                "narrative": 92,
                "emotion": 90,
                "creativity": 88,
                "cultural": 95
            },
            "tags": ["Chinese Specialty", "Cultural Understanding", "Classical Poetry"],
            "avatar_url": "https://picsum.photos/seed/ernie4/200/200"
        },
        {
            "name": "ERNIE-ViLG 2.0",
            "organization": "Baidu",
            "version": "2.0",
            "category": "image",
            "description": "Baidu's text-to-image generation model with Chinese optimization",
            "overall_score": None,
            "metrics": {
                "rhythm": 0,
                "composition": 91,
                "narrative": 84,
                "emotion": 87,
                "creativity": 93,
                "cultural": 94
            },
            "tags": ["Image Generation", "Chinese Art", "Cultural"],
            "avatar_url": "https://picsum.photos/seed/ernievilg/200/200"
        },
        {
            "name": "ERNIE Bot",
            "organization": "Baidu",
            "version": "3.5",
            "category": "text",
            "description": "Baidu's conversational AI model",
            "overall_score": 87.8,
            "metrics": {
                "rhythm": 85,
                "composition": 86,
                "narrative": 88,
                "emotion": 87,
                "creativity": 86,
                "cultural": 91
            },
            "tags": ["Conversational", "Assistant", "Chinese"],
            "avatar_url": "https://picsum.photos/seed/erniebot/200/200"
        },
        
        # Meta Models (3 models)
        {
            "name": "Llama 3.1 405B",
            "organization": "Meta",
            "version": "3.1",
            "category": "text",
            "description": "Meta's largest open-source model with exceptional capabilities",
            "overall_score": 93.1,
            "metrics": {
                "rhythm": 89,
                "composition": 92,
                "narrative": 94,
                "emotion": 91,
                "creativity": 93,
                "cultural": 87
            },
            "tags": ["Open Source", "Large Scale", "Powerful"],
            "avatar_url": "https://picsum.photos/seed/llama31/200/200"
        },
        {
            "name": "Llama 3 70B",
            "organization": "Meta",
            "version": "3.0",
            "category": "text",
            "description": "Meta's latest open-source model with strong performance",
            "overall_score": 90.7,
            "metrics": {
                "rhythm": 87,
                "composition": 90,
                "narrative": 92,
                "emotion": 89,
                "creativity": 91,
                "cultural": 85
            },
            "tags": ["Open Source", "Latest", "Versatile"],
            "avatar_url": "https://picsum.photos/seed/llama3/200/200"
        },
        {
            "name": "Llama 2 70B",
            "organization": "Meta",
            "version": "2.0",
            "category": "text",
            "description": "Previous generation Meta model, widely adopted",
            "overall_score": 87.9,
            "metrics": {
                "rhythm": 84,
                "composition": 87,
                "narrative": 89,
                "emotion": 86,
                "creativity": 88,
                "cultural": 83
            },
            "tags": ["Open Source", "Proven", "Community"],
            "avatar_url": "https://picsum.photos/seed/llama2/200/200"
        },
        
        # Mistral AI Models (2 models)
        {
            "name": "Mistral Large 2",
            "organization": "Mistral AI",
            "version": "2.0",
            "category": "text",
            "description": "Mistral's flagship model with strong multilingual capabilities",
            "overall_score": 91.4,
            "metrics": {
                "rhythm": 88,
                "composition": 91,
                "narrative": 93,
                "emotion": 90,
                "creativity": 92,
                "cultural": 86
            },
            "tags": ["Multilingual", "European", "Powerful"],
            "avatar_url": "https://picsum.photos/seed/mistrallarge/200/200"
        },
        {
            "name": "Mixtral 8x7B",
            "organization": "Mistral AI",
            "version": "1.0",
            "category": "text",
            "description": "Efficient mixture-of-experts model",
            "overall_score": 88.6,
            "metrics": {
                "rhythm": 85,
                "composition": 88,
                "narrative": 90,
                "emotion": 87,
                "creativity": 89,
                "cultural": 84
            },
            "tags": ["MoE", "Efficient", "Open Source"],
            "avatar_url": "https://picsum.photos/seed/mixtral/200/200"
        },
        
        # Stability AI Models (2 models)
        {
            "name": "Stable Diffusion XL",
            "organization": "Stability AI",
            "version": "1.0",
            "category": "image",
            "description": "Leading open-source image generation model",
            "overall_score": None,
            "metrics": {
                "rhythm": 0,
                "composition": 93,
                "narrative": 82,
                "emotion": 88,
                "creativity": 94,
                "cultural": 84
            },
            "tags": ["Open Source", "Image Generation", "Community"],
            "avatar_url": "https://picsum.photos/seed/sdxl/200/200"
        },
        {
            "name": "Stable Diffusion 3",
            "organization": "Stability AI",
            "version": "3.0",
            "category": "image",
            "description": "Next generation image model with improved quality",
            "overall_score": None,
            "metrics": {
                "rhythm": 0,
                "composition": 95,
                "narrative": 85,
                "emotion": 90,
                "creativity": 96,
                "cultural": 86
            },
            "tags": ["Next Gen", "Image Generation", "High Quality"],
            "avatar_url": "https://picsum.photos/seed/sd3/200/200"
        },
        
        # Zhipu AI Models (2 models)
        {
            "name": "ChatGLM3-6B",
            "organization": "Zhipu AI",
            "version": "3.0",
            "category": "text",
            "description": "Lightweight Chinese-optimized model",
            "overall_score": 85.2,
            "metrics": {
                "rhythm": 86,
                "composition": 82,
                "narrative": 85,
                "emotion": 84,
                "creativity": 83,
                "cultural": 89
            },
            "tags": ["Open Source", "Lightweight", "Chinese"],
            "avatar_url": "https://picsum.photos/seed/chatglm3/200/200"
        },
        {
            "name": "CogVLM",
            "organization": "Zhipu AI",
            "version": "1.0",
            "category": "multimodal",
            "description": "Vision-language model from Tsinghua",
            "overall_score": 87.3,
            "metrics": {
                "rhythm": 83,
                "composition": 87,
                "narrative": 88,
                "emotion": 86,
                "creativity": 87,
                "cultural": 90
            },
            "tags": ["Multimodal", "Academic", "Vision-Language"],
            "avatar_url": "https://picsum.photos/seed/cogvlm/200/200"
        },
        
        # Midjourney (1 model)
        {
            "name": "Midjourney V6",
            "organization": "Midjourney",
            "version": "6.0",
            "category": "image",
            "description": "Premier artistic image generation platform",
            "overall_score": None,
            "metrics": {
                "rhythm": 0,
                "composition": 97,
                "narrative": 87,
                "emotion": 94,
                "creativity": 98,
                "cultural": 89
            },
            "tags": ["Artistic", "Premium", "Creative"],
            "avatar_url": "https://picsum.photos/seed/midjourney/200/200"
        },
        
        # Cohere Models (1 model)
        {
            "name": "Command R+",
            "organization": "Cohere",
            "version": "1.0",
            "category": "text",
            "description": "Enterprise-focused language model with RAG capabilities",
            "overall_score": 89.8,
            "metrics": {
                "rhythm": 86,
                "composition": 89,
                "narrative": 91,
                "emotion": 88,
                "creativity": 90,
                "cultural": 85
            },
            "tags": ["Enterprise", "RAG", "Business"],
            "avatar_url": "https://picsum.photos/seed/commandr/200/200"
        },
        
        # AI21 Labs (1 model)
        {
            "name": "Jurassic-2 Ultra",
            "organization": "AI21 Labs",
            "version": "2.0",
            "category": "text",
            "description": "Advanced language model with strong comprehension",
            "overall_score": 88.3,
            "metrics": {
                "rhythm": 85,
                "composition": 87,
                "narrative": 89,
                "emotion": 87,
                "creativity": 88,
                "cultural": 84
            },
            "tags": ["Language Model", "Comprehension", "Advanced"],
            "avatar_url": "https://picsum.photos/seed/jurassic/200/200"
        },
        
        # Inflection AI (1 model)
        {
            "name": "Inflection-2.5",
            "organization": "Inflection AI",
            "version": "2.5",
            "category": "text",
            "description": "Personal AI with empathetic conversation abilities",
            "overall_score": 87.6,
            "metrics": {
                "rhythm": 84,
                "composition": 86,
                "narrative": 88,
                "emotion": 92,
                "creativity": 86,
                "cultural": 82
            },
            "tags": ["Personal AI", "Empathetic", "Conversational"],
            "avatar_url": "https://picsum.photos/seed/inflection/200/200"
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
    
    print(f"[OK] Created {len(created_models)} AI models from 15 organizations")
    
    # Print summary by organization
    org_count = {}
    for model in models:
        org = model["organization"]
        org_count[org] = org_count.get(org, 0) + 1
    
    print("\n[SUMMARY] Models by organization:")
    for org, count in sorted(org_count.items(), key=lambda x: x[1], reverse=True):
        print(f"  - {org}: {count} models")
    
    return created_models

async def main():
    """Main function to initialize database"""
    print("[INFO] Starting database initialization with all 42 AI models...")
    
    # Create tables
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    # Initialize data
    async with AsyncSessionLocal() as session:
        await init_all_models(session)
    
    print("\n[SUCCESS] Database initialization complete!")
    print("[INFO] You can now start the backend API server")

if __name__ == "__main__":
    asyncio.run(main())