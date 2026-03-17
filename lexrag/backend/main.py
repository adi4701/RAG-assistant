import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from config import settings
from routers import auth, documents, query

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("lexrag")

app = FastAPI(
    title="LexRAG API",
    description="Secure Multi-Tenant RAG for Corporate Legal Documents",
    version="1.0.0",
)

@app.on_event("startup")
async def startup_event():
    key = settings.OPENAI_API_KEY
    if not key or "YOUR_OPENAI_API_KEY_HERE" in key:
        logger.warning("OPENAI_API_KEY is not set or is using a placeholder. RAG features will not work.")
        logger.info("Please set your OPENAI_API_KEY in the Settings menu of AI Studio.")
    else:
        logger.info("OPENAI_API_KEY is configured.")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(documents.router)
app.include_router(query.router)


import redis
import chromadb
from fastapi import APIRouter, Depends, HTTPException, Request

@app.get("/health")
def health():
    checks = {
        "status": "ok",
        "service": "LexRAG",
        "version": "1.0.0",
        "dependencies": {
            "redis": "unknown",
            "chromadb": "unknown",
            "openai_api_key": "configured" if settings.OPENAI_API_KEY and "YOUR_OPENAI_API_KEY_HERE" not in settings.OPENAI_API_KEY else "missing"
        }
    }
    
    # Check Redis
    try:
        r = redis.from_url(settings.REDIS_URL, socket_connect_timeout=1)
        r.ping()
        checks["dependencies"]["redis"] = "connected"
    except Exception as e:
        checks["dependencies"]["redis"] = f"error: {str(e)}"
        checks["status"] = "degraded"
        
    # Check ChromaDB
    try:
        client = chromadb.HttpClient(host=settings.CHROMA_HOST, port=settings.CHROMA_PORT)
        client.heartbeat()
        checks["dependencies"]["chromadb"] = "connected"
    except Exception as e:
        checks["dependencies"]["chromadb"] = f"error: {str(e)}"
        checks["status"] = "degraded"
        
    return checks
