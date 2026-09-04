import json
import logging
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session, joinedload
from pydantic import BaseModel

from app.database.database import get_db
from app.models.ai_conversation import AIConversation, AIMessage, AISummary
from app.models.patient_portal import VoiceSession, VoiceMessage, VoiceSessionStatus
from app.database.models import Patient
from app.core.dependencies import get_current_patient, get_current_user
from app.services.ai.ai_orchestrator import ai_orchestrator, MEDIASSIST_SYSTEM_PROMPT
from app.services.ai.openrouter_service import OpenRouterClinicalAIService

openrouter_service = OpenRouterClinicalAIService()

logger = logging.getLogger("mediassist.ai.router")

router = APIRouter(prefix="/ai", tags=["AI Assistant"])

# Schemas
class CreateConversationRequest(BaseModel):
    title: Optional[str] = "Health Consultation"
    initial_message: Optional[str] = None

class SendMessageRequest(BaseModel):
    message: str

class CorrectContextRequest(BaseModel):
    corrections: Dict[str, Any]

class GenerateSummaryRequest(BaseModel):
    conversation_ids: Optional[List[str]] = []
    date_from: str
    date_to: str
    summary_type: Optional[str] = "clinical"

class ShareSummaryRequest(BaseModel):
    doctor_id: Optional[str] = None

@router.get("/conversations")
def get_conversations(
    search: Optional[str] = None,
    filter_date: Optional[str] = None,
    current_patient: Patient = Depends(get_current_patient),
    db: Session = Depends(get_db)
):
    query = db.query(AIConversation).options(joinedload(AIConversation.messages)).filter(
        AIConversation.patient_id == current_patient.id,
        AIConversation.is_deleted == False
    )

    if search:
        search_fmt = f"%{search}%"
        query = query.filter(
            (AIConversation.title.ilike(search_fmt)) |
            (AIConversation.summary_preview.ilike(search_fmt))
        )

    conversations = query.order_by(AIConversation.updated_at.desc()).all()
    
    # If no conversations exist, auto-create a clean initial consultation
    if not conversations and not search:
        default_conv = AIConversation(
            patient_id=current_patient.id,
            title="General Health Consultation",
            consultation_state="IN_PROGRESS",
            summary_preview="Hi! I'm MediAssist AI. How can I help you today?"
        )
        db.add(default_conv)
        db.commit()
        db.refresh(default_conv)
        
        default_msg = AIMessage(
            conversation_id=default_conv.id,
            sender_role="ai",
            content="Hi! I'm MediAssist AI 👋 How can I help you with your symptoms, health routines, or appointments today?",
            message_type="text"
        )
        db.add(default_msg)
        db.commit()
        conversations = [default_conv]

    result = []
    for c in conversations:
        msgs = sorted(c.messages, key=lambda m: m.created_at) if c.messages else []
        formatted_msgs = []
        for m in msgs:
            formatted_msgs.append({
                "id": m.id,
                "sender": m.sender_role,
                "text": m.content,
                "message_type": m.message_type or "text",
                "structured_payload": json.loads(m.structured_payload) if m.structured_payload else None,
                "timestamp": m.created_at.strftime("%I:%M %p") if m.created_at else "",
                "action": json.loads(m.action_data) if m.action_data else None,
                "model": m.model,
                "liked": m.liked
            })

        result.append({
            "id": c.id,
            "title": c.title,
            "status": c.status,
            "consultation_state": c.consultation_state or "IN_PROGRESS",
            "structured_context": json.loads(c.structured_context) if c.structured_context else None,
            "clinical_summary": c.clinical_summary,
            "snippet": c.summary_preview or (msgs[-1].content[:60] if msgs else "No messages yet"),
            "timestamp": c.updated_at.strftime("%d %b, %I:%M %p") if c.updated_at else "",
            "is_pinned": c.is_pinned,
            "messages": formatted_msgs
        })

    return result

@router.post("/conversations")
def create_conversation(
    payload: CreateConversationRequest,
    current_patient: Patient = Depends(get_current_patient),
    db: Session = Depends(get_db)
):
    conv = AIConversation(
        patient_id=current_patient.id,
        title=payload.title or "New Consultation",
        consultation_state="IN_PROGRESS",
        summary_preview="Conversation started"
    )
    db.add(conv)
    db.commit()
    db.refresh(conv)

    welcome_msg = AIMessage(
        conversation_id=conv.id,
        sender_role="ai",
        content="Hello! How can I assist you with your symptoms, medications, or appointments today?",
        message_type="text"
    )
    db.add(welcome_msg)
    db.commit()

    return {
        "id": conv.id,
        "title": conv.title,
        "consultation_state": "IN_PROGRESS",
        "snippet": "Conversation started",
        "timestamp": conv.created_at.strftime("%d %b, %I:%M %p"),
        "messages": [{
            "id": welcome_msg.id,
            "sender": "ai",
            "text": welcome_msg.content,
            "message_type": "text",
            "timestamp": welcome_msg.created_at.strftime("%I:%M %p")
        }]
    }

@router.get("/conversations/{conversation_id}")
def get_conversation_details(
    conversation_id: str,
    current_patient: Patient = Depends(get_current_patient),
    db: Session = Depends(get_db)
):
    conv = db.query(AIConversation).filter(
        AIConversation.id == conversation_id,
        AIConversation.patient_id == current_patient.id,
        AIConversation.is_deleted == False
    ).first()

    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")

    msgs = db.query(AIMessage).filter(AIMessage.conversation_id == conv.id).order_by(AIMessage.created_at.asc()).all()

    return {
        "id": conv.id,
        "title": conv.title,
        "consultation_state": conv.consultation_state or "IN_PROGRESS",
        "structured_context": json.loads(conv.structured_context) if conv.structured_context else None,
        "clinical_summary": conv.clinical_summary,
        "snippet": conv.summary_preview,
        "timestamp": conv.updated_at.strftime("%d %b, %I:%M %p"),
        "messages": [
            {
                "id": m.id,
                "sender": m.sender_role,
                "text": m.content,
                "message_type": m.message_type or "text",
                "structured_payload": json.loads(m.structured_payload) if m.structured_payload else None,
                "timestamp": m.created_at.strftime("%I:%M %p") if m.created_at else "",
                "action": json.loads(m.action_data) if m.action_data else None,
                "model": m.model,
                "liked": m.liked
            }
            for m in msgs
        ]
    }

@router.post("/conversations/{conversation_id}/messages")
def send_message(
    conversation_id: str,
    payload: SendMessageRequest,
    current_patient: Patient = Depends(get_current_patient),
    db: Session = Depends(get_db)
):
    if not payload.message.strip():
        raise HTTPException(status_code=400, detail="Message content cannot be empty")

    conv = db.query(AIConversation).filter(
        AIConversation.id == conversation_id,
        AIConversation.patient_id == current_patient.id,
        AIConversation.is_deleted == False
    ).first()

    if not conv:
        conv = AIConversation(
            id=conversation_id,
            patient_id=current_patient.id,
            title=payload.message[:45],
            consultation_state="IN_PROGRESS"
        )
        db.add(conv)
        db.commit()

    response_data = ai_orchestrator.generate_chat_response(
        conversation_id=conv.id,
        user_message=payload.message,
        patient_id=current_patient.id,
        db=db
    )

    return response_data

@router.post("/conversations/{conversation_id}/stream")
def stream_message(
    conversation_id: str,
    payload: SendMessageRequest,
    current_patient: Patient = Depends(get_current_patient),
    db: Session = Depends(get_db)
):
    if not payload.message.strip():
        raise HTTPException(status_code=400, detail="Message content cannot be empty")

    conv = db.query(AIConversation).filter(
        AIConversation.id == conversation_id,
        AIConversation.patient_id == current_patient.id,
        AIConversation.is_deleted == False
    ).first()

    if not conv:
        conv = AIConversation(
            id=conversation_id,
            patient_id=current_patient.id,
            title=payload.message[:45],
            consultation_state="IN_PROGRESS"
        )
        db.add(conv)
        db.commit()

    # Save user message
    user_msg = AIMessage(
        conversation_id=conv.id,
        sender_role="user",
        content=payload.message,
        message_type="text"
    )
    db.add(user_msg)
    db.commit()

    # Load context messages trimmed to last 10 messages
    recent_msgs = db.query(AIMessage).filter(
        AIMessage.conversation_id == conv.id
    ).order_by(AIMessage.created_at.desc()).limit(10).all()
    recent_msgs.reverse()

    chat_messages = [{"role": "system", "content": MEDIASSIST_SYSTEM_PROMPT}]
    for m in recent_msgs:
        chat_messages.append({
            "role": "user" if m.sender_role == "user" else "assistant",
            "content": m.content
        })

    def event_generator():
        collected_tokens = []
        for sse_event in openrouter_service.stream_chat_completion(chat_messages):
            if sse_event.startswith("data: {"):
                try:
                    payload_json = json.loads(sse_event[6:].strip())
                    if "content" in payload_json:
                        collected_tokens.append(payload_json["content"])
                except Exception:
                    pass
            yield sse_event

        full_content = "".join(collected_tokens).strip() or "I have processed your request."
        ai_msg = AIMessage(
            conversation_id=conv.id,
            sender_role="ai",
            content=full_content,
            message_type="text"
        )
        db.add(ai_msg)
        conv.summary_preview = full_content[:60]
        db.commit()

    return StreamingResponse(event_generator(), media_type="text/event-stream")

@router.post("/conversations/{conversation_id}/correct")
def correct_consultation_context(
    conversation_id: str,
    payload: CorrectContextRequest,
    current_patient: Patient = Depends(get_current_patient),
    db: Session = Depends(get_db)
):
    updated_context = ai_orchestrator.correct_consultation_context(
        conversation_id=conversation_id,
        patient_id=current_patient.id,
        corrections=payload.corrections,
        db=db
    )
    return {"status": "success", "structured_context": updated_context}

@router.post("/conversations/{conversation_id}/confirm")
def confirm_consultation(
    conversation_id: str,
    current_patient: Patient = Depends(get_current_patient),
    db: Session = Depends(get_db)
):
    result = ai_orchestrator.confirm_and_generate_clinical_history(
        conversation_id=conversation_id,
        patient_id=current_patient.id,
        db=db
    )
    return result

@router.delete("/conversations/{conversation_id}")
def delete_conversation(
    conversation_id: str,
    current_patient: Patient = Depends(get_current_patient),
    db: Session = Depends(get_db)
):
    conv = db.query(AIConversation).filter(
        AIConversation.id == conversation_id,
        AIConversation.patient_id == current_patient.id
    ).first()

    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")

    conv.is_deleted = True
    db.commit()

    return {"status": "success", "message": "Conversation deleted successfully"}

# ----------------- Summaries & Doctor Reports ----------------- #

@router.post("/summaries")
def generate_summary(
    payload: GenerateSummaryRequest,
    current_patient: Patient = Depends(get_current_patient),
    db: Session = Depends(get_db)
):
    summary = ai_orchestrator.generate_clinical_summary(
        patient_id=current_patient.id,
        conversation_ids=payload.conversation_ids or [],
        date_from=payload.date_from,
        date_to=payload.date_to,
        db=db
    )

    return {
        "id": summary.id,
        "title": summary.title,
        "date_from": summary.date_from,
        "date_to": summary.date_to,
        "conversations_count": summary.conversations_count,
        "main_concerns": json.loads(summary.main_concerns) if summary.main_concerns else [],
        "symptoms_mentioned": json.loads(summary.symptoms_mentioned) if summary.symptoms_mentioned else [],
        "medications_mentioned": json.loads(summary.medications_mentioned) if summary.medications_mentioned else [],
        "patient_questions": json.loads(summary.patient_questions) if summary.patient_questions else [],
        "ai_guidance": summary.ai_guidance,
        "follow_up_recommendations": summary.follow_up_recommendations,
        "unresolved_questions": summary.unresolved_questions,
        "doctor_readable_report": summary.doctor_readable_report,
        "created_at": summary.created_at.strftime("%d %b %Y, %I:%M %p")
    }

@router.get("/summaries")
def list_summaries(
    current_patient: Patient = Depends(get_current_patient),
    db: Session = Depends(get_db)
):
    summaries = db.query(AISummary).filter(
        AISummary.patient_id == current_patient.id
    ).order_by(AISummary.created_at.desc()).all()

    return [
        {
            "id": s.id,
            "title": s.title,
            "date_from": s.date_from,
            "date_to": s.date_to,
            "conversations_count": s.conversations_count,
            "main_concerns": json.loads(s.main_concerns) if s.main_concerns else [],
            "doctor_readable_report": s.doctor_readable_report,
            "is_shared_with_doctor": s.is_shared_with_doctor,
            "created_at": s.created_at.strftime("%d %b %Y, %I:%M %p") if s.created_at else ""
        }
        for s in summaries
    ]

@router.get("/summaries/{summary_id}")
def get_summary_details(
    summary_id: str,
    current_patient: Patient = Depends(get_current_patient),
    db: Session = Depends(get_db)
):
    s = db.query(AISummary).filter(
        AISummary.id == summary_id,
        AISummary.patient_id == current_patient.id
    ).first()

    if not s:
        raise HTTPException(status_code=404, detail="Summary not found")

    return {
        "id": s.id,
        "title": s.title,
        "date_from": s.date_from,
        "date_to": s.date_to,
        "conversations_count": s.conversations_count,
        "main_concerns": json.loads(s.main_concerns) if s.main_concerns else [],
        "symptoms_mentioned": json.loads(s.symptoms_mentioned) if s.symptoms_mentioned else [],
        "medications_mentioned": json.loads(s.medications_mentioned) if s.medications_mentioned else [],
        "patient_questions": json.loads(s.patient_questions) if s.patient_questions else [],
        "ai_guidance": s.ai_guidance,
        "follow_up_recommendations": s.follow_up_recommendations,
        "unresolved_questions": s.unresolved_questions,
        "doctor_readable_report": s.doctor_readable_report,
        "is_shared_with_doctor": s.is_shared_with_doctor,
        "created_at": s.created_at.strftime("%d %b %Y, %I:%M %p")
    }

@router.post("/summaries/{summary_id}/share")
def share_summary_with_doctor(
    summary_id: str,
    payload: ShareSummaryRequest,
    current_patient: Patient = Depends(get_current_patient),
    db: Session = Depends(get_db)
):
    s = db.query(AISummary).filter(
        AISummary.id == summary_id,
        AISummary.patient_id == current_patient.id
    ).first()

    if not s:
        raise HTTPException(status_code=404, detail="Summary not found")

    s.is_shared_with_doctor = True
    if payload.doctor_id:
        s.shared_with_doctor_id = payload.doctor_id
    db.commit()

    return {"status": "success", "message": "Clinical summary shared with attending doctor successfully"}

class VoiceChatRequest(BaseModel):
    conversation_id: Optional[str] = None
    transcript: str
    language: Optional[str] = "en"
    voice_turn_id: Optional[str] = None

@router.post("/voice/chat")
def process_voice_chat(
    payload: VoiceChatRequest,
    current_patient: Patient = Depends(get_current_patient),
    db: Session = Depends(get_db)
):
    """
    Unified voice chat endpoint: receives speech transcript, runs it through the
    centralized AI Orchestrator (Intent Router + Safety + PostgreSQL + OpenRouter),
    and returns speech-ready response text + navigation actions.
    """
    clean_transcript = (payload.transcript or "").strip()
    if not clean_transcript:
        raise HTTPException(status_code=400, detail="Voice transcript cannot be empty")

    conv_id = payload.conversation_id
    if conv_id:
        conv = db.query(AIConversation).filter(
            AIConversation.id == conv_id,
            AIConversation.patient_id == current_patient.id,
            AIConversation.is_deleted == False
        ).first()
        if not conv:
            conv_id = None

    if not conv_id:
        # Fetch most recent active conversation or create new one
        latest_conv = db.query(AIConversation).filter(
            AIConversation.patient_id == current_patient.id,
            AIConversation.is_deleted == False
        ).order_by(AIConversation.updated_at.desc()).first()

        if latest_conv:
            conv_id = latest_conv.id
        else:
            new_conv = AIConversation(
                patient_id=current_patient.id,
                title="Voice Consultation",
                consultation_state="IN_PROGRESS"
            )
            db.add(new_conv)
            db.commit()
            db.refresh(new_conv)
            conv_id = new_conv.id

    res = ai_orchestrator.generate_chat_response(
        conversation_id=conv_id,
        user_message=clean_transcript,
        patient_id=current_patient.id,
        db=db
    )

    # Prepare speech text (plain text without markdown bullets/asterisks for natural TTS)
    raw_text = res.get("text", "")
    speech_text = raw_text.replace("**", "").replace("•", "").replace("⚠️", "Caution:").strip()

    return {
        "id": res.get("id"),
        "conversation_id": conv_id,
        "transcript": clean_transcript,
        "response": raw_text,
        "speech_text": speech_text,
        "action": res.get("action"),
        "message_type": res.get("message_type"),
        "structured_payload": res.get("structured_payload"),
        "consultation_state": res.get("consultation_state"),
        "timestamp": res.get("timestamp"),
        "latency_ms": res.get("latency_ms"),
        "model": res.get("model")
    }

@router.get("/voice/history")
def get_voice_history(
    current_patient: Patient = Depends(get_current_patient),
    db: Session = Depends(get_db)
):
    """
    Returns authentic voice session history from PostgreSQL for the Voice Assistant history panel.
    """
    voice_sessions = db.query(VoiceSession).filter(
        VoiceSession.patient_id == current_patient.id
    ).order_by(VoiceSession.updated_at.desc()).limit(20).all()

    results = []
    if voice_sessions:
        for vs in voice_sessions:
            last_msg = db.query(VoiceMessage).filter(
                VoiceMessage.voice_session_id == vs.id
            ).order_by(VoiceMessage.sequence_number.desc()).first()

            first_user_msg = db.query(VoiceMessage).filter(
                VoiceMessage.voice_session_id == vs.id,
                VoiceMessage.role == "user"
            ).order_by(VoiceMessage.sequence_number.asc()).first()

            duration_str = "00:30"
            if vs.started_at and vs.ended_at:
                secs = int((vs.ended_at - vs.started_at).total_seconds())
                mins, s = divmod(max(secs, 10), 60)
                duration_str = f"{mins:02d}:{s:02d}"

            results.append({
                "id": vs.id,
                "title": vs.summary or (first_user_msg.content[:45] if first_user_msg else "Voice Session"),
                "timestamp": vs.updated_at.strftime("%d %b %Y, %I:%M %p") if vs.updated_at else "Recent",
                "duration": duration_str,
                "transcript": first_user_msg.content if first_user_msg else (vs.transcript or "Voice interaction"),
                "response": last_msg.content if last_msg else "Session active",
                "consultation_state": vs.status.value if hasattr(vs.status, "value") else str(vs.status),
                "conversation_mode": vs.conversation_mode,
                "key_points": json.loads(vs.key_points) if vs.key_points else []
            })
        return results

    # Fallback to AIConversation
    conversations = db.query(AIConversation).filter(
        AIConversation.patient_id == current_patient.id,
        AIConversation.is_deleted == False
    ).order_by(AIConversation.updated_at.desc()).limit(15).all()

    for c in conversations:
        last_msg = db.query(AIMessage).filter(
            AIMessage.conversation_id == c.id
        ).order_by(AIMessage.created_at.desc()).first()

        first_msg = db.query(AIMessage).filter(
            AIMessage.conversation_id == c.id,
            AIMessage.sender_role == "user"
        ).order_by(AIMessage.created_at.asc()).first()

        results.append({
            "id": c.id,
            "title": c.title,
            "timestamp": c.updated_at.strftime("%d %b %Y, %I:%M %p") if c.updated_at else "Recent",
            "duration": "00:30",
            "transcript": first_msg.content if first_msg else (c.summary_preview or c.title),
            "response": last_msg.content if last_msg else "Consultation completed.",
            "consultation_state": c.consultation_state,
            "conversation_mode": "HEALTH_CONSULTATION",
            "key_points": [c.title]
        })

    return results

@router.get("/voice/sessions/{session_id}/full")
def get_full_voice_session(
    session_id: str,
    current_patient: Patient = Depends(get_current_patient),
    db: Session = Depends(get_db)
):
    """
    Returns complete multi-turn voice session including sequential messages transcript,
    summary, key points, and extracted medical context.
    """
    v_session = db.query(VoiceSession).filter(
        VoiceSession.id == session_id,
        VoiceSession.patient_id == current_patient.id
    ).first()

    if not v_session:
        v_session = db.query(VoiceSession).filter(
            VoiceSession.ai_conversation_id == session_id,
            VoiceSession.patient_id == current_patient.id
        ).first()

    if v_session:
        msgs = db.query(VoiceMessage).filter(
            VoiceMessage.voice_session_id == v_session.id
        ).order_by(VoiceMessage.sequence_number.asc()).all()

        formatted_msgs = [
            {
                "id": m.id,
                "role": m.role,
                "content": m.content,
                "sequence_number": m.sequence_number,
                "timestamp": m.timestamp.strftime("%I:%M %p") if m.timestamp else "",
                "message_type": m.message_type
            }
            for m in msgs
        ]

        duration_str = "00:30"
        if v_session.started_at and v_session.ended_at:
            secs = int((v_session.ended_at - v_session.started_at).total_seconds())
            mins, s = divmod(max(secs, 10), 60)
            duration_str = f"{mins:02d}:{s:02d}"

        return {
            "session_id": v_session.id,
            "patient_id": v_session.patient_id,
            "started_at": v_session.started_at.strftime("%d %b %Y, %I:%M %p") if v_session.started_at else "",
            "ended_at": v_session.ended_at.strftime("%I:%M %p") if v_session.ended_at else "",
            "status": v_session.status.value if hasattr(v_session.status, "value") else str(v_session.status),
            "language": v_session.language,
            "conversation_mode": v_session.conversation_mode,
            "duration": duration_str,
            "summary": v_session.summary or "Voice session completed.",
            "key_points": json.loads(v_session.key_points) if v_session.key_points else [],
            "extracted_medical_context": json.loads(v_session.extracted_medical_context) if v_session.extracted_medical_context else {},
            "messages": formatted_msgs
        }

    # Fallback to AIConversation
    conv = db.query(AIConversation).filter(
        AIConversation.id == session_id,
        AIConversation.patient_id == current_patient.id
    ).first()

    if not conv:
        raise HTTPException(status_code=404, detail="Voice session not found")

    ai_msgs = db.query(AIMessage).filter(AIMessage.conversation_id == conv.id).order_by(AIMessage.created_at.asc()).all()
    formatted_msgs = [
        {
            "id": m.id,
            "role": "user" if m.sender_role == "user" else "assistant",
            "content": m.content,
            "sequence_number": idx + 1,
            "timestamp": m.created_at.strftime("%I:%M %p") if m.created_at else "",
            "message_type": m.message_type or "voice_transcription"
        }
        for idx, m in enumerate(ai_msgs)
    ]

    return {
        "session_id": conv.id,
        "patient_id": conv.patient_id,
        "started_at": conv.created_at.strftime("%d %b %Y, %I:%M %p") if conv.created_at else "",
        "ended_at": conv.updated_at.strftime("%I:%M %p") if conv.updated_at else "",
        "status": conv.status,
        "language": "en",
        "conversation_mode": "HEALTH_CONSULTATION",
        "duration": "00:45",
        "summary": conv.clinical_summary or conv.summary_preview or "Voice session completed.",
        "key_points": [conv.title] if conv.title else [],
        "extracted_medical_context": json.loads(conv.structured_context) if conv.structured_context else {},
        "messages": formatted_msgs
    }

@router.post("/voice/sessions/{conversation_id}/generate-report")
def generate_voice_session_report(
    conversation_id: str,
    current_patient: Patient = Depends(get_current_patient),
    db: Session = Depends(get_db)
):
    """
    Generates a structured clinical doctor pre-consultation report for this specific voice session.
    """
    conv = db.query(AIConversation).filter(
        AIConversation.id == conversation_id,
        AIConversation.patient_id == current_patient.id,
        AIConversation.is_deleted == False
    ).first()

    if not conv:
        raise HTTPException(status_code=404, detail="Voice conversation session not found")

    # Generate clinical history report using centralized AI orchestrator
    result = ai_orchestrator.confirm_and_generate_clinical_history(
        conversation_id=conv.id,
        patient_id=current_patient.id,
        db=db
    )

    return {
        "status": "success",
        "conversation_id": conv.id,
        "title": conv.title,
        "clinical_summary": result.get("clinical_summary"),
        "structured_context": result.get("structured_context")
    }


