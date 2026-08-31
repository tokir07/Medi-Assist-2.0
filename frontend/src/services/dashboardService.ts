import { api } from './api';
import type { PatientDashboardData, HealthSummary, MedicalRecordItem, AppointmentItem, ReminderItem, HealthTipItem } from '../types/dashboard';

export const dashboardService = {
  async getDashboardData(): Promise<PatientDashboardData> {
    const response = await api.get('/dashboard');
    const data = response.data;

    const resolvedRecords: MedicalRecordItem[] = (data.recent_records || []).map((r: any, idx: number) => ({
      id: r.id || `rec-${idx}`,
      title: r.title || 'Medical Report',
      category: r.category || 'General',
      date: r.date || 'Recent',
      status: r.status || 'Verified',
      file_type: r.file_type || 'PDF',
      doctor_name: r.doctor_name || 'Attending Physician',
    }));

    const resolvedAppointments: AppointmentItem[] = (data.upcoming_appointments || []).map((apt: any) => ({
      id: apt.id,
      month: apt.month || 'N/A',
      day: apt.day || '--',
      doctor_name: apt.doctor_name || 'Doctor',
      specialty: apt.specialty || 'General Physician',
      time: apt.time || '10:00 AM',
      mode: apt.mode || 'In-clinic',
      hospital: apt.hospital || 'MediAssist Medical Center',
      status: apt.status || 'CONFIRMED',
    }));

    // Fallback if upcoming_appointments is empty but upcoming_appointment single exists
    if (resolvedAppointments.length === 0 && data.upcoming_appointment) {
      const single = data.upcoming_appointment;
      resolvedAppointments.push({
        id: single.id,
        month: single.month || 'N/A',
        day: single.day || '--',
        doctor_name: single.doctor_name || 'Doctor',
        specialty: single.specialty || 'General Physician',
        time: single.time || '10:00 AM',
        mode: single.mode || 'In-clinic',
        hospital: single.hospital || 'MediAssist Medical Center',
        status: single.status || 'CONFIRMED',
      });
    }

    const resolvedReminders: ReminderItem[] = (data.reminders || []).map((rem: any) => ({
      id: rem.id,
      title: rem.title,
      time: rem.time,
      category: rem.category || 'General',
      completed: rem.completed ?? false,
    }));

    const resolvedTips: HealthTipItem[] = (data.health_tips || []).map((tip: any) => ({
      id: String(tip.id),
      title: tip.title,
      content: tip.content,
      category: tip.category || 'Daily Wellness',
    }));

    const healthSummary: HealthSummary = {
      blood_pressure: data.health_summary?.blood_pressure || '120/80',
      heart_rate: data.health_summary?.heart_rate || '72 bpm',
      bmi: data.health_summary?.bmi || '24.5',
      spo2: data.health_summary?.spo2 || '98%',
      critical_conditions: data.health_summary?.critical_conditions ?? 0,
      medications_count: data.health_summary?.medications_count ?? 0,
      allergies_count: data.health_summary?.allergies_count ?? 0,
      records_count: data.health_summary?.records_count ?? 0,
      appointments_count: data.health_summary?.appointments_count ?? 0,
      blood_group: data.health_summary?.blood_group || 'O+',
      last_updated: data.health_summary?.last_updated || 'Today',
    };

    return {
      patient_name: data.patient?.name || 'Patient',
      abha_id: data.patient?.abha_id || undefined,
      health_summary: healthSummary,
      recent_records: resolvedRecords,
      upcoming_appointments: resolvedAppointments,
      reminders: resolvedReminders,
      health_tips: resolvedTips,
      active_conversation: data.active_conversation || undefined,
    };
  },

  async getPatientProfile() {
    const response = await api.get('/patients/profile');
    return response.data;
  },

  async toggleReminder(reminderId: string): Promise<{ success: boolean; is_completed: boolean }> {
    const response = await api.post(`/reminders/${reminderId}/toggle`);
    return response.data;
  },
};
