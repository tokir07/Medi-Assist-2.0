export interface AdminKPIStats {
  total_users: number;
  active_patients: number;
  total_doctors: number;
  active_doctors: number;
  pending_doctor_verifications: number;
  suspended_doctors: number;
  today_appointments: number;
  active_consultations: number;
  total_organizations: number;
  security_alerts_count: number;
}

export interface RecentDoctorActivity {
  id: string;
  doctor_id: string;
  name: string;
  specialization: string;
  hospital: string;
  verification_status: string;
  account_status: string;
  created_at: string;
}

export interface RecentAuditEventItem {
  id: string;
  actor_name: string;
  actor_role: string;
  action: string;
  resource: string;
  status: string;
  details?: string;
  created_at: string;
}

export interface SystemHealthStatus {
  database: string;
  redis_cache: string;
  ai_engine: string;
  uptime_percentage: number;
  active_sessions: number;
}

export interface AdminDashboardData {
  kpis: AdminKPIStats;
  recent_doctors: RecentDoctorActivity[];
  recent_audit_events: RecentAuditEventItem[];
  system_health: SystemHealthStatus;
  timestamp: string;
}

export interface DoctorItem {
  id: string;
  user_id: string;
  doctor_id: string;
  name: string;
  email: string;
  phone?: string;
  specialization: string;
  qualification: string;
  experience: number;
  registration_number?: string;
  registration_authority?: string;
  designation: string;
  department: string;
  hospital: string;
  organization_id?: string;
  department_id?: string;
  consultation_fee: number;
  account_status: 'ACTIVE' | 'INVITED' | 'ACTIVATION_PENDING' | 'SUSPENDED' | 'DEACTIVATED' | string;
  verification_status: 'VERIFIED' | 'PENDING_VERIFICATION' | 'UNDER_REVIEW' | 'REJECTED' | 'REVOKED' | string;
  is_active: boolean;
  invitation_sent: boolean;
  created_at: string;
  updated_at: string;
}

export interface DoctorListResponse {
  doctors: DoctorItem[];
  total_count: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface DoctorCreatePayload {
  name: string;
  email: string;
  phone?: string;
  gender?: string;
  specialization: string;
  qualification: string;
  experience: number;
  medical_registration_number: string;
  registration_authority?: string;
  designation?: string;
  department: string;
  hospital: string;
  organization_id?: string;
  department_id?: string;
  consultation_fee?: number;
  verification_status?: string;
  send_invitation?: boolean;
}

export interface PatientItem {
  id: string;
  user_id: string;
  name: string;
  email: string;
  phone?: string;
  gender?: string;
  date_of_birth?: string;
  city?: string;
  state?: string;
  country?: string;
  blood_group?: string;
  abha_id?: string;
  kyc_verified: boolean;
  is_active: boolean;
  records_count: number;
  appointments_count: number;
  prescriptions_count: number;
  created_at: string;
}

export interface PatientListResponse {
  patients: PatientItem[];
  total_count: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface OrganizationItem {
  id: string;
  name: string;
  organization_type: string;
  code?: string;
  address?: string;
  city?: string;
  state?: string;
  country: string;
  phone?: string;
  email?: string;
  license_number?: string;
  departments_count: number;
  doctors_count: number;
  is_active: boolean;
  created_at: string;
}

export interface OrganizationListResponse {
  organizations: OrganizationItem[];
  total_count: number;
}

export interface DepartmentItem {
  id: string;
  organization_id: string;
  organization_name: string;
  name: string;
  code?: string;
  head_doctor_name?: string;
  description?: string;
  doctors_count: number;
  is_active: boolean;
  created_at: string;
}

export interface DepartmentListResponse {
  departments: DepartmentItem[];
  total_count: number;
}

export interface AuditLogItem {
  id: string;
  actor_id?: string;
  actor_name: string;
  actor_role: string;
  action: string;
  resource: string;
  resource_id?: string;
  ip_address?: string;
  status: string;
  details?: string;
  created_at: string;
}

export interface AuditLogListResponse {
  logs: AuditLogItem[];
  total_count: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface PushNotificationItem {
  id: string;
  title: string;
  message: string;
  audience: string;
  target_count: number;
  sent_by_name: string;
  status: 'Sent' | 'Scheduled' | 'Failed' | string;
  created_at: string;
}

export interface PushNotificationCreatePayload {
  title: string;
  message: string;
  audience: string;
  target_user_ids?: string[];
}

export interface PushNotificationListResponse {
  notifications: PushNotificationItem[];
  total_count: number;
}

export interface AdminAppointmentItem {
  id: string;
  time: string;
  date: string;
  patient_id: string;
  patient_name: string;
  patient_email: string;
  doctor_id: string;
  doctor_name: string;
  doctor_specialty: string;
  appointment_type: 'In-Person' | 'Video Call' | string;
  status: 'Completed' | 'Confirmed' | 'Pending' | 'Cancelled' | string;
}

export interface AdminAppointmentListResponse {
  appointments: AdminAppointmentItem[];
  total_count: number;
}

