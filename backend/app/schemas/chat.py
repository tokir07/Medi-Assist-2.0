from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, Field

class OpenConversationRequest(BaseModel):
    doctor_id: Optional[str] = None
    patient_id: Optional[str] = None

class SendMessageRequest(BaseModel):
    content: str = Field(..., min_length=1, max_length=5000, description="Message text content")
    message_type: Optional[str] = Field("TEXT", description="Type of message: TEXT or SYSTEM")

class ParticipantInfo(BaseModel):
    id: str
    user_id: Optional[str] = None
    name: str
    email: Optional[str] = None
    role: str  # PATIENT or DOCTOR
    image: Optional[str] = None
    specialty: Optional[str] = None  # For doctor
    hospital: Optional[str] = None   # For doctor
    phone: Optional[str] = None      # For patient

class ChatMessageResponse(BaseModel):
    id: str
    conversation_id: str
    sender_id: str
    sender_role: str  # PATIENT, DOCTOR, SYSTEM
    content: str
    message_type: str
    is_read: bool
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class ChatConversationResponse(BaseModel):
    id: str
    patient_id: str
    doctor_id: str
    other_participant: ParticipantInfo
    last_message_preview: Optional[str] = None
    last_message_at: datetime
    unread_count: int = 0
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True

class ConversationMessagesResponse(BaseModel):
    conversation: ChatConversationResponse
    messages: List[ChatMessageResponse]
