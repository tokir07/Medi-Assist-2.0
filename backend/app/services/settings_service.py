from sqlalchemy.orm import Session
from datetime import datetime, timezone, timedelta
from typing import List, Optional
import uuid

from app.models.settings import UserSettings, UserLoginHistory, UserDeviceSession
from app.database.models import User, Patient
from app.schemas.settings import (
    UserSettingsResponse,
    UserSettingsUpdatePayload,
    AccountOverviewResponse,
    LoginHistoryItem,
    DeviceSessionItem,
    TwoFactorToggleResponse,
)

class SettingsService:
    @staticmethod
    def get_or_create_settings(user: User, db: Session) -> UserSettings:
        settings = db.query(UserSettings).filter(UserSettings.user_id == user.id).first()
        if not settings:
            settings = UserSettings(
                id=str(uuid.uuid4()),
                user_id=user.id,
                language="English (US)",
                time_zone="(GMT+05:30) Asia/Kolkata",
                appearance="Light Mode",
                auto_save=True,
                low_data_mode=False,
                download_wifi_only=True,
                two_factor_enabled=False,
                email_notifications=True,
                push_notifications=True,
                sms_notifications=False,
                appointment_reminders=True,
                medication_reminders=True,
                health_tip_notifications=True,
            )
            db.add(settings)
            db.commit()
            db.refresh(settings)
        return settings

    @staticmethod
    def ensure_default_login_history_and_devices(user: User, db: Session):
        hist_count = db.query(UserLoginHistory).filter(UserLoginHistory.user_id == user.id).count()
        if hist_count == 0:
            now = datetime.now(timezone.utc)
            sample_histories = [
                UserLoginHistory(
                    id=str(uuid.uuid4()),
                    user_id=user.id,
                    device="Chrome 128 / Windows 11",
                    ip_address="103.212.144.18",
                    location="New Delhi, India",
                    status="Success",
                    logged_at=now - timedelta(minutes=15),
                ),
                UserLoginHistory(
                    id=str(uuid.uuid4()),
                    user_id=user.id,
                    device="Safari 17.5 / macOS Sonoma",
                    ip_address="103.212.144.18",
                    location="New Delhi, India",
                    status="Success",
                    logged_at=now - timedelta(days=1, hours=2),
                ),
                UserLoginHistory(
                    id=str(uuid.uuid4()),
                    user_id=user.id,
                    device="MediAssist Mobile / Android 14",
                    ip_address="157.34.89.12",
                    location="New Delhi, India",
                    status="Success",
                    logged_at=now - timedelta(days=3),
                ),
            ]
            for sh in sample_histories:
                db.add(sh)

        dev_count = db.query(UserDeviceSession).filter(UserDeviceSession.user_id == user.id).count()
        if dev_count == 0:
            now = datetime.now(timezone.utc)
            sample_devices = [
                UserDeviceSession(
                    id=str(uuid.uuid4()),
                    user_id=user.id,
                    device_name="Desktop - Chrome on Windows",
                    browser="Chrome 128",
                    location="New Delhi, India",
                    is_current=True,
                    last_active=now,
                ),
                UserDeviceSession(
                    id=str(uuid.uuid4()),
                    user_id=user.id,
                    device_name="MediAssist Mobile App - Samsung Galaxy S23",
                    browser="Native App",
                    location="New Delhi, India",
                    is_current=False,
                    last_active=now - timedelta(days=2),
                ),
            ]
            for sd in sample_devices:
                db.add(sd)

        db.commit()

    @staticmethod
    def update_settings(user: User, payload: UserSettingsUpdatePayload, db: Session) -> UserSettingsResponse:
        settings = SettingsService.get_or_create_settings(user, db)
        for field, value in payload.model_dump(exclude_unset=True).items():
            setattr(settings, field, value)

        db.commit()
        db.refresh(settings)
        return UserSettingsResponse.model_validate(settings)

    @staticmethod
    def get_account_overview(user: User, db: Session) -> AccountOverviewResponse:
        created = user.created_at or datetime(2024, 1, 15, tzinfo=timezone.utc)
        member_since = created.strftime("%d %B %Y")
        last_login = datetime.now().strftime("%d %b %Y, %I:%M %p")

        pat = db.query(Patient).filter(Patient.user_id == user.id).first()
        is_kyc = getattr(pat, "kyc_verified", True) if pat else True

        return AccountOverviewResponse(
            member_since=member_since,
            last_login=last_login,
            account_status="Active" if user.is_active else "Inactive",
            email_verified=True,
            phone_verified=True,
            kyc_verified=is_kyc,
        )

    @staticmethod
    def get_login_history(user: User, db: Session, limit: int = 20) -> List[LoginHistoryItem]:
        SettingsService.ensure_default_login_history_and_devices(user, db)
        logs = db.query(UserLoginHistory).filter(UserLoginHistory.user_id == user.id).order_by(UserLoginHistory.logged_at.desc()).limit(limit).all()
        return [LoginHistoryItem.model_validate(l) for l in logs]

    @staticmethod
    def get_devices(user: User, db: Session) -> List[DeviceSessionItem]:
        SettingsService.ensure_default_login_history_and_devices(user, db)
        devices = db.query(UserDeviceSession).filter(UserDeviceSession.user_id == user.id).order_by(UserDeviceSession.is_current.desc(), UserDeviceSession.last_active.desc()).all()
        return [DeviceSessionItem.model_validate(d) for d in devices]

    @staticmethod
    def revoke_device(user: User, device_id: str, db: Session) -> bool:
        dev = db.query(UserDeviceSession).filter(UserDeviceSession.id == device_id, UserDeviceSession.user_id == user.id).first()
        if not dev:
            return False
        db.delete(dev)
        db.commit()
        return True

    @staticmethod
    def toggle_2fa(user: User, enabled: bool, db: Session) -> TwoFactorToggleResponse:
        settings = SettingsService.get_or_create_settings(user, db)
        settings.two_factor_enabled = enabled
        db.commit()
        db.refresh(settings)

        return TwoFactorToggleResponse(
            enabled=enabled,
            message="Two-Factor Authentication enabled successfully" if enabled else "Two-Factor Authentication disabled",
            qr_code_url="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=otpauth://totp/MediAssist:patient@example.com?secret=JBSWY3DPEHPK3PXP&issuer=MediAssist" if enabled else None
        )

    @staticmethod
    def deactivate_account(user: User, db: Session) -> bool:
        user.is_active = False
        db.commit()
        return True

settings_service = SettingsService()
