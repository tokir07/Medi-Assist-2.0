import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey, Integer, Text, Float
from sqlalchemy.orm import relationship
from app.database.database import Base

def generate_uuid():
    return str(uuid.uuid4())

class MedicalRecord(Base):
    __tablename__ = "medical_records"

    id = Column(String(36), primary_key=True, default=generate_uuid, index=True)
    patient_id = Column(String(36), ForeignKey("patients.id", ondelete="CASCADE"), nullable=False, index=True)
    
    title = Column(String(255), nullable=False)
    category = Column(String(50), nullable=False, default="Others")  # Lab Report, Radiology, Prescription, Consultation, Discharge Summary, Others
    file_name = Column(String(255), nullable=True)
    file_type = Column(String(50), nullable=False, default="PDF")   # PDF, DICOM, JPG, PNG, etc.
    file_size = Column(Integer, nullable=False, default=0)          # in bytes
    file_size_formatted = Column(String(50), nullable=True, default="0 KB")
    file_path = Column(String(500), nullable=True)
    
    doctor_name = Column(String(255), nullable=True)
    hospital = Column(String(255), nullable=True)
    record_date = Column(String(50), nullable=True)                 # e.g., "26 Aug 2026, 09:15 AM" or ISO
    tags = Column(Text, nullable=True)                              # JSON string array e.g., '["Routine", "Annual"]'
    description = Column(Text, nullable=True)
    
    # Session Grouping
    session_name = Column(String(255), nullable=False, default="General Records", index=True)
    
    # Extraction Pipeline & Structured Data
    extracted_text = Column(Text, nullable=True)                    # Raw PDF text extracted via pypdf
    extracted_data = Column(Text, nullable=True)                    # JSON object of structured clinical entities
    extraction_status = Column(String(50), default="PENDING", nullable=False, index=True) # PENDING, EXTRACTING, COMPLETED, FAILED
    approval_status = Column(String(50), default="REVIEW_REQUIRED", nullable=False, index=True) # REVIEW_REQUIRED, APPROVED, EDITED, REJECTED
    confidence_score = Column(Float, default=1.0, nullable=False)
    
    # Favorites & Importance
    is_important = Column(Boolean, default=False, nullable=False, index=True)
    
    # Audit trail (JSON array of timestamps and actions)
    audit_log = Column(Text, nullable=True)
    
    # Soft deletion / recycle bin
    is_deleted = Column(Boolean, default=False, nullable=False, index=True)
    deleted_at = Column(DateTime, nullable=True)
    
    # Sharing tracking
    shared_with = Column(Text, nullable=True)                       # JSON array of shared recipient metadata

    # Document-Level AI Report Summary & Clinician Review
    summary_quick = Column(Text, nullable=True)
    summary_detailed = Column(Text, nullable=True)
    summary_structured = Column(Text, nullable=True)                # JSON object of structured summary
    summary_status = Column(String(50), default="NOT_GENERATED", nullable=False, index=True) # NOT_GENERATED, GENERATING, GENERATED, FAILED, OUTDATED
    summary_version = Column(Integer, default=1, nullable=False)
    summary_generated_at = Column(DateTime, nullable=True)
    clinician_review_status = Column(String(50), default="NOT_REVIEWED", nullable=False, index=True) # NOT_REVIEWED, CLINICIAN_REVIEWED
    
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    patient = relationship("Patient", backref="medical_records")
