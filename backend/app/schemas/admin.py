from datetime import datetime
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, EmailStr, Field

# ==========================================
# 1. Admin Dashboard KPI & Summary Schemas
# ==========================================

class AdminKPIStats(BaseModel):
    total_users: int
    active_patients: int
    total_doctors: int
    active_doctors: int
    pending_doctor_verifications: int
    suspended_doctors: int
    today_appointments: int
    active_consultations: int
    total_organizations: int
    security_alerts_count: int

class RecentDoctorActivity(BaseModel):
    id: str
    doctor_id: str
    name: str
    specialization: str
    hospital: str
    verification_status: str
    account_status: str
    created_at: str

class RecentAuditEventItem(BaseModel):
    id: str
    actor_name: str
    actor_role: str
    action: str
    resource: str
    status: str
    details: Optional[str] = None
    created_at: str

class SystemHealthStatus(BaseModel):
    database: str = "HEALTHY"
    redis_cache: str = "CONNECTED"
    ai_engine: str = "OPERATIONAL"
    uptime_percentage: float = 99.98
    active_sessions: int = 1

class AdminDashboardResponse(BaseModel):
    kpis: AdminKPIStats
    recent_doctors: List[RecentDoctorActivity]
    recent_audit_events: List[RecentAuditEventItem]
    system_health: SystemHealthStatus
    timestamp: str

# ==========================================
# 2. Doctor Management Schemas
# ==========================================

class DoctorCreateRequest(BaseModel):
    # Personal
    name: str = Field(..., min_length=2, max_length=255)
    email: EmailStr
    phone: Optional[str] = None
    gender: Optional[str] = "Not Specified"
    
    # Professional
    specialization: str = Field(..., min_length=2, max_length=255)
    qualification: str = Field(..., min_length=2, max_length=255)
    experience: int = Field(default=1, ge=0, le=70)
    medical_registration_number: str = Field(..., min_length=3, max_length=100)
    registration_authority: str = Field(default="National Medical Commission")
    designation: Optional[str] = "Consultant Physician"
    bio: Optional[str] = None
    consultation_fee: Optional[int] = 500
    
    # Organization / Department
    hospital: str = Field(default="City Care Hospital")
    organization_id: Optional[str] = None
    department: str = Field(default="General Medicine")
    department_id: Optional[str] = None
    
    # Initial status
    verification_status: Optional[str] = "VERIFIED"  # VERIFIED or PENDING_VERIFICATION
    send_invitation: bool = True

class DoctorUpdateRequest(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    specialization: Optional[str] = None
    qualification: Optional[str] = None
    experience: Optional[int] = None
    medical_registration_number: Optional[str] = None
    registration_authority: Optional[str] = None
    designation: Optional[str] = None
    department: Optional[str] = None
    hospital: Optional[str] = None
    bio: Optional[str] = None
    consultation_fee: Optional[int] = None

class DoctorVerifyRequest(BaseModel):
    status: str = Field(..., description="VERIFIED, REJECTED, UNDER_REVIEW")
    notes: Optional[str] = None

class DoctorSuspendRequest(BaseModel):
    suspend: bool
    reason: Optional[str] = None

class DoctorItemResponse(BaseModel):
    id: str
    user_id: str
    doctor_id: str
    name: str
    email: str
    phone: Optional[str] = None
    specialization: str
    qualification: str
    experience: int
    registration_number: Optional[str] = None
    registration_authority: Optional[str] = None
    designation: str
    department: str
    hospital: str
    organization_id: Optional[str] = None
    department_id: Optional[str] = None
    consultation_fee: int
    account_status: str
    verification_status: str
    is_active: bool
    invitation_sent: bool
    created_at: str
    updated_at: str

class DoctorListResponse(BaseModel):
    doctors: List[DoctorItemResponse]
    total_count: int
    page: int
    page_size: int
    total_pages: int

# ==========================================
# 3. Patient Management Schemas
# ==========================================

class PatientItemResponse(BaseModel):
    id: str
    user_id: str
    name: str
    email: str
    phone: Optional[str] = None
    gender: Optional[str] = None
    date_of_birth: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    country: Optional[str] = "India"
    blood_group: Optional[str] = None
    abha_id: Optional[str] = None
    kyc_verified: bool
    is_active: bool
    records_count: int = 0
    appointments_count: int = 0
    prescriptions_count: int = 0
    created_at: str

class PatientListResponse(BaseModel):
    patients: List[PatientItemResponse]
    total_count: int
    page: int
    page_size: int
    total_pages: int

class PatientStatusToggleRequest(BaseModel):
    is_active: bool
    reason: Optional[str] = None

# ==========================================
# 4. Organization & Department Schemas
# ==========================================

class OrganizationCreateRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=255)
    organization_type: str = Field(default="Hospital")
    code: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = "New Delhi"
    state: Optional[str] = "Delhi"
    phone: Optional[str] = None
    email: Optional[str] = None
    license_number: Optional[str] = None

class OrganizationResponse(BaseModel):
    id: str
    name: str
    organization_type: str
    code: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    country: str
    phone: Optional[str] = None
    email: Optional[str] = None
    license_number: Optional[str] = None
    departments_count: int
    doctors_count: int
    is_active: bool
    created_at: str

class OrganizationListResponse(BaseModel):
    organizations: List[OrganizationResponse]
    total_count: int

class DepartmentCreateRequest(BaseModel):
    organization_id: str
    name: str = Field(..., min_length=2, max_length=255)
    code: Optional[str] = None
    head_doctor_name: Optional[str] = None
    description: Optional[str] = None

class DepartmentResponse(BaseModel):
    id: str
    organization_id: str
    organization_name: str
    name: str
    code: Optional[str] = None
    head_doctor_name: Optional[str] = None
    description: Optional[str] = None
    doctors_count: int
    is_active: bool
    created_at: str

class DepartmentListResponse(BaseModel):
    departments: List[DepartmentResponse]
    total_count: int

# ==========================================
# 5. Audit Log & Security Schemas
# ==========================================

class AuditLogResponse(BaseModel):
    id: str
    actor_id: Optional[str] = None
    actor_name: str
    actor_role: str
    action: str
    resource: str
    resource_id: Optional[str] = None
    ip_address: Optional[str] = None
    status: str
    details: Optional[str] = None
    created_at: str

class AuditLogListResponse(BaseModel):
    logs: List[AuditLogResponse]
    total_count: int
    page: int
    page_size: int
    total_pages: int

# ==========================================
# 6. System Configuration Schemas
# ==========================================

class SystemConfigItem(BaseModel):
    key: str
    value: str
    category: str
    description: Optional[str] = None
    is_sensitive: bool

class SystemConfigListResponse(BaseModel):
    configurations: List[SystemConfigItem]

class SystemConfigUpdateRequest(BaseModel):
    key: str
    value: str

# ==========================================
# 7. Push Notifications Schemas
# ==========================================

class PushNotificationCreateRequest(BaseModel):
    title: str = Field(..., min_length=2, max_length=255)
    message: str = Field(..., min_length=2, max_length=2000)
    audience: str = Field(default="All Patients")  # All Patients, All Doctors, Selected Patients, Selected Doctors
    target_user_ids: Optional[List[str]] = None

class PushNotificationItemResponse(BaseModel):
    id: str
    title: str
    message: str
    audience: str
    target_count: int
    sent_by_name: str
    status: str
    created_at: str

class PushNotificationListResponse(BaseModel):
    notifications: List[PushNotificationItemResponse]
    total_count: int

# ==========================================
# 8. Admin Appointments Schemas
# ==========================================

class AdminAppointmentItemResponse(BaseModel):
    id: str
    time: str
    date: str
    patient_id: str
    patient_name: str
    patient_email: str
    doctor_id: str
    doctor_name: str
    doctor_specialty: str
    appointment_type: str  # In-Person, Video Call
    status: str  # Completed, Confirmed, Pending, Cancelled

class AdminAppointmentListResponse(BaseModel):
    appointments: List[AdminAppointmentItemResponse]
    total_count: int

