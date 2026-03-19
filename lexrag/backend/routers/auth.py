import hashlib
import json
import sqlite3
from datetime import datetime, timedelta, timezone

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

def _get_db():
    conn = sqlite3.connect("users.db")
    conn.execute(
        "CREATE TABLE IF NOT EXISTS users (username TEXT PRIMARY KEY, password TEXT, tenant_id TEXT, role TEXT)"
    )
    return conn

def _hash_pw(password: str) -> str:
    # TODO: Replace with bcrypt in production.
    return hashlib.sha256(password.encode()).hexdigest()

def _make_token(username: str, tenant_id: str, role: str) -> str:
    permitted = ROLE_DOC_PERMISSIONS[UserRole(role)]
    payload = {
        "sub": username,
        "tenant_id": tenant_id,
        "role": role,
        "permitted_doc_types": permitted,
        "exp": datetime.now(timezone.utc)
        + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES),
    }
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)

@router.post("/register", response_model=Token)
def register(user: UserCreate):
    conn = _get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT username FROM users WHERE username = ?", (user.username,))
    if cursor.fetchone():
        conn.close()
        raise HTTPException(status_code=400, detail="Username already registered.")

    cursor.execute(
        "INSERT INTO users (username, password, tenant_id, role) VALUES (?, ?, ?, ?)",
        (user.username, _hash_pw(user.password), user.tenant_id, user.role.value),
    )
    conn.commit()
    conn.close()

    return Token(
        access_token=_make_token(user.username, user.tenant_id, user.role.value),
        token_type="bearer",
        role=user.role.value,
        tenant_id=user.tenant_id,
        username=user.username,
    )

@router.post("/login", response_model=Token)
def login(user: UserLogin):
    conn = _get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT password, tenant_id, role FROM users WHERE username = ?", (user.username,))
    row = cursor.fetchone()
    conn.close()

    if not row:
        raise HTTPException(status_code=401, detail="Invalid credentials.")

    stored_password, tenant_id, role = row
    if stored_password != _hash_pw(user.password):
        raise HTTPException(status_code=401, detail="Invalid credentials.")

    return Token(
        access_token=_make_token(user.username, tenant_id, role),
        token_type="bearer",
        role=role,
        tenant_id=tenant_id,
        username=user.username,
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
