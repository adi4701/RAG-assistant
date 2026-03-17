import hashlib
import json
from datetime import datetime, timedelta
from typing import Optional

import redis
from fastapi import APIRouter, HTTPException
from jose import jwt

from config import settings
from models.schemas import (
    UserCreate,
    UserLogin,
    Token,
    UserRole,
    ROLE_DOC_PERMISSIONS,
)

router = APIRouter(prefix="/auth", tags=["auth"])


def _redis():
    return redis.from_url(settings.REDIS_URL, decode_responses=True)


def _hash_pw(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()


def _make_token(username: str, tenant_id: str, role: str) -> str:
    permitted = ROLE_DOC_PERMISSIONS[UserRole(role)]
    payload = {
        "sub": username,
        "tenant_id": tenant_id,
        "role": role,
        "permitted_doc_types": permitted,
        "exp": datetime.utcnow()
        + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES),
    }
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


@router.post("/register", response_model=Token)
def register(user: UserCreate):
    r = _redis()
    key = f"user:{user.username}"
    if r.exists(key):
        raise HTTPException(status_code=400, detail="Username already registered.")

    r.set(
        key,
        json.dumps(
            {
                "username": user.username,
                "password": _hash_pw(user.password),
                "tenant_id": user.tenant_id,
                "role": user.role.value,
            }
        ),
    )

    return Token(
        access_token=_make_token(user.username, user.tenant_id, user.role.value),
        token_type="bearer",
        role=user.role.value,
        tenant_id=user.tenant_id,
        username=user.username,
    )


@router.post("/login", response_model=Token)
def login(user: UserLogin):
    r = _redis()
    raw = r.get(f"user:{user.username}")
    if not raw:
        raise HTTPException(status_code=401, detail="Invalid credentials.")

    stored = json.loads(raw)
    if stored["password"] != _hash_pw(user.password):
        raise HTTPException(status_code=401, detail="Invalid credentials.")

    return Token(
        access_token=_make_token(
            stored["username"], stored["tenant_id"], stored["role"]
        ),
        token_type="bearer",
        role=stored["role"],
        tenant_id=stored["tenant_id"],
        username=stored["username"],
    )


@router.get("/roles")
def list_roles():
    """Helper endpoint for the frontend to display role permissions."""
    return {
        role.value: {
            "permitted_doc_types": ROLE_DOC_PERMISSIONS[role],
            "can_upload": role != UserRole.readonly,
        }
        for role in UserRole
    }
