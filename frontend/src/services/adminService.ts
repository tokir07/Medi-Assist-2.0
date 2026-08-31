import { api } from './api';

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

export interface AdminDashboardData {
  kpis: AdminKPIStats;
  recent_doctors: RecentDoctorActivity[];
  recent_audit_events: RecentAuditEventItem[];
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
  registration_number: string;
  registration_authority?: string;
  designation?: string;
  department?: string;
  hospital?: string;
  consultation_fee: number;
  account_status: string;
  verification_status: string;
  is_active: boolean;
  invitation_sent: boolean;
  created_at: string;
  updated_at?: string;
}

export interface DoctorListResponse {
  doctors: DoctorItem[];
  total_count: number;
  page: number;
  page_size: number;
  total_pages: number;
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

export interface PushNotificationItem {
  id: string;
  title: string;
  message: string;
  target_audience: string;
  recipients_count: number;
  sent_by: string;
  status: string;
  sent_at: string;
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

export const adminService = {
  async getDashboard(): Promise<AdminDashboardData> {
    const res = await api.get('/admin/dashboard');
    return res.data;
  },

  async getDoctors(
    search?: string,
    specialization?: string,
    department?: string,
    verificationStatus?: string,
    accountStatus?: string,
    page: number = 1,
    pageSize: number = 10
  ): Promise<DoctorListResponse> {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (specialization) params.append('specialization', specialization);
    if (department) params.append('department', department);
    if (verificationStatus) params.append('verification_status', verificationStatus);
    if (accountStatus) params.append('account_status', accountStatus);
    params.append('page', page.toString());
    params.append('page_size', pageSize.toString());

    const res = await api.get(`/admin/doctors?${params.toString()}`);
    return res.data;
  },

  async getDoctorById(id: string): Promise<DoctorItem> {
    const res = await api.get(`/admin/doctors/${id}`);
    return res.data;
  },

  async createDoctor(payload: {
    name: string;
    email: string;
    phone?: string;
    specialization: string;
    qualification: string;
    experience: number;
    medical_registration_number: string;
    registration_authority?: string;
    designation?: string;
    department: string;
    hospital: string;
    bio?: string;
    consultation_fee?: number;
    send_invitation?: boolean;
  }): Promise<DoctorItem> {
    const res = await api.post('/admin/doctors', payload);
    return res.data;
  },

  async updateDoctor(
    id: string,
    payload: {
      name?: string;
      phone?: string;
      specialization?: string;
      qualification?: string;
      experience?: number;
      medical_registration_number?: string;
      designation?: string;
      department?: string;
      hospital?: string;
      bio?: string;
      consultation_fee?: number;
    }
  ): Promise<DoctorItem> {
    const res = await api.put(`/admin/doctors/${id}`, payload);
    return res.data;
  },

  async verifyDoctor(id: string, status: string, notes?: string): Promise<DoctorItem> {
    const res = await api.post(`/admin/doctors/${id}/verify`, { status, notes });
    return res.data;
  },

  async suspendDoctor(id: string, suspend: boolean, reason?: string): Promise<DoctorItem> {
    const res = await api.post(`/admin/doctors/${id}/suspend`, { suspend, reason });
    return res.data;
  },

  async getPatients(
    search?: string,
    city?: string,
    page: number = 1,
    pageSize: number = 10
  ): Promise<PatientListResponse> {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (city) params.append('city', city);
    params.append('page', page.toString());
    params.append('page_size', pageSize.toString());

    const res = await api.get(`/admin/patients?${params.toString()}`);
    return res.data;
  },

  async togglePatientStatus(patientId: string, isActive: boolean, reason?: string): Promise<any> {
    const res = await api.post(`/admin/patients/${patientId}/toggle-status`, {
      is_active: isActive,
      reason,
    });
    return res.data;
  },

  async getNotifications(): Promise<{ notifications: PushNotificationItem[]; total_count: number }> {
    const res = await api.get('/admin/notifications');
    return res.data;
  },

  async sendNotification(payload: {
    title: string;
    message: string;
    target_audience: string;
    recipient_user_ids?: string[];
  }): Promise<PushNotificationItem> {
    const res = await api.post('/admin/notifications', payload);
    return res.data;
  },

  async getAppointments(statusFilter?: string, search?: string): Promise<{ appointments: any[]; total_count: number }> {
    const params = new URLSearchParams();
    if (statusFilter) params.append('status', statusFilter);
    if (search) params.append('search', search);

    const res = await api.get(`/admin/appointments?${params.toString()}`);
    return res.data;
  },

  async getAuditLogs(
    action?: string,
    resource?: string,
    search?: string,
    page: number = 1,
    pageSize: number = 20
  ): Promise<{ audit_logs: AuditLogItem[]; total_count: number; page: number; total_pages: number }> {
    const params = new URLSearchParams();
    if (action) params.append('action', action);
    if (resource) params.append('resource', resource);
    if (search) params.append('search', search);
    params.append('page', page.toString());
    params.append('page_size', pageSize.toString());

    const res = await api.get(`/admin/audit-logs?${params.toString()}`);
    return res.data;
  }
};
