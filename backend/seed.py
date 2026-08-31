import json
from app.database.database import engine, Base, SessionLocal
from app.database.models import User, UserRole, Doctor, Patient
from app.core.security import get_password_hash
from app.models.ai_conversation import AIConversation

def seed_database():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        print("Seeding MediAssist database...")

        # 1. Seed Admin
        admin_email = "admin@mediassist"
        admin = db.query(User).filter(User.email == admin_email).first()
        if not admin:
            admin = User(
                email=admin_email,
                name="System Administrator",
                role=UserRole.ADMIN,
                password_hash=get_password_hash("Password123!"),
                is_active=True,
                is_onboarded=True,
            )
            db.add(admin)
            db.commit()
            db.refresh(admin)
            print(f"[OK] Admin user created: {admin.email}")

        # 2. Seed Test Doctor (doctor@mediassist.test)
        doc_email = "doctor@mediassist.test"
        doc_user = db.query(User).filter(User.email == doc_email).first()
        if not doc_user:
            doc_user = User(
                email=doc_email,
                name="Dr. Sarah Jenkins",
                role=UserRole.DOCTOR,
                password_hash=get_password_hash("Doctor@123"),
                is_active=True,
                is_onboarded=True,
            )
            db.add(doc_user)
            db.commit()
            db.refresh(doc_user)

            doc_profile = Doctor(
                user_id=doc_user.id,
                doctor_id="DR-TEST-001",
                specialization="General Physician",
                registration_number="NMC-99201",
                qualification="MBBS, MD (Internal Medicine)",
                designation="Senior Consultant Physician",
                department="General Medicine",
                hospital="MediAssist Medical Center",
                experience=10,
                consultation_fee=600,
                account_status="ACTIVE",
                verification_status="VERIFIED"
            )
            db.add(doc_profile)
            db.commit()
            print(f"[OK] Test Doctor created: {doc_user.email} (Password: Doctor@123)")
        else:
            doc_user.password_hash = get_password_hash("Doctor@123")
            doc_user.name = "Dr. Sarah Jenkins"
            doc_profile = db.query(Doctor).filter(Doctor.user_id == doc_user.id).first()
            if not doc_profile:
                doc_profile = Doctor(
                    user_id=doc_user.id,
                    doctor_id="DR-TEST-001",
                    specialization="General Physician",
                    registration_number="NMC-99201",
                    qualification="MBBS, MD (Internal Medicine)",
                    designation="Senior Consultant Physician",
                    department="General Medicine",
                    hospital="MediAssist Medical Center",
                    experience=10,
                    consultation_fee=600,
                    account_status="ACTIVE",
                    verification_status="VERIFIED"
                )
                db.add(doc_profile)
            db.commit()

        # 3. Seed Test Patient (patient@mediassist.test)
        pat_email = "patient@mediassist.test"
        pat_user = db.query(User).filter(User.email == pat_email).first()
        if not pat_user:
            pat_user = User(
                email=pat_email,
                name="Test Patient (Rahul)",
                role=UserRole.PATIENT,
                password_hash=get_password_hash("Patient@123"),
                is_active=True,
                is_onboarded=True,
            )
            db.add(pat_user)
            db.commit()
            db.refresh(pat_user)

            pat_profile = Patient(
                user_id=pat_user.id,
                date_of_birth="15 January 1995",
                gender="Male",
                blood_group="O+",
                phone="+91 98000 11122",
                address="45, Green Avenue, Vasant Kunj, New Delhi 110070, India",
                city="New Delhi",
                state="Delhi",
                postal_code="110070",
                country="India",
                marital_status="Single",
                allergies="Penicillin, Dust Mites",
                chronic_conditions="Mild Asthma",
                current_medications="Salbutamol Inhaler (As needed)",
                primary_physician="Dr. Sarah Jenkins",
                primary_physician_specialty="General Physician",
                emergency_contact=json.dumps({
                    "name": "Sunita Sharma",
                    "relationship": "Mother",
                    "phone": "+91 98111 22334",
                    "email": "sunita.sharma@example.com",
                    "address": "45, Green Avenue, Vasant Kunj, New Delhi"
                }),
                kyc_verified=True
            )
            db.add(pat_profile)
            db.commit()
            db.refresh(pat_profile)
            print(f"[OK] Test Patient created: {pat_user.email} (Password: Patient@123)")
        else:
            pat_user.password_hash = get_password_hash("Patient@123")
            pat_user.name = "Test Patient (Rahul)"
            pat_profile = db.query(Patient).filter(Patient.user_id == pat_user.id).first()
            if pat_profile:
                pat_profile.date_of_birth = "15 January 1995"
                pat_profile.gender = "Male"
                pat_profile.blood_group = "O+"
                pat_profile.phone = "+91 98000 11122"
                pat_profile.allergies = "Penicillin, Dust Mites"
                pat_profile.chronic_conditions = "Mild Asthma"
                pat_profile.current_medications = "Salbutamol Inhaler (As needed)"
                pat_profile.primary_physician = "Dr. Sarah Jenkins"
                pat_profile.primary_physician_specialty = "General Physician"
                db.commit()

        if pat_profile:
            from app.services.record_service import record_service
            from app.services.prescription_service import prescription_service
            from app.services.appointment_service import appointment_service
            from app.services.health_tip_service import health_tip_service
            from app.services.reminder_service import reminder_service
            from app.services.settings_service import settings_service
            record_service.ensure_default_patient_records(pat_profile.id, db)
            prescription_service.ensure_default_prescriptions(pat_profile.id, db)
            appointment_service.ensure_default_appointments(pat_profile.id, db)
            health_tip_service.ensure_curated_health_tips(db)
            reminder_service.ensure_default_patient_reminders(pat_profile.id, db)
            settings_service.get_or_create_settings(pat_user, db)
            settings_service.ensure_default_login_history_and_devices(pat_user, db)

            # Seed AI Health Summary / Conversation record for patient
            ai_conv = db.query(AIConversation).filter(AIConversation.patient_id == pat_profile.id).first()
            if not ai_conv:
                ai_conv = AIConversation(
                    patient_id=pat_profile.id,
                    title="Preventive Care & Asthma Management Guide",
                    clinical_summary="AI-Generated Health Summary: For mild asthma management, maintain regular peak flow monitoring, keep a rescue inhaler (Salbutamol) accessible, avoid known triggers like dust mites and cold dry air, and stay hydrated. Consult Dr. Sarah Jenkins if symptoms increase.",
                    summary_preview="Mild asthma management & trigger avoidance."
                )
                db.add(ai_conv)
                db.commit()
                print(f"[OK] AI Health Summary seeded for {pat_user.email}")

        print("Database seeding complete.")
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
