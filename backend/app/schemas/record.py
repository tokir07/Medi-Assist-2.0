from typing import Optional, List, Dict, Any
from pydantic import BaseModel, ConfigDict

class MedicalRecordBase(BaseModel):
    title: str
    category: str
    doctor_name: Optional[str] = None
    hospital: Optional[str] = None
    record_date: Optional[str] = None
    session_name: Optional[str] = "General Records"
    tags: Optional[List[str]] = []
    description: Optional[str] = None

class MedicalRecordCreate(MedicalRecordBase):
    file_type: Optional[str] = "PDF"
    file_size: Optional[int] = 0
    file_size_formatted: Optional[str] = "0 KB"
    file_name: Optional[str] = None

class MedicalRecordUpdate(BaseModel):
    title: Optional[str] = None
    category: Optional[str] = None
    doctor_name: Optional[str] = None
    hospital: Optional[str] = None
    record_date: Optional[str] = None
    session_name: Optional[str] = None
    tags: Optional[List[str]] = None
    description: Optional[str] = None
    is_important: Optional[bool] = None

class ExtractedParameterSchema(BaseModel):
    parameter_name: str
    display_name: str
    category: str = "GENERAL"
    value: str
    numeric_value: Optional[float] = None
    text_value: Optional[str] = None
    unit: Optional[str] = None
    reference_range: Optional[str] = None
    status: str = "NORMAL"
    flag: Optional[str] = None
    source_text: Optional[str] = None
    page_number: int = 1
    confidence: float = 0.95

class MedicalRecordResponse(BaseModel):
    id: str
    patient_id: str
    title: str
    category: str
    file_name: Optional[str] = None
    file_type: str
    file_size: int
    file_size_formatted: str
    file_path: Optional[str] = None
    doctor_name: Optional[str] = None
    hospital: Optional[str] = None
    record_date: Optional[str] = None
    session_name: str = "General Records"
    tags: List[str] = []
    description: Optional[str] = None
    
    # Structured Extraction & Approval
    extracted_text: Optional[str] = None
    extracted_data: Optional[Dict[str, Any]] = None
    extraction_status: str = "PENDING"
    approval_status: str = "REVIEW_REQUIRED"
    confidence_score: float = 1.0
    is_important: bool = False
    
    # Document-Level Report Summary & Clinician Review
    summary_quick: Optional[str] = None
    summary_detailed: Optional[str] = None
    summary_structured: Optional[Dict[str, Any]] = None
    summary_status: str = "NOT_GENERATED"
    summary_version: int = 1
    summary_generated_at: Optional[str] = None
    clinician_review_status: str = "NOT_REVIEWED"

    # Audit & Lifecycle
    audit_log: List[Dict[str, Any]] = []
    is_deleted: bool = False
    deleted_at: Optional[str] = None
    shared_with: List[Dict[str, Any]] = []
    created_at: str
    updated_at: str

    model_config = ConfigDict(from_attributes=True)

class RecordSummaryGenerateResponse(BaseModel):
    record_id: str
    summary_quick: str
    summary_detailed: str
    summary_structured: Dict[str, Any]
    summary_status: str
    summary_version: int
    summary_generated_at: str

class SessionSummaryResponse(BaseModel):
    session_name: str
    record_count: int
    summary_markdown: str
    documents: List[str]
    flagged_parameters: List[Dict[str, Any]]

class ClinicianReviewRequest(BaseModel):
    clinician_notes: Optional[str] = None

class RecordSummaryResponse(BaseModel):
    total_records: int
    lab_reports: int
    radiology: int
    prescriptions: int
    consultations: int
    discharge_summaries: int
    others: int
    approved_records: int = 0
    pending_review_records: int = 0
    total_sessions: int = 1
    storage_used_bytes: int
    storage_used_formatted: str
    storage_total_formatted: str
    storage_percentage: int
    storage_available_formatted: str

class RecordListResponse(BaseModel):
    records: List[MedicalRecordResponse]
    total_count: int
    page: int
    page_size: int
    total_pages: int

class SessionGroupResponse(BaseModel):
    session_name: str
    record_count: int
    latest_date: str
    records: List[MedicalRecordResponse]

class ExtractionEditRequest(BaseModel):
    extracted_data: Dict[str, Any]
    approval_action: Optional[str] = "EDIT" # EDIT, APPROVE, REJECT

class ComprehensiveSummaryRequest(BaseModel):
    date_from: Optional[str] = None
    date_to: Optional[str] = None
    include_ai_history: bool = True
    include_voice_history: bool = True
    include_uploaded_records: bool = True
    conversation_ids: Optional[List[str]] = None
    record_ids: Optional[List[str]] = None

class TimelineItemResponse(BaseModel):
    id: str
    source_type: str # "AI_CONVERSATION", "VOICE_CONSULTATION", "UPLOADED_RECORD"
    title: str
    subtitle: Optional[str] = None
    date: str
    time: str
    status: Optional[str] = None
    preview: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None

# Parameter Trends
class ParameterTrendItem(BaseModel):
    record_id: str
    record_title: str
    date: str
    value: str
    numeric_value: Optional[float] = None
    unit: Optional[str] = None
    reference_range: Optional[str] = None
    status: str = "NORMAL"

class ParameterTrendResponse(BaseModel):
    parameter_name: str
    display_name: str
    unit: Optional[str] = None
    category: str
    trend_points: List[ParameterTrendItem]

# Report Comparison
class ReportCompareRequest(BaseModel):
    record_id_1: str
    record_id_2: str

class ComparedParameterItem(BaseModel):
    parameter_name: str
    display_name: str
    category: str
    unit: Optional[str] = None
    value_1: Optional[str] = None
    numeric_value_1: Optional[float] = None
    status_1: Optional[str] = None
    value_2: Optional[str] = None
    numeric_value_2: Optional[float] = None
    status_2: Optional[str] = None
    reference_range: Optional[str] = None
    delta: Optional[float] = None
    delta_text: Optional[str] = None

class ReportCompareResponse(BaseModel):
    report_1_id: str
    report_1_title: str
    report_1_date: str
    report_2_id: str
    report_2_title: str
    report_2_date: str
    parameters: List[ComparedParameterItem]

# AI Layman Explanation
class ExplainReportResponse(BaseModel):
    record_id: str
    title: str
    explanation_markdown: str

class ShareRecordRequest(BaseModel):
    doctor_name: str
    doctor_email: Optional[str] = None
    doctor_id: Optional[str] = None
    permission: str = "VIEW"
    expires_in_days: Optional[int] = 30
    notes: Optional[str] = None

class RequestDocumentRequest(BaseModel):
    hospital_name: str
    department: str
    record_type: str
    urgency: str = "NORMAL"
    notes: Optional[str] = None
