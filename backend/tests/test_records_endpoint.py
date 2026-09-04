import io
import json
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.database.database import SessionLocal
from app.database.models import User, Patient, UserRole
from app.core.security import create_access_token
from app.models.medical_record import MedicalRecord

client = TestClient(app)

def test_medical_records_crud_and_summary():
    db = SessionLocal()
    try:
        # 1. Ensure test patient exists
        test_email = "patient_records_test@example.com"
        user = db.query(User).filter(User.email == test_email).first()
        if not user:
            user = User(
                email=test_email,
                name="Test Records Patient",
                role=UserRole.PATIENT,
                is_active=True,
                is_onboarded=True
            )
            db.add(user)
            db.commit()
            db.refresh(user)

            patient = Patient(user_id=user.id, blood_group="A+")
            db.add(patient)
            db.commit()
            db.refresh(patient)
        else:
            patient = db.query(Patient).filter(Patient.user_id == user.id).first()

        token = create_access_token(subject=user.id, claims={"role": "PATIENT", "email": user.email})
        headers = {"Authorization": f"Bearer {token}"}

        # 2. Test GET /api/records
        res = client.get("/api/records", headers=headers)
        assert res.status_code == 200, res.text
        data = res.json()
        assert "records" in data
        assert "total_count" in data
        assert data["total_count"] >= 0

        # 3. Test GET /api/records/summary
        sum_res = client.get("/api/records/summary", headers=headers)
        assert sum_res.status_code == 200, sum_res.text
        sum_data = sum_res.json()
        assert sum_data["total_records"] >= 0
        assert "storage_used_formatted" in sum_data
        assert "storage_percentage" in sum_data

        # 4. Test POST /api/records/upload (Multipart file upload)
        file_content = b"%PDF-1.4 Mock Lab Result Document Content for Automated Test"
        file_tuple = ("Test_Urine_Analysis.pdf", io.BytesIO(file_content), "application/pdf")

        upload_payload = {
            "title": "Urine Routine & Microscopic",
            "category": "Lab Report",
            "doctor_name": "Dr. Priya Sharma",
            "hospital": "City Care Hospital",
            "record_date": "29 Aug 2026",
            "tags": '["Urinalysis", "Routine"]',
            "description": "Clean sample, normal biochemistry."
        }

        up_res = client.post(
            "/api/records/upload",
            data=upload_payload,
            files={"file": file_tuple},
            headers=headers
        )
        assert up_res.status_code == 201, up_res.text
        created_rec = up_res.json()
        assert created_rec["title"] == "Urine Routine & Microscopic"
        rec_id = created_rec["id"]

        # 5. Test GET /api/records/{id}
        det_res = client.get(f"/api/records/{rec_id}", headers=headers)
        assert det_res.status_code == 200
        assert det_res.json()["id"] == rec_id

        # 6. Test POST /api/records/{id}/share
        share_res = client.post(
            f"/api/records/{rec_id}/share",
            json={
                "doctor_name": "Dr. Arjun Mehta",
                "doctor_email": "arjun@cardio.com",
                "permission": "VIEW",
                "expires_in_days": 30
            },
            headers=headers
        )
        assert share_res.status_code == 200
        assert share_res.json()["success"] is True

        # 7. Test DELETE /api/records/{id} (Soft delete)
        del_res = client.delete(f"/api/records/{rec_id}", headers=headers)
        assert del_res.status_code == 200

        # Verify in trash
        trash_res = client.get("/api/records/trash/all", headers=headers)
        assert trash_res.status_code == 200
        trash_items = trash_res.json()
        assert any(item["id"] == rec_id for item in trash_items)

        # 8. Test POST /api/records/{id}/restore
        res_restore = client.post(f"/api/records/{rec_id}/restore", headers=headers)
        assert res_restore.status_code == 200
        assert res_restore.json()["is_deleted"] is False

        # Cleanup: Permanent delete
        client.delete(f"/api/records/{rec_id}/permanent", headers=headers)

        print("[OK] All Medical Records CRUD & Summary backend tests passed successfully!")
    finally:
        db.close()

if __name__ == "__main__":
    test_medical_records_crud_and_summary()
