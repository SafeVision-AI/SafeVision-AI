import uuid
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_db
from core.security import get_current_user
from models.schemas import UserProfileCreate, UserProfileResponse, UserProfileUpdate
from models.user import UserProfile


router = APIRouter(prefix="/api/v1/users", tags=["Users"])


@router.post("/", response_model=UserProfileResponse, status_code=status.HTTP_201_CREATED)
async def create_user_profile(
    profile_data: UserProfileCreate,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
) -> Any:
    """Create a new emergency user profile."""
    contacts = [contact.model_dump() for contact in profile_data.emergency_contacts]
    
    db_profile = UserProfile(
        user_id=str(current_user["sub"]),
        name=profile_data.name,
        blood_group=profile_data.blood_group,
        emergency_contacts=contacts,
        allergies=profile_data.allergies,
        vehicle_details=profile_data.vehicle_details,
        medical_notes=profile_data.medical_notes,
    )
    db.add(db_profile)
    await db.commit()
    await db.refresh(db_profile)
    return db_profile


@router.get("/{user_id}", response_model=UserProfileResponse)
async def get_user_profile(
    user_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
) -> Any:
    """Fetch the caller's emergency profile by ID."""
    result = await db.execute(
        select(UserProfile).where(UserProfile.id == user_id, UserProfile.user_id == str(current_user["sub"]))
    )
    profile = result.scalar_one_or_none()
    
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Emergency profile not found"
        )
    return profile


@router.put("/{user_id}", response_model=UserProfileResponse)
async def update_user_profile(
    user_id: uuid.UUID,
    profile_update: UserProfileUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
) -> Any:
    """Update an existing emergency user profile."""
    result = await db.execute(
        select(UserProfile).where(UserProfile.id == user_id, UserProfile.user_id == str(current_user["sub"]))
    )
    profile = result.scalar_one_or_none()
    
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Emergency profile not found"
        )
    
    update_data = profile_update.model_dump(exclude_unset=True)
    
    if "emergency_contacts" in update_data and update_data["emergency_contacts"] is not None:
        update_data["emergency_contacts"] = [contact for contact in update_data["emergency_contacts"]]

    for key, value in update_data.items():
        setattr(profile, key, value)
        
    await db.commit()
    await db.refresh(profile)
    return profile
