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
    
    # Database - Using SQLite for simplified deployment
    DATABASE_URL: str = "sqlite+aiosqlite:///./wenxin.db"
    # Keep PostgreSQL settings for future use, but commented
    # POSTGRES_USER: str = "postgres"
    # POSTGRES_PASSWORD: str = "password"
    # POSTGRES_DB: str = "wenxin_db"
    # POSTGRES_HOST: str = "localhost"
    # POSTGRES_PORT: int = 5432
    
    # Redis - Disabled, using in-memory cache instead
    # REDIS_URL: str = "redis://localhost:6379/0"
    USE_REDIS: bool = False
    
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