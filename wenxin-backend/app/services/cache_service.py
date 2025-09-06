"""Redis cache service for VULCA and Rankings data"""

import json
import redis
from typing import Optional, Any, Dict
from datetime import timedelta
import logging
from app.core.config import settings

logger = logging.getLogger(__name__)

class CacheService:
    """统一的缓存服务管理"""
    
    def __init__(self):
        """初始化Redis连接"""
        try:
            # 尝试连接Redis，如果失败则使用内存缓存
            self.redis_client = redis.Redis(
                host=getattr(settings, 'REDIS_HOST', 'localhost'),
                port=getattr(settings, 'REDIS_PORT', 6379),
                db=getattr(settings, 'REDIS_DB', 0),
                decode_responses=True,
                socket_connect_timeout=2,
                socket_timeout=2
            )
            # 测试连接
            self.redis_client.ping()
            self.use_redis = True
            logger.info("Redis cache connected successfully")
        except (redis.ConnectionError, redis.TimeoutError, AttributeError) as e:
            logger.warning(f"Redis not available, using memory cache: {e}")
            self.use_redis = False
            self.memory_cache: Dict[str, Any] = {}
    
    def get(self, key: str) -> Optional[Any]:
        """获取缓存值"""
        try:
            if self.use_redis:
                value = self.redis_client.get(key)
                if value:
                    return json.loads(value)
            else:
                return self.memory_cache.get(key)
        except Exception as e:
            logger.error(f"Cache get error for key {key}: {e}")
        return None
    
    def set(self, key: str, value: Any, ttl_seconds: int = 300) -> bool:
        """设置缓存值"""
        try:
            if self.use_redis:
                return self.redis_client.setex(
                    key, 
                    timedelta(seconds=ttl_seconds),
                    json.dumps(value, default=str)
                )
            else:
                self.memory_cache[key] = value
                return True
        except Exception as e:
            logger.error(f"Cache set error for key {key}: {e}")
            return False
    
    def delete(self, key: str) -> bool:
        """删除缓存"""
        try:
            if self.use_redis:
                return bool(self.redis_client.delete(key))
            else:
                self.memory_cache.pop(key, None)
                return True
        except Exception as e:
            logger.error(f"Cache delete error for key {key}: {e}")
            return False
    
    def delete_pattern(self, pattern: str) -> int:
        """删除匹配模式的所有键"""
        try:
            if self.use_redis:
                keys = self.redis_client.keys(pattern)
                if keys:
                    return self.redis_client.delete(*keys)
            else:
                # 内存缓存的简单模式匹配
                import fnmatch
                keys_to_delete = [k for k in self.memory_cache.keys() 
                                if fnmatch.fnmatch(k, pattern)]
                for key in keys_to_delete:
                    del self.memory_cache[key]
                return len(keys_to_delete)
        except Exception as e:
            logger.error(f"Cache delete pattern error for {pattern}: {e}")
        return 0

# 全局缓存实例
cache_service = CacheService()

# 缓存键前缀
class CacheKeys:
    """缓存键定义"""
    # Rankings缓存（5分钟）
    RANKINGS_LIST = "rankings:list"
    RANKINGS_MODEL = "rankings:model:{model_id}"
    
    # VULCA缓存（1小时）
    VULCA_EVALUATION = "vulca:eval:{model_id}"
    VULCA_COMPARISON = "vulca:compare:{model1_id}:{model2_id}"
    VULCA_DIMENSIONS = "vulca:dimensions"
    VULCA_PERSPECTIVES = "vulca:perspectives"
    
    # 模型列表缓存（10分钟）
    MODELS_ALL = "models:all"
    MODELS_WITH_VULCA = "models:with_vulca"

# 缓存TTL配置（秒）
class CacheTTL:
    """缓存过期时间配置"""
    RANKINGS = 300  # 5分钟
    VULCA = 3600  # 1小时
    MODELS = 600  # 10分钟
    STATIC = 86400  # 1天（静态数据）