from sqlalchemy.orm import Session
from sqlalchemy import func, or_, and_, desc, asc
from typing import Optional, List, Dict, Any, Set
from datetime import datetime, timezone, timedelta
import uuid
import logging

from app.models.reminder import PatientReminder, ReminderHistoryLog
from app.models.appointment import Appointment
from app.models.prescription import Prescription
from app.schemas.reminder import (
    ReminderResponse,
    ReminderListGroupedResponse,
    ReminderSummaryResponse,
    ReminderCalendarMonthResponse,
    ReminderCalendarDay,
    ReminderHistoryListResponse,
    ReminderHistoryItemResponse,
    ReminderCreateRequest,
    ReminderUpdateRequest,
    ReminderSnoozeRequest,
)
from app.utils.exceptions import AppException
from fastapi import status

logger = logging.getLogger(__name__)

class ReminderService:
    @staticmethod
    def ensure_default_patient_reminders(patient_id: str, db: Session):
        """
        No-op: In strict compliance with zero-mock rules, we never inject fake demo reminders.
        """
        pass

    @staticmethod
    def sync_reminders_from_entities(patient_id: str, db: Session):
        """
        Intelligently ensures that existing real appointments and active prescriptions
        have corresponding linked reminders in PostgreSQL.
        """
        try:
            today_str = datetime.now(timezone.utc).strftime("%Y-%m-%d")

            # 1. Sync from Appointments
            appointments = db.query(Appointment).filter(
                Appointment.patient_id == patient_id,
                Appointment.status.in_(["Confirmed", "Pending", "Rescheduled"]),
                Appointment.appointment_date >= today_str,
                Appointment.is_deleted == False
            ).all()

            for apt in appointments:
                existing = db.query(PatientReminder).filter(
                    PatientReminder.patient_id == patient_id,
                    or_(
                        PatientReminder.appointment_id == apt.id,
                        and_(
                            PatientReminder.reminder_type == "Appointment",
                            PatientReminder.title.ilike(f"%{apt.doctor_name}%"),
                            PatientReminder.date_str == apt.appointment_date
                        )
                    ),
                    PatientReminder.is_deleted == False
                ).first()

                if not existing:
                    new_rem = PatientReminder(
                        id=str(uuid.uuid4()),
                        patient_id=patient_id,
                        appointment_id=apt.id,
                        reminder_type="Appointment",
                        title=f"Appointment with {apt.doctor_name}",
                        subtitle=f"{apt.hospital} • {apt.appointment_type}",
                        time_str=apt.appointment_time,
                        date_str=apt.appointment_date,
                        recurrence="Once",
                        priority="High",
                        status="Upcoming",
                        is_completed=False,
                        icon_type="calendar",
                        color_theme="blue"
                    )
                    db.add(new_rem)

            # 2. Sync from Prescriptions
            prescriptions = db.query(Prescription).filter(
                Prescription.patient_id == patient_id,
                Prescription.status == "Active",
                Prescription.is_deleted == False
            ).all()

            for presc in prescriptions:
                existing = db.query(PatientReminder).filter(
                    PatientReminder.patient_id == patient_id,
                    or_(
                        PatientReminder.prescription_id == presc.id,
                        and_(
                            PatientReminder.reminder_type == "Medication",
                            PatientReminder.title.ilike(f"%{presc.medication_name}%")
                        )
                    ),
                    PatientReminder.is_deleted == False
                ).first()

                if not existing:
                    new_rem = PatientReminder(
                        id=str(uuid.uuid4()),
                        patient_id=patient_id,
                        prescription_id=presc.id,
                        reminder_type="Medication",
                        title=f"{presc.medication_name} {presc.dosage or ''}".strip(),
                        subtitle=f"{presc.frequency or 'Daily'} • {presc.instructions or 'As directed'}",
                        time_str="08:00 AM",
                        date_str=None,
                        recurrence="Daily",
                        priority="Normal",
                        status="Upcoming",
                        is_completed=False,
                        icon_type="pill",
                        color_theme="purple"
                    )
                    db.add(new_rem)

            db.commit()
        except Exception as e:
            logger.warning(f"Entity reminder synchronization note: {e}")

    @staticmethod
    def _to_response(r: PatientReminder) -> ReminderResponse:
        return ReminderResponse(
            id=r.id,
            patient_id=r.patient_id,
            appointment_id=r.appointment_id,
            prescription_id=r.prescription_id,
            reminder_type=r.reminder_type,
            title=r.title,
            subtitle=r.subtitle,
            notes=r.notes,
            priority=r.priority or "Normal",
            notification_preference=r.notification_preference or "IN_APP",
            time_str=r.time_str,
            date_str=r.date_str,
            recurrence=r.recurrence or "Daily",
            status=r.status or "Upcoming",
            is_completed=bool(r.is_completed),
            completed_at=r.completed_at,
            snoozed_until=r.snoozed_until,
            icon_type=r.icon_type or "bell",
            color_theme=r.color_theme or "teal",
            created_at=r.created_at,
            updated_at=r.updated_at
        )

    def get_grouped_reminders(
        self,
        patient_id: str,
        db: Session,
        tab: Optional[str] = "All",
        search: Optional[str] = None,
        date_str: Optional[str] = None
    ) -> ReminderListGroupedResponse:
        # Sync from real appointments/prescriptions first
        self.sync_reminders_from_entities(patient_id, db)

        today_date = datetime.now(timezone.utc).strftime("%Y-%m-%d")

        query = db.query(PatientReminder).filter(
            PatientReminder.patient_id == patient_id,
            PatientReminder.is_deleted == False,
            PatientReminder.status != "Cancelled"
        )

        # Tab filters
        tab_clean = (tab or "All").lower()
        if "medication" in tab_clean:
            query = query.filter(PatientReminder.reminder_type.ilike("%Medication%"))
        elif "appointment" in tab_clean:
            query = query.filter(PatientReminder.reminder_type.ilike("%Appointment%"))
        elif "task" in tab_clean or "health" in tab_clean:
            query = query.filter(PatientReminder.reminder_type.ilike("%Health Task%"))
        elif "custom" in tab_clean:
            query = query.filter(PatientReminder.reminder_type.ilike("%Custom%"))

        # Date filter
        if date_str and date_str != "null":
            query = query.filter(
                or_(
                    PatientReminder.date_str == date_str,
                    and_(PatientReminder.recurrence == "Daily", PatientReminder.date_str.is_(None))
                )
            )

        # Search Query
        if search and search.strip():
            s = f"%{search.strip()}%"
            query = query.filter(
                or_(
                    PatientReminder.title.ilike(s),
                    PatientReminder.subtitle.ilike(s),
                    PatientReminder.notes.ilike(s),
                    PatientReminder.reminder_type.ilike(s)
                )
            )

        all_reminders = query.order_by(
            asc(PatientReminder.is_completed),
            asc(PatientReminder.time_str)
        ).all()

        today_list: List[ReminderResponse] = []
        upcoming_list: List[ReminderResponse] = []

        for r in all_reminders:
            resp = ReminderService._to_response(r)
            # If reminder has no specific date (daily repeating) or date matches today
            if r.date_str is None or r.date_str == today_date or r.recurrence == "Daily":
                today_list.append(resp)
            elif r.date_str > today_date:
                upcoming_list.append(resp)
            else:
                # Past dates
                today_list.append(resp)

        return ReminderListGroupedResponse(
            today_reminders=today_list,
            upcoming_reminders=upcoming_list,
            today_count=len(today_list),
            upcoming_count=len(upcoming_list),
            total_count=len(all_reminders)
        )

    def get_summary(self, patient_id: str, db: Session) -> ReminderSummaryResponse:
        self.sync_reminders_from_entities(patient_id, db)

        base_q = db.query(PatientReminder).filter(
            PatientReminder.patient_id == patient_id,
            PatientReminder.is_deleted == False,
            PatientReminder.status != "Cancelled"
        )

        all_active = base_q.filter(PatientReminder.is_completed == False).count()
        meds_active = base_q.filter(
            PatientReminder.reminder_type.ilike("%Medication%"),
            PatientReminder.is_completed == False
        ).count()
        appts_upcoming = base_q.filter(
            PatientReminder.reminder_type.ilike("%Appointment%"),
            PatientReminder.is_completed == False
        ).count()
        tasks_active = base_q.filter(
            PatientReminder.reminder_type.ilike("%Health Task%"),
            PatientReminder.is_completed == False
        ).count()

        current_month_prefix = datetime.now(timezone.utc).strftime("%Y-%m")
        completed_month = db.query(ReminderHistoryLog).filter(
            ReminderHistoryLog.patient_id == patient_id,
            ReminderHistoryLog.action.in_(["Completed", "Taken"])
        ).count()

        return ReminderSummaryResponse(
            all_active_count=all_active,
            medications_active_count=meds_active,
            appointments_upcoming_count=appts_upcoming,
            health_tasks_active_count=tasks_active,
            completed_this_month_count=completed_month
        )

    def get_calendar_events(self, patient_id: str, year: int, month: int, db: Session) -> ReminderCalendarMonthResponse:
        self.sync_reminders_from_entities(patient_id, db)

        month_prefix = f"{year:04d}-{month:02d}"
        reminders = db.query(PatientReminder).filter(
            PatientReminder.patient_id == patient_id,
            PatientReminder.is_deleted == False,
            PatientReminder.status != "Cancelled"
        ).all()

        date_map: Dict[str, ReminderCalendarDay] = {}

        for r in reminders:
            d_str = r.date_str
            if not d_str:
                # Daily reminder applies to all days in month
                continue

            if not d_str.startswith(month_prefix):
                continue

            if d_str not in date_map:
                date_map[d_str] = ReminderCalendarDay(date=d_str, total_count=0)

            day = date_map[d_str]
            day.total_count += 1
            t_type = r.reminder_type.lower()
            if "medication" in t_type:
                day.has_medication = True
            elif "appointment" in t_type:
                day.has_appointment = True
            elif "task" in t_type or "health" in t_type:
                day.has_task = True

            if r.is_completed:
                day.has_completed = True

        return ReminderCalendarMonthResponse(
            year=year,
            month=month,
            days=list(date_map.values())
        )

    def create_reminder(self, patient_id: str, payload: ReminderCreateRequest, db: Session) -> ReminderResponse:
        # Default icon & color theme based on reminder type
        r_type = payload.reminder_type or "Custom"
        icon = payload.icon_type
        color = payload.color_theme

        if not icon:
            if "medication" in r_type.lower():
                icon = "pill"
                color = color or "purple"
            elif "appointment" in r_type.lower():
                icon = "calendar"
                color = color or "blue"
            elif "health" in r_type.lower() or "task" in r_type.lower():
                icon = "activity"
                color = color or "teal"
            else:
                icon = "bell"
                color = color or "teal"

        new_rem = PatientReminder(
            id=str(uuid.uuid4()),
            patient_id=patient_id,
            appointment_id=payload.appointment_id,
            prescription_id=payload.prescription_id,
            reminder_type=r_type,
            title=payload.title.strip(),
            subtitle=payload.subtitle.strip() if payload.subtitle else None,
            notes=payload.notes.strip() if payload.notes else None,
            priority=payload.priority or "Normal",
            notification_preference=payload.notification_preference or "IN_APP",
            time_str=payload.time_str.strip(),
            date_str=payload.date_str.strip() if payload.date_str else None,
            recurrence=payload.recurrence or "Daily",
            status="Upcoming",
            is_completed=False,
            icon_type=icon,
            color_theme=color or "teal"
        )

        db.add(new_rem)
        db.commit()
        db.refresh(new_rem)

        return ReminderService._to_response(new_rem)

    def update_reminder(self, reminder_id: str, patient_id: str, payload: ReminderUpdateRequest, db: Session) -> ReminderResponse:
        rem = db.query(PatientReminder).filter(
            PatientReminder.id == reminder_id,
            PatientReminder.patient_id == patient_id,
            PatientReminder.is_deleted == False
        ).first()

        if not rem:
            raise AppException(status_code=status.HTTP_404_NOT_FOUND, message="Reminder not found.")

        if payload.title is not None:
            rem.title = payload.title.strip()
        if payload.subtitle is not None:
            rem.subtitle = payload.subtitle.strip()
        if payload.notes is not None:
            rem.notes = payload.notes.strip()
        if payload.priority is not None:
            rem.priority = payload.priority
        if payload.notification_preference is not None:
            rem.notification_preference = payload.notification_preference
        if payload.time_str is not None:
            rem.time_str = payload.time_str.strip()
        if payload.date_str is not None:
            rem.date_str = payload.date_str.strip()
        if payload.recurrence is not None:
            rem.recurrence = payload.recurrence
        if payload.status is not None:
            rem.status = payload.status
        if payload.is_completed is not None:
            rem.is_completed = payload.is_completed
            if payload.is_completed:
                rem.completed_at = datetime.now(timezone.utc)
                rem.status = "Completed"
        if payload.icon_type is not None:
            rem.icon_type = payload.icon_type
        if payload.color_theme is not None:
            rem.color_theme = payload.color_theme

        db.commit()
        db.refresh(rem)

        return ReminderService._to_response(rem)

    def mark_completed(self, reminder_id: str, patient_id: str, db: Session) -> ReminderResponse:
        rem = db.query(PatientReminder).filter(
            PatientReminder.id == reminder_id,
            PatientReminder.patient_id == patient_id,
            PatientReminder.is_deleted == False
        ).first()

        if not rem:
            raise AppException(status_code=status.HTTP_404_NOT_FOUND, message="Reminder not found.")

        rem.is_completed = True
        rem.status = "Completed"
        rem.completed_at = datetime.now(timezone.utc)

        # Log action in history
        log_entry = ReminderHistoryLog(
            id=str(uuid.uuid4()),
            patient_id=patient_id,
            reminder_id=rem.id,
            reminder_title=rem.title,
            reminder_type=rem.reminder_type,
            action="Completed",
            scheduled_time=rem.time_str
        )
        db.add(log_entry)
        db.commit()
        db.refresh(rem)

        return ReminderService._to_response(rem)

    def snooze_reminder(self, reminder_id: str, patient_id: str, payload: ReminderSnoozeRequest, db: Session) -> ReminderResponse:
        rem = db.query(PatientReminder).filter(
            PatientReminder.id == reminder_id,
            PatientReminder.patient_id == patient_id,
            PatientReminder.is_deleted == False
        ).first()

        if not rem:
            raise AppException(status_code=status.HTTP_404_NOT_FOUND, message="Reminder not found.")

        rem.status = "Snoozed"
        rem.snoozed_until = datetime.now(timezone.utc) + timedelta(minutes=payload.snooze_minutes)

        log_entry = ReminderHistoryLog(
            id=str(uuid.uuid4()),
            patient_id=patient_id,
            reminder_id=rem.id,
            reminder_title=rem.title,
            reminder_type=rem.reminder_type,
            action="Snoozed",
            scheduled_time=rem.time_str
        )
        db.add(log_entry)
        db.commit()
        db.refresh(rem)

        return ReminderService._to_response(rem)

    def dismiss_reminder(self, reminder_id: str, patient_id: str, db: Session) -> ReminderResponse:
        rem = db.query(PatientReminder).filter(
            PatientReminder.id == reminder_id,
            PatientReminder.patient_id == patient_id,
            PatientReminder.is_deleted == False
        ).first()

        if not rem:
            raise AppException(status_code=status.HTTP_404_NOT_FOUND, message="Reminder not found.")

        rem.status = "Dismissed"

        log_entry = ReminderHistoryLog(
            id=str(uuid.uuid4()),
            patient_id=patient_id,
            reminder_id=rem.id,
            reminder_title=rem.title,
            reminder_type=rem.reminder_type,
            action="Dismissed",
            scheduled_time=rem.time_str
        )
        db.add(log_entry)
        db.commit()
        db.refresh(rem)

        return ReminderService._to_response(rem)

    def mark_all_today_completed(self, patient_id: str, db: Session) -> Dict[str, Any]:
        today_date = datetime.now(timezone.utc).strftime("%Y-%m-%d")

        reminders = db.query(PatientReminder).filter(
            PatientReminder.patient_id == patient_id,
            PatientReminder.is_deleted == False,
            PatientReminder.is_completed == False,
            PatientReminder.status != "Cancelled",
            or_(
                PatientReminder.date_str == today_date,
                PatientReminder.date_str.is_(None),
                PatientReminder.recurrence == "Daily"
            )
        ).all()

        updated_count = 0
        now = datetime.now(timezone.utc)
        for r in reminders:
            r.is_completed = True
            r.status = "Completed"
            r.completed_at = now
            log_entry = ReminderHistoryLog(
                id=str(uuid.uuid4()),
                patient_id=patient_id,
                reminder_id=r.id,
                reminder_title=r.title,
                reminder_type=r.reminder_type,
                action="Completed",
                scheduled_time=r.time_str
            )
            db.add(log_entry)
            updated_count += 1

        db.commit()
        return {"status": "success", "updated_count": updated_count}

    def delete_reminder(self, reminder_id: str, patient_id: str, db: Session):
        rem = db.query(PatientReminder).filter(
            PatientReminder.id == reminder_id,
            PatientReminder.patient_id == patient_id,
            PatientReminder.is_deleted == False
        ).first()

        if not rem:
            raise AppException(status_code=status.HTTP_404_NOT_FOUND, message="Reminder not found.")

        rem.is_deleted = True
        rem.deleted_at = datetime.now(timezone.utc)
        db.commit()

    def get_history(self, patient_id: str, action: Optional[str], db: Session, limit: int = 50) -> ReminderHistoryListResponse:
        query = db.query(ReminderHistoryLog).filter(ReminderHistoryLog.patient_id == patient_id)
        if action and action not in ["All", "null"]:
            query = query.filter(ReminderHistoryLog.action.ilike(f"%{action.strip()}%"))

        total_count = query.count()
        logs = query.order_by(desc(ReminderHistoryLog.logged_at)).limit(limit).all()

        return ReminderHistoryListResponse(
            logs=[
                ReminderHistoryItemResponse(
                    id=l.id,
                    reminder_id=l.reminder_id,
                    reminder_title=l.reminder_title,
                    reminder_type=l.reminder_type,
                    action=l.action,
                    scheduled_time=l.scheduled_time,
                    logged_at=l.logged_at
                )
                for l in logs
            ],
            total_count=total_count
        )

reminder_service = ReminderService()
