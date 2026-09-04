import json
import logging
import uuid
from datetime import datetime, timezone, timedelta
from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import desc, or_, and_, func

from app.database.models import User, Doctor, Patient, UserRole
from app.models.appointment import Appointment, DoctorHealthMessage
from app.models.medical_record import MedicalRecord
from app.models.prescription import Prescription
from app.models.reminder import PatientReminder
from app.models.ai_conversation import AIConversation, AIMessage, AISummary
from app.models.patient_portal import VoiceSession, VoiceMessage
from app.services.chat_service import ChatService
from app.schemas.doctor_schema import (
    DoctorDashboardStats,
    DoctorScheduleItem,
    DoctorDashboardResponse,
    DoctorAppointmentRejectRequest,
    DoctorEmergencyCancelRequest,
    DoctorBlockSlotRequest,
    DoctorDayOffRequest,
    DoctorDayOffResponse,
    DoctorScheduleConfig,
    DoctorPatientSummary,
    DoctorPatientDetail,
    DoctorConsultationSubmit,
    DigitalPrescriptionCreate,
    ImagePrescriptionCreate,
    PrescriptionTemplateItem,
    MedicationItemCreate,
    PatientReminderCreate,
    DoctorQuickAIRequest,
    DoctorQuickAIResponse,
)
from app.utils.exceptions import AppException
from fastapi import status

logger = logging.getLogger(__name__)

# In-memory storage for Doctor Availability, Days Off, and Blocked Slots
_DOCTOR_DAYS_OFF: Dict[str, List[Dict[str, str]]] = {}
_DOCTOR_BLOCKED_SLOTS: Dict[str, List[Dict[str, str]]] = {}
_DOCTOR_SCHEDULE_CONFIG: Dict[str, Dict[str, Any]] = {}
_DOCTOR_AVAILABILITY_STATUS: Dict[str, bool] = {}

class DoctorService:

    def get_or_create_doctor_profile(self, db: Session, user: User) -> Doctor:
        doc = db.query(Doctor).filter(Doctor.user_id == user.id).first()
        if not doc:
            doctor_code = f"DR-2026-{uuid.uuid4().hex[:6].upper()}"
            doc = Doctor(
                user_id=user.id,
                doctor_id=doctor_code,
                specialization="General Physician",
                registration_number=f"NMC-{uuid.uuid4().hex[:8].upper()}",
                qualification="MBBS, MD",
                designation="Senior Consultant Physician",
                department="General Medicine",
                hospital="MediAssist Medical Center",
                experience=10,
                phone="+91 98765 43210",
                bio="Experienced General Physician specializing in preventive care, chronic disease management, and internal medicine.",
                consultation_fee=600,
                account_status="ACTIVE",
                verification_status="VERIFIED",
            )
            db.add(doc)
            db.commit()
            db.refresh(doc)
        return doc

    def _get_patient_name(self, db: Session, patient_id: str) -> str:
        if not patient_id:
            return "Patient"
        pat = db.query(Patient).filter(Patient.id == patient_id).first()
        if pat and pat.user and pat.user.name and pat.user.name.strip():
            return pat.user.name.strip()
        user_direct = db.query(User).filter(User.id == patient_id).first()
        if user_direct and user_direct.name and user_direct.name.strip():
            return user_direct.name.strip()
        return "Patient"

    def get_dashboard(self, db: Session, user: User) -> DoctorDashboardResponse:
        doc = self.get_or_create_doctor_profile(db, user)
        today_str = datetime.now().strftime("%Y-%m-%d")

        appointments = db.query(Appointment).filter(
            Appointment.is_deleted == False,
            or_(
                Appointment.doctor_id == doc.id,
                Appointment.doctor_name.ilike(f"%{user.name}%"),
                Appointment.doctor_name.ilike("%Jenkins%"),
                Appointment.doctor_name.ilike("%Sharma%")
            )
        ).order_by(desc(Appointment.created_at)).all()

        todays_apps = [a for a in appointments if a.appointment_date == today_str and a.status in ["Confirmed", "Pending", "COMPLETED", "IN_PROGRESS", "IN PROGRESS"]]
        pending_apps = [a for a in appointments if a.status == "Pending"]

        patient_ids = list(set([a.patient_id for a in appointments if a.patient_id]))
        if not patient_ids:
            all_pats = db.query(Patient).limit(10).all()
            patient_ids = [p.id for p in all_pats]

        unread_msg_count = db.query(DoctorHealthMessage).filter(
            DoctorHealthMessage.doctor_id == doc.id,
            DoctorHealthMessage.is_read == False
        ).count()

        is_available = _DOCTOR_AVAILABILITY_STATUS.get(doc.id, True)

        stats = DoctorDashboardStats(
            todays_appointments_count=len(todays_apps),
            pending_requests_count=len(pending_apps),
            total_patients_count=len(patient_ids),
            unread_messages_count=unread_msg_count,
            is_available=is_available
        )

        schedule_items = []
        for app in todays_apps:
            pat = db.query(Patient).filter(Patient.id == app.patient_id).first()
            pat_name = self._get_patient_name(db, app.patient_id)
            schedule_items.append(DoctorScheduleItem(
                appointment_id=app.id,
                patient_id=app.patient_id,
                patient_name=pat_name,
                patient_age=28,
                patient_gender=pat.gender if pat else "Male",
                appointment_time=app.appointment_time,
                mode=app.mode or "Video Consultation",
                reason=app.notes or app.appointment_type or "General Health Checkup",
                status=app.status,
                consultation_link=app.consultation_link
            ))

        pending_list = []
        for app in pending_apps[:5]:
            pname = self._get_patient_name(db, app.patient_id)
            pending_list.append({
                "id": app.id,
                "patient_name": pname,
                "appointment_date": app.appointment_date,
                "appointment_time": app.appointment_time,
                "mode": app.mode or "Video Consultation",
                "reason": app.notes or app.appointment_type or "Health Consultation",
            })

        db_messages = db.query(DoctorHealthMessage).filter(
            DoctorHealthMessage.doctor_id == doc.id
        ).order_by(desc(DoctorHealthMessage.created_at)).limit(5).all()

        recent_msgs = []
        for msg in db_messages:
            pname = self._get_patient_name(db, msg.patient_id)
            recent_msgs.append({
                "id": msg.id,
                "patient_name": pname,
                "content": msg.content,
                "timestamp": msg.created_at.strftime("%I:%M %p") if msg.created_at else "Recently",
                "unread": not msg.is_read
            })

        return DoctorDashboardResponse(
            stats=stats,
            todays_schedule=schedule_items,
            pending_requests=pending_list,
            recent_messages=recent_msgs
        )

    def set_availability(self, db: Session, user: User, is_available: bool) -> Dict[str, Any]:
        doc = self.get_or_create_doctor_profile(db, user)
        _DOCTOR_AVAILABILITY_STATUS[doc.id] = is_available
        return {"status": "success", "is_available": is_available}

    def get_appointments(
        self,
        db: Session,
        user: User,
        tab: str = "Today",
        search: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        doc = self.get_or_create_doctor_profile(db, user)
        today_str = datetime.now().strftime("%Y-%m-%d")

        query = db.query(Appointment).filter(
            Appointment.is_deleted == False,
            or_(
                Appointment.doctor_id == doc.id,
                Appointment.doctor_name.ilike(f"%{user.name}%"),
                Appointment.doctor_name.ilike("%Jenkins%"),
                Appointment.doctor_name.ilike("%Sharma%")
            )
        )

        all_apps = query.order_by(desc(Appointment.created_at)).all()

        results = []
        for app in all_apps:
            pat = db.query(Patient).filter(Patient.id == app.patient_id).first()
            pat_name = pat.user.name if (pat and pat.user) else "Patient"

            item = {
                "id": app.id,
                "patient_id": app.patient_id,
                "patient_name": pat_name,
                "patient_age": 28,
                "patient_gender": pat.gender if pat else "Male",
                "appointment_date": app.appointment_date,
                "appointment_time": app.appointment_time,
                "appointment_type": app.appointment_type or "General Consultation",
                "mode": app.mode or "Video Consultation",
                "status": app.status,
                "reason": app.notes or "General Consultation",
                "consultation_link": app.consultation_link,
                "cancellation_reason": app.cancellation_reason
            }
            results.append(item)

        if tab.lower() == "today":
            filtered = [r for r in results if r["appointment_date"] == today_str]
        elif tab.lower() == "upcoming":
            filtered = [r for r in results if r["appointment_date"] >= today_str and r["status"] in ["Confirmed", "Pending"]]
        elif tab.lower() == "pending":
            filtered = [r for r in results if r["status"] == "Pending"]
        elif tab.lower() == "completed":
            filtered = [r for r in results if r["status"] in ["Completed", "COMPLETED"]]
        elif tab.lower() == "cancelled":
            filtered = [r for r in results if r["status"] in ["Cancelled", "CANCELLED", "REJECTED", "Rejected", "NO_SHOW", "NO SHOW"]]
        else:
            filtered = results

        if search:
            search_l = search.lower()
            filtered = [f for f in filtered if search_l in f["patient_name"].lower() or search_l in f["reason"].lower()]

        return filtered

    def accept_appointment(self, db: Session, user: User, appointment_id: str) -> Dict[str, Any]:
        app = db.query(Appointment).filter(Appointment.id == appointment_id, Appointment.is_deleted == False).first()
        if not app:
            raise AppException(status_code=status.HTTP_404_NOT_FOUND, message="Appointment not found")

        doc_rec = self.get_or_create_doctor_profile(db, user)
        is_authorized = (not app.doctor_id) or (app.doctor_id == doc_rec.id) or app.doctor_id.startswith("doc-") or (user.name and user.name.lower() in app.doctor_name.lower())
        if not is_authorized:
            logger.warning(f"[DOCTOR_SERVICE] Access denied: Doctor {doc_rec.id} attempted to accept appointment {app.id} assigned to {app.doctor_id}")
            raise AppException(status_code=status.HTTP_403_FORBIDDEN, message="You are not authorized to approve appointments assigned to another doctor")

        if app.status.upper() not in ["PENDING"]:
            logger.warning(f"[DOCTOR_SERVICE] Invalid state transition: Cannot approve appointment {app.id} currently in state '{app.status}'")
            raise AppException(status_code=status.HTTP_400_BAD_REQUEST, message=f"Cannot approve appointment with current status '{app.status}'")

        conflict = db.query(Appointment).filter(
            Appointment.doctor_name.ilike(f"%{app.doctor_name.strip()}%"),
            Appointment.appointment_date == app.appointment_date,
            Appointment.appointment_time == app.appointment_time,
            Appointment.status.in_(["Confirmed", "CONFIRMED"]),
            Appointment.id != app.id,
            Appointment.is_deleted == False
        ).first()

        if conflict:
            logger.warning(f"[DOCTOR_SERVICE] Conflict check failed: Slot {app.appointment_time} on {app.appointment_date} already confirmed for another patient")
            raise AppException(
                status_code=status.HTTP_400_BAD_REQUEST,
                message=f"Cannot approve: Time slot ({app.appointment_time} on {app.appointment_date}) has already been confirmed for another patient."
            )

        app.status = "Confirmed"
        app.doctor_id = doc_rec.id
        db.commit()
        db.refresh(app)
        logger.info(f"[DOCTOR_SERVICE] Appointment id={app.id} successfully APPROVED -> Confirmed")

        try:
            rem = PatientReminder(
                patient_id=app.patient_id,
                title="Appointment Confirmed",
                subtitle=f"{app.doctor_name} • {app.appointment_date} at {app.appointment_time}",
                notes=f"Your appointment request with {app.doctor_name} for {app.appointment_date} at {app.appointment_time} has been approved.",
                reminder_type="Appointment",
                time_str=app.appointment_time,
                date_str=app.appointment_date,
                recurrence="Once",
                status="Upcoming",
                icon_type="calendar",
                color_theme="blue"
            )
            db.add(rem)
            db.commit()
        except Exception as e:
            logger.warning(f"Failed to create patient approval notification: {e}")

        try:
            ChatService.auto_sync_confirmed_conversations(db, user)
        except Exception as e:
            logger.warning(f"Auto-sync chat conversation error: {e}")

        return {"status": "success", "message": "Appointment approved and confirmed successfully", "appointment_id": appointment_id, "appointment_status": "Confirmed"}

    def reject_appointment(self, db: Session, user: User, appointment_id: str, payload: DoctorAppointmentRejectRequest) -> Dict[str, Any]:
        app = db.query(Appointment).filter(Appointment.id == appointment_id, Appointment.is_deleted == False).first()
        if not app:
            raise AppException(status_code=status.HTTP_404_NOT_FOUND, message="Appointment not found")

        doc_rec = self.get_or_create_doctor_profile(db, user)
        is_authorized = (not app.doctor_id) or (app.doctor_id == doc_rec.id) or app.doctor_id.startswith("doc-") or (user.name and user.name.lower() in app.doctor_name.lower())
        if not is_authorized:
            logger.warning(f"[DOCTOR_SERVICE] Access denied: Doctor {doc_rec.id} attempted to decline appointment {app.id} assigned to {app.doctor_id}")
            raise AppException(status_code=status.HTTP_403_FORBIDDEN, message="You are not authorized to decline appointments assigned to another doctor")

        if app.status.upper() not in ["PENDING"]:
            logger.warning(f"[DOCTOR_SERVICE] Invalid state transition: Cannot decline appointment {app.id} currently in state '{app.status}'")
            raise AppException(status_code=status.HTTP_400_BAD_REQUEST, message=f"Cannot decline appointment with current status '{app.status}'")

        decline_reason = payload.reason or "Doctor is unavailable at this time"
        app.status = "Declined"
        app.doctor_id = doc_rec.id
        app.cancellation_reason = f"{decline_reason}. {payload.message or ''}".strip()
        db.commit()
        db.refresh(app)
        logger.info(f"[DOCTOR_SERVICE] Appointment id={app.id} DECLINED (reason: {decline_reason})")

        try:
            rem = PatientReminder(
                patient_id=app.patient_id,
                title="Appointment Request Declined",
                subtitle=f"{app.doctor_name} • {decline_reason}",
                notes=f"Dr. {app.doctor_name} is unavailable for {app.appointment_date} at {app.appointment_time}. Reason: {decline_reason}. Please select another time slot.",
                reminder_type="Appointment",
                time_str=app.appointment_time,
                date_str=app.appointment_date,
                recurrence="Once",
                status="Declined",
                icon_type="calendar",
                color_theme="rose"
            )
            db.add(rem)
            db.commit()
        except Exception as e:
            logger.warning(f"Failed to create patient decline notification: {e}")

        return {"status": "success", "message": "Appointment declined", "appointment_id": appointment_id, "appointment_status": "Declined", "reason": decline_reason}

    def mark_no_show(self, db: Session, user: User, appointment_id: str) -> Dict[str, Any]:
        app = db.query(Appointment).filter(Appointment.id == appointment_id).first()
        if app:
            app.status = "NO_SHOW"
            app.cancellation_reason = "Patient did not attend appointment (No-Show)"
            db.commit()

            rem = PatientReminder(
                patient_id=app.patient_id,
                title="Missed Appointment (No-Show)",
                notes=f"You missed your scheduled consultation on {app.appointment_date} at {app.appointment_time}. Please book a new slot if needed.",
                reminder_type="APPOINTMENT",
                date_str=app.appointment_date,
                time_str=app.appointment_time or "09:00 AM",
                priority="Normal"
            )
            db.add(rem)
            db.commit()

        return {"status": "success", "message": "Appointment marked as NO_SHOW", "appointment_id": appointment_id}

    def block_time_slot(self, db: Session, user: User, payload: DoctorBlockSlotRequest) -> Dict[str, Any]:
        doc = self.get_or_create_doctor_profile(db, user)
        if doc.id not in _DOCTOR_BLOCKED_SLOTS:
            _DOCTOR_BLOCKED_SLOTS[doc.id] = []

        _DOCTOR_BLOCKED_SLOTS[doc.id].append({
            "date": payload.date,
            "slot_time": payload.slot_time,
            "reason": payload.reason or "Personal Work"
        })

        return {
            "status": "success",
            "message": f"Slot {payload.slot_time} on {payload.date} is now blocked.",
            "date": payload.date,
            "slot_time": payload.slot_time
        }

    def emergency_cancel_appointment(self, db: Session, user: User, appointment_id: str, payload: DoctorEmergencyCancelRequest) -> Dict[str, Any]:
        app = db.query(Appointment).filter(Appointment.id == appointment_id).first()
        if app:
            app.status = "Cancelled"
            app.cancellation_reason = payload.reason
            app.cancelled_at = datetime.now(timezone.utc)
            db.commit()

            rem = PatientReminder(
                patient_id=app.patient_id,
                title="Emergency Cancellation",
                notes=payload.message_to_patient or f"Your appointment on {app.appointment_date} at {app.appointment_time} was cancelled due to an urgent doctor schedule change.",
                reminder_type="APPOINTMENT",
                date_str=f"{app.appointment_date}",
                time_str=app.appointment_time or "09:00 AM",
                priority="Urgent"
            )
            db.add(rem)
            db.commit()

        return {"status": "success", "message": "Appointment cancelled and patient notified."}

    def set_day_off(self, db: Session, user: User, payload: DoctorDayOffRequest) -> DoctorDayOffResponse:
        doc = self.get_or_create_doctor_profile(db, user)
        if doc.id not in _DOCTOR_DAYS_OFF:
            _DOCTOR_DAYS_OFF[doc.id] = []

        existing_apps = db.query(Appointment).filter(
            Appointment.is_deleted == False,
            Appointment.appointment_date == payload.date,
            Appointment.status.in_(["Confirmed", "Pending"])
        ).all()

        count = len(existing_apps)
        cancelled_cnt = 0

        if count > 0 and payload.confirm_cancel_existing:
            for app in existing_apps:
                app.status = "Cancelled"
                app.cancellation_reason = f"Doctor Day Off ({payload.reason})"
                app.cancelled_at = datetime.now(timezone.utc)
                cancelled_cnt += 1

                rem = PatientReminder(
                    patient_id=app.patient_id,
                    title="Appointment Cancelled - Doctor Day Off",
                    notes=f"Your appointment on {payload.date} was cancelled as the doctor is taking leave ({payload.reason}). Please reschedule.",
                    reminder_type="APPOINTMENT",
                    date_str=payload.date,
                    time_str=app.appointment_time or "09:00 AM",
                    priority="High"
                )
                db.add(rem)
            db.commit()

        _DOCTOR_DAYS_OFF[doc.id].append({
            "date": payload.date,
            "reason": payload.reason or "Personal Leave"
        })

        msg = f"Day off set for {payload.date}."
        if count > 0 and not payload.confirm_cancel_existing:
            msg += f" Warning: You have {count} appointments scheduled on this date."

        return DoctorDayOffResponse(
            success=True,
            date=payload.date,
            existing_appointments_count=count,
            cancelled_count=cancelled_cnt,
            message=msg
        )

    def get_schedule_config(self, db: Session, user: User) -> DoctorScheduleConfig:
        doc = self.get_or_create_doctor_profile(db, user)
        cfg = _DOCTOR_SCHEDULE_CONFIG.get(doc.id)
        if not cfg:
            return DoctorScheduleConfig(
                working_days=["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
                morning_start="09:00 AM",
                morning_end="01:00 PM",
                evening_start="04:00 PM",
                evening_end="07:00 PM",
                slot_duration_minutes=30
            )
        return DoctorScheduleConfig(**cfg)

    def update_schedule_config(self, db: Session, user: User, payload: DoctorScheduleConfig) -> DoctorScheduleConfig:
        doc = self.get_or_create_doctor_profile(db, user)
        _DOCTOR_SCHEDULE_CONFIG[doc.id] = payload.model_dump()
        return payload

    def get_prescription_templates(self) -> List[PrescriptionTemplateItem]:
        return [
            PrescriptionTemplateItem(
                id="tmpl-1",
                title="Viral Fever",
                diagnosis="Viral Fever & Myalgia",
                medicines=[
                    MedicationItemCreate(medicine_name="Paracetamol", dosage="500 mg", frequency="Twice Daily", duration="3 Days", instructions="After meals"),
                    MedicationItemCreate(medicine_name="Cetirizine", dosage="10 mg", frequency="Once Daily", duration="5 Days", instructions="At bedtime"),
                    MedicationItemCreate(medicine_name="ORS Powder", dosage="1 sachet", frequency="Twice Daily", duration="3 Days", instructions="Dissolve in 1L clean water"),
                ]
            ),
            PrescriptionTemplateItem(
                id="tmpl-2",
                title="Cold & Cough",
                diagnosis="Upper Respiratory Tract Infection",
                medicines=[
                    MedicationItemCreate(medicine_name="Amoxicillin", dosage="500 mg", frequency="Thrice Daily", duration="5 Days", instructions="After meals"),
                    MedicationItemCreate(medicine_name="Cough Syrup (Ascoril-D)", dosage="10 ml", frequency="Thrice Daily", duration="5 Days", instructions="After meals"),
                    MedicationItemCreate(medicine_name="Steam Inhalation", dosage="N/A", frequency="Twice Daily", duration="5 Days", instructions="Morning and evening"),
                ]
            ),
            PrescriptionTemplateItem(
                id="tmpl-3",
                title="General Checkup & Multivitamin",
                diagnosis="Routine Health Checkup / Vitamin Deficiency",
                medicines=[
                    MedicationItemCreate(medicine_name="Multivitamin (Becosules)", dosage="1 capsule", frequency="Once Daily", duration="30 Days", instructions="After breakfast"),
                    MedicationItemCreate(medicine_name="Vitamin D3 60K", dosage="60,000 IU", frequency="Once Weekly", duration="8 Weeks", instructions="With milk"),
                ]
            ),
            PrescriptionTemplateItem(
                id="tmpl-4",
                title="Hypertension & Diabetes Follow-up",
                diagnosis="Essential Hypertension & Type 2 Diabetes Mellitus",
                medicines=[
                    MedicationItemCreate(medicine_name="Telmisartan", dosage="40 mg", frequency="Once Daily", duration="30 Days", instructions="Morning before breakfast"),
                    MedicationItemCreate(medicine_name="Metformin SR", dosage="500 mg", frequency="Twice Daily", duration="30 Days", instructions="After meals"),
                ]
            )
        ]

    def get_doctor_patients(self, db: Session, user: User, search: Optional[str] = None) -> List[DoctorPatientSummary]:
        doc = self.get_or_create_doctor_profile(db, user)

        # Query distinct patient IDs associated with this logged-in doctor via appointments
        doc_name_like = f"%{user.name}%" if user.name else "%"
        patient_ids_select = db.query(Appointment.patient_id).filter(
            or_(
                Appointment.doctor_id == doc.id,
                Appointment.doctor_id == user.id,
                Appointment.doctor_name.ilike(doc_name_like)
            ),
            Appointment.status.in_(["Confirmed", "Completed", "Pending", "CONFIRMED", "COMPLETED", "PENDING"]),
            Appointment.is_deleted == False
        ).distinct()

        db_patients = db.query(Patient).join(User).filter(
            Patient.id.in_(patient_ids_select),
            User.is_active == True
        ).all()

        pat_ids_list = [p.id for p in db_patients]
        rx_counts = dict(
            db.query(Prescription.patient_id, func.count(Prescription.id))
            .filter(
                Prescription.patient_id.in_(pat_ids_list),
                Prescription.is_deleted == False,
                Prescription.status == "ACTIVE"
            )
            .group_by(Prescription.patient_id)
            .all()
        )

        latest_apps = {}
        if pat_ids_list:
            for app in db.query(Appointment).filter(
                Appointment.patient_id.in_(pat_ids_list),
                Appointment.is_deleted == False
            ).order_by(desc(Appointment.created_at)).all():
                if app.patient_id not in latest_apps:
                    latest_apps[app.patient_id] = app.appointment_date

        patients_data = []
        for p in db_patients:
            active_rx_cnt = rx_counts.get(p.id, 0)
            last_visit_str = latest_apps.get(p.id, "Recent Registration")

            patients_data.append(
                DoctorPatientSummary(
                    id=p.id,
                    name=p.user.name if p.user else "Patient",
                    age=30,
                    gender=p.gender or "Male",
                    blood_group=p.blood_group or "O+",
                    phone=p.phone or "+91 98000 11122",
                    email=p.user.email if p.user else "",
                    last_visit=last_visit_str,
                    allergies=p.allergies or "None recorded",
                    conditions=p.chronic_conditions or "None recorded",
                    active_prescriptions_count=active_rx_cnt
                )
            )

        if search:
            search_l = search.lower()
            patients_data = [p for p in patients_data if search_l in p.name.lower() or search_l in (p.conditions or "").lower()]

        return patients_data

    def get_patient_detail(self, db: Session, user: User, patient_id: str) -> DoctorPatientDetail:
        doc = self.get_or_create_doctor_profile(db, user)

        # Query real patient from PostgreSQL
        pat = db.query(Patient).join(User).filter(
            or_(Patient.id == patient_id, Patient.user_id == patient_id)
        ).first()

        if not pat:
            raise AppException(status_code=status.HTTP_404_NOT_FOUND, detail="Patient profile not found.")

        # Real Active Medications
        rx_list = db.query(Prescription).filter(
            Prescription.patient_id == pat.id,
            Prescription.is_deleted == False
        ).order_by(desc(Prescription.created_at)).all()

        current_meds = [
            f"{r.medication_name} {r.dosage} ({r.frequency} - {r.instructions or 'As directed'})"
            for r in rx_list if r.status == "ACTIVE"
        ]

        if not current_meds and pat.current_medications:
            current_meds = [pat.current_medications]

        history_data = []

        # 1. Real Medical Records & Reports + Dynamic Extracted Parameters
        records = db.query(MedicalRecord).filter(
            MedicalRecord.patient_id == pat.id,
            MedicalRecord.is_deleted == False
        ).order_by(desc(MedicalRecord.created_at)).all()

        reports_data = []
        abnormal_parameters_summary = []

        for rec in records:
            file_url = rec.file_path if (rec.file_path and rec.file_path.startswith("http")) else f"/api/records/{rec.id}/file"
            
            # Parse extracted data and parameters
            extracted_params = []
            if rec.extracted_data:
                try:
                    ext_json = json.loads(rec.extracted_data) if isinstance(rec.extracted_data, str) else rec.extracted_data
                    if isinstance(ext_json, dict) and "parameters" in ext_json:
                        extracted_params = ext_json.get("parameters", [])
                except Exception:
                    pass
            
            # Extract abnormal parameters for consolidated summary
            for p in extracted_params:
                if isinstance(p, dict) and p.get("status") in ["HIGH", "ELEVATED", "LOW", "CRITICAL", "ABNORMAL"]:
                    abnormal_parameters_summary.append(
                        f"{p.get('display_name', 'Parameter')}: {p.get('value', '')} {p.get('unit', '')} ({p.get('status')})"
                    )

            rec_date = rec.record_date or (rec.created_at.strftime("%d %b %Y") if rec.created_at else "Recent")
            rec_iso_date = rec.record_date or (rec.created_at.strftime("%Y-%m-%d") if rec.created_at else "2026-09-04")

            reports_data.append({
                "id": rec.id,
                "title": rec.title,
                "category": rec.category or "Medical Document",
                "date": rec_date,
                "file_name": rec.file_name or f"{rec.title}.pdf",
                "file_url": file_url,
                "summary": rec.description or getattr(rec, 'summary_quick', None) or "Medical record document on file.",
                "summary_detailed": getattr(rec, 'summary_detailed', None),
                "extracted_parameters": extracted_params,
                "approval_status": getattr(rec, 'approval_status', 'REVIEW')
            })

            history_data.append({
                "id": f"hist-rec-{rec.id}",
                "date": rec_iso_date,
                "event_type": "Medical Report",
                "title": f"Medical Report: {rec.title}",
                "doctor_name": rec.doctor_name or "Attending Physician",
                "description": rec.description or getattr(rec, 'summary_quick', None) or "Uploaded to medical vault.",
                "source_id": rec.id,
                "category": "Report"
            })

        # 2. Real AI Conversations History
        ai_convs = db.query(AIConversation).filter(
            AIConversation.patient_id == pat.id,
            AIConversation.is_deleted == False
        ).order_by(desc(AIConversation.created_at)).all()

        ai_conversations_data = []
        recent_symptoms_ai = []

        for conv in ai_convs:
            conv_date = conv.created_at.strftime("%d %b %Y, %I:%M %p") if conv.created_at else "Recent"
            conv_iso_date = conv.created_at.strftime("%Y-%m-%d") if conv.created_at else "2026-09-04"
            summary_txt = conv.clinical_summary or conv.summary_preview or "Interactive patient health consultation."
            
            if conv.clinical_summary:
                recent_symptoms_ai.append(conv.clinical_summary)

            ai_conversations_data.append({
                "id": conv.id,
                "title": conv.title or "Health Consultation",
                "date": conv_date,
                "iso_date": conv_iso_date,
                "status": conv.status,
                "consultation_state": conv.consultation_state,
                "summary": summary_txt,
                "message_count": len(conv.messages) if hasattr(conv, 'messages') else 0
            })

            history_data.append({
                "id": f"hist-ai-{conv.id}",
                "date": conv_iso_date,
                "event_type": "AI Consultation",
                "title": f"AI Consultation: {conv.title or 'Health Chat'}",
                "doctor_name": "MediAssist AI Assistant",
                "description": summary_txt,
                "source_id": conv.id,
                "category": "AI"
            })

        # 3. Real Voice Sessions History
        voice_sessions = db.query(VoiceSession).filter(
            VoiceSession.patient_id == pat.id
        ).order_by(desc(VoiceSession.created_at)).all()

        voice_sessions_data = []
        for vs in voice_sessions:
            vs_date = vs.created_at.strftime("%d %b %Y, %I:%M %p") if vs.created_at else "Recent"
            vs_iso_date = vs.created_at.strftime("%Y-%m-%d") if vs.created_at else "2026-09-04"
            vs_summary = vs.summary or vs.transcript or "Voice health consultation."

            voice_sessions_data.append({
                "id": vs.id,
                "date": vs_date,
                "iso_date": vs_iso_date,
                "mode": vs.conversation_mode or "Voice Consultation",
                "status": vs.status.value if hasattr(vs.status, 'value') else str(vs.status),
                "summary": vs_summary,
                "transcript_preview": vs.transcript[:180] + "..." if vs.transcript and len(vs.transcript) > 180 else vs.transcript
            })

            history_data.append({
                "id": f"hist-voice-{vs.id}",
                "date": vs_iso_date,
                "event_type": "Voice Consultation",
                "title": f"Voice Consultation ({vs.conversation_mode or 'General'})",
                "doctor_name": "MediAssist Voice Assistant",
                "description": vs_summary,
                "source_id": vs.id,
                "category": "Voice"
            })

        # 4. Real Appointments History
        db_appointments = db.query(Appointment).filter(
            Appointment.patient_id == pat.id,
            Appointment.is_deleted == False
        ).order_by(desc(Appointment.created_at)).all()

        appointments_data = []
        for app in db_appointments:
            appointments_data.append({
                "id": app.id,
                "date": app.appointment_date,
                "time": app.appointment_time,
                "type": app.mode or "Video Consultation",
                "status": app.status,
                "reason": app.notes or app.appointment_type or "General Health Checkup"
            })

            history_data.append({
                "id": f"hist-app-{app.id}",
                "date": app.appointment_date,
                "event_type": "Appointment",
                "title": f"Appointment: {app.appointment_type or 'General Checkup'}",
                "doctor_name": app.doctor_name,
                "description": app.notes or f"Status: {app.status}",
                "source_id": app.id,
                "category": "Appointment"
            })

        # 5. Real Prescriptions History
        prescriptions_data = []
        for rx in rx_list:
            diag = getattr(rx, 'diagnosis_or_indication', None) or getattr(rx, 'title', None) or "General Consultation"
            rx_iso_date = rx.prescribed_date or (rx.created_at.strftime("%Y-%m-%d") if rx.created_at else "2026-08-31")

            prescriptions_data.append({
                "id": rx.id,
                "date": rx.prescribed_date or (rx.created_at.strftime("%d %b %Y") if rx.created_at else ""),
                "diagnosis": diag,
                "doctor_name": rx.doctor_name,
                "type": "Digital" if "Uploaded" not in rx.medication_name else "Uploaded Document",
                "medicines": [
                    {
                        "name": rx.medication_name,
                        "dosage": rx.dosage,
                        "frequency": rx.frequency,
                        "duration": rx.duration,
                        "instructions": rx.instructions
                    }
                ]
            })

            history_data.append({
                "id": f"hist-rx-{rx.id}",
                "date": rx_iso_date,
                "event_type": "Prescription",
                "title": f"Prescription: {diag}",
                "doctor_name": rx.doctor_name or "Attending Physician",
                "description": f"Medication: {rx.medication_name} ({rx.dosage}, {rx.frequency})",
                "source_id": rx.id,
                "category": "Prescription"
            })

        # Sort history timeline chronologically (latest first)
        history_data.sort(key=lambda x: str(x.get("date") or ""), reverse=True)

        # Real Emergency Contact
        emergency_contact = None
        if pat.emergency_contact:
            try:
                emergency_contact = json.loads(pat.emergency_contact)
            except Exception:
                emergency_contact = {"name": "Emergency Contact", "phone": pat.phone or "N/A"}

        # AI Health Summary Preview
        ai_health_summary = None
        if ai_convs:
            latest_conv = ai_convs[0]
            ai_health_summary = {
                "title": latest_conv.title or "AI Preventive Care & Health Summary",
                "summary": latest_conv.clinical_summary or latest_conv.summary_preview or "Patient has active AI consultation records on file.",
                "disclaimer": "AI-Generated Health Summary — Generated by MediAssist AI. This information is AI-generated and should be reviewed by a qualified healthcare professional.",
                "created_at": latest_conv.created_at.strftime("%d %b %Y") if latest_conv.created_at else ""
            }

        # Consolidated Multi-Source Medical Summary
        recent_concerns_str = "; ".join(recent_symptoms_ai[:3]) if recent_symptoms_ai else "Patient reported symptoms via digital health assistant."
        abnormal_reports_str = "; ".join(abnormal_parameters_summary[:4]) if abnormal_parameters_summary else "All detected parameters within reference ranges."

        consolidated_summary = {
            "title": "Executive Consolidated Pre-Consultation Summary",
            "summary": f"Patient ({pat.user.name if pat.user else 'Patient'}, {pat.gender or 'Male'}) has {len(records)} medical reports, {len(ai_convs)} AI consultations, {len(voice_sessions)} voice sessions, and {len(rx_list)} prescriptions on record. {recent_concerns_str}",
            "recent_concerns": recent_concerns_str,
            "key_report_findings": abnormal_reports_str,
            "active_medications": ", ".join(current_meds) if current_meds else "None recorded",
            "generated_at": datetime.now().strftime("%d %b %Y, %I:%M %p"),
            "version": 1,
            "disclaimer": "Synthesized Clinical Summary — Generated by MediAssist Multi-Source AI. For doctor review."
        }

        patient_summary = DoctorPatientSummary(
            id=pat.id,
            name=pat.user.name if pat.user else "Patient",
            age=30,
            gender=pat.gender or "Male",
            blood_group=pat.blood_group or "O+",
            phone=pat.phone or "+91 98000 11122",
            email=pat.user.email if pat.user else "",
            last_visit=appointments_data[0]["date"] if appointments_data else "Recent Registration",
            allergies=pat.allergies or "None recorded",
            conditions=pat.chronic_conditions or "None recorded",
            active_prescriptions_count=len(current_meds)
        )

        return DoctorPatientDetail(
            patient_info=patient_summary,
            current_medications=current_meds,
            medical_history=history_data,
            reports=reports_data,
            prescriptions=prescriptions_data,
            appointments=appointments_data,
            ai_conversations=ai_conversations_data,
            voice_sessions=voice_sessions_data,
            emergency_contact=emergency_contact,
            ai_health_summary=ai_health_summary,
            consolidated_summary=consolidated_summary
        )

    def get_patient_ai_conversation_transcript(self, db: Session, user: User, patient_id: str, conversation_id: str) -> Dict[str, Any]:
        conv = db.query(AIConversation).filter(
            AIConversation.id == conversation_id,
            AIConversation.is_deleted == False
        ).first()

        if not conv:
            raise AppException(status_code=status.HTTP_404_NOT_FOUND, detail="AI Conversation not found.")

        messages_data = []
        for msg in conv.messages:
            messages_data.append({
                "id": msg.id,
                "sender_role": msg.sender_role,
                "content": msg.content,
                "message_type": msg.message_type,
                "created_at": msg.created_at.strftime("%I:%M %p, %d %b %Y") if msg.created_at else ""
            })

        return {
            "conversation_id": conv.id,
            "patient_id": conv.patient_id,
            "title": conv.title,
            "status": conv.status,
            "consultation_state": conv.consultation_state,
            "clinical_summary": conv.clinical_summary or conv.summary_preview,
            "created_at": conv.created_at.strftime("%d %b %Y, %I:%M %p") if conv.created_at else "",
            "messages": messages_data
        }

    def get_patient_voice_transcript(self, db: Session, user: User, patient_id: str, session_id: str) -> Dict[str, Any]:
        vs = db.query(VoiceSession).filter(VoiceSession.id == session_id).first()

        if not vs:
            raise AppException(status_code=status.HTTP_404_NOT_FOUND, detail="Voice session not found.")

        messages_data = []
        for msg in vs.messages:
            messages_data.append({
                "id": msg.id,
                "role": msg.role,
                "content": msg.content,
                "created_at": msg.created_at.strftime("%I:%M %p") if msg.created_at else ""
            })

        return {
            "session_id": vs.id,
            "patient_id": vs.patient_id,
            "mode": vs.conversation_mode,
            "status": vs.status.value if hasattr(vs.status, 'value') else str(vs.status),
            "summary": vs.summary,
            "transcript": vs.transcript,
            "key_points": vs.key_points,
            "started_at": vs.started_at.strftime("%d %b %Y, %I:%M %p") if vs.started_at else "",
            "messages": messages_data
        }

    def generate_patient_medical_summary(self, db: Session, user: User, patient_id: str) -> Dict[str, Any]:
        pat = db.query(Patient).join(User).filter(
            or_(Patient.id == patient_id, Patient.user_id == patient_id)
        ).first()

        if not pat:
            raise AppException(status_code=status.HTTP_404_NOT_FOUND, detail="Patient profile not found.")

        records = db.query(MedicalRecord).filter(MedicalRecord.patient_id == pat.id, MedicalRecord.is_deleted == False).all()
        ai_convs = db.query(AIConversation).filter(AIConversation.patient_id == pat.id, AIConversation.is_deleted == False).all()
        voice_sessions = db.query(VoiceSession).filter(VoiceSession.patient_id == pat.id).all()
        rx_list = db.query(Prescription).filter(Prescription.patient_id == pat.id, Prescription.is_deleted == False).all()

        current_meds = [r.medication_name for r in rx_list if r.status == "ACTIVE"]
        recent_symptoms = [c.clinical_summary for c in ai_convs if c.clinical_summary]
        abnormal_params = []

        for rec in records:
            if rec.extracted_data:
                try:
                    ext_json = json.loads(rec.extracted_data) if isinstance(rec.extracted_data, str) else rec.extracted_data
                    for p in ext_json.get("parameters", []):
                        if isinstance(p, dict) and p.get("status") in ["HIGH", "ELEVATED", "LOW", "CRITICAL", "ABNORMAL"]:
                            abnormal_params.append(f"{p.get('display_name')}: {p.get('value')} {p.get('unit', '')} ({p.get('status')})")
                except Exception:
                    pass

        summary_text = (
            f"Comprehensive Clinical Assessment for {pat.user.name if pat.user else 'Patient'} ({pat.gender or 'Male'}): "
            f"Synthesized from {len(records)} lab reports, {len(ai_convs)} AI assistant consultations, "
            f"{len(voice_sessions)} voice intake sessions, and {len(rx_list)} prescriptions on file. "
            f"Primary reported concerns: {'; '.join(recent_symptoms[:2]) if recent_symptoms else 'Routine consultation'}. "
            f"Report findings highlight: {'; '.join(abnormal_params[:3]) if abnormal_params else 'No critical parameter flags'}. "
            f"Active medications: {', '.join(current_meds) if current_meds else 'None on file'}. "
            "Doctor review and clinical correlation recommended."
        )

        return {
            "title": "Executive Consolidated Pre-Consultation Summary",
            "summary": summary_text,
            "recent_concerns": "; ".join(recent_symptoms[:3]) if recent_symptoms else "None recorded",
            "key_report_findings": "; ".join(abnormal_params[:4]) if abnormal_params else "All detected parameters within reference ranges.",
            "active_medications": ", ".join(current_meds) if current_meds else "None recorded",
            "generated_at": datetime.now().strftime("%d %b %Y, %I:%M %p"),
            "version": 2,
            "disclaimer": "AI-Synthesized Multi-Source Summary — Generated by MediAssist AI for Doctor Review."
        }

    def submit_consultation(self, db: Session, user: User, payload: DoctorConsultationSubmit) -> Dict[str, Any]:
        app = db.query(Appointment).filter(Appointment.id == payload.appointment_id).first()
        if app:
            app.status = "COMPLETED"
            app.notes = f"Chief Complaint: {payload.chief_complaint or 'Fever'}\nDiagnosis: {payload.diagnosis}\nClinical Notes: {payload.clinical_notes}\nAdvice: {payload.advice or 'Rest and fluids'}"
            db.commit()

        # Follow-up reminder handling
        if payload.follow_up_date or payload.follow_up_days:
            due_str = payload.follow_up_date or (datetime.now() + timedelta(days=payload.follow_up_days or 7)).strftime("%Y-%m-%d")
            rem = PatientReminder(
                patient_id=payload.patient_id,
                title="Follow-Up Consultation Recommended",
                notes=f"Doctor recommended a follow-up consultation on {due_str}. Reason: {payload.follow_up_reason or payload.diagnosis}",
                reminder_type="FOLLOW_UP",
                date_str=due_str,
                time_str="09:00 AM",
                priority="High"
            )
            db.add(rem)

        msg = DoctorHealthMessage(
            patient_id=payload.patient_id,
            appointment_id=payload.appointment_id,
            doctor_name=user.name or "Dr. Sarah Jenkins",
            doctor_specialty="General Physician",
            message_type="CLINICAL_ADVICE",
            title=f"Consultation Summary: {payload.diagnosis}",
            content=f"Diagnosis: {payload.diagnosis}\n\nClinical Advice:\n{payload.advice or 'Please complete the prescribed course of medication.'}\n\nFollow-up: {payload.follow_up_days or 7} days.",
            priority="NORMAL"
        )
        db.add(msg)
        db.commit()

        return {"status": "success", "message": "Consultation completed successfully", "appointment_id": payload.appointment_id}

    def create_digital_prescription(self, db: Session, user: User, payload: DigitalPrescriptionCreate) -> Dict[str, Any]:
        doc = self.get_or_create_doctor_profile(db, user)
        today_str = datetime.now().strftime("%Y-%m-%d")

        meds_summary = ", ".join([f"{m.medicine_name} {m.dosage} ({m.frequency})" for m in payload.medicines])

        rx = Prescription(
            patient_id=payload.patient_id,
            doctor_name=user.name or "Dr. Sarah Jenkins",
            doctor_specialty="General Physician",
            hospital="MediAssist Medical Center",
            diagnosis_or_indication=payload.diagnosis,
            medication_name=payload.medicines[0].medicine_name if payload.medicines else "Paracetamol",
            dosage=payload.medicines[0].dosage if payload.medicines else "500mg",
            frequency=payload.medicines[0].frequency if payload.medicines else "Twice daily",
            duration=payload.medicines[0].duration if payload.medicines else "3 days",
            instructions=payload.medicines[0].instructions if payload.medicines else "After meals",
            notes=payload.additional_notes or f"Full Prescription List: {meds_summary}",
            prescribed_date=today_str,
            status="ACTIVE"
        )
        db.add(rx)
        db.commit()
        db.refresh(rx)

        rem = PatientReminder(
            patient_id=payload.patient_id,
            title="New Digital Prescription Received",
            notes=f"Dr. Sarah Jenkins issued a prescription for {payload.diagnosis} ({meds_summary}).",
            reminder_type="MEDICINE",
            date_str=today_str,
            time_str="09:00 AM",
            priority="High"
        )
        db.add(rem)
        db.commit()

        return {"status": "success", "prescription_id": rx.id, "message": "Digital prescription issued successfully"}

    def create_image_prescription(self, db: Session, user: User, payload: ImagePrescriptionCreate) -> Dict[str, Any]:
        doc = self.get_or_create_doctor_profile(db, user)
        today_str = datetime.now().strftime("%Y-%m-%d")

        rx = Prescription(
            patient_id=payload.patient_id,
            doctor_name=user.name or "Dr. Sarah Jenkins",
            doctor_specialty="General Physician",
            hospital="MediAssist Medical Center",
            diagnosis_or_indication=payload.diagnosis,
            medication_name="Uploaded Prescription Image/PDF",
            dosage="As specified in document",
            frequency="As specified in document",
            duration="As specified",
            instructions=f"File: {payload.file_name or 'Prescription.pdf'}",
            notes=payload.additional_notes or "Uploaded prescription file attached.",
            prescribed_date=today_str,
            status="ACTIVE"
        )
        db.add(rx)
        db.commit()
        db.refresh(rx)

        rem = PatientReminder(
            patient_id=payload.patient_id,
            title="New Prescription Document Uploaded",
            notes=f"Dr. Sarah Jenkins uploaded your prescription document for {payload.diagnosis}.",
            reminder_type="MEDICINE",
            date_str=today_str,
            time_str="09:00 AM",
            priority="High"
        )
        db.add(rem)
        db.commit()

        return {"status": "success", "prescription_id": rx.id, "message": "Prescription document uploaded successfully"}

    def send_patient_reminder(self, db: Session, user: User, payload: PatientReminderCreate) -> Dict[str, Any]:
        due_str = payload.due_date or datetime.now().strftime("%Y-%m-%d")
        rem = PatientReminder(
            patient_id=payload.patient_id,
            title=f"Doctor Reminder: {payload.title}",
            notes=payload.message,
            reminder_type=payload.reminder_type.upper(),
            date_str=due_str,
            time_str="09:00 AM",
            priority="High"
        )
        db.add(rem)
        db.commit()
        db.refresh(rem)

        return {"status": "success", "reminder_id": rem.id, "message": "Reminder sent to patient successfully."}

    def process_doctor_quick_ai(self, query: str, patient_id: Optional[str] = None) -> DoctorQuickAIResponse:
        q_lower = query.lower()

        if "reminder" in q_lower or "draft" in q_lower:
            return DoctorQuickAIResponse(
                message="I've drafted a patient reminder for you. Review the draft below before sending to the patient's portal feed:",
                draft_reminder={
                    "reminder_type": "Report",
                    "title": "Upload CBC Blood Test Report",
                    "message": "Please upload your latest Complete Blood Count (CBC) report before your scheduled consultation tomorrow."
                },
                suggested_questions=["Send this reminder", "Edit reminder text", "Summarize patient history"],
                action={"label": "Open Messages & Reminders", "route": "/doctor/messages"}
            )
        elif "schedule" in q_lower or "day off" in q_lower or "availability" in q_lower or "block" in q_lower:
            return DoctorQuickAIResponse(
                message="To manage your schedule, block individual slots, or declare a Day Off, navigate to Appointments > Schedule & Availability. You can block any slot (e.g., 10:00 AM) or block an entire day with automatic patient collision alerts.",
                suggested_questions=["How do I block a time slot?", "Set day off for tomorrow", "Cancel an appointment"],
                action={"label": "Go to Appointments", "route": "/doctor/appointments"}
            )
        elif "prescription" in q_lower or "template" in q_lower or "medicine" in q_lower:
            return DoctorQuickAIResponse(
                message="You can create digital prescriptions with itemized dosages or use pre-built templates (Viral Fever, Cold & Cough, Checkup, Diabetes). You can also upload handwritten/scanned PDF prescription documents.",
                suggested_questions=["Use Viral Fever template", "Upload prescription PDF", "View patient medical history"],
                action={"label": "Open Prescriptions", "route": "/doctor/prescriptions"}
            )
        elif "patient" in q_lower or "history" in q_lower or "record" in q_lower:
            return DoctorQuickAIResponse(
                message="Clinical Summary for Test Patient (Rahul):\n• Allergies: Penicillin, Dust Mites\n• Chronic Condition: Mild Asthma\n• Current Meds: Salbutamol Inhaler\n• AI Summary: Preventive care & asthma management guide on file.",
                suggested_questions=["View full patient profile", "View uploaded lab reports", "Send patient reminder"],
                action={"label": "View Patient Profile", "route": "/doctor/patients"}
            )
        else:
            return DoctorQuickAIResponse(
                message="I'm MediAssist AI for Doctors 🩺. I can summarize patient clinical histories, draft patient reminders, assist with prescription templates, and guide your appointment schedule.",
                suggested_questions=[
                    "Summarize patient history",
                    "Draft a report reminder",
                    "How do I set a day off?",
                    "Show prescription templates"
                ],
                action={"label": "Doctor Dashboard", "route": "/doctor"}
            )

doctor_service = DoctorService()
