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
    consultation_id = Column(String(36), ForeignKey("consultations.id", ondelete="CASCADE"), nullable=True, index=True)
    patient_id = Column(String(36), ForeignKey("patients.id", ondelete="CASCADE"), nullable=False, index=True)
    ai_conversation_id = Column(String(36), ForeignKey("ai_conversations.id", ondelete="SET NULL"), nullable=True, index=True)
    language = Column(String(10), nullable=False, default="en")
    status = Column(SQLEnum(VoiceSessionStatus), nullable=False, default=VoiceSessionStatus.IDLE)
    conversation_mode = Column(String(50), nullable=False, default="HEALTH_CONSULTATION")
    transcript = Column(Text, nullable=True)
    summary = Column(Text, nullable=True)
    key_points = Column(Text, nullable=True)  # JSON string array
    extracted_medical_context = Column(Text, nullable=True)  # JSON string
    safety_flags = Column(Text, nullable=True)  # JSON string
    started_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    ended_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    messages = relationship("VoiceMessage", back_populates="voice_session", cascade="all, delete-orphan", order_by="VoiceMessage.sequence_number")

class VoiceMessage(Base):
    __tablename__ = "voice_messages"

    id = Column(String(36), primary_key=True, default=generate_uuid, index=True)
    voice_session_id = Column(String(36), ForeignKey("voice_sessions.id", ondelete="CASCADE"), nullable=False, index=True)
    role = Column(String(20), nullable=False)  # "user", "assistant", "system"
    content = Column(Text, nullable=False)  # Raw spoken transcript text
    sequence_number = Column(Integer, nullable=False, default=1)
    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    message_type = Column(String(50), nullable=False, default="voice_transcription")  # voice_input, voice_transcription, assistant_response, system_event, summary
    metadata_json = Column(Text, nullable=True)  # JSON string for intent, latency, etc.
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    voice_session = relationship("VoiceSession", back_populates="messages")


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
