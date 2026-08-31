from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database.database import get_db
from app.database.models import User, Patient
from app.core.dependencies import get_current_user, get_current_patient
from app.schemas.profile import PatientProfileResponse, PatientProfileUpdate, ChangePasswordRequest
from app.services.profile_service import profile_service

router = APIRouter(tags=["Patient Profile"])

@router.get("/v1/profile", response_model=PatientProfileResponse)
@router.get("/profile", response_model=PatientProfileResponse)
async def get_profile(
    current_user: User = Depends(get_current_user),
    current_patient: Patient = Depends(get_current_patient)
):
    """
    Retrieve current Patient Profile details with Redis caching and PostgreSQL fallback.
    """
    return await profile_service.get_patient_profile_async(current_user, current_patient)

@router.patch("/v1/profile", response_model=PatientProfileResponse)
@router.patch("/profile", response_model=PatientProfileResponse)
@router.put("/v1/profile", response_model=PatientProfileResponse)
@router.put("/profile", response_model=PatientProfileResponse)
async def update_profile(
    update_data: PatientProfileUpdate,
    current_user: User = Depends(get_current_user),
    current_patient: Patient = Depends(get_current_patient),
    db: Session = Depends(get_db)
):
    """
    Update Patient Profile details and invalidate associated Redis cache.
    """
    return await profile_service.update_patient_profile_async(current_user, current_patient, update_data, db)

@router.post("/profile/change-password")
async def change_password(
    payload: ChangePasswordRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Update user password securely.
    """
    try:
        success = profile_service.change_password(current_user, payload, db)
        if not success:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Current password is incorrect")
        return {"success": True, "message": "Password updated successfully"}
    except ValueError as ve:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(ve))
