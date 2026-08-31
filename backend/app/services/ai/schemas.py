from typing import Optional, List, Dict
from pydantic import BaseModel, Field

class QuestionSchema(BaseModel):
    text: str = Field(description="Patient-friendly question text in requested language")
    type: str = Field(description="Question type: TEXT, SINGLE_CHOICE, MULTI_CHOICE, YES_NO")
    options: List[str] = Field(default_factory=list, description="Choice options if SINGLE_CHOICE or MULTI_CHOICE")
    clinical_domain: str = Field(description="Clinical domain: ONSET, DURATION, LOCATION, SEVERITY, CHARACTER, ASSOCIATED_SYMPTOMS")

class NextQuestionResponseSchema(BaseModel):
    completed: bool = Field(description="True if sufficient clinical history has been collected")
    question: Optional[QuestionSchema] = Field(default=None, description="Next adaptive question if not completed")
    reason: Optional[str] = Field(default=None, description="Explanation for completing or continuing")

class RedFlagItemSchema(BaseModel):
    category: str = Field(description="Emergency category: CHEST_PAIN_RED_FLAG, NEURO_RED_FLAG, RESPIRATORY_RED_FLAG, ANAPHYLAXIS")
    severity: str = Field(description="Severity rating: HIGH, CRITICAL")
    reason: str = Field(description="Reason for triggering red flag emergency warning")

class RedFlagAnalysisResponseSchema(BaseModel):
    detected: bool = Field(description="True if emergency red flags are detected")
    severity: Optional[str] = Field(default="LOW", description="Overall severity")
    red_flags: List[RedFlagItemSchema] = Field(default_factory=list)
    recommended_action: Optional[str] = Field(default=None, description="Patient safety guidance")

class ClinicalHistoryResponseSchema(BaseModel):
    chief_complaint: str = Field(description="Main symptom reported by patient")
    history_of_present_illness: str = Field(description="Chronological summary of symptom onset, location, severity, duration, and associated factors")
    past_history: str = Field(description="Known past medical history or 'No known chronic conditions'")
    medications: List[Dict[str, str]] = Field(default_factory=list, description="Active medications reported")
    allergies: List[Dict[str, str]] = Field(default_factory=list, description="Reported allergies")
    family_history: str = Field(description="Family medical history")
    personal_history: str = Field(description="Personal lifestyle/social history")
    review_of_systems: Dict[str, str] = Field(default_factory=dict, description="Systematic review of body systems")
