import enum
import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Boolean, DateTime, Integer, Text, ForeignKey
from sqlalchemy.orm import relationship
from app.database.database import Base

def generate_uuid():
    return str(uuid.uuid4())

class Organization(Base):
    __tablename__ = "organizations"

    id = Column(String(36), primary_key=True, default=generate_uuid, index=True)
    name = Column(String(255), nullable=False, index=True)
    organization_type = Column(String(100), default="Hospital")  # Hospital, Clinic, Medical Center
    code = Column(String(50), unique=True, index=True, nullable=True)
    address = Column(String(500), nullable=True)
    city = Column(String(100), nullable=True, default="New Delhi")
    state = Column(String(100), nullable=True, default="Delhi")
    country = Column(String(100), nullable=True, default="India")
    phone = Column(String(50), nullable=True)
    email = Column(String(255), nullable=True)
    license_number = Column(String(100), nullable=True)
    rating = Column(String(10), default="4.8")
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    departments = relationship("Department", back_populates="organization", cascade="all, delete-orphan")

class Department(Base):
    __tablename__ = "departments"

    id = Column(String(36), primary_key=True, default=generate_uuid, index=True)
    organization_id = Column(String(36), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(255), nullable=False, index=True)  # Cardiology, Neurology, General Medicine, etc.
    code = Column(String(50), nullable=True)
    head_doctor_name = Column(String(255), nullable=True)
    description = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    organization = relationship("Organization", back_populates="departments")

class AuditLog(Base):
    """
    Immutable, Append-Only audit log table recording all administrative,
    clinical access, and sensitive security events across MediAssist.
    """
    __tablename__ = "audit_logs"

    id = Column(String(36), primary_key=True, default=generate_uuid, index=True)
    actor_id = Column(String(36), nullable=True, index=True)
    actor_name = Column(String(255), nullable=False)
    actor_role = Column(String(50), nullable=False)
    action = Column(String(100), nullable=False, index=True)  # CREATE_DOCTOR, VERIFY_DOCTOR, SUSPEND_DOCTOR, LOGIN, etc.
    resource = Column(String(100), nullable=False, index=True)  # Doctor, Patient, User, Organization, System
    resource_id = Column(String(100), nullable=True, index=True)
    ip_address = Column(String(100), nullable=True)
    user_agent = Column(String(500), nullable=True)
    status = Column(String(50), default="SUCCESS", nullable=False)  # SUCCESS, FAILED, WARNING
    details = Column(Text, nullable=True)  # JSON or text summary
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False, index=True)

class SystemConfiguration(Base):
    __tablename__ = "system_configurations"

    id = Column(String(36), primary_key=True, default=generate_uuid, index=True)
    config_key = Column(String(100), unique=True, index=True, nullable=False)
    config_value = Column(Text, nullable=False)
    category = Column(String(100), default="GENERAL")  # AI, SECURITY, NOTIFICATIONS, GENERAL
    description = Column(Text, nullable=True)
    is_sensitive = Column(Boolean, default=False, nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

class AdminPushNotification(Base):
    __tablename__ = "admin_push_notifications"

    id = Column(String(36), primary_key=True, default=generate_uuid, index=True)
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    audience = Column(String(100), default="All Patients", nullable=False)  # All Patients, All Doctors, Selected Patients, Selected Doctors
    target_count = Column(Integer, default=0, nullable=False)
    sent_by_name = Column(String(255), default="Super Admin", nullable=False)
    sent_by_id = Column(String(36), nullable=True)
    status = Column(String(50), default="Sent", nullable=False)  # Sent, Scheduled, Failed
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False, index=True)
