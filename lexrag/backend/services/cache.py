import hashlib
import json
from typing import Optional, Any

import redis

from config import settings


_redis_client = None


def get_redis():
    global _redis_client
    if _redis_client is None:
        _redis_client = redis.from_url(settings.REDIS_URL, decode_responses=True)
    return _redis_client


def _cache_key(query: str, tenant_id: str) -> str:
    """
    SHA-256 hash of (query_text ∥ tenant_id).
    Tenant-scoped so the same query by different tenants never collides
    (paper Section III-E, Algorithm 1 step 2).
    """
    raw = f"{query}:{tenant_id}".encode("utf-8")
    return f"lexrag:cache:{hashlib.sha256(raw).hexdigest()}"


def get_cached(query: str, tenant_id: str) -> Optional[Any]:
    """Return cached response dict or None on miss."""
    try:
        client = get_redis()
        value = client.get(_cache_key(query, tenant_id))
        return json.loads(value) if value else None
    except Exception:
        return None


def set_cached(query: str, tenant_id: str, payload: dict) -> None:
    """Cache response with TTL = 3600 s (paper default)."""
    try:
        client = get_redis()
        client.setex(
            _cache_key(query, tenant_id),
            settings.CACHE_TTL,
            json.dumps(payload),
        )
    except Exception:
        pass  # Cache failure is non-fatal


def invalidate_tenant(tenant_id: str) -> int:
    """Delete all cache entries for a tenant (used after document upload)."""
    try:
        client = get_redis()
        pattern = "lexrag:cache:*"
        # We can't scan by tenant cheaply without secondary index,
        # so flush all cache keys on new upload — acceptable trade-off.
        keys = client.keys(pattern)
        if keys:
            return client.delete(*keys)
    except Exception:
        pass
    return 0
