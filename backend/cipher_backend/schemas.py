"""
Cipher Labs - Pydantic v2 Schemas & Response Envelope
All API endpoints return the standardized envelope:
{
  "data": ...,
  "error": null | { "code": "...", "message": "...", "retryable": bool, "details": {} },
  "meta": { "request_id": "..." }
}
"""

from typing import Any, Dict, List, Optional
from pydantic import BaseModel, EmailStr, Field

# Response Envelope
class ErrorDetail(BaseModel):
    code: str
    message: str
    retryable: bool = False
    details: Dict[str, Any] = Field(default_factory=dict)

class ResponseEnvelope(BaseModel):
    data: Optional[Any] = None
    error: Optional[ErrorDetail] = None
    meta: Dict[str, Any] = Field(default_factory=dict)

# Auth Schemas
class UserSignupRequest(BaseModel):
    first_name: str = Field(..., min_length=1, max_length=60)
    last_name: str = Field(..., min_length=1, max_length=60)
    email: EmailStr
    password: str = Field(..., min_length=8)
    phone: Optional[str] = None

class UserLoginRequest(BaseModel):
    email: EmailStr
    password: str

class UserProfileResponse(BaseModel):
    id: str
    first_name: str
    last_name: str
    email: str
    phone: Optional[str] = None
    preferences: Dict[str, Any] = Field(default_factory=dict)

class ProfileUpdateRequest(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone: Optional[str] = None
    preferences: Optional[Dict[str, Any]] = None

# Operations Schemas
class SimulationRunRequest(BaseModel):
    targets: List[str]
    method: str = "NIST SP 800-88 Rev. 1 Clear (Simulated)"
    create_recovery_copy: bool = True
    confirmation: str

class OperationItem(BaseModel):
    id: str
    user_id: str
    operation_type: str
    mode: str
    target_reference: str
    method: str
    execution_status: str
    verification_status: str
    tracking_state: str
    idempotency_key: str
    target_count: int
    has_recovery_copy: bool
    created_at: str
    completed_at: Optional[str] = None
    verification_message: str
    pre_hashes: Dict[str, str] = Field(default_factory=dict)
    post_hashes: Dict[str, str] = Field(default_factory=dict)

# Recovery Copy Schemas
class RecoveryCopyItem(BaseModel):
    id: str
    operation_id: str
    user_id: str
    original_file_name: str
    original_workspace_path: str
    recovery_vault_path: str
    restored_output_path: Optional[str] = None
    original_sha256: str
    restored_sha256: Optional[str] = None
    created_at: str
    restored_at: Optional[str] = None
    status: str

# Audit Log Schemas
class AuditLogItem(BaseModel):
    id: int
    user_id: str
    action: str
    operation_id: Optional[str] = None
    previous_hash: str
    entry_hash: str
    created_at: str
    safe_details: Dict[str, Any] = Field(default_factory=dict)

# Device Schemas
class DeviceItem(BaseModel):
    id: str
    user_id: str
    app_device_id: str
    label: str
    os_name: str
    os_version: str
    app_version: str
    last_seen_at: str
