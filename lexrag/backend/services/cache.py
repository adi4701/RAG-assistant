import hashlib
import json
import time
from typing import Optional, Any

from config import settings

_cache = {}

def _cache_key(query: str, tenant_id: str) -> str:
    """
    SHA-256 hash of (query_text ∥ tenant_id).
    Tenant-scoped so the same query by different tenants never collides
    (paper Section III-E, Algorithm 1 step 2).
    """
    raw = f"{query}:{tenant_id}".encode("utf-8")
    hash_val = hashlib.sha256(raw).hexdigest()
    return f"lexrag:cache:{tenant_id}:{hash_val}"

def get_cached(query: str, tenant_id: str) -> Optional[Any]:
    """Return cached response dict or None on miss."""
    key = _cache_key(query, tenant_id)
    if key in _cache:
        entry = _cache[key]
        if time.time() < entry["expires_at"]:
            return json.loads(entry["payload"])
        else:
            del _cache[key]
    return None

def set_cached(query: str, tenant_id: str, payload: dict) -> None:
    """Cache response with TTL = 3600 s (paper default)."""
    key = _cache_key(query, tenant_id)
    _cache[key] = {
        "payload": json.dumps(payload),
        "expires_at": time.time() + settings.CACHE_TTL
    }

def invalidate_tenant(tenant_id: str) -> int:
    """Delete all cache entries for a tenant (used after document upload)."""
    prefix = f"lexrag:cache:{tenant_id}:"
    keys_to_delete = [k for k in _cache.keys() if k.startswith(prefix)]
    for k in keys_to_delete:
        del _cache[k]
    return len(keys_to_delete)
