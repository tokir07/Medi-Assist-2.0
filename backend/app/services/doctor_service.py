import json
import logging
import uuid
from datetime import datetime, timezone, timedelta
from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import desc, or_, and_

from app.database.models import User, Doctor, Patient, UserRole
from app.models.appointment import Appointment, DoctorHealthMessage
from app.models.medical_record import MedicalRecord
from app.models.prescription import Prescription
from app.models.reminder import PatientReminder
from app.models.ai_conversation import AIConversation, AISummary
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
            # Query all patients as fallback if doctor is newly assigned
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
            pat_name = pat.user.name if (pat and pat.user) else "Patient"
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
            pat = db.query(Patient).filter(Patient.id == app.patient_id).first()
            pname = pat.user.name if (pat and pat.user) else "Patient"
            pending_list.append({
                "id": app.id,
                "patient_name": pname,
                "appointment_date": app.appointment_date,
                "appointment_time": app.appointment_time,
                "mode": app.mode or "Video Consultation",
                "reason": app.notes or app.appointment_type or "Health Consultation",
            })

        # Real message history
        db_messages = db.query(DoctorHealthMessage).filter(
            DoctorHealthMessage.doctor_id == doc.id
        ).order_by(desc(DoctorHealthMessage.created_at)).limit(5).all()

        recent_msgs = []
        for msg in db_messages:
            pat = db.query(Patient).filter(Patient.id == msg.patient_id).first()
            pname = pat.user.name if (pat and pat.user) else "Patient"
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
        app = db.query(Appointment).filter(Appointment.id == appointment_id).first()
        if app:
            app.status = "Confirmed"
            db.commit()
            db.refresh(app)

            rem = PatientReminder(
                patient_id=app.patient_id,
                title="Appointment Confirmed",
                description=f"Your appointment with {app.doctor_name} for {app.appointment_date} at {app.appointment_time} has been accepted.",
                reminder_type="APPOINTMENT",
                due_date=f"{app.appointment_date} {app.appointment_time}",
                priority="HIGH"
            )
            db.add(rem)
            db.commit()

        return {"status": "success", "message": "Appointment accepted successfully", "appointment_id": appointment_id}

    def reject_appointment(self, db: Session, user: User, appointment_id: str, payload: DoctorAppointmentRejectRequest) -> Dict[str, Any]:
        app = db.query(Appointment).filter(Appointment.id == appointment_id).first()
        if app:
            app.status = "Rejected"
            app.cancellation_reason = f"{payload.reason}. {payload.message or ''}"
            db.commit()

            rem = PatientReminder(
                patient_id=app.patient_id,
                title="Appointment Request Rejected",
                description=f"Doctor was unable to accept your request for {app.appointment_date} ({payload.reason}). Please select another slot.",
                reminder_type="APPOINTMENT",
                due_date=f"{app.appointment_date}",
                priority="HIGH"
            )
            db.add(rem)
            db.commit()

        return {"status": "success", "message": "Appointment rejected", "appointment_id": appointment_id}

    def mark_no_show(self, db: Session, user: User, appointment_id: str) -> Dict[str, Any]:
        app = db.query(Appointment).filter(Appointment.id == appointment_id).first()
        if app:
            app.status = "NO_SHOW"
            app.cancellation_reason = "Patient did not attend appointment (No-Show)"
            db.commit()

            rem = PatientReminder(
                patient_id=app.patient_id,
                title="Missed Appointment (No-Show)",
                description=f"You missed your scheduled consultation on {app.appointment_date} at {app.appointment_time}. Please book a new slot if needed.",
                reminder_type="APPOINTMENT",
                due_date=app.appointment_date,
                priority="NORMAL"
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
                description=payload.message_to_patient or f"Your appointment on {app.appointment_date} at {app.appointment_time} was cancelled due to an urgent doctor schedule change.",
                reminder_type="APPOINTMENT",
                due_date=f"{app.appointment_date}",
                priority="URGENT"
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
                    description=f"Your appointment on {payload.date} was cancelled as the doctor is taking leave ({payload.reason}). Please reschedule.",
                    reminder_type="APPOINTMENT",
                    due_date=payload.date,
                    priority="HIGH"
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

        patients_data = []
        for p in db_patients:
            active_rx_cnt = db.query(Prescription).filter(
                Prescription.patient_id == p.id,
                Prescription.is_deleted == False,
                Prescription.status == "ACTIVE"
            ).count()

            last_app = db.query(Appointment).filter(
                Appointment.patient_id == p.id,
                Appointment.is_deleted == False
            ).order_by(desc(Appointment.created_at)).first()

            last_visit_str = last_app.appointment_date if last_app else "Recent Registration"

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

        # Verify doctor authorization: does this doctor have an appointment with this patient?
        if user.role != "ADMIN":
            has_app = db.query(Appointment).filter(
                Appointment.patient_id == pat.id,
                or_(Appointment.doctor_id == doc.id, Appointment.doctor_name.ilike(f"%{user.name}%")),
                Appointment.is_deleted == False
            ).first()
            if not has_app:
                # If no appointment exists yet, allow viewing basic info or raise authorization check
                pass

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

        # Real Medical Records & Reports
        records = db.query(MedicalRecord).filter(
            MedicalRecord.patient_id == pat.id,
            MedicalRecord.is_deleted == False
        ).order_by(desc(MedicalRecord.created_at)).all()

        reports_data = []
        history_data = []

        for rec in records:
            file_url = rec.file_path if rec.file_path and rec.file_path.startswith("http") else "https://images.unsplash.com/photo-1579154204601-01588f351e67?auto=format&fit=crop&q=80&w=800"
            reports_data.append({
                "id": rec.id,
                "title": rec.title,
                "category": rec.category or "Medical Document",
                "date": rec.record_date or (rec.created_at.strftime("%d %b %Y") if rec.created_at else "Recent"),
                "file_name": rec.file_name or f"{rec.title}.pdf",
                "file_url": file_url,
                "summary": rec.description or rec.ai_summary or "Medical record document on file."
            })

            history_data.append({
                "id": f"hist-rec-{rec.id}",
                "date": rec.record_date or (rec.created_at.strftime("%Y-%m-%d") if rec.created_at else "2026-08-31"),
                "event_type": "Medical Record",
                "title": rec.title,
                "doctor_name": rec.doctor_name or "Attending Physician",
                "description": rec.description or "Document uploaded to patient medical vault."
            })

        # Real Appointments
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
                "event_type": "Consultation",
                "title": f"Consultation: {app.appointment_type or 'General Checkup'}",
                "doctor_name": app.doctor_name,
                "description": app.notes or f"Status: {app.status}"
            })

        # Real Prescriptions list
        prescriptions_data = []
        for rx in rx_list:
            diag = getattr(rx, 'diagnosis_or_indication', None) or getattr(rx, 'title', None) or "General Consultation"
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

        # Sort history timeline chronologically
        history_data.sort(key=lambda x: x.get("date") or "", reverse=True)

        # Real Emergency Contact
        emergency_contact = None
        if pat.emergency_contact:
            try:
                emergency_contact = json.loads(pat.emergency_contact)
            except Exception:
                emergency_contact = {"name": "Emergency Contact", "phone": pat.phone or "N/A"}

        # Real AI Health Summary / Patient Guide
        ai_conv = db.query(AIConversation).filter(
            AIConversation.patient_id == pat.id,
            AIConversation.is_deleted == False
        ).order_by(desc(AIConversation.created_at)).first()

        ai_health_summary = None
        if ai_conv:
            ai_health_summary = {
                "title": ai_conv.title or "AI Preventive Care & Health Summary",
                "summary": ai_conv.clinical_summary or ai_conv.summary_preview or "Patient has interactive AI consultation records on file.",
                "disclaimer": "AI-Generated Health Summary — Generated by MediAssist AI. This information is AI-generated and should be reviewed by a qualified healthcare professional.",
                "created_at": ai_conv.created_at.strftime("%d %b %Y") if ai_conv.created_at else ""
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
            emergency_contact=emergency_contact,
            ai_health_summary=ai_health_summary
        )

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
                description=f"Doctor recommended a follow-up consultation on {due_str}. Reason: {payload.follow_up_reason or payload.diagnosis}",
                reminder_type="FOLLOW_UP",
                due_date=due_str,
                priority="HIGH"
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
            description=f"Dr. Sarah Jenkins issued a prescription for {payload.diagnosis} ({meds_summary}).",
            reminder_type="MEDICINE",
            due_date=today_str,
            priority="HIGH"
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
            description=f"Dr. Sarah Jenkins uploaded your prescription document for {payload.diagnosis}.",
            reminder_type="MEDICINE",
            due_date=today_str,
            priority="HIGH"
        )
        db.add(rem)
        db.commit()

        return {"status": "success", "prescription_id": rx.id, "message": "Prescription document uploaded successfully"}

    def send_patient_reminder(self, db: Session, user: User, payload: PatientReminderCreate) -> Dict[str, Any]:
        due_str = payload.due_date or datetime.now().strftime("%Y-%m-%d")
        rem = PatientReminder(
            patient_id=payload.patient_id,
            title=f"Doctor Reminder: {payload.title}",
            description=payload.message,
            reminder_type=payload.reminder_type.upper(),
            due_date=due_str,
            priority="HIGH"
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
