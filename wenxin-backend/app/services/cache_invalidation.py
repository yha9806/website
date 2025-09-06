"""Cache invalidation strategies for data consistency"""

from app.services.cache_service import cache_service, CacheKeys
import logging

logger = logging.getLogger(__name__)

class CacheInvalidator:
    """管理缓存失效策略"""
    
    @staticmethod
    async def invalidate_model_cache(model_id: str):
        """当模型数据更新时失效相关缓存"""
        patterns_to_delete = [
            f"{CacheKeys.RANKINGS_MODEL.format(model_id=model_id)}*",
            f"{CacheKeys.VULCA_EVALUATION.format(model_id=model_id)}*",
            f"{CacheKeys.MODELS_ALL}*",  # 列表缓存也需要失效
            f"{CacheKeys.MODELS_WITH_VULCA}*"
        ]
        
        for pattern in patterns_to_delete:
            count = cache_service.delete_pattern(pattern)
            if count > 0:
                logger.info(f"Invalidated {count} cache keys matching pattern: {pattern}")
    
    @staticmethod
    async def invalidate_vulca_cache(model_id: str):
        """当VULCA评估更新时失效相关缓存"""
        patterns_to_delete = [
            f"{CacheKeys.VULCA_EVALUATION.format(model_id=model_id)}*",
            f"vulca:compare:*{model_id}*",  # 所有包含该模型的对比缓存
            f"{CacheKeys.RANKINGS_MODEL.format(model_id=model_id)}*",  # Rankings缓存也需更新
            f"{CacheKeys.MODELS_WITH_VULCA}*"
        ]
        
        for pattern in patterns_to_delete:
            count = cache_service.delete_pattern(pattern)
            if count > 0:
                logger.info(f"Invalidated {count} VULCA cache keys for model {model_id}")
    
    @staticmethod
    async def invalidate_all_rankings():
        """失效所有Rankings相关缓存"""
        patterns = [
            f"{CacheKeys.RANKINGS_LIST}*",
            f"{CacheKeys.MODELS_ALL}*",
            "rankings:*"
        ]
        
        total_count = 0
        for pattern in patterns:
            count = cache_service.delete_pattern(pattern)
            total_count += count
        
        logger.info(f"Invalidated {total_count} total rankings cache keys")
        return total_count
    
    @staticmethod
    async def invalidate_all():
        """失效所有缓存（慎用）"""
        if cache_service.use_redis:
            cache_service.redis_client.flushdb()
            logger.warning("All cache keys have been flushed")
        else:
            cache_service.memory_cache.clear()
            logger.warning("Memory cache cleared")

# 全局实例
cache_invalidator = CacheInvalidator()