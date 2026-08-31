from typing import Optional, List, Dict, Any
from pydantic import BaseModel, ConfigDict

class DoctorHealthMessageBase(BaseModel):
    doctor_name: str = "Dr. Priya Sharma"
    doctor_specialty: str = "General Physician"
    doctor_image: Optional[str] = None
    hospital: str = "MediAssist Medical Center"
    message_type: str = "CLINICAL_ADVICE" # CLINICAL_ADVICE, LAB_FOLLOWUP, CARE_INSTRUCTION, PRESCRIPTION_NOTE, GENERAL
    title: str = "Health Advice & Care Instructions"
    content: str
    priority: str = "NORMAL" # NORMAL, HIGH, URGENT

class DoctorHealthMessageCreate(DoctorHealthMessageBase):
    appointment_id: Optional[str] = None
    patient_id: Optional[str] = None

class DoctorHealthMessageResponse(BaseModel):
    id: str
    patient_id: str
    doctor_id: Optional[str] = None
    appointment_id: Optional[str] = None
    doctor_name: str
    doctor_specialty: str
    doctor_image: Optional[str] = None
    hospital: str
    message_type: str
    title: str
    content: str
    priority: str
    is_read: bool
    read_at: Optional[str] = None
    created_at: str
    updated_at: str

    model_config = ConfigDict(from_attributes=True)

class LinkedRecordItem(BaseModel):
    id: str
    title: str
    category: str
    file_name: Optional[str] = None
    record_date: Optional[str] = None

class LinkedPrescriptionItem(BaseModel):
    id: str
    medication_name: str
    dosage: str
    frequency: str
    doctor_name: str
    prescribed_date: Optional[str] = None

class AppointmentBase(BaseModel):
    doctor_id: Optional[str] = None
    doctor_name: str
    doctor_specialty: str
    doctor_image: Optional[str] = None
    hospital: str
    hospital_address: Optional[str] = "New Delhi"
    appointment_type: str = "General Checkup"
    appointment_date: str # YYYY-MM-DD
    appointment_time: str # e.g. "10:30 AM"
    duration_minutes: Optional[int] = 30
    mode: Optional[str] = "In-Person"
    session_name: Optional[str] = "General Consultation"
    notes: Optional[str] = None
    preparation_instructions: Optional[str] = None

class AppointmentCreate(AppointmentBase):
    pass

class AppointmentReschedule(BaseModel):
    new_date: str # YYYY-MM-DD
    new_time: str # e.g. "11:00 AM"
    reason: Optional[str] = None

class AppointmentCancel(BaseModel):
    cancellation_reason: Optional[str] = "Patient requested cancellation"

class AppointmentResponse(BaseModel):
    id: str
    patient_id: str
    doctor_id: Optional[str] = None
    doctor_name: str
    doctor_specialty: str
    doctor_image: Optional[str] = None
    hospital: str
    hospital_address: Optional[str] = None
    appointment_type: str
    appointment_date: str
    appointment_time: str
    duration_minutes: int = 30
    mode: str
    session_name: Optional[str] = "General Consultation"
    consultation_link: Optional[str] = None
    status: str
    notes: Optional[str] = None
    preparation_instructions: Optional[str] = None
    cancellation_reason: Optional[str] = None
    cancelled_at: Optional[str] = None
    
    # Linked clinical items
    linked_records: List[LinkedRecordItem] = []
    linked_prescriptions: List[LinkedPrescriptionItem] = []
    doctor_messages: List[DoctorHealthMessageResponse] = []
    
    created_at: str
    updated_at: str

    model_config = ConfigDict(from_attributes=True)

class AppointmentSummaryResponse(BaseModel):
    upcoming_count: int
    this_month_count: int
    completed_count: int
    cancelled_count: int

class AppointmentListResponse(BaseModel):
    appointments: List[AppointmentResponse]
    total_count: int
    page: int
    page_size: int
    total_pages: int

class DoctorInfo(BaseModel):
    id: str
    name: str
    specialty: str
    hospital: str
    experience: int
    rating: float
    image_url: Optional[str] = None
    available_days: List[str]

class AvailableSlotResponse(BaseModel):
    date: str
    doctor_name: str
    slots: List[str]

class HospitalInfo(BaseModel):
    id: str
    name: str
    location: str
    departments: List[str]
    contact: str
    rating: float

class CalendarDayEvent(BaseModel):
    date: str # YYYY-MM-DD
    has_upcoming: bool = False
    has_completed: bool = False
    has_cancelled: bool = False
    count: int = 0

class CalendarMonthResponse(BaseModel):
    year: int
    month: int
    days: List[CalendarDayEvent]

class RecommendationItem(BaseModel):
    id: str
    title: str
    description: str
    action_text: str
    specialty: str
    icon_type: str
