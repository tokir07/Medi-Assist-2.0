import logging
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, declarative_base
from app.core.config import settings

db_url = settings.DATABASE_URL
if db_url.startswith("postgres://"):
    db_url = db_url.replace("postgres://", "postgresql://", 1)

if not db_url.startswith("postgresql"):
    raise RuntimeError(f"Database configuration error: DATABASE_URL must be a valid PostgreSQL connection string. Found: {db_url}")

engine = None
try:
    # Application-level SQLAlchemy connection pool configuration
    engine = create_engine(
        db_url,
        echo=False,
        pool_size=10,
        max_overflow=20,
        pool_timeout=30,
        pool_recycle=1800,
        pool_pre_ping=True
    )
    with engine.connect() as conn:
        conn.execute(text("ALTER TABLE patients ADD COLUMN IF NOT EXISTS phone VARCHAR(50);"))
        conn.execute(text("ALTER TABLE patients ADD COLUMN IF NOT EXISTS abha_id VARCHAR(100);"))
        conn.execute(text("ALTER TABLE patients ADD COLUMN IF NOT EXISTS address VARCHAR(500);"))
        conn.execute(text("ALTER TABLE patients ADD COLUMN IF NOT EXISTS city VARCHAR(100);"))
        conn.execute(text("ALTER TABLE patients ADD COLUMN IF NOT EXISTS state VARCHAR(100);"))
        conn.execute(text("ALTER TABLE patients ADD COLUMN IF NOT EXISTS postal_code VARCHAR(20);"))
        conn.execute(text("ALTER TABLE patients ADD COLUMN IF NOT EXISTS country VARCHAR(100) DEFAULT 'India';"))
        conn.execute(text("ALTER TABLE patients ADD COLUMN IF NOT EXISTS marital_status VARCHAR(50) DEFAULT 'Married';"))
        conn.execute(text("ALTER TABLE patients ADD COLUMN IF NOT EXISTS allergies VARCHAR(255) DEFAULT 'Pollen, Penicillin';"))
        conn.execute(text("ALTER TABLE patients ADD COLUMN IF NOT EXISTS chronic_conditions VARCHAR(255) DEFAULT 'None';"))
        conn.execute(text("ALTER TABLE patients ADD COLUMN IF NOT EXISTS current_medications VARCHAR(255) DEFAULT 'Atorvastatin 10mg (Daily)';"))
        conn.execute(text("ALTER TABLE patients ADD COLUMN IF NOT EXISTS primary_physician VARCHAR(255) DEFAULT 'Dr. Priya Sharma';"))
        conn.execute(text("ALTER TABLE patients ADD COLUMN IF NOT EXISTS primary_physician_specialty VARCHAR(100) DEFAULT 'General Physician';"))
        conn.execute(text("ALTER TABLE patients ADD COLUMN IF NOT EXISTS kyc_verified BOOLEAN DEFAULT TRUE;"))
        conn.execute(text("ALTER TABLE voice_sessions ADD COLUMN IF NOT EXISTS transcript TEXT;"))
        conn.execute(text("ALTER TABLE medical_records ADD COLUMN IF NOT EXISTS summary_quick TEXT;"))
        conn.execute(text("ALTER TABLE medical_records ADD COLUMN IF NOT EXISTS summary_detailed TEXT;"))
        conn.execute(text("ALTER TABLE medical_records ADD COLUMN IF NOT EXISTS summary_structured TEXT;"))
        conn.execute(text("ALTER TABLE medical_records ADD COLUMN IF NOT EXISTS summary_status VARCHAR(50) DEFAULT 'NOT_GENERATED';"))
        conn.execute(text("ALTER TABLE medical_records ADD COLUMN IF NOT EXISTS summary_version INTEGER DEFAULT 1;"))
        conn.execute(text("ALTER TABLE medical_records ADD COLUMN IF NOT EXISTS summary_generated_at TIMESTAMP WITH TIME ZONE;"))
        conn.execute(text("ALTER TABLE medical_records ADD COLUMN IF NOT EXISTS clinician_review_status VARCHAR(50) DEFAULT 'NOT_REVIEWED';"))
        conn.commit()
        logging.info("Successfully connected to PostgreSQL database and verified table schemas.")
except Exception as e:
    logging.error(f"CRITICAL: Failed to connect to PostgreSQL database at {db_url}: {e}")
    raise RuntimeError(f"Could not connect to MediAssist PostgreSQL database at {db_url}: {e}")

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
