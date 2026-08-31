import json
import logging
from typing import Optional, Any

# pyrefly: ignore [missing-import]
from app.core.redis import get_redis_client

logger = logging.getLogger("mediassist.cache")

class CacheService:
    @staticmethod
    async def get_json(key: str) -> Optional[Any]:
        client = get_redis_client()
        if not client:
            return None
        try:
            val = await client.get(key)
            if val:
                logger.debug(f"CACHE_HIT: key={key}")
                return json.loads(val)
        except Exception as e:
            logger.debug(f"CACHE_MISS/ERROR: key={key}, err={e}")
        return None

    @staticmethod
    async def set_json(key: str, data: Any, ttl: int = 30):
        client = get_redis_client()
        if not client:
            return
        try:
            val_str = json.dumps(data)
            await client.setex(key, ttl, val_str)
            logger.debug(f"CACHE_SET: key={key}, ttl={ttl}s")
        except Exception as e:
            logger.debug(f"CACHE_SET_ERROR: key={key}, err={e}")

    @staticmethod
    async def delete_key(key: str):
        client = get_redis_client()
        if not client:
            return
        try:
            await client.delete(key)
            logger.debug(f"CACHE_DELETE: key={key}")
        except Exception as e:
            logger.debug(f"CACHE_DELETE_ERROR: key={key}, err={e}")

    @staticmethod
    async def invalidate_patient_cache(patient_id: str):
        """
        Invalidates all cached data for a specific patient.
        Ensures strict patient isolation & freshness.
        """
        client = get_redis_client()
        if not client:
            return
        try:
            await client.delete(f"dashboard:{patient_id}")
            await client.delete(f"profile:{patient_id}")
            logger.info(f"CACHE_INVALIDATED: patient_id={patient_id}")
        except Exception as e:
            logger.debug(f"CACHE_INVALIDATION_ERROR: patient_id={patient_id}, err={e}")

cache_service = CacheService()
