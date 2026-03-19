import re
from typing import List, Dict, Any, Generator

from openai import OpenAI

from config import settings


_openai_client = None


def get_openai():
    global _openai_client
    if _openai_client is None:
        _openai_client = OpenAI(api_key=settings.OPENAI_API_KEY)
    return _openai_client


# Hard-constraint system prompt (paper Section III-D)
SYSTEM_PROMPT_TEMPLATE = """\
You are LexRAG, a precise corporate legal AI assistant.

━━━ ABSOLUTE RULES — NEVER VIOLATE ━━━
1. Answer ONLY from the DOCUMENT CONTEXT provided below. Use zero external knowledge.
2. After EVERY factual claim, append an inline citation in this exact format:
   [SOURCE: {chunk_uuid}]
   where {chunk_uuid} is the UUID from the relevant context block header.
3. You may cite the same UUID multiple times if the same chunk supports multiple claims.
4. If the provided context is insufficient to answer the question, respond with exactly:
   "Insufficient documentary evidence in the provided context."
   Do NOT attempt to answer from memory.
5. Never fabricate clauses, dates, figures, or party names.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

DOCUMENT CONTEXT:
{context}
"""

# Compiled regex for citation extraction (paper Section III-D)
CITATION_PATTERN = re.compile(r"\[SOURCE:\s*([a-f0-9]{32})\]", re.IGNORECASE)


GPT_MODEL = "gpt-4o"

def build_context(chunks: List[Dict[str, Any]]) -> str:
    parts = []
    for chunk in chunks:
        header = (
            f"[UUID: {chunk['uuid']} | "
            f"File: {chunk['filename']} | "
            f"Page: {chunk['page_number']} | "
            f"Similarity: {chunk['similarity']}]"
        )
        parts.append(f"{header}\n{chunk['text']}")
    separator = "\n\n" + ("—" * 60) + "\n\n"
    return separator.join(parts)


def extract_citations(text: str) -> List[str]:
    """Extract all [SOURCE: uuid] tags via compiled regex."""
    return CITATION_PATTERN.findall(text)


def validate_citations(
    cited_uuids: List[str],
    retrieved_chunks: List[Dict[str, Any]],
) -> List[Dict[str, Any]]:
    """
    UUID cross-validation against immutable retrieved chunk set.
    Any UUID absent from retrieved set → flagged [UNVERIFIED].
    Directly addresses the Mata v. Avianca failure mode (paper Section III-D).
    """
    valid_uuid_map = {c["uuid"]: c for c in retrieved_chunks}
    seen = set()
    results = []

    for uuid in cited_uuids:
        if uuid in seen:
            continue
        seen.add(uuid)

        if uuid in valid_uuid_map:
            chunk = valid_uuid_map[uuid]
            results.append(
                {
                    "uuid": uuid,
                    "verified": True,
                    "page_number": chunk.get("page_number"),
                    "doc_id": chunk.get("doc_id"),
                    "filename": chunk.get("filename"),
                    "doc_type": chunk.get("doc_type"),
                }
            )
        else:
            # Hallucinated citation — flag it
            results.append({"uuid": uuid, "verified": False})

    return results


def generate_stream(
    query: str,
    chunks: List[Dict[str, Any]],
    conversation_history: List[Dict] = None,
) -> Generator[str, None, None]:
    """
    GPT-4o streaming generation with hard-constraint system prompt.
    Conversation history capped at 10 turns (paper Section III-D).
    Temperature = 0.1 for legal precision.
    """
    client = get_openai()
    context = build_context(chunks)
    system_content = SYSTEM_PROMPT_TEMPLATE.format(context=context)

    messages = [{"role": "system", "content": system_content}]

    # Retain last 10 turns for anaphoric co-reference resolution
    if conversation_history:
        messages.extend(conversation_history[-20:])  # 10 turns = 20 messages

    messages.append({"role": "user", "content": query})

    try:
        stream = client.chat.completions.create(
            model=GPT_MODEL,
            messages=messages,
            stream=True,
            temperature=0.1,
            max_tokens=2000,
        )

        for chunk in stream:
            delta = chunk.choices[0].delta.content
            if delta:
                yield delta
    except Exception as e:
        yield f"\n\n[GENERATION ERROR: {str(e)}]"
