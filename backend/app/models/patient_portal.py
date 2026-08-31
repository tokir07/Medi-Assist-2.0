import enum
import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Boolean, DateTime, Enum as SQLEnum, ForeignKey, Integer, Text
from sqlalchemy.orm import relationship
from app.database.database import Base

def generate_uuid():
    return str(uuid.uuid4())

class ConsultationStatus(str, enum.Enum):
    NOT_STARTED = "NOT_STARTED"
    IN_PROGRESS = "IN_PROGRESS"
    REVIEW = "REVIEW"
    COMPLETED = "COMPLETED"
    CANCELLED = "CANCELLED"

class VoiceSessionStatus(str, enum.Enum):
    IDLE = "IDLE"
    LISTENING = "LISTENING"
    PROCESSING = "PROCESSING"
    SPEAKING = "SPEAKING"
    PAUSED = "PAUSED"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"

class Consultation(Base):
    __tablename__ = "consultations"

    id = Column(String(36), primary_key=True, default=generate_uuid, index=True)
    patient_id = Column(String(36), ForeignKey("patients.id", ondelete="CASCADE"), nullable=False, index=True)
    status = Column(SQLEnum(ConsultationStatus), nullable=False, default=ConsultationStatus.IN_PROGRESS)
    language = Column(String(10), nullable=False, default="en")
    chief_complaint = Column(String(255), nullable=True)
    original_complaint_text = Column(Text, nullable=True)
    current_step = Column(String(50), nullable=False, default="CHIEF_COMPLAINT")
    started_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    completed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    questions = relationship("ConsultationQuestion", back_populates="consultation", cascade="all, delete-orphan")
    answers = relationship("ConsultationAnswer", back_populates="consultation", cascade="all, delete-orphan")

class ConsultationQuestion(Base):
    __tablename__ = "consultation_questions"

    id = Column(String(36), primary_key=True, default=generate_uuid, index=True)
    consultation_id = Column(String(36), ForeignKey("consultations.id", ondelete="CASCADE"), nullable=False, index=True)
    sequence_number = Column(Integer, nullable=False, default=1)
    question_text = Column(Text, nullable=False)
    question_type = Column(String(50), nullable=False, default="TEXT")  # TEXT, SINGLE_CHOICE, MULTI_CHOICE, YES_NO
    options = Column(Text, nullable=True)  # JSON string array of options
    is_required = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    consultation = relationship("Consultation", back_populates="questions")

class ConsultationAnswer(Base):
    __tablename__ = "consultation_answers"

    id = Column(String(36), primary_key=True, default=generate_uuid, index=True)
    consultation_id = Column(String(36), ForeignKey("consultations.id", ondelete="CASCADE"), nullable=False, index=True)
    question_id = Column(String(36), nullable=False)
    answer_text = Column(Text, nullable=False)
    structured_value = Column(Text, nullable=True)  # JSON string
    input_method = Column(String(50), nullable=False, default="TEXT")  # TEXT, VOICE, TOUCH
    language = Column(String(10), nullable=False, default="en")
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    consultation = relationship("Consultation", back_populates="answers")

class VoiceSession(Base):
    __tablename__ = "voice_sessions"

    id = Column(String(36), primary_key=True, default=generate_uuid, index=True)
    consultation_id = Column(String(36), ForeignKey("consultations.id", ondelete="CASCADE"), nullable=False, index=True)
    patient_id = Column(String(36), ForeignKey("patients.id", ondelete="CASCADE"), nullable=False, index=True)
    language = Column(String(10), nullable=False, default="en")
    status = Column(SQLEnum(VoiceSessionStatus), nullable=False, default=VoiceSessionStatus.IDLE)
    transcript = Column(Text, nullable=True)
    started_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    ended_at = Column(DateTime, nullable=True)

class ClinicalHistory(Base):
    __tablename__ = "clinical_histories"

    id = Column(String(36), primary_key=True, default=generate_uuid, index=True)
    patient_id = Column(String(36), ForeignKey("patients.id", ondelete="CASCADE"), nullable=False, index=True)
    consultation_id = Column(String(36), ForeignKey("consultations.id", ondelete="SET NULL"), nullable=True, index=True)
    chief_complaint = Column(Text, nullable=True)
    history_of_present_illness = Column(Text, nullable=True)
    past_history = Column(Text, nullable=True)
    medications = Column(Text, nullable=True)  # JSON string
    allergies = Column(Text, nullable=True)    # JSON string
    family_history = Column(Text, nullable=True)
    personal_history = Column(Text, nullable=True)
    review_of_systems = Column(Text, nullable=True) # JSON string
    provenance = Column(Text, nullable=True)        # JSON string tracking PATIENT_PROVIDED, AI_EXTRACTED, etc.
    generated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)
