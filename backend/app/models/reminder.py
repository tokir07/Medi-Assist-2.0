import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey, Integer, Text
from sqlalchemy.orm import relationship

from app.database.database import Base

def generate_uuid():
    return str(uuid.uuid4())

class PatientReminder(Base):
    __tablename__ = "patient_reminders"

    id = Column(String(36), primary_key=True, default=generate_uuid, index=True)
    patient_id = Column(String(36), ForeignKey("patients.id", ondelete="CASCADE"), nullable=False, index=True)
    appointment_id = Column(String(36), ForeignKey("appointments.id", ondelete="SET NULL"), nullable=True, index=True)
    prescription_id = Column(String(36), ForeignKey("prescriptions.id", ondelete="SET NULL"), nullable=True, index=True)

    reminder_type = Column(String(50), nullable=False, index=True) # Medication, Appointment, Health Task, Custom
    title = Column(String(255), nullable=False)
    subtitle = Column(String(255), nullable=True)                  # e.g. "1 tablet • After dinner", "Dr. Arjun Mehta • Heart Health Clinic"
    notes = Column(Text, nullable=True)
    priority = Column(String(50), default="Normal")                # Low, Normal, High, Urgent
    notification_preference = Column(String(50), default="IN_APP") # IN_APP, PUSH, EMAIL, ALL
    
    time_str = Column(String(50), nullable=False)                  # e.g. "08:00 PM", "04:15 PM", "08:00 AM"
    date_str = Column(String(50), nullable=True)                   # e.g. "2026-08-29", or None for daily repeating
    recurrence = Column(String(50), default="Daily")               # Once, Daily, Weekly, Monthly
    
    status = Column(String(50), default="Upcoming", index=True)    # Upcoming, Pending, Due, Completed, Missed, Skipped, Dismissed, Snoozed, Cancelled
    is_completed = Column(Boolean, default=False, index=True)
    completed_at = Column(DateTime(timezone=True), nullable=True)
    snoozed_until = Column(DateTime(timezone=True), nullable=True)

    icon_type = Column(String(50), nullable=True)                  # pill, calendar, water, walk, blood, activity, bell
    color_theme = Column(String(50), nullable=True)                # purple, blue, teal, orange, red

    is_deleted = Column(Boolean, default=False, index=True)
    deleted_at = Column(DateTime(timezone=True), nullable=True)

    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    # Relationships
    history_logs = relationship("ReminderHistoryLog", back_populates="reminder", cascade="all, delete-orphan")


class ReminderHistoryLog(Base):
    __tablename__ = "reminder_history_logs"

    id = Column(String(36), primary_key=True, default=generate_uuid, index=True)
    patient_id = Column(String(36), ForeignKey("patients.id", ondelete="CASCADE"), nullable=False, index=True)
    reminder_id = Column(String(36), ForeignKey("patient_reminders.id", ondelete="CASCADE"), nullable=True, index=True)

    reminder_title = Column(String(255), nullable=False)
    reminder_type = Column(String(50), nullable=False)
    action = Column(String(50), nullable=False)                    # Completed, Taken, Skipped, Missed, Snoozed, Dismissed
    scheduled_time = Column(String(50), nullable=False)
    logged_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    # Relationships
    reminder = relationship("PatientReminder", back_populates="history_logs")
