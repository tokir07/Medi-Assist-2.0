import { api } from './api';

export interface DoctorDashboardStats {
  todays_appointments_count: number;
  pending_requests_count: number;
  total_patients_count: number;
  unread_messages_count: number;
  is_available: boolean;
}

export interface DoctorScheduleItem {
  appointment_id: string;
  patient_id: string;
  patient_name: string;
  patient_age?: number;
  patient_gender?: string;
  appointment_time: string;
  mode: string;
  reason?: string;
  status: string;
  consultation_link?: string;
}

export interface DoctorDashboardData {
  stats: DoctorDashboardStats;
  todays_schedule: DoctorScheduleItem[];
  pending_requests: any[];
  recent_messages: any[];
}

export interface DoctorPatientSummary {
  id: string;
  name: string;
  age: number;
  gender: string;
  blood_group?: string;
  phone?: string;
  email?: string;
  last_visit?: string;
  allergies?: string;
  conditions?: string;
  active_prescriptions_count: number;
}

export interface DoctorPatientDetail {
  patient_info: DoctorPatientSummary;
  current_medications: string[];
  medical_history: any[];
  reports: any[];
  prescriptions: any[];
  appointments: any[];
  ai_conversations?: any[];
  voice_sessions?: any[];
  emergency_contact?: any;
  ai_health_summary?: {
    title: string;
    summary: string;
    disclaimer: string;
    created_at?: string;
  } | null;
  consolidated_summary?: {
    title: string;
    summary: string;
    recent_concerns?: string;
    key_report_findings?: string;
    active_medications?: string;
    generated_at?: string;
    version?: number;
    disclaimer?: string;
  } | null;
}

export interface PrescriptionTemplate {
  id: string;
  title: string;
  diagnosis: string;
  medicines: Array<{
    medicine_name: string;
    dosage: string;
    frequency: string;
    duration: string;
    instructions?: string;
  }>;
}

export const doctorService = {
  async getDashboard(): Promise<DoctorDashboardData> {
    const res = await api.get('/doctor/dashboard');
    return res.data;
  },

  async setAvailability(isAvailable: boolean): Promise<{ status: string; is_available: boolean }> {
    const res = await api.post(`/doctor/availability?is_available=${isAvailable}`);
    return res.data;
  },

  async getAppointments(tab: string = 'Today', search?: string): Promise<any[]> {
    const params = new URLSearchParams();
    if (tab) params.append('tab', tab);
    if (search) params.append('search', search);
    const res = await api.get(`/doctor/appointments?${params.toString()}`);
    return res.data;
  },

  async acceptAppointment(appointmentId: string): Promise<any> {
    const res = await api.post(`/doctor/appointments/${appointmentId}/accept`);
    return res.data;
  },

  async rejectAppointment(appointmentId: string, payload: { reason?: string; message?: string }): Promise<any> {
    const res = await api.post(`/doctor/appointments/${appointmentId}/reject`, payload);
    return res.data;
  },

  async markNoShow(appointmentId: string): Promise<any> {
    const res = await api.post(`/doctor/appointments/${appointmentId}/no-show`);
    return res.data;
  },

  async blockSlot(payload: { date: string; slot_time: string; reason?: string }): Promise<any> {
    const res = await api.post('/doctor/slots/block', payload);
    return res.data;
  },

  async emergencyCancel(appointmentId: string, payload: { reason?: string; message_to_patient?: string }): Promise<any> {
    const res = await api.post(`/doctor/appointments/${appointmentId}/cancel`, payload);
    return res.data;
  },

  async setDayOff(payload: { date: string; reason?: string; confirm_cancel_existing?: boolean }): Promise<any> {
    const res = await api.post('/doctor/day-off', payload);
    return res.data;
  },

  async getScheduleConfig(): Promise<any> {
    const res = await api.get('/doctor/schedule/config');
    return res.data;
  },

  async updateScheduleConfig(payload: any): Promise<any> {
    const res = await api.post('/doctor/schedule/config', payload);
    return res.data;
  },

  async getPrescriptionTemplates(): Promise<PrescriptionTemplate[]> {
    const res = await api.get('/doctor/prescription-templates');
    return res.data;
  },

  async getPatients(search?: string): Promise<DoctorPatientSummary[]> {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    const res = await api.get(`/doctor/patients?${params.toString()}`);
    return res.data;
  },

  async getPatientDetail(patientId: string): Promise<DoctorPatientDetail> {
    const res = await api.get(`/doctor/patients/${patientId}`);
    return res.data;
  },

  async submitConsultation(payload: {
    appointment_id: string;
    patient_id: string;
    chief_complaint?: string;
    clinical_notes: string;
    diagnosis: string;
    advice?: string;
    follow_up_days?: number;
    follow_up_date?: string;
    follow_up_reason?: string;
  }): Promise<any> {
    const res = await api.post('/doctor/consultation/submit', payload);
    return res.data;
  },

  async createDigitalPrescription(payload: {
    patient_id: string;
    appointment_id?: string;
    diagnosis: string;
    medicines: Array<{
      medicine_name: string;
      dosage: string;
      frequency: string;
      duration: string;
      instructions?: string;
    }>;
    additional_notes?: string;
  }): Promise<any> {
    const res = await api.post('/doctor/prescriptions/digital', payload);
    return res.data;
  },

  async createImagePrescription(payload: {
    patient_id: string;
    appointment_id?: string;
    diagnosis: string;
    image_url: string;
    file_name?: string;
    additional_notes?: string;
  }): Promise<any> {
    const res = await api.post('/doctor/prescriptions/image', payload);
    return res.data;
  },

  async sendPatientReminder(payload: {
    patient_id: string;
    reminder_type: string;
    title: string;
    message: string;
    due_date?: string;
  }): Promise<any> {
    const res = await api.post('/doctor/reminders', payload);
    return res.data;
  },

  async askDoctorQuickAI(query: string, patient_id?: string): Promise<any> {
    const res = await api.post('/doctor/quick-ai', { query, patient_id });
    return res.data;
  },

  async getAIConversationTranscript(patientId: string, conversationId: string): Promise<any> {
    const res = await api.get(`/doctor/patients/${patientId}/ai-conversations/${conversationId}`);
    return res.data;
  },

  async getVoiceSessionTranscript(patientId: string, sessionId: string): Promise<any> {
    const res = await api.get(`/doctor/patients/${patientId}/voice-sessions/${sessionId}`);
    return res.data;
  },

  async generatePatientMedicalSummary(patientId: string): Promise<any> {
    const res = await api.post(`/doctor/patients/${patientId}/medical-summary/generate`);
    return res.data;
  }
};
