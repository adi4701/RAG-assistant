import os
import logging

# Must be set BEFORE chromadb is imported anywhere.
# Suppresses GPU/ONNX device scanning on Render (CPU-only server).
os.environ.setdefault("ONNXRUNTIME_PROVIDERS", "CPUExecutionProvider")
os.environ.setdefault("ANONYMIZED_TELEMETRY", "false")
os.environ.setdefault("CHROMA_ANONYMIZED_TELEMETRY", "false")

from pydantic_settings import BaseSettings

logger = logging.getLogger("lexrag")


class Settings(BaseSettings):
    # Empty string default: app starts without crashing.
    # Validated at request time in each service that needs it.
    OPENAI_API_KEY: str = ""

    SECRET_KEY: str = "lexrag-secret-key-change-in-production-32chars"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 480

    REDIS_URL: str = "redis://localhost:6379"

    # "embedded" = PersistentClient, no separate ChromaDB container needed (Render)
    # "http"     = HttpClient, requires chromadb container (Docker Compose)
    CHROMA_MODE: str = "embedded"
    CHROMA_HOST: str = "chromadb"
    CHROMA_PORT: int = 8000
    CHROMA_PERSIST_PATH: str = "./data/chroma"

    CACHE_TTL: int = 3600
    CHUNK_SIZE: int = 1000
    CHUNK_OVERLAP: int = 150
    TOP_K: int = 5
    COSINE_THRESHOLD: float = 0.75

    class Config:
        env_file = ".env"


settings = Settings()

if not settings.OPENAI_API_KEY:
    logger.warning(
        "OPENAI_API_KEY is not set. "
        "Set it in Render Dashboard → Your Service → Environment."
    )
