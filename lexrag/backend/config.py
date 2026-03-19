import os
import logging
from pydantic_settings import BaseSettings

logger = logging.getLogger("lexrag")

# ── Suppress ONNX GPU discovery on CPU-only servers (Render, Railway, etc.)
# Must be set BEFORE chromadb is imported anywhere.
os.environ.setdefault("ONNXRUNTIME_PROVIDERS", "CPUExecutionProvider")
os.environ.setdefault("ANONYMIZED_TELEMETRY", "false")
os.environ.setdefault("CHROMA_ANONYMIZED_TELEMETRY", "false")


class Settings(BaseSettings):
    # Optional at startup — validated at request time so the app can start
    # even if the key is temporarily missing during Render's cold start.
    OPENAI_API_KEY: str = ""

    SECRET_KEY: str = "lexrag-secret-key-change-in-production-32chars"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 480

    # Redis — Render managed Redis or Upstash URL goes here
    REDIS_URL: str = "redis://redis:6379"

    # ChromaDB mode:
    #   "http"      → uses chromadb.HttpClient (Docker Compose)
    #   "embedded"  → uses chromadb.PersistentClient (Render / single server)
    CHROMA_MODE: str = "embedded"
    CHROMA_HOST: str = "chromadb"
    CHROMA_PORT: int = 8000
    CHROMA_PERSIST_PATH: str = "/opt/render/project/src/data/chroma"

    CACHE_TTL: int = 3600
    CHUNK_SIZE: int = 1000
    CHUNK_OVERLAP: int = 150
    TOP_K: int = 5
    COSINE_THRESHOLD: float = 0.75

    class Config:
        env_file = ".env"


settings = Settings()

# Warn (not crash) if OpenAI key looks like a placeholder
if not settings.OPENAI_API_KEY or settings.OPENAI_API_KEY.startswith("sk-..."):
    logger.warning(
        "OPENAI_API_KEY is not set or is using a placeholder. "
        "RAG features will not work until you set this in Render's environment variables."
    )
