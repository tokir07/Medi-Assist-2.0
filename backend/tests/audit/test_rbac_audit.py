import sys
import os
import pytest
from fastapi.testclient import TestClient

sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from app.main import app
from app.database.database import SessionLocal
from app.database.models import User, UserRole, Doctor, Patient
from app.core.security import create_access_token

client = TestClient(app)

def setup_doctor_token():
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.email == "rbac_doctor@mediassist.app").first()
        if not user:
            user = User(
                email="rbac_doctor@mediassist.app",
                name="Dr. RBAC Doctor",
                role=UserRole.DOCTOR,
                password_hash="hashed_pass"
            )
            db.add(user)
            db.commit()
            db.refresh(user)

            doc = Doctor(user_id=user.id, doctor_id="DR-RBAC-001", specialization="Cardiology")
            db.add(doc)
            db.commit()

        return create_access_token(subject=user.id, role="DOCTOR", user_id=user.id)
    finally:
        db.close()

def test_doctor_access_patient_endpoints():
    token = setup_doctor_token()
    headers = {"Authorization": f"Bearer {token}"}
    
    # Doctor accessing patient dashboard
    res = client.get("/api/v1/dashboard", headers=headers)
    assert res.status_code in [403, 404], f"Expected 403/404 when DOCTOR accesses Patient dashboard, got {res.status_code}"
