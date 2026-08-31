from typing import Optional, List, Dict, Any
from pydantic import BaseModel, ConfigDict

class PrescriptionMedicationItem(BaseModel):
    id: Optional[str] = None
    medication_name: str
    generic_name: Optional[str] = None
    brand_name: Optional[str] = None
    dosage: Optional[str] = "1 tablet"
    dosage_unit: Optional[str] = None
    frequency: Optional[str] = "Twice daily"
    route: Optional[str] = "Oral"
    duration: Optional[str] = "7 days"
    duration_unit: Optional[str] = None
    instructions: Optional[str] = "Take after meals with water."
    quantity: Optional[str] = None
    refills: Optional[int] = 0
    notes: Optional[str] = None

class PrescriptionBase(BaseModel):
    title: Optional[str] = None
    session_name: Optional[str] = "General Records"
    diagnosis_or_indication: Optional[str] = None
    doctor_name: Optional[str] = "Dr. Priya Sharma"
    doctor_specialty: Optional[str] = "General Physician"
    hospital: Optional[str] = "MediAssist Medical Center"
    prescribed_date: Optional[str] = None
    valid_until: Optional[str] = None
    status: Optional[str] = "Active" # Active, Completed, Expired, Cancelled, Archived
    refills_remaining: Optional[int] = 0
    refill_recommended: Optional[bool] = False
    notes: Optional[str] = None

class PrescriptionCreate(PrescriptionBase):
    record_id: Optional[str] = None
    appointment_id: Optional[str] = None
    medications: Optional[List[PrescriptionMedicationItem]] = []
    # Primary medication fields fallback
    medication_name: Optional[str] = None
    dosage: Optional[str] = "1 tablet"
    frequency: Optional[str] = "Twice daily"
    duration: Optional[str] = "7 days"
    instructions: Optional[str] = None

class PrescriptionEditRequest(BaseModel):
    title: Optional[str] = None
    session_name: Optional[str] = None
    doctor_name: Optional[str] = None
    doctor_specialty: Optional[str] = None
    hospital: Optional[str] = None
    prescribed_date: Optional[str] = None
    valid_until: Optional[str] = None
    status: Optional[str] = None
    diagnosis_or_indication: Optional[str] = None
    medications: Optional[List[PrescriptionMedicationItem]] = None
    notes: Optional[str] = None
    refills_remaining: Optional[int] = None
    approval_status: Optional[str] = None

class PrescriptionResponse(BaseModel):
    id: str
    patient_id: str
    record_id: Optional[str] = None
    appointment_id: Optional[str] = None
    appointment_title: Optional[str] = None
    appointment_date: Optional[str] = None

    title: Optional[str] = None
    session_name: Optional[str] = "General Records"
    diagnosis_or_indication: Optional[str] = None
    
    # Primary medication (for top summary)
    medication_name: str
    generic_name: Optional[str] = None
    dosage: str
    frequency: str
    duration: str
    instructions: Optional[str] = None
    
    # Structured Medications List
    medications: List[PrescriptionMedicationItem] = []
    
    doctor_name: str
    doctor_specialty: str
    hospital: str
    prescribed_date: str
    valid_until: Optional[str] = None
    status: str
    
    approval_status: str = "APPROVED"
    clinician_review_status: str = "NOT_REVIEWED"
    provenance: str = "AI_EXTRACTED"

    refills_remaining: int = 0
    refill_recommended: bool = False
    notes: Optional[str] = None
    
    document_file_path: Optional[str] = None
    document_file_name: Optional[str] = None
    source_record_title: Optional[str] = None
    
    created_at: str
    updated_at: str

    model_config = ConfigDict(from_attributes=True)

class PrescriptionSummaryResponse(BaseModel):
    total_prescriptions: int
    active_prescriptions: int
    completed_prescriptions: int
    expired_prescriptions: int
    need_refills: int
    this_month: int

class PrescriptionListResponse(BaseModel):
    prescriptions: List[PrescriptionResponse]
    total_count: int
    page: int
    page_size: int
    total_pages: int

class DuplicateCheckRequest(BaseModel):
    doctor_name: Optional[str] = None
    prescribed_date: Optional[str] = None
    medication_names: Optional[List[str]] = []

class DuplicateCheckResponse(BaseModel):
    is_duplicate: bool
    matching_prescription: Optional[PrescriptionResponse] = None
    message: Optional[str] = None

class MedicationReminderBase(BaseModel):
    medication_name: str
    dosage_instruction: str
    time_str: str
    prescription_id: Optional[str] = None

class MedicationReminderCreate(MedicationReminderBase):
    pass

class MedicationReminderResponse(BaseModel):
    id: str
    patient_id: str
    prescription_id: Optional[str] = None
    medication_name: str
    dosage_instruction: str
    time_str: str
    is_taken: bool
    is_active: bool
    created_at: str

    model_config = ConfigDict(from_attributes=True)

class RefillRequestPayload(BaseModel):
    notes: Optional[str] = None
    preferred_pharmacy: Optional[str] = "MediAssist Central Pharmacy"

class RequestPrescriptionPayload(BaseModel):
    doctor_name: str
    hospital: str
    medication_requested: str
    reason: str
    urgency: str = "NORMAL"
