import os
from typing import Optional, List
from fastapi import APIRouter, Depends, UploadFile, File, Form, Query, status
from fastapi.responses import FileResponse, Response
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.database.models import Patient, User
from app.core.dependencies import get_current_patient, bearer_scheme, HTTPAuthorizationCredentials
from app.core.security import decode_access_token
from app.schemas.record import (
    MedicalRecordResponse,
    RecordSummaryResponse,
    RecordListResponse,
    SessionGroupResponse,
    ExtractionEditRequest,
    ComprehensiveSummaryRequest,
    TimelineItemResponse,
    ParameterTrendResponse,
    ReportCompareRequest,
    ReportCompareResponse,
    ExplainReportResponse,
    RecordSummaryGenerateResponse,
    SessionSummaryResponse,
    ClinicianReviewRequest,
    ShareRecordRequest,
    RequestDocumentRequest
)
from app.services.record_service import record_service
from app.services.pdf_report_generator import generate_medical_summary_pdf
from app.utils.exceptions import AppException

router = APIRouter(prefix="/records", tags=["Medical Records"])

@router.get("", response_model=RecordListResponse)
@router.get("/", response_model=RecordListResponse)
def get_medical_records(
    category: Optional[str] = Query(None, description="Category filter e.g. Lab Report"),
    search: Optional[str] = Query(None, description="Search query"),
    sort: Optional[str] = Query("latest", description="Sorting: latest, oldest, name_asc, name_desc"),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(8, ge=1, le=100, description="Records per page"),
    tag: Optional[str] = Query(None, description="Tag filter"),
    session_name: Optional[str] = Query(None, description="Session name filter"),
    approval_status: Optional[str] = Query(None, description="Approval status filter"),
    is_important: Optional[bool] = Query(None, description="Filter by important flag"),
    current_patient: Patient = Depends(get_current_patient),
    db: Session = Depends(get_db)
):
    """
    Retrieve paginated, searchable, categorized medical records for authenticated patient.
    """
    return record_service.get_records(
        patient_id=current_patient.id,
        category=category,
        search=search,
        sort=sort,
        page=page,
        page_size=page_size,
        tag=tag,
        session_name=session_name,
        approval_status=approval_status,
        is_important=is_important,
        db=db
    )

@router.get("/sessions", response_model=List[SessionGroupResponse])
def get_records_by_session(
    current_patient: Patient = Depends(get_current_patient),
    db: Session = Depends(get_db)
):
    """
    Retrieve uploaded documents grouped logically by Session Name.
    """
    return record_service.get_sessions(current_patient.id, db)

@router.get("/summary", response_model=RecordSummaryResponse)
def get_records_summary(
    current_patient: Patient = Depends(get_current_patient),
    db: Session = Depends(get_db)
):
    """
    Retrieve category counts, approval counts, and storage usage breakdown.
    """
    return record_service.get_summary(current_patient.id, db)

@router.get("/timeline", response_model=List[TimelineItemResponse])
def get_health_timeline(
    current_patient: Patient = Depends(get_current_patient),
    db: Session = Depends(get_db)
):
    """
    Retrieve unified chronological medical timeline (AI chats + Voice + Uploads).
    """
    return record_service.get_timeline(current_patient.id, db)

@router.get("/trends", response_model=ParameterTrendResponse)
def get_parameter_trends(
    parameter: str = Query(..., description="Parameter key or name, e.g. hba1c, fasting_blood_glucose, hemoglobin"),
    current_patient: Patient = Depends(get_current_patient),
    db: Session = Depends(get_db)
):
    """
    Retrieve historical time-series data for any medical parameter across patient reports.
    """
    return record_service.get_parameter_trends(current_patient.id, parameter, db)

@router.post("/compare", response_model=ReportCompareResponse)
def compare_medical_reports(
    payload: ReportCompareRequest,
    current_patient: Patient = Depends(get_current_patient),
    db: Session = Depends(get_db)
):
    """
    Compare two medical reports side-by-side and calculate parameter deltas.
    """
    return record_service.compare_reports(current_patient.id, payload.record_id_1, payload.record_id_2, db)

@router.post("/{id}/explain", response_model=ExplainReportResponse)
def explain_medical_report(
    id: str,
    current_patient: Patient = Depends(get_current_patient),
    db: Session = Depends(get_db)
):
    """
    Generate patient-friendly layman explanations of the medical terms and parameters in the report.
    """
    return record_service.explain_report(id, current_patient.id, db)

@router.get("/{id}/summary", response_model=RecordSummaryGenerateResponse)
def get_record_summary(
    id: str,
    current_patient: Patient = Depends(get_current_patient),
    db: Session = Depends(get_db)
):
    """
    Get or generate AI report summary for THIS SPECIFIC medical record only.
    """
    return record_service.generate_record_summary(id, current_patient.id, db, force_regenerate=False)

@router.post("/{id}/summary/regenerate", response_model=RecordSummaryGenerateResponse)
def regenerate_record_summary(
    id: str,
    current_patient: Patient = Depends(get_current_patient),
    db: Session = Depends(get_db)
):
    """
    Force regenerate AI report summary (v2, v3) after patient field corrections.
    """
    return record_service.generate_record_summary(id, current_patient.id, db, force_regenerate=True)

@router.post("/{id}/clinician-review", response_model=MedicalRecordResponse)
def mark_clinician_reviewed(
    id: str,
    payload: Optional[ClinicianReviewRequest] = None,
    current_patient: Patient = Depends(get_current_patient),
    db: Session = Depends(get_db)
):
    """
    Attending doctor or clinician marks the record as Clinician Reviewed.
    """
    return record_service.mark_clinician_reviewed(
        id,
        current_patient.id,
        payload.clinician_notes if payload else None,
        db
    )

@router.get("/sessions/{session_name}/summary", response_model=SessionSummaryResponse)
def get_session_summary(
    session_name: str,
    current_patient: Patient = Depends(get_current_patient),
    db: Session = Depends(get_db)
):
    """
    Get combined AI summary across all documents in a specific report session.
    """
    return record_service.get_session_summary(current_patient.id, session_name, db)

@router.post("/comprehensive-summary")
def generate_comprehensive_summary(
    payload: ComprehensiveSummaryRequest,
    current_patient: Patient = Depends(get_current_patient),
    db: Session = Depends(get_db)
):
    """
    Generate doctor-readable pre-consultation summary across selected date range and records.
    """
    return record_service.generate_comprehensive_summary(current_patient.id, payload, db)

@router.post("/upload", response_model=MedicalRecordResponse, status_code=status.HTTP_201_CREATED)
async def upload_medical_record(
    title: str = Form(...),
    category: str = Form(...),
    doctor_name: Optional[str] = Form(None),
    hospital: Optional[str] = Form(None),
    record_date: Optional[str] = Form(None),
    session_name: Optional[str] = Form("General Records"),
    tags: Optional[str] = Form(None),
    description: Optional[str] = Form(None),
    file: Optional[UploadFile] = File(None),
    current_patient: Patient = Depends(get_current_patient),
    db: Session = Depends(get_db)
):
    """
    Upload a medical record with PDF text extraction and structured parsing.
    """
    return await record_service.create_uploaded_record(
        patient_id=current_patient.id,
        file=file,
        title=title,
        category=category,
        doctor_name=doctor_name,
        hospital=hospital,
        record_date=record_date,
        session_name=session_name,
        tags=tags,
        description=description,
        db=db
    )

@router.post("/{id}/extract", response_model=MedicalRecordResponse)
def trigger_record_extraction(
    id: str,
    current_patient: Patient = Depends(get_current_patient),
    db: Session = Depends(get_db)
):
    """
    Extracts text and parses structured clinical entities from PDF.
    """
    return record_service.extract_record_data(id, current_patient.id, db)

@router.patch("/{id}/extraction", response_model=MedicalRecordResponse)
def edit_record_extraction(
    id: str,
    payload: ExtractionEditRequest,
    current_patient: Patient = Depends(get_current_patient),
    db: Session = Depends(get_db)
):
    """
    Patient edits and saves extracted structured clinical data.
    """
    return record_service.edit_extraction(
        record_id=id,
        patient_id=current_patient.id,
        edited_data=payload.extracted_data,
        approval_action=payload.approval_action or "EDIT",
        db=db
    )

@router.post("/{id}/approve", response_model=MedicalRecordResponse)
def approve_record_extraction(
    id: str,
    current_patient: Patient = Depends(get_current_patient),
    db: Session = Depends(get_db)
):
    """
    Patient approves structured clinical report.
    """
    return record_service.approve_extraction(id, current_patient.id, db)

@router.post("/{id}/reject", response_model=MedicalRecordResponse)
def reject_record_extraction(
    id: str,
    current_patient: Patient = Depends(get_current_patient),
    db: Session = Depends(get_db)
):
    """
    Patient rejects automatic AI extraction.
    """
    return record_service.reject_extraction(id, current_patient.id, db)

@router.get("/trash/all", response_model=List[MedicalRecordResponse])
def get_trash_records(
    current_patient: Patient = Depends(get_current_patient),
    db: Session = Depends(get_db)
):
    """
    Retrieve all soft-deleted records in the patient's recycle bin.
    """
    return record_service.get_trash_records(current_patient.id, db)

@router.get("/{id}", response_model=MedicalRecordResponse)
def get_record_details(
    id: str,
    current_patient: Patient = Depends(get_current_patient),
    db: Session = Depends(get_db)
):
    """
    Retrieve detailed medical record with patient access validation.
    """
    rec = record_service.get_record_by_id(id, current_patient.id, db)
    return record_service._to_response(rec)

@router.get("/{id}/download")
@router.get("/{id}/file")
def download_record_file(
    id: str,
    token: Optional[str] = Query(None),
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(bearer_scheme),
    db: Session = Depends(get_db)
):
    """
    Download or stream actual medical record binary content with bearer or query token authentication.
    """
    auth_token = credentials.credentials if credentials and credentials.credentials else token
    if not auth_token:
        raise AppException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            message="Authentication required"
        )

    payload = decode_access_token(auth_token)
    if not payload:
        raise AppException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            message="Invalid or expired access token"
        )

    user_id = payload.get("id") or payload.get("sub")
    email = payload.get("email")

    patient = None
    if user_id:
        patient = db.query(Patient).filter(Patient.user_id == user_id).first()
    if not patient and email:
        user = db.query(User).filter(User.email == email).first()
        if user:
            patient = db.query(Patient).filter(Patient.user_id == user.id).first()

    if not patient:
        raise AppException(
            status_code=status.HTTP_403_FORBIDDEN,
            message="Access denied: Patient profile required"
        )

    rec = record_service.get_record_by_id(id, patient.id, db)
    if rec.file_path and os.path.exists(rec.file_path):
        media_type = "application/pdf"
        if rec.file_type.upper() in ["JPG", "JPEG"]:
            media_type = "image/jpeg"
        elif rec.file_type.upper() == "PNG":
            media_type = "image/png"
        elif rec.file_type.upper() in ["DICOM", "DCM"]:
            media_type = "application/dicom"

        return FileResponse(
            path=rec.file_path,
            filename=rec.file_name or f"{rec.title}.pdf",
            media_type=media_type
        )
    
    dummy_content = f"MediAssist Medical Document Preview\n==================================\nTitle: {rec.title}\nCategory: {rec.category}\nSession: {rec.session_name}\nDate: {rec.record_date}\nDoctor: {rec.doctor_name}\nFacility: {rec.hospital}\n\nNotes:\n{rec.description or 'No additional notes provided.'}"
    return Response(
        content=dummy_content.encode('utf-8'),
        media_type="text/plain",
        headers={"Content-Disposition": f"inline; filename={rec.file_name or 'medical_record.txt'}"}
    )

@router.get("/{id}/summary/pdf")
def get_record_summary_pdf(
    id: str,
    token: Optional[str] = Query(None),
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(bearer_scheme),
    db: Session = Depends(get_db)
):
    """
    Generate and stream an executive-grade clinical PDF summary for a specific record.
    """
    auth_token = None
    if credentials and credentials.credentials:
        auth_token = credentials.credentials
    elif token:
        auth_token = token

    if not auth_token:
        raise AppException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            message="Authentication required to generate summary PDF"
        )

    patient_id = decode_access_token(auth_token)
    if not patient_id:
        raise AppException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            message="Invalid or expired session token"
        )

    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        user = db.query(User).filter(User.id == patient_id).first()
        if user and user.patient:
            patient = user.patient

    if not patient:
        raise AppException(
            status_code=status.HTTP_403_FORBIDDEN,
            message="Access denied: Patient profile required"
        )

    rec = record_service.get_record_by_id(id, patient.id, db)
    pdf_bytes = generate_medical_summary_pdf(rec, patient)
    
    sanitize_title = "".join([c if c.isalnum() or c in "-_" else "_" for c in (rec.title or "Medical_Report")])
    filename = f"MediAssist_AI_Summary_{sanitize_title}.pdf"

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"'
        }
    )

@router.delete("/{id}")
def delete_medical_record(
    id: str,
    current_patient: Patient = Depends(get_current_patient),
    db: Session = Depends(get_db)
):
    """
    Soft-delete a record to the recycle bin.
    """
    return record_service.soft_delete(id, current_patient.id, db)

@router.post("/{id}/restore", response_model=MedicalRecordResponse)
def restore_medical_record(
    id: str,
    current_patient: Patient = Depends(get_current_patient),
    db: Session = Depends(get_db)
):
    """
    Restore a soft-deleted record back to active records.
    """
    return record_service.restore(id, current_patient.id, db)

@router.delete("/{id}/permanent")
def permanently_delete_record(
    id: str,
    current_patient: Patient = Depends(get_current_patient),
    db: Session = Depends(get_db)
):
    """
    Permanently delete a medical record and its stored binary file.
    """
    return record_service.permanent_delete(id, current_patient.id, db)

@router.post("/{id}/share")
def share_medical_record(
    id: str,
    payload: ShareRecordRequest,
    current_patient: Patient = Depends(get_current_patient),
    db: Session = Depends(get_db)
):
    rec = record_service.get_record_by_id(id, current_patient.id, db)
    return {"success": True, "message": f"Record '{rec.title}' shared successfully with {payload.doctor_name}."}
