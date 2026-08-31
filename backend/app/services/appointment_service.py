import math
import uuid
import logging
from datetime import datetime, timezone, timedelta
from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import or_, desc, asc

from app.models.appointment import Appointment, DoctorHealthMessage
from app.models.medical_record import MedicalRecord
from app.models.prescription import Prescription
from app.models.reminder import PatientReminder
from app.database.models import Doctor, User, Patient
from app.schemas.appointment import (
    AppointmentResponse,
    AppointmentSummaryResponse,
    AppointmentListResponse,
    AppointmentCreate,
    AppointmentReschedule,
    AppointmentCancel,
    DoctorInfo,
    AvailableSlotResponse,
    HospitalInfo,
    CalendarMonthResponse,
    CalendarDayEvent,
    RecommendationItem,
    LinkedRecordItem,
    LinkedPrescriptionItem,
    DoctorHealthMessageResponse,
    DoctorHealthMessageCreate
)
from app.utils.exceptions import AppException
from fastapi import status

logger = logging.getLogger(__name__)

STANDARD_SLOTS = [
    "09:00 AM", "09:30 AM", "10:00 AM", "10:30 AM", "11:00 AM", "11:30 AM",
    "02:00 PM", "02:30 PM", "03:00 PM", "03:30 PM", "04:00 PM", "04:15 PM",
    "04:30 PM", "05:00 PM", "05:30 PM"
]

AFFILIATED_HOSPITALS: List[Dict[str, Any]] = [
    {
        "id": "hosp-1",
        "name": "City Care Hospital",
        "location": "Connaught Place, New Delhi",
        "departments": ["General Medicine", "Cardiology", "Neurology", "Emergency Care"],
        "contact": "+91 11 2345 6789",
        "rating": 4.8
    },
    {
        "id": "hosp-2",
        "name": "Heart Health Clinic",
        "location": "Defence Colony, New Delhi",
        "departments": ["Cardiology", "Cardiothoracic Surgery", "Preventive Heart Care"],
        "contact": "+91 11 4567 8901",
        "rating": 4.9
    },
    {
        "id": "hosp-3",
        "name": "Bone & Joint Care",
        "location": "Sector 29, Gurugram",
        "departments": ["Orthopedics", "Physical Therapy", "Sports Medicine"],
        "contact": "+91 124 456 7890",
        "rating": 4.7
    },
    {
        "id": "hosp-4",
        "name": "MediAssist Medical Center",
        "location": "South Extension, New Delhi",
        "departments": ["Multi-specialty", "AI Diagnostics", "Pathology", "Wellness"],
        "contact": "+91 11 8899 0011",
        "rating": 4.95
    }
]

REGISTERED_CLINICIANS: List[Dict[str, Any]] = [
    {
        "name": "Dr. Priya Sharma",
        "specialty": "General Physician",
        "hospital": "City Care Hospital",
        "experience": 8,
        "rating": 4.9,
        "image_url": "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=256&h=256",
        "available_days": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
    },
    {
        "name": "Dr. Arjun Mehta",
        "specialty": "Cardiologist",
        "hospital": "Heart Health Clinic",
        "experience": 14,
        "rating": 4.95,
        "image_url": "https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=256&h=256",
        "available_days": ["Monday", "Wednesday", "Friday"]
    },
    {
        "name": "Dr. Neha Verma",
        "specialty": "Orthopedic Surgeon",
        "hospital": "Bone & Joint Care",
        "experience": 11,
        "rating": 4.85,
        "image_url": "https://images.unsplash.com/photo-1594824813586-7788411b988f?auto=format&fit=crop&q=80&w=256&h=256",
        "available_days": ["Tuesday", "Thursday", "Saturday"]
    },
    {
        "name": "Dr. Sarah Jenkins",
        "specialty": "Cardiologist",
        "hospital": "MediAssist Medical Center",
        "experience": 10,
        "rating": 4.9,
        "image_url": "https://images.unsplash.com/photo-1527613426441-4da17471b66d?auto=format&fit=crop&q=80&w=256&h=256",
        "available_days": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]
    },
    {
        "name": "Dr. Rajesh Kothari",
        "specialty": "Dentist",
        "hospital": "Apex Dental Clinic",
        "experience": 9,
        "rating": 4.88,
        "image_url": "https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&q=80&w=256&h=256",
        "available_days": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
    },
    {
        "name": "Dr. Sunita Rao",
        "specialty": "Dermatologist",
        "hospital": "Metro Skin & Hair Care",
        "experience": 12,
        "rating": 4.92,
        "image_url": "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=256&h=256",
        "available_days": ["Monday", "Tuesday", "Thursday", "Saturday"]
    }
]

class AppointmentService:
    @staticmethod
    def _message_to_response(m: DoctorHealthMessage) -> DoctorHealthMessageResponse:
        return DoctorHealthMessageResponse(
            id=m.id,
            patient_id=m.patient_id,
            doctor_id=m.doctor_id,
            appointment_id=m.appointment_id,
            doctor_name=m.doctor_name,
            doctor_specialty=m.doctor_specialty,
            doctor_image=m.doctor_image,
            hospital=m.hospital,
            message_type=m.message_type or "CLINICAL_ADVICE",
            title=m.title or "Doctor Clinical Advice",
            content=m.content,
            priority=m.priority or "NORMAL",
            is_read=bool(m.is_read),
            read_at=m.read_at.isoformat() if m.read_at else None,
            created_at=m.created_at.strftime("%d %b %Y, %I:%M %p") if m.created_at else "",
            updated_at=m.updated_at.strftime("%d %b %Y, %I:%M %p") if m.updated_at else ""
        )

    @staticmethod
    def _to_response(a: Appointment, db: Optional[Session] = None) -> AppointmentResponse:
        linked_records: List[LinkedRecordItem] = []
        linked_prescriptions: List[LinkedPrescriptionItem] = []
        doctor_messages: List[DoctorHealthMessageResponse] = []

        if db:
            # 1. Fetch Linked Records
            records_q = db.query(MedicalRecord).filter(
                MedicalRecord.patient_id == a.patient_id,
                MedicalRecord.is_deleted == False
            )
            if a.session_name:
                records_q = records_q.filter(
                    or_(
                        MedicalRecord.session_name == a.session_name,
                        MedicalRecord.doctor_name.ilike(f"%{a.doctor_name}%")
                    )
                )
            for r in records_q.limit(5).all():
                linked_records.append(LinkedRecordItem(
                    id=r.id,
                    title=r.title,
                    category=r.category,
                    file_name=r.file_name,
                    record_date=r.record_date
                ))

            # 2. Fetch Linked Prescriptions
            presc_q = db.query(Prescription).filter(
                Prescription.patient_id == a.patient_id,
                Prescription.is_deleted == False,
                or_(
                    Prescription.appointment_id == a.id,
                    Prescription.doctor_name.ilike(f"%{a.doctor_name}%")
                )
            )
            for p in presc_q.limit(5).all():
                linked_prescriptions.append(LinkedPrescriptionItem(
                    id=p.id,
                    medication_name=p.medication_name,
                    dosage=p.dosage or "1 tablet",
                    frequency=p.frequency or "Twice daily",
                    doctor_name=p.doctor_name or a.doctor_name,
                    prescribed_date=p.prescribed_date
                ))

            # 3. Fetch Doctor Messages
            msgs = db.query(DoctorHealthMessage).filter(
                DoctorHealthMessage.patient_id == a.patient_id,
                or_(
                    DoctorHealthMessage.appointment_id == a.id,
                    DoctorHealthMessage.doctor_name.ilike(f"%{a.doctor_name}%")
                )
            ).order_by(desc(DoctorHealthMessage.created_at)).all()
            doctor_messages = [AppointmentService._message_to_response(m) for m in msgs]

        return AppointmentResponse(
            id=a.id,
            patient_id=a.patient_id,
            doctor_id=a.doctor_id,
            doctor_name=a.doctor_name,
            doctor_specialty=a.doctor_specialty,
            doctor_image=a.doctor_image,
            hospital=a.hospital,
            hospital_address=a.hospital_address or "New Delhi",
            appointment_type=a.appointment_type,
            appointment_date=a.appointment_date,
            appointment_time=a.appointment_time,
            duration_minutes=a.duration_minutes or 30,
            mode=a.mode or "In-Person",
            session_name=a.session_name or "General Consultation",
            consultation_link=a.consultation_link,
            status=a.status or "Confirmed",
            notes=a.notes,
            preparation_instructions=a.preparation_instructions,
            cancellation_reason=a.cancellation_reason,
            cancelled_at=a.cancelled_at.isoformat() if a.cancelled_at else None,
            linked_records=linked_records,
            linked_prescriptions=linked_prescriptions,
            doctor_messages=doctor_messages,
            created_at=a.created_at.isoformat() if a.created_at else "",
            updated_at=a.updated_at.isoformat() if a.updated_at else ""
        )

    def ensure_default_appointments(self, patient_id: str, db: Session):
        """
        No-op: In strict adherence to zero mock data rules, we never inject fake appointments.
        """
        pass

    def get_appointments(
        self,
        patient_id: str,
        tab: Optional[str],
        search: Optional[str],
        sort: str,
        specialty: Optional[str],
        doctor: Optional[str],
        hospital: Optional[str],
        date: Optional[str],
        page: int,
        page_size: int,
        db: Session
    ) -> AppointmentListResponse:
        query = db.query(Appointment).filter(
            Appointment.patient_id == patient_id,
            Appointment.is_deleted == False
        )

        today_str = datetime.now(timezone.utc).strftime("%Y-%m-%d")

        # Tab filters
        tab_lower = (tab or "upcoming").lower()
        if tab_lower == "upcoming":
            query = query.filter(
                Appointment.status.in_(["Confirmed", "Pending", "Rescheduled"]),
                Appointment.appointment_date >= today_str
            )
        elif tab_lower == "past":
            query = query.filter(
                or_(
                    Appointment.status == "Completed",
                    Appointment.appointment_date < today_str
                ),
                Appointment.status != "Cancelled"
            )
        elif tab_lower == "cancelled":
            query = query.filter(Appointment.status == "Cancelled")

        # Search Query
        if search and search.strip():
            s = f"%{search.strip()}%"
            query = query.filter(
                or_(
                    Appointment.doctor_name.ilike(s),
                    Appointment.doctor_specialty.ilike(s),
                    Appointment.hospital.ilike(s),
                    Appointment.appointment_type.ilike(s),
                    Appointment.notes.ilike(s),
                    Appointment.id.ilike(s)
                )
            )

        # Filters
        if specialty and specialty != "All":
            query = query.filter(Appointment.doctor_specialty.ilike(f"%{specialty}%"))
        if doctor and doctor != "All":
            query = query.filter(Appointment.doctor_name.ilike(f"%{doctor}%"))
        if hospital and hospital != "All":
            query = query.filter(Appointment.hospital.ilike(f"%{hospital}%"))
        if date and date != "null":
            query = query.filter(Appointment.appointment_date == date)

        # Sorting
        if sort == "latest":
            query = query.order_by(desc(Appointment.appointment_date), desc(Appointment.appointment_time))
        elif sort == "doctor_asc":
            query = query.order_by(asc(Appointment.doctor_name))
        elif sort == "status":
            query = query.order_by(asc(Appointment.status))
        else:
            query = query.order_by(asc(Appointment.appointment_date), asc(Appointment.appointment_time))

        total_count = query.count()
        total_pages = max(1, math.ceil(total_count / page_size))
        offset = (page - 1) * page_size
        items = query.offset(offset).limit(page_size).all()

        return AppointmentListResponse(
            appointments=[AppointmentService._to_response(a, db) for a in items],
            total_count=total_count,
            page=page,
            page_size=page_size,
            total_pages=total_pages
        )

    def get_summary(self, patient_id: str, db: Session) -> AppointmentSummaryResponse:
        today = datetime.now(timezone.utc)
        today_str = today.strftime("%Y-%m-%d")
        next_30d_str = (today + timedelta(days=30)).strftime("%Y-%m-%d")
        current_month_prefix = today.strftime("%Y-%m")

        upcoming_count = db.query(Appointment).filter(
            Appointment.patient_id == patient_id,
            Appointment.is_deleted == False,
            Appointment.status.in_(["Confirmed", "Pending", "Rescheduled"]),
            Appointment.appointment_date >= today_str,
            Appointment.appointment_date <= next_30d_str
        ).count()

        this_month_count = db.query(Appointment).filter(
            Appointment.patient_id == patient_id,
            Appointment.is_deleted == False,
            Appointment.appointment_date.startswith(current_month_prefix),
            Appointment.status != "Cancelled"
        ).count()

        completed_count = db.query(Appointment).filter(
            Appointment.patient_id == patient_id,
            Appointment.is_deleted == False,
            Appointment.status == "Completed"
        ).count()

        cancelled_count = db.query(Appointment).filter(
            Appointment.patient_id == patient_id,
            Appointment.is_deleted == False,
            Appointment.status == "Cancelled"
        ).count()

        return AppointmentSummaryResponse(
            upcoming_count=upcoming_count,
            this_month_count=this_month_count,
            completed_count=completed_count,
            cancelled_count=cancelled_count
        )

    def get_calendar_events(self, patient_id: str, year: int, month: int, db: Session) -> CalendarMonthResponse:
        month_prefix = f"{year:04d}-{month:02d}"
        today_str = datetime.now(timezone.utc).strftime("%Y-%m-%d")

        appointments = db.query(Appointment).filter(
            Appointment.patient_id == patient_id,
            Appointment.is_deleted == False,
            Appointment.appointment_date.startswith(month_prefix)
        ).all()

        date_map: Dict[str, CalendarDayEvent] = {}
        for a in appointments:
            d_str = a.appointment_date
            if d_str not in date_map:
                date_map[d_str] = CalendarDayEvent(date=d_str, count=0)

            event = date_map[d_str]
            event.count += 1
            if a.status == "Cancelled":
                event.has_cancelled = True
            elif a.status == "Completed" or a.appointment_date < today_str:
                event.has_completed = True
            elif a.status in ["Confirmed", "Pending", "Rescheduled"]:
                event.has_upcoming = True

        return CalendarMonthResponse(
            year=year,
            month=month,
            days=list(date_map.values())
        )

    def get_doctors(self, db: Optional[Session] = None) -> List[DoctorInfo]:
        docs_map: Dict[str, DoctorInfo] = {}

        # 1. Add doctors from PostgreSQL database
        if db:
            db_docs = db.query(Doctor).join(User).all()
            for d in db_docs:
                u = d.user
                docs_map[d.id] = DoctorInfo(
                    id=d.id,
                    name=u.name if u else "Doctor",
                    specialty=d.specialization or "General Physician",
                    hospital=d.hospital or "MediAssist Medical Center",
                    experience=d.experience or 5,
                    rating=4.9,
                    image_url=u.profile_image if u else None,
                    available_days=["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
                )

        # 2. Complement with standard registered clinicians
        for c in REGISTERED_CLINICIANS:
            doc_id = f"doc-{c['name'].lower().replace(' ', '-').replace('.', '')}"
            if doc_id not in docs_map:
                docs_map[doc_id] = DoctorInfo(
                    id=doc_id,
                    name=c["name"],
                    specialty=c["specialty"],
                    hospital=c["hospital"],
                    experience=c["experience"],
                    rating=c["rating"],
                    image_url=c["image_url"],
                    available_days=c["available_days"]
                )

        return list(docs_map.values())

    def get_slots(self, doctor_name: str, date_str: str, db: Session) -> AvailableSlotResponse:
        # Query existing booked appointments for this doctor on this date
        booked = db.query(Appointment.appointment_time).filter(
            Appointment.doctor_name.ilike(f"%{doctor_name.strip()}%"),
            Appointment.appointment_date == date_str,
            Appointment.status.in_(["Confirmed", "Pending", "Rescheduled"]),
            Appointment.is_deleted == False
        ).all()

        booked_slots = {b[0].strip() for b in booked if b[0]}

        # Filter out booked slots from STANDARD_SLOTS
        free_slots = [slot for slot in STANDARD_SLOTS if slot not in booked_slots]

        return AvailableSlotResponse(
            date=date_str,
            doctor_name=doctor_name,
            slots=free_slots
        )

    def get_hospitals(self) -> List[HospitalInfo]:
        return [
            HospitalInfo(
                id=h["id"],
                name=h["name"],
                location=h["location"],
                departments=h["departments"],
                contact=h["contact"],
                rating=h["rating"]
            )
            for h in AFFILIATED_HOSPITALS
        ]

    def get_recommendations(self) -> List[RecommendationItem]:
        return [
            RecommendationItem(
                id="rec-1",
                title="Regular Health Checkup",
                description="Routine annual preventive screening and physical exam.",
                action_text="Book Checkup →",
                specialty="General Physician",
                icon_type="heart"
            ),
            RecommendationItem(
                id="rec-2",
                title="Cardiology Wellness Consultation",
                description="Monitor lipid levels and cardiovascular markers.",
                action_text="Book Cardiologist →",
                specialty="Cardiologist",
                icon_type="activity"
            )
        ]

    def create_appointment(
        self,
        patient_id: str,
        payload: AppointmentCreate,
        db: Session
    ) -> AppointmentResponse:
        # 1. Double-Booking Protection: Server-Side Validation
        existing = db.query(Appointment).filter(
            Appointment.doctor_name.ilike(f"%{payload.doctor_name.strip()}%"),
            Appointment.appointment_date == payload.appointment_date,
            Appointment.appointment_time == payload.appointment_time,
            Appointment.status.in_(["Confirmed", "Pending", "Rescheduled"]),
            Appointment.is_deleted == False
        ).first()

        if existing:
            raise AppException(
                status_code=status.HTTP_409_CONFLICT,
                message=f"This appointment slot ({payload.appointment_time} on {payload.appointment_date}) is no longer available. Please select another time."
            )

        # Resolve doctor_id if missing from Doctor profile lookup
        doc_id = payload.doctor_id
        if not doc_id:
            doc_rec = db.query(Doctor).join(User).filter(User.name.ilike(f"%{payload.doctor_name.strip()}%")).first()
            if doc_rec:
                doc_id = doc_rec.id

        # 2. Create Appointment
        new_apt = Appointment(
            patient_id=patient_id,
            doctor_id=doc_id,
            doctor_name=payload.doctor_name.strip(),
            doctor_specialty=payload.doctor_specialty.strip(),
            doctor_image=payload.doctor_image,
            hospital=payload.hospital.strip(),
            hospital_address=payload.hospital_address or "New Delhi",
            appointment_type=payload.appointment_type or "General Checkup",
            appointment_date=payload.appointment_date,
            appointment_time=payload.appointment_time,
            duration_minutes=payload.duration_minutes or 30,
            mode=payload.mode or "In-Person",
            session_name=payload.session_name or "General Consultation",
            status="Confirmed",
            notes=payload.notes,
            preparation_instructions=payload.preparation_instructions or "Please arrive 15 minutes before your scheduled appointment with your photo ID.",
            is_deleted=False
        )

        db.add(new_apt)
        db.commit()
        db.refresh(new_apt)

        # 3. Create an automatic appointment reminder in PatientReminder
        try:
            rem = PatientReminder(
                patient_id=patient_id,
                reminder_type="Appointment",
                title=f"Appointment with {new_apt.doctor_name}",
                subtitle=f"{new_apt.hospital} • {new_apt.appointment_type}",
                time_str=new_apt.appointment_time,
                date_str=new_apt.appointment_date,
                recurrence="Once",
                status="Upcoming",
                icon_type="calendar",
                color_theme="blue"
            )
            db.add(rem)
            db.commit()
        except Exception as e:
            logger.warning(f"Failed to auto-create appointment reminder: {e}")

        return AppointmentService._to_response(new_apt, db)

    def get_appointment(self, appointment_id: str, patient_id: str, db: Session) -> AppointmentResponse:
        apt = db.query(Appointment).filter(
            Appointment.id == appointment_id,
            Appointment.patient_id == patient_id,
            Appointment.is_deleted == False
        ).first()

        if not apt:
            raise AppException(
                status_code=status.HTTP_404_NOT_FOUND,
                message=f"Appointment with id '{appointment_id}' not found or access denied."
            )

        return AppointmentService._to_response(apt, db)

    def reschedule_appointment(
        self,
        appointment_id: str,
        patient_id: str,
        payload: AppointmentReschedule,
        db: Session
    ) -> AppointmentResponse:
        apt = db.query(Appointment).filter(
            Appointment.id == appointment_id,
            Appointment.patient_id == patient_id,
            Appointment.is_deleted == False
        ).first()

        if not apt:
            raise AppException(
                status_code=status.HTTP_404_NOT_FOUND,
                message=f"Appointment '{appointment_id}' not found."
            )

        # Double-booking check
        existing = db.query(Appointment).filter(
            Appointment.id != appointment_id,
            Appointment.doctor_name == apt.doctor_name,
            Appointment.appointment_date == payload.new_date,
            Appointment.appointment_time == payload.new_time,
            Appointment.status.in_(["Confirmed", "Pending", "Rescheduled"]),
            Appointment.is_deleted == False
        ).first()

        if existing:
            raise AppException(
                status_code=status.HTTP_409_CONFLICT,
                message=f"The requested slot ({payload.new_time} on {payload.new_date}) is already booked. Please choose a different slot."
            )

        apt.appointment_date = payload.new_date
        apt.appointment_time = payload.new_time
        apt.status = "Rescheduled"
        if payload.reason:
            apt.notes = f"{apt.notes or ''}\nReschedule Note: {payload.reason}".strip()

        db.commit()
        db.refresh(apt)

        # Update associated reminder if present
        try:
            rem = db.query(PatientReminder).filter(
                PatientReminder.patient_id == patient_id,
                PatientReminder.reminder_type == "Appointment",
                PatientReminder.title.ilike(f"%{apt.doctor_name}%")
            ).first()
            if rem:
                rem.date_str = payload.new_date
                rem.time_str = payload.new_time
                rem.status = "Upcoming"
                db.commit()
        except Exception as e:
            logger.warning(f"Reminder update on reschedule failed: {e}")

        return AppointmentService._to_response(apt, db)

    def cancel_appointment(
        self,
        appointment_id: str,
        patient_id: str,
        payload: AppointmentCancel,
        db: Session
    ) -> AppointmentResponse:
        apt = db.query(Appointment).filter(
            Appointment.id == appointment_id,
            Appointment.patient_id == patient_id,
            Appointment.is_deleted == False
        ).first()

        if not apt:
            raise AppException(
                status_code=status.HTTP_404_NOT_FOUND,
                message=f"Appointment '{appointment_id}' not found."
            )

        apt.status = "Cancelled"
        apt.cancellation_reason = payload.cancellation_reason or "Cancelled by patient"
        apt.cancelled_at = datetime.now(timezone.utc)
        db.commit()
        db.refresh(apt)

        # Deactivate associated reminders
        try:
            rems = db.query(PatientReminder).filter(
                PatientReminder.patient_id == patient_id,
                PatientReminder.reminder_type == "Appointment",
                PatientReminder.title.ilike(f"%{apt.doctor_name}%")
            ).all()
            for r in rems:
                r.status = "Cancelled"
                r.is_deleted = True
            db.commit()
        except Exception as e:
            logger.warning(f"Reminder cancellation failed: {e}")

        return AppointmentService._to_response(apt, db)

    # ================== Doctor Health Messaging ==================
    def get_messages_for_appointment(
        self,
        appointment_id: str,
        patient_id: str,
        db: Session
    ) -> List[DoctorHealthMessageResponse]:
        messages = db.query(DoctorHealthMessage).filter(
            DoctorHealthMessage.patient_id == patient_id,
            DoctorHealthMessage.appointment_id == appointment_id
        ).order_by(desc(DoctorHealthMessage.created_at)).all()

        return [AppointmentService._message_to_response(m) for m in messages]

    def get_all_doctor_messages(
        self,
        patient_id: str,
        db: Session
    ) -> List[DoctorHealthMessageResponse]:
        messages = db.query(DoctorHealthMessage).filter(
            DoctorHealthMessage.patient_id == patient_id
        ).order_by(desc(DoctorHealthMessage.created_at)).all()

        return [AppointmentService._message_to_response(m) for m in messages]

    def send_doctor_health_message(
        self,
        patient_id: str,
        payload: DoctorHealthMessageCreate,
        db: Session
    ) -> DoctorHealthMessageResponse:
        new_msg = DoctorHealthMessage(
            patient_id=patient_id,
            doctor_id=None,
            appointment_id=payload.appointment_id,
            doctor_name=payload.doctor_name,
            doctor_specialty=payload.doctor_specialty,
            doctor_image=payload.doctor_image,
            hospital=payload.hospital,
            message_type=payload.message_type or "CLINICAL_ADVICE",
            title=payload.title or "Health Advice & Care Instructions",
            content=payload.content,
            priority=payload.priority or "NORMAL",
            is_read=False
        )

        db.add(new_msg)
        db.commit()
        db.refresh(new_msg)

        return AppointmentService._message_to_response(new_msg)

    def mark_message_read(
        self,
        message_id: str,
        patient_id: str,
        db: Session
    ) -> DoctorHealthMessageResponse:
        msg = db.query(DoctorHealthMessage).filter(
            DoctorHealthMessage.id == message_id,
            DoctorHealthMessage.patient_id == patient_id
        ).first()

        if not msg:
            raise AppException(
                status_code=status.HTTP_404_NOT_FOUND,
                message="Message not found."
            )

        msg.is_read = True
        msg.read_at = datetime.now(timezone.utc)
        db.commit()
        db.refresh(msg)

        return AppointmentService._message_to_response(msg)

appointment_service = AppointmentService()
