# MediAssist API Inventory

Total Discovered OpenAPI Endpoints: **51**

| Method | Path | Auth Required | Role | Tags | Summary |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `GET` | `/` | NO | **PATIENT / DOCTOR / ADMIN** | None | Root |
| `GET` | `/api/admin/test` | YES | **ADMIN** | Admin RBAC | Admin Test Endpoint |
| `POST` | `/api/auth/google` | YES | **PATIENT / DOCTOR / ADMIN** | Authentication | Google Auth |
| `GET` | `/api/auth/health` | NO | **PATIENT / DOCTOR / ADMIN** | Authentication | Health Check |
| `GET` | `/api/auth/me` | YES | **PATIENT / DOCTOR / ADMIN** | Authentication | Get Me |
| `POST` | `/api/auth/register` | NO | **PATIENT / DOCTOR / ADMIN** | Authentication | Register Account |
| `POST` | `/api/consultation` | YES | **PATIENT** | AI Pre-Consultation | Start Consultation |
| `GET` | `/api/consultation/history` | YES | **PATIENT** | AI Pre-Consultation | List Consultation History |
| `POST` | `/api/consultation/{id}/answer` | YES | **PATIENT** | AI Pre-Consultation | Submit Answer |
| `POST` | `/api/consultation/{id}/chief-complaint` | YES | **PATIENT** | AI Pre-Consultation | Submit Chief Complaint |
| `POST` | `/api/consultation/{id}/complete` | YES | **PATIENT** | AI Pre-Consultation | Complete Consultation |
| `PATCH` | `/api/consultation/{id}/information/{info_id}` | YES | **PATIENT** | AI Pre-Consultation | Correct Information |
| `GET` | `/api/consultation/{id}/next-question` | YES | **PATIENT** | AI Pre-Consultation | Get Next Question |
| `GET` | `/api/consultation/{id}/review` | YES | **PATIENT** | AI Pre-Consultation | Review Consultation |
| `POST` | `/api/consultation/{id}/voice/pause` | YES | **PATIENT** | Voice Interaction | Pause Voice Session |
| `POST` | `/api/consultation/{id}/voice/resume` | YES | **PATIENT** | Voice Interaction | Resume Voice Session |
| `POST` | `/api/consultation/{id}/voice/start` | YES | **PATIENT** | Voice Interaction | Start Voice Session |
| `POST` | `/api/consultation/{id}/voice/stop` | YES | **PATIENT** | Voice Interaction | Stop Voice Session |
| `POST` | `/api/consultation/{id}/voice/transcribe` | YES | **PATIENT** | Voice Interaction | Transcribe Voice Audio |
| `GET` | `/api/dashboard` | YES | **PATIENT** | Patient Dashboard | Get Dashboard |
| `GET` | `/api/doctor/test` | YES | **DOCTOR** | Doctor RBAC | Doctor Test Endpoint |
| `GET` | `/api/health/ai` | YES | **PATIENT / DOCTOR / ADMIN** | Health & AI Status | Get Ai Health |
| `GET` | `/api/history` | YES | **PATIENT** | Clinical History | Get Clinical Histories |
| `GET` | `/api/history/consultation/{consultation_id}` | YES | **PATIENT** | Clinical History | Get Clinical History By Consultation |
| `GET` | `/api/history/{id}` | YES | **PATIENT** | Clinical History | Get Clinical History By Id |
| `PATCH` | `/api/history/{id}` | YES | **PATIENT** | Clinical History | Update Clinical History |
| `POST` | `/api/patients/onboarding` | YES | **PATIENT** | Patient Onboarding & Profile | Complete Onboarding |
| `GET` | `/api/patients/profile` | YES | **PATIENT** | Patient Onboarding & Profile | Get Patient Profile |
| `GET` | `/api/profile` | YES | **PATIENT** | Patient Profile | Get Profile |
| `PATCH` | `/api/profile` | YES | **PATIENT** | Patient Profile | Update Profile |
| `POST` | `/api/v1/consultation` | YES | **PATIENT** | AI Pre-Consultation | Start Consultation |
| `GET` | `/api/v1/consultation/history` | YES | **PATIENT** | AI Pre-Consultation | List Consultation History |
| `POST` | `/api/v1/consultation/{id}/answer` | YES | **PATIENT** | AI Pre-Consultation | Submit Answer |
| `POST` | `/api/v1/consultation/{id}/chief-complaint` | YES | **PATIENT** | AI Pre-Consultation | Submit Chief Complaint |
| `POST` | `/api/v1/consultation/{id}/complete` | YES | **PATIENT** | AI Pre-Consultation | Complete Consultation |
| `PATCH` | `/api/v1/consultation/{id}/information/{info_id}` | YES | **PATIENT** | AI Pre-Consultation | Correct Information |
| `GET` | `/api/v1/consultation/{id}/next-question` | YES | **PATIENT** | AI Pre-Consultation | Get Next Question |
| `GET` | `/api/v1/consultation/{id}/review` | YES | **PATIENT** | AI Pre-Consultation | Review Consultation |
| `POST` | `/api/v1/consultation/{id}/voice/pause` | YES | **PATIENT** | Voice Interaction | Pause Voice Session |
| `POST` | `/api/v1/consultation/{id}/voice/resume` | YES | **PATIENT** | Voice Interaction | Resume Voice Session |
| `POST` | `/api/v1/consultation/{id}/voice/start` | YES | **PATIENT** | Voice Interaction | Start Voice Session |
| `POST` | `/api/v1/consultation/{id}/voice/stop` | YES | **PATIENT** | Voice Interaction | Stop Voice Session |
| `POST` | `/api/v1/consultation/{id}/voice/transcribe` | YES | **PATIENT** | Voice Interaction | Transcribe Voice Audio |
| `GET` | `/api/v1/dashboard` | YES | **PATIENT** | Patient Dashboard | Get Dashboard |
| `GET` | `/api/v1/health/ai` | YES | **PATIENT / DOCTOR / ADMIN** | Health & AI Status | Get Ai Health |
| `GET` | `/api/v1/history` | YES | **PATIENT** | Clinical History | Get Clinical Histories |
| `GET` | `/api/v1/history/consultation/{consultation_id}` | YES | **PATIENT** | Clinical History | Get Clinical History By Consultation |
| `GET` | `/api/v1/history/{id}` | YES | **PATIENT** | Clinical History | Get Clinical History By Id |
| `PATCH` | `/api/v1/history/{id}` | YES | **PATIENT** | Clinical History | Update Clinical History |
| `GET` | `/api/v1/profile` | YES | **PATIENT** | Patient Profile | Get Profile |
| `PATCH` | `/api/v1/profile` | YES | **PATIENT** | Patient Profile | Update Profile |
