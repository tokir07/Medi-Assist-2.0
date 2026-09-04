import os
import json
import math
import uuid
from datetime import datetime, timezone
from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import or_, desc, asc

from app.models.prescription import Prescription, MedicationReminder
from app.models.appointment import Appointment
from app.models.medical_record import MedicalRecord
from app.models.reminder import PatientReminder
from app.schemas.prescription import (
    PrescriptionResponse,
    PrescriptionSummaryResponse,
    PrescriptionListResponse,
    PrescriptionMedicationItem,
    PrescriptionCreate,
    PrescriptionEditRequest,
    DuplicateCheckRequest,
    DuplicateCheckResponse,
    MedicationReminderResponse,
    MedicationReminderCreate,
    RefillRequestPayload,
    RequestPrescriptionPayload
)
from app.utils.exceptions import AppException
from fastapi import status, UploadFile
from app.core.logging_config import get_logger
import logging

logger = get_logger("PRESCRIPTION_SERVICE")

ALLOWED_EXTENSIONS = {'.pdf', '.jpg', '.jpeg', '.png', '.webp'}
MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024

class PrescriptionService:
    @staticmethod
    def _parse_medications(p: Prescription) -> List[PrescriptionMedicationItem]:
        meds: List[PrescriptionMedicationItem] = []
        if p.medications_data:
            try:
                raw_list = json.loads(p.medications_data) if isinstance(p.medications_data, str) else p.medications_data
                if isinstance(raw_list, list):
                    for item in raw_list:
                        if isinstance(item, dict) and item.get("medication_name"):
                            meds.append(PrescriptionMedicationItem(
                                id=item.get("id") or str(uuid.uuid4())[:8],
                                medication_name=item.get("medication_name"),
                                generic_name=item.get("generic_name"),
                                brand_name=item.get("brand_name"),
                                dosage=item.get("dosage") or "1 tablet",
                                dosage_unit=item.get("dosage_unit"),
                                frequency=item.get("frequency") or "Twice daily",
                                route=item.get("route") or "Oral",
                                duration=item.get("duration") or "7 days",
                                duration_unit=item.get("duration_unit"),
                                instructions=item.get("instructions") or "Take after meals with water.",
                                quantity=item.get("quantity"),
                                refills=item.get("refills") or 0,
                                notes=item.get("notes")
                            ))
            except Exception as e:
                logger.warning(f"Failed to parse medications_data JSON for prescription {p.id}: {e}")

        # Fallback to single primary medication if medications_data is empty
        if not meds and p.medication_name:
            meds.append(PrescriptionMedicationItem(
                id="med-1",
                medication_name=p.medication_name,
                generic_name=p.generic_name,
                dosage=p.dosage or "1 tablet",
                frequency=p.frequency or "Twice daily",
                duration=p.duration or "7 days",
                instructions=p.instructions or "Take after meals with water."
            ))

        return meds

    @staticmethod
    def _to_response(p: Prescription, db: Optional[Session] = None) -> PrescriptionResponse:
        meds = PrescriptionService._parse_medications(p)

        # Resolve Appointment Details if linked
        app_title = None
        app_date = None
        if p.appointment_id and db:
            app = db.query(Appointment).filter(Appointment.id == p.appointment_id).first()
            if app:
                app_title = f"{app.appointment_type} with {app.doctor_name}"
                app_date = f"{app.appointment_date} • {app.appointment_time}"

        # Resolve Source Record Details if linked
        rec_title = None
        if p.record_id and db:
            rec = db.query(MedicalRecord).filter(MedicalRecord.id == p.record_id).first()
            if rec:
                rec_title = rec.title

        return PrescriptionResponse(
            id=p.id,
            patient_id=p.patient_id,
            record_id=p.record_id,
            appointment_id=p.appointment_id,
            appointment_title=app_title,
            appointment_date=app_date,
            title=p.title or f"Prescription - {p.doctor_name or 'Medical Center'}",
            session_name=p.session_name or "General Records",
            diagnosis_or_indication=p.diagnosis_or_indication,
            medication_name=p.medication_name,
            generic_name=p.generic_name,
            dosage=p.dosage or "1 tablet",
            frequency=p.frequency or "Twice daily",
            duration=p.duration or "7 days",
            instructions=p.instructions or "Take with water after meals.",
            medications=meds,
            doctor_name=p.doctor_name or "Dr. Priya Sharma",
            doctor_specialty=p.doctor_specialty or "General Physician",
            hospital=p.hospital or "MediAssist Medical Center",
            prescribed_date=p.prescribed_date or (p.created_at.strftime("%d %b %Y, %I:%M %p") if p.created_at else "Recent"),
            valid_until=p.valid_until,
            status=p.status or "Active",
            approval_status=p.approval_status or "APPROVED",
            clinician_review_status=p.clinician_review_status or "NOT_REVIEWED",
            provenance=p.provenance or "AI_EXTRACTED",
            refills_remaining=p.refills_remaining or 0,
            refill_recommended=bool(p.refill_recommended),
            notes=p.notes,
            document_file_path=p.document_file_path,
            document_file_name=p.document_file_name,
            source_record_title=rec_title,
            created_at=p.created_at.isoformat() if p.created_at else "",
            updated_at=p.updated_at.isoformat() if p.updated_at else ""
        )

    @staticmethod
    def _reminder_to_response(r: MedicationReminder) -> MedicationReminderResponse:
        return MedicationReminderResponse(
            id=r.id,
            patient_id=r.patient_id,
            prescription_id=r.prescription_id,
            medication_name=r.medication_name,
            dosage_instruction=r.dosage_instruction,
            time_str=r.time_str,
            is_taken=bool(r.is_taken),
            is_active=bool(r.is_active),
            created_at=r.created_at.isoformat() if r.created_at else ""
        )

    @staticmethod
    def ensure_default_prescriptions(patient_id: str, db: Session):
        """
        No-op: In adherence to zero mock data rules, we never inject fake prescriptions.
        """
        pass

    @staticmethod
    def get_prescriptions(
        patient_id: str,
        tab: str,
        search: Optional[str],
        sort: str,
        page: int,
        page_size: int,
        doctor: Optional[str],
        db: Session
    ) -> PrescriptionListResponse:
        query = db.query(Prescription).filter(
            Prescription.patient_id == patient_id,
            Prescription.is_deleted == False
        )

        # Tab filters
        tab_lower = tab.lower()
        if tab_lower == 'active':
            query = query.filter(Prescription.status.ilike('%Active%'))
        elif tab_lower == 'completed':
            query = query.filter(Prescription.status.ilike('%Completed%'))
        elif tab_lower == 'expired':
            query = query.filter(Prescription.status.ilike('%Expired%'))
        elif tab_lower == 'cancelled':
            query = query.filter(Prescription.status.ilike('%Cancelled%'))
        elif tab_lower == 'archived':
            query = query.filter(Prescription.status.ilike('%Archived%'))
        elif tab_lower in ['refill needed', 'refills']:
            query = query.filter(
                or_(
                    Prescription.status.ilike('%Refill%'),
                    Prescription.refill_recommended == True
                )
            )

        # Doctor filter
        if doctor and doctor != 'All':
            query = query.filter(Prescription.doctor_name.ilike(f"%{doctor}%"))

        # Search Query across medicine name, doctor, hospital, diagnosis, instructions
        if search and search.strip():
            s = f"%{search.strip()}%"
            query = query.filter(
                or_(
                    Prescription.medication_name.ilike(s),
                    Prescription.generic_name.ilike(s),
                    Prescription.doctor_name.ilike(s),
                    Prescription.hospital.ilike(s),
                    Prescription.diagnosis_or_indication.ilike(s),
                    Prescription.medications_data.ilike(s),
                    Prescription.session_name.ilike(s),
                    Prescription.instructions.ilike(s)
                )
            )

        # Sorting
        if sort == 'oldest':
            query = query.order_by(asc(Prescription.created_at))
        elif sort == 'name_asc':
            query = query.order_by(asc(Prescription.medication_name))
        elif sort == 'name_desc':
            query = query.order_by(desc(Prescription.medication_name))
        else:
            query = query.order_by(desc(Prescription.created_at))

        total_count = query.count()
        total_pages = max(1, math.ceil(total_count / page_size))
        offset = (page - 1) * page_size
        items = query.offset(offset).limit(page_size).all()

        return PrescriptionListResponse(
            prescriptions=[PrescriptionService._to_response(p, db) for p in items],
            total_count=total_count,
            page=page,
            page_size=page_size,
            total_pages=total_pages
        )

    @staticmethod
    def get_prescription_by_id(prescription_id: str, patient_id: str, db: Session) -> Prescription:
        p = db.query(Prescription).filter(
            Prescription.id == prescription_id,
            Prescription.patient_id == patient_id,
            Prescription.is_deleted == False
        ).first()

        if not p:
            raise AppException(
                status_code=status.HTTP_404_NOT_FOUND,
                message=f"Prescription with id '{prescription_id}' not found or access denied."
            )
        return p

    @staticmethod
    def get_summary(patient_id: str, db: Session) -> PrescriptionSummaryResponse:
        total = db.query(Prescription).filter(
            Prescription.patient_id == patient_id,
            Prescription.is_deleted == False
        ).count()

        active = db.query(Prescription).filter(
            Prescription.patient_id == patient_id,
            Prescription.status.ilike('%Active%'),
            Prescription.is_deleted == False
        ).count()

        completed = db.query(Prescription).filter(
            Prescription.patient_id == patient_id,
            Prescription.status.ilike('%Completed%'),
            Prescription.is_deleted == False
        ).count()

        expired = db.query(Prescription).filter(
            Prescription.patient_id == patient_id,
            Prescription.status.ilike('%Expired%'),
            Prescription.is_deleted == False
        ).count()

        refills = db.query(Prescription).filter(
            Prescription.patient_id == patient_id,
            or_(
                Prescription.status.ilike('%Refill%'),
                Prescription.refill_recommended == True
            ),
            Prescription.is_deleted == False
        ).count()

        return PrescriptionSummaryResponse(
            total_prescriptions=total,
            active_prescriptions=active,
            completed_prescriptions=completed,
            expired_prescriptions=expired,
            need_refills=refills,
            this_month=total
        )

    @staticmethod
    def check_duplicate(
        patient_id: str,
        payload: DuplicateCheckRequest,
        db: Session
    ) -> DuplicateCheckResponse:
        """
        Identifies potential duplicate prescriptions for a patient before saving.
        """
        query = db.query(Prescription).filter(
            Prescription.patient_id == patient_id,
            Prescription.is_deleted == False
        )

        if payload.doctor_name:
            query = query.filter(Prescription.doctor_name.ilike(f"%{payload.doctor_name.strip()}%"))

        if payload.prescribed_date:
            query = query.filter(Prescription.prescribed_date.ilike(f"%{payload.prescribed_date.strip()}%"))

        existing = query.first()
        if existing:
            return DuplicateCheckResponse(
                is_duplicate=True,
                matching_prescription=PrescriptionService._to_response(existing, db),
                message=f"A prescription from {existing.doctor_name} dated {existing.prescribed_date} already exists in your records."
            )

        return DuplicateCheckResponse(
            is_duplicate=False,
            matching_prescription=None,
            message="No duplicate prescriptions found."
        )

    @staticmethod
    def create_manual_prescription(
        patient_id: str,
        payload: PrescriptionCreate,
        db: Session
    ) -> PrescriptionResponse:
        """
        Creates a patient manually entered prescription.
        """
        meds_list = payload.medications or []
        primary_name = payload.medication_name
        primary_dosage = payload.dosage
        primary_freq = payload.frequency
        primary_dur = payload.duration
        primary_inst = payload.instructions

        if meds_list and not primary_name:
            primary_name = meds_list[0].medication_name
            primary_dosage = meds_list[0].dosage
            primary_freq = meds_list[0].frequency
            primary_dur = meds_list[0].duration
            primary_inst = meds_list[0].instructions

        if not primary_name:
            primary_name = "Prescription Medications"

        meds_json = json.dumps([m.model_dump() for m in meds_list]) if meds_list else None

        new_presc = Prescription(
            patient_id=patient_id,
            record_id=payload.record_id,
            appointment_id=payload.appointment_id,
            title=payload.title or f"Prescription - {payload.doctor_name or 'Doctor'}",
            session_name=payload.session_name or "General Records",
            diagnosis_or_indication=payload.diagnosis_or_indication,
            medication_name=primary_name,
            dosage=primary_dosage or "1 tablet",
            frequency=primary_freq or "Twice daily",
            duration=primary_dur or "7 days",
            instructions=primary_inst or "Take after meals with water.",
            medications_data=meds_json,
            doctor_name=payload.doctor_name or "Dr. Priya Sharma",
            doctor_specialty=payload.doctor_specialty or "General Physician",
            hospital=payload.hospital or "MediAssist Medical Center",
            prescribed_date=payload.prescribed_date or datetime.now(timezone.utc).strftime("%d %b %Y"),
            valid_until=payload.valid_until,
            status=payload.status or "Active",
            approval_status="APPROVED",
            clinician_review_status="NOT_REVIEWED",
            provenance="MANUALLY_ADDED",
            refills_remaining=payload.refills_remaining or 0,
            refill_recommended=bool(payload.refill_recommended),
            notes=payload.notes,
            is_deleted=False
        )

        db.add(new_presc)
        db.commit()
        db.refresh(new_presc)

        return PrescriptionService._to_response(new_presc, db)

    @staticmethod
    def sync_prescription_from_record(
        record: MedicalRecord,
        db: Session
    ) -> Optional[Prescription]:
        """
        Automatically creates or updates a Prescription entity when a MedicalRecord
        with category 'Prescription' or extracted medications is ingested or updated.
        """
        if not record or not record.patient_id:
            return None

        # Parse extracted medications from record
        extracted = {}
        if record.extracted_data:
            try:
                extracted = json.loads(record.extracted_data) if isinstance(record.extracted_data, str) else record.extracted_data
            except Exception:
                extracted = {}

        medications_list = extracted.get("medications", [])
        is_presc_category = "prescrip" in (record.category or "").lower()
        is_presc_report = extracted.get("report_type") == "PRESCRIPTION"

        if not (is_presc_category or is_presc_report or len(medications_list) > 0):
            return None

        # Check if already synced
        existing = db.query(Prescription).filter(
            Prescription.record_id == record.id,
            Prescription.patient_id == record.patient_id
        ).first()

        primary_med = medications_list[0] if medications_list else {}
        primary_name = primary_med.get("medication_name") or record.title or "Prescribed Medication"
        primary_dosage = primary_med.get("dosage") or "1 tablet"
        primary_freq = primary_med.get("frequency") or "Twice daily"
        primary_dur = primary_med.get("duration") or "7 days"
        primary_inst = primary_med.get("instructions") or "Take after food with water."

        meds_json = json.dumps(medications_list) if medications_list else None

        if existing:
            existing.title = record.title
            existing.session_name = record.session_name
            existing.doctor_name = record.doctor_name or existing.doctor_name
            existing.hospital = record.hospital or existing.hospital
            existing.prescribed_date = record.record_date or existing.prescribed_date
            existing.approval_status = record.approval_status or existing.approval_status
            existing.clinician_review_status = record.clinician_review_status or existing.clinician_review_status
            existing.medications_data = meds_json or existing.medications_data
            existing.document_file_path = record.file_path
            existing.document_file_name = record.file_name
            db.commit()
            db.refresh(existing)
            return existing

        new_presc = Prescription(
            patient_id=record.patient_id,
            record_id=record.id,
            title=record.title,
            session_name=record.session_name or "General Records",
            diagnosis_or_indication=extracted.get("primary_diagnosis_or_indication"),
            medication_name=primary_name,
            dosage=primary_dosage,
            frequency=primary_freq,
            duration=primary_dur,
            instructions=primary_inst,
            medications_data=meds_json,
            doctor_name=record.doctor_name or "Dr. Priya Sharma",
            doctor_specialty="General Physician",
            hospital=record.hospital or "MediAssist Medical Center",
            prescribed_date=record.record_date or datetime.now(timezone.utc).strftime("%d %b %Y"),
            status="Active",
            approval_status=record.approval_status or "APPROVED",
            clinician_review_status=record.clinician_review_status or "NOT_REVIEWED",
            provenance="AI_EXTRACTED",
            document_file_path=record.file_path,
            document_file_name=record.file_name,
            is_deleted=False
        )

        db.add(new_presc)
        db.commit()
        db.refresh(new_presc)
        return new_presc

    @staticmethod
    def edit_prescription(
        prescription_id: str,
        patient_id: str,
        payload: PrescriptionEditRequest,
        db: Session
    ) -> PrescriptionResponse:
        p = PrescriptionService.get_prescription_by_id(prescription_id, patient_id, db)

        if payload.title is not None: p.title = payload.title
        if payload.session_name is not None: p.session_name = payload.session_name
        if payload.doctor_name is not None: p.doctor_name = payload.doctor_name
        if payload.doctor_specialty is not None: p.doctor_specialty = payload.doctor_specialty
        if payload.hospital is not None: p.hospital = payload.hospital
        if payload.prescribed_date is not None: p.prescribed_date = payload.prescribed_date
        if payload.valid_until is not None: p.valid_until = payload.valid_until
        if payload.status is not None: p.status = payload.status
        if payload.diagnosis_or_indication is not None: p.diagnosis_or_indication = payload.diagnosis_or_indication
        if payload.notes is not None: p.notes = payload.notes
        if payload.refills_remaining is not None: p.refills_remaining = payload.refills_remaining
        if payload.approval_status is not None: p.approval_status = payload.approval_status

        if payload.medications is not None:
            p.medications_data = json.dumps([m.model_dump() for m in payload.medications])
            if len(payload.medications) > 0:
                p.medication_name = payload.medications[0].medication_name
                p.dosage = payload.medications[0].dosage or p.dosage
                p.frequency = payload.medications[0].frequency or p.frequency
                p.duration = payload.medications[0].duration or p.duration
                p.instructions = payload.medications[0].instructions or p.instructions

        p.provenance = "PATIENT_EDITED"
        db.commit()
        db.refresh(p)
        return PrescriptionService._to_response(p, db)

    @staticmethod
    def approve_prescription(
        prescription_id: str,
        patient_id: str,
        db: Session
    ) -> PrescriptionResponse:
        p = PrescriptionService.get_prescription_by_id(prescription_id, patient_id, db)
        p.approval_status = "APPROVED"
        db.commit()
        db.refresh(p)
        return PrescriptionService._to_response(p, db)

    @staticmethod
    def mark_clinician_reviewed(
        prescription_id: str,
        patient_id: str,
        clinician_notes: Optional[str],
        db: Session
    ) -> PrescriptionResponse:
        p = PrescriptionService.get_prescription_by_id(prescription_id, patient_id, db)
        p.clinician_review_status = "CLINICIAN_REVIEWED"
        if clinician_notes:
            p.notes = f"{p.notes or ''}\nClinician Verification: {clinician_notes}".strip()
        db.commit()
        db.refresh(p)
        return PrescriptionService._to_response(p, db)

    @staticmethod
    def delete_prescription(
        prescription_id: str,
        patient_id: str,
        db: Session
    ) -> Dict[str, Any]:
        p = PrescriptionService.get_prescription_by_id(prescription_id, patient_id, db)
        p.is_deleted = True
        p.deleted_at = datetime.now(timezone.utc)
        db.commit()
        return {"success": True, "message": "Prescription deleted successfully."}

    # ================== Reminders Integration ==================
    @staticmethod
    def get_medication_reminders(patient_id: str, db: Session) -> List[MedicationReminderResponse]:
        reminders = db.query(MedicationReminder).filter(
            MedicationReminder.patient_id == patient_id,
            MedicationReminder.is_active == True
        ).order_by(asc(MedicationReminder.time_str)).all()

        return [PrescriptionService._reminder_to_response(r) for r in reminders]

    @staticmethod
    def add_medication_reminder(
        patient_id: str,
        payload: MedicationReminderCreate,
        db: Session
    ) -> MedicationReminderResponse:
        # Also sync to PatientReminder for master calendar consistency
        patient_rem = PatientReminder(
            patient_id=patient_id,
            reminder_type="Medication",
            title=f"Take {payload.medication_name}",
            subtitle=payload.dosage_instruction,
            time_str=payload.time_str,
            recurrence="Daily",
            status="Upcoming",
            icon_type="pill",
            color_theme="teal"
        )
        db.add(patient_rem)

        new_rem = MedicationReminder(
            patient_id=patient_id,
            prescription_id=payload.prescription_id,
            medication_name=payload.medication_name,
            dosage_instruction=payload.dosage_instruction,
            time_str=payload.time_str,
            is_taken=False,
            is_active=True
        )
        db.add(new_rem)
        db.commit()
        db.refresh(new_rem)

        return PrescriptionService._reminder_to_response(new_rem)

    @staticmethod
    def toggle_reminder_status(reminder_id: str, patient_id: str, db: Session) -> MedicationReminderResponse:
        r = db.query(MedicationReminder).filter(
            MedicationReminder.id == reminder_id,
            MedicationReminder.patient_id == patient_id
        ).first()

        if not r:
            raise AppException(
                status_code=status.HTTP_404_NOT_FOUND,
                message="Reminder not found."
            )

        r.is_taken = not r.is_taken
        db.commit()
        db.refresh(r)
        return PrescriptionService._reminder_to_response(r)

    @staticmethod
    def delete_reminder(reminder_id: str, patient_id: str, db: Session) -> Dict[str, Any]:
        r = db.query(MedicationReminder).filter(
            MedicationReminder.id == reminder_id,
            MedicationReminder.patient_id == patient_id
        ).first()

        if not r:
            raise AppException(
                status_code=status.HTTP_404_NOT_FOUND,
                message="Reminder not found."
            )

        db.delete(r)
        db.commit()
        return {"success": True, "message": "Reminder removed."}

prescription_service = PrescriptionService()
