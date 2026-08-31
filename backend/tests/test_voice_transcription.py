import io
import os
import sys
import uuid
import pytest

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from unittest.mock import patch
from fastapi.testclient import TestClient
from app.main import app
from app.database.database import SessionLocal
from app.database.models import User, UserRole, Patient, Doctor
from app.models.patient_portal import Consultation, ConsultationStatus, VoiceSession, VoiceSessionStatus
from app.core.security import create_access_token
from app.core.config import settings
from app.utils.exceptions import AppException
from fastapi import status

client = TestClient(app)

@pytest.fixture
def db_session():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@pytest.fixture
def patient_user_a(db_session):
    uid = uuid.uuid4().hex[:8]
    user = User(
        email=f"voice_patient_a_{uid}@mediassist.app",
        name="Voice Patient A",
        role=UserRole.PATIENT,
        is_active=True,
        is_onboarded=True
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)

    patient = Patient(user_id=user.id, gender="Male", date_of_birth="1992-01-01")
    db_session.add(patient)
    db_session.commit()
    db_session.refresh(patient)
    return user, patient

@pytest.fixture
def patient_user_b(db_session):
    uid = uuid.uuid4().hex[:8]
    user = User(
        email=f"voice_patient_b_{uid}@mediassist.app",
        name="Voice Patient B",
        role=UserRole.PATIENT,
        is_active=True,
        is_onboarded=True
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)

    patient = Patient(user_id=user.id, gender="Female", date_of_birth="1994-05-10")
    db_session.add(patient)
    db_session.commit()
    db_session.refresh(patient)
    return user, patient

@pytest.fixture
def doctor_user(db_session):
    uid = uuid.uuid4().hex[:8]
    user = User(
        email=f"voice_doctor_{uid}@mediassist.app",
        name="Dr. Smith",
        role=UserRole.DOCTOR,
        is_active=True,
        is_onboarded=True
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)

    doctor = Doctor(
        user_id=user.id,
        doctor_id=f"DR-{uid[:4].upper()}",
        specialization="Internal Medicine"
    )
    db_session.add(doctor)
    db_session.commit()
    db_session.refresh(doctor)
    return user, doctor

@pytest.fixture
def consultation_a(db_session, patient_user_a):
    _, patient_a = patient_user_a
    cons = Consultation(
        patient_id=patient_a.id,
        status=ConsultationStatus.IN_PROGRESS,
        language="en",
        chief_complaint="Throat pain"
    )
    db_session.add(cons)
    db_session.commit()
    db_session.refresh(cons)
    return cons

def _get_err_msg(res):
    d = res.json()
    return d.get("message") or d.get("detail") or str(d)

def test_voice_unauthenticated_returns_401(consultation_a):
    fake_audio = io.BytesIO(b"RIFF....WAVEfmt ....data....")
    res = client.post(
        f"/api/v1/consultation/{consultation_a.id}/voice/transcribe",
        files={"file": ("audio.m4a", fake_audio, "audio/m4a")}
    )
    assert res.status_code == 401
    assert "Authentication required" in _get_err_msg(res)

def test_voice_nonexistent_consultation_returns_404(patient_user_a):
    user_a, _ = patient_user_a
    token = create_access_token(user_a.id, role="PATIENT", user_id=user_a.id)
    headers = {"Authorization": f"Bearer {token}"}

    fake_audio = io.BytesIO(b"dummy audio data")
    res = client.post(
        f"/api/v1/consultation/{uuid.uuid4()}/voice/transcribe",
        files={"file": ("audio.m4a", fake_audio, "audio/m4a")},
        headers=headers
    )
    assert res.status_code == 404
    assert "Consultation not found" in _get_err_msg(res)

def test_voice_unauthorized_patient_returns_403(consultation_a, patient_user_b):
    user_b, _ = patient_user_b
    token_b = create_access_token(user_b.id, role="PATIENT", user_id=user_b.id)
    headers_b = {"Authorization": f"Bearer {token_b}"}

    fake_audio = io.BytesIO(b"dummy audio data")
    res = client.post(
        f"/api/v1/consultation/{consultation_a.id}/voice/transcribe",
        files={"file": ("audio.m4a", fake_audio, "audio/m4a")},
        headers=headers_b
    )
    assert res.status_code == 403
    assert "Access denied" in _get_err_msg(res)

def test_voice_unsupported_audio_format_returns_415(consultation_a, patient_user_a):
    user_a, _ = patient_user_a
    token = create_access_token(user_a.id, role="PATIENT", user_id=user_a.id)
    headers = {"Authorization": f"Bearer {token}"}

    fake_exe = io.BytesIO(b"MZ............")
    res = client.post(
        f"/api/v1/consultation/{consultation_a.id}/voice/transcribe",
        files={"file": ("virus.exe", fake_exe, "application/x-msdownload")},
        headers=headers
    )
    assert res.status_code == 415
    assert "Unsupported audio" in _get_err_msg(res)

def test_voice_empty_audio_returns_400(consultation_a, patient_user_a):
    user_a, _ = patient_user_a
    token = create_access_token(user_a.id, role="PATIENT", user_id=user_a.id)
    headers = {"Authorization": f"Bearer {token}"}

    empty_audio = io.BytesIO(b"")
    res = client.post(
        f"/api/v1/consultation/{consultation_a.id}/voice/transcribe",
        files={"file": ("audio.m4a", empty_audio, "audio/m4a")},
        headers=headers
    )
    assert res.status_code == 400
    assert "No audio file" in _get_err_msg(res)

def test_voice_oversized_audio_returns_413(consultation_a, patient_user_a, monkeypatch):
    user_a, _ = patient_user_a
    token = create_access_token(user_a.id, role="PATIENT", user_id=user_a.id)
    headers = {"Authorization": f"Bearer {token}"}

    # Set temporary max size to 0.001 MB (1KB)
    monkeypatch.setattr(settings, "MAX_AUDIO_SIZE_MB", 0.001)

    big_audio = io.BytesIO(b"A" * 2048)
    res = client.post(
        f"/api/v1/consultation/{consultation_a.id}/voice/transcribe",
        files={"file": ("audio.m4a", big_audio, "audio/m4a")},
        headers=headers
    )
    assert res.status_code == 413
    assert "exceeds the maximum limit" in _get_err_msg(res)

def test_voice_successful_multipart_transcription_and_persistence(consultation_a, patient_user_a, db_session):
    user_a, patient_a = patient_user_a
    token = create_access_token(user_a.id, role="PATIENT", user_id=user_a.id)
    headers = {"Authorization": f"Bearer {token}"}

    test_audio = io.BytesIO(b"RIFF....WAVEfmt ....data....test_audio_samples")

    with patch("app.services.voice_service.stt_service.transcribe") as mock_stt:
        mock_stt.return_value = {
            "transcript": "I have had a severe fever and chest cough since yesterday.",
            "confidence": 0.99,
            "language": "en",
            "duration_seconds": 4.2
        }

        res = client.post(
            f"/api/v1/consultation/{consultation_a.id}/voice/transcribe",
            files={"file": ("recording.m4a", test_audio, "audio/m4a")},
            data={"language": "en"},
            headers=headers
        )

        assert res.status_code == 200
        data = res.json()
        assert data["success"] is True
        assert data["consultation_id"] == consultation_a.id
        assert data["transcript"] == "I have had a severe fever and chest cough since yesterday."
        assert data["confidence"] == 0.99
        assert data["duration_seconds"] == 4.2

        # Verify persisted VoiceSession in PostgreSQL
        session = db_session.query(VoiceSession).filter(
            VoiceSession.consultation_id == consultation_a.id,
            VoiceSession.patient_id == patient_a.id
        ).order_by(VoiceSession.started_at.desc()).first()

        assert session is not None
        assert session.status == VoiceSessionStatus.COMPLETED
        assert session.transcript == "I have had a severe fever and chest cough since yesterday."

def test_voice_stt_provider_failure_returns_502(consultation_a, patient_user_a):
    user_a, _ = patient_user_a
    token = create_access_token(user_a.id, role="PATIENT", user_id=user_a.id)
    headers = {"Authorization": f"Bearer {token}"}

    test_audio = io.BytesIO(b"dummy audio")

    with patch("app.services.voice_service.stt_service.transcribe") as mock_stt:
        mock_stt.side_effect = AppException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            message="Speech transcription provider error: upstream network timeout"
        )

        res = client.post(
            f"/api/v1/consultation/{consultation_a.id}/voice/transcribe",
            files={"file": ("recording.m4a", test_audio, "audio/m4a")},
            headers=headers
        )

        assert res.status_code == 502
        assert "Speech transcription provider error" in _get_err_msg(res)

def test_voice_doctor_rbac_access_denied(consultation_a, doctor_user):
    user_doc, _ = doctor_user
    token_doc = create_access_token(user_doc.id, role="DOCTOR", user_id=user_doc.id)
    headers_doc = {"Authorization": f"Bearer {token_doc}"}

    test_audio = io.BytesIO(b"dummy audio")
    res = client.post(
        f"/api/v1/consultation/{consultation_a.id}/voice/transcribe",
        files={"file": ("recording.m4a", test_audio, "audio/m4a")},
        headers=headers_doc
    )
    assert res.status_code == 403
    assert "Only patients can access" in _get_err_msg(res)
