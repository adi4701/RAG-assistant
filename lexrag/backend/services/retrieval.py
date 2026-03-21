from typing import List, Dict, Any

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


def get_collection():
    global _chroma_client, _collection
    if _chroma_client is None:
        if settings.CHROMA_MODE == "http":
            _chroma_client = chromadb.HttpClient(
                host=settings.CHROMA_HOST, port=settings.CHROMA_PORT
            )
        else:
            import os as _os
            _os.makedirs(settings.CHROMA_PERSIST_PATH, exist_ok=True)
            _chroma_client = chromadb.PersistentClient(
                path=settings.CHROMA_PERSIST_PATH
            )
    if _collection is None:
        _collection = _chroma_client.get_or_create_collection(
            name="lexrag_documents",
            metadata={"hnsw:space": "cosine"},
        )
    return _collection


def embed_query(query: str) -> List[float]:
    if not settings.OPENAI_API_KEY:
        raise ValueError("OPENAI_API_KEY is not configured. Set it in Render's Environment Variables.")
    client = get_openai()
    response = client.embeddings.create(
        model="text-embedding-3-small", input=[query]
    )
    return response.data[0].embedding


def retrieve_chunks(
    query: str,
    tenant_id: str,
    permitted_doc_types: List[str],
    top_k: int = 5,
) -> List[Dict[str, Any]]:
    """
    Metadata-predicate filtered ANN search enforced at vector-DB layer.

    Security guarantee (paper Section III-C):
        ∀ query q by user u with tenant_id t:
        retrieved chunk set R(q) ⊆ { c ∈ C | c.tenant_id = t }

    The $and predicate is evaluated by ChromaDB HNSW before similarity
    scoring — not at the application layer — making it bypass-resistant.
    """
    if not permitted_doc_types or not isinstance(permitted_doc_types, list):
        return []

    embedding = embed_query(query)
    collection = get_collection()

    # Compound metadata predicate: tenant isolation + doc-type RBAC
    where_filter: dict = {
        "$and": [
            {"tenant_id": {"$eq": tenant_id}},
            {"document_type": {"$in": permitted_doc_types}},
        ]
    }

    try:
        results = collection.query(
            query_embeddings=[embedding],
            n_results=top_k,
            where=where_filter,
            include=["documents", "metadatas", "distances"],
        )
    except Exception:
        # Collection empty or no matching docs
        return []

    chunks: List[Dict[str, Any]] = []
    docs = (results.get("documents") or [[]])[0]
    metas = (results.get("metadatas") or [[]])[0]
    dists = (results.get("distances") or [[]])[0]

    for doc, meta, dist in zip(docs, metas, dists):
        # ChromaDB cosine distance → similarity
        similarity = 1.0 - dist
        if similarity < settings.COSINE_THRESHOLD:
            continue
        chunks.append(
            {
                "text": doc,
                "uuid": meta.get("chunk_uuid", ""),
                "doc_id": meta.get("doc_id", ""),
                "page_number": meta.get("page_number", 0),
                "filename": meta.get("filename", ""),
                "doc_type": meta.get("document_type", ""),
                "similarity": round(similarity, 4),
            }
        )

    return chunks
