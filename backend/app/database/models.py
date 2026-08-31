import enum
import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Boolean, DateTime, Enum as SQLEnum, ForeignKey, Integer, Text
from sqlalchemy.orm import relationship
from app.database.database import Base

class UserRole(str, enum.Enum):
    PATIENT = "PATIENT"
    DOCTOR = "DOCTOR"
    ADMIN = "ADMIN"

def generate_uuid():
    return str(uuid.uuid4())

class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=generate_uuid, index=True)
    google_sub = Column(String(255), unique=True, index=True, nullable=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    name = Column(String(255), nullable=False)
    password_hash = Column(String(255), nullable=True)
    profile_image = Column(Text, nullable=True)
    role = Column(SQLEnum(UserRole), nullable=False, default=UserRole.PATIENT)
    is_active = Column(Boolean, default=True, nullable=False)
    is_onboarded = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    doctor_profile = relationship("Doctor", back_populates="user", uselist=False, cascade="all, delete-orphan")
    patient_profile = relationship("Patient", back_populates="user", uselist=False, cascade="all, delete-orphan")

    def to_dict(self):
        return {
            "id": self.id,
            "google_sub": self.google_sub,
            "email": self.email,
            "name": self.name,
            "profile_image": self.profile_image,
            "role": self.role.value if isinstance(self.role, UserRole) else str(self.role),
            "is_active": self.is_active,
            "is_onboarded": self.is_onboarded,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }

class Doctor(Base):
    __tablename__ = "doctors"

    id = Column(String(36), primary_key=True, default=generate_uuid, index=True)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, unique=True)
    doctor_id = Column(String(100), unique=True, index=True, nullable=False)  # e.g., DR-2026-000184
    specialization = Column(String(255), nullable=False, default="General Medicine")
    registration_number = Column(String(100), unique=True, nullable=True)
    registration_authority = Column(String(255), nullable=True, default="National Medical Commission")
    qualification = Column(String(255), nullable=True, default="MBBS, MD")
    designation = Column(String(255), nullable=True, default="Consultant Physician")
    department = Column(String(255), nullable=True, default="General Medicine")
    hospital = Column(String(255), nullable=True, default="City Care Hospital")
    organization_id = Column(String(36), nullable=True)
    department_id = Column(String(36), nullable=True)
    experience = Column(Integer, nullable=True, default=5)
    phone = Column(String(50), nullable=True)
    bio = Column(Text, nullable=True)
    consultation_fee = Column(Integer, default=500, nullable=True)
    
    # State Machine Fields:
    account_status = Column(String(50), nullable=False, default="ACTIVE")  # INVITED, ACTIVATION_PENDING, ACTIVE, SUSPENDED, DEACTIVATED
    verification_status = Column(String(50), nullable=False, default="VERIFIED")  # UNVERIFIED, PENDING_VERIFICATION, UNDER_REVIEW, VERIFIED, REJECTED, REVOKED
    invitation_token = Column(String(255), nullable=True)
    invitation_sent_at = Column(DateTime, nullable=True)
    invitation_accepted_at = Column(DateTime, nullable=True)

    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    user = relationship("User", back_populates="doctor_profile")

class Patient(Base):
    __tablename__ = "patients"

    id = Column(String(36), primary_key=True, default=generate_uuid, index=True)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, unique=True)
    date_of_birth = Column(String(50), nullable=True)
    gender = Column(String(50), nullable=True)
    blood_group = Column(String(20), nullable=True)
    phone = Column(String(50), nullable=True)
    address = Column(String(500), nullable=True)
    city = Column(String(100), nullable=True)
    state = Column(String(100), nullable=True)
    postal_code = Column(String(20), nullable=True)
    country = Column(String(100), nullable=True, default="India")
    marital_status = Column(String(50), nullable=True, default="Married")
    allergies = Column(String(255), nullable=True, default="Pollen, Penicillin")
    chronic_conditions = Column(String(255), nullable=True, default="None")
    current_medications = Column(String(255), nullable=True, default="Atorvastatin 10mg (Daily)")
    primary_physician = Column(String(255), nullable=True, default="Dr. Priya Sharma")
    primary_physician_specialty = Column(String(100), nullable=True, default="General Physician")
    kyc_verified = Column(Boolean, default=True, nullable=False)
    abha_id = Column(String(100), nullable=True)
    emergency_contact = Column(Text, nullable=True)  # Stored as JSON string
    medical_history = Column(Text, nullable=True)    # Stored as JSON string
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    user = relationship("User", back_populates="patient_profile")
