from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    OPENAI_API_KEY: str
    SECRET_KEY: str = "lexrag-secret-key-change-in-production-32chars"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 480

    REDIS_URL: str = "redis://redis:6379"
    CHROMA_HOST: str = "chromadb"
    CHROMA_PORT: int = 8000
    CACHE_TTL: int = 3600

    CHUNK_SIZE: int = 1000
    CHUNK_OVERLAP: int = 150
    TOP_K: int = 5
    COSINE_THRESHOLD: float = 0.75

    class Config:
        env_file = ".env"


settings = Settings()
