from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database.database import get_db
from app.database.models import User, Patient
from app.core.dependencies import get_current_user, get_current_patient
from app.schemas.dashboard import DashboardResponse
from app.services.dashboard_service import dashboard_service

router = APIRouter(tags=["Patient Dashboard"])

@router.get("/v1/dashboard", response_model=DashboardResponse)
@router.get("/dashboard", response_model=DashboardResponse)
async def get_dashboard(
    current_user: User = Depends(get_current_user),
    current_patient: Patient = Depends(get_current_patient),
    db: Session = Depends(get_db)
):
    """
    Retrieve aggregated Patient Dashboard details with Redis caching and PostgreSQL fallback.
    """
    return await dashboard_service.get_dashboard_async(current_user, current_patient, db)
