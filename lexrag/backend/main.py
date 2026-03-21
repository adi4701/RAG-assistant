import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routers import auth, documents, query

app = FastAPI(
    title="LexRAG API",
    description="Secure Multi-Tenant RAG for Corporate Legal Documents",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["GET", "POST", "OPTIONS", "HEAD"],
    allow_headers=["Content-Type", "Authorization"],
)

app.include_router(auth.router)
app.include_router(documents.router)
app.include_router(query.router)


@app.get("/")
@app.head("/")
async def root():
    # Render sends HEAD / to health-check the service.
    # Without this route FastAPI returns 404 and the deploy times out.
    return {"status": "ok"}


@app.get("/health")
@app.head("/health")
async def health():
    return {"status": "ok"}
