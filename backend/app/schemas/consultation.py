from typing import Optional, List, Dict, Any
from pydantic import BaseModel

class StartConsultationRequest(BaseModel):
    language: Optional[str] = "en"

class ChiefComplaintRequest(BaseModel):
    complaint: str
    original_text: Optional[str] = None

class SubmitAnswerRequest(BaseModel):
    question_id: str
    input_method: Optional[str] = "TEXT"  # TEXT, VOICE, TOUCH
    answer_text: str
    structured_value: Optional[Dict[str, Any]] = None

class QuestionResponse(BaseModel):
    question_id: str
    question: str
    type: str  # TEXT, SINGLE_CHOICE, MULTI_CHOICE, YES_NO
    options: List[str] = []
    allow_voice: bool = True
    completed: bool = False

class ConsultationReviewResponse(BaseModel):
    consultation_id: str
    status: str
    chief_complaint: Optional[str] = None
    answers: List[Dict[str, Any]] = []
    extracted_clinical_info: Dict[str, Any] = {}

class PatientCorrectionRequest(BaseModel):
    field_name: str
    corrected_value: Any
