"""
Cipher Labs - Authentication Router
FastAPI authentication endpoints using MongoDB Atlas and JWT.
"""

import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from ..schemas import UserSignupRequest, UserLoginRequest, UserProfileResponse, ResponseEnvelope, ErrorDetail
from ..auth import hash_password, verify_password, create_access_token, get_current_user, MOCK_USERS
from ..db import get_db
from ..audit import log_audit_event

router = APIRouter(prefix="/api/auth", tags=["auth"])

@router.post("/signup", response_model=ResponseEnvelope)
async def signup(req: UserSignupRequest):
    db = get_db()
    email_clean = req.email.strip().lower()

    if db is not None:
        existing = await db.users.find_one({"email": email_clean})
        if existing:
            return ResponseEnvelope(
                error=ErrorDetail(code="CONFLICT", message="An account with this email already exists.")
            )

    user_id = f"usr-{uuid.uuid4()}"
    pwd_hash = hash_password(req.password)
    user_doc = {
        "id": user_id,
        "email": email_clean,
        "password_hash": pwd_hash,
        "first_name": req.first_name.strip(),
        "last_name": req.last_name.strip(),
        "phone": req.phone.strip() if req.phone else None,
        "preferences": {"theme": "dark", "keep_logs_days": 90}
    }

    if db is not None:
        await db.users.insert_one(dict(user_doc))
    else:
        MOCK_USERS[user_id] = user_doc

    token = create_access_token(user_id, email_clean)
    await log_audit_event(user_id, "OPERATOR_REGISTERED_MONGODB", None, {"email": email_clean})

    return ResponseEnvelope(
        data={
            "token": token,
            "profile": {
                "id": user_id,
                "first_name": user_doc["first_name"],
                "last_name": user_doc["last_name"],
                "email": user_doc["email"],
                "phone": user_doc["phone"],
                "preferences": user_doc["preferences"]
            }
        }
    )

@router.post("/login", response_model=ResponseEnvelope)
async def login(req: UserLoginRequest):
    db = get_db()
    email_clean = req.email.strip().lower()
    user = None

    if db is not None:
        user = await db.users.find_one({"email": email_clean})
    else:
        for u in MOCK_USERS.values():
            if u["email"].lower() == email_clean:
                user = u
                break

    # Per PART 4 security rule: "Never say which field was wrong."
    if not user or not verify_password(req.password, user.get("password_hash", "")):
        return ResponseEnvelope(
            error=ErrorDetail(code="UNAUTHENTICATED", message="Email or password is incorrect.")
        )

    token = create_access_token(user["id"], user["email"])
    await log_audit_event(user["id"], "OPERATOR_SIGNED_IN_FASTAPI", None, {"email": user["email"]})

    return ResponseEnvelope(
        data={
            "token": token,
            "profile": {
                "id": user["id"],
                "first_name": user["first_name"],
                "last_name": user["last_name"],
                "email": user["email"],
                "phone": user.get("phone"),
                "preferences": user.get("preferences", {"theme": "dark", "keep_logs_days": 90})
            }
        }
    )

@router.get("/me", response_model=ResponseEnvelope)
async def get_me(current_user: dict = Depends(get_current_user)):
    return ResponseEnvelope(
        data={
            "id": current_user["id"],
            "first_name": current_user["first_name"],
            "last_name": current_user["last_name"],
            "email": current_user["email"],
            "phone": current_user.get("phone"),
            "preferences": current_user.get("preferences", {})
        }
    )
