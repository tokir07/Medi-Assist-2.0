import os
from typing import Optional, List
from fastapi import APIRouter, Depends, UploadFile, File, Form, Query, status
from fastapi.responses import FileResponse, Response
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.database.models import Patient
from app.core.dependencies import get_current_patient
from app.schemas.prescription import (
    PrescriptionResponse,
    PrescriptionSummaryResponse,
    PrescriptionListResponse,
    PrescriptionCreate,
    PrescriptionEditRequest,
    DuplicateCheckRequest,
    DuplicateCheckResponse,
    MedicationReminderResponse,
    MedicationReminderCreate,
    RefillRequestPayload,
    RequestPrescriptionPayload
)
from app.services.prescription_service import prescription_service
from app.services.record_service import record_service
from app.utils.exceptions import AppException

router = APIRouter(prefix="/prescriptions", tags=["Prescriptions & Medications"])

@router.get("", response_model=PrescriptionListResponse)
@router.get("/", response_model=PrescriptionListResponse)
def get_prescriptions(
    tab: Optional[str] = Query("All Prescriptions", description="Status tab e.g. All Prescriptions, Active, Completed, Expired, Refills"),
    search: Optional[str] = Query(None, description="Search term for medicines, doctors, instructions"),
    sort: Optional[str] = Query("latest", description="Sorting: latest, oldest, name_asc, name_desc"),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(8, ge=1, le=50, description="Page size"),
    doctor: Optional[str] = Query(None, description="Filter by doctor name"),
    current_patient: Patient = Depends(get_current_patient),
    db: Session = Depends(get_db)
):
    """
    Retrieve paginated, searchable, categorized prescription list for the authenticated patient.
    """
    return prescription_service.get_prescriptions(
        patient_id=current_patient.id,
        tab=tab or "All Prescriptions",
        search=search,
        sort=sort or "latest",
        page=page,
        page_size=page_size,
        doctor=doctor,
        db=db
    )

@router.get("/summary", response_model=PrescriptionSummaryResponse)
def get_prescription_summary(
    current_patient: Patient = Depends(get_current_patient),
    db: Session = Depends(get_db)
):
    """
    Retrieve aggregated counts (Total, Active, Completed, Expired, Need Refills, This Month).
    """
    return prescription_service.get_summary(current_patient.id, db)

@router.post("/check-duplicate", response_model=DuplicateCheckResponse)
def check_duplicate_prescription(
    payload: DuplicateCheckRequest,
    current_patient: Patient = Depends(get_current_patient),
    db: Session = Depends(get_db)
):
    """
    Check if a similar prescription already exists for the patient.
    """
    return prescription_service.check_duplicate(current_patient.id, payload, db)

@router.post("", response_model=PrescriptionResponse, status_code=status.HTTP_201_CREATED)
@router.post("/", response_model=PrescriptionResponse, status_code=status.HTTP_201_CREATED)
def create_manual_prescription(
    payload: PrescriptionCreate,
    current_patient: Patient = Depends(get_current_patient),
    db: Session = Depends(get_db)
):
    """
    Create a new manually entered medical prescription.
    """
    return prescription_service.create_manual_prescription(
        patient_id=current_patient.id,
        payload=payload,
        db=db
    )

@router.post("/upload", response_model=PrescriptionResponse, status_code=status.HTTP_201_CREATED)
async def upload_prescription_document(
    title: Optional[str] = Form(None),
    doctor_name: Optional[str] = Form("Dr. Priya Sharma"),
    hospital: Optional[str] = Form("MediAssist Medical Center"),
    record_date: Optional[str] = Form(None),
    session_name: Optional[str] = Form("General Records"),
    description: Optional[str] = Form(None),
    file: Optional[UploadFile] = File(None),
    current_patient: Patient = Depends(get_current_patient),
    db: Session = Depends(get_db)
):
    """
    Upload and register a new medical prescription with automatic record creation and medication extraction.
    """
    # 1. Create source MedicalRecord
    record_res = await record_service.create_uploaded_record(
        patient_id=current_patient.id,
        file=file,
        title=title or (f"Prescription - {doctor_name}" if doctor_name else "Prescription Document"),
        category="Prescription",
        doctor_name=doctor_name,
        hospital=hospital,
        record_date=record_date,
        session_name=session_name or "General Records",
        tags='["Prescription", "Medications"]',
        description=description,
        db=db
    )

    # 2. Retrieve the record object and sync/create the structured Prescription
    from app.models.medical_record import MedicalRecord
    rec = db.query(MedicalRecord).filter(MedicalRecord.id == record_res.id).first()
    if not rec:
        raise AppException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, message="Failed to store source record")

    presc = prescription_service.sync_prescription_from_record(rec, db)
    if not presc:
        # Fallback manual creation with record link
        create_payload = PrescriptionCreate(
            record_id=rec.id,
            title=rec.title,
            session_name=rec.session_name,
            doctor_name=rec.doctor_name,
            hospital=rec.hospital,
            prescribed_date=rec.record_date,
            medication_name="Prescribed Medication",
            dosage="1 tablet",
            frequency="Twice daily",
            duration="7 days",
            instructions="Take with water as directed."
        )
        return prescription_service.create_manual_prescription(current_patient.id, create_payload, db)

    return prescription_service._to_response(presc, db)

@router.get("/reminders/all", response_model=List[MedicationReminderResponse])
def get_medication_reminders(
    current_patient: Patient = Depends(get_current_patient),
    db: Session = Depends(get_db)
):
    """
    Retrieve daily medication reminder dose schedule for the patient.
    """
    return prescription_service.get_medication_reminders(current_patient.id, db)

@router.post("/reminders/create", response_model=MedicationReminderResponse, status_code=status.HTTP_201_CREATED)
def create_medication_reminder(
    payload: MedicationReminderCreate,
    current_patient: Patient = Depends(get_current_patient),
    db: Session = Depends(get_db)
):
    """
    Create a new dose reminder linked to a prescription.
    """
    return prescription_service.add_medication_reminder(current_patient.id, payload, db)

@router.patch("/reminders/{id}/toggle", response_model=MedicationReminderResponse)
def toggle_medication_reminder(
    id: str,
    current_patient: Patient = Depends(get_current_patient),
    db: Session = Depends(get_db)
):
    """
    Toggle is_taken status for a medication dose.
    """
    return prescription_service.toggle_reminder_status(id, current_patient.id, db)

@router.delete("/reminders/{id}")
def delete_medication_reminder(
    id: str,
    current_patient: Patient = Depends(get_current_patient),
    db: Session = Depends(get_db)
):
    """
    Remove a medication reminder schedule.
    """
    return prescription_service.delete_reminder(id, current_patient.id, db)

@router.get("/{id}", response_model=PrescriptionResponse)
def get_prescription_details(
    id: str,
    current_patient: Patient = Depends(get_current_patient),
    db: Session = Depends(get_db)
):
    """
    Retrieve detailed single prescription with patient access authorization.
    """
    p = prescription_service.get_prescription_by_id(id, current_patient.id, db)
    return prescription_service._to_response(p, db)

@router.patch("/{id}", response_model=PrescriptionResponse)
def edit_prescription_details(
    id: str,
    payload: PrescriptionEditRequest,
    current_patient: Patient = Depends(get_current_patient),
    db: Session = Depends(get_db)
):
    """
    Edit and update prescription medications and metadata.
    """
    return prescription_service.edit_prescription(id, current_patient.id, payload, db)

@router.post("/{id}/approve", response_model=PrescriptionResponse)
def approve_prescription(
    id: str,
    current_patient: Patient = Depends(get_current_patient),
    db: Session = Depends(get_db)
):
    """
    Patient approves the extracted prescription details.
    """
    return prescription_service.approve_prescription(id, current_patient.id, db)

@router.post("/{id}/review", response_model=PrescriptionResponse)
def mark_prescription_clinician_reviewed(
    id: str,
    clinician_notes: Optional[str] = Query(None),
    current_patient: Patient = Depends(get_current_patient),
    db: Session = Depends(get_db)
):
    """
    Attending clinician marks prescription as verified.
    """
    return prescription_service.mark_clinician_reviewed(id, current_patient.id, clinician_notes, db)

@router.delete("/{id}")
def delete_prescription(
    id: str,
    current_patient: Patient = Depends(get_current_patient),
    db: Session = Depends(get_db)
):
    """
    Soft-delete a prescription record.
    """
    return prescription_service.delete_prescription(id, current_patient.id, db)
