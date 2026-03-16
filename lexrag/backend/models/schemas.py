from pydantic import BaseModel
from typing import Optional, List
from enum import Enum


class UserRole(str, Enum):
    admin = "admin"
    analyst = "analyst"
    readonly = "readonly"


class DocumentType(str, Enum):
    nda = "nda"
    employment = "employment"
    board_resolution = "board_resolution"
    shareholder_agreement = "shareholder_agreement"


# Role → permitted document types (role hierarchy from paper Section III-C)
# admin > analyst > read-only  (paper's role hierarchy)
ROLE_DOC_PERMISSIONS: dict = {
    UserRole.admin: [t.value for t in DocumentType],
    UserRole.analyst: ["nda", "employment", "shareholder_agreement"],
    UserRole.readonly: ["nda"],
}


class UserCreate(BaseModel):
    username: str
    password: str
    tenant_id: str
    role: UserRole = UserRole.readonly


class UserLogin(BaseModel):
    username: str
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str
    role: str
    tenant_id: str
    username: str


class TokenData(BaseModel):
    username: Optional[str] = None
    tenant_id: Optional[str] = None
    role: Optional[str] = None
    permitted_doc_types: Optional[List[str]] = None


class QueryRequest(BaseModel):
    query: str
    top_k: int = 5


class CitationResult(BaseModel):
    uuid: str
    verified: bool
    page_number: Optional[int] = None
    doc_id: Optional[str] = None
    filename: Optional[str] = None


class DocumentInfo(BaseModel):
    doc_id: str
    filename: str
    doc_type: str
    chunks: int
