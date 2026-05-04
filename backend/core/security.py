from __future__ import annotations

import logging
import os
import secrets
from datetime import datetime, timedelta, timezone

from fastapi import HTTPException, Security
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt

logger = logging.getLogger(__name__)

# ── JWT Configuration ─────────────────────────────────────────────────────────
# SECRET_KEY MUST come from environment in production.
# In development, a random key is generated per process so tokens don't
# survive restarts — this is intentional to avoid leaked static secrets.
_env_secret = os.environ.get("JWT_SECRET_KEY")
if _env_secret:
    SECRET_KEY = _env_secret
else:
    SECRET_KEY = secrets.token_urlsafe(64)
    logger.warning(
        "JWT_SECRET_KEY not set — generated ephemeral key. "
        "Tokens will NOT survive server restarts. "
        "Set JWT_SECRET_KEY in your environment for production."
    )

ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_HOURS = int(os.environ.get("ACCESS_TOKEN_EXPIRE_HOURS", "24"))

security = HTTPBearer(auto_error=True)

# ── Hackathon demo bypass ────────────────────────────────────────────────────
# ONLY works when ENVIRONMENT != production.  In production this token is
# rejected like any other invalid JWT.
_DEMO_TOKEN = "mock-jwt-token-for-hackathon"
_ENVIRONMENT = os.environ.get("ENVIRONMENT", "development").lower()


def create_access_token(
    data: dict,
    expires_delta: timedelta | None = None,
) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (
        expires_delta if expires_delta else timedelta(hours=ACCESS_TOKEN_EXPIRE_HOURS)
    )
    to_encode.update({"exp": expire, "iat": datetime.now(timezone.utc)})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Security(security),
) -> dict:
    """
    Validate the JWT token and return the user payload.

    In non-production environments, a static demo token is accepted
    for easy testing.  This bypass is **completely disabled** in production.
    """
    token = credentials.credentials

    # Demo bypass — development/staging only
    if token == _DEMO_TOKEN:
        if _ENVIRONMENT == "production":
            raise HTTPException(
                status_code=401,
                detail="Demo tokens are not accepted in production.",
            )
        return {"user_id": "demo-user", "role": "authenticated", "demo": True}

    # Real JWT validation
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str | None = payload.get("sub")
        if user_id is None:
            raise HTTPException(
                status_code=401,
                detail="Invalid authentication credentials",
            )
        return payload
    except JWTError:
        raise HTTPException(
            status_code=401,
            detail="Invalid authentication credentials",
        )
