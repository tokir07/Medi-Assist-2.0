import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship

from app.database.database import Base

def generate_uuid():
    return str(uuid.uuid4())

class UserSettings(Base):
    __tablename__ = "user_settings"

    id = Column(String(36), primary_key=True, default=generate_uuid, index=True)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, unique=True, index=True)

    # General & Regional Preferences
    language = Column(String(50), default="English (US)", nullable=False)
    time_zone = Column(String(100), default="(GMT+05:30) Asia/Kolkata", nullable=False)
    appearance = Column(String(50), default="Light Mode", nullable=False)

    # Application Preferences
    auto_save = Column(Boolean, default=True, nullable=False)
    low_data_mode = Column(Boolean, default=False, nullable=False)
    download_wifi_only = Column(Boolean, default=True, nullable=False)

    # Security Preferences
    two_factor_enabled = Column(Boolean, default=False, nullable=False)
    two_factor_secret = Column(String(255), nullable=True)

    # Notification Channels & Alert Preferences
    email_notifications = Column(Boolean, default=True, nullable=False)
    push_notifications = Column(Boolean, default=True, nullable=False)
    sms_notifications = Column(Boolean, default=False, nullable=False)
    appointment_reminders = Column(Boolean, default=True, nullable=False)
    medication_reminders = Column(Boolean, default=True, nullable=False)
    health_tip_notifications = Column(Boolean, default=True, nullable=False)

    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    user = relationship("User", backref="settings")


class UserLoginHistory(Base):
    __tablename__ = "user_login_history"

    id = Column(String(36), primary_key=True, default=generate_uuid, index=True)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)

    device = Column(String(255), nullable=False)           # e.g. "Chrome 128 / Windows 11"
    ip_address = Column(String(100), default="127.0.0.1")
    location = Column(String(255), default="New Delhi, India")
    status = Column(String(50), default="Success")        # Success, Failed
    logged_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))


class UserDeviceSession(Base):
    __tablename__ = "user_device_sessions"

    id = Column(String(36), primary_key=True, default=generate_uuid, index=True)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)

    device_name = Column(String(255), nullable=False)     # e.g. "Desktop - Chrome on Windows"
    browser = Column(String(100), default="Chrome")
    location = Column(String(255), default="New Delhi, India")
    is_current = Column(Boolean, default=True)
    last_active = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
