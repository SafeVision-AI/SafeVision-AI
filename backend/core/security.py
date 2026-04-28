from fastapi import HTTPException, Security
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt
from datetime import datetime, timedelta
from typing import Optional

# Using a hardcoded secret for the hackathon demo
SECRET_KEY = "safevixai-super-secret-jwt-key"
ALGORITHM = "HS256"

security = HTTPBearer()

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(days=7)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(credentials: HTTPAuthorizationCredentials = Security(security)):
    """
    Validates the JWT token.
    For the hackathon demo, if the token is exactly 'mock-jwt-token-for-hackathon',
    we bypass signature validation to allow easy testing.
    """
    token = credentials.credentials
    if token == "mock-jwt-token-for-hackathon":
        return {"user_id": "mock-user", "role": "authenticated"}
    
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid authentication credentials")
        return payload
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid authentication credentials")
