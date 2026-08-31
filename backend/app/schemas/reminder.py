from pydantic import BaseModel, ConfigDict
from typing import List, Optional
from datetime import datetime

class ReminderBase(BaseModel):
    reminder_type: str  # Medication, Appointment, Health Task, Custom
    title: str
    subtitle: Optional[str] = None
    notes: Optional[str] = None
    priority: Optional[str] = "Normal" # Low, Normal, High, Urgent
    notification_preference: Optional[str] = "IN_APP" # IN_APP, PUSH, EMAIL, ALL
    time_str: str
    date_str: Optional[str] = None
    recurrence: Optional[str] = "Daily"
    appointment_id: Optional[str] = None
    prescription_id: Optional[str] = None
    icon_type: Optional[str] = None
    color_theme: Optional[str] = None

class ReminderCreateRequest(ReminderBase):
    pass

class ReminderUpdateRequest(BaseModel):
    title: Optional[str] = None
    subtitle: Optional[str] = None
    notes: Optional[str] = None
    priority: Optional[str] = None
    notification_preference: Optional[str] = None
    time_str: Optional[str] = None
    date_str: Optional[str] = None
    recurrence: Optional[str] = None
    status: Optional[str] = None
    is_completed: Optional[bool] = None
    icon_type: Optional[str] = None
    color_theme: Optional[str] = None

class ReminderSnoozeRequest(BaseModel):
    snooze_minutes: int = 15

class ReminderResponse(ReminderBase):
    id: str
    patient_id: str
    status: str
    is_completed: bool
    completed_at: Optional[datetime] = None
    snoozed_until: Optional[datetime] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)

class ReminderSummaryResponse(BaseModel):
    all_active_count: int
    medications_active_count: int
    appointments_upcoming_count: int
    health_tasks_active_count: int
    completed_this_month_count: int

class ReminderListGroupedResponse(BaseModel):
    today_reminders: List[ReminderResponse]
    upcoming_reminders: List[ReminderResponse]
    today_count: int
    upcoming_count: int
    total_count: int

class ReminderCalendarDay(BaseModel):
    date: str
    has_medication: bool = False
    has_appointment: bool = False
    has_task: bool = False
    has_completed: bool = False
    total_count: int = 0

class ReminderCalendarMonthResponse(BaseModel):
    year: int
    month: int
    days: List[ReminderCalendarDay]

class ReminderHistoryItemResponse(BaseModel):
    id: str
    reminder_id: Optional[str] = None
    reminder_title: str
    reminder_type: str
    action: str
    scheduled_time: str
    logged_at: datetime

    model_config = ConfigDict(from_attributes=True)

class ReminderHistoryListResponse(BaseModel):
    logs: List[ReminderHistoryItemResponse]
    total_count: int
