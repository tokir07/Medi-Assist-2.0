from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from typing import Optional, List

from app.database.database import get_db
from app.database.models import User, Patient
from app.core.dependencies import get_current_user
from app.services.health_tip_service import health_tip_service
from app.schemas.health_tip import (
    HealthTipResponse,
    HealthTipListResponse,
    CategoryCountResponse,
    DailyTipReminderResponse,
    DailyTipReminderUpdate,
    PersonalizePreferencesPayload,
    HealthActivityResponse,
)

router = APIRouter(prefix="/health-tips", tags=["Health Tips"])

def _get_patient_id_optional(current_user: Optional[User], db: Session) -> Optional[str]:
    if not current_user:
        return None
    patient = db.query(Patient).filter(Patient.user_id == current_user.id).first()
    return patient.id if patient else None

def _get_patient_id_required(current_user: User, db: Session) -> str:
    if not current_user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Authentication required")
    patient = db.query(Patient).filter(Patient.user_id == current_user.id).first()
    if not patient:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Patient profile required")
    return patient.id


@router.get("", response_model=HealthTipListResponse)
@router.get("/", response_model=HealthTipListResponse)
def get_health_tips(
    category: Optional[str] = Query(None, description="Category filter"),
    search: Optional[str] = Query(None, description="Search term in title, summary, content, tags"),
    saved_only: bool = Query(False, description="Filter only saved tips"),
    page: int = Query(1, ge=1),
    page_size: int = Query(12, ge=1, le=50),
    current_user: Optional[User] = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Fetch paginated health tips with category filtering, search, and saved indicators.
    """
    patient_id = _get_patient_id_optional(current_user, db)
    return health_tip_service.get_health_tips(
        db=db,
        patient_id=patient_id,
        category=category,
        search=search,
        saved_only=saved_only,
        page=page,
        page_size=page_size
    )


@router.get("/today", response_model=Optional[HealthTipResponse])
def get_tip_of_the_day(
    current_user: Optional[User] = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Fetch the featured Tip of the Day.
    """
    patient_id = _get_patient_id_optional(current_user, db)
    return health_tip_service.get_tip_of_the_day(db=db, patient_id=patient_id)


@router.get("/recommended", response_model=List[HealthTipResponse])
def get_recommended_tips(
    limit: int = Query(4, ge=1, le=10),
    current_user: Optional[User] = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Fetch personalized educational health tips with transparent reason explanations.
    """
    patient_id = _get_patient_id_optional(current_user, db)
    return health_tip_service.get_recommended_tips(db=db, patient_id=patient_id, limit=limit)


@router.get("/featured", response_model=List[HealthTipResponse])
def get_featured_health_tips(
    current_user: Optional[User] = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Fetch featured health tips for the carousel.
    """
    patient_id = _get_patient_id_optional(current_user, db)
    return health_tip_service.get_featured_tips(db=db, patient_id=patient_id)


@router.get("/categories", response_model=CategoryCountResponse)
def get_categories_summary(
    db: Session = Depends(get_db)
):
    """
    Fetch all health tip categories with active counts.
    """
    return health_tip_service.get_categories_summary(db=db)


@router.get("/popular", response_model=List[HealthTipResponse])
def get_popular_health_tips(
    limit: int = Query(5, ge=1, le=10),
    current_user: Optional[User] = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Fetch top ranked popular health tips.
    """
    patient_id = _get_patient_id_optional(current_user, db)
    return health_tip_service.get_popular_tips(db=db, patient_id=patient_id, limit=limit)


@router.get("/saved", response_model=List[HealthTipResponse])
def get_saved_tips(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Fetch patient's bookmarked / saved health tips.
    """
    patient_id = _get_patient_id_required(current_user, db)
    return health_tip_service.get_saved_tips(db=db, patient_id=patient_id)


@router.get("/recent", response_model=List[HealthTipResponse])
def get_recently_viewed_tips(
    limit: int = Query(6, ge=1, le=20),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Fetch patient's recently viewed health tips.
    """
    patient_id = _get_patient_id_required(current_user, db)
    return health_tip_service.get_recently_viewed(db=db, patient_id=patient_id, limit=limit)


@router.get("/activity", response_model=HealthActivityResponse)
def get_health_activity(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Fetch lightweight activity stats (Saved tips count, recently viewed count, active interests).
    """
    patient_id = _get_patient_id_required(current_user, db)
    return health_tip_service.get_health_activity(db=db, patient_id=patient_id)


@router.post("/{tip_id}/save")
def toggle_save_health_tip(
    tip_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Save or unsave a health tip for the authenticated patient.
    """
    patient_id = _get_patient_id_required(current_user, db)
    is_saved = health_tip_service.toggle_save_tip(db=db, patient_id=patient_id, tip_id=tip_id)
    return {
        "status": "success",
        "tip_id": tip_id,
        "is_saved": is_saved,
        "message": "Health tip bookmarked" if is_saved else "Health tip removed from bookmarks"
    }


@router.post("/{tip_id}/view")
def record_tip_view(
    tip_id: str,
    current_user: Optional[User] = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Record that a patient viewed a health tip.
    """
    patient_id = _get_patient_id_optional(current_user, db)
    if patient_id:
        health_tip_service.record_tip_view(db=db, patient_id=patient_id, tip_id=tip_id)
    return {"status": "ok"}


@router.get("/{tip_id}", response_model=HealthTipResponse)
def get_tip_details(
    tip_id: str,
    current_user: Optional[User] = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get full details for a single health tip.
    """
    patient_id = _get_patient_id_optional(current_user, db)
    tip = health_tip_service.get_tip_by_id(db=db, tip_id=tip_id, patient_id=patient_id)
    if not tip:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Health tip not found")
    return tip


@router.get("/{tip_id}/related", response_model=List[HealthTipResponse])
def get_related_tips(
    tip_id: str,
    category: str = Query(..., description="Category for related recommendations"),
    current_user: Optional[User] = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Fetch related educational tips within the same category.
    """
    patient_id = _get_patient_id_optional(current_user, db)
    return health_tip_service.get_related_tips(db=db, tip_id=tip_id, category=category, patient_id=patient_id)


@router.get("/settings/reminder", response_model=DailyTipReminderResponse)
def get_daily_reminder_settings(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get patient's daily health tip reminder preferences.
    """
    patient_id = _get_patient_id_required(current_user, db)
    return health_tip_service.get_reminder_settings(db=db, patient_id=patient_id)


@router.put("/settings/reminder", response_model=DailyTipReminderResponse)
def update_daily_reminder_settings(
    payload: DailyTipReminderUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Update patient's daily health tip reminder preferences.
    """
    patient_id = _get_patient_id_required(current_user, db)
    return health_tip_service.update_reminder_settings(db=db, patient_id=patient_id, payload=payload)
