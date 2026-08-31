import json
from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from app.models.patient_portal import ClinicalHistory
from app.schemas.history import ClinicalHistoryResponse, ClinicalHistoryUpdate
from app.utils.exceptions import AppException
from fastapi import status

class HistoryService:
    @staticmethod
    def get_patient_histories(patient_id: str, db: Session) -> List[ClinicalHistoryResponse]:
        histories = db.query(ClinicalHistory).filter(ClinicalHistory.patient_id == patient_id).order_by(ClinicalHistory.generated_at.desc()).all()
        return [HistoryService._to_response(h) for h in histories]

    @staticmethod
    def get_history_by_id(history_id: str, patient_id: str, db: Session) -> ClinicalHistoryResponse:
        history = db.query(ClinicalHistory).filter(ClinicalHistory.id == history_id).first()
        if not history:
            raise AppException(status_code=status.HTTP_404_NOT_FOUND, message="Clinical history not found.")
        if history.patient_id != patient_id:
            raise AppException(status_code=status.HTTP_403_FORBIDDEN, message="Access denied to this clinical record.")
        return HistoryService._to_response(history)

    @staticmethod
    def get_history_by_consultation(consultation_id: str, patient_id: str, db: Session) -> ClinicalHistoryResponse:
        history = db.query(ClinicalHistory).filter(ClinicalHistory.consultation_id == consultation_id).first()
        if not history:
            raise AppException(status_code=status.HTTP_404_NOT_FOUND, message="No clinical history record for this consultation.")
        if history.patient_id != patient_id:
            raise AppException(status_code=status.HTTP_403_FORBIDDEN, message="Access denied to this clinical record.")
        return HistoryService._to_response(history)

    @staticmethod
    def update_history(history_id: str, patient_id: str, update_data: ClinicalHistoryUpdate, db: Session) -> ClinicalHistoryResponse:
        history = db.query(ClinicalHistory).filter(ClinicalHistory.id == history_id).first()
        if not history:
            raise AppException(status_code=status.HTTP_404_NOT_FOUND, message="Clinical history not found.")
        if history.patient_id != patient_id:
            raise AppException(status_code=status.HTTP_403_FORBIDDEN, message="Access denied to update this record.")

        if update_data.chief_complaint is not None:
            history.chief_complaint = update_data.chief_complaint
        if update_data.history_of_present_illness is not None:
            history.history_of_present_illness = update_data.history_of_present_illness
        if update_data.past_history is not None:
            history.past_history = update_data.past_history
        if update_data.medications is not None:
            history.medications = json.dumps(update_data.medications)
        if update_data.allergies is not None:
            history.allergies = json.dumps(update_data.allergies)

        # Update provenance tracking
        prov_list = json.loads(history.provenance) if history.provenance else []
        prov_list.append({"source": "PATIENT_CORRECTED", "updated_at": str(history.updated_at), "verified": False})
        history.provenance = json.dumps(prov_list)

        db.commit()
        db.refresh(history)
        return HistoryService._to_response(history)

    @staticmethod
    def _to_response(h: ClinicalHistory) -> ClinicalHistoryResponse:
        return ClinicalHistoryResponse(
            id=h.id,
            patient_id=h.patient_id,
            consultation_id=h.consultation_id,
            chief_complaint=h.chief_complaint,
            history_of_present_illness=h.history_of_present_illness,
            past_history=h.past_history,
            medications=json.loads(h.medications) if h.medications else [],
            allergies=json.loads(h.allergies) if h.allergies else [],
            family_history=h.family_history,
            personal_history=h.personal_history,
            review_of_systems=json.loads(h.review_of_systems) if h.review_of_systems else {},
            provenance=json.loads(h.provenance) if h.provenance else [],
            generated_at=h.generated_at.isoformat() if h.generated_at else "",
            updated_at=h.updated_at.isoformat() if h.updated_at else "",
        )

history_service = HistoryService()
