import logging
from sqlalchemy import create_engine
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
    logging.info("SQLAlchemy engine initialized successfully.")
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
