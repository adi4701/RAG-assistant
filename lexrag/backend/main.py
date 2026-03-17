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
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(documents.router)
app.include_router(query.router)


@app.get("/health")
def health():
    return {"status": "ok", "service": "LexRAG", "version": "1.0.0"}
