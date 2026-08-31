export type RecordCategory =
  | 'All Records'
  | 'Lab Reports'
  | 'Radiology'
  | 'Prescriptions'
  | 'Consultation'
  | 'Discharge Summary'
  | 'Others';

export type RecordsTab = 'uploaded' | 'ai_history' | 'voice_history' | 'timeline';

export interface ExtractedParameter {
  parameter_name: string;
  display_name: string;
  category: string;
  value: string;
  numeric_value?: number | null;
  text_value?: string | null;
  unit?: string | null;
  reference_range?: string | null;
  status: 'NORMAL' | 'HIGH' | 'LOW' | 'CRITICAL' | 'ABNORMAL' | 'UNKNOWN';
  flag?: string | null;
  source_text?: string | null;
  page_number?: number;
  confidence?: number;
}

export interface ExtractedMedication {
  medication_name: string;
  dosage?: string | null;
  frequency?: string | null;
  duration?: string | null;
  instructions?: string | null;
  confidence?: number;
}

export interface StructuredExtractedData {
  report_type?: string;
  patient_name?: string | null;
  doctor_name?: string | null;
  hospital_name?: string | null;
  report_date?: string | null;
  primary_diagnosis_or_indication?: string | null;
  parameters?: ExtractedParameter[];
  medications?: ExtractedMedication[];
  observations_and_findings?: string[];
  follow_up_recommendations?: string | null;
  overall_confidence?: number;
  provenance?: 'SOURCE_DOCUMENT' | 'AI_EXTRACTED' | 'PATIENT_EDITED' | 'PATIENT_VERIFIED' | 'CLINICIAN_VERIFIED';
}

export interface AuditLogEntry {
  action: string;
  timestamp: string;
  details?: string;
}

export interface MedicalRecordItem {
  id: string;
  patient_id: string;
  title: string;
  category: string;
  session_name: string;
  file_name?: string | null;
  file_type: string;
  file_size: number;
  file_size_formatted: string;
  file_path?: string | null;
  doctor_name?: string | null;
  hospital?: string | null;
  record_date?: string | null;
  tags: string[];
  description?: string | null;
  
  // Structured Extraction & Review Status
  extracted_text?: string | null;
  extracted_data?: StructuredExtractedData | null;
  extraction_status: 'PENDING' | 'EXTRACTING' | 'COMPLETED' | 'FAILED';
  approval_status: 'REVIEW_REQUIRED' | 'APPROVED' | 'EDITED' | 'REJECTED';
  confidence_score: number;
  is_important: boolean;

  // Document-Level Report Summary & Clinician Review
  summary_quick?: string | null;
  summary_detailed?: string | null;
  summary_structured?: Record<string, any> | null;
  summary_status: 'NOT_GENERATED' | 'GENERATING' | 'GENERATED' | 'FAILED' | 'OUTDATED';
  summary_version: number;
  summary_generated_at?: string | null;
  clinician_review_status: 'NOT_REVIEWED' | 'CLINICIAN_REVIEWED';

  audit_log: AuditLogEntry[];
  is_deleted: boolean;
  deleted_at?: string | null;
  shared_with?: Array<{
    id: string;
    doctor_name: string;
    doctor_email?: string;
    permission: string;
    shared_at: string;
    expires_in_days?: number;
  }>;
  created_at: string;
  updated_at: string;
}

export interface RecordSummaryGenerateResponse {
  record_id: string;
  summary_quick: string;
  summary_detailed: string;
  summary_structured: Record<string, any>;
  summary_status: string;
  summary_version: number;
  summary_generated_at: string;
}

export interface SessionSummaryResponse {
  session_name: string;
  record_count: number;
  summary_markdown: string;
  documents: string[];
  flagged_parameters: Array<{
    doc: string;
    param: string;
    value: string;
    status: string;
  }>;
}

export interface SessionGroupItem {
  session_name: string;
  record_count: number;
  latest_date: string;
  records: MedicalRecordItem[];
}

export interface TimelineItem {
  id: string;
  source_type: 'AI_CONVERSATION' | 'VOICE_CONSULTATION' | 'UPLOADED_RECORD';
  title: string;
  subtitle?: string | null;
  date: string;
  time: string;
  status?: string | null;
  preview?: string | null;
  metadata?: Record<string, any> | null;
}

export interface ParameterTrendItem {
  record_id: string;
  record_title: string;
  date: string;
  value: string;
  numeric_value?: number | null;
  unit?: string | null;
  reference_range?: string | null;
  status: string;
}

export interface ParameterTrendResponse {
  parameter_name: string;
  display_name: string;
  unit?: string | null;
  category: string;
  trend_points: ParameterTrendItem[];
}

export interface ComparedParameterItem {
  parameter_name: string;
  display_name: string;
  category: string;
  unit?: string | null;
  value_1?: string | null;
  numeric_value_1?: number | null;
  status_1?: string | null;
  value_2?: string | null;
  numeric_value_2?: number | null;
  status_2?: string | null;
  reference_range?: string | null;
  delta?: number | null;
  delta_text?: string | null;
}

export interface ReportCompareResponse {
  report_1_id: string;
  report_1_title: string;
  report_1_date: string;
  report_2_id: string;
  report_2_title: string;
  report_2_date: string;
  parameters: ComparedParameterItem[];
}

export interface ExplainReportResponse {
  record_id: string;
  title: string;
  explanation_markdown: string;
}

export interface RecordSummaryStats {
  total_records: number;
  lab_reports: number;
  radiology: number;
  prescriptions: number;
  consultations: number;
  discharge_summaries: number;
  others: number;
  approved_records?: number;
  pending_review_records?: number;
  total_sessions?: number;
  storage_used_bytes: number;
  storage_used_formatted: string;
  storage_total_formatted: string;
  storage_percentage: number;
  storage_available_formatted: string;
}

export interface RecordListResponse {
  records: MedicalRecordItem[];
  total_count: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface RecordQueryParams {
  category?: string;
  search?: string;
  sort?: 'latest' | 'oldest' | 'name_asc' | 'name_desc';
  page?: number;
  page_size?: number;
  tag?: string;
  session_name?: string;
  approval_status?: string;
  is_important?: boolean;
}

export interface ComprehensiveSummaryPayload {
  date_from?: string;
  date_to?: string;
  include_ai_history?: boolean;
  include_voice_history?: boolean;
  include_uploaded_records?: boolean;
  conversation_ids?: string[];
  record_ids?: string[];
}

export interface ComprehensiveSummaryResponse {
  status: string;
  patient_name: string;
  period: string;
  summary_markdown: string;
}

export interface ShareRecordPayload {
  doctor_name: string;
  doctor_email?: string;
  doctor_id?: string;
  permission: 'VIEW' | 'FULL';
  expires_in_days?: number;
  notes?: string;
}

export interface RequestDocumentPayload {
  hospital_name: string;
  department: string;
  record_type: string;
  urgency: 'NORMAL' | 'URGENT';
  notes?: string;
}
