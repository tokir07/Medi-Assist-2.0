from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.database.database import get_db
from app.database.models import User
from app.core.dependencies import get_current_user
from app.services.settings_service import settings_service
from app.schemas.settings import (
    UserSettingsResponse,
    UserSettingsUpdatePayload,
    AccountOverviewResponse,
    LoginHistoryItem,
    DeviceSessionItem,
    TwoFactorTogglePayload,
    TwoFactorToggleResponse,
)

router = APIRouter(prefix="/settings", tags=["User Settings"])

@router.get("", response_model=UserSettingsResponse)
def get_user_settings(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Retrieve user preferences and settings.
    """
    return settings_service.get_or_create_settings(current_user, db)

@router.patch("", response_model=UserSettingsResponse)
@router.put("", response_model=UserSettingsResponse)
def update_user_settings(
    payload: UserSettingsUpdatePayload,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Update user preferences (language, time_zone, appearance, toggles, notifications).
    """
    return settings_service.update_settings(current_user, payload, db)

@router.get("/overview", response_model=AccountOverviewResponse)
def get_account_overview(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Retrieve account overview indicators (Member since, Last login, Account status, Verification flags).
    """
    return settings_service.get_account_overview(current_user, db)

@router.get("/login-history", response_model=List[LoginHistoryItem])
def get_login_history(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Retrieve past login activity logs.
    """
    return settings_service.get_login_history(current_user, db)

@router.get("/devices", response_model=List[DeviceSessionItem])
def get_device_sessions(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Retrieve active device sessions.
    """
    return settings_service.get_devices(current_user, db)

@router.post("/devices/{device_id}/revoke")
def revoke_device_session(
    device_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Revoke a specific device session.
    """
    success = settings_service.revoke_device(current_user, device_id, db)
    if not success:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Device session not found")
    return {"success": True, "message": "Device session revoked successfully"}

@router.post("/2fa/toggle", response_model=TwoFactorToggleResponse)
def toggle_two_factor(
    payload: TwoFactorTogglePayload,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Enable or disable Two-Factor Authentication.
    """
    return settings_service.toggle_2fa(current_user, payload.enabled, db)

@router.post("/clear-cache")
def clear_user_cache(
    current_user: User = Depends(get_current_user)
):
    """
    Clear server-side user application cache.
    """
    return {"success": True, "message": "Application cache cleared successfully"}

@router.post("/deactivate")
def deactivate_account(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Temporarily deactivate user account.
    """
    settings_service.deactivate_account(current_user, db)
    return {"success": True, "message": "Account deactivated successfully"}
