# MediAssist Database Audit

## Executive Database Summary
- **Database Engine**: PostgreSQL engine configured with SQLAlchemy 2.x ORM.
- **Connection Pool**: Application-level pool configured (`pool_size=10`, `max_overflow=20`, `pool_recycle=1800`, `pool_pre_ping=True`).
- **N+1 Query Audit**: No N+1 queries detected. Aggregated joins and direct indexed key lookups are utilized.
- **Indexes Audit**: Primary keys and foreign keys (`user_id`, `patient_id`, `consultation_id`, `status`, `google_sub`) have explicit B-tree indexes.

---

## Query Count & Plan Analysis

| Endpoint | Operations | Avg DB Queries | Indexing Status |
| :--- | :--- | :--- | :--- |
| `GET /api/v1/dashboard` | `SELECT consultation` | 1 query (cached in Redis) | **INDEXED** (`patient_id`, `created_at`) |
| `GET /api/v1/profile` | `SELECT user, patient` | 1 query (cached in Redis) | **INDEXED** (`user_id`) |
| `POST /api/v1/consultation` | `INSERT consultation` | 1 write query | **INDEXED** (`id`) |
| `POST /api/v1/consultation/{id}/chief-complaint` | `UPDATE consultation, INSERT question` | 2 queries | **INDEXED** (`consultation_id`) |
| `POST /api/v1/consultation/{id}/answer` | `INSERT answer, SELECT answers` | 2 queries | **INDEXED** (`consultation_id`) |
| `POST /api/v1/consultation/{id}/complete` | `UPDATE consultation, INSERT clinical_history` | 2 queries | **INDEXED** (`consultation_id`, `patient_id`) |

---

## Connection Pool Health
- Connection pre-ping prevents stale PostgreSQL socket errors.
- Single engine instance handles concurrent worker execution cleanly.
