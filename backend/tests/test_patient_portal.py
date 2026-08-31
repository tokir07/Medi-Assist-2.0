import uuid
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.database.database import Base, engine, SessionLocal
from app.database.models import User, UserRole, Patient
from app.core.security import create_access_token
from app.models.patient_portal import Consultation, ClinicalHistory

client = TestClient(app)

@pytest.fixture
def db_session():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@pytest.fixture
def test_patient_user(db_session):
    uid = uuid.uuid4().hex[:8]
    user = User(
        email=f"patient_{uid}@example.com",
        name="Rahul Sharma",
        role=UserRole.PATIENT,
        is_active=True,
        is_onboarded=True
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)

    patient = Patient(
        user_id=user.id,
        date_of_birth="1990-08-12",
        gender="Male",
        emergency_contact='{"name": "Neha Sharma", "relationship": "Wife", "phone": "+91 98765 43211"}'
    )
    db_session.add(patient)
    db_session.commit()
    db_session.refresh(patient)
    return user, patient

@pytest.fixture
def test_patient2_user(db_session):
    uid = uuid.uuid4().hex[:8]
    user = User(
        email=f"patient2_{uid}@example.com",
        name="Other Patient",
        role=UserRole.PATIENT,
        is_active=True,
        is_onboarded=True
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)

    patient = Patient(user_id=user.id, date_of_birth="1995-05-15", gender="Female")
    db_session.add(patient)
    db_session.commit()
    db_session.refresh(patient)
    return user, patient

@pytest.fixture
def auth_headers(test_patient_user):
    user, _ = test_patient_user
    token = create_access_token(user.id, role="PATIENT", user_id=user.id)
    return {"Authorization": f"Bearer {token}"}

@pytest.fixture
def auth_headers_patient2(test_patient2_user):
    user, _ = test_patient2_user
    token = create_access_token(user.id, role="PATIENT", user_id=user.id)
    return {"Authorization": f"Bearer {token}"}

def test_get_and_update_profile(auth_headers):
    # GET /api/v1/profile
    res = client.get("/api/v1/profile", headers=auth_headers)
    assert res.status_code == 200
    data = res.json()
    assert data["full_name"] == "Rahul Sharma"
    assert data["date_of_birth"] == "1990-08-12"
    assert data["age"] is not None
    assert data["age"] > 20

    # PATCH /api/v1/profile
    patch_res = client.patch(
        "/api/v1/profile",
        json={
            "full_name": "Rahul V. Sharma",
            "phone": "+91 98765 99999",
            "emergency_contact": {"name": "Priya Sharma", "relationship": "Sister", "phone": "+91 98765 88888"}
        },
        headers=auth_headers
    )
    assert patch_res.status_code == 200
    updated = patch_res.json()
    assert updated["full_name"] == "Rahul V. Sharma"
    assert updated["emergency_contact"]["name"] == "Priya Sharma"

def test_dashboard_endpoint(auth_headers):
    res = client.get("/api/v1/dashboard", headers=auth_headers)
    assert res.status_code == 200
    data = res.json()
    assert "patient" in data
    assert "health_summary" in data
    assert "consultation" in data
    assert "upcoming_appointment" in data

def test_full_consultation_flow_and_history(auth_headers, auth_headers_patient2):
    # 1. Start Consultation
    start_res = client.post("/api/v1/consultation", json={"language": "en"}, headers=auth_headers)
    assert start_res.status_code == 200
    c_id = start_res.json()["consultation_id"]
    assert start_res.json()["status"] == "IN_PROGRESS"

    # 2. Submit Chief Complaint
    cc_res = client.post(f"/api/v1/consultation/{c_id}/chief-complaint", json={"complaint": "Headache", "original_text": "Severe headache for 2 days"}, headers=auth_headers)
    assert cc_res.status_code == 200
    assert "question_id" in cc_res.json()

    # 3. Get Next Question
    q_res = client.get(f"/api/v1/consultation/{c_id}/next-question", headers=auth_headers)
    assert q_res.status_code == 200
    assert "question" in q_res.json()

    # 4. Submit Answer
    ans_res = client.post(
        f"/api/v1/consultation/{c_id}/answer",
        json={
            "question_id": "duration",
            "input_method": "TEXT",
            "answer_text": "It started yesterday evening."
        },
        headers=auth_headers
    )
    assert ans_res.status_code == 200
    assert ans_res.json()["saved"] is True

    # 5. Review Consultation
    rev_res = client.get(f"/api/v1/consultation/{c_id}/review", headers=auth_headers)
    assert rev_res.status_code == 200
    assert rev_res.json()["chief_complaint"] == "Headache"

    # 6. Complete Consultation
    comp_res = client.post(f"/api/v1/consultation/{c_id}/complete", headers=auth_headers)
    assert comp_res.status_code == 200
    assert comp_res.json()["completed"] is True
    history_id = comp_res.json()["clinical_history_id"]

    # 7. Get History
    hist_res = client.get("/api/v1/history", headers=auth_headers)
    assert hist_res.status_code == 200
    histories = hist_res.json()
    assert len(histories) >= 1

    # 8. Patient Isolation Test: Patient 2 cannot access Patient 1's clinical history
    iso_res = client.get(f"/api/v1/history/{history_id}", headers=auth_headers_patient2)
    assert iso_res.status_code in [403, 404]

def test_voice_session_lifecycle(auth_headers):
    # Start consultation first
    c_res = client.post("/api/v1/consultation", json={"language": "en"}, headers=auth_headers)
    c_id = c_res.json()["consultation_id"]

    # Voice Start
    v_start = client.post(f"/api/v1/consultation/{c_id}/voice/start", headers=auth_headers)
    assert v_start.status_code == 200
    assert v_start.json()["status"] == "LISTENING"

    # Voice Pause
    v_pause = client.post(f"/api/v1/consultation/{c_id}/voice/pause", headers=auth_headers)
    assert v_pause.status_code == 200
    assert v_pause.json()["status"] == "PAUSED"

    # Voice Transcribe
    v_trans = client.post(f"/api/v1/consultation/{c_id}/voice/transcribe", json={"audio_base64": "dummy", "language": "en"}, headers=auth_headers)
    assert v_trans.status_code == 200
    assert "transcript" in v_trans.json()

    # Voice Stop
    v_stop = client.post(f"/api/v1/consultation/{c_id}/voice/stop", headers=auth_headers)
    assert v_stop.status_code == 200
    assert v_stop.json()["status"] == "COMPLETED"
