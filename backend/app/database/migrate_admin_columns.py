import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..")))

from sqlalchemy import text
from app.database.database import engine, Base
from app.models.admin import Organization, Department, AuditLog, SystemConfiguration

def run_migration():
    print("Running Admin Schema Migration & Table Verification...")
    
    # 1. Create any missing new tables
    Base.metadata.create_all(bind=engine)

    # 2. Add new columns to doctors table safely with IF NOT EXISTS
    with engine.begin() as conn:
        columns_to_add = [
            ("registration_authority", "VARCHAR(255) DEFAULT 'National Medical Commission'"),
            ("qualification", "VARCHAR(255) DEFAULT 'MBBS, MD'"),
            ("designation", "VARCHAR(255) DEFAULT 'Consultant Physician'"),
            ("department", "VARCHAR(255) DEFAULT 'General Medicine'"),
            ("organization_id", "VARCHAR(36)"),
            ("department_id", "VARCHAR(36)"),
            ("phone", "VARCHAR(50)"),
            ("bio", "TEXT"),
            ("consultation_fee", "INTEGER DEFAULT 500"),
            ("account_status", "VARCHAR(50) DEFAULT 'ACTIVE'"),
            ("invitation_token", "VARCHAR(255)"),
            ("invitation_sent_at", "TIMESTAMP WITH TIME ZONE"),
            ("invitation_accepted_at", "TIMESTAMP WITH TIME ZONE"),
        ]

        for col_name, col_type in columns_to_add:
            try:
                conn.execute(text(f"ALTER TABLE doctors ADD COLUMN IF NOT EXISTS {col_name} {col_type};"))
                print(f"[OK] Verified doctors.{col_name}")
            except Exception as e:
                print(f"Notice adding doctors.{col_name}: {e}")

    print("Admin migration completed successfully!")

if __name__ == "__main__":
    run_migration()
