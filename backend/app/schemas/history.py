from typing import Optional, List, Dict, Any
from pydantic import BaseModel

class ClinicalHistoryResponse(BaseModel):
    id: str
    patient_id: str
    consultation_id: Optional[str] = None
    chief_complaint: Optional[str] = None
    history_of_present_illness: Optional[str] = None
    past_history: Optional[str] = None
    medications: Optional[List[Dict[str, Any]]] = []
    allergies: Optional[List[Dict[str, Any]]] = []
    family_history: Optional[str] = None
    personal_history: Optional[str] = None
    review_of_systems: Optional[Dict[str, Any]] = {}
    provenance: Optional[List[Dict[str, Any]]] = []
    generated_at: str
    updated_at: str

class ClinicalHistoryUpdate(BaseModel):
    chief_complaint: Optional[str] = None
    history_of_present_illness: Optional[str] = None
    past_history: Optional[str] = None
    medications: Optional[List[Dict[str, Any]]] = None
    allergies: Optional[List[Dict[str, Any]]] = None
