export interface HealthSummary {
  blood_pressure: string;
  heart_rate: string;
  bmi: string;
  spo2: string;
  critical_conditions?: number;
  medications_count?: number;
  allergies_count?: number;
  records_count?: number;
  appointments_count?: number;
  blood_group?: string;
  last_updated?: string;
}

export interface MedicalRecordItem {
  id: string;
  title: string;
  category: string;
  date: string;
  status?: string;
  file_type?: string;
  doctor_name?: string;
}

export interface AppointmentItem {
  id: string;
  month: string;
  day: string;
  doctor_name: string;
  specialty: string;
  time: string;
  mode: 'In-clinic' | 'Video Call' | string;
  hospital?: string;
  status?: string;
}

export interface ReminderItem {
  id: string;
  title: string;
  time: string;
  category?: string;
  completed: boolean;
}

export interface HealthTipItem {
  id: string;
  title: string;
  content: string;
  category: string;
}

export interface PatientDashboardData {
  patient_name: string;
  abha_id?: string;
  health_summary: HealthSummary;
  recent_records: MedicalRecordItem[];
  upcoming_appointments: AppointmentItem[];
  reminders: ReminderItem[];
  health_tips: HealthTipItem[];
  active_conversation?: {
    last_user_message: string;
    last_ai_response: string;
    timestamp: string;
  };
}
