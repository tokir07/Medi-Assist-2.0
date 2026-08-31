from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database.database import get_db
from app.database.models import Patient
from app.core.dependencies import get_current_patient
from app.schemas.history import ClinicalHistoryResponse, ClinicalHistoryUpdate
from app.services.history_service import history_service

router = APIRouter(tags=["Clinical History"])

@router.get("/v1/history", response_model=List[ClinicalHistoryResponse])
@router.get("/history", response_model=List[ClinicalHistoryResponse])
def get_clinical_histories(
    current_patient: Patient = Depends(get_current_patient),
    db: Session = Depends(get_db)
):
    """
    Retrieve clinical history records for the authenticated patient.
    """
    return history_service.get_patient_histories(current_patient.id, db)

@router.get("/v1/history/{id}", response_model=ClinicalHistoryResponse)
@router.get("/history/{id}", response_model=ClinicalHistoryResponse)
def get_clinical_history_by_id(
    id: str,
    current_patient: Patient = Depends(get_current_patient),
    db: Session = Depends(get_db)
):
    """
    Retrieve detailed clinical history record by ID.
    """
    return history_service.get_history_by_id(id, current_patient.id, db)

@router.get("/v1/history/consultation/{consultation_id}", response_model=ClinicalHistoryResponse)
@router.get("/history/consultation/{consultation_id}", response_model=ClinicalHistoryResponse)
def get_clinical_history_by_consultation(
    consultation_id: str,
    current_patient: Patient = Depends(get_current_patient),
    db: Session = Depends(get_db)
):
    """
    Retrieve clinical history generated for a specific consultation.
    """
    return history_service.get_history_by_consultation(consultation_id, current_patient.id, db)

@router.patch("/v1/history/{id}", response_model=ClinicalHistoryResponse)
@router.patch("/history/{id}", response_model=ClinicalHistoryResponse)
def update_clinical_history(
    id: str,
    update_data: ClinicalHistoryUpdate,
    current_patient: Patient = Depends(get_current_patient),
    db: Session = Depends(get_db)
):
    """
    Allow patient correction to permitted clinical history fields while maintaining provenance.
    """
    return history_service.update_history(id, current_patient.id, update_data, db)
