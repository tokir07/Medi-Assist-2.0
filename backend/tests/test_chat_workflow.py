import os
import sys
import uuid
import pytest
from datetime import datetime, timezone

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from starlette.testclient import TestClient
from sqlalchemy.orm import Session

from app.main import app
from app.database.database import SessionLocal, get_db
from app.database.models import User, UserRole, Patient, Doctor
from app.models.appointment import Appointment
from app.models.chat import ChatConversation, ChatMessage
from app.core.security import create_access_token

client = TestClient(app)

@pytest.fixture
def db_session():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@pytest.fixture
def chat_setup(db_session: Session):
    """
    Creates isolated test users & profiles:
    - Doctor 1 (Dr. Priya)
    - Doctor 2 (Dr. Mehta)
    - Patient 1 (John Doe)
    - Patient 2 (Sarah Wilson)
    """
    uid = uuid.uuid4().hex[:6]
    now = datetime.now(timezone.utc)

    # User & Doctor 1
    u_doc1 = User(
        email=f"dr_priya_{uid}@example.com",
        name="Dr. Priya Sharma",
        role=UserRole.DOCTOR,
        is_active=True
    )
    db_session.add(u_doc1)
    db_session.flush()

    d1 = Doctor(
        user_id=u_doc1.id,
        doctor_id=f"DR-CHAT-001-{uid}",
        specialization="Cardiology",
        hospital="City Care Hospital"
    )
    db_session.add(d1)

    # User & Doctor 2
    u_doc2 = User(
        email=f"dr_mehta_{uid}@example.com",
        name="Dr. Rahul Mehta",
        role=UserRole.DOCTOR,
        is_active=True
    )
    db_session.add(u_doc2)
    db_session.flush()

    d2 = Doctor(
        user_id=u_doc2.id,
        doctor_id=f"DR-CHAT-002-{uid}",
        specialization="Neurology",
        hospital="Metro Health"
    )
    db_session.add(d2)

    # User & Patient 1
    u_pat1 = User(
        email=f"patient1_{uid}@example.com",
        name="John Doe",
        role=UserRole.PATIENT,
        is_active=True
    )
    db_session.add(u_pat1)
    db_session.flush()

    p1 = Patient(
        user_id=u_pat1.id,
        phone="+1234567890"
    )
    db_session.add(p1)

    # User & Patient 2
    u_pat2 = User(
        email=f"patient2_{uid}@example.com",
        name="Sarah Wilson",
        role=UserRole.PATIENT,
        is_active=True
    )
    db_session.add(u_pat2)
    db_session.flush()

    p2 = Patient(
        user_id=u_pat2.id,
        phone="+0987654321"
    )
    db_session.add(p2)

    db_session.commit()

    token_doc1 = create_access_token(subject=u_doc1.email, role="DOCTOR", user_id=u_doc1.id)
    token_doc2 = create_access_token(subject=u_doc2.email, role="DOCTOR", user_id=u_doc2.id)
    token_pat1 = create_access_token(subject=u_pat1.email, role="PATIENT", user_id=u_pat1.id)
    token_pat2 = create_access_token(subject=u_pat2.email, role="PATIENT", user_id=u_pat2.id)

    return {
        "doc1": d1, "u_doc1": u_doc1, "token_doc1": token_doc1,
        "doc2": d2, "u_doc2": u_doc2, "token_doc2": token_doc2,
        "pat1": p1, "u_pat1": u_pat1, "token_pat1": token_pat1,
        "pat2": p2, "u_pat2": u_pat2, "token_pat2": token_pat2,
    }

def test_pending_appointment_chat_locked(chat_setup, db_session: Session):
    """TEST 1: Patient with PENDING appointment cannot open chat"""
    p1 = chat_setup["pat1"]
    d1 = chat_setup["doc1"]
    token_pat1 = chat_setup["token_pat1"]

    # Create PENDING appointment
    app1 = Appointment(
        patient_id=p1.id,
        doctor_id=d1.id,
        doctor_name="Dr. Priya Sharma",
        appointment_date="2026-09-10",
        appointment_time="10:00 AM",
        status="Pending"
    )
    db_session.add(app1)
    db_session.commit()

    headers = {"Authorization": f"Bearer {token_pat1}"}
    res = client.post("/api/chat/conversations/open", json={"doctor_id": d1.id}, headers=headers)
    assert res.status_code == 403
    assert "Messaging is available after your appointment has been confirmed" in res.json()["message"]

def test_confirmed_appointment_enables_chat(chat_setup, db_session: Session):
    """TEST 2 & 3: Doctor approves appointment -> Chat enabled -> Open conversation creates 1 chat"""
    p1 = chat_setup["pat1"]
    d1 = chat_setup["doc1"]
    token_pat1 = chat_setup["token_pat1"]
    token_doc1 = chat_setup["token_doc1"]

    # Create & Confirm appointment
    app1 = Appointment(
        patient_id=p1.id,
        doctor_id=d1.id,
        doctor_name="Dr. Priya Sharma",
        appointment_date="2026-09-10",
        appointment_time="10:00 AM",
        status="Confirmed"
    )
    db_session.add(app1)
    db_session.commit()

    # Patient opens chat
    headers_pat = {"Authorization": f"Bearer {token_pat1}"}
    res = client.post("/api/chat/conversations/open", json={"doctor_id": d1.id}, headers=headers_pat)
    assert res.status_code == 200
    conv_data = res.json()
    assert conv_data["patient_id"] == p1.id
    assert conv_data["doctor_id"] == d1.id
    assert conv_data["other_participant"]["name"] == "Dr. Priya Sharma"
    conv_id = conv_data["id"]

    # Doctor opens chat
    headers_doc = {"Authorization": f"Bearer {token_doc1}"}
    res_doc = client.post("/api/chat/conversations/open", json={"patient_id": p1.id}, headers=headers_doc)
    assert res_doc.status_code == 200
    assert res_doc.json()["id"] == conv_id

def test_send_and_receive_messages(chat_setup, db_session: Session):
    """TEST 4 & 5: Patient sends message, Doctor replies, messages saved in DB"""
    p1 = chat_setup["pat1"]
    d1 = chat_setup["doc1"]
    token_pat1 = chat_setup["token_pat1"]
    token_doc1 = chat_setup["token_doc1"]

    app1 = Appointment(
        patient_id=p1.id,
        doctor_id=d1.id,
        doctor_name="Dr. Priya Sharma",
        appointment_date="2026-09-10",
        appointment_time="10:00 AM",
        status="Confirmed"
    )
    db_session.add(app1)
    db_session.commit()

    # Open chat
    headers_pat = {"Authorization": f"Bearer {token_pat1}"}
    open_res = client.post("/api/chat/conversations/open", json={"doctor_id": d1.id}, headers=headers_pat)
    conv_id = open_res.json()["id"]

    # Patient sends message
    msg_res1 = client.post(
        f"/api/chat/conversations/{conv_id}/messages",
        json={"content": "Hello Dr. Priya, I'm feeling much better today!"},
        headers=headers_pat
    )
    assert msg_res1.status_code == 200
    assert msg_res1.json()["sender_role"] == "PATIENT"

    # Doctor replies
    headers_doc = {"Authorization": f"Bearer {token_doc1}"}
    msg_res2 = client.post(
        f"/api/chat/conversations/{conv_id}/messages",
        json={"content": "That is wonderful to hear John! Please continue the medication."},
        headers=headers_doc
    )
    assert msg_res2.status_code == 200
    assert msg_res2.json()["sender_role"] == "DOCTOR"

    # Fetch message history
    history_res = client.get(f"/api/chat/conversations/{conv_id}/messages", headers=headers_pat)
    assert history_res.status_code == 200
    messages = history_res.json()["messages"]
    assert len(messages) >= 3  # Initial SYSTEM msg + 2 TEXT msgs
    assert messages[-1]["content"] == "That is wonderful to hear John! Please continue the medication."

def test_unrelated_doctor_access_forbidden(chat_setup, db_session: Session):
    """TEST 6: Doctor 2 attempts to access Patient 1 ↔ Doctor 1 conversation -> 403 Forbidden"""
    p1 = chat_setup["pat1"]
    d1 = chat_setup["doc1"]
    d2 = chat_setup["doc2"]
    token_pat1 = chat_setup["token_pat1"]
    token_doc2 = chat_setup["token_doc2"]

    app1 = Appointment(
        patient_id=p1.id,
        doctor_id=d1.id,
        doctor_name="Dr. Priya Sharma",
        appointment_date="2026-09-10",
        appointment_time="10:00 AM",
        status="Confirmed"
    )
    db_session.add(app1)
    db_session.commit()

    # Open chat as patient
    headers_pat = {"Authorization": f"Bearer {token_pat1}"}
    open_res = client.post("/api/chat/conversations/open", json={"doctor_id": d1.id}, headers=headers_pat)
    conv_id = open_res.json()["id"]

    # Doctor 2 tries to fetch messages of Doctor 1's conversation
    headers_doc2 = {"Authorization": f"Bearer {token_doc2}"}
    res = client.get(f"/api/chat/conversations/{conv_id}/messages", headers=headers_doc2)
    assert res.status_code == 403
    assert "You do not have access to this conversation" in res.json()["message"]

def test_multiple_confirmed_appointments_single_conversation(chat_setup, db_session: Session):
    """TEST 9: Multiple confirmed appointments between same doctor and patient result in 1 single conversation"""
    p1 = chat_setup["pat1"]
    d1 = chat_setup["doc1"]
    token_pat1 = chat_setup["token_pat1"]

    # Add 3 confirmed appointments
    for i in range(3):
        app_i = Appointment(
            patient_id=p1.id,
            doctor_id=d1.id,
            doctor_name="Dr. Priya Sharma",
            appointment_date=f"2026-09-1{i}",
            appointment_time="10:00 AM",
            status="Confirmed"
        )
        db_session.add(app_i)
    db_session.commit()

    headers_pat = {"Authorization": f"Bearer {token_pat1}"}
    res1 = client.post("/api/chat/conversations/open", json={"doctor_id": d1.id}, headers=headers_pat)
    res2 = client.post("/api/chat/conversations/open", json={"doctor_id": d1.id}, headers=headers_pat)

    assert res1.json()["id"] == res2.json()["id"]

    # Verify conversation list count
    list_res = client.get("/api/chat/conversations", headers=headers_pat)
    assert list_res.status_code == 200
    assert len(list_res.json()) == 1
