import os
import sys
import uuid
import pytest

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fastapi.testclient import TestClient
from app.main import app
from app.database.database import SessionLocal
from app.database.models import User, UserRole, Patient
from app.models.ai_conversation import AIConversation, AIMessage
from app.models.patient_portal import VoiceSession
from app.core.security import create_access_token

client = TestClient(app)

@pytest.fixture
def db_session():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def test_quick_chat_decoupled_from_voice_session(db_session):
    # 1. Setup test patient
    uid = uuid.uuid4().hex[:8]
    user = User(
        email=f"quick_ai_{uid}@mediassist.app",
        name="Quick AI Test Patient",
        role=UserRole.PATIENT,
        is_active=True,
        is_onboarded=True
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)

    patient = Patient(user_id=user.id, gender="Female", date_of_birth="1995-05-15")
    db_session.add(patient)
    db_session.commit()
    db_session.refresh(patient)

    token = create_access_token(subject=user.id, claims={"role": "PATIENT", "email": user.email})
    headers = {"Authorization": f"Bearer {token}"}

    # 2. Call /api/ai/quick-chat
    res = client.post(
        "/api/ai/quick-chat",
        json={"message": "Hello AI, what are my appointments?"},
        headers=headers
    )
    assert res.status_code == 200, res.text
    data = res.json()
    assert "message" in data
    assert len(data["message"]) > 0

    # 3. Verify AIConversation and AIMessage were created
    conv = db_session.query(AIConversation).filter(
        AIConversation.patient_id == patient.id,
        AIConversation.title == "Quick AI Chat"
    ).first()
    assert conv is not None

    messages = db_session.query(AIMessage).filter(
        AIMessage.conversation_id == conv.id
    ).all()
    assert len(messages) >= 2  # user message and AI response

    # 4. Verify NO VoiceSession was created
    voice_sessions = db_session.query(VoiceSession).filter(
        VoiceSession.patient_id == patient.id
    ).all()
    assert len(voice_sessions) == 0, "Quick Chat should NOT create a VoiceSession!"
