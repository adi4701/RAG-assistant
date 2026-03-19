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

from starlette.middleware.base import BaseHTTPMiddleware
from fastapi.responses import JSONResponse

class LimitBodySizeMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request, call_next):
        if request.headers.get("content-length"):
            if int(request.headers["content-length"]) > 25 * 1024 * 1024:
                return JSONResponse({"detail": "Request too large"}, status_code=413)
        return await call_next(request)

app.add_middleware(LimitBodySizeMiddleware)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization"],
)

app.include_router(auth.router)
app.include_router(documents.router)
app.include_router(query.router)


import chromadb
from fastapi import APIRouter, Depends, HTTPException, Request

@app.get("/health")
def health():
    return {"status": "ok"}
