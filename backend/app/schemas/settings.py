from typing import Optional, List
from pydantic import BaseModel, ConfigDict
from datetime import datetime

class UserSettingsBase(BaseModel):
    language: str = "English (US)"
    time_zone: str = "(GMT+05:30) Asia/Kolkata"
    appearance: str = "Light Mode"
    auto_save: bool = True
    low_data_mode: bool = False
    download_wifi_only: bool = True
    two_factor_enabled: bool = False
    email_notifications: bool = True
    push_notifications: bool = True
    sms_notifications: bool = False
    appointment_reminders: bool = True
    medication_reminders: bool = True
    health_tip_notifications: bool = True

class UserSettingsUpdatePayload(BaseModel):
    language: Optional[str] = None
    time_zone: Optional[str] = None
    appearance: Optional[str] = None
    auto_save: Optional[bool] = None
    low_data_mode: Optional[bool] = None
    download_wifi_only: Optional[bool] = None
    two_factor_enabled: Optional[bool] = None
    email_notifications: Optional[bool] = None
    push_notifications: Optional[bool] = None
    sms_notifications: Optional[bool] = None
    appointment_reminders: Optional[bool] = None
    medication_reminders: Optional[bool] = None
    health_tip_notifications: Optional[bool] = None

class UserSettingsResponse(UserSettingsBase):
    id: str
    user_id: str

    model_config = ConfigDict(from_attributes=True)

class AccountOverviewResponse(BaseModel):
    member_since: str
    last_login: str
    account_status: str
    email_verified: bool
    phone_verified: bool
    kyc_verified: bool

class LoginHistoryItem(BaseModel):
    id: str
    device: str
    ip_address: str
    location: str
    status: str
    logged_at: datetime

    model_config = ConfigDict(from_attributes=True)

class DeviceSessionItem(BaseModel):
    id: str
    device_name: str
    browser: str
    location: str
    is_current: bool
    last_active: datetime

    model_config = ConfigDict(from_attributes=True)

class TwoFactorTogglePayload(BaseModel):
    enabled: bool

class TwoFactorToggleResponse(BaseModel):
    enabled: bool
    message: str
    qr_code_url: Optional[str] = None
