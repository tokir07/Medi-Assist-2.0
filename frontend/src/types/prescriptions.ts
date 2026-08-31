export type PrescriptionTab =
  | 'All Prescriptions'
  | 'Active'
  | 'Completed'
  | 'Expired'
  | 'Cancelled'
  | 'Archived'
  | 'Refills';

export interface PrescriptionMedication {
  id?: string;
  medication_name: string;
  generic_name?: string | null;
  brand_name?: string | null;
  dosage: string;
  dosage_unit?: string | null;
  frequency: string;
  route?: string;
  duration: string;
  duration_unit?: string | null;
  instructions?: string | null;
  quantity?: string | null;
  refills?: number;
  notes?: string | null;
}

export interface PrescriptionItem {
  id: string;
  patient_id: string;
  record_id?: string | null;
  appointment_id?: string | null;
  appointment_title?: string | null;
  appointment_date?: string | null;

  title?: string | null;
  session_name?: string | null;
  diagnosis_or_indication?: string | null;

  medication_name: string;
  generic_name?: string | null;
  dosage: string;
  frequency: string;
  duration: string;
  instructions?: string | null;

  medications: PrescriptionMedication[];

  doctor_name: string;
  doctor_specialty: string;
  hospital: string;
  prescribed_date: string;
  valid_until?: string | null;
  status: string; // Active, Completed, Expired, Cancelled, Archived, Refill Needed

  approval_status: 'REVIEW_REQUIRED' | 'APPROVED' | 'EDITED' | 'REJECTED' | string;
  clinician_review_status: 'NOT_REVIEWED' | 'CLINICIAN_REVIEWED' | string;
  provenance: 'AI_EXTRACTED' | 'MANUALLY_ADDED' | 'PATIENT_EDITED' | 'CLINICIAN_ENTERED' | string;

  refills_remaining: number;
  refill_recommended: boolean;
  notes?: string | null;

  document_file_path?: string | null;
  document_file_name?: string | null;
  source_record_title?: string | null;

  created_at: string;
  updated_at: string;
}

export interface PrescriptionSummaryStats {
  total_prescriptions: number;
  active_prescriptions: number;
  completed_prescriptions?: number;
  expired_prescriptions?: number;
  need_refills: number;
  this_month: number;
}

export interface PrescriptionListResponse {
  prescriptions: PrescriptionItem[];
  total_count: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface MedicationReminderItem {
  id: string;
  patient_id: string;
  prescription_id?: string | null;
  medication_name: string;
  dosage_instruction: string;
  time_str: string;
  is_taken: boolean;
  is_active: boolean;
  created_at: string;
}

export interface PrescriptionQueryParams {
  tab?: PrescriptionTab | string;
  search?: string;
  sort?: 'latest' | 'oldest' | 'name_asc' | 'name_desc';
  page?: number;
  page_size?: number;
  doctor?: string;
}

export interface PrescriptionCreatePayload {
  title?: string;
  session_name?: string;
  diagnosis_or_indication?: string;
  doctor_name?: string;
  doctor_specialty?: string;
  hospital?: string;
  prescribed_date?: string;
  valid_until?: string;
  status?: string;
  appointment_id?: string;
  record_id?: string;
  medications: PrescriptionMedication[];
  notes?: string;
  refills_remaining?: number;
}

export interface PrescriptionEditPayload {
  title?: string;
  session_name?: string;
  diagnosis_or_indication?: string;
  doctor_name?: string;
  doctor_specialty?: string;
  hospital?: string;
  prescribed_date?: string;
  valid_until?: string;
  status?: string;
  medications?: PrescriptionMedication[];
  notes?: string;
  refills_remaining?: number;
  approval_status?: string;
}

export interface DuplicateCheckRequest {
  doctor_name?: string;
  prescribed_date?: string;
  medication_names?: string[];
}

export interface DuplicateCheckResponse {
  is_duplicate: boolean;
  matching_prescription?: PrescriptionItem | null;
  message?: string | null;
}

export interface RefillRequestPayload {
  notes?: string;
  preferred_pharmacy?: string;
}

export interface RequestPrescriptionPayload {
  doctor_name: string;
  hospital: string;
  medication_requested: string;
  reason: string;
  urgency: 'NORMAL' | 'URGENT';
}
