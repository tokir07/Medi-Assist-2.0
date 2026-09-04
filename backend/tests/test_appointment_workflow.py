import os
import sys
import uuid
import pytest

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fastapi.testclient import TestClient
from app.main import app
from app.database.database import SessionLocal
from app.database.models import User, UserRole, Patient, Doctor
from app.models.appointment import Appointment
from app.models.reminder import PatientReminder
from app.core.security import create_access_token

from starlette.testclient import TestClient

client = TestClient(app)

@pytest.fixture
def db_session():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@pytest.fixture
def setup_users(db_session):
    uid = uuid.uuid4().hex[:6]
    
    # 1. Doctor User & Profile 1
    doc_user1 = User(
        email=f"doc1_{uid}@mediassist.app",
        name=f"Dr. Test One {uid}",
        role=UserRole.DOCTOR,
        is_active=True,
        is_onboarded=True
    )
    db_session.add(doc_user1)
    db_session.commit()
    db_session.refresh(doc_user1)

    doc1 = Doctor(
        user_id=doc_user1.id,
        doctor_id=f"DR-{uid}-1",
        specialization="General Medicine",
        qualification="MBBS, MD",
        experience=10,
        hospital="City Care Hospital"
    )
    db_session.add(doc1)
    db_session.commit()
    db_session.refresh(doc1)

    # 2. Doctor User & Profile 2
    doc_user2 = User(
        email=f"doc2_{uid}@mediassist.app",
        name=f"Dr. Test Two {uid}",
        role=UserRole.DOCTOR,
        is_active=True,
        is_onboarded=True
    )
    db_session.add(doc_user2)
    db_session.commit()
    db_session.refresh(doc_user2)

    doc2 = Doctor(
        user_id=doc_user2.id,
        doctor_id=f"DR-{uid}-2",
        specialization="Cardiology",
        qualification="MBBS, DM",
        experience=12,
        hospital="Apex Hospital"
    )
    db_session.add(doc2)
    db_session.commit()
    db_session.refresh(doc2)

    # 3. Patient User 1
    pat_user1 = User(
        email=f"patient1_{uid}@mediassist.app",
        name=f"Patient One {uid}",
        role=UserRole.PATIENT,
        is_active=True,
        is_onboarded=True
    )
    db_session.add(pat_user1)
    db_session.commit()
    db_session.refresh(pat_user1)

    pat1 = Patient(user_id=pat_user1.id, gender="Male", date_of_birth="1990-01-01")
    db_session.add(pat1)
    db_session.commit()
    db_session.refresh(pat1)

    # 4. Patient User 2
    pat_user2 = User(
        email=f"patient2_{uid}@mediassist.app",
        name=f"Patient Two {uid}",
        role=UserRole.PATIENT,
        is_active=True,
        is_onboarded=True
    )
    db_session.add(pat_user2)
    db_session.commit()
    db_session.refresh(pat_user2)

    pat2 = Patient(user_id=pat_user2.id, gender="Female", date_of_birth="1994-05-10")
    db_session.add(pat2)
    db_session.commit()
    db_session.refresh(pat2)

    tokens = {
        "pat1": create_access_token(subject=pat_user1.id, claims={"role": "PATIENT", "email": pat_user1.email}),
        "pat2": create_access_token(subject=pat_user2.id, claims={"role": "PATIENT", "email": pat_user2.email}),
        "doc1": create_access_token(subject=doc_user1.id, claims={"role": "DOCTOR", "email": doc_user1.email}),
        "doc2": create_access_token(subject=doc_user2.id, claims={"role": "DOCTOR", "email": doc_user2.email})
    }

    return {
        "doc1": doc1, "doc_user1": doc_user1,
        "doc2": doc2, "doc_user2": doc_user2,
        "pat1": pat1, "pat_user1": pat_user1,
        "pat2": pat2, "pat_user2": pat_user2,
        "tokens": tokens
    }


def test_case_1_patient_books_appointment_starts_pending(db_session, setup_users):
    """Test Case 1: Patient books appointment -> Status is PENDING."""
    data = setup_users
    headers = {"Authorization": f"Bearer {data['tokens']['pat1']}"}

    res = client.post(
        "/api/appointments",
        json={
            "doctor_name": data["doc1"].user.name,
            "doctor_specialty": "General Physician",
            "hospital": "City Care Hospital",
            "appointment_date": "2026-10-15",
            "appointment_time": "10:30 AM",
            "mode": "In-Person",
            "notes": "Persistent headache"
        },
        headers=headers
    )
    assert res.status_code == 201, res.text
    apt_data = res.json()
    assert apt_data["status"] == "Pending"

    # DB Check
    db_apt = db_session.query(Appointment).filter(Appointment.id == apt_data["id"]).first()
    assert db_apt is not None
    assert db_apt.status == "Pending"


def test_case_2_doctor_approves_appointment(db_session, setup_users):
    """Test Case 2: Doctor approves pending appointment -> Status becomes CONFIRMED."""
    data = setup_users
    pat_headers = {"Authorization": f"Bearer {data['tokens']['pat1']}"}
    doc_headers = {"Authorization": f"Bearer {data['tokens']['doc1']}"}

    # 1. Book appointment
    res = client.post(
        "/api/appointments",
        json={
            "doctor_id": data["doc1"].id,
            "doctor_name": data["doc1"].user.name,
            "doctor_specialty": "General Physician",
            "hospital": "City Care Hospital",
            "appointment_date": "2026-10-16",
            "appointment_time": "11:00 AM"
        },
        headers=pat_headers
    )
    apt_id = res.json()["id"]

    # 2. Doctor approves
    appr_res = client.patch(f"/api/appointments/{apt_id}/approve", headers=doc_headers)
    assert appr_res.status_code == 200, appr_res.text
    assert appr_res.json()["appointment_status"] == "Confirmed"

    # DB Check
    db_apt = db_session.query(Appointment).filter(Appointment.id == apt_id).first()
    assert db_apt.status == "Confirmed"


def test_case_3_doctor_declines_appointment(db_session, setup_users):
    """Test Case 3: Doctor declines pending appointment with reason -> Status becomes DECLINED."""
    data = setup_users
    pat_headers = {"Authorization": f"Bearer {data['tokens']['pat1']}"}
    doc_headers = {"Authorization": f"Bearer {data['tokens']['doc1']}"}

    # 1. Book appointment
    res = client.post(
        "/api/appointments",
        json={
            "doctor_id": data["doc1"].id,
            "doctor_name": data["doc1"].user.name,
            "doctor_specialty": "General Physician",
            "hospital": "City Care Hospital",
            "appointment_date": "2026-10-17",
            "appointment_time": "02:00 PM"
        },
        headers=pat_headers
    )
    apt_id = res.json()["id"]

    # 2. Doctor declines
    dec_res = client.patch(
        f"/api/appointments/{apt_id}/decline",
        json={"reason": "Doctor is unavailable at this time"},
        headers=doc_headers
    )
    assert dec_res.status_code == 200, dec_res.text
    assert dec_res.json()["appointment_status"] == "Declined"

    # DB Check
    db_apt = db_session.query(Appointment).filter(Appointment.id == apt_id).first()
    assert db_apt.status == "Declined"
    assert "Doctor is unavailable" in db_apt.cancellation_reason


def test_case_4_patient_cannot_approve(db_session, setup_users):
    """Test Case 4: Patient attempts approval -> 403 Forbidden."""
    data = setup_users
    pat_headers = {"Authorization": f"Bearer {data['tokens']['pat1']}"}

    res = client.post(
        "/api/appointments",
        json={
            "doctor_name": data["doc1"].user.name,
            "doctor_specialty": "General Physician",
            "hospital": "City Care Hospital",
            "appointment_date": "2026-10-18",
            "appointment_time": "09:00 AM"
        },
        headers=pat_headers
    )
    apt_id = res.json()["id"]

    # Patient calls approve
    appr_res = client.patch(f"/api/appointments/{apt_id}/approve", headers=pat_headers)
    assert appr_res.status_code == 403, appr_res.text


def test_case_5_doctor_cannot_approve_another_doctors_appointment(db_session, setup_users):
    """Test Case 5: Doctor attempts to approve another doctor's appointment -> 403 Forbidden."""
    data = setup_users
    pat_headers = {"Authorization": f"Bearer {data['tokens']['pat1']}"}
    doc2_headers = {"Authorization": f"Bearer {data['tokens']['doc2']}"}

    # Book with Doctor 1
    res = client.post(
        "/api/appointments",
        json={
            "doctor_id": data["doc1"].id,
            "doctor_name": data["doc1"].user.name,
            "doctor_specialty": "General Physician",
            "hospital": "City Care Hospital",
            "appointment_date": "2026-10-19",
            "appointment_time": "03:00 PM"
        },
        headers=pat_headers
    )
    apt_id = res.json()["id"]

    # Doctor 2 attempts approval
    appr_res = client.patch(f"/api/appointments/{apt_id}/approve", headers=doc2_headers)
    assert appr_res.status_code == 403, appr_res.text


def test_case_6_cannot_approve_declined_appointment(db_session, setup_users):
    """Test Case 6: Doctor attempts to approve already declined appointment -> 400 Bad Request."""
    data = setup_users
    pat_headers = {"Authorization": f"Bearer {data['tokens']['pat1']}"}
    doc_headers = {"Authorization": f"Bearer {data['tokens']['doc1']}"}

    res = client.post(
        "/api/appointments",
        json={
            "doctor_id": data["doc1"].id,
            "doctor_name": data["doc1"].user.name,
            "doctor_specialty": "General Physician",
            "hospital": "City Care Hospital",
            "appointment_date": "2026-10-20",
            "appointment_time": "04:00 PM"
        },
        headers=pat_headers
    )
    apt_id = res.json()["id"]

    # Decline
    client.patch(f"/api/appointments/{apt_id}/decline", json={"reason": "Unavailable"}, headers=doc_headers)

    # Attempt Approve on Declined
    appr_res = client.patch(f"/api/appointments/{apt_id}/approve", headers=doc_headers)
    assert appr_res.status_code == 400, appr_res.text


def test_case_7_slot_conflict_prevents_double_booking(db_session, setup_users):
    """Test Case 7: Slot conflict check prevents multiple Confirmed appointments for same doctor at same time."""
    data = setup_users
    pat1_headers = {"Authorization": f"Bearer {data['tokens']['pat1']}"}
    pat2_headers = {"Authorization": f"Bearer {data['tokens']['pat2']}"}
    doc_headers = {"Authorization": f"Bearer {data['tokens']['doc1']}"}

    # 1. Patient 1 books 10:30 AM on Oct 25
    res1 = client.post(
        "/api/appointments",
        json={
            "doctor_id": data["doc1"].id,
            "doctor_name": data["doc1"].user.name,
            "doctor_specialty": "General Physician",
            "hospital": "City Care Hospital",
            "appointment_date": "2026-10-25",
            "appointment_time": "10:30 AM"
        },
        headers=pat1_headers
    )
    apt1_id = res1.json()["id"]

    # Doctor approves Patient 1's request -> Slot is now Confirmed!
    client.patch(f"/api/appointments/{apt1_id}/approve", headers=doc_headers)

    # 2. Patient 2 attempts booking same slot (10:30 AM on Oct 25)
    res2 = client.post(
        "/api/appointments",
        json={
            "doctor_id": data["doc1"].id,
            "doctor_name": data["doc1"].user.name,
            "doctor_specialty": "General Physician",
            "hospital": "City Care Hospital",
            "appointment_date": "2026-10-25",
            "appointment_time": "10:30 AM"
        },
        headers=pat2_headers
    )
    # Server blocks booking already confirmed slot with 409 CONFLICT
    assert res2.status_code == 409, res2.text
