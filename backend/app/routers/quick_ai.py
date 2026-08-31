import re
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.database.models import User, Patient
from app.models.ai_conversation import AIConversation, AIMessage
from app.core.dependencies import get_current_patient, get_current_user
from app.services.ai.ai_orchestrator import ai_orchestrator

router = APIRouter(prefix="/ai", tags=["Quick AI Assistant"])

class QuickAIMessageRequest(BaseModel):
    message: str
    context: Optional[str] = None

class QuickAIAction(BaseModel):
    label: str
    route: str

class QuickAIMessageResponse(BaseModel):
    message: str
    action: Optional[QuickAIAction] = None
    suggested_questions: Optional[List[str]] = None

@router.post("/quick-chat", response_model=QuickAIMessageResponse)
def quick_chat(
    req: QuickAIMessageRequest,
    current_patient: Patient = Depends(get_current_patient),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Lightweight floating Quick AI Assistant endpoint using centralized AI Orchestrator.
    Naturally routes between casual chat, portal features, and pre-consultation triage.
    """
    if not req.message.strip():
        raise HTTPException(status_code=400, detail="Message cannot be empty")

    # Find or create a default quick-chat conversation for the patient
    quick_conv = db.query(AIConversation).filter(
        AIConversation.patient_id == current_patient.id,
        AIConversation.title == "Quick AI Chat",
        AIConversation.is_deleted == False
    ).order_by(AIConversation.updated_at.desc()).first()

    if not quick_conv:
        quick_conv = AIConversation(
            patient_id=current_patient.id,
            title="Quick AI Chat",
            consultation_state="IN_PROGRESS",
            summary_preview="Quick AI session"
        )
        db.add(quick_conv)
        db.commit()
        db.refresh(quick_conv)

    result = ai_orchestrator.generate_chat_response(
        conversation_id=quick_conv.id,
        user_message=req.message,
        patient_id=current_patient.id,
        db=db
    )

    action_obj = None
    if result.get("action"):
        action_obj = QuickAIAction(
            label=result["action"]["label"],
            route=result["action"]["route"]
        )

    return QuickAIMessageResponse(
        message=result["text"],
        action=action_obj,
        suggested_questions=[
            "What is my next appointment?",
            "What are my current medicines?",
            "How do I upload a medical record?"
        ]
    )
