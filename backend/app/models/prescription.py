import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey, Integer, Text
from sqlalchemy.orm import relationship
from app.database.database import Base

def generate_uuid():
    return str(uuid.uuid4())

class Prescription(Base):
    __tablename__ = "prescriptions"

    id = Column(String(36), primary_key=True, default=generate_uuid, index=True)
    patient_id = Column(String(36), ForeignKey("patients.id", ondelete="CASCADE"), nullable=False, index=True)
    record_id = Column(String(36), ForeignKey("medical_records.id", ondelete="SET NULL"), nullable=True, index=True)
    appointment_id = Column(String(36), ForeignKey("appointments.id", ondelete="SET NULL"), nullable=True, index=True)

    # Prescription Identification & Context
    title = Column(String(255), nullable=True) # e.g. "Prescription - Dr. Priya Sharma"
    session_name = Column(String(100), nullable=True, default="General Records")
    diagnosis_or_indication = Column(Text, nullable=True) # e.g. "Upper Respiratory Tract Infection"
    
    # Primary medication fields (for backward compatibility and single-med queries)
    medication_name = Column(String(255), nullable=False)
    generic_name = Column(String(255), nullable=True)
    dosage = Column(String(100), nullable=True, default="1 tablet")
    frequency = Column(String(100), nullable=True, default="Twice daily")
    duration = Column(String(100), nullable=True, default="7 days")
    instructions = Column(Text, nullable=True)
    
    # Structured Multi-Medication Array (JSON string)
    # Stores list of: [{ id, medication_name, generic_name, brand_name, dosage, dosage_unit, frequency, route, duration, duration_unit, instructions, quantity, refills, notes }]
    medications_data = Column(Text, nullable=True)

    # Provider details
    doctor_name = Column(String(255), nullable=True, default="Dr. Priya Sharma")
    doctor_specialty = Column(String(100), nullable=True, default="General Physician")
    hospital = Column(String(255), nullable=True, default="MediAssist Medical Center")
    
    # Dates
    prescribed_date = Column(String(50), nullable=True)
    valid_until = Column(String(50), nullable=True)
    
    # Prescription Clinical Status: ACTIVE, COMPLETED, EXPIRED, CANCELLED, ARCHIVED, UNKNOWN
    status = Column(String(50), nullable=False, default="Active", index=True)
    
    # Patient Approval & Clinician Verification States
    approval_status = Column(String(50), nullable=False, default="APPROVED") # REVIEW_REQUIRED, APPROVED, EDITED, REJECTED
    clinician_review_status = Column(String(50), nullable=False, default="NOT_REVIEWED") # NOT_REVIEWED, CLINICIAN_REVIEWED
    provenance = Column(String(50), nullable=False, default="AI_EXTRACTED") # AI_EXTRACTED, MANUALLY_ADDED, PATIENT_EDITED, CLINICIAN_ENTERED
    
    # Refills & Pharmacy
    refills_remaining = Column(Integer, nullable=False, default=0)
    refill_recommended = Column(Boolean, default=False, nullable=False)
    
    # Notes & Remarks
    notes = Column(Text, nullable=True)

    # Soft Delete
    is_deleted = Column(Boolean, default=False, nullable=False, index=True)
    deleted_at = Column(DateTime, nullable=True)
    
    # Linked Document File Path / Name
    document_file_path = Column(String(500), nullable=True)
    document_file_name = Column(String(255), nullable=True)
    
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    patient = relationship("Patient", backref="prescriptions")
    record = relationship("MedicalRecord", backref="linked_prescription", foreign_keys=[record_id])
    appointment = relationship("Appointment", backref="prescriptions", foreign_keys=[appointment_id])
    reminders = relationship("MedicationReminder", back_populates="prescription", cascade="all, delete-orphan")


class MedicationReminder(Base):
    __tablename__ = "medication_reminders"

    id = Column(String(36), primary_key=True, default=generate_uuid, index=True)
    patient_id = Column(String(36), ForeignKey("patients.id", ondelete="CASCADE"), nullable=False, index=True)
    prescription_id = Column(String(36), ForeignKey("prescriptions.id", ondelete="SET NULL"), nullable=True, index=True)

    medication_name = Column(String(255), nullable=False)
    dosage_instruction = Column(String(255), nullable=False)  # e.g., "1 tablet after breakfast"
    time_str = Column(String(50), nullable=False)            # e.g., "08:00 AM", "08:00 AM Every Sunday", "02:00 PM", "08:00 PM"
    
    is_taken = Column(Boolean, default=False, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    prescription = relationship("Prescription", back_populates="reminders")
