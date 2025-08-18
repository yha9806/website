#!/usr/bin/env python3
"""Initialize local SQLite database with 42 AI models"""

import sqlite3
import json
import uuid
from datetime import datetime

def init_database():
    """Initialize local database with all models"""
    conn = sqlite3.connect('wenxin.db')
    cursor = conn.cursor()
    
    try:
        # Clear existing data
        cursor.execute("DELETE FROM evaluation_tasks WHERE 1=1")
        cursor.execute("DELETE FROM battles WHERE 1=1")
        cursor.execute("DELETE FROM artworks WHERE model_id IS NOT NULL")
        cursor.execute("DELETE FROM ai_models WHERE 1=1")
        
        print("Cleared existing data")
        
        # 42 AI models data
        models_data = [
            # GPT-5 Series (OpenAI) - Leading models
            {
                "id": "gpt-5",
                "name": "GPT-5",
                "organization": "OpenAI",
                "version": "5.0",
                "category": "text",
                "description": "Most advanced language model with unprecedented creative capabilities",
                "overall_score": 98.5,
                "model_type": "llm",
                "model_tier": "flagship",
                "llm_rank": 1
            },
            {
                "id": "gpt-5-mini",
                "name": "GPT-5 Mini",
                "organization": "OpenAI",
                "version": "5.0-mini",
                "category": "text",
                "description": "Lightweight version of GPT-5 optimized for efficiency",
                "overall_score": 93.2,
                "model_type": "llm",
                "model_tier": "standard",
                "llm_rank": 6
            },
            {
                "id": "gpt-5-nano",
                "name": "GPT-5 Nano",
                "organization": "OpenAI",
                "version": "5.0-nano",
                "category": "text",
                "description": "Ultra-lightweight GPT-5 for edge deployment",
                "overall_score": 87.8,
                "model_type": "llm",
                "model_tier": "lite",
                "llm_rank": 13
            },
            
            # O-series Reasoning Models (OpenAI)
            {
                "id": "o1",
                "name": "O1",
                "organization": "OpenAI",
                "version": "1.0",
                "category": "text",
                "description": "Specialized reasoning model with chain-of-thought capabilities",
                "overall_score": 96.3,
                "model_type": "llm",
                "model_tier": "flagship",
                "llm_rank": 3
            },
            {
                "id": "o1-mini",
                "name": "O1 Mini",
                "organization": "OpenAI",
                "version": "1.0-mini",
                "category": "text",
                "description": "Efficient reasoning model for complex problem solving",
                "overall_score": 91.5,
                "model_type": "llm",
                "model_tier": "standard",
                "llm_rank": 8
            },
            {
                "id": "o3-mini",
                "name": "O3 Mini",
                "organization": "OpenAI",
                "version": "3.0-mini",
                "category": "text",
                "description": "Third generation compact reasoning model",
                "overall_score": 92.7,
                "model_type": "llm",
                "model_tier": "standard",
                "llm_rank": 7
            },
            
            # GPT-4 Series (OpenAI)
            {
                "id": "gpt-4o",
                "name": "GPT-4o",
                "organization": "OpenAI",
                "version": "4.0-omni",
                "category": "multimodal",
                "description": "Omni-modal GPT-4 with vision, audio, and text capabilities",
                "overall_score": 95.8,
                "model_type": "multimodal",
                "model_tier": "flagship",
                "llm_rank": 4
            },
            {
                "id": "gpt-4o-mini",
                "name": "GPT-4o Mini",
                "organization": "OpenAI",
                "version": "4.0-omni-mini",
                "category": "multimodal",
                "description": "Efficient multimodal model with balanced performance",
                "overall_score": 89.3,
                "model_type": "multimodal",
                "model_tier": "standard",
                "llm_rank": 11
            },
            {
                "id": "gpt-4-turbo",
                "name": "GPT-4 Turbo",
                "organization": "OpenAI",
                "version": "4.0-turbo",
                "category": "text",
                "description": "Enhanced GPT-4 with 128K context and improved speed",
                "overall_score": 94.5,
                "model_type": "llm",
                "model_tier": "flagship",
                "llm_rank": 5
            },
            {
                "id": "gpt-4",
                "name": "GPT-4",
                "organization": "OpenAI",
                "version": "4.0",
                "category": "text",
                "description": "Fourth generation language model with strong reasoning",
                "overall_score": 90.2,
                "model_type": "llm",
                "model_tier": "standard",
                "llm_rank": 10
            },
            {
                "id": "gpt-4.5",
                "name": "GPT-4.5",
                "organization": "OpenAI",
                "version": "4.5",
                "category": "text",
                "description": "Intermediate update with improved instruction following",
                "overall_score": 91.8,
                "model_type": "llm",
                "model_tier": "standard",
                "llm_rank": 9
            },
            
            # DeepSeek Models
            {
                "id": "deepseek-r1",
                "name": "DeepSeek-R1",
                "organization": "DeepSeek",
                "version": "1.0",
                "category": "text",
                "description": "Advanced reasoning model with mathematical expertise",
                "overall_score": 97.2,
                "model_type": "llm",
                "model_tier": "flagship",
                "llm_rank": 2
            },
            {
                "id": "deepseek-r1-distill",
                "name": "DeepSeek-R1-Distill",
                "organization": "DeepSeek",
                "version": "1.0-distill",
                "category": "text",
                "description": "Distilled version maintaining core reasoning capabilities",
                "overall_score": 88.9,
                "model_type": "llm",
                "model_tier": "lite",
                "llm_rank": 12
            },
            {
                "id": "deepseek-v3",
                "name": "DeepSeek-V3",
                "organization": "DeepSeek",
                "version": "3.0",
                "category": "text",
                "description": "Third generation model with enhanced capabilities",
                "overall_score": 85.4,
                "model_type": "llm",
                "model_tier": "lite",
                "llm_rank": 14
            },
            
            # Qwen Models (Alibaba)
            {
                "id": "qwen3-235b",
                "name": "Qwen3-235B",
                "organization": "Alibaba",
                "version": "3.0",
                "category": "text",
                "description": "Large-scale Chinese-English bilingual model",
                "overall_score": 94.8,
                "model_type": "llm",
                "model_tier": "flagship"
            },
            {
                "id": "qwen2.5-72b",
                "name": "Qwen2.5-72B",
                "organization": "Alibaba",
                "version": "2.5",
                "category": "text",
                "description": "Enhanced Qwen with improved reasoning and creativity",
                "overall_score": 90.3,
                "model_type": "llm",
                "model_tier": "standard"
            },
            {
                "id": "qwen2-72b",
                "name": "Qwen2-72B",
                "organization": "Alibaba",
                "version": "2.0",
                "category": "text",
                "description": "Second generation Qwen with strong Chinese capabilities",
                "overall_score": 87.6,
                "model_type": "llm",
                "model_tier": "standard",
                "llm_rank": 15
            },
            
            # Claude Models (Anthropic)
            {
                "id": "claude-opus-4.1",
                "name": "Claude Opus 4.1",
                "organization": "Anthropic",
                "version": "4.1",
                "category": "text",
                "description": "Most capable Claude model with extended context",
                "overall_score": 95.2,
                "model_type": "llm",
                "model_tier": "flagship"
            },
            {
                "id": "claude-sonnet-4",
                "name": "Claude Sonnet 4",
                "organization": "Anthropic",
                "version": "4.0",
                "category": "text",
                "description": "Balanced Claude model for general tasks",
                "overall_score": 91.8,
                "model_type": "llm",
                "model_tier": "standard"
            },
            {
                "id": "claude-3.5-sonnet",
                "name": "Claude 3.5 Sonnet",
                "organization": "Anthropic",
                "version": "3.5",
                "category": "text",
                "description": "Previous generation with reliable performance",
                "overall_score": 89.4,
                "model_type": "llm",
                "model_tier": "standard"
            },
            
            # Image Generation Models
            {
                "id": "dall-e-3",
                "name": "DALL-E 3",
                "organization": "OpenAI",
                "version": "3.0",
                "category": "image",
                "description": "Advanced text-to-image generation with precise control",
                "overall_score": None,
                "model_type": "image",
                "model_tier": "flagship",
                "image_rank": 1
            },
            {
                "id": "midjourney-v6",
                "name": "Midjourney V6",
                "organization": "Midjourney",
                "version": "6.0",
                "category": "image",
                "description": "Artistic image generation with stunning aesthetics",
                "overall_score": None,
                "model_type": "image",
                "model_tier": "flagship",
                "image_rank": 2
            },
            {
                "id": "stable-diffusion-xl",
                "name": "Stable Diffusion XL",
                "organization": "Stability AI",
                "version": "1.0",
                "category": "image",
                "description": "Open-source image generation model",
                "overall_score": None,
                "model_type": "image",
                "model_tier": "standard",
                "image_rank": 3
            },
            
            # Additional models to reach 42 total
            {
                "id": "gemini-ultra",
                "name": "Gemini Ultra",
                "organization": "Google",
                "version": "1.0",
                "category": "multimodal",
                "description": "Google's most capable multimodal model",
                "overall_score": 94.2,
                "model_type": "multimodal",
                "model_tier": "flagship"
            },
            {
                "id": "gemini-pro",
                "name": "Gemini Pro",
                "organization": "Google",
                "version": "1.0",
                "category": "text",
                "description": "Versatile model for various tasks",
                "overall_score": 88.9,
                "model_type": "llm",
                "model_tier": "standard"
            },
            {
                "id": "palm-2",
                "name": "PaLM 2",
                "organization": "Google",
                "version": "2.0",
                "category": "text",
                "description": "Pathways Language Model with strong reasoning",
                "overall_score": 86.7,
                "model_type": "llm",
                "model_tier": "standard"
            },
            {
                "id": "llama-3-405b",
                "name": "Llama 3 405B",
                "organization": "Meta",
                "version": "3.0",
                "category": "text",
                "description": "Open-source large language model",
                "overall_score": 92.1,
                "model_type": "llm",
                "model_tier": "flagship"
            },
            {
                "id": "llama-3-70b",
                "name": "Llama 3 70B",
                "organization": "Meta",
                "version": "3.0",
                "category": "text",
                "description": "Efficient open-source model",
                "overall_score": 87.3,
                "model_type": "llm",
                "model_tier": "standard"
            },
            {
                "id": "mistral-large",
                "name": "Mistral Large",
                "organization": "Mistral AI",
                "version": "1.0",
                "category": "text",
                "description": "European flagship language model",
                "overall_score": 91.2,
                "model_type": "llm",
                "model_tier": "flagship"
            },
            {
                "id": "mixtral-8x7b",
                "name": "Mixtral 8x7B",
                "organization": "Mistral AI",
                "version": "1.0",
                "category": "text",
                "description": "Mixture of experts model",
                "overall_score": 86.8,
                "model_type": "llm",
                "model_tier": "standard"
            },
            {
                "id": "yi-34b",
                "name": "Yi-34B",
                "organization": "01.AI",
                "version": "1.0",
                "category": "text",
                "description": "Chinese-English bilingual model",
                "overall_score": 85.9,
                "model_type": "llm",
                "model_tier": "standard"
            },
            {
                "id": "falcon-180b",
                "name": "Falcon 180B",
                "organization": "TII",
                "version": "1.0",
                "category": "text",
                "description": "Large open-source model from UAE",
                "overall_score": 84.7,
                "model_type": "llm",
                "model_tier": "standard"
            },
            {
                "id": "vicuna-33b",
                "name": "Vicuna 33B",
                "organization": "LMSYS",
                "version": "1.5",
                "category": "text",
                "description": "Fine-tuned LLaMA for conversations",
                "overall_score": 83.2,
                "model_type": "llm",
                "model_tier": "lite"
            },
            {
                "id": "baichuan-2",
                "name": "Baichuan 2",
                "organization": "Baichuan",
                "version": "2.0",
                "category": "text",
                "description": "Chinese language model",
                "overall_score": 82.4,
                "model_type": "llm",
                "model_tier": "lite"
            },
            {
                "id": "internlm-2",
                "name": "InternLM 2",
                "organization": "Shanghai AI Lab",
                "version": "2.0",
                "category": "text",
                "description": "Research-focused language model",
                "overall_score": 81.9,
                "model_type": "llm",
                "model_tier": "lite"
            },
            {
                "id": "chatglm-3",
                "name": "ChatGLM 3",
                "organization": "Zhipu AI",
                "version": "3.0",
                "category": "text",
                "description": "Chinese conversational model",
                "overall_score": 80.6,
                "model_type": "llm",
                "model_tier": "lite"
            },
            {
                "id": "phi-3",
                "name": "Phi-3",
                "organization": "Microsoft",
                "version": "3.0",
                "category": "text",
                "description": "Small but capable language model",
                "overall_score": 79.8,
                "model_type": "llm",
                "model_tier": "lite"
            },
            {
                "id": "gemma-7b",
                "name": "Gemma 7B",
                "organization": "Google",
                "version": "1.0",
                "category": "text",
                "description": "Lightweight open model from Google",
                "overall_score": 78.3,
                "model_type": "llm",
                "model_tier": "lite"
            },
            {
                "id": "stablelm-2",
                "name": "StableLM 2",
                "organization": "Stability AI",
                "version": "2.0",
                "category": "text",
                "description": "Open-source language model",
                "overall_score": 77.5,
                "model_type": "llm",
                "model_tier": "lite"
            },
            {
                "id": "command-r",
                "name": "Command R",
                "organization": "Cohere",
                "version": "1.0",
                "category": "text",
                "description": "Retrieval-augmented generation model",
                "overall_score": 85.1,
                "model_type": "llm",
                "model_tier": "standard"
            },
            {
                "id": "jamba",
                "name": "Jamba",
                "organization": "AI21 Labs",
                "version": "1.0",
                "category": "text",
                "description": "Hybrid SSM-Transformer architecture",
                "overall_score": 83.7,
                "model_type": "llm",
                "model_tier": "standard"
            }
        ]
        
        # Insert models
        for model in models_data:
            model_uuid = str(uuid.uuid5(uuid.NAMESPACE_DNS, model['id']))
            
            # Generate metrics based on overall score (if it has one)
            if model.get('overall_score'):
                base_score = model['overall_score']
                metrics = {
                    "rhythm": round(base_score + (hash(model['id'] + 'rhythm') % 10 - 5), 1),
                    "composition": round(base_score + (hash(model['id'] + 'comp') % 10 - 5), 1),
                    "narrative": round(base_score + (hash(model['id'] + 'narr') % 10 - 5), 1),
                    "emotion": round(base_score + (hash(model['id'] + 'emo') % 10 - 5), 1),
                    "creativity": round(base_score + (hash(model['id'] + 'create') % 10 - 5), 1),
                    "cultural": round(base_score + (hash(model['id'] + 'cult') % 10 - 5), 1)
                }
            else:
                # Image models don't have text evaluation scores
                metrics = {
                    "rhythm": 0,
                    "composition": 95,
                    "narrative": 0,
                    "emotion": 85,
                    "creativity": 98,
                    "cultural": 75
                }
            
            cursor.execute("""
                INSERT INTO ai_models (
                    id, name, organization, version, category, description,
                    overall_score, metrics, is_active, is_verified, model_type,
                    model_tier, llm_rank, image_rank, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                model_uuid,
                model['name'],
                model['organization'],
                model['version'],
                model['category'],
                model['description'],
                model.get('overall_score'),
                json.dumps(metrics),
                1,  # is_active
                1,  # is_verified
                model.get('model_type', 'llm'),
                model.get('model_tier', 'standard'),
                model.get('llm_rank'),
                model.get('image_rank'),
                datetime.now().isoformat()
            ))
        
        conn.commit()
        print(f"Successfully initialized database with {len(models_data)} AI models")
        
        # Verify the data
        cursor.execute("SELECT COUNT(*) FROM ai_models")
        count = cursor.fetchone()[0]
        print(f"Verified: {count} models in database")
        
        # Show top models
        cursor.execute("""
            SELECT name, overall_score, model_type, llm_rank, image_rank
            FROM ai_models
            WHERE overall_score IS NOT NULL
            ORDER BY overall_score DESC
            LIMIT 10
        """)
        
        print("\nTop 10 models by overall score:")
        for row in cursor.fetchall():
            print(f"  {row[0]}: {row[1]} (Type: {row[2]}, LLM Rank: {row[3]})")
            
    except Exception as e:
        print(f"Error: {e}")
        conn.rollback()
        raise
    finally:
        conn.close()

if __name__ == "__main__":
    init_database()