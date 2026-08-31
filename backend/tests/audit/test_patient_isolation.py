import sys
import os
import pytest
from fastapi.testclient import TestClient

sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from app.main import app
from app.database.database import SessionLocal
from app.database.models import User, Patient, UserRole
from app.models.patient_portal import Consultation, ConsultationStatus
from app.core.security import create_access_token

client = TestClient(app)

def setup_patient(email_prefix: str):
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.email == f"{email_prefix}@mediassist.app").first()
        if not user:
            user = User(
                email=f"{email_prefix}@mediassist.app",
                name=f"Patient {email_prefix.upper()}",
                role=UserRole.PATIENT,
                password_hash="hashed_pass"
            )
            db.add(user)
            db.commit()
            db.refresh(user)

            patient = Patient(user_id=user.id)
            db.add(patient)
            db.commit()
            db.refresh(patient)
        else:
            patient = db.query(Patient).filter(Patient.user_id == user.id).first()
            if not patient:
                patient = Patient(user_id=user.id)
                db.add(patient)
                db.commit()
                db.refresh(patient)

        token = create_access_token(subject=user.id, claims={"role": "PATIENT"})
        return user, patient, token
    finally:
        db.close()

def test_patient_isolation_consultation_cross_access():
    u_a, p_a, token_a = setup_patient("iso_patient_a")
    u_b, p_b, token_b = setup_patient("iso_patient_b")

    # Create consultation for Patient B
    db = SessionLocal()
    try:
        cons_b = Consultation(patient_id=p_b.id, status=ConsultationStatus.IN_PROGRESS, language="en")
        db.add(cons_b)
        db.commit()
        db.refresh(cons_b)
        c_b_id = cons_b.id
    finally:
        db.close()

    # Patient A attempts to answer Patient B's consultation
    headers_a = {"Authorization": f"Bearer {token_a}"}
    res = client.post(
        f"/api/v1/consultation/{c_b_id}/answer",
        json={"question_id": "duration", "answer_text": "Hacked answer"},
        headers=headers_a
    )

    assert res.status_code in [403, 404], f"CRITICAL PATIENT ISOLATION FAILURE: Patient A was able to access Patient B's consultation (HTTP {res.status_code})"
