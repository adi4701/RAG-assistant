import json

from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import StreamingResponse
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt

from config import settings
from models.schemas import QueryRequest, TokenData
from services.retrieval import retrieve_chunks
from services.generation import generate_stream, extract_citations, validate_citations
from services.cache import get_cached, set_cached

router = APIRouter(prefix="/query", tags=["query"])
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")


def _decode_token(token: str = Depends(oauth2_scheme)) -> TokenData:
    try:
        payload = jwt.decode(
            token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM]
        )
        return TokenData(
            username=payload.get("sub"),
            tenant_id=payload.get("tenant_id"),
            role=payload.get("role"),
            permitted_doc_types=payload.get("permitted_doc_types"),
        )
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired token.")


def _sse(data: dict) -> str:
    return f"data: {json.dumps(data)}\n\n"


@router.post("/stream")
async def query_stream(
    request: QueryRequest,
    td: TokenData = Depends(_decode_token),
):
    tenant_id = td.tenant_id or ""
    permitted = td.permitted_doc_types or []

    # ── Step 1: Redis semantic cache check ──────────────────────────────────
    cached = get_cached(request.query, tenant_id)
    if cached:
        async def _cached_stream():
            yield _sse({"type": "token", "content": cached["answer"]})
            yield _sse(
                {
                    "type": "citations",
                    "citations": cached["citations"],
                    "cached": True,
                }
            )
            yield "data: [DONE]\n\n"

        return StreamingResponse(
            _cached_stream(),
            media_type="text/event-stream",
            headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
        )

    # ── Step 2: Metadata-predicate filtered retrieval ────────────────────────
    chunks = retrieve_chunks(
        query=request.query,
        tenant_id=tenant_id,
        permitted_doc_types=permitted,
        top_k=request.top_k,
    )

    if not chunks:
        async def _no_docs():
            msg = "Insufficient documentary evidence in the provided context."
            yield _sse({"type": "token", "content": msg})
            yield _sse({"type": "citations", "citations": [], "cached": False})
            yield "data: [DONE]\n\n"

        return StreamingResponse(
            _no_docs(),
            media_type="text/event-stream",
            headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
        )

    # ── Step 3: GPT-4o streaming generation + citation validation ────────────
    full_response: list[str] = []

    async def _event_stream():
        for token in generate_stream(request.query, chunks):
            full_response.append(token)
            yield _sse({"type": "token", "content": token})

        answer = "".join(full_response)

        # Post-generation UUID cross-validation (paper Section III-D)
        cited_uuids = extract_citations(answer)
        citations = validate_citations(cited_uuids, chunks)

        # Store in Redis cache
        set_cached(request.query, tenant_id, {"answer": answer, "citations": citations})

        yield _sse({"type": "citations", "citations": citations, "cached": False})
        yield "data: [DONE]\n\n"

    return StreamingResponse(
        _event_stream(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )
