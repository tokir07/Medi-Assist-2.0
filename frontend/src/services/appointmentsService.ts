import { api } from './api';
import type {
  AppointmentItem,
  AppointmentSummaryStats,
  AppointmentListResponse,
  DoctorItem,
  AvailableSlotsResponse,
  HospitalItem,
  CalendarMonthData,
  RecommendationItem,
  CreateAppointmentPayload,
  RescheduleAppointmentPayload,
  CancelAppointmentPayload,
  DoctorHealthMessage,
  SendDoctorMessagePayload,
} from '../types/appointments';

export const appointmentsService = {
  async getAppointments(params?: {
    tab?: string;
    search?: string;
    sort?: string;
    specialty?: string;
    doctor?: string;
    hospital?: string;
    date?: string;
    page?: number;
    page_size?: number;
  }): Promise<AppointmentListResponse> {
    const query = new URLSearchParams();
    if (params?.tab) query.append('tab', params.tab);
    if (params?.search && params.search.trim()) query.append('search', params.search.trim());
    if (params?.sort) query.append('sort', params.sort);
    if (params?.specialty && params.specialty !== 'All') query.append('specialty', params.specialty);
    if (params?.doctor && params.doctor !== 'All') query.append('doctor', params.doctor);
    if (params?.hospital && params.hospital !== 'All') query.append('hospital', params.hospital);
    if (params?.date) query.append('date', params.date);
    if (params?.page) query.append('page', params.page.toString());
    if (params?.page_size) query.append('page_size', params.page_size.toString());

    const res = await api.get<AppointmentListResponse>(`/appointments?${query.toString()}`);
    return res.data;
  },

  async getSummary(): Promise<AppointmentSummaryStats> {
    const res = await api.get<AppointmentSummaryStats>('/appointments/summary');
    return res.data;
  },

  async getCalendarData(year: number, month: number): Promise<CalendarMonthData> {
    const res = await api.get<CalendarMonthData>(`/appointments/calendar?year=${year}&month=${month}`);
    return res.data;
  },

  async getDoctors(): Promise<DoctorItem[]> {
    const res = await api.get<DoctorItem[]>('/appointments/doctors');
    return res.data;
  },

  async getAvailableSlots(doctorName: string, dateStr: string): Promise<AvailableSlotsResponse> {
    const res = await api.get<AvailableSlotsResponse>(
      `/appointments/slots?doctor_name=${encodeURIComponent(doctorName)}&date=${encodeURIComponent(dateStr)}`
    );
    return res.data;
  },

  async getHospitals(): Promise<HospitalItem[]> {
    const res = await api.get<HospitalItem[]>('/appointments/hospitals');
    return res.data;
  },

  async getRecommendations(): Promise<RecommendationItem[]> {
    const res = await api.get<RecommendationItem[]>('/appointments/recommendations');
    return res.data;
  },

  async createAppointment(payload: CreateAppointmentPayload): Promise<AppointmentItem> {
    const res = await api.post<AppointmentItem>('/appointments', payload);
    return res.data;
  },

  async getAppointmentById(id: string): Promise<AppointmentItem> {
    const res = await api.get<AppointmentItem>(`/appointments/${id}`);
    return res.data;
  },

  async rescheduleAppointment(id: string, payload: RescheduleAppointmentPayload): Promise<AppointmentItem> {
    const res = await api.put<AppointmentItem>(`/appointments/${id}/reschedule`, payload);
    return res.data;
  },

  async cancelAppointment(id: string, payload: CancelAppointmentPayload): Promise<AppointmentItem> {
    const res = await api.put<AppointmentItem>(`/appointments/${id}/cancel`, payload);
    return res.data;
  },

  // Doctor Health Messaging
  async getAllDoctorMessages(): Promise<DoctorHealthMessage[]> {
    const res = await api.get<DoctorHealthMessage[]>('/appointments/messages/all');
    return res.data;
  },

  async getAppointmentMessages(appointmentId: string): Promise<DoctorHealthMessage[]> {
    const res = await api.get<DoctorHealthMessage[]>(`/appointments/${appointmentId}/messages`);
    return res.data;
  },

  async sendDoctorMessage(payload: SendDoctorMessagePayload): Promise<DoctorHealthMessage> {
    const res = await api.post<DoctorHealthMessage>('/appointments/messages', payload);
    return res.data;
  },

  async markMessageRead(messageId: string): Promise<DoctorHealthMessage> {
    const res = await api.patch<DoctorHealthMessage>(`/appointments/messages/${messageId}/read`);
    return res.data;
  },
};
