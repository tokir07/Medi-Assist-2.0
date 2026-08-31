from typing import Optional, List, Dict, Any
from pydantic import BaseModel, ConfigDict

class DoctorDashboardStats(BaseModel):
    todays_appointments_count: int
    pending_requests_count: int
    total_patients_count: int
    unread_messages_count: int
    is_available: bool = True

class DoctorScheduleItem(BaseModel):
    appointment_id: str
    patient_id: str
    patient_name: str
    patient_age: Optional[int] = 30
    patient_gender: Optional[str] = "Male"
    appointment_time: str
    mode: str  # "Video Consultation" or "In-Person"
    reason: Optional[str] = "General Health Consultation"
    status: str
    consultation_link: Optional[str] = None

class DoctorDashboardResponse(BaseModel):
    stats: DoctorDashboardStats
    todays_schedule: List[DoctorScheduleItem]
    pending_requests: List[Dict[str, Any]]
    recent_messages: List[Dict[str, Any]]

class DoctorAppointmentRejectRequest(BaseModel):
    reason: Optional[str] = "Schedule conflict"
    message: Optional[str] = "Please select another available time."

class DoctorEmergencyCancelRequest(BaseModel):
    reason: Optional[str] = "Urgent personal reason"
    message_to_patient: Optional[str] = "Unfortunately, I need to cancel today's appointment. Please select another available slot."

class DoctorBlockSlotRequest(BaseModel):
    date: str  # YYYY-MM-DD
    slot_time: str  # e.g., "10:00 AM"
    reason: Optional[str] = "Personal Work"

class DoctorDayOffRequest(BaseModel):
    date: str  # YYYY-MM-DD
    reason: Optional[str] = "Personal Leave"
    confirm_cancel_existing: bool = False

class DoctorDayOffResponse(BaseModel):
    success: bool
    date: str
    existing_appointments_count: int
    cancelled_count: int = 0
    message: str

class DoctorScheduleConfig(BaseModel):
    working_days: List[str]
    morning_start: str = "09:00 AM"
    morning_end: str = "01:00 PM"
    evening_start: str = "04:00 PM"
    evening_end: str = "07:00 PM"
    slot_duration_minutes: int = 30

class DoctorPatientSummary(BaseModel):
    id: str
    name: str
    age: int
    gender: str
    blood_group: Optional[str] = "B+"
    phone: Optional[str] = None
    email: Optional[str] = None
    last_visit: Optional[str] = None
    allergies: Optional[str] = "None"
    conditions: Optional[str] = "None"
    active_prescriptions_count: int = 0

class DoctorPatientDetail(BaseModel):
    patient_info: DoctorPatientSummary
    current_medications: List[str] = []
    medical_history: List[Dict[str, Any]] = []
    reports: List[Dict[str, Any]] = []
    prescriptions: List[Dict[str, Any]] = []
    appointments: List[Dict[str, Any]] = []
    emergency_contact: Optional[Dict[str, Any]] = None
    ai_health_summary: Optional[Dict[str, Any]] = None

class DoctorConsultationSubmit(BaseModel):
    appointment_id: str
    patient_id: str
    chief_complaint: Optional[str] = None
    clinical_notes: str
    diagnosis: str
    advice: Optional[str] = None
    follow_up_days: Optional[int] = None
    follow_up_date: Optional[str] = None
    follow_up_reason: Optional[str] = None

class MedicationItemCreate(BaseModel):
    medicine_name: str
    dosage: str
    frequency: str
    duration: str
    instructions: Optional[str] = "After meals"

class DigitalPrescriptionCreate(BaseModel):
    patient_id: str
    appointment_id: Optional[str] = None
    diagnosis: str
    medicines: List[MedicationItemCreate]
    additional_notes: Optional[str] = None

class ImagePrescriptionCreate(BaseModel):
    patient_id: str
    appointment_id: Optional[str] = None
    diagnosis: str
    image_url: str
    file_name: Optional[str] = "Prescription_Upload.pdf"
    additional_notes: Optional[str] = None

class PrescriptionTemplateItem(BaseModel):
    id: str
    title: str
    diagnosis: str
    medicines: List[MedicationItemCreate]

class PatientReminderCreate(BaseModel):
    patient_id: str
    reminder_type: str  # "Appointment", "Medicine", "Follow-up", "Report", "Custom"
    title: str
    message: str
    due_date: Optional[str] = None

class DoctorQuickAIRequest(BaseModel):
    query: str
    patient_id: Optional[str] = None
    appointment_id: Optional[str] = None

class DoctorQuickAIResponse(BaseModel):
    message: str
    suggested_questions: List[str] = []
    action: Optional[Dict[str, str]] = None
    draft_reminder: Optional[Dict[str, str]] = None
