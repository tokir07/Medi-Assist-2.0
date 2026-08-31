import { api } from './api';
import type {
  PrescriptionItem,
  PrescriptionSummaryStats,
  PrescriptionListResponse,
  MedicationReminderItem,
  PrescriptionQueryParams,
  PrescriptionCreatePayload,
  PrescriptionEditPayload,
  DuplicateCheckRequest,
  DuplicateCheckResponse,
  RefillRequestPayload,
  RequestPrescriptionPayload,
} from '../types/prescriptions';

export const prescriptionsService = {
  async getPrescriptions(params?: PrescriptionQueryParams): Promise<PrescriptionListResponse> {
    const query = new URLSearchParams();
    if (params?.tab && params.tab !== 'All Prescriptions') {
      query.append('tab', params.tab);
    }
    if (params?.search && params.search.trim()) {
      query.append('search', params.search.trim());
    }
    if (params?.sort) {
      query.append('sort', params.sort);
    }
    if (params?.page) {
      query.append('page', params.page.toString());
    }
    if (params?.page_size) {
      query.append('page_size', params.page_size.toString());
    }
    if (params?.doctor) {
      query.append('doctor', params.doctor);
    }

    const res = await api.get<PrescriptionListResponse>(`/prescriptions?${query.toString()}`);
    return res.data;
  },

  async getSummary(): Promise<PrescriptionSummaryStats> {
    const res = await api.get<PrescriptionSummaryStats>('/prescriptions/summary');
    return res.data;
  },

  async getPrescriptionById(id: string): Promise<PrescriptionItem> {
    const res = await api.get<PrescriptionItem>(`/prescriptions/${id}`);
    return res.data;
  },

  async createManualPrescription(payload: PrescriptionCreatePayload): Promise<PrescriptionItem> {
    const res = await api.post<PrescriptionItem>('/prescriptions', payload);
    return res.data;
  },

  async uploadPrescription(formData: FormData): Promise<PrescriptionItem> {
    const res = await api.post<PrescriptionItem>('/prescriptions/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return res.data;
  },

  async editPrescription(id: string, payload: PrescriptionEditPayload): Promise<PrescriptionItem> {
    const res = await api.patch<PrescriptionItem>(`/prescriptions/${id}`, payload);
    return res.data;
  },

  async approvePrescription(id: string): Promise<PrescriptionItem> {
    const res = await api.post<PrescriptionItem>(`/prescriptions/${id}/approve`);
    return res.data;
  },

  async markClinicianReviewed(id: string, clinicianNotes?: string): Promise<PrescriptionItem> {
    const query = clinicianNotes ? `?clinician_notes=${encodeURIComponent(clinicianNotes)}` : '';
    const res = await api.post<PrescriptionItem>(`/prescriptions/${id}/review${query}`);
    return res.data;
  },

  async checkDuplicate(payload: DuplicateCheckRequest): Promise<DuplicateCheckResponse> {
    const res = await api.post<DuplicateCheckResponse>('/prescriptions/check-duplicate', payload);
    return res.data;
  },

  async deletePrescription(id: string): Promise<{ success: boolean; message: string }> {
    const res = await api.delete<{ success: boolean; message: string }>(`/prescriptions/${id}`);
    return res.data;
  },

  async getReminders(): Promise<MedicationReminderItem[]> {
    const res = await api.get<MedicationReminderItem[]>('/prescriptions/reminders/all');
    return res.data;
  },

  async toggleReminder(id: string): Promise<MedicationReminderItem> {
    const res = await api.patch<MedicationReminderItem>(`/prescriptions/reminders/${id}/toggle`);
    return res.data;
  },

  async createReminder(payload: {
    medication_name: string;
    dosage_instruction: string;
    time_str: string;
    prescription_id?: string;
  }): Promise<MedicationReminderItem> {
    const res = await api.post<MedicationReminderItem>('/prescriptions/reminders/create', payload);
    return res.data;
  },

  async deleteReminder(id: string): Promise<{ success: boolean; message: string }> {
    const res = await api.delete<{ success: boolean; message: string }>(`/prescriptions/reminders/${id}`);
    return res.data;
  },

  async requestRefill(id: string, payload: RefillRequestPayload): Promise<{ success: boolean; refill_id: string; message: string }> {
    const res = await api.post<{ success: boolean; refill_id: string; message: string }>(`/prescriptions/${id}/refill`, payload);
    return res.data;
  },

  async requestNewPrescription(payload: RequestPrescriptionPayload): Promise<{ success: boolean; request_id: string; message: string }> {
    const res = await api.post<{ success: boolean; request_id: string; message: string }>('/prescriptions/request', payload);
    return res.data;
  },
};
