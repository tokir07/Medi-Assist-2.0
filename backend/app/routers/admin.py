from typing import Optional, Any
from fastapi import APIRouter, Depends, Query, Request, status
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.database.models import User, UserRole
from app.core.dependencies import require_roles
from app.services.admin_service import admin_service
from app.schemas.admin import (
    AdminDashboardResponse,
    DoctorCreateRequest,
    DoctorUpdateRequest,
    DoctorVerifyRequest,
    DoctorSuspendRequest,
    DoctorItemResponse,
    DoctorListResponse,
    PatientListResponse,
    PatientStatusToggleRequest,
    OrganizationCreateRequest,
    OrganizationResponse,
    OrganizationListResponse,
    DepartmentCreateRequest,
    DepartmentResponse,
    DepartmentListResponse,
    AuditLogListResponse,
    PushNotificationCreateRequest,
    PushNotificationItemResponse,
    PushNotificationListResponse,
    AdminAppointmentListResponse,
)

router = APIRouter(prefix="/admin", tags=["Admin Portal Management"])

# ============================================================
# 1. Admin Dashboard
# ============================================================

@router.get("/dashboard", response_model=AdminDashboardResponse)
def get_admin_dashboard(
    current_admin: User = Depends(require_roles([UserRole.ADMIN])),
    db: Session = Depends(get_db)
):
    """
    Get consolidated real-time operational platform metrics and recent activities.
    """
    return admin_service.get_dashboard_stats(db)

# ============================================================
# 2. Doctor Management Endpoints
# ============================================================

@router.get("/doctors", response_model=DoctorListResponse)
def get_doctors_list(
    search: Optional[str] = Query(None, description="Search by name, email, Doctor ID, registration number"),
    specialization: Optional[str] = Query(None, description="Filter by clinical specialty"),
    department: Optional[str] = Query(None, description="Filter by department"),
    verification_status: Optional[str] = Query(None, description="Filter by verification state"),
    account_status: Optional[str] = Query(None, description="Filter by account status"),
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    current_admin: User = Depends(require_roles([UserRole.ADMIN])),
    db: Session = Depends(get_db)
):
    """
    Retrieve paginated and filtered list of doctors with clinical credentials and status.
    """
    return admin_service.get_doctors(
        db=db,
        search=search,
        specialization=specialization,
        department=department,
        verification_status=verification_status,
        account_status=account_status,
        page=page,
        page_size=page_size
    )

@router.get("/doctors/{doctor_id}", response_model=DoctorItemResponse)
def get_doctor_details(
    doctor_id: str,
    current_admin: User = Depends(require_roles([UserRole.ADMIN])),
    db: Session = Depends(get_db)
):
    """
    Get detailed doctor profile, verification records, and organizational linkage.
    """
    return admin_service.get_doctor_by_id(doctor_id, db)

@router.post("/doctors", response_model=DoctorItemResponse, status_code=status.HTTP_201_CREATED)
def create_doctor_account(
    payload: DoctorCreateRequest,
    request: Request,
    current_admin: User = Depends(require_roles([UserRole.ADMIN])),
    db: Session = Depends(get_db)
):
    """
    Create a new Doctor account, generate Doctor ID, assign clinical department, and issue secure invitation.
    """
    client_ip = request.client.host if request.client else "127.0.0.1"
    return admin_service.create_doctor(
        payload=payload,
        current_admin=current_admin,
        db=db,
        ip_address=client_ip
    )

@router.put("/doctors/{doctor_id}", response_model=DoctorItemResponse)
def update_doctor_account(
    doctor_id: str,
    payload: DoctorUpdateRequest,
    request: Request,
    current_admin: User = Depends(require_roles([UserRole.ADMIN])),
    db: Session = Depends(get_db)
):
    """
    Update physician professional details, department, or contact information.
    """
    client_ip = request.client.host if request.client else "127.0.0.1"
    return admin_service.update_doctor(
        doctor_id=doctor_id,
        payload=payload,
        current_admin=current_admin,
        db=db,
        ip_address=client_ip
    )

@router.post("/doctors/{doctor_id}/verify", response_model=DoctorItemResponse)
def verify_doctor_credentials(
    doctor_id: str,
    payload: DoctorVerifyRequest,
    request: Request,
    current_admin: User = Depends(require_roles([UserRole.ADMIN])),
    db: Session = Depends(get_db)
):
    """
    Verify or reject physician registration credentials.
    """
    client_ip = request.client.host if request.client else "127.0.0.1"
    return admin_service.verify_doctor(
        doctor_id=doctor_id,
        payload=payload,
        current_admin=current_admin,
        db=db,
        ip_address=client_ip
    )

@router.post("/doctors/{doctor_id}/suspend", response_model=DoctorItemResponse)
def suspend_or_reactivate_doctor(
    doctor_id: str,
    payload: DoctorSuspendRequest,
    request: Request,
    current_admin: User = Depends(require_roles([UserRole.ADMIN])),
    db: Session = Depends(get_db)
):
    """
    Suspend or reactivate a doctor's account and authorization credentials.
    """
    client_ip = request.client.host if request.client else "127.0.0.1"
    return admin_service.suspend_doctor(
        doctor_id=doctor_id,
        payload=payload,
        current_admin=current_admin,
        db=db,
        ip_address=client_ip
    )

# ============================================================
# 3. Patient Management Endpoints (Privacy Preserved)
# ============================================================

@router.get("/patients", response_model=PatientListResponse)
def get_patients_list(
    search: Optional[str] = Query(None, description="Search by name, email, phone, or ABHA ID"),
    city: Optional[str] = Query(None, description="Filter by city"),
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    current_admin: User = Depends(require_roles([UserRole.ADMIN])),
    db: Session = Depends(get_db)
):
    """
    Retrieve administrative list of registered patients without exposing sensitive clinical notes.
    """
    return admin_service.get_patients(
        db=db,
        search=search,
        city=city,
        page=page,
        page_size=page_size
    )

@router.post("/patients/{patient_id}/toggle-status")
def toggle_patient_status(
    patient_id: str,
    payload: PatientStatusToggleRequest,
    request: Request,
    current_admin: User = Depends(require_roles([UserRole.ADMIN])),
    db: Session = Depends(get_db)
):
    """
    Activate or restrict a patient's access.
    """
    client_ip = request.client.host if request.client else "127.0.0.1"
    success = admin_service.toggle_patient_status(
        patient_id=patient_id,
        payload=payload,
        current_admin=current_admin,
        db=db,
        ip_address=client_ip
    )
    return {"success": success, "is_active": payload.is_active}

# ============================================================
# 4. Organizations & Departments
# ============================================================

@router.get("/organizations", response_model=OrganizationListResponse)
def get_organizations(
    current_admin: User = Depends(require_roles([UserRole.ADMIN])),
    db: Session = Depends(get_db)
):
    """
    List all medical organizations, hospitals, and clinics.
    """
    return admin_service.get_organizations(db)

@router.post("/organizations", response_model=OrganizationResponse, status_code=status.HTTP_201_CREATED)
def create_organization(
    payload: OrganizationCreateRequest,
    request: Request,
    current_admin: User = Depends(require_roles([UserRole.ADMIN])),
    db: Session = Depends(get_db)
):
    """
    Register a new hospital or healthcare organization.
    """
    client_ip = request.client.host if request.client else "127.0.0.1"
    return admin_service.create_organization(
        payload=payload,
        current_admin=current_admin,
        db=db,
        ip_address=client_ip
    )

@router.get("/departments", response_model=DepartmentListResponse)
def get_departments(
    organization_id: Optional[str] = Query(None),
    current_admin: User = Depends(require_roles([UserRole.ADMIN])),
    db: Session = Depends(get_db)
):
    """
    List clinical departments across organizations.
    """
    return admin_service.get_departments(db, organization_id)

@router.post("/departments", response_model=DepartmentResponse, status_code=status.HTTP_201_CREATED)
def create_department(
    payload: DepartmentCreateRequest,
    request: Request,
    current_admin: User = Depends(require_roles([UserRole.ADMIN])),
    db: Session = Depends(get_db)
):
    """
    Add a clinical department under an organization.
    """
    client_ip = request.client.host if request.client else "127.0.0.1"
    return admin_service.create_department(
        payload=payload,
        current_admin=current_admin,
        db=db,
        ip_address=client_ip
    )

# ============================================================
# 5. Immutable Audit Logs & Security
# ============================================================

@router.get("/audit-logs", response_model=AuditLogListResponse)
def get_audit_logs(
    action: Optional[str] = Query(None, description="Filter by action name"),
    resource: Optional[str] = Query(None, description="Filter by resource type"),
    search: Optional[str] = Query(None, description="Search actor, action, or details"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    current_admin: User = Depends(require_roles([UserRole.ADMIN])),
    db: Session = Depends(get_db)
):
    """
    Query immutable append-only audit trail records.
    """
    return admin_service.get_audit_logs(
        db=db,
        action=action,
        resource=resource,
        search=search,
        page=page,
        page_size=page_size
    )

# ============================================================
# 6. Push Notifications
# ============================================================

@router.get("/notifications", response_model=PushNotificationListResponse)
def get_admin_notifications(
    current_admin: User = Depends(require_roles([UserRole.ADMIN])),
    db: Session = Depends(get_db)
):
    """
    Get history of push notifications sent across MediAssist.
    """
    return admin_service.get_push_notifications(db)

@router.post("/notifications", response_model=PushNotificationItemResponse, status_code=status.HTTP_201_CREATED)
def send_admin_notification(
    payload: PushNotificationCreateRequest,
    request: Request,
    current_admin: User = Depends(require_roles([UserRole.ADMIN])),
    db: Session = Depends(get_db)
):
    """
    Send push notification to all/selected patients or doctors.
    """
    client_ip = request.client.host if request.client else "127.0.0.1"
    return admin_service.send_push_notification(
        payload=payload,
        current_admin=current_admin,
        db=db,
        ip_address=client_ip
    )

# ============================================================
# 7. Admin Appointments Overview
# ============================================================

@router.get("/appointments", response_model=AdminAppointmentListResponse)
def get_admin_appointments(
    status_filter: Optional[str] = Query(None, alias="status"),
    search: Optional[str] = Query(None),
    limit: int = Query(50, ge=1, le=200),
    current_admin: User = Depends(require_roles([UserRole.ADMIN])),
    db: Session = Depends(get_db)
):
    """
    Get administrative overview of scheduled patient appointments.
    """
    return admin_service.get_appointments_list(
        db=db,
        status_filter=status_filter,
        search=search,
        limit=limit
    )

