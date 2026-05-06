from __future__ import annotations

import logging
import os
import secrets
from datetime import datetime, timedelta, timezone

from fastapi import HTTPException, Security
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt

logger = logging.getLogger(__name__)

# JWT secrets must come from environment in production. In development, an
# ephemeral key avoids shipping a static secret while keeping local auth usable.
_ENVIRONMENT = os.environ.get("ENVIRONMENT", "development").lower()
_env_secret = os.environ.get("JWT_SECRET_KEY")
if _env_secret:
    SECRET_KEY = _env_secret
elif _ENVIRONMENT == "production":
    raise RuntimeError("JWT_SECRET_KEY is required when ENVIRONMENT=production")
else:
    SECRET_KEY = secrets.token_urlsafe(64)
    logger.warning(
        "JWT_SECRET_KEY not set; generated an ephemeral key. "
        "Tokens will not survive server restarts."
    )

ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_HOURS = int(os.environ.get("ACCESS_TOKEN_EXPIRE_HOURS", "24"))

security = HTTPBearer(auto_error=True)


def create_access_token(
    data: dict,
    expires_delta: timedelta | None = None,
) -> str:
    to_encode = data.copy()
    now = datetime.now(timezone.utc)
    expire = now + (expires_delta if expires_delta else timedelta(hours=ACCESS_TOKEN_EXPIRE_HOURS))
    to_encode.update({"exp": expire, "iat": now})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Security(security),
) -> dict:
    """
    Validate the JWT token and return the user payload.

    Static demo tokens are not accepted. Use /api/v1/auth/login to issue a signed JWT.
    """
    token = credentials.credentials

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
