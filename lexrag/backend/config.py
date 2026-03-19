import os
from dotenv import load_dotenv
from pydantic_settings import BaseSettings
from pydantic import Field, validator

# Force load .env file to override empty environment variables
load_dotenv(".env", override=True)

class Settings(BaseSettings):
    OPENAI_API_KEY: str = Field(default="", description="OpenAI API Key")
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

    @validator("OPENAI_API_KEY", pre=True, always=True)
    def validate_openai_key(cls, v):
        # If the environment variable is empty, try to get it from os.environ (which load_dotenv populated)
        if not v:
            v = os.environ.get("OPENAI_API_KEY", "")
        if v is None:
            return ""
        return v

    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()
