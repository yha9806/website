from typing import List, Union
from pydantic_settings import BaseSettings
from pydantic import field_validator
import secrets
import json


class Settings(BaseSettings):
    # Application
    APP_NAME: str = "WenxinMoyun"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = True
    API_V1_STR: str = "/api/v1"
    
    # Security
    SECRET_KEY: str = secrets.token_urlsafe(32)
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    
    # Database Configuration
    # Support both SQLite (development) and PostgreSQL (production)
    DATABASE_URL: str = "sqlite+aiosqlite:///./wenxin.db"
    
    # PostgreSQL settings for production (Cloud SQL)
    POSTGRES_USER: str = "wenxin"
    POSTGRES_PASSWORD: str = ""  # Will be loaded from Secret Manager
    POSTGRES_DB: str = "wenxin_db"
    POSTGRES_HOST: str = "localhost"
    POSTGRES_PORT: int = 5432
    
    # Cloud SQL specific settings
    CLOUD_SQL_INSTANCE: str = ""  # Format: project:region:instance
    USE_CLOUD_SQL: bool = False
    
    # Redis - Optional for production caching
    REDIS_URL: str = "redis://localhost:6379/0"
    USE_REDIS: bool = False
    
    # Google Cloud Configuration
    GOOGLE_CLOUD_PROJECT: str = ""
    GOOGLE_APPLICATION_CREDENTIALS: str = ""
    
    # Production Environment Settings
    ENVIRONMENT: str = "development"  # development, staging, production
    
    # CORS Configuration - supports development ports and production URLs
    CORS_ORIGINS: List[str] = [
        # Development localhost ports (5173-5181 for Vite hot reload)
        *[f"http://localhost:{port}" for port in range(5173, 5182)],
        *[f"http://127.0.0.1:{port}" for port in range(5173, 5182)],
        "http://localhost:3000",
        # Production URL
        "https://storage.googleapis.com"
    ]
    
    # Rate Limiting
    GUEST_DAILY_LIMIT: int = 5
    AUTHENTICATED_DAILY_LIMIT: int = 50
    RATE_LIMIT_PER_MINUTE: int = 60
    
    # File Upload Settings
    MAX_FILE_SIZE: int = 10 * 1024 * 1024  # 10MB
    UPLOAD_BUCKET: str = ""
    ALLOWED_FILE_TYPES: List[str] = [
        "image/jpeg", "image/png", "image/webp", "text/plain"
    ]
    
    # Monitoring and Logging
    LOG_LEVEL: str = "INFO"
    ENABLE_METRICS: bool = False
    SENTRY_DSN: str = ""
    
    # Feature Flags
    ENABLE_REAL_AI_EVALUATION: bool = True
    ENABLE_BATTLE_MODE: bool = True
    ENABLE_GUEST_MODE: bool = True
    ENABLE_BENCHMARKS: bool = True
    
    # Vector Database - Disabled for now
    # QDRANT_HOST: str = "localhost"
    # QDRANT_PORT: int = 6333
    USE_QDRANT: bool = False
    
    # AI Models API Keys
    OPENAI_API_KEY: str = ""
    ANTHROPIC_API_KEY: str = ""
    ZHIPU_API_KEY: str = ""
    GEMINI_API_KEY: str = ""
    HUGGINGFACE_API_KEY: str = ""
    DEEPSEEK_API_KEY: str = ""
    QWEN_API_KEY: str = ""
    XAI_API_KEY: str = ""
    OPENROUTER_API_KEY: str = ""
    
    # Cost Control
    ENABLE_COST_CONTROL: bool = True
    DAILY_COST_LIMIT: float = 10.0
    
    # File Storage
    UPLOAD_DIR: str = "./uploads"
    MAX_UPLOAD_SIZE: int = 10485760  # 10MB
    
    # CORS
    BACKEND_CORS_ORIGINS: List[str] = []
    
    @field_validator("BACKEND_CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str):
            if v.startswith("["):
                # Parse JSON array
                origins = json.loads(v)
                # Ensure all are strings without trailing slashes
                return [str(origin).rstrip('/') for origin in origins]
            else:
                # Parse comma-separated string
                return [i.strip().rstrip('/') for i in v.split(",")]
        elif isinstance(v, list):
            return [str(origin).rstrip('/') for origin in v]
        raise ValueError(v)
    
    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()