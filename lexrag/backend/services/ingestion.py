import hashlib
import io
from typing import List, Dict, Any

import fitz  # PyMuPDF
from docx import Document as DocxDocument
from langchain_text_splitters import RecursiveCharacterTextSplitter
from openai import OpenAI
import chromadb

from config import settings


_openai_client = None
_chroma_client = None


def get_openai():
    global _openai_client
    if _openai_client is None:
        _openai_client = OpenAI(api_key=settings.OPENAI_API_KEY)
    return _openai_client


_collection = None

def get_chroma():
    global _chroma_client
    if _chroma_client is None:
        if settings.CHROMA_MODE == "http":
            _chroma_client = chromadb.HttpClient(
                host=settings.CHROMA_HOST, port=settings.CHROMA_PORT
            )
        else:
            import os
            os.makedirs(settings.CHROMA_PERSIST_PATH, exist_ok=True)
            _chroma_client = chromadb.PersistentClient(
                path=settings.CHROMA_PERSIST_PATH
            )
    return _chroma_client


def get_collection():
    global _collection
    if _collection is None:
        _collection = get_chroma().get_or_create_collection(
            name="lexrag_documents",
            metadata={"hnsw:space": "cosine"},
        )
    return _collection


def extract_text_pdf(file_bytes: bytes) -> str:
    doc = fitz.open(stream=file_bytes, filetype="pdf")
    pages = []
    for i, page in enumerate(doc):
        pages.append(f"[Page {i + 1}]\n{page.get_text()}")
    return "\n\n".join(pages)


def extract_text_docx(file_bytes: bytes) -> str:
    doc = DocxDocument(io.BytesIO(file_bytes))
    return "\n".join(p.text for p in doc.paragraphs if p.text.strip())


def chunk_text(text: str) -> List[str]:
    """
    Recursive chunking as described in the paper:
    chunk_size=1000 tokens, chunk_overlap=150 tokens.
    Separator hierarchy: double-newline → newline → sentence → whitespace.
    """
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=settings.CHUNK_SIZE,
        chunk_overlap=settings.CHUNK_OVERLAP,
        separators=["\n\n", "\n", ". ", " ", ""],
        length_function=len,
    )
    return splitter.split_text(text)


def embed_texts(texts: List[str]) -> List[List[float]]:
    """Batch embed with text-embedding-3-small (1536 dims)."""
    if not settings.OPENAI_API_KEY:
        raise ValueError("OPENAI_API_KEY is not configured. Set it in Render's Environment Variables.")
    client = get_openai()
    # ChromaDB batch limit safety: embed in batches of 100
    all_embeddings = []
    batch_size = 100
    for i in range(0, len(texts), batch_size):
        batch = [t[:6000] for t in texts[i : i + batch_size]]
        response = client.embeddings.create(
            model="text-embedding-3-small", input=batch
        )
        all_embeddings.extend([item.embedding for item in response.data])
    return all_embeddings


def make_chunk_uuid(text: str, doc_id: str) -> str:
    """
    Deterministic SHA-256 UUID from chunk content + doc_id.
    Stable across re-ingestion events (paper Section III-B).
    """
    raw = (text + doc_id).encode("utf-8")
    return hashlib.sha256(raw).hexdigest()[:32]


def ingest_document(
    file_bytes: bytes,
    filename: str,
    tenant_id: str,
    doc_type: str,
    doc_id: str,
) -> Dict[str, Any]:
    if not settings.OPENAI_API_KEY:
        raise ValueError("OPENAI_API_KEY is not configured. Set it in Render's Environment Variables.")
    # 1. Text extraction
    if filename.lower().endswith(".pdf"):
        text = extract_text_pdf(file_bytes)
    elif filename.lower().endswith(".docx"):
        text = extract_text_docx(file_bytes)
    else:
        raise ValueError("Unsupported file type. Upload PDF or DOCX.")

    if not text.strip():
        raise ValueError(
            "Document appears to be empty or image-only (scanned). "
            "LexRAG requires text-based PDFs. "
            "Use a PDF with selectable text."
        )

    # 2. Recursive chunking
    chunks = chunk_text(text)
    if not chunks:
        raise ValueError("No chunks produced from document.")

    # 3. Deterministic UUIDs
    chunk_uuids = [make_chunk_uuid(c, doc_id) for c in chunks]

    # 4. Dense embeddings
    embeddings = embed_texts(chunks)
    if not embeddings:
        raise ValueError("Embedding generation produced no results.")

    # 5. Upsert into ChromaDB with metadata payload
    collection = get_collection()
    metadatas = [
        {
            "doc_id": doc_id,
            "tenant_id": tenant_id,
            "document_type": doc_type,
            "chunk_uuid": chunk_uuids[i],
            "page_number": i,
            "filename": filename,
        }
        for i in range(len(chunks))
    ]

    collection.upsert(
        ids=chunk_uuids,
        embeddings=embeddings,
        documents=chunks,
        metadatas=metadatas,
    )

    return {
        "doc_id": doc_id,
        "filename": filename,
        "chunks": len(chunks),
        "doc_type": doc_type,
    }


def list_tenant_documents(tenant_id: str) -> List[Dict[str, Any]]:
    """Return unique documents stored for a tenant."""
    collection = get_collection()
    results = collection.get(
        where={"tenant_id": {"$eq": tenant_id}},
        include=["metadatas"],
    )
    seen = {}
    for meta in results.get("metadatas") or []:
        doc_id = meta.get("doc_id")
        if doc_id and doc_id not in seen:
            seen[doc_id] = {
                "doc_id": doc_id,
                "filename": meta.get("filename", ""),
                "doc_type": meta.get("document_type", ""),
            }
    return list(seen.values())
