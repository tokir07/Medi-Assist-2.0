import json
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database.database import get_db
from app.database.models import User, Patient, UserRole
from app.schemas.auth import PatientOnboardingRequest, UserResponse
from app.core.dependencies import get_current_user

router = APIRouter(prefix="/patients", tags=["Patient Onboarding & Profile"])

@router.post("/onboarding", response_model=UserResponse)
def complete_onboarding(
    payload: PatientOnboardingRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Save patient onboarding profile data and set is_onboarded = True.
    """
    if current_user.role != UserRole.PATIENT:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only patient accounts can complete patient onboarding.",
        )

    # Find or create patient profile
    patient_record = db.query(Patient).filter(Patient.user_id == current_user.id).first()
    if not patient_record:
        patient_record = Patient(user_id=current_user.id)
        db.add(patient_record)

    # Update patient fields
    if payload.fullName and payload.fullName != current_user.name:
        current_user.name = payload.fullName

    if payload.phone:
        patient_record.phone = payload.phone
    if payload.dateOfBirth:
        patient_record.date_of_birth = payload.dateOfBirth
    if payload.gender:
        patient_record.gender = payload.gender
    if payload.bloodGroup:
        patient_record.blood_group = payload.bloodGroup
    if payload.address:
        patient_record.address = payload.address
    if payload.city:
        patient_record.city = payload.city
    if payload.state:
        patient_record.state = payload.state
    if payload.postalCode:
        patient_record.postal_code = payload.postalCode
    if payload.country:
        patient_record.country = payload.country
    if payload.maritalStatus:
        patient_record.marital_status = payload.maritalStatus
    if payload.chronicConditions:
        patient_record.chronic_conditions = payload.chronicConditions
    if payload.currentMedications:
        patient_record.current_medications = payload.currentMedications
    if payload.primaryPhysician:
        patient_record.primary_physician = payload.primaryPhysician

    if isinstance(payload.allergies, str):
        patient_record.allergies = payload.allergies
    elif isinstance(payload.allergies, list):
        parsed_al = [a.get('name') if isinstance(a, dict) else str(a) for a in payload.allergies]
        patient_record.allergies = ", ".join(parsed_al)

    if payload.emergencyContact:
        patient_record.emergency_contact = json.dumps(payload.emergencyContact.model_dump())

    # Mark user as onboarded
    current_user.is_onboarded = True

    db.commit()
    db.refresh(current_user)

    return UserResponse.model_validate(current_user)

@router.get("/profile")
def get_patient_profile(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Retrieve full patient profile data.
    """
    patient_record = db.query(Patient).filter(Patient.user_id == current_user.id).first()
    history = json.loads(patient_record.medical_history) if patient_record and patient_record.medical_history else {}
    emergency = json.loads(patient_record.emergency_contact) if patient_record and patient_record.emergency_contact else {}

    return {
        "user": UserResponse.model_validate(current_user),
        "date_of_birth": patient_record.date_of_birth if patient_record else None,
        "gender": patient_record.gender if patient_record else None,
        "blood_group": patient_record.blood_group if patient_record else None,
        "emergency_contact": emergency,
        "medical_history": history,
    }
