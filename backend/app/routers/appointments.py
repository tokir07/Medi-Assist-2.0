from typing import Optional, List
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.database.models import Patient, User
from app.core.dependencies import get_current_patient, get_current_user
from app.utils.exceptions import AppException
from app.schemas.doctor_schema import DoctorAppointmentRejectRequest
from app.services.doctor_service import doctor_service
from app.schemas.appointment import (
    AppointmentResponse,
    AppointmentSummaryResponse,
    AppointmentListResponse,
    AppointmentCreate,
    AppointmentReschedule,
    AppointmentCancel,
    DoctorInfo,
    AvailableSlotResponse,
    HospitalInfo,
    CalendarMonthResponse,
    RecommendationItem,
    DoctorHealthMessageResponse,
    DoctorHealthMessageCreate
)
from app.services.appointment_service import appointment_service

router = APIRouter(prefix="/appointments", tags=["Patient Appointments"])

@router.get("", response_model=AppointmentListResponse)
@router.get("/", response_model=AppointmentListResponse)
def get_appointments(
    tab: Optional[str] = Query("Upcoming", description="Tab filter: Upcoming, Past, Cancelled, All"),
    search: Optional[str] = Query(None, description="Search term for doctor, hospital, specialty, type"),
    sort: Optional[str] = Query("earliest", description="Sort by: earliest, latest, doctor_asc, status"),
    specialty: Optional[str] = Query(None, description="Specialty filter"),
    doctor: Optional[str] = Query(None, description="Doctor name filter"),
    hospital: Optional[str] = Query(None, description="Hospital filter"),
    date: Optional[str] = Query(None, description="Date filter YYYY-MM-DD"),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(10, ge=1, le=100, description="Items per page"),
    current_patient: Patient = Depends(get_current_patient),
    db: Session = Depends(get_db)
):
    """
    Retrieve paginated, searchable, categorized patient appointments from PostgreSQL.
    """
    return appointment_service.get_appointments(
        patient_id=current_patient.id,
        tab=tab,
        search=search,
        sort=sort or "earliest",
        specialty=specialty,
        doctor=doctor,
        hospital=hospital,
        date=date,
        page=page,
        page_size=page_size,
        db=db
    )

@router.get("/summary", response_model=AppointmentSummaryResponse)
def get_summary(
    current_patient: Patient = Depends(get_current_patient),
    db: Session = Depends(get_db)
):
    """
    Retrieve aggregated appointment statistics from real database data.
    """
    return appointment_service.get_summary(current_patient.id, db)

@router.get("/calendar", response_model=CalendarMonthResponse)
def get_calendar(
    year: int = Query(..., description="Year e.g. 2026"),
    month: int = Query(..., ge=1, le=12, description="Month 1-12"),
    current_patient: Patient = Depends(get_current_patient),
    db: Session = Depends(get_db)
):
    """
    Retrieve calendar days for a given month with appointment status indicators.
    """
    return appointment_service.get_calendar_events(current_patient.id, year, month, db)

@router.get("/doctors", response_model=List[DoctorInfo])
def get_doctors(db: Session = Depends(get_db)):
    """
    Retrieve list of available doctors and specialists from database.
    """
    return appointment_service.get_doctors(db)

@router.get("/slots", response_model=AvailableSlotResponse)
def get_available_slots(
    doctor_name: str = Query(..., description="Doctor's full name"),
    date: str = Query(..., description="Date YYYY-MM-DD"),
    db: Session = Depends(get_db)
):
    """
    Retrieve real-time available time slots for a doctor on a specific date.
    """
    return appointment_service.get_slots(doctor_name, date, db)

@router.get("/hospitals", response_model=List[HospitalInfo])
def get_hospitals():
    """
    Retrieve list of affiliated hospitals and clinics.
    """
    return appointment_service.get_hospitals()

@router.get("/recommendations", response_model=List[RecommendationItem])
def get_recommendations():
    """
    Retrieve personalized health suggestions.
    """
    return appointment_service.get_recommendations()

@router.get("/messages/all", response_model=List[DoctorHealthMessageResponse])
def get_all_doctor_messages(
    current_patient: Patient = Depends(get_current_patient),
    db: Session = Depends(get_db)
):
    """
    Retrieve all clinical health advice messages sent by doctors to the patient.
    """
    return appointment_service.get_all_doctor_messages(current_patient.id, db)

@router.post("/messages", response_model=DoctorHealthMessageResponse, status_code=status.HTTP_201_CREATED)
def send_doctor_message(
    payload: DoctorHealthMessageCreate,
    current_patient: Patient = Depends(get_current_patient),
    db: Session = Depends(get_db)
):
    """
    Send or record clinical advice/message from doctor to patient.
    """
    return appointment_service.send_doctor_health_message(current_patient.id, payload, db)

@router.patch("/messages/{message_id}/read", response_model=DoctorHealthMessageResponse)
def mark_message_read(
    message_id: str,
    current_patient: Patient = Depends(get_current_patient),
    db: Session = Depends(get_db)
):
    """
    Mark a doctor health advice message as read.
    """
    return appointment_service.mark_message_read(message_id, current_patient.id, db)

@router.post("", response_model=AppointmentResponse, status_code=status.HTTP_201_CREATED)
@router.post("/", response_model=AppointmentResponse, status_code=status.HTTP_201_CREATED)
def create_appointment(
    payload: AppointmentCreate,
    current_patient: Patient = Depends(get_current_patient),
    db: Session = Depends(get_db)
):
    """
    Book a new patient appointment with server-side double booking validation.
    """
    return appointment_service.create_appointment(current_patient.id, payload, db)

@router.get("/{appointment_id}", response_model=AppointmentResponse)
def get_appointment(
    appointment_id: str,
    current_patient: Patient = Depends(get_current_patient),
    db: Session = Depends(get_db)
):
    """
    Get detailed appointment info with linked records, prescriptions, and doctor messages.
    """
    return appointment_service.get_appointment(appointment_id, current_patient.id, db)

@router.get("/{appointment_id}/messages", response_model=List[DoctorHealthMessageResponse])
def get_appointment_messages(
    appointment_id: str,
    current_patient: Patient = Depends(get_current_patient),
    db: Session = Depends(get_db)
):
    """
    Get clinical advice messages associated with a specific appointment.
    """
    return appointment_service.get_messages_for_appointment(appointment_id, current_patient.id, db)

@router.put("/{appointment_id}/reschedule", response_model=AppointmentResponse)
def reschedule_appointment(
    appointment_id: str,
    payload: AppointmentReschedule,
    current_patient: Patient = Depends(get_current_patient),
    db: Session = Depends(get_db)
):
    """
    Reschedule an existing appointment to a new date and time.
    """
    return appointment_service.reschedule_appointment(appointment_id, current_patient.id, payload, db)

@router.put("/{appointment_id}/cancel", response_model=AppointmentResponse)
def cancel_appointment(
    appointment_id: str,
    payload: AppointmentCancel,
    current_patient: Patient = Depends(get_current_patient),
    db: Session = Depends(get_db)
):
    """
    Cancel an existing appointment and deactivate reminders.
    """
    return appointment_service.cancel_appointment(appointment_id, current_patient.id, payload, db)

@router.patch("/{appointment_id}/approve")
@router.post("/{appointment_id}/approve")
def approve_appointment(
    appointment_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Approve a pending appointment request (Doctor only).
    """
    if str(getattr(current_user.role, 'value', current_user.role)).upper() not in ["DOCTOR"]:
        raise AppException(status_code=status.HTTP_403_FORBIDDEN, message="Only doctors are authorized to approve appointment requests")
    return doctor_service.accept_appointment(db, current_user, appointment_id)

@router.patch("/{appointment_id}/decline")
@router.post("/{appointment_id}/decline")
def decline_appointment(
    appointment_id: str,
    payload: Optional[DoctorAppointmentRejectRequest] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Decline a pending appointment request with optional reason (Doctor only).
    """
    if str(getattr(current_user.role, 'value', current_user.role)).upper() not in ["DOCTOR"]:
        raise AppException(status_code=status.HTTP_403_FORBIDDEN, message="Only doctors are authorized to decline appointment requests")
    req_payload = payload or DoctorAppointmentRejectRequest(reason="Doctor unavailable at requested time")
    return doctor_service.reject_appointment(db, current_user, appointment_id, req_payload)
