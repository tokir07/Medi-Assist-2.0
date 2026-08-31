from typing import Optional
from pydantic import BaseModel

class VoiceSessionResponse(BaseModel):
    session_id: str
    consultation_id: str
    language: str
    status: str

class TranscribeRequest(BaseModel):
    audio_base64: Optional[str] = None
    language: Optional[str] = "en"

class TranscribeResponse(BaseModel):
    success: bool = True
    transcript: str
    consultation_id: str
    confidence: Optional[float] = 0.95
    duration_seconds: Optional[float] = None
