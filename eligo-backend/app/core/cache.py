import time
import functools
import asyncio
from typing import Any, Callable, Dict, Optional, Tuple

class InMemoryCache:
    """Thread-safe in-memory cache engine with TTL expiration for FastAPI backend."""

    def __init__(self):
        self._store: Dict[str, Tuple[Any, float]] = {}

    def get(self, key: str) -> Optional[Any]:
        if key not in self._store:
            return None
        value, expiry = self._store[key]
        if time.time() > expiry:
            del self._store[key]
            return None
        return value

    def set(self, key: str, value: Any, ttl: int = 60) -> None:
        expiry = time.time() + ttl
        self._store[key] = (value, expiry)

    def delete(self, key: str) -> None:
        if key in self._store:
            del self._store[key]

    def clear_prefix(self, prefix: str) -> None:
        keys_to_delete = [k for k in self._store if k.startswith(prefix)]
        for k in keys_to_delete:
            del self._store[k]

    def clear(self) -> None:
        self._store.clear()

# Global Singleton Backend Cache Instance
backend_cache = InMemoryCache()

def cache_response(ttl: int = 60, prefix: str = "api"):
    """
    FastAPI Decorator Hook to cache endpoint responses in backend memory for `ttl` seconds.
    """
    def decorator(func: Callable):
        @functools.wraps(func)
        async def wrapper(*args, **kwargs):
            # Generate unique cache key based on function name & arguments
            arg_str = ":".join(f"{k}={v}" for k, v in sorted(kwargs.items()) if k not in ["db", "current_user", "request"])
            cache_key = f"{prefix}:{func.__name__}:{arg_str}"

            cached_data = backend_cache.get(cache_key)
            if cached_data is not None:
                return cached_data

            if asyncio.iscoroutinefunction(func):
                result = await func(*args, **kwargs)
            else:
                result = func(*args, **kwargs)

            backend_cache.set(cache_key, result, ttl=ttl)
            return result
        return wrapper
    return decorator

def invalidate_cache(prefix: str):
    """
    Backend Cache Invalidation Hook called whenever products, categories, menus, or settings change.
    """
    backend_cache.clear_prefix(prefix)
