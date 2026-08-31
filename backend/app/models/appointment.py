import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey, Integer, Text
from sqlalchemy.orm import relationship
from app.database.database import Base

def generate_uuid():
    return str(uuid.uuid4())

class Appointment(Base):
    __tablename__ = "appointments"

    id = Column(String(36), primary_key=True, default=generate_uuid, index=True)
    patient_id = Column(String(36), ForeignKey("patients.id", ondelete="CASCADE"), nullable=False, index=True)
    doctor_id = Column(String(36), ForeignKey("doctors.id", ondelete="SET NULL"), nullable=True, index=True)

    # Doctor / Provider details
    doctor_name = Column(String(255), nullable=False, default="Dr. Priya Sharma")
    doctor_specialty = Column(String(100), nullable=False, default="General Physician")
    doctor_image = Column(Text, nullable=True)

    # Hospital / Clinic details
    hospital = Column(String(255), nullable=False, default="City Care Hospital")
    hospital_address = Column(String(255), nullable=True, default="New Delhi")

    # Appointment details
    appointment_type = Column(String(100), nullable=False, default="General Checkup")
    appointment_date = Column(String(50), nullable=False, index=True)   # e.g., "2026-08-29"
    appointment_time = Column(String(50), nullable=False)   # e.g., "10:30 AM", "04:15 PM"
    duration_minutes = Column(Integer, nullable=False, default=30)
    mode = Column(String(50), nullable=False, default="In-Person") # "In-Person" or "Video Call"
    consultation_link = Column(String(500), nullable=True) # Teleconsultation meeting link

    # Clinical Session & Linkage
    session_name = Column(String(100), nullable=True, default="General Consultation")
    rescheduled_from_id = Column(String(36), nullable=True)

    # Status: Confirmed, Pending, Completed, Cancelled, Rescheduled, Rejected
    status = Column(String(50), nullable=False, default="Confirmed", index=True)

    # Notes & Clinical Instructions
    notes = Column(Text, nullable=True) # Patient reason for visit / chief complaint
    preparation_instructions = Column(Text, nullable=True)
    cancellation_reason = Column(Text, nullable=True)
    cancelled_at = Column(DateTime, nullable=True)

    # Soft deletion
    is_deleted = Column(Boolean, default=False, nullable=False, index=True)
    deleted_at = Column(DateTime, nullable=True)

    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    patient = relationship("Patient", backref="appointments")
    doctor = relationship("Doctor", backref="appointments", foreign_keys=[doctor_id])
    messages = relationship("DoctorHealthMessage", back_populates="appointment", cascade="all, delete-orphan")


class DoctorHealthMessage(Base):
    __tablename__ = "doctor_health_messages"

    id = Column(String(36), primary_key=True, default=generate_uuid, index=True)
    patient_id = Column(String(36), ForeignKey("patients.id", ondelete="CASCADE"), nullable=False, index=True)
    doctor_id = Column(String(36), ForeignKey("doctors.id", ondelete="SET NULL"), nullable=True, index=True)
    appointment_id = Column(String(36), ForeignKey("appointments.id", ondelete="SET NULL"), nullable=True, index=True)

    doctor_name = Column(String(255), nullable=False, default="Dr. Priya Sharma")
    doctor_specialty = Column(String(100), nullable=False, default="General Physician")
    doctor_image = Column(Text, nullable=True)
    hospital = Column(String(255), nullable=False, default="MediAssist Medical Center")

    message_type = Column(String(50), nullable=False, default="CLINICAL_ADVICE") # CLINICAL_ADVICE, LAB_FOLLOWUP, CARE_INSTRUCTION, PRESCRIPTION_NOTE, GENERAL
    title = Column(String(255), nullable=False, default="Health Advice & Instructions")
    content = Column(Text, nullable=False)
    priority = Column(String(50), nullable=False, default="NORMAL") # NORMAL, HIGH, URGENT

    is_read = Column(Boolean, default=False, nullable=False, index=True)
    read_at = Column(DateTime, nullable=True)

    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    appointment = relationship("Appointment", back_populates="messages")
    patient = relationship("Patient", backref="doctor_health_messages")
