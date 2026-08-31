import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey, Integer, Text, Float
from sqlalchemy.orm import relationship

from app.database.database import Base

def generate_uuid():
    return str(uuid.uuid4())

class AIConversation(Base):
    __tablename__ = "ai_conversations"

    id = Column(String(36), primary_key=True, default=generate_uuid, index=True)
    patient_id = Column(String(36), ForeignKey("patients.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(255), nullable=False, default="Health Consultation")
    status = Column(String(50), nullable=False, default="Active", index=True)
    consultation_state = Column(String(50), nullable=False, default="IN_PROGRESS", index=True) # IN_PROGRESS, READY_FOR_REVIEW, PATIENT_REVIEW, CONFIRMED, COMPLETED
    structured_context = Column(Text, nullable=True) # JSON of extracted clinical entity fields
    clinical_summary = Column(Text, nullable=True)
    summary_preview = Column(Text, nullable=True)
    is_pinned = Column(Boolean, default=False)
    is_deleted = Column(Boolean, default=False, index=True)
    
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), index=True)
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), index=True)

    # Relationships
    messages = relationship("AIMessage", back_populates="conversation", cascade="all, delete-orphan", order_by="AIMessage.created_at")
    patient = relationship("Patient", backref="ai_conversations")


class AIMessage(Base):
    __tablename__ = "ai_messages"

    id = Column(String(36), primary_key=True, default=generate_uuid, index=True)
    conversation_id = Column(String(36), ForeignKey("ai_conversations.id", ondelete="CASCADE"), nullable=False, index=True)
    sender_role = Column(String(20), nullable=False)  # "user", "ai", "system"
    content = Column(Text, nullable=False)
    message_type = Column(String(50), nullable=False, default="text")  # text, action, review_card, red_flag_alert
    structured_payload = Column(Text, nullable=True) # JSON payload for interactive review cards or red flags
    
    # Metadata & Telemetry
    model = Column(String(100), nullable=True)
    provider = Column(String(50), nullable=True, default="openrouter")
    action_data = Column(Text, nullable=True)  # JSON string for navigation buttons
    tokens_used = Column(Integer, nullable=True)
    latency_ms = Column(Float, nullable=True)
    liked = Column(Boolean, nullable=True)
    
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), index=True)

    # Relationships
    conversation = relationship("AIConversation", back_populates="messages")


class AISummary(Base):
    __tablename__ = "ai_summaries"

    id = Column(String(36), primary_key=True, default=generate_uuid, index=True)
    patient_id = Column(String(36), ForeignKey("patients.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(255), nullable=False, default="Clinical AI Conversation Summary")
    
    date_from = Column(String(50), nullable=False)
    date_to = Column(String(50), nullable=False)
    conversations_count = Column(Integer, nullable=False, default=1)
    
    # Structured Medical Report Fields (JSON / Text)
    main_concerns = Column(Text, nullable=True)         # JSON array of strings
    symptoms_mentioned = Column(Text, nullable=True)    # JSON array of strings
    medications_mentioned = Column(Text, nullable=True) # JSON array of strings
    patient_questions = Column(Text, nullable=True)     # JSON array of strings
    ai_guidance = Column(Text, nullable=True)
    follow_up_recommendations = Column(Text, nullable=True)
    unresolved_questions = Column(Text, nullable=True)
    
    # Doctor Readable Formatted Markdown
    doctor_readable_report = Column(Text, nullable=False)
    
    # Doctor Sharing
    is_shared_with_doctor = Column(Boolean, default=False)
    shared_with_doctor_id = Column(String(36), ForeignKey("doctors.id", ondelete="SET NULL"), nullable=True)
    shared_at = Column(DateTime(timezone=True), nullable=True)
    
    # Metadata
    model_used = Column(String(100), nullable=True, default="openai/gpt-4o-mini")
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), index=True)

    patient = relationship("Patient", backref="ai_summaries")
    doctor = relationship("Doctor", foreign_keys=[shared_with_doctor_id])
