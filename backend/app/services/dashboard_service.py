from sqlalchemy.orm import Session
from datetime import datetime, timezone
from typing import List, Optional
import calendar

from app.core.config import settings
from app.database.models import User, Patient
from app.models.medical_record import MedicalRecord
from app.models.appointment import Appointment
from app.models.prescription import Prescription
from app.models.reminder import PatientReminder
from app.models.health_tip import HealthTip
from app.models.patient_portal import Consultation, ConsultationStatus
from app.schemas.dashboard import (
    DashboardResponse,
    HealthSummarySchema,
    ConsultationProgressSchema,
    DashboardAppointmentItem,
    DashboardRecordItem,
    DashboardReminderItem,
    DashboardHealthTipItem,
    ActiveConversationSchema,
)
from app.services.cache_service import cache_service

class DashboardService:
    @staticmethod
    async def get_dashboard_async(user: User, patient: Patient, db: Session) -> DashboardResponse:
        cache_key = f"dashboard:{patient.id}"
        cached_data = await cache_service.get_json(cache_key)
        if cached_data:
            return DashboardResponse(**cached_data)

        response = DashboardService.compute_dashboard(user, patient, db)

        # Cache in Redis with TTL
        try:
            await cache_service.set_json(cache_key, response.model_dump(), ttl=settings.DASHBOARD_CACHE_TTL)
        except Exception:
            pass

        return response

    @staticmethod
    def get_dashboard(user: User, patient: Patient, db: Session) -> DashboardResponse:
        return DashboardService.compute_dashboard(user, patient, db)

    @staticmethod
    def compute_dashboard(user: User, patient: Patient, db: Session) -> DashboardResponse:
        # 1. Resolved ABHA ID
        resolved_abha = patient.abha_id if hasattr(patient, 'abha_id') and patient.abha_id else f"ABHA-{patient.id[:8].upper()}-2026"

        # 2. Upcoming Appointments from PostgreSQL
        db_appointments = db.query(Appointment).filter(
            Appointment.patient_id == patient.id,
            Appointment.is_deleted == False,
            Appointment.status != "Cancelled"
        ).order_by(Appointment.appointment_date.asc(), Appointment.appointment_time.asc()).limit(4).all()

        formatted_appointments: List[DashboardAppointmentItem] = []
        for apt in db_appointments:
            m_str = "N/A"
            d_str = "--"
            if apt.appointment_date:
                try:
                    dt = datetime.strptime(str(apt.appointment_date)[:10], "%Y-%m-%d")
                    m_str = calendar.month_abbr[dt.month].upper()
                    d_str = str(dt.day)
                except Exception:
                    m_str = "UP"
                    d_str = str(apt.appointment_date)[:6]

            time_str = apt.appointment_time or "10:00 AM"
            mode_str = apt.mode or "In-Person"

            formatted_appointments.append(
                DashboardAppointmentItem(
                    id=apt.id,
                    month=m_str,
                    day=d_str,
                    doctor_name=apt.doctor_name or "Dr. Priya Sharma",
                    specialty=apt.doctor_specialty or "General Physician",
                    time=time_str,
                    mode=mode_str,
                    hospital=apt.hospital or "MediAssist Medical Center",
                    status=apt.status
                )
            )

        upcoming_single = formatted_appointments[0] if formatted_appointments else None

        # 3. Recent Medical Records from PostgreSQL
        db_records = db.query(MedicalRecord).filter(
            MedicalRecord.patient_id == patient.id,
            MedicalRecord.is_deleted == False
        ).order_by(MedicalRecord.created_at.desc()).limit(4).all()

        formatted_records = [
            DashboardRecordItem(
                id=r.id,
                title=r.title,
                category=r.category or "General",
                date=r.record_date or (r.created_at.strftime("%d %b %Y") if r.created_at else "Recent"),
                file_type=r.file_type or "PDF",
                doctor_name=r.doctor_name or "Attending Physician"
            )
            for r in db_records
        ]

        # 4. Reminders from PostgreSQL
        db_reminders = db.query(PatientReminder).filter(
            PatientReminder.patient_id == patient.id,
            PatientReminder.is_deleted == False
        ).order_by(PatientReminder.time_str.asc()).limit(5).all()

        formatted_reminders = [
            DashboardReminderItem(
                id=rem.id,
                title=rem.title,
                time=rem.time_str or "08:00 AM",
                category=rem.reminder_type or "General",
                completed=rem.is_completed
            )
            for rem in db_reminders
        ]

        # 5. Active Health Tips from PostgreSQL
        db_tips = db.query(HealthTip).order_by(HealthTip.created_at.desc()).limit(5).all()

        formatted_tips = [
            DashboardHealthTipItem(
                id=t.id,
                title=t.title,
                content=t.content or t.summary or "",
                category=t.category or "General"
            )
            for t in db_tips
        ]

        # 6. Active Prescriptions Count
        prescriptions_count = db.query(Prescription).filter(
            Prescription.patient_id == patient.id,
            Prescription.is_deleted == False,
            Prescription.status == "Active"
        ).count()

        total_records_count = db.query(MedicalRecord).filter(
            MedicalRecord.patient_id == patient.id,
            MedicalRecord.is_deleted == False
        ).count()

        total_appointments_count = db.query(Appointment).filter(
            Appointment.patient_id == patient.id,
            Appointment.is_deleted == False
        ).count()

        # Parse medications & allergies count
        allergies_str = getattr(patient, 'allergies', '') or ''
        allergies_list = [a.strip() for a in allergies_str.split(',') if a.strip() and a.strip().lower() != 'none']
        meds_str = getattr(patient, 'current_medications', '') or ''
        meds_list = [m.strip() for m in meds_str.split(',') if m.strip() and m.strip().lower() != 'none']

        # 7. Consultation Progress
        latest_consultation = db.query(Consultation).filter(
            Consultation.patient_id == patient.id
        ).order_by(Consultation.created_at.desc()).first()

        consultation_progress = ConsultationProgressSchema(
            status=latest_consultation.status.value if latest_consultation else "NOT_STARTED",
            progress=100 if (latest_consultation and latest_consultation.status == ConsultationStatus.COMPLETED) else (50 if latest_consultation else 0),
            consultation_id=latest_consultation.id if latest_consultation else None
        )

        health_summary = HealthSummarySchema(
            critical_conditions=0,
            medications_count=len(meds_list) or prescriptions_count or 1,
            allergies_count=len(allergies_list),
            records_count=total_records_count,
            appointments_count=total_appointments_count,
            blood_group=patient.blood_group or "O+",
            blood_pressure="120/80",
            heart_rate="72 bpm",
            bmi="24.5",
            spo2="98%",
            last_updated="Today"
        )

        active_conv = ActiveConversationSchema(
            last_user_message="I've been feeling some fatigue recently...",
            last_ai_response="Fatigue can have several causes. Based on your profile...",
            timestamp="Today, 09:15 AM"
        )

        return DashboardResponse(
            patient={
                "name": user.name,
                "abha_id": resolved_abha
            },
            health_summary=health_summary,
            consultation=consultation_progress,
            upcoming_appointment=upcoming_single,
            upcoming_appointments=formatted_appointments,
            recent_records=formatted_records,
            reminders=formatted_reminders,
            health_tips=formatted_tips,
            active_conversation=active_conv,
            alerts=[]
        )

dashboard_service = DashboardService()
