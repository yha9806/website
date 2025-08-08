from typing import Any, Optional
from datetime import datetime, timedelta
import json


class InMemoryCache:
    """Simple in-memory cache implementation to replace Redis during development"""
    
    def __init__(self):
        self._cache = {}
        self._expiry = {}
    
    def _is_expired(self, key: str) -> bool:
        """Check if a key has expired"""
        if key not in self._expiry:
            return False
        return datetime.now() > self._expiry[key]
    
    def _clean_expired(self):
        """Remove expired keys"""
        expired_keys = [k for k in self._cache if self._is_expired(k)]
        for key in expired_keys:
            del self._cache[key]
            del self._expiry[key]
    
    async def get(self, key: str) -> Optional[Any]:
        """Get value from cache"""
        self._clean_expired()
        if key in self._cache and not self._is_expired(key):
            value = self._cache[key]
            try:
                return json.loads(value)
            except (json.JSONDecodeError, TypeError):
                return value
        return None
    
    async def set(self, key: str, value: Any, expire: int = 3600) -> bool:
        """Set value in cache with optional expiration (in seconds)"""
        try:
            if not isinstance(value, str):
                value = json.dumps(value)
            self._cache[key] = value
            if expire > 0:
                self._expiry[key] = datetime.now() + timedelta(seconds=expire)
            return True
        except Exception:
            return False
    
    async def delete(self, key: str) -> bool:
        """Delete key from cache"""
        if key in self._cache:
            del self._cache[key]
            if key in self._expiry:
                del self._expiry[key]
            return True
        return False
    
    async def exists(self, key: str) -> bool:
        """Check if key exists in cache"""
        self._clean_expired()
        return key in self._cache and not self._is_expired(key)
    
    async def clear(self) -> bool:
        """Clear all cache"""
        self._cache.clear()
        self._expiry.clear()
        return True
    
    async def keys(self, pattern: str = "*") -> list:
        """Get all keys matching pattern (simplified - only supports * for all)"""
        self._clean_expired()
        if pattern == "*":
            return list(self._cache.keys())
        # Simple pattern matching for prefix
        if pattern.endswith("*"):
            prefix = pattern[:-1]
            return [k for k in self._cache.keys() if k.startswith(prefix)]
        return []


# Global cache instance
cache = InMemoryCache()


def get_cache() -> InMemoryCache:
    """Get cache instance"""
    return cache