import logging
from typing import Optional, Any
try:
    import redis.asyncio as aioredis
except ImportError:
    aioredis = None

from app.core.config import settings

logger = logging.getLogger("mediassist.redis")

_redis_client = None

async def init_redis_client() -> Optional[Any]:
    global _redis_client
    if not settings.REDIS_ENABLED or aioredis is None:
        logger.info("Redis caching is disabled or package not available.")
        return None

    try:
        _redis_client = aioredis.from_url(
            settings.REDIS_URL,
            encoding="utf-8",
            decode_responses=True,
            socket_timeout=2.0,
            socket_connect_timeout=2.0
        )
        await _redis_client.ping()
        logger.info(f"Successfully connected to Redis at {settings.REDIS_URL}")
        return _redis_client
    except Exception as e:
        logger.warning(f"Redis is unavailable at {settings.REDIS_URL}: {e}. Application will operate with PostgreSQL fallback.")
        _redis_client = None
        return None

def get_redis_client() -> Optional[Any]:
    return _redis_client

async def close_redis_client():
    global _redis_client
    if _redis_client:
        try:
            await _redis_client.close()
            logger.info("Redis client connection closed.")
        except Exception as e:
            logger.warning(f"Error closing Redis client: {e}")
        _redis_client = None
