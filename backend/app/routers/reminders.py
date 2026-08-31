from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from typing import Optional, Dict, Any

from app.database.database import get_db
from app.database.models import User, Patient
from app.core.dependencies import get_current_user
from app.services.reminder_service import reminder_service
from app.schemas.reminder import (
    ReminderResponse,
    ReminderListGroupedResponse,
    ReminderSummaryResponse,
    ReminderCalendarMonthResponse,
    ReminderHistoryListResponse,
    ReminderCreateRequest,
    ReminderUpdateRequest,
    ReminderSnoozeRequest,
)

router = APIRouter(prefix="/reminders", tags=["Patient Reminders"])

def _get_patient_id(current_user: User, db: Session) -> str:
    if not current_user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Authentication required")
    patient = db.query(Patient).filter(Patient.user_id == current_user.id).first()
    if not patient:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Patient profile required")
    return patient.id


@router.get("", response_model=ReminderListGroupedResponse)
@router.get("/", response_model=ReminderListGroupedResponse)
def get_reminders(
    tab: Optional[str] = Query("All", description="Tab filter (All, Medications, Appointments, Health Tasks, Custom)"),
    search: Optional[str] = Query(None, description="Search query"),
    date: Optional[str] = Query(None, description="Specific date filter (YYYY-MM-DD)"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Fetch patient reminders grouped into today and upcoming lists with filter and search support.
    """
    patient_id = _get_patient_id(current_user, db)
    return reminder_service.get_grouped_reminders(
        patient_id=patient_id,
        db=db,
        tab=tab,
        search=search,
        date_str=date
    )


@router.get("/summary", response_model=ReminderSummaryResponse)
def get_reminders_summary(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Fetch summary card counters from real database data.
    """
    patient_id = _get_patient_id(current_user, db)
    return reminder_service.get_summary(patient_id=patient_id, db=db)


@router.get("/calendar", response_model=ReminderCalendarMonthResponse)
def get_calendar_events(
    year: int = Query(2026, ge=2020, le=2030),
    month: int = Query(8, ge=1, le=12),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Fetch reminder day indicators for the calendar panel.
    """
    patient_id = _get_patient_id(current_user, db)
    return reminder_service.get_calendar_events(patient_id=patient_id, year=year, month=month, db=db)


@router.get("/history", response_model=ReminderHistoryListResponse)
def get_reminder_history(
    action: Optional[str] = Query(None, description="Action filter (All, Completed, Taken, Skipped, Missed, Snoozed, Dismissed)"),
    limit: int = Query(50, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Fetch historical log entries for completed/skipped/missed/snoozed reminders.
    """
    patient_id = _get_patient_id(current_user, db)
    return reminder_service.get_history(patient_id=patient_id, action=action, db=db, limit=limit)


@router.post("", response_model=ReminderResponse, status_code=status.HTTP_201_CREATED)
@router.post("/", response_model=ReminderResponse, status_code=status.HTTP_201_CREATED)
def create_reminder(
    payload: ReminderCreateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Create a new patient reminder.
    """
    patient_id = _get_patient_id(current_user, db)
    return reminder_service.create_reminder(patient_id=patient_id, payload=payload, db=db)


@router.put("/{reminder_id}", response_model=ReminderResponse)
def update_reminder(
    reminder_id: str,
    payload: ReminderUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Update an existing reminder.
    """
    patient_id = _get_patient_id(current_user, db)
    return reminder_service.update_reminder(reminder_id=reminder_id, patient_id=patient_id, payload=payload, db=db)


@router.post("/{reminder_id}/complete", response_model=ReminderResponse)
def mark_reminder_completed(
    reminder_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Mark a reminder as completed.
    """
    patient_id = _get_patient_id(current_user, db)
    return reminder_service.mark_completed(reminder_id=reminder_id, patient_id=patient_id, db=db)


@router.post("/{reminder_id}/snooze", response_model=ReminderResponse)
def snooze_reminder(
    reminder_id: str,
    payload: ReminderSnoozeRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Snooze a reminder by specified minutes.
    """
    patient_id = _get_patient_id(current_user, db)
    return reminder_service.snooze_reminder(reminder_id=reminder_id, patient_id=patient_id, payload=payload, db=db)


@router.post("/{reminder_id}/dismiss", response_model=ReminderResponse)
def dismiss_reminder(
    reminder_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Dismiss a reminder without completing it.
    """
    patient_id = _get_patient_id(current_user, db)
    return reminder_service.dismiss_reminder(reminder_id=reminder_id, patient_id=patient_id, db=db)


@router.post("/complete-all-today", response_model=Dict[str, Any])
def mark_all_today_completed(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Mark all pending reminders scheduled for today as completed.
    """
    patient_id = _get_patient_id(current_user, db)
    return reminder_service.mark_all_today_completed(patient_id=patient_id, db=db)


@router.delete("/{reminder_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_reminder(
    reminder_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Soft-delete a reminder.
    """
    patient_id = _get_patient_id(current_user, db)
    reminder_service.delete_reminder(reminder_id=reminder_id, patient_id=patient_id, db=db)
    return None
