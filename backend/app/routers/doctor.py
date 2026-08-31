from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.database.models import User, UserRole
from app.core.dependencies import get_current_user, require_roles
from app.services.doctor_service import doctor_service
from app.schemas.doctor_schema import (
    DoctorDashboardResponse,
    DoctorAppointmentRejectRequest,
    DoctorEmergencyCancelRequest,
    DoctorBlockSlotRequest,
    DoctorDayOffRequest,
    DoctorDayOffResponse,
    DoctorScheduleConfig,
    DoctorPatientSummary,
    DoctorPatientDetail,
    DoctorConsultationSubmit,
    DigitalPrescriptionCreate,
    ImagePrescriptionCreate,
    PrescriptionTemplateItem,
    PatientReminderCreate,
    DoctorQuickAIRequest,
    DoctorQuickAIResponse,
)

router = APIRouter(prefix="/doctor", tags=["Doctor Portal"])

@router.get("/test")
def doctor_test_endpoint(current_user: User = Depends(require_roles([UserRole.DOCTOR]))):
    return {
        "message": "Doctor endpoint accessed successfully",
        "role": current_user.role.value if hasattr(current_user.role, 'value') else str(current_user.role),
        "user": current_user.name
    }

@router.get("/dashboard", response_model=DoctorDashboardResponse)
def get_doctor_dashboard(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return doctor_service.get_dashboard(db, current_user)

@router.post("/availability")
def set_doctor_availability(
    is_available: bool = Query(..., description="Availability status"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return doctor_service.set_availability(db, current_user, is_available)

@router.get("/appointments")
def get_doctor_appointments(
    tab: Optional[str] = Query("Today", description="Tab: Today, Upcoming, Pending, Completed, Cancelled, All"),
    search: Optional[str] = Query(None, description="Search by patient name or reason"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return doctor_service.get_appointments(db, current_user, tab=tab or "Today", search=search)

@router.post("/appointments/{appointment_id}/accept")
def accept_appointment(
    appointment_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return doctor_service.accept_appointment(db, current_user, appointment_id)

@router.post("/appointments/{appointment_id}/reject")
def reject_appointment(
    appointment_id: str,
    payload: DoctorAppointmentRejectRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return doctor_service.reject_appointment(db, current_user, appointment_id, payload)

@router.post("/appointments/{appointment_id}/no-show")
def mark_no_show(
    appointment_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return doctor_service.mark_no_show(db, current_user, appointment_id)

@router.post("/appointments/{appointment_id}/cancel")
def emergency_cancel_appointment(
    appointment_id: str,
    payload: DoctorEmergencyCancelRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return doctor_service.emergency_cancel_appointment(db, current_user, appointment_id, payload)

@router.post("/slots/block")
def block_time_slot(
    payload: DoctorBlockSlotRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return doctor_service.block_time_slot(db, current_user, payload)

@router.post("/day-off", response_model=DoctorDayOffResponse)
def set_day_off(
    payload: DoctorDayOffRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return doctor_service.set_day_off(db, current_user, payload)

@router.get("/schedule/config", response_model=DoctorScheduleConfig)
def get_schedule_config(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return doctor_service.get_schedule_config(db, current_user)

@router.post("/schedule/config", response_model=DoctorScheduleConfig)
def update_schedule_config(
    payload: DoctorScheduleConfig,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return doctor_service.update_schedule_config(db, current_user, payload)

@router.get("/prescription-templates", response_model=List[PrescriptionTemplateItem])
def get_prescription_templates():
    return doctor_service.get_prescription_templates()

@router.get("/patients", response_model=List[DoctorPatientSummary])
def get_doctor_patients(
    search: Optional[str] = Query(None, description="Search patient name or condition"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return doctor_service.get_doctor_patients(db, current_user, search=search)

@router.get("/patients/{patient_id}", response_model=DoctorPatientDetail)
def get_patient_detail(
    patient_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return doctor_service.get_patient_detail(db, current_user, patient_id)

@router.post("/consultation/submit")
def submit_consultation(
    payload: DoctorConsultationSubmit,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return doctor_service.submit_consultation(db, current_user, payload)

@router.post("/prescriptions/digital")
def create_digital_prescription(
    payload: DigitalPrescriptionCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return doctor_service.create_digital_prescription(db, current_user, payload)

@router.post("/prescriptions/image")
def create_image_prescription(
    payload: ImagePrescriptionCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return doctor_service.create_image_prescription(db, current_user, payload)

@router.post("/reminders")
def send_patient_reminder(
    payload: PatientReminderCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return doctor_service.send_patient_reminder(db, current_user, payload)

@router.get("/schedule-config", response_model=DoctorScheduleConfig)
def get_schedule_config(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return doctor_service.get_schedule_config(db, current_user)

@router.post("/quick-ai", response_model=DoctorQuickAIResponse)
def doctor_quick_ai(
    payload: DoctorQuickAIRequest,
    current_user: User = Depends(get_current_user)
):
    return doctor_service.process_doctor_quick_ai(payload.query, payload.patient_id)
