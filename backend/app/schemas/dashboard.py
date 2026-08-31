from typing import Optional, List, Dict, Any
from pydantic import BaseModel

class HealthSummarySchema(BaseModel):
    critical_conditions: int = 0
    medications_count: int = 0
    allergies_count: int = 0
    records_count: int = 0
    appointments_count: int = 0
    blood_group: Optional[str] = "O+"
    blood_pressure: Optional[str] = "120/80"
    heart_rate: Optional[str] = "72 bpm"
    bmi: Optional[str] = "24.5"
    spo2: Optional[str] = "98%"
    last_updated: Optional[str] = "Today"

class ConsultationProgressSchema(BaseModel):
    status: str = "NOT_STARTED"
    progress: int = 0
    consultation_id: Optional[str] = None

class DashboardAppointmentItem(BaseModel):
    id: str
    month: str
    day: str
    doctor_name: str
    specialty: str
    time: str
    mode: str
    hospital: Optional[str] = None
    status: Optional[str] = None

class DashboardRecordItem(BaseModel):
    id: str
    title: str
    category: str
    date: str
    file_type: Optional[str] = None
    doctor_name: Optional[str] = None

class DashboardReminderItem(BaseModel):
    id: str
    title: str
    time: str
    category: str = "General"
    completed: bool = False

class DashboardHealthTipItem(BaseModel):
    id: str
    title: str
    content: str
    category: str

class ActiveConversationSchema(BaseModel):
    last_user_message: str
    last_ai_response: str
    timestamp: str

class DashboardResponse(BaseModel):
    patient: Dict[str, Optional[str]]
    health_summary: HealthSummarySchema
    consultation: ConsultationProgressSchema
    upcoming_appointment: Optional[DashboardAppointmentItem] = None
    upcoming_appointments: List[DashboardAppointmentItem] = []
    recent_records: List[DashboardRecordItem] = []
    reminders: List[DashboardReminderItem] = []
    health_tips: List[DashboardHealthTipItem] = []
    active_conversation: Optional[ActiveConversationSchema] = None
    alerts: List[Dict[str, Any]] = []
