from typing import List, Optional
from fastapi import APIRouter, Depends, Query, WebSocket, WebSocketDisconnect, status
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.database.models import User
from app.core.dependencies import get_current_user
from app.core.chat_ws import ws_manager
from app.schemas.chat import (
    OpenConversationRequest,
    SendMessageRequest,
    ChatConversationResponse,
    ChatMessageResponse,
    ConversationMessagesResponse,
)
from app.services.chat_service import ChatService
from app.models.reminder import PatientReminder
from datetime import datetime, timezone

router = APIRouter(prefix="/chat", tags=["Chat"])

@router.get("/conversations", response_model=List[ChatConversationResponse])
def get_conversations(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get all active chat conversations for the current authenticated patient or doctor.
    """
    return ChatService.get_user_conversations(db, current_user)

@router.post("/conversations/open", response_model=ChatConversationResponse)
def open_conversation(
    payload: OpenConversationRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Open or create a chat conversation with a specific doctor or patient.
    Requires at least one CONFIRMED appointment between the participants.
    """
    return ChatService.open_or_get_conversation(
        db=db,
        current_user=current_user,
        target_doctor_id=payload.doctor_id,
        target_patient_id=payload.patient_id
    )

@router.get("/conversations/{conversation_id}/messages", response_model=ConversationMessagesResponse)
def get_conversation_messages(
    conversation_id: str,
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get message history for a conversation in chronological order.
    Also automatically marks incoming unread messages as read.
    """
    return ChatService.get_conversation_messages(
        db=db,
        current_user=current_user,
        conversation_id=conversation_id,
        limit=limit,
        offset=offset
    )

@router.post("/conversations/{conversation_id}/messages", response_model=ChatMessageResponse)
async def send_message(
    conversation_id: str,
    payload: SendMessageRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Send a message in a chat conversation.
    1. Saves message to PostgreSQL FIRST (source of truth).
    2. Broadcasts via WebSocket real-time event if recipient is connected.
    3. Persists notification for offline recipient.
    """
    # 1. Save to PostgreSQL
    message_resp = ChatService.send_message(
        db=db,
        current_user=current_user,
        conversation_id=conversation_id,
        content=payload.content,
        message_type=payload.message_type or "TEXT"
    )

    # Fetch conversation details to get recipient IDs
    conv = ChatService.get_conversation_messages(db, current_user, conversation_id, limit=1, offset=0).conversation
    recipient_id = conv.other_participant.id
    recipient_user_id = conv.other_participant.user_id

    # 2. Prepare WebSocket event payload
    event_data = {
        "type": "NEW_MESSAGE",
        "conversation_id": conversation_id,
        "message": message_resp.model_dump(mode="json"),
        "sender_name": current_user.name
    }

    # 3. Broadcast real-time message to recipient profile_id and user_id
    await ws_manager.broadcast_to_user(recipient_id, event_data)
    if recipient_user_id:
        await ws_manager.broadcast_to_user(recipient_user_id, event_data)

    # 4. If recipient is a patient, add a notification reminder
    if conv.other_participant.role == "PATIENT":
        now_dt = datetime.now(timezone.utc)
        notif = PatientReminder(
            patient_id=recipient_id,
            title=f"New Message from {current_user.name}",
            subtitle=payload.content[:100],
            reminder_type="MESSAGE",
            time_str=now_dt.strftime("%I:%M %p"),
            date_str=now_dt.strftime("%Y-%m-%d"),
            status="Upcoming",
            icon_type="bell"
        )
        db.add(notif)
        db.commit()

    return message_resp

@router.patch("/conversations/{conversation_id}/read")
def mark_read(
    conversation_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Mark unread messages in conversation as read.
    """
    return ChatService.mark_read(db, current_user, conversation_id)

@router.websocket("/ws/{user_id}")
async def chat_websocket_endpoint(websocket: WebSocket, user_id: str):
    """
    WebSocket endpoint for real-time chat updates.
    """
    await ws_manager.connect(websocket, user_id)
    try:
        while True:
            # Keep connection alive and listen for ping/heartbeats
            data = await websocket.receive_text()
            # Optional echo or heartbeat response
            if data == "ping":
                await websocket.send_text("pong")
    except WebSocketDisconnect:
        ws_manager.disconnect(websocket, user_id)
    except Exception:
        ws_manager.disconnect(websocket, user_id)
