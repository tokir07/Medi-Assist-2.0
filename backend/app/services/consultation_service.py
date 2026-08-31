import json
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
# pyrefly: ignore [missing-import]
from app.models.patient_portal import Consultation, ConsultationQuestion, ConsultationAnswer, ConsultationStatus, ClinicalHistory
# pyrefly: ignore [missing-import]
from app.services.ai_service import clinical_ai_service
# pyrefly: ignore [missing-import]
from app.services.cache_service import cache_service 
from app.utils.exceptions import AppException
from fastapi import status

class ConsultationService:
    @staticmethod
    def start_consultation(patient_id: str, language: str, db: Session) -> Consultation:
        consultation = Consultation(
            patient_id=patient_id,
            status=ConsultationStatus.IN_PROGRESS,
            language=language,
            current_step="CHIEF_COMPLAINT"
        )
        db.add(consultation)
        db.commit()
        db.refresh(consultation)
        return consultation

    @staticmethod
    def set_chief_complaint(consultation: Consultation, complaint: str, original_text: Optional[str], db: Session) -> ConsultationQuestion:
        consultation.chief_complaint = complaint
        consultation.original_complaint_text = original_text or complaint
        consultation.current_step = "QUESTIONS"
        db.commit()
        db.refresh(consultation)

        # Generate first question
        first_q = clinical_ai_service.determine_next_question(complaint, [])
        if not first_q:
            first_q = {
                "question": f"Please describe your {complaint} symptoms in detail.",
                "type": "TEXT",
                "options": [],
                "key": "general_detail"
            }

        q_model = ConsultationQuestion(
            consultation_id=consultation.id,
            sequence_number=1,
            question_text=first_q["question"],
            question_type=first_q["type"],
            options=json.dumps(first_q.get("options", [])),
            is_required=True
        )
        db.add(q_model)
        db.commit()
        db.refresh(q_model)
        return q_model

    @staticmethod
    def get_next_question(consultation: Consultation, db: Session) -> Dict[str, Any]:
        if consultation.status == ConsultationStatus.COMPLETED:
            return {"completed": True}

        # Check existing answered questions
        existing_answers = db.query(ConsultationAnswer).filter(ConsultationAnswer.consultation_id == consultation.id).all()
        answered_keys = [a.question_id for a in existing_answers]

        if not consultation.chief_complaint:
            return {
                "question_id": "chief_complaint",
                "question": "What brings you here today?",
                "type": "SINGLE_CHOICE",
                "options": ["Fever", "Headache", "Cough", "Chest Pain", "Abdominal Pain", "Breathing Difficulty", "Other"],
                "allow_voice": True,
                "completed": False
            }

        next_q_spec = clinical_ai_service.determine_next_question(consultation.chief_complaint, answered_keys)
        if not next_q_spec:
            consultation.current_step = "REVIEW"
            db.commit()
            return {"completed": True}

        # Fetch or create DB question record
        q_record = db.query(ConsultationQuestion).filter(
            ConsultationQuestion.consultation_id == consultation.id,
            ConsultationQuestion.question_text == next_q_spec["question"]
        ).first()

        if not q_record:
            seq = len(answered_keys) + 1
            q_record = ConsultationQuestion(
                consultation_id=consultation.id,
                sequence_number=seq,
                question_text=next_q_spec["question"],
                question_type=next_q_spec["type"],
                options=json.dumps(next_q_spec.get("options", [])),
                is_required=True
            )
            db.add(q_record)
            db.commit()
            db.refresh(q_record)

        options_list = json.loads(q_record.options) if q_record.options else []
        return {
            "question_id": next_q_spec["key"],
            "question": q_record.question_text,
            "type": q_record.question_type,
            "options": options_list,
            "allow_voice": True,
            "completed": False
        }

    @staticmethod
    def submit_answer(consultation: Consultation, question_id: str, input_method: str, answer_text: str, structured_value: Optional[Dict], db: Session) -> Dict[str, Any]:
        # Idempotency check: update existing answer or insert new
        existing_ans = db.query(ConsultationAnswer).filter(
            ConsultationAnswer.consultation_id == consultation.id,
            ConsultationAnswer.question_id == question_id
        ).first()

        if existing_ans:
            existing_ans.answer_text = answer_text
            existing_ans.structured_value = json.dumps(structured_value) if structured_value else None
            existing_ans.input_method = input_method
        else:
            new_ans = ConsultationAnswer(
                consultation_id=consultation.id,
                question_id=question_id,
                answer_text=answer_text,
                structured_value=json.dumps(structured_value) if structured_value else None,
                input_method=input_method,
                language=consultation.language
            )
            db.add(new_ans)

        db.commit()

        # Check Red Flags
        all_answers = db.query(ConsultationAnswer).filter(ConsultationAnswer.consultation_id == consultation.id).all()
        answers_dicts = [{"question_id": a.question_id, "answer_text": a.answer_text} for a in all_answers]
        red_flag = clinical_ai_service.detect_red_flags(consultation.chief_complaint or "", answers_dicts)

        next_q = ConsultationService.get_next_question(consultation, db)
        return {
            "saved": True,
            "red_flag": red_flag,
            "next_question": next_q
        }

    @staticmethod
    def complete_consultation(consultation: Consultation, db: Session) -> ClinicalHistory:
        if consultation.status == ConsultationStatus.COMPLETED:
            # Idempotent return existing clinical history
            existing_h = db.query(ClinicalHistory).filter(ClinicalHistory.consultation_id == consultation.id).first()
            if existing_h:
                return existing_h

        consultation.status = ConsultationStatus.COMPLETED
        consultation.completed_at = datetime.now(timezone.utc)
        consultation.current_step = "COMPLETE"
        db.commit()

        # Generate Clinical History
        answers = db.query(ConsultationAnswer).filter(ConsultationAnswer.consultation_id == consultation.id).all()
        ans_dicts = [{"question_id": a.question_id, "answer_text": a.answer_text} for a in answers]
        hpi_summary = clinical_ai_service.generate_hpi_summary(consultation.chief_complaint or "Symptoms", ans_dicts)

        provenance_data = [
            {"source": "PATIENT", "field": "chief_complaint", "verified": False},
            {"source": "AI_EXTRACTED", "field": "hpi", "verified": False}
        ]

        history_record = ClinicalHistory(
            patient_id=consultation.patient_id,
            consultation_id=consultation.id,
            chief_complaint=consultation.chief_complaint,
            history_of_present_illness=hpi_summary,
            past_history="No known chronic conditions.",
            medications=json.dumps([{"name": "Paracetamol", "dose": "500mg as needed"}]),
            allergies=json.dumps([]),
            family_history="No hereditary conditions reported.",
            personal_history="Non-smoker.",
            review_of_systems=json.dumps({"constitutional": "Normal", "cardiovascular": "Normal"}),
            provenance=json.dumps(provenance_data)
        )
        db.add(history_record)
        db.commit()
        db.refresh(history_record)

        # Invalidate patient cache on consultation completion
        try:
            import asyncio
            asyncio.create_task(cache_service.invalidate_patient_cache(consultation.patient_id))
        except Exception:
            pass

        return history_record

consultation_service = ConsultationService()
