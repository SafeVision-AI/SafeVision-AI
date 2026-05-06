from __future__ import annotations

import hashlib
import hmac
import os

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from core.security import create_access_token, get_current_user

router = APIRouter(prefix="/api/v1/auth", tags=["auth"])

class LoginRequest(BaseModel):
    email: str = Field(min_length=3, max_length=254)
    password: str = Field(min_length=8, max_length=256)

class LoginResponse(BaseModel):
    access_token: str
    token_type: str
    operator_name: str

def _verify_pbkdf2_password(password: str, encoded_hash: str) -> bool:
    """Verify pbkdf2_sha256$iterations$salt$hex_digest from environment."""
    try:
        algorithm, iterations_raw, salt, expected = encoded_hash.split("$", 3)
        if algorithm != "pbkdf2_sha256":
            return False
        iterations = int(iterations_raw)
        digest = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt.encode("utf-8"), iterations).hex()
        return hmac.compare_digest(digest, expected)
    except (ValueError, TypeError):
        return False


def _configured_operator() -> dict[str, str] | None:
    email = os.environ.get("AUTH_OPERATOR_EMAIL", "").strip().lower()
    password_hash = os.environ.get("AUTH_OPERATOR_PASSWORD_HASH", "").strip()
    name = os.environ.get("AUTH_OPERATOR_NAME", "SafeVixAI Operator").strip()
    if not email or not password_hash:
        return None
    return {"email": email, "password_hash": password_hash, "name": name}

@router.post("/login", response_model=LoginResponse)
async def login(body: LoginRequest):
    operator = _configured_operator()
    if operator is None:
        raise HTTPException(status_code=503, detail="Operator login is not configured")

    email = body.email.strip().lower()
    if email != operator["email"] or not _verify_pbkdf2_password(body.password, operator["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    token = create_access_token(
        data={"sub": email, "name": operator["name"], "role": "operator"},
    )
    return LoginResponse(
        access_token=token,
        token_type="bearer",
        operator_name=operator["name"]
    )

@router.get("/verify")
async def verify_token(current_user: dict = Depends(get_current_user)):
    """Validate the caller's bearer token."""
    return {"status": "valid", "sub": current_user.get("sub")}
