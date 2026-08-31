import json
import uuid
import math
import secrets
from datetime import datetime, timezone, date
from typing import List, Optional, Tuple, Any
from sqlalchemy.orm import Session
from sqlalchemy import or_, desc, asc, func

from app.database.models import User, Doctor, Patient, UserRole
from app.models.admin import Organization, Department, AuditLog, SystemConfiguration
from app.models.appointment import Appointment
from app.models.medical_record import MedicalRecord
from app.models.prescription import Prescription
from app.models.ai_conversation import AIConversation
from app.core.security import get_password_hash
from app.schemas.admin import (
    AdminDashboardResponse,
    AdminKPIStats,
    RecentDoctorActivity,
    RecentAuditEventItem,
    SystemHealthStatus,
    DoctorCreateRequest,
    DoctorUpdateRequest,
    DoctorVerifyRequest,
    DoctorSuspendRequest,
    DoctorItemResponse,
    DoctorListResponse,
    PatientItemResponse,
    PatientListResponse,
    PatientStatusToggleRequest,
    OrganizationCreateRequest,
    OrganizationResponse,
    OrganizationListResponse,
    DepartmentCreateRequest,
    DepartmentResponse,
    DepartmentListResponse,
    AuditLogResponse,
    AuditLogListResponse,
    SystemConfigItem,
    SystemConfigListResponse,
)
from app.utils.exceptions import AppException
from fastapi import status

class AdminService:
    @staticmethod
    def log_audit(
        db: Session,
        actor: User,
        action: str,
        resource: str,
        resource_id: Optional[str] = None,
        status_str: str = "SUCCESS",
        details: Optional[str] = None,
        ip_address: Optional[str] = None,
    ) -> AuditLog:
        """
        Append-only audit log recorder.
        """
        log = AuditLog(
            actor_id=actor.id if actor else None,
            actor_name=actor.name if actor else "System",
            actor_role=actor.role.value if actor and hasattr(actor.role, 'value') else str(getattr(actor, 'role', 'SYSTEM')),
            action=action,
            resource=resource,
            resource_id=str(resource_id) if resource_id else None,
            ip_address=ip_address,
            status=status_str,
            details=details,
            created_at=datetime.now(timezone.utc)
        )
        db.add(log)
        db.commit()
        return log

    @staticmethod
    def ensure_default_organizations(db: Session):
        """
        Seeds baseline hospital & department structure if empty.
        """
        count = db.query(Organization).count()
        if count == 0:
            hosp1 = Organization(
                name="City Care Hospital",
                organization_type="Multispecialty Hospital",
                code="CCH-DEL-01",
                address="Connaught Place, Central Delhi",
                city="New Delhi",
                state="Delhi",
                country="India",
                phone="+91 11 2345 6789",
                email="info@citycarehospital.in",
                license_number="DEL-HOSP-2024-8841",
                rating="4.9",
                is_active=True
            )
            hosp2 = Organization(
                name="Metro Heart & Skin Institute",
                organization_type="Specialty Clinic",
                code="MHSI-DEL-02",
                address="Defence Colony, South Delhi",
                city="New Delhi",
                state="Delhi",
                country="India",
                phone="+91 11 4567 8901",
                email="contact@metroheartskin.org",
                license_number="DEL-CLIN-2023-4102",
                rating="4.8",
                is_active=True
            )
            db.add_all([hosp1, hosp2])
            db.commit()
            db.refresh(hosp1)
            db.refresh(hosp2)

            # Add Departments
            depts = [
                Department(organization_id=hosp1.id, name="Cardiology", code="CARD", head_doctor_name="Dr. Sarah Jenkins", description="Comprehensive cardiovascular diagnosis & care"),
                Department(organization_id=hosp1.id, name="General Medicine", code="GEN", head_doctor_name="Dr. Rajesh Gupta", description="Primary clinical health & preventive care"),
                Department(organization_id=hosp1.id, name="Neurology", code="NEUR", head_doctor_name="Dr. Priya Sharma", description="Brain, nerve & neurological disorder management"),
                Department(organization_id=hosp2.id, name="Dermatology", code="DERM", head_doctor_name="Dr. Sunita Rao", description="Clinical dermatology & skin care"),
                Department(organization_id=hosp2.id, name="Cardiology", code="CARD-M", head_doctor_name="Dr. Sarah Jenkins", description="Preventive cardiac screening")
            ]
            db.add_all(depts)
            db.commit()

    @staticmethod
    def get_dashboard_stats(db: Session) -> AdminDashboardResponse:
        AdminService.ensure_default_organizations(db)

        total_users = db.query(User).count()
        active_patients = db.query(Patient).join(User).filter(User.is_active == True).count()
        total_doctors = db.query(Doctor).count()
        active_doctors = db.query(Doctor).join(User).filter(
            User.is_active == True,
            Doctor.account_status == "ACTIVE"
        ).count()
        pending_verifications = db.query(Doctor).filter(
            Doctor.verification_status.in_(["PENDING_VERIFICATION", "UNVERIFIED", "UNDER_REVIEW"])
        ).count()
        suspended_doctors = db.query(Doctor).filter(
            Doctor.account_status == "SUSPENDED"
        ).count()

        # Today's appointments
        today_str = datetime.now().strftime("%d %b %Y")
        today_appts = db.query(Appointment).filter(
            Appointment.is_deleted == False
        ).count()

        active_consultations = db.query(AIConversation).count()
        total_orgs = db.query(Organization).filter(Organization.is_active == True).count()

        # Recent Doctors
        recent_docs_q = db.query(Doctor).join(User).order_by(desc(Doctor.created_at)).limit(5).all()
        recent_doctors = [
            RecentDoctorActivity(
                id=d.id,
                doctor_id=d.doctor_id,
                name=d.user.name if d.user else "Physician",
                specialization=d.specialization or "General Medicine",
                hospital=d.hospital or "City Care Hospital",
                verification_status=d.verification_status or "VERIFIED",
                account_status=d.account_status or "ACTIVE",
                created_at=d.created_at.strftime("%d %b %Y") if d.created_at else ""
            ) for d in recent_docs_q
        ]

        # Recent Audit Events
        recent_audits_q = db.query(AuditLog).order_by(desc(AuditLog.created_at)).limit(6).all()
        recent_audit_events = [
            RecentAuditEventItem(
                id=a.id,
                actor_name=a.actor_name,
                actor_role=a.actor_role,
                action=a.action,
                resource=a.resource,
                status=a.status,
                details=a.details,
                created_at=a.created_at.strftime("%d %b %Y, %I:%M %p") if a.created_at else ""
            ) for a in recent_audits_q
        ]

        kpis = AdminKPIStats(
            total_users=total_users,
            active_patients=active_patients,
            total_doctors=total_doctors,
            active_doctors=active_doctors,
            pending_doctor_verifications=pending_verifications,
            suspended_doctors=suspended_doctors,
            today_appointments=today_appts,
            active_consultations=active_consultations,
            total_organizations=total_orgs,
            security_alerts_count=0
        )

        return AdminDashboardResponse(
            kpis=kpis,
            recent_doctors=recent_doctors,
            recent_audit_events=recent_audit_events,
            system_health=SystemHealthStatus(),
            timestamp=datetime.now(timezone.utc).strftime("%d %b %Y, %I:%M %p UTC")
        )

    @staticmethod
    def get_doctors(
        db: Session,
        search: Optional[str] = None,
        specialization: Optional[str] = None,
        department: Optional[str] = None,
        verification_status: Optional[str] = None,
        account_status: Optional[str] = None,
        page: int = 1,
        page_size: int = 10
    ) -> DoctorListResponse:
        query = db.query(Doctor).join(User)

        if search:
            s = f"%{search.strip()}%"
            query = query.filter(
                or_(
                    User.name.ilike(s),
                    User.email.ilike(s),
                    Doctor.doctor_id.ilike(s),
                    Doctor.registration_number.ilike(s),
                    Doctor.specialization.ilike(s),
                    Doctor.hospital.ilike(s)
                )
            )

        if specialization:
            query = query.filter(Doctor.specialization.ilike(f"%{specialization}%"))

        if department:
            query = query.filter(Doctor.department.ilike(f"%{department}%"))

        if verification_status and verification_status != "ALL":
            query = query.filter(Doctor.verification_status == verification_status)

        if account_status and account_status != "ALL":
            query = query.filter(Doctor.account_status == account_status)

        total_count = query.count()
        total_pages = max(1, math.ceil(total_count / page_size))
        offset = (page - 1) * page_size

        docs = query.order_by(desc(Doctor.created_at)).offset(offset).limit(page_size).all()

        doctor_items: List[DoctorItemResponse] = []
        for d in docs:
            doctor_items.append(
                DoctorItemResponse(
                    id=d.id,
                    user_id=d.user_id,
                    doctor_id=d.doctor_id,
                    name=d.user.name if d.user else "Dr. Physician",
                    email=d.user.email if d.user else "",
                    phone=d.phone or "Not provided",
                    specialization=d.specialization or "General Medicine",
                    qualification=d.qualification or "MBBS",
                    experience=d.experience or 1,
                    registration_number=d.registration_number or "N/A",
                    registration_authority=d.registration_authority or "National Medical Commission",
                    designation=d.designation or "Consultant Physician",
                    department=d.department or "General Medicine",
                    hospital=d.hospital or "City Care Hospital",
                    organization_id=d.organization_id,
                    department_id=d.department_id,
                    consultation_fee=d.consultation_fee or 500,
                    account_status=d.account_status or "ACTIVE",
                    verification_status=d.verification_status or "VERIFIED",
                    is_active=bool(d.user.is_active) if d.user else False,
                    invitation_sent=bool(d.invitation_sent_at or d.account_status == "INVITED"),
                    created_at=d.created_at.strftime("%d %b %Y") if d.created_at else "",
                    updated_at=d.updated_at.strftime("%d %b %Y") if d.updated_at else ""
                )
            )

        return DoctorListResponse(
            doctors=doctor_items,
            total_count=total_count,
            page=page,
            page_size=page_size,
            total_pages=total_pages
        )

    @staticmethod
    def get_doctor_by_id(doctor_id: str, db: Session) -> DoctorItemResponse:
        d = db.query(Doctor).join(User).filter(
            or_(Doctor.id == doctor_id, Doctor.doctor_id == doctor_id)
        ).first()
        if not d:
            raise AppException(status_code=status.HTTP_404_NOT_FOUND, detail="Doctor not found.")

        return DoctorItemResponse(
            id=d.id,
            user_id=d.user_id,
            doctor_id=d.doctor_id,
            name=d.user.name if d.user else "Dr. Physician",
            email=d.user.email if d.user else "",
            phone=d.phone or "Not provided",
            specialization=d.specialization or "General Medicine",
            qualification=d.qualification or "MBBS",
            experience=d.experience or 1,
            registration_number=d.registration_number or "N/A",
            registration_authority=d.registration_authority or "National Medical Commission",
            designation=d.designation or "Consultant Physician",
            department=d.department or "General Medicine",
            hospital=d.hospital or "City Care Hospital",
            organization_id=d.organization_id,
            department_id=d.department_id,
            consultation_fee=d.consultation_fee or 500,
            account_status=d.account_status or "ACTIVE",
            verification_status=d.verification_status or "VERIFIED",
            is_active=bool(d.user.is_active) if d.user else False,
            invitation_sent=bool(d.invitation_sent_at or d.account_status == "INVITED"),
            created_at=d.created_at.strftime("%d %b %Y") if d.created_at else "",
            updated_at=d.updated_at.strftime("%d %b %Y") if d.updated_at else ""
        )

    @staticmethod
    def create_doctor(
        payload: DoctorCreateRequest,
        current_admin: User,
        db: Session,
        ip_address: Optional[str] = None
    ) -> DoctorItemResponse:
        # 1. Check duplicate email in User table
        existing_user = db.query(User).filter(User.email.ilike(payload.email)).first()
        if existing_user:
            raise AppException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"An account with email '{payload.email}' already exists."
            )

        # 2. Check duplicate medical registration number
        if payload.medical_registration_number:
            existing_reg = db.query(Doctor).filter(
                Doctor.registration_number.ilike(payload.medical_registration_number)
            ).first()
            if existing_reg:
                raise AppException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail=f"Medical Registration Number '{payload.medical_registration_number}' is already registered with another doctor."
                )

        # 3. Generate sequential unique Doctor ID (e.g. DR-2026-000185)
        current_year = datetime.now().year
        total_docs = db.query(Doctor).count()
        generated_doctor_id = f"DR-{current_year}-{(total_docs + 1):06d}"

        # 4. Create User
        temp_password = secrets.token_urlsafe(16)
        new_user = User(
            email=payload.email.lower().strip(),
            name=payload.name.strip(),
            role=UserRole.DOCTOR,
            password_hash=get_password_hash(temp_password),
            is_active=True,
            is_onboarded=False
        )
        db.add(new_user)
        db.commit()
        db.refresh(new_user)

        # 5. Create Doctor Profile
        invitation_token = secrets.token_urlsafe(32) if payload.send_invitation else None
        new_doctor = Doctor(
            user_id=new_user.id,
            doctor_id=generated_doctor_id,
            specialization=payload.specialization,
            qualification=payload.qualification,
            experience=payload.experience,
            registration_number=payload.medical_registration_number,
            registration_authority=payload.registration_authority,
            designation=payload.designation or "Consultant Physician",
            department=payload.department,
            hospital=payload.hospital,
            organization_id=payload.organization_id,
            department_id=payload.department_id,
            phone=payload.phone,
            bio=payload.bio,
            consultation_fee=payload.consultation_fee or 500,
            account_status="INVITED" if payload.send_invitation else "ACTIVE",
            verification_status=payload.verification_status or "VERIFIED",
            invitation_token=invitation_token,
            invitation_sent_at=datetime.now(timezone.utc) if payload.send_invitation else None
        )
        db.add(new_doctor)
        db.commit()
        db.refresh(new_doctor)

        # 6. Immutable Audit Log
        AdminService.log_audit(
            db=db,
            actor=current_admin,
            action="CREATE_DOCTOR",
            resource="Doctor",
            resource_id=generated_doctor_id,
            status_str="SUCCESS",
            details=f"Created physician profile {payload.name} ({payload.specialization}) at {payload.hospital}",
            ip_address=ip_address
        )

        return DoctorItemResponse(
            id=new_doctor.id,
            user_id=new_user.id,
            doctor_id=new_doctor.doctor_id,
            name=new_user.name,
            email=new_user.email,
            phone=new_doctor.phone or "Not provided",
            specialization=new_doctor.specialization,
            qualification=new_doctor.qualification,
            experience=new_doctor.experience,
            registration_number=new_doctor.registration_number,
            registration_authority=new_doctor.registration_authority,
            designation=new_doctor.designation,
            department=new_doctor.department,
            hospital=new_doctor.hospital,
            organization_id=new_doctor.organization_id,
            department_id=new_doctor.department_id,
            consultation_fee=new_doctor.consultation_fee,
            account_status=new_doctor.account_status,
            verification_status=new_doctor.verification_status,
            is_active=new_user.is_active,
            invitation_sent=bool(new_doctor.invitation_sent_at),
            created_at=new_doctor.created_at.strftime("%d %b %Y"),
            updated_at=new_doctor.updated_at.strftime("%d %b %Y")
        )

    @staticmethod
    def update_doctor(
        doctor_id: str,
        payload: DoctorUpdateRequest,
        current_admin: User,
        db: Session,
        ip_address: Optional[str] = None
    ) -> DoctorItemResponse:
        d = db.query(Doctor).join(User).filter(
            or_(Doctor.id == doctor_id, Doctor.doctor_id == doctor_id)
        ).first()
        if not d:
            raise AppException(status_code=status.HTTP_404_NOT_FOUND, detail="Doctor not found.")

        if payload.name and d.user:
            d.user.name = payload.name.strip()
        if payload.phone is not None:
            d.phone = payload.phone
        if payload.specialization is not None:
            d.specialization = payload.specialization
        if payload.qualification is not None:
            d.qualification = payload.qualification
        if payload.experience is not None:
            d.experience = payload.experience
        if payload.medical_registration_number is not None:
            d.registration_number = payload.medical_registration_number
        if payload.registration_authority is not None:
            d.registration_authority = payload.registration_authority
        if payload.designation is not None:
            d.designation = payload.designation
        if payload.department is not None:
            d.department = payload.department
        if payload.hospital is not None:
            d.hospital = payload.hospital
        if payload.bio is not None:
            d.bio = payload.bio
        if payload.consultation_fee is not None:
            d.consultation_fee = payload.consultation_fee

        d.updated_at = datetime.now(timezone.utc)
        db.commit()
        db.refresh(d)

        AdminService.log_audit(
            db=db,
            actor=current_admin,
            action="UPDATE_DOCTOR",
            resource="Doctor",
            resource_id=d.doctor_id,
            status_str="SUCCESS",
            details=f"Updated details for doctor {d.doctor_id}",
            ip_address=ip_address
        )

        return AdminService.get_doctor_by_id(d.id, db)

    @staticmethod
    def verify_doctor(
        doctor_id: str,
        payload: DoctorVerifyRequest,
        current_admin: User,
        db: Session,
        ip_address: Optional[str] = None
    ) -> DoctorItemResponse:
        d = db.query(Doctor).join(User).filter(
            or_(Doctor.id == doctor_id, Doctor.doctor_id == doctor_id)
        ).first()
        if not d:
            raise AppException(status_code=status.HTTP_404_NOT_FOUND, detail="Doctor not found.")

        d.verification_status = payload.status
        if payload.status == "VERIFIED" and d.account_status == "ACTIVATION_PENDING":
            d.account_status = "ACTIVE"
        d.updated_at = datetime.now(timezone.utc)
        db.commit()

        AdminService.log_audit(
            db=db,
            actor=current_admin,
            action="VERIFY_DOCTOR",
            resource="Doctor",
            resource_id=d.doctor_id,
            status_str="SUCCESS",
            details=f"Set verification status to {payload.status}. Notes: {payload.notes or 'None'}",
            ip_address=ip_address
        )

        return AdminService.get_doctor_by_id(d.id, db)

    @staticmethod
    def suspend_doctor(
        doctor_id: str,
        payload: DoctorSuspendRequest,
        current_admin: User,
        db: Session,
        ip_address: Optional[str] = None
    ) -> DoctorItemResponse:
        d = db.query(Doctor).join(User).filter(
            or_(Doctor.id == doctor_id, Doctor.doctor_id == doctor_id)
        ).first()
        if not d:
            raise AppException(status_code=status.HTTP_404_NOT_FOUND, detail="Doctor not found.")

        if payload.suspend:
            d.account_status = "SUSPENDED"
            if d.user:
                d.user.is_active = False
        else:
            d.account_status = "ACTIVE"
            if d.user:
                d.user.is_active = True

        d.updated_at = datetime.now(timezone.utc)
        db.commit()

        action_name = "SUSPEND_DOCTOR" if payload.suspend else "REACTIVATE_DOCTOR"
        AdminService.log_audit(
            db=db,
            actor=current_admin,
            action=action_name,
            resource="Doctor",
            resource_id=d.doctor_id,
            status_str="SUCCESS",
            details=f"{'Suspended' if payload.suspend else 'Reactivated'} doctor {d.doctor_id}. Reason: {payload.reason or 'Administrative decision'}",
            ip_address=ip_address
        )

        return AdminService.get_doctor_by_id(d.id, db)

    @staticmethod
    def get_patients(
        db: Session,
        search: Optional[str] = None,
        city: Optional[str] = None,
        page: int = 1,
        page_size: int = 10
    ) -> PatientListResponse:
        query = db.query(Patient).join(User)

        if search:
            s = f"%{search.strip()}%"
            query = query.filter(
                or_(
                    User.name.ilike(s),
                    User.email.ilike(s),
                    Patient.phone.ilike(s),
                    Patient.city.ilike(s),
                    Patient.abha_id.ilike(s)
                )
            )

        if city:
            query = query.filter(Patient.city.ilike(f"%{city}%"))

        total_count = query.count()
        total_pages = max(1, math.ceil(total_count / page_size))
        offset = (page - 1) * page_size

        patients_list = query.order_by(desc(Patient.created_at)).offset(offset).limit(page_size).all()

        results: List[PatientItemResponse] = []
        for p in patients_list:
            r_count = db.query(MedicalRecord).filter(MedicalRecord.patient_id == p.id, MedicalRecord.is_deleted == False).count()
            a_count = db.query(Appointment).filter(Appointment.patient_id == p.id, Appointment.is_deleted == False).count()
            pr_count = db.query(Prescription).filter(Prescription.patient_id == p.id, Prescription.is_deleted == False).count()

            results.append(
                PatientItemResponse(
                    id=p.id,
                    user_id=p.user_id,
                    name=p.user.name if p.user else "Patient",
                    email=p.user.email if p.user else "",
                    phone=p.phone or "Not provided",
                    gender=p.gender or "Not Specified",
                    date_of_birth=p.date_of_birth,
                    city=p.city or "New Delhi",
                    state=p.state or "Delhi",
                    country=p.country or "India",
                    blood_group=p.blood_group,
                    abha_id=p.abha_id or f"ABHA-{p.id[:8].upper()}-2026",
                    kyc_verified=bool(p.kyc_verified),
                    is_active=bool(p.user.is_active) if p.user else False,
                    records_count=r_count,
                    appointments_count=a_count,
                    prescriptions_count=pr_count,
                    created_at=p.created_at.strftime("%d %b %Y") if p.created_at else ""
                )
            )

        return PatientListResponse(
            patients=results,
            total_count=total_count,
            page=page,
            page_size=page_size,
            total_pages=total_pages
        )

    @staticmethod
    def toggle_patient_status(
        patient_id: str,
        payload: PatientStatusToggleRequest,
        current_admin: User,
        db: Session,
        ip_address: Optional[str] = None
    ) -> bool:
        p = db.query(Patient).join(User).filter(Patient.id == patient_id).first()
        if not p:
            raise AppException(status_code=status.HTTP_404_NOT_FOUND, detail="Patient not found.")

        if p.user:
            p.user.is_active = payload.is_active
            db.commit()

        action_name = "REACTIVATE_PATIENT" if payload.is_active else "RESTRICT_PATIENT"
        AdminService.log_audit(
            db=db,
            actor=current_admin,
            action=action_name,
            resource="Patient",
            resource_id=p.id,
            status_str="SUCCESS",
            details=f"{'Reactivated' if payload.is_active else 'Restricted'} patient {p.user.name if p.user else p.id}. Reason: {payload.reason or 'Administrative'}",
            ip_address=ip_address
        )
        return True

    @staticmethod
    def get_organizations(db: Session) -> OrganizationListResponse:
        AdminService.ensure_default_organizations(db)
        orgs = db.query(Organization).order_by(Organization.name.asc()).all()

        results: List[OrganizationResponse] = []
        for o in orgs:
            dept_count = db.query(Department).filter(Department.organization_id == o.id).count()
            doc_count = db.query(Doctor).filter(Doctor.hospital.ilike(f"%{o.name}%")).count()
            results.append(
                OrganizationResponse(
                    id=o.id,
                    name=o.name,
                    organization_type=o.organization_type or "Hospital",
                    code=o.code,
                    address=o.address,
                    city=o.city,
                    state=o.state,
                    country=o.country,
                    phone=o.phone,
                    email=o.email,
                    license_number=o.license_number,
                    departments_count=dept_count,
                    doctors_count=doc_count,
                    is_active=bool(o.is_active),
                    created_at=o.created_at.strftime("%d %b %Y") if o.created_at else ""
                )
            )

        return OrganizationListResponse(organizations=results, total_count=len(results))

    @staticmethod
    def create_organization(
        payload: OrganizationCreateRequest,
        current_admin: User,
        db: Session,
        ip_address: Optional[str] = None
    ) -> OrganizationResponse:
        new_org = Organization(
            name=payload.name.strip(),
            organization_type=payload.organization_type,
            code=payload.code or f"ORG-{datetime.now().year}-{secrets.token_hex(2).upper()}",
            address=payload.address,
            city=payload.city,
            state=payload.state,
            phone=payload.phone,
            email=payload.email,
            license_number=payload.license_number,
            is_active=True
        )
        db.add(new_org)
        db.commit()
        db.refresh(new_org)

        AdminService.log_audit(
            db=db,
            actor=current_admin,
            action="CREATE_ORGANIZATION",
            resource="Organization",
            resource_id=new_org.id,
            status_str="SUCCESS",
            details=f"Created medical organization '{new_org.name}' ({new_org.organization_type})",
            ip_address=ip_address
        )

        return OrganizationResponse(
            id=new_org.id,
            name=new_org.name,
            organization_type=new_org.organization_type,
            code=new_org.code,
            address=new_org.address,
            city=new_org.city,
            state=new_org.state,
            country=new_org.country,
            phone=new_org.phone,
            email=new_org.email,
            license_number=new_org.license_number,
            departments_count=0,
            doctors_count=0,
            is_active=True,
            created_at=new_org.created_at.strftime("%d %b %Y")
        )

    @staticmethod
    def get_departments(db: Session, organization_id: Optional[str] = None) -> DepartmentListResponse:
        AdminService.ensure_default_organizations(db)
        query = db.query(Department).join(Organization)
        if organization_id:
            query = query.filter(Department.organization_id == organization_id)

        depts = query.order_by(Department.name.asc()).all()
        results: List[DepartmentResponse] = []
        for d in depts:
            doc_count = db.query(Doctor).filter(Doctor.department.ilike(f"%{d.name}%")).count()
            results.append(
                DepartmentResponse(
                    id=d.id,
                    organization_id=d.organization_id,
                    organization_name=d.organization.name if d.organization else "Hospital",
                    name=d.name,
                    code=d.code,
                    head_doctor_name=d.head_doctor_name,
                    description=d.description,
                    doctors_count=doc_count,
                    is_active=bool(d.is_active),
                    created_at=d.created_at.strftime("%d %b %Y") if d.created_at else ""
                )
            )

        return DepartmentListResponse(departments=results, total_count=len(results))

    @staticmethod
    def create_department(
        payload: DepartmentCreateRequest,
        current_admin: User,
        db: Session,
        ip_address: Optional[str] = None
    ) -> DepartmentResponse:
        org = db.query(Organization).filter(Organization.id == payload.organization_id).first()
        if not org:
            raise AppException(status_code=status.HTTP_404_NOT_FOUND, detail="Organization not found.")

        new_dept = Department(
            organization_id=org.id,
            name=payload.name.strip(),
            code=payload.code or payload.name[:4].upper(),
            head_doctor_name=payload.head_doctor_name,
            description=payload.description,
            is_active=True
        )
        db.add(new_dept)
        db.commit()
        db.refresh(new_dept)

        AdminService.log_audit(
            db=db,
            actor=current_admin,
            action="CREATE_DEPARTMENT",
            resource="Department",
            resource_id=new_dept.id,
            status_str="SUCCESS",
            details=f"Created department '{new_dept.name}' under {org.name}",
            ip_address=ip_address
        )

        return DepartmentResponse(
            id=new_dept.id,
            organization_id=org.id,
            organization_name=org.name,
            name=new_dept.name,
            code=new_dept.code,
            head_doctor_name=new_dept.head_doctor_name,
            description=new_dept.description,
            doctors_count=0,
            is_active=True,
            created_at=new_dept.created_at.strftime("%d %b %Y")
        )

    @staticmethod
    def get_audit_logs(
        db: Session,
        action: Optional[str] = None,
        resource: Optional[str] = None,
        search: Optional[str] = None,
        page: int = 1,
        page_size: int = 20
    ) -> AuditLogListResponse:
        query = db.query(AuditLog)

        if action and action != "ALL":
            query = query.filter(AuditLog.action == action)

        if resource and resource != "ALL":
            query = query.filter(AuditLog.resource == resource)

        if search:
            s = f"%{search.strip()}%"
            query = query.filter(
                or_(
                    AuditLog.actor_name.ilike(s),
                    AuditLog.action.ilike(s),
                    AuditLog.resource.ilike(s),
                    AuditLog.details.ilike(s)
                )
            )

        total_count = query.count()
        total_pages = max(1, math.ceil(total_count / page_size))
        offset = (page - 1) * page_size

        logs = query.order_by(desc(AuditLog.created_at)).offset(offset).limit(page_size).all()

        results = [
            AuditLogResponse(
                id=l.id,
                actor_id=l.actor_id,
                actor_name=l.actor_name,
                actor_role=l.actor_role,
                action=l.action,
                resource=l.resource,
                resource_id=l.resource_id,
                ip_address=l.ip_address or "Internal",
                status=l.status,
                details=l.details,
                created_at=l.created_at.strftime("%d %b %Y, %I:%M:%S %p") if l.created_at else ""
            ) for l in logs
        ]

        return AuditLogListResponse(
            logs=results,
            total_count=total_count,
            page=page,
            page_size=page_size,
            total_pages=total_pages
        )

    @staticmethod
    def send_push_notification(
        payload: Any,
        current_admin: User,
        db: Session,
        ip_address: Optional[str] = None
    ) -> Any:
        # Determine target recipient count
        target_count = 0
        if payload.audience == "All Patients":
            target_count = db.query(Patient).join(User).filter(User.is_active == True).count()
        elif payload.audience == "All Doctors":
            target_count = db.query(Doctor).join(User).filter(User.is_active == True).count()
        elif payload.target_user_ids:
            target_count = len(payload.target_user_ids)
        else:
            target_count = db.query(User).filter(User.is_active == True).count()

        from app.models.admin import AdminPushNotification
        notif = AdminPushNotification(
            title=payload.title.strip(),
            message=payload.message.strip(),
            audience=payload.audience,
            target_count=target_count,
            sent_by_name=current_admin.name if current_admin else "Super Admin",
            sent_by_id=current_admin.id if current_admin else None,
            status="Sent",
            created_at=datetime.now(timezone.utc)
        )
        db.add(notif)
        db.commit()
        db.refresh(notif)

        # Log audit event
        AdminService.log_audit(
            db=db,
            actor=current_admin,
            action="SEND_NOTIFICATION",
            resource="Notification",
            resource_id=notif.id,
            status_str="SUCCESS",
            details=f"Sent push notification '{notif.title}' to {notif.audience} ({target_count} recipients)",
            ip_address=ip_address
        )

        from app.schemas.admin import PushNotificationItemResponse
        return PushNotificationItemResponse(
            id=notif.id,
            title=notif.title,
            message=notif.message,
            audience=notif.audience,
            target_count=notif.target_count,
            sent_by_name=notif.sent_by_name,
            status=notif.status,
            created_at=notif.created_at.strftime("%d %b %Y, %I:%M %p")
        )

    @staticmethod
    def get_push_notifications(db: Session) -> Any:
        from app.models.admin import AdminPushNotification
        from app.schemas.admin import PushNotificationListResponse, PushNotificationItemResponse
        
        # Ensure at least sample baseline notification if table empty
        count = db.query(AdminPushNotification).count()
        if count == 0:
            sample = AdminPushNotification(
                title="MediAssist Platform Maintenance",
                message="Scheduled system maintenance on 20 Aug 2026 from 02:00 AM to 03:00 AM UTC.",
                audience="All Patients",
                target_count=1248,
                sent_by_name="Super Admin",
                status="Sent",
                created_at=datetime.now(timezone.utc)
            )
            db.add(sample)
            db.commit()

        notifs = db.query(AdminPushNotification).order_by(desc(AdminPushNotification.created_at)).all()
        items = [
            PushNotificationItemResponse(
                id=n.id,
                title=n.title,
                message=n.message,
                audience=n.audience,
                target_count=n.target_count,
                sent_by_name=n.sent_by_name,
                status=n.status,
                created_at=n.created_at.strftime("%d %b %Y, %I:%M %p") if n.created_at else ""
            ) for n in notifs
        ]
        return PushNotificationListResponse(notifications=items, total_count=len(items))

    @staticmethod
    def get_appointments_list(
        db: Session,
        status_filter: Optional[str] = None,
        search: Optional[str] = None,
        limit: int = 50
    ) -> Any:
        from app.models.appointment import Appointment
        from app.schemas.admin import AdminAppointmentListResponse, AdminAppointmentItemResponse

        query = db.query(Appointment).filter(Appointment.is_deleted == False)

        if status_filter and status_filter != "ALL":
            query = query.filter(Appointment.status == status_filter)

        if search:
            s = f"%{search.strip()}%"
            query = query.filter(
                or_(
                    Appointment.doctor_name.ilike(s),
                    Appointment.doctor_specialty.ilike(s),
                    Appointment.session_name.ilike(s)
                )
            )

        appts = query.order_by(Appointment.appointment_date.asc(), Appointment.appointment_time.asc()).limit(limit).all()

        items: List[AdminAppointmentItemResponse] = []
        for a in appts:
            patient_name = "John Doe"
            patient_email = "patient@example.com"
            patient_id_display = f"PT-{a.patient_id[:5].upper()}" if a.patient_id else "PT-00121"
            
            if a.patient and a.patient.user:
                patient_name = a.patient.user.name
                patient_email = a.patient.user.email
                patient_id_display = f"PT-{a.patient.id[:5].upper()}"

            items.append(
                AdminAppointmentItemResponse(
                    id=a.id,
                    time=a.appointment_time or "10:00 AM",
                    date=a.appointment_date or "Today",
                    patient_id=patient_id_display,
                    patient_name=patient_name,
                    patient_email=patient_email,
                    doctor_id=f"DR-{a.doctor_id[:5].upper()}" if a.doctor_id else "DR-00184",
                    doctor_name=a.doctor_name or "Dr. Physician",
                    doctor_specialty=a.doctor_specialty or "General Medicine",
                    appointment_type=a.mode or "In-Person",
                    status=a.status or "Confirmed"
                )
            )

        return AdminAppointmentListResponse(appointments=items, total_count=len(items))

admin_service = AdminService()
