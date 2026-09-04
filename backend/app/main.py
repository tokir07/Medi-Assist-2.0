import logging
import time
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.openapi.utils import get_openapi

from app.core.config import settings
from app.core.redis import init_redis_client, close_redis_client
from app.database.database import engine, Base
from app.middleware.request_tracing import RequestTracingMiddleware
from app.utils.exceptions import AppException, app_exception_handler, http_exception_handler
from app.database.models import User, UserRole, Doctor, Patient
from app.models.patient_portal import Consultation, ConsultationQuestion, ConsultationAnswer, VoiceSession, VoiceMessage, ClinicalHistory
from app.models.medical_record import MedicalRecord
from app.models.prescription import Prescription, MedicationReminder
from app.models.appointment import Appointment
from app.models.health_tip import HealthTip, SavedHealthTip, DailyTipReminder
from app.models.reminder import PatientReminder, ReminderHistoryLog
from app.models.settings import UserSettings, UserLoginHistory, UserDeviceSession
from app.models.ai_conversation import AIConversation, AIMessage, AISummary
from app.models.admin import Organization, Department, AuditLog, SystemConfiguration, AdminPushNotification
from app.models.chat import ChatConversation, ChatMessage
from app.routers import auth, patient, doctor, admin, profile, dashboard, consultation, voice, history, health, records, prescriptions, appointments, health_tips, reminders, settings as settings_router, quick_ai, ai_assistant, chat

from app.core.config import settings
from app.core.logging_config import setup_logging, get_logger

# Setup logging system
setup_logging("INFO")
logger = get_logger("MAIN")

# Create database tables
Base.metadata.create_all(bind=engine)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    await init_redis_client()
    yield
    # Shutdown
    await close_redis_client()

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="MediAssist Backend API providing JWT Authentication and Role-Based Access Control (RBAC).",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# Exception handlers
app.add_exception_handler(AppException, app_exception_handler)
app.add_exception_handler(HTTPException, http_exception_handler)

# Middlewares (Order: GZip -> Tracing -> CORS)
app.add_middleware(GZipMiddleware, minimum_size=1000)
app.add_middleware(RequestTracingMiddleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers under /api
app.include_router(auth.router, prefix=settings.API_V1_STR)
app.include_router(patient.router, prefix=settings.API_V1_STR)
app.include_router(doctor.router, prefix=settings.API_V1_STR)
app.include_router(admin.router, prefix=settings.API_V1_STR)
app.include_router(profile.router, prefix=settings.API_V1_STR)
app.include_router(dashboard.router, prefix=settings.API_V1_STR)
app.include_router(consultation.router, prefix=settings.API_V1_STR)
app.include_router(voice.router, prefix=settings.API_V1_STR)
app.include_router(history.router, prefix=settings.API_V1_STR)
app.include_router(health.router, prefix=settings.API_V1_STR)
app.include_router(records.router, prefix=settings.API_V1_STR)
app.include_router(prescriptions.router, prefix=settings.API_V1_STR)
app.include_router(appointments.router, prefix=settings.API_V1_STR)
app.include_router(health_tips.router, prefix=settings.API_V1_STR)
app.include_router(reminders.router, prefix=settings.API_V1_STR)
app.include_router(settings_router.router, prefix=settings.API_V1_STR)
app.include_router(quick_ai.router, prefix=settings.API_V1_STR)
app.include_router(ai_assistant.router, prefix=settings.API_V1_STR)
app.include_router(chat.router, prefix=settings.API_V1_STR)

@app.get("/")
def root():
    return {
        "app": "MediAssist API",
        "status": "running",
        "docs": "/docs",
        "health": "/api/auth/health"
    }

# Custom OpenAPI schema to include Bearer Auth format in Swagger UI
def custom_openapi():
    if app.openapi_schema:
        return app.openapi_schema
    openapi_schema = get_openapi(
        title=app.title,
        version=app.version,
        description=app.description,
        routes=app.routes,
    )
    openapi_schema["components"]["securitySchemes"] = {
        "HTTPBearer": {
            "type": "http",
            "scheme": "bearer",
            "bearerFormat": "JWT"
        }
    }
    # Apply security globally to protected endpoints
    for path in openapi_schema["paths"]:
        for method in openapi_schema["paths"][path]:
            if path not in ["/", "/api/auth/login", "/api/auth/register", "/api/auth/health"]:
                openapi_schema["paths"][path][method]["security"] = [{"HTTPBearer": []}]
    app.openapi_schema = openapi_schema
    return app.openapi_schema

app.openapi = custom_openapi
