from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from datetime import timedelta
from ..core.security import create_access_token

router = APIRouter(prefix="/api/v1/auth", tags=["auth"])

class LoginRequest(BaseModel):
    email: str
    password: str

class LoginResponse(BaseModel):
    access_token: str
    token_type: str
    operator_name: str

# Demo credentials for hackathon
DEMO_USERS = {
    "demo@safevixai.app": {"password": "SafeVixAI@2024", "name": "Demo Operator"},
    "admin@safevixai.app": {"password": "admin123", "name": "Admin Sentinel"},
    "iitm@safevixai.app": {"password": "iitm2024", "name": "IITM Evaluator"},
}

@router.post("/login", response_model=LoginResponse)
async def login(body: LoginRequest):
    user = DEMO_USERS.get(body.email.lower())
    if not user or user["password"] != body.password:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    token = create_access_token(
        data={"sub": body.email, "name": user["name"]},
        expires_delta=timedelta(days=7)
    )
    return LoginResponse(
        access_token=token,
        token_type="bearer",
        operator_name=user["name"]
    )

@router.get("/verify")
async def verify_token():
    """Simple health check for auth service"""
    return {"status": "auth_service_online"}
