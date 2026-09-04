import sys
import os
from fastapi.testclient import TestClient

from app.main import app
from app.database.database import SessionLocal
from app.database.models import User, Patient, UserRole
from app.core.security import create_access_token

def test_prescriptions_endpoints():
    client = TestClient(app)
    db = SessionLocal()

    try:
        # 1. Ensure test user
        user = db.query(User).filter(User.email == "test_rx_patient@example.com").first()
        if not user:
            user = User(
                email="test_rx_patient@example.com",
                name="Test Rx Patient",
                role=UserRole.PATIENT,
                is_active=True,
                is_onboarded=True
            )
            db.add(user)
            db.commit()
            db.refresh(user)

            patient = Patient(
                user_id=user.id,
                blood_group="B+",
                gender="Male"
            )
            db.add(patient)
            db.commit()
            db.refresh(patient)
        else:
            patient = db.query(Patient).filter(Patient.user_id == user.id).first()

        token = create_access_token(subject=user.id, claims={"role": "PATIENT", "email": user.email})
        headers = {"Authorization": f"Bearer {token}"}

        # 2. Test GET /api/prescriptions
        res = client.get("/api/prescriptions", headers=headers)
        assert res.status_code == 200, res.text
        data = res.json()
        assert "prescriptions" in data
        assert isinstance(data["prescriptions"], list)

        # 3. Test GET /api/prescriptions/summary
        res_sum = client.get("/api/prescriptions/summary", headers=headers)
        assert res_sum.status_code == 200, res_sum.text
        sum_data = res_sum.json()
        assert "total_prescriptions" in sum_data
        assert "active_prescriptions" in sum_data
        assert "need_refills" in sum_data
        assert "this_month" in sum_data

        # 4. Test GET /api/prescriptions/reminders/all
        res_rem = client.get("/api/prescriptions/reminders/all", headers=headers)
        assert res_rem.status_code == 200, res_rem.text
        rems = res_rem.json()
        assert isinstance(rems, list)
        if len(rems) > 0:
            first_rem = rems[0]
            # 5. Test PATCH /api/prescriptions/reminders/{id}/toggle
            res_tog = client.patch(f"/api/prescriptions/reminders/{first_rem['id']}/toggle", headers=headers)
            assert res_tog.status_code == 200, res_tog.text
            assert res_tog.json()["is_taken"] == (not first_rem["is_taken"])

        if len(data["prescriptions"]) > 0:
            first_rx = data["prescriptions"][0]
            # 6. Test POST /api/prescriptions/{id}/refill
            res_rfl = client.post(
                f"/api/prescriptions/{first_rx['id']}/refill",
                json={"preferred_pharmacy": "City Care Pharmacy", "notes": "Refill needed"},
                headers=headers
            )
            assert res_rfl.status_code == 200, res_rfl.text
            assert res_rfl.json()["success"] is True

        # 7. Test POST /api/prescriptions (Manual creation)
        res_req = client.post(
            "/api/prescriptions",
            json={
                "title": "Prescription - Dr. Priya Sharma",
                "doctor_name": "Dr. Priya Sharma",
                "hospital": "City Care Hospital",
                "medication_name": "Amoxicillin 500mg",
                "dosage": "1 tablet",
                "frequency": "Thrice daily",
                "duration": "5 days",
                "instructions": "Take after meals"
            },
            headers=headers
        )
        assert res_req.status_code == 201, res_req.text

        # 8. Test POST /api/prescriptions/upload
        res_up = client.post(
            "/api/prescriptions/upload",
            data={
                "medication_name": "Azithromycin 500mg",
                "dosage": "1 tablet",
                "frequency": "Once daily",
                "duration": "3 days",
                "instructions": "Take after meals",
                "doctor_name": "Dr. Arjun Mehta",
                "hospital": "HealthPlus Clinic"
            },
            headers=headers
        )
        assert res_up.status_code == 201, res_up.text
        created_rx = res_up.json()
        assert "id" in created_rx

        # 9. Test DELETE /api/prescriptions/{id}
        res_del = client.delete(f"/api/prescriptions/{created_rx['id']}", headers=headers)
        assert res_del.status_code == 200, res_del.text

        print("[OK] All Prescriptions API endpoints passed successfully!")
    finally:
        db.close()

if __name__ == "__main__":
    test_prescriptions_endpoints()
