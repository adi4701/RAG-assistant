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
    if not settings.OPENAI_API_KEY:
        logger.warning("OPENAI_API_KEY is not set. RAG features will not work.")
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


@app.get("/health")
def health():
    return {"status": "ok", "service": "LexRAG", "version": "1.0.0"}
