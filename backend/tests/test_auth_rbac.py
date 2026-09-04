import sys
import os
import pytest
import uuid
from fastapi.testclient import TestClient

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.main import app
from app.database.database import Base, engine, SessionLocal
from app.database.models import User, UserRole, Doctor, Patient
from seed import seed_database

client = TestClient(app)

@pytest.fixture(scope="module", autouse=True)
def setup_db():
    Base.metadata.create_all(bind=engine)
    seed_database()
    yield

def test_health_check():
    response = client.get("/api/auth/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"

def test_google_auth_unregistered_email_auto_creates_account():
    random_email = f"patient_{uuid.uuid4().hex[:8]}@gmail.com"
    response = client.post("/api/auth/google", json={
        "dev_email": random_email
    })
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["data"]["user"]["email"] == random_email
    assert data["data"]["user"]["role"] == "PATIENT"

def test_register_new_patient_account():
    random_email = f"newpatient_{uuid.uuid4().hex[:8]}@gmail.com"
    response = client.post("/api/auth/register", json={
        "email": random_email,
        "name": "New Patient",
        "password": "Password123!"
    })
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert "access_token" in data["data"]
    assert data["data"]["user"]["email"] == random_email
    assert data["data"]["user"]["role"] == "PATIENT"
    assert data["data"]["user"]["is_onboarded"] is False

def test_google_auth_existing_patient_login():
    response = client.post("/api/auth/google", json={
        "dev_email": "patient@mediassist.test"
    })
    assert response.status_code == 200
    data = response.json()
    assert data["data"]["user"]["role"] == "PATIENT"
    assert data["data"]["user"]["email"] == "patient@mediassist.test"

def test_google_auth_provisioned_doctor_login():
    response = client.post("/api/auth/google", json={
        "dev_email": "doctor@mediassist.test"
    })
    assert response.status_code == 200
    data = response.json()
    assert data["data"]["user"]["role"] == "DOCTOR"

def test_google_auth_unprovisioned_doctor_forbidden():
    db = SessionLocal()
    unprovisioned_email = f"unprovisioned_doc_{uuid.uuid4().hex[:6]}@example.com"
    unprovisioned_user = User(
        email=unprovisioned_email,
        name="Dr. Unprovisioned",
        role=UserRole.DOCTOR,
        is_active=True,
        is_onboarded=True
    )
    db.add(unprovisioned_user)
    db.commit()
    db.close()

    response = client.post("/api/auth/google", json={
        "dev_email": unprovisioned_email
    })
    assert response.status_code == 403
    error_msg = response.json().get("message") or response.json().get("detail", "")
    assert "DOCTOR_NOT_REGISTERED" in error_msg

def test_google_auth_admin_login():
    response = client.post("/api/auth/google", json={
        "dev_email": "admin@mediassist"
    })
    assert response.status_code == 200
    data = response.json()
    assert data["data"]["user"]["role"] == "ADMIN"

def test_unauthenticated_access_returns_401():
    response = client.get("/api/doctor/test")
    assert response.status_code == 401

def test_patient_rbac_access():
    auth_resp = client.post("/api/auth/google", json={
        "dev_email": "patient@mediassist.test"
    })
    token = auth_resp.json()["data"]["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    res_doc = client.get("/api/doctor/test", headers=headers)
    assert res_doc.status_code == 403

    res_adm = client.get("/api/admin/test", headers=headers)
    assert res_adm.status_code == 403

def test_doctor_rbac_access():
    auth_resp = client.post("/api/auth/google", json={
        "dev_email": "doctor@mediassist.test"
    })
    token = auth_resp.json()["data"]["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    res_doc = client.get("/api/doctor/test", headers=headers)
    assert res_doc.status_code == 200
    assert res_doc.json()["role"] == "DOCTOR"

    res_adm = client.get("/api/admin/test", headers=headers)
    assert res_adm.status_code == 403

def test_admin_rbac_access():
    auth_resp = client.post("/api/auth/google", json={
        "dev_email": "admin@mediassist"
    })
    token = auth_resp.json()["data"]["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    res_adm = client.get("/api/admin/test", headers=headers)
    assert res_adm.status_code == 200
    assert res_adm.json()["role"] == "ADMIN"

