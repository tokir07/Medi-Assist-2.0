# MediAssist Mock Data Audit & Removal Plan

## Executive Summary
This document catalogs all mock, hardcoded, or placeholder data instances identified across the MediAssist backend services and React Native mobile frontend. All runtime mock patient data is replaced with **real PostgreSQL persistence** derived strictly from authenticated JWT tokens (`get_current_patient()`).

---

## Catalog of Identified Mock Data & Production Replacements

| Location | Mock Value / Object | Purpose | Production Replacement |
| :--- | :--- | :--- | :--- |
| `backend/app/services/profile_service.py` | `phone="+91 98765 43210"` | Hardcoded patient phone | `patient.phone` column in PostgreSQL |
| `backend/app/services/profile_service.py` | `abha_id="ABHA-1234-5678-9012"` | Hardcoded ABHA ID | `patient.abha_id` column in PostgreSQL |
| `backend/app/services/dashboard_service.py` | Hardcoded `upcoming_appointment` | Fake doctor appointment | Dynamic DB lookup or `null` ("No upcoming appointments") |
| `backend/app/services/dashboard_service.py` | Hardcoded `recent_records` | Fake blood test report | Dynamic DB lookup or `[]` ("No medical records yet") |
| `frontend/src/mock/patientData.ts` | `mockPatientProfile`, `mockUpcomingAppointment` | Offline UI placeholders | Removed from runtime. Replaced by live API calls |
| `frontend/src/services/patient/patientService.ts` | `mockPatientProfile` | Returning static mock profile | Live `getFromBackend('/v1/profile')` API call |
| `frontend/src/services/history/historyService.ts` | `mockClinicalHistoryList` | Returning static history list | Live `getFromBackend('/v1/history')` API call |
| `frontend/src/app/(patient)/profile/index.tsx` | `'Neha Sharma (Wife)'` fallback | Emergency contact fallback | Real `profile.emergency_contact` or empty string |
| `frontend/src/app/(patient)/profile/edit.tsx` | `'Neha Sharma (Wife)'` state init | Initial form state | Loaded from active patient profile state |

---

## Avatar & Profile Photo Precedence Rule
1. User-Uploaded Profile Photo (`user.profile_image`)
2. Google OAuth Profile Photo
3. **Generic Vector User Icon** (Rendered via `<User />` vector component when `profile_photo_url` is null/empty).

*No stock photos, random avatar APIs, or pravatar URLs are used.*
