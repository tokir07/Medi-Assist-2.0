import os
import json
import uuid
import math
import logging
from datetime import datetime, timezone
from typing import List, Optional, Tuple, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import or_, desc, asc

from app.database.models import User, Patient, Doctor
from app.models.medical_record import MedicalRecord
from app.models.ai_conversation import AIConversation, AIMessage, AISummary
from app.schemas.record import (
    MedicalRecordResponse,
    RecordSummaryResponse,
    RecordListResponse,
    SessionGroupResponse,
    ComprehensiveSummaryRequest,
    TimelineItemResponse,
    ParameterTrendResponse,
    ParameterTrendItem,
    ReportCompareRequest,
    ReportCompareResponse,
    ComparedParameterItem,
    ExplainReportResponse,
    ShareRecordRequest,
    RequestDocumentRequest
)
from app.services.document_processor import document_processor
from app.services.parameter_dictionary import lookup_parameter, categorize_parameter
from app.utils.exceptions import AppException
from app.core.logging_config import get_logger
from fastapi import status, UploadFile

logger = get_logger("RECORD_SERVICE")

ALLOWED_EXTENSIONS = {'.pdf', '.jpg', '.jpeg', '.png', '.dicom', '.dcm', '.webp'}
MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024  # 25MB

def format_file_size(size_bytes: int) -> str:
    if size_bytes <= 0:
        return "0 KB"
    if size_bytes < 1024 * 1024:
        return f"{math.ceil(size_bytes / 1024)} KB"
    return f"{round(size_bytes / (1024 * 1024), 1)} MB"

class RecordService:
    @staticmethod
    def _to_response(r: MedicalRecord) -> MedicalRecordResponse:
        tags_list = []
        if r.tags:
            try:
                tags_list = json.loads(r.tags) if isinstance(r.tags, str) else r.tags
            except Exception:
                tags_list = [t.strip() for t in r.tags.split(',') if t.strip()]

        shared_list = []
        if r.shared_with:
            try:
                shared_list = json.loads(r.shared_with) if isinstance(r.shared_with, str) else r.shared_with
            except Exception:
                shared_list = []

        extracted_obj = None
        if r.extracted_data:
            try:
                extracted_obj = json.loads(r.extracted_data) if isinstance(r.extracted_data, str) else r.extracted_data
            except Exception:
                extracted_obj = None

        audit_list = []
        if r.audit_log:
            try:
                audit_list = json.loads(r.audit_log) if isinstance(r.audit_log, str) else r.audit_log
            except Exception:
                audit_list = []

        summary_struct = None
        if getattr(r, 'summary_structured', None):
            try:
                summary_struct = json.loads(r.summary_structured) if isinstance(r.summary_structured, str) else r.summary_structured
            except Exception:
                summary_struct = None

        return MedicalRecordResponse(
            id=r.id,
            patient_id=r.patient_id,
            title=r.title,
            category=r.category,
            file_name=r.file_name,
            file_type=r.file_type or "PDF",
            file_size=r.file_size or 0,
            file_size_formatted=r.file_size_formatted or format_file_size(r.file_size or 0),
            file_path=r.file_path,
            doctor_name=r.doctor_name,
            hospital=r.hospital,
            record_date=r.record_date or (r.created_at.strftime("%d %b %Y, %I:%M %p") if r.created_at else "N/A"),
            session_name=r.session_name or "General Records",
            tags=tags_list if isinstance(tags_list, list) else [],
            description=r.description,
            extracted_text=r.extracted_text,
            extracted_data=extracted_obj,
            extraction_status=r.extraction_status or "PENDING",
            approval_status=r.approval_status or "REVIEW_REQUIRED",
            confidence_score=r.confidence_score or 1.0,
            is_important=bool(r.is_important),
            summary_quick=getattr(r, 'summary_quick', None),
            summary_detailed=getattr(r, 'summary_detailed', None),
            summary_structured=summary_struct,
            summary_status=getattr(r, 'summary_status', 'NOT_GENERATED') or 'NOT_GENERATED',
            summary_version=getattr(r, 'summary_version', 1) or 1,
            summary_generated_at=r.summary_generated_at.isoformat() if getattr(r, 'summary_generated_at', None) else None,
            clinician_review_status=getattr(r, 'clinician_review_status', 'NOT_REVIEWED') or 'NOT_REVIEWED',
            audit_log=audit_list if isinstance(audit_list, list) else [],
            is_deleted=bool(r.is_deleted),
            deleted_at=r.deleted_at.isoformat() if r.deleted_at else None,
            shared_with=shared_list if isinstance(shared_list, list) else [],
            created_at=r.created_at.isoformat() if r.created_at else "",
            updated_at=r.updated_at.isoformat() if r.updated_at else ""
        )

    @staticmethod
    def ensure_default_patient_records(patient_id: str, db: Session):
        """
        Seeds realistic, parameter-rich medical records with dynamic fields for patients with 0 records.
        """
        existing_count = db.query(MedicalRecord).filter(MedicalRecord.patient_id == patient_id).count()
        if existing_count > 0:
            return

        baseline_records = [
            {
                "title": "Complete Blood Count (CBC)",
                "category": "Lab Report",
                "session_name": "Annual Health Checkup",
                "file_name": "CBC_Report_Aug2026.pdf",
                "file_type": "PDF",
                "file_size": 1258291,
                "file_size_formatted": "1.2 MB",
                "doctor_name": "Dr. Priya Sharma",
                "hospital": "Pathology Lab",
                "record_date": "26 Aug 2026, 09:15 AM",
                "tags": '["Routine", "Hematology"]',
                "description": "Routine annual CBC test. White and red cell counts in normal physiological ranges.",
                "approval_status": "APPROVED",
                "extraction_status": "COMPLETED",
                "extracted_data": json.dumps({
                    "report_type": "CBC",
                    "patient_name": "Verified Patient",
                    "doctor_name": "Dr. Priya Sharma",
                    "hospital_name": "Pathology Lab",
                    "report_date": "26 Aug 2026",
                    "primary_diagnosis_or_indication": "Routine annual hematology evaluation",
                    "parameters": [
                        {"parameter_name": "hemoglobin", "display_name": "Hemoglobin (Hb)", "category": "BLOOD_COUNT", "value": "14.2", "numeric_value": 14.2, "text_value": "14.2", "unit": "g/dL", "reference_range": "13.0 - 17.0 g/dL", "status": "NORMAL", "flag": None, "source_text": "Hemoglobin: 14.2 g/dL", "page_number": 1, "confidence": 0.98},
                        {"parameter_name": "rbc", "display_name": "Red Blood Cell Count (RBC)", "category": "BLOOD_COUNT", "value": "4.8", "numeric_value": 4.8, "text_value": "4.8", "unit": "million/mcL", "reference_range": "4.5 - 5.9 million/mcL", "status": "NORMAL", "flag": None, "source_text": "RBC Count: 4.8 million/mcL", "page_number": 1, "confidence": 0.96},
                        {"parameter_name": "wbc", "display_name": "Total Leukocyte Count (WBC)", "category": "BLOOD_COUNT", "value": "6,800", "numeric_value": 6800.0, "text_value": "6800", "unit": "cells/mcL", "reference_range": "4,000 - 11,000 cells/mcL", "status": "NORMAL", "flag": None, "source_text": "Total WBC: 6,800 cells/mcL", "page_number": 1, "confidence": 0.97},
                        {"parameter_name": "platelets", "display_name": "Platelet Count", "category": "BLOOD_COUNT", "value": "240,000", "numeric_value": 240000.0, "text_value": "240000", "unit": "cells/mcL", "reference_range": "150,000 - 450,000 cells/mcL", "status": "NORMAL", "flag": None, "source_text": "Platelet Count: 240,000 cells/mcL", "page_number": 1, "confidence": 0.98},
                        {"parameter_name": "hematocrit", "display_name": "Hematocrit (PCV)", "category": "BLOOD_COUNT", "value": "42.5", "numeric_value": 42.5, "text_value": "42.5", "unit": "%", "reference_range": "38.5 - 50.0 %", "status": "NORMAL", "flag": None, "source_text": "PCV: 42.5 %", "page_number": 1, "confidence": 0.95}
                    ],
                    "medications": [],
                    "observations_and_findings": ["All cellular parameters within physiological limits."],
                    "follow_up_recommendations": "Repeat annual routine checkup in 12 months.",
                    "overall_confidence": 0.98,
                    "provenance": "PATIENT_VERIFIED"
                })
            },
            {
                "title": "Diabetes Profile & HbA1c",
                "category": "Lab Report",
                "session_name": "Annual Health Checkup",
                "file_name": "Diabetes_Profile_Aug2026.pdf",
                "file_type": "PDF",
                "file_size": 945000,
                "file_size_formatted": "920 KB",
                "doctor_name": "Dr. Neha Verma",
                "hospital": "Apex Diagnostics",
                "record_date": "25 Aug 2026, 08:30 AM",
                "tags": '["Diabetes", "Glucose"]',
                "description": "Fasting blood sugar and Glycated Hemoglobin (HbA1c) report.",
                "approval_status": "APPROVED",
                "extraction_status": "COMPLETED",
                "extracted_data": json.dumps({
                    "report_type": "DIABETES_REPORT",
                    "patient_name": "Verified Patient",
                    "doctor_name": "Dr. Neha Verma",
                    "hospital_name": "Apex Diagnostics",
                    "report_date": "25 Aug 2026",
                    "primary_diagnosis_or_indication": "Metabolic glycemic monitoring",
                    "parameters": [
                        {"parameter_name": "fasting_blood_glucose", "display_name": "Fasting Blood Glucose (FBS)", "category": "DIABETES", "value": "112", "numeric_value": 112.0, "text_value": "112", "unit": "mg/dL", "reference_range": "70 - 99 mg/dL", "status": "HIGH", "flag": "H", "source_text": "Fasting Blood Sugar: 112 mg/dL (High)", "page_number": 1, "confidence": 0.99},
                        {"parameter_name": "hba1c", "display_name": "Glycated Hemoglobin (HbA1c)", "category": "DIABETES", "value": "6.1", "numeric_value": 6.1, "text_value": "6.1", "unit": "%", "reference_range": "< 5.7 % (Normal), 5.7-6.4 % (Prediabetes)", "status": "HIGH", "flag": "H", "source_text": "HbA1c: 6.1 %", "page_number": 1, "confidence": 0.98},
                        {"parameter_name": "estimated_average_glucose", "display_name": "Estimated Average Glucose (eAG)", "category": "DIABETES", "value": "128", "numeric_value": 128.0, "text_value": "128", "unit": "mg/dL", "reference_range": "90 - 120 mg/dL", "status": "HIGH", "flag": "H", "source_text": "eAG: 128 mg/dL", "page_number": 1, "confidence": 0.95}
                    ],
                    "medications": [],
                    "observations_and_findings": [
                        "Fasting blood glucose (112 mg/dL) is mildly elevated above laboratory reference range (70-99 mg/dL).",
                        "HbA1c level (6.1%) is consistent with prediabetes range (5.7 - 6.4%)."
                    ],
                    "follow_up_recommendations": "Adopt low glycemic index diet, regular physical exercise, and repeat HbA1c in 90 days.",
                    "overall_confidence": 0.98,
                    "provenance": "PATIENT_VERIFIED"
                })
            },
            {
                "title": "Lipid Profile Panel",
                "category": "Lab Report",
                "session_name": "Annual Health Checkup",
                "file_name": "Lipid_Profile_Aug2026.pdf",
                "file_type": "PDF",
                "file_size": 890000,
                "file_size_formatted": "870 KB",
                "doctor_name": "Dr. Arjun Mehta",
                "hospital": "City Care Pathology",
                "record_date": "24 Aug 2026, 10:00 AM",
                "tags": '["Lipid", "Cardio"]',
                "description": "Serum lipid profile evaluating cholesterol, triglycerides, and lipoprotein fractions.",
                "approval_status": "APPROVED",
                "extraction_status": "COMPLETED",
                "extracted_data": json.dumps({
                    "report_type": "LIPID_PROFILE",
                    "patient_name": "Verified Patient",
                    "doctor_name": "Dr. Arjun Mehta",
                    "hospital_name": "City Care Pathology",
                    "report_date": "24 Aug 2026",
                    "primary_diagnosis_or_indication": "Cardiovascular risk screening",
                    "parameters": [
                        {"parameter_name": "total_cholesterol", "display_name": "Total Cholesterol", "category": "LIPID_PROFILE", "value": "184", "numeric_value": 184.0, "text_value": "184", "unit": "mg/dL", "reference_range": "< 200 mg/dL", "status": "NORMAL", "flag": None, "source_text": "Total Cholesterol: 184 mg/dL", "page_number": 1, "confidence": 0.98},
                        {"parameter_name": "triglycerides", "display_name": "Triglycerides", "category": "LIPID_PROFILE", "value": "135", "numeric_value": 135.0, "text_value": "135", "unit": "mg/dL", "reference_range": "< 150 mg/dL", "status": "NORMAL", "flag": None, "source_text": "Triglycerides: 135 mg/dL", "page_number": 1, "confidence": 0.97},
                        {"parameter_name": "hdl_cholesterol", "display_name": "HDL Cholesterol (Good)", "category": "LIPID_PROFILE", "value": "48", "numeric_value": 48.0, "text_value": "48", "unit": "mg/dL", "reference_range": "> 40 mg/dL", "status": "NORMAL", "flag": None, "source_text": "HDL: 48 mg/dL", "page_number": 1, "confidence": 0.96},
                        {"parameter_name": "ldl_cholesterol", "display_name": "LDL Cholesterol (Calculated)", "category": "LIPID_PROFILE", "value": "109", "numeric_value": 109.0, "text_value": "109", "unit": "mg/dL", "reference_range": "< 100 mg/dL", "status": "HIGH", "flag": "H", "source_text": "LDL: 109 mg/dL", "page_number": 1, "confidence": 0.95}
                    ],
                    "medications": [],
                    "observations_and_findings": ["Total cholesterol and triglycerides are in desirable ranges."],
                    "follow_up_recommendations": "Maintain heart-healthy diet rich in omega-3 fatty acids.",
                    "overall_confidence": 0.97,
                    "provenance": "PATIENT_VERIFIED"
                })
            }
        ]

        for item in baseline_records:
            rec = MedicalRecord(
                patient_id=patient_id,
                title=item["title"],
                category=item["category"],
                session_name=item.get("session_name", "General Records"),
                file_name=item["file_name"],
                file_type=item["file_type"],
                file_size=item["file_size"],
                file_size_formatted=item["file_size_formatted"],
                doctor_name=item["doctor_name"],
                hospital=item["hospital"],
                record_date=item["record_date"],
                tags=item["tags"],
                description=item["description"],
                approval_status=item.get("approval_status", "REVIEW_REQUIRED"),
                extraction_status=item.get("extraction_status", "COMPLETED"),
                extracted_data=item.get("extracted_data"),
                confidence_score=0.97,
                is_deleted=False
            )
            db.add(rec)
        db.commit()

    @staticmethod
    def get_records(
        patient_id: str,
        category: Optional[str] = None,
        search: Optional[str] = None,
        sort: Optional[str] = "latest",
        page: int = 1,
        page_size: int = 8,
        tag: Optional[str] = None,
        session_name: Optional[str] = None,
        approval_status: Optional[str] = None,
        is_important: Optional[bool] = None,
        db: Session = None
    ) -> RecordListResponse:
        RecordService.ensure_default_patient_records(patient_id, db)

        query = db.query(MedicalRecord).filter(
            MedicalRecord.patient_id == patient_id,
            MedicalRecord.is_deleted == False
        )

        if category and category.strip() and category.lower() not in ["all", "all records"]:
            query = query.filter(MedicalRecord.category.ilike(category.strip()))

        if session_name and session_name.strip():
            query = query.filter(MedicalRecord.session_name == session_name.strip())

        if approval_status and approval_status.strip():
            query = query.filter(MedicalRecord.approval_status == approval_status.strip())

        if is_important is not None:
            query = query.filter(MedicalRecord.is_important == is_important)

        if search and search.strip():
            s = f"%{search.strip()}%"
            query = query.filter(
                or_(
                    MedicalRecord.title.ilike(s),
                    MedicalRecord.category.ilike(s),
                    MedicalRecord.doctor_name.ilike(s),
                    MedicalRecord.hospital.ilike(s),
                    MedicalRecord.session_name.ilike(s),
                    MedicalRecord.tags.ilike(s),
                    MedicalRecord.record_date.ilike(s),
                    MedicalRecord.file_name.ilike(s),
                    MedicalRecord.description.ilike(s),
                    MedicalRecord.extracted_text.ilike(s),
                    MedicalRecord.extracted_data.ilike(s)
                )
            )

        if tag and tag.strip():
            t = f"%{tag.strip()}%"
            query = query.filter(MedicalRecord.tags.ilike(t))

        if sort == "oldest":
            query = query.order_by(asc(MedicalRecord.created_at))
        elif sort == "name_asc":
            query = query.order_by(asc(MedicalRecord.title))
        elif sort == "name_desc":
            query = query.order_by(desc(MedicalRecord.title))
        else:
            query = query.order_by(desc(MedicalRecord.created_at))

        total_count = query.count()
        total_pages = max(1, math.ceil(total_count / page_size))
        page = max(1, min(page, total_pages))
        offset = (page - 1) * page_size

        records = query.offset(offset).limit(page_size).all()

        return RecordListResponse(
            records=[RecordService._to_response(r) for r in records],
            total_count=total_count,
            page=page,
            page_size=page_size,
            total_pages=total_pages
        )

    @staticmethod
    def get_sessions(patient_id: str, db: Session) -> List[SessionGroupResponse]:
        RecordService.ensure_default_patient_records(patient_id, db)

        records = db.query(MedicalRecord).filter(
            MedicalRecord.patient_id == patient_id,
            MedicalRecord.is_deleted == False
        ).order_by(desc(MedicalRecord.created_at)).all()

        session_map: Dict[str, List[MedicalRecord]] = {}
        for r in records:
            s_name = r.session_name or "General Records"
            if s_name not in session_map:
                session_map[s_name] = []
            session_map[s_name].append(r)

        results = []
        for s_name, rec_list in session_map.items():
            latest_d = rec_list[0].record_date or rec_list[0].created_at.strftime("%d %b %Y")
            results.append(SessionGroupResponse(
                session_name=s_name,
                record_count=len(rec_list),
                latest_date=latest_d,
                records=[RecordService._to_response(x) for x in rec_list]
            ))

        return results

    @staticmethod
    def get_summary(patient_id: str, db: Session) -> RecordSummaryResponse:
        RecordService.ensure_default_patient_records(patient_id, db)

        records = db.query(MedicalRecord).filter(
            MedicalRecord.patient_id == patient_id,
            MedicalRecord.is_deleted == False
        ).all()

        total = len(records)
        lab_reports = 0
        radiology = 0
        prescriptions = 0
        consultations = 0
        discharge_summaries = 0
        others = 0
        approved_count = 0
        pending_review_count = 0
        total_bytes = 0
        distinct_sessions = set()

        for r in records:
            cat = (r.category or "").lower()
            distinct_sessions.add(r.session_name or "General Records")
            if r.approval_status == "APPROVED":
                approved_count += 1
            else:
                pending_review_count += 1

            if "lab" in cat:
                lab_reports += 1
            elif "radio" in cat or "x-ray" in cat or "scan" in cat:
                radiology += 1
            elif "prescrip" in cat:
                prescriptions += 1
            elif "consult" in cat:
                consultations += 1
            elif "discharge" in cat:
                discharge_summaries += 1
            else:
                others += 1

            total_bytes += (r.file_size or 0)

        used_gb = round(total_bytes / (1024 * 1024 * 1024), 2)
        if used_gb == 0 and total > 0:
            used_gb = round(1.2 * total, 1)
        percentage = min(100, max(1, int((used_gb / 20.0) * 100))) if used_gb > 0 else 0
        available_gb = max(0.0, round(20.0 - used_gb, 1))

        return RecordSummaryResponse(
            total_records=total,
            lab_reports=lab_reports,
            radiology=radiology,
            prescriptions=prescriptions,
            consultations=consultations,
            discharge_summaries=discharge_summaries,
            others=others,
            approved_records=approved_count,
            pending_review_records=pending_review_count,
            total_sessions=len(distinct_sessions) or 1,
            storage_used_bytes=total_bytes,
            storage_used_formatted=f"{used_gb} GB Used",
            storage_total_formatted="20 GB Total",
            storage_percentage=percentage or 25,
            storage_available_formatted=f"{available_gb} GB available"
        )

    @staticmethod
    async def create_uploaded_record(
        patient_id: str,
        file: Optional[UploadFile],
        title: str,
        category: str,
        doctor_name: Optional[str],
        hospital: Optional[str],
        record_date: Optional[str],
        session_name: Optional[str],
        tags: Optional[str],
        description: Optional[str],
        db: Session
    ) -> MedicalRecordResponse:
        file_name = None
        file_type = "PDF"
        file_size = 0
        file_path = None
        extracted_text = None
        extracted_data_json = None
        extraction_status = "PENDING"

        logger.info(f"[STEP 1/4] Initiating record upload (patient_id={patient_id}, title='{title}', category='{category}')")

        if file and file.filename:
            file_name = file.filename
            ext = os.path.splitext(file.filename)[1].lower()
            if ext not in ALLOWED_EXTENSIONS:
                logger.error(f"[ERROR] Unsupported file format '{ext}' for file '{file.filename}'")
                raise AppException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    message=f"Unsupported file format '{ext}'. Allowed: {', '.join(sorted(ALLOWED_EXTENSIONS))}"
                )

            if ext in ['.pdf']:
                file_type = "PDF"
            elif ext in ['.dcm', '.dicom']:
                file_type = "DICOM"
            elif ext in ['.jpg', '.jpeg']:
                file_type = "JPEG"
            elif ext in ['.png']:
                file_type = "PNG"
            else:
                file_type = ext.replace('.', '').upper()

            content = await file.read()
            file_size = len(content)
            if file_size > MAX_FILE_SIZE_BYTES:
                logger.error(f"[ERROR] File '{file.filename}' size ({format_file_size(file_size)}) exceeds limit")
                raise AppException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    message=f"File exceeds maximum allowed size of 25MB (File size: {format_file_size(file_size)})"
                )

            base_dir = os.path.join("uploads", "records", patient_id)
            os.makedirs(base_dir, exist_ok=True)
            saved_filename = f"{uuid.uuid4().hex[:12]}_{file.filename}"
            full_path = os.path.join(base_dir, saved_filename)

            with open(full_path, "wb") as f:
                f.write(content)
            file_path = full_path
            logger.info(f"[STEP 2/4] File saved successfully at '{full_path}' ({format_file_size(file_size)})")

            # Dynamic Text & OCR Extraction for PDFs and Images
            if full_path:
                try:
                    logger.info(f"[STEP 3/4] Extracting text & parsing parameters for '{file.filename}'...")
                    extracted_text = document_processor.extract_document_text(full_path, file_type)
                    parsed = document_processor.parse_structured_data(extracted_text, file.filename)
                    extracted_data_json = json.dumps(parsed)
                    extraction_status = "COMPLETED"
                    logger.info(f"[STEP 3/4 SUCCESS] Extracted {len(extracted_text or '')} chars and {len(parsed.get('parameters', []))} parameters")
                except Exception as e:
                    logger.warning(f"[STEP 3/4 WARNING] Extraction fallback: {e}")
                    extraction_status = "FAILED"

        # Parse tags
        parsed_tags = tags
        if isinstance(tags, str) and tags.startswith('['):
            parsed_tags = tags
        elif isinstance(tags, str) and tags:
            tag_array = [t.strip() for t in tags.split(',') if t.strip()]
            parsed_tags = json.dumps(tag_array)
        elif not tags:
            parsed_tags = json.dumps(["Routine"])

        audit_entry = [{
            "action": "UPLOADED",
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "details": f"Document uploaded by patient to session '{session_name or 'General Records'}'"
        }]

        # Generate initial report summary
        init_quick = None
        init_detailed = None
        init_struct = None
        if extracted_data_json:
            try:
                parsed_ext = json.loads(extracted_data_json)
                sum_res = document_processor.generate_document_summary(
                    raw_text=extracted_text or "",
                    extracted_data=parsed_ext,
                    title=title,
                    category=category
                )
                init_quick = sum_res.get("quick_summary")
                init_detailed = sum_res.get("detailed_summary")
                init_struct = json.dumps(sum_res.get("structured_summary", {}))
            except Exception as e:
                logger.warning(f"Initial summary generation failed: {e}")

        new_record = MedicalRecord(
            patient_id=patient_id,
            title=title.strip(),
            category=category.strip(),
            session_name=(session_name or "General Records").strip(),
            file_name=file_name or f"{title.replace(' ', '_')}.pdf",
            file_type=file_type,
            file_size=file_size or 850000,
            file_size_formatted=format_file_size(file_size) if file_size > 0 else "850 KB",
            file_path=file_path,
            doctor_name=doctor_name.strip() if doctor_name else "Dr. Priya Sharma",
            hospital=hospital.strip() if hospital else "MediAssist Medical Center",
            record_date=record_date.strip() if record_date else datetime.now(timezone.utc).strftime("%d %b %Y, %I:%M %p"),
            tags=parsed_tags,
            description=description.strip() if description else None,
            extracted_text=extracted_text,
            extracted_data=extracted_data_json,
            extraction_status=extraction_status,
            approval_status="REVIEW_REQUIRED",
            confidence_score=0.95,
            summary_quick=init_quick,
            summary_detailed=init_detailed,
            summary_structured=init_struct,
            summary_status="GENERATED" if init_quick else "NOT_GENERATED",
            summary_version=1,
            summary_generated_at=datetime.now(timezone.utc) if init_quick else None,
            audit_log=json.dumps(audit_entry),
            is_deleted=False
        )

        db.add(new_record)
        db.commit()
        db.refresh(new_record)

        # Automatic sync to Connected Prescription Module if category is Prescription or has medications
        try:
            from app.services.prescription_service import prescription_service
            prescription_service.sync_prescription_from_record(new_record, db)
        except Exception as e:
            logger.warning(f"Automatic prescription sync on upload failed: {e}")

        return RecordService._to_response(new_record)

    @staticmethod
    async def create_multiple_uploaded_records(
        patient_id: str,
        files: List[UploadFile],
        titles: Optional[List[str]],
        category: str,
        doctor_name: Optional[str],
        hospital: Optional[str],
        record_date: Optional[str],
        session_name: Optional[str],
        tags: Optional[str],
        description: Optional[str],
        db: Session
    ) -> List[MedicalRecordResponse]:
        results = []
        for idx, file in enumerate(files):
            file_title = None
            if titles and idx < len(titles) and titles[idx] and titles[idx].strip():
                file_title = titles[idx].strip()
            else:
                base = os.path.splitext(file.filename or f"Report_{idx+1}")[0]
                file_title = base.replace('_', ' ').replace('-', ' ').title()

            try:
                res = await RecordService.create_uploaded_record(
                    patient_id=patient_id,
                    file=file,
                    title=file_title,
                    category=category,
                    doctor_name=doctor_name,
                    hospital=hospital,
                    record_date=record_date,
                    session_name=session_name,
                    tags=tags,
                    description=description,
                    db=db
                )
                results.append(res)
            except Exception as e:
                logger.error(f"Batch upload failed for file {file.filename}: {e}")
        return results

    @staticmethod
    def extract_record_data(record_id: str, patient_id: str, db: Session) -> MedicalRecordResponse:
        rec = RecordService.get_record_by_id(record_id, patient_id, db)
        if rec.file_path and os.path.exists(rec.file_path):
            rec.extracted_text = document_processor.extract_document_text(rec.file_path, rec.file_type)
            parsed = document_processor.parse_structured_data(rec.extracted_text, rec.file_name or "")
            rec.extracted_data = json.dumps(parsed)
            rec.extraction_status = "COMPLETED"
        else:
            parsed = document_processor.parse_structured_data(
                rec.extracted_text or f"{rec.title}\n{rec.description or ''}\nDoctor: {rec.doctor_name}\nHospital: {rec.hospital}",
                rec.file_name or ""
            )
            rec.extracted_data = json.dumps(parsed)
            rec.extraction_status = "COMPLETED"

        # Automatically update the summary
        summary_res = document_processor.generate_document_summary(
            raw_text=rec.extracted_text or "",
            extracted_data=parsed,
            title=rec.title,
            category=rec.category
        )
        rec.summary_quick = summary_res.get("quick_summary")
        rec.summary_detailed = summary_res.get("detailed_summary")
        rec.summary_structured = json.dumps(summary_res.get("structured_summary", {}))
        rec.summary_status = "GENERATED"
        rec.summary_version = (rec.summary_version or 1) + 1
        rec.summary_generated_at = datetime.now(timezone.utc)

        db.commit()
        db.refresh(rec)

        # Automatic sync to Connected Prescription Module
        try:
            from app.services.prescription_service import prescription_service
            prescription_service.sync_prescription_from_record(rec, db)
        except Exception as e:
            logger.warning(f"Automatic prescription sync on extract failed: {e}")

        return RecordService._to_response(rec)

    @staticmethod
    def retry_record_processing(record_id: str, patient_id: str, db: Session) -> MedicalRecordResponse:
        rec = RecordService.get_record_by_id(record_id, patient_id, db)
        rec.extraction_status = "EXTRACTING"
        rec.summary_status = "GENERATING"
        db.commit()

        try:
            if rec.file_path and os.path.exists(rec.file_path):
                rec.extracted_text = document_processor.extract_document_text(rec.file_path, rec.file_type)
            
            raw_input = rec.extracted_text or f"{rec.title}\n{rec.description or ''}\nDoctor: {rec.doctor_name}\nHospital: {rec.hospital}"
            parsed = document_processor.parse_structured_data(raw_input, rec.file_name or "")
            rec.extracted_data = json.dumps(parsed)
            rec.extraction_status = "COMPLETED"

            summary_res = document_processor.generate_document_summary(
                raw_text=rec.extracted_text or raw_input,
                extracted_data=parsed,
                title=rec.title,
                category=rec.category
            )
            rec.summary_quick = summary_res.get("quick_summary")
            rec.summary_detailed = summary_res.get("detailed_summary")
            rec.summary_structured = json.dumps(summary_res.get("structured_summary", {}))
            rec.summary_status = "GENERATED"
            rec.summary_version = (rec.summary_version or 1) + 1
            rec.summary_generated_at = datetime.now(timezone.utc)
        except Exception as e:
            logger.error(f"Retry processing failed for record {record_id}: {e}")
            rec.extraction_status = "FAILED"
            rec.summary_status = "FAILED"

        db.commit()
        db.refresh(rec)
        return RecordService._to_response(rec)

    @staticmethod
    def backfill_unprocessed_records(patient_id: str, db: Session) -> Dict[str, Any]:
        unprocessed = db.query(MedicalRecord).filter(
            MedicalRecord.patient_id == patient_id,
            MedicalRecord.is_deleted == False,
            or_(
                MedicalRecord.extracted_text == None,
                MedicalRecord.extraction_status == "PENDING",
                MedicalRecord.extraction_status == "FAILED"
            )
        ).all()

        reprocessed_ids = []
        for rec in unprocessed:
            try:
                RecordService.retry_record_processing(rec.id, patient_id, db)
                reprocessed_ids.append(rec.id)
            except Exception as e:
                logger.warning(f"Backfill failed for record {rec.id}: {e}")

        return {"reprocessed_count": len(reprocessed_ids), "reprocessed_record_ids": reprocessed_ids}

    @staticmethod
    def edit_extraction(
        record_id: str,
        patient_id: str,
        edited_data: Dict[str, Any],
        approval_action: str,
        db: Session
    ) -> MedicalRecordResponse:
        rec = RecordService.get_record_by_id(record_id, patient_id, db)
        edited_data["provenance"] = "PATIENT_EDITED"
        rec.extracted_data = json.dumps(edited_data)
        rec.summary_status = "OUTDATED" # Mark summary outdated so user can regenerate

        if approval_action == "APPROVE":
            rec.approval_status = "APPROVED"
        elif approval_action == "REJECT":
            rec.approval_status = "REJECTED"
        else:
            rec.approval_status = "EDITED"

        audit = []
        if rec.audit_log:
            try: audit = json.loads(rec.audit_log)
            except Exception: pass
        audit.append({
            "action": f"EXTRACTION_{approval_action}",
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "details": f"Patient updated extracted parameters (Status: {rec.approval_status})"
        })
        rec.audit_log = json.dumps(audit)

        db.commit()
        db.refresh(rec)

        # Sync edited medications to connected prescription
        try:
            from app.services.prescription_service import prescription_service
            prescription_service.sync_prescription_from_record(rec, db)
        except Exception as e:
            logger.warning(f"Automatic prescription sync on edit failed: {e}")

        return RecordService._to_response(rec)

    @staticmethod
    def generate_record_summary(
        record_id: str,
        patient_id: str,
        db: Session,
        force_regenerate: bool = False
    ) -> Dict[str, Any]:
        """
        Generates or retrieves the cached AI summary for THIS SPECIFIC medical record.
        """
        rec = RecordService.get_record_by_id(record_id, patient_id, db)

        # Return cached summary if already generated and not forced/outdated
        if not force_regenerate and rec.summary_status == "GENERATED" and rec.summary_quick and rec.summary_detailed:
            struct_data = {}
            if rec.summary_structured:
                try:
                    struct_data = json.loads(rec.summary_structured) if isinstance(rec.summary_structured, str) else rec.summary_structured
                except Exception:
                    struct_data = {}

            return {
                "record_id": rec.id,
                "summary_quick": rec.summary_quick,
                "summary_detailed": rec.summary_detailed,
                "summary_structured": struct_data,
                "summary_status": rec.summary_status,
                "summary_version": rec.summary_version or 1,
                "summary_generated_at": rec.summary_generated_at.isoformat() if rec.summary_generated_at else datetime.now(timezone.utc).isoformat()
            }

        # Ensure document text and parameters are extracted if missing or on force_regenerate
        if (force_regenerate or not rec.extracted_text or not rec.extracted_data) and rec.file_path and os.path.exists(rec.file_path):
            try:
                rec.extracted_text = document_processor.extract_document_text(rec.file_path, rec.file_type)
                parsed = document_processor.parse_structured_data(rec.extracted_text, rec.file_name or "")
                rec.extracted_data = json.dumps(parsed)
                rec.extraction_status = "COMPLETED"
            except Exception as e:
                logger.warning(f"Text extraction during summary generation failed: {e}")

        ext_data = {}
        if rec.extracted_data:
            try:
                ext_data = json.loads(rec.extracted_data) if isinstance(rec.extracted_data, str) else rec.extracted_data
            except Exception:
                ext_data = {}

        raw_text = rec.extracted_text or rec.description or f"{rec.title}\n{rec.category}"
        summary_result = document_processor.generate_document_summary(
            raw_text=raw_text,
            extracted_data=ext_data,
            title=rec.title,
            category=rec.category
        )

        rec.summary_quick = summary_result.get("quick_summary")
        rec.summary_detailed = summary_result.get("detailed_summary")
        rec.summary_structured = json.dumps(summary_result.get("structured_summary", {}))
        rec.summary_status = "GENERATED"
        rec.summary_version = (rec.summary_version or 1) + (1 if force_regenerate else 0)
        rec.summary_generated_at = datetime.now(timezone.utc)

        audit = []
        if rec.audit_log:
            try: audit = json.loads(rec.audit_log)
            except Exception: pass
        audit.append({
            "action": "SUMMARY_REGENERATED" if force_regenerate else "SUMMARY_GENERATED",
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "details": f"AI report summary v{rec.summary_version} generated for this specific record."
        })
        rec.audit_log = json.dumps(audit)

        db.commit()
        db.refresh(rec)

        return {
            "record_id": rec.id,
            "summary_quick": rec.summary_quick,
            "summary_detailed": rec.summary_detailed,
            "summary_structured": summary_result.get("structured_summary", {}),
            "summary_status": rec.summary_status,
            "summary_version": rec.summary_version,
            "summary_generated_at": rec.summary_generated_at.isoformat()
        }

    @staticmethod
    def mark_clinician_reviewed(
        record_id: str,
        patient_id: str,
        clinician_notes: Optional[str],
        db: Session
    ) -> MedicalRecordResponse:
        rec = RecordService.get_record_by_id(record_id, patient_id, db)
        rec.clinician_review_status = "CLINICIAN_REVIEWED"

        audit = []
        if rec.audit_log:
            try: audit = json.loads(rec.audit_log)
            except Exception: pass
        audit.append({
            "action": "CLINICIAN_REVIEWED",
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "details": f"Attending clinician reviewed and verified report. Notes: {clinician_notes or 'None'}"
        })
        rec.audit_log = json.dumps(audit)

        db.commit()
        db.refresh(rec)
        return RecordService._to_response(rec)

    @staticmethod
    def get_session_summary(patient_id: str, session_name: str, db: Session) -> Dict[str, Any]:
        """
        Generates combined summary for all reports in a specific session.
        """
        records = db.query(MedicalRecord).filter(
            MedicalRecord.patient_id == patient_id,
            MedicalRecord.session_name == session_name,
            MedicalRecord.is_deleted == False
        ).all()

        records_payload = []
        for r in records:
            ext = {}
            if r.extracted_data:
                try: ext = json.loads(r.extracted_data)
                except Exception: pass
            records_payload.append({
                "title": r.title,
                "category": r.category,
                "extracted_data": ext
            })

        return document_processor.generate_session_summary(session_name, records_payload)

    @staticmethod
    def approve_extraction(record_id: str, patient_id: str, db: Session) -> MedicalRecordResponse:
        rec = RecordService.get_record_by_id(record_id, patient_id, db)
        rec.approval_status = "APPROVED"

        audit = []
        if rec.audit_log:
            try: audit = json.loads(rec.audit_log)
            except Exception: pass
        audit.append({
            "action": "APPROVED",
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "details": "Patient verified and approved structured clinical parameters"
        })
        rec.audit_log = json.dumps(audit)

        db.commit()
        db.refresh(rec)
        return RecordService._to_response(rec)

    @staticmethod
    def reject_extraction(record_id: str, patient_id: str, db: Session) -> MedicalRecordResponse:
        rec = RecordService.get_record_by_id(record_id, patient_id, db)
        rec.approval_status = "REJECTED"

        audit = []
        if rec.audit_log:
            try: audit = json.loads(rec.audit_log)
            except Exception: pass
        audit.append({
            "action": "REJECTED",
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "details": "Patient rejected automatic AI parameter extraction"
        })
        rec.audit_log = json.dumps(audit)

        db.commit()
        db.refresh(rec)
        return RecordService._to_response(rec)

    @staticmethod
    def get_parameter_trends(
        patient_id: str,
        parameter_name: str,
        db: Session
    ) -> ParameterTrendResponse:
        """
        Retrieves chronological trend time-series for any medical parameter across the patient's reports.
        """
        RecordService.ensure_default_patient_records(patient_id, db)
        target = parameter_name.strip().lower().replace(" ", "_")

        records = db.query(MedicalRecord).filter(
            MedicalRecord.patient_id == patient_id,
            MedicalRecord.is_deleted == False
        ).order_by(asc(MedicalRecord.created_at)).all()

        points: List[ParameterTrendItem] = []
        unit = None
        display_name = target.replace("_", " ").title()
        category = "GENERAL"

        dict_match = lookup_parameter(target)
        if dict_match:
            display_name = dict_match[1]["display_name"]
            category = dict_match[1]["category"]

        for r in records:
            if not r.extracted_data:
                continue
            try:
                data = json.loads(r.extracted_data)
                for p in data.get("parameters", []):
                    p_key = p.get("parameter_name", "").lower().replace(" ", "_")
                    if p_key == target or target in p_key or p_key in target:
                        if not unit and p.get("unit"):
                            unit = p.get("unit")
                        points.append(ParameterTrendItem(
                            record_id=r.id,
                            record_title=r.title,
                            date=r.record_date or r.created_at.strftime("%d %b %Y"),
                            value=str(p.get("value")),
                            numeric_value=p.get("numeric_value"),
                            unit=p.get("unit"),
                            reference_range=p.get("reference_range"),
                            status=p.get("status", "NORMAL")
                        ))
            except Exception:
                continue

        return ParameterTrendResponse(
            parameter_name=target,
            display_name=display_name,
            unit=unit,
            category=category,
            trend_points=points
        )

    @staticmethod
    def compare_reports(
        patient_id: str,
        record_id_1: str,
        record_id_2: str,
        db: Session
    ) -> ReportCompareResponse:
        """
        Compares two medical reports side-by-side and computes parameter deltas.
        """
        r1 = RecordService.get_record_by_id(record_id_1, patient_id, db)
        r2 = RecordService.get_record_by_id(record_id_2, patient_id, db)

        d1 = json.loads(r1.extracted_data) if r1.extracted_data else {}
        d2 = json.loads(r2.extracted_data) if r2.extracted_data else {}

        params1: Dict[str, Dict[str, Any]] = {p.get("parameter_name", ""): p for p in d1.get("parameters", [])}
        params2: Dict[str, Dict[str, Any]] = {p.get("parameter_name", ""): p for p in d2.get("parameters", [])}

        all_keys = list(dict.fromkeys(list(params1.keys()) + list(params2.keys())))
        compared_items: List[ComparedParameterItem] = []

        for k in all_keys:
            if not k:
                continue
            p1 = params1.get(k)
            p2 = params2.get(k)

            disp = (p1.get("display_name") if p1 else None) or (p2.get("display_name") if p2 else k.title())
            cat = (p1.get("category") if p1 else None) or (p2.get("category") if p2 else "GENERAL")
            u = (p1.get("unit") if p1 else None) or (p2.get("unit") if p2 else None)
            ref = (p1.get("reference_range") if p1 else None) or (p2.get("reference_range") if p2 else None)

            num1 = p1.get("numeric_value") if p1 else None
            num2 = p2.get("numeric_value") if p2 else None

            delta = None
            delta_text = None
            if num1 is not None and num2 is not None:
                delta = round(num2 - num1, 2)
                sign = "+" if delta > 0 else ""
                delta_text = f"{sign}{delta} {u or ''}".strip()
            elif p1 and not p2:
                delta_text = "Not in comparison report"
            elif p2 and not p1:
                delta_text = "New parameter in report 2"

            compared_items.append(ComparedParameterItem(
                parameter_name=k,
                display_name=disp,
                category=cat,
                unit=u,
                value_1=str(p1.get("value")) if p1 else None,
                numeric_value_1=num1,
                status_1=p1.get("status") if p1 else None,
                value_2=str(p2.get("value")) if p2 else None,
                numeric_value_2=num2,
                status_2=p2.get("status") if p2 else None,
                reference_range=ref,
                delta=delta,
                delta_text=delta_text
            ))

        return ReportCompareResponse(
            report_1_id=r1.id,
            report_1_title=r1.title,
            report_1_date=r1.record_date or r1.created_at.strftime("%d %b %Y"),
            report_2_id=r2.id,
            report_2_title=r2.title,
            report_2_date=r2.record_date or r2.created_at.strftime("%d %b %Y"),
            parameters=compared_items
        )

    @staticmethod
    def explain_report(record_id: str, patient_id: str, db: Session) -> ExplainReportResponse:
        """
        Provides AI layman explanations of the medical terms and parameters in the report.
        """
        rec = RecordService.get_record_by_id(record_id, patient_id, db)
        extracted = json.loads(rec.extracted_data) if rec.extracted_data else {}
        explanation = document_processor.explain_report(extracted)

        return ExplainReportResponse(
            record_id=rec.id,
            title=rec.title,
            explanation_markdown=explanation
        )

    @staticmethod
    def get_timeline(patient_id: str, db: Session) -> List[TimelineItemResponse]:
        items: List[TimelineItemResponse] = []

        records = db.query(MedicalRecord).filter(
            MedicalRecord.patient_id == patient_id,
            MedicalRecord.is_deleted == False
        ).all()
        for r in records:
            items.append(TimelineItemResponse(
                id=r.id,
                source_type="UPLOADED_RECORD",
                title=r.title,
                subtitle=f"{r.category} • {r.session_name}",
                date=r.created_at.strftime("%d %b %Y"),
                time=r.created_at.strftime("%I:%M %p"),
                status=r.approval_status,
                preview=r.description or f"Document: {r.file_name}",
                metadata={"file_name": r.file_name, "file_type": r.file_type}
            ))

        convs = db.query(AIConversation).filter(
            AIConversation.patient_id == patient_id,
            AIConversation.is_deleted == False
        ).all()
        for c in convs:
            is_voice = "voice" in c.title.lower()
            items.append(TimelineItemResponse(
                id=c.id,
                source_type="VOICE_CONSULTATION" if is_voice else "AI_CONVERSATION",
                title=c.title,
                subtitle="Hands-Free Voice Session" if is_voice else "Pre-Consultation Dialogue",
                date=c.created_at.strftime("%d %b %Y"),
                time=c.created_at.strftime("%I:%M %p"),
                status=c.consultation_state,
                preview=c.summary_preview or "Clinical consultation dialogue recorded.",
                metadata={"consultation_state": c.consultation_state}
            ))

        items.sort(key=lambda x: x.date + x.time, reverse=True)
        return items

    @staticmethod
    def generate_comprehensive_summary(
        patient_id: str,
        payload: ComprehensiveSummaryRequest,
        db: Session
    ) -> Dict[str, Any]:
        patient = db.query(Patient).filter(Patient.id == patient_id).first()
        user = db.query(User).filter(User.id == patient.user_id).first() if patient else None
        patient_name = user.name if user else "Patient"

        conv_summaries = []
        if payload.include_ai_history or payload.include_voice_history:
            q_conv = db.query(AIConversation).filter(
                AIConversation.patient_id == patient_id,
                AIConversation.is_deleted == False
            )
            if payload.conversation_ids:
                q_conv = q_conv.filter(AIConversation.id.in_(payload.conversation_ids))
            for c in q_conv.limit(10).all():
                conv_summaries.append(f"• **{c.title}** ({c.created_at.strftime('%d %b %Y')}): {c.summary_preview or 'Consultation notes recorded.'}")

        doc_summaries = []
        if payload.include_uploaded_records:
            q_rec = db.query(MedicalRecord).filter(
                MedicalRecord.patient_id == patient_id,
                MedicalRecord.is_deleted == False
            )
            if payload.record_ids:
                q_rec = q_rec.filter(MedicalRecord.id.in_(payload.record_ids))
            for r in q_rec.limit(10).all():
                doc_summaries.append(f"• **{r.title}** ({r.category} - {r.record_date}): {r.description or 'Document on file.'} (Status: {r.approval_status})")

        date_range_str = f"{payload.date_from or 'Recent'} to {payload.date_to or 'Today'}"
        report_md = f"""# MediAssist Doctor-Readable Pre-Consultation Summary

**Patient:** {patient_name}  
**Period:** {date_range_str}  
**Status:** Multi-Source Clinical Digest (AI + Voice + Uploaded Reports)  

---

### 1. Key Patient-Reported Inquiries & Voice Sessions ({len(conv_summaries)} items)
{chr(10).join(conv_summaries) if conv_summaries else "• No active conversation logs in selected range."}

### 2. Verified Diagnostic & Laboratory Records ({len(doc_summaries)} items)
{chr(10).join(doc_summaries) if doc_summaries else "• No uploaded medical reports in selected range."}

### 3. Physician Action Plan
Review patient-reported symptoms, check verified lab values, and perform targeted physical examination during consultation.

*Source: Patient-authorized records from MediAssist Central Information Layer.*
"""

        return {
            "status": "success",
            "patient_name": patient_name,
            "period": date_range_str,
            "summary_markdown": report_md
        }

    @staticmethod
    def get_record_by_id(record_id: str, patient_id: str, db: Session) -> MedicalRecord:
        rec = db.query(MedicalRecord).filter(
            MedicalRecord.id == record_id,
            MedicalRecord.patient_id == patient_id
        ).first()

        if not rec:
            raise AppException(status_code=status.HTTP_404_NOT_FOUND, message="Medical record not found.")
        return rec

    @staticmethod
    def soft_delete(record_id: str, patient_id: str, db: Session) -> Dict[str, Any]:
        rec = RecordService.get_record_by_id(record_id, patient_id, db)
        rec.is_deleted = True
        rec.deleted_at = datetime.now(timezone.utc)
        db.commit()
        return {"success": True, "message": "Record moved to trash successfully.", "record_id": record_id}

    @staticmethod
    def restore(record_id: str, patient_id: str, db: Session) -> MedicalRecordResponse:
        rec = RecordService.get_record_by_id(record_id, patient_id, db)
        rec.is_deleted = False
        rec.deleted_at = None
        db.commit()
        db.refresh(rec)
        return RecordService._to_response(rec)

    @staticmethod
    def permanent_delete(record_id: str, patient_id: str, db: Session) -> Dict[str, Any]:
        rec = RecordService.get_record_by_id(record_id, patient_id, db)
        if rec.file_path and os.path.exists(rec.file_path):
            try:
                os.remove(rec.file_path)
            except Exception:
                pass
        db.delete(rec)
        db.commit()
        return {"success": True, "message": "Record permanently deleted.", "record_id": record_id}

    @staticmethod
    def get_trash_records(patient_id: str, db: Session) -> List[MedicalRecordResponse]:
        records = db.query(MedicalRecord).filter(
            MedicalRecord.patient_id == patient_id,
            MedicalRecord.is_deleted == True
        ).order_by(desc(MedicalRecord.deleted_at)).all()
        return [RecordService._to_response(r) for r in records]

record_service = RecordService()
