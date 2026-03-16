import uuid

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt

from config import settings
from models.schemas import TokenData, UserRole
from services.ingestion import ingest_document, list_tenant_documents
from services.cache import invalidate_tenant

router = APIRouter(prefix="/documents", tags=["documents"])
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

MAX_FILE_SIZE = 20 * 1024 * 1024  # 20 MB


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


@router.post("/upload")
async def upload_document(
    file: UploadFile = File(...),
    doc_type: str = Form(...),
    td: TokenData = Depends(_decode_token),
):
    # RBAC: read-only users cannot upload
    if td.role == UserRole.readonly.value:
        raise HTTPException(
            status_code=403,
            detail="Read-only users are not permitted to upload documents.",
        )

    # RBAC: check doc type is permitted for this role
    if doc_type not in (td.permitted_doc_types or []):
        raise HTTPException(
            status_code=403,
            detail=f"Your role '{td.role}' does not permit uploading '{doc_type}' documents.",
        )

    if not file.filename or not file.filename.lower().endswith((".pdf", ".docx")):
        raise HTTPException(
            status_code=400, detail="Only .pdf and .docx files are supported."
        )

    file_bytes = await file.read()
    if len(file_bytes) > MAX_FILE_SIZE:
        raise HTTPException(status_code=413, detail="File exceeds 20 MB limit.")

    doc_id = str(uuid.uuid4())

    try:
        result = ingest_document(
            file_bytes=file_bytes,
            filename=file.filename,
            tenant_id=td.tenant_id,
            doc_type=doc_type,
            doc_id=doc_id,
        )
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))

    # Invalidate tenant cache after new document
    invalidate_tenant(td.tenant_id)

    return {"message": "Document ingested successfully.", **result}


@router.get("/list")
async def list_documents(td: TokenData = Depends(_decode_token)):
    docs = list_tenant_documents(td.tenant_id)
    # Filter to permitted doc types
    permitted = set(td.permitted_doc_types or [])
    return [d for d in docs if d.get("doc_type") in permitted]
