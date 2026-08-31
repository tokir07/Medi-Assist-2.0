from sqlalchemy import Column, String, Text, Boolean, Integer, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
import uuid

from app.database.database import Base

def generate_uuid():
    return str(uuid.uuid4())

class HealthTip(Base):
    __tablename__ = "health_tips"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    title = Column(String(255), nullable=False, index=True)
    summary = Column(Text, nullable=False)
    content = Column(Text, nullable=False)
    category = Column(String(100), nullable=False, index=True) # Nutrition, Sleep, Fitness, Mental Wellness, Preventive Care, Medication Awareness, General Wellness
    image_url = Column(String(500), nullable=True)
    read_time = Column(String(50), default="3 min read")
    is_featured = Column(Boolean, default=False, index=True)
    is_popular = Column(Boolean, default=False, index=True)
    popularity_rank = Column(Integer, nullable=True)
    author = Column(String(150), default="MediAssist Clinical Advisory")
    source = Column(String(255), default="MediAssist Medical Advisory & Evidence-Based Guidelines")
    reviewed_by = Column(String(255), default="Dr. Priya Sharma, MD")
    status = Column(String(50), default="Published", index=True) # Published, Draft, Archived
    tags = Column(Text, nullable=True) # comma separated or JSON string
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    # Relationships
    saves = relationship("SavedHealthTip", back_populates="tip", cascade="all, delete-orphan")
    views = relationship("HealthTipView", back_populates="tip", cascade="all, delete-orphan")


class SavedHealthTip(Base):
    __tablename__ = "saved_health_tips"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    patient_id = Column(String(36), ForeignKey("patients.id", ondelete="CASCADE"), nullable=False, index=True)
    tip_id = Column(String(36), ForeignKey("health_tips.id", ondelete="CASCADE"), nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    # Relationships
    tip = relationship("HealthTip", back_populates="saves")


class HealthTipView(Base):
    __tablename__ = "health_tip_views"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    patient_id = Column(String(36), ForeignKey("patients.id", ondelete="CASCADE"), nullable=False, index=True)
    tip_id = Column(String(36), ForeignKey("health_tips.id", ondelete="CASCADE"), nullable=False, index=True)
    viewed_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    # Relationships
    tip = relationship("HealthTip", back_populates="views")


class DailyTipReminder(Base):
    __tablename__ = "daily_tip_reminders"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    patient_id = Column(String(36), ForeignKey("patients.id", ondelete="CASCADE"), nullable=False, unique=True, index=True)
    is_enabled = Column(Boolean, default=True)
    preferred_time = Column(String(20), default="08:00 AM")
    topics = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
