# MediAssist Audit Documentation Suite

This directory contains the complete, automated **API + AI Behavioral Audit** artifacts for the **MediAssist Backend**.

## Audit Documents Index

1. [**FINAL_AUDIT.md**](file:///c:/Desktop/Projects/MediAssist/backend/audit/FINAL_AUDIT.md) — Master Audit Report, Category Scores (/100), and Production Readiness Rating.
2. [**API_INVENTORY.md**](file:///c:/Desktop/Projects/MediAssist/backend/audit/API_INVENTORY.md) — Complete enumeration of all 51 OpenAPI routes, HTTP methods, authorization requirements, and roles.
3. [**SECURITY_AUDIT.md**](file:///c:/Desktop/Projects/MediAssist/backend/audit/SECURITY_AUDIT.md) — Authentication, RBAC, Patient Isolation, and Secret Exposure verification.
4. [**PERFORMANCE_AUDIT.md**](file:///c:/Desktop/Projects/MediAssist/backend/audit/PERFORMANCE_AUDIT.md) — Latency benchmark breakdown (min, mean, p50, p95, p99, throughput).
5. [**AI_BEHAVIOR_AUDIT.md**](file:///c:/Desktop/Projects/MediAssist/backend/audit/AI_BEHAVIOR_AUDIT.md) — Evaluation of 20 real AI behavioral & safety properties via OpenRouter.
6. [**DATABASE_AUDIT.md**](file:///c:/Desktop/Projects/MediAssist/backend/audit/DATABASE_AUDIT.md) — Database query counts, N+1 query analysis, and connection pool metrics.
7. [**ERROR_HANDLING_AUDIT.md**](file:///c:/Desktop/Projects/MediAssist/backend/audit/ERROR_HANDLING_AUDIT.md) — Error payload schema format and stack trace leak audit.
8. [**results.json**](file:///c:/Desktop/Projects/MediAssist/backend/audit/results.json) — Machine-readable test results and metrics JSON file.

## Execution Commands

- **Re-run API Inventory Discovery**:
  ```powershell
  .\venv\Scripts\python.exe audit_inventory.py
  ```

- **Re-run Full Security & AI Audit Test Suite**:
  ```powershell
  .\venv\Scripts\pytest tests/audit/ tests/ai/
  ```
