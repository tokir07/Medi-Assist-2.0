import { api } from './api';
import type {
  MedicalRecordItem,
  RecordSummaryStats,
  RecordListResponse,
  RecordQueryParams,
  SessionGroupItem,
  TimelineItem,
  StructuredExtractedData,
  ComprehensiveSummaryPayload,
  ComprehensiveSummaryResponse,
  ParameterTrendResponse,
  ReportCompareResponse,
  ExplainReportResponse,
  RecordSummaryGenerateResponse,
  SessionSummaryResponse,
  ShareRecordPayload,
  RequestDocumentPayload
} from '../types/records';

export const recordsService = {
  async getRecords(params?: RecordQueryParams): Promise<RecordListResponse> {
    const query = new URLSearchParams();
    if (params?.category && params.category !== 'All Records') {
      query.append('category', params.category);
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
    if (params?.tag) {
      query.append('tag', params.tag);
    }
    if (params?.session_name) {
      query.append('session_name', params.session_name);
    }
    if (params?.approval_status) {
      query.append('approval_status', params.approval_status);
    }
    if (params?.is_important !== undefined) {
      query.append('is_important', String(params.is_important));
    }

    const res = await api.get<RecordListResponse>(`/records?${query.toString()}`);
    return res.data;
  },

  async getSessions(): Promise<SessionGroupItem[]> {
    const res = await api.get<SessionGroupItem[]>('/records/sessions');
    return res.data;
  },

  async getSummary(): Promise<RecordSummaryStats> {
    const res = await api.get<RecordSummaryStats>('/records/summary');
    return res.data;
  },

  async getRecordById(id: string): Promise<MedicalRecordItem> {
    const res = await api.get<MedicalRecordItem>(`/records/${id}`);
    return res.data;
  },

  async getTimeline(): Promise<TimelineItem[]> {
    const res = await api.get<TimelineItem[]>('/records/timeline');
    return res.data;
  },

  async getRecordSummary(id: string): Promise<RecordSummaryGenerateResponse> {
    const res = await api.get<RecordSummaryGenerateResponse>(`/records/${id}/summary`);
    return res.data;
  },

  async regenerateRecordSummary(id: string): Promise<RecordSummaryGenerateResponse> {
    const res = await api.post<RecordSummaryGenerateResponse>(`/records/${id}/summary/regenerate`);
    return res.data;
  },

  async markClinicianReviewed(id: string, notes?: string): Promise<MedicalRecordItem> {
    const res = await api.post<MedicalRecordItem>(`/records/${id}/clinician-review`, {
      clinician_notes: notes
    });
    return res.data;
  },

  async getSessionSummary(sessionName: string): Promise<SessionSummaryResponse> {
    const res = await api.get<SessionSummaryResponse>(`/records/sessions/${encodeURIComponent(sessionName)}/summary`);
    return res.data;
  },

  async getParameterTrends(parameter: string): Promise<ParameterTrendResponse> {
    const res = await api.get<ParameterTrendResponse>(`/records/trends?parameter=${encodeURIComponent(parameter)}`);
    return res.data;
  },

  async compareReports(recordId1: string, recordId2: string): Promise<ReportCompareResponse> {
    const res = await api.post<ReportCompareResponse>('/records/compare', {
      record_id_1: recordId1,
      record_id_2: recordId2
    });
    return res.data;
  },

  async explainReport(recordId: string): Promise<ExplainReportResponse> {
    const res = await api.post<ExplainReportResponse>(`/records/${recordId}/explain`);
    return res.data;
  },

  async generateComprehensiveSummary(payload: ComprehensiveSummaryPayload): Promise<ComprehensiveSummaryResponse> {
    const res = await api.post<ComprehensiveSummaryResponse>('/records/comprehensive-summary', payload);
    return res.data;
  },

  async uploadRecord(formData: FormData, onProgress?: (percent: number) => void): Promise<MedicalRecordItem> {
    const res = await api.post<MedicalRecordItem>('/records/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (progressEvent.total && onProgress) {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(percent);
        }
      },
    });
    return res.data;
  },

  async getRecordDetails(id: string): Promise<MedicalRecordItem> {
    const res = await api.get<MedicalRecordItem>(`/records/${id}`);
    return res.data;
  },

  async triggerExtraction(id: string): Promise<MedicalRecordItem> {
    const res = await api.post<MedicalRecordItem>(`/records/${id}/extract`);
    return res.data;
  },

  async editExtraction(id: string, extractedData: StructuredExtractedData, approvalAction: 'EDIT' | 'APPROVE' | 'REJECT' = 'EDIT'): Promise<MedicalRecordItem> {
    const res = await api.patch<MedicalRecordItem>(`/records/${id}/extraction`, {
      extracted_data: extractedData,
      approval_action: approvalAction
    });
    return res.data;
  },

  async approveRecord(id: string): Promise<MedicalRecordItem> {
    const res = await api.post<MedicalRecordItem>(`/records/${id}/approve`);
    return res.data;
  },

  async rejectRecord(id: string): Promise<MedicalRecordItem> {
    const res = await api.post<MedicalRecordItem>(`/records/${id}/reject`);
    return res.data;
  },

  getFileUrl(id: string): string {
    return `/api/records/${id}/file`;
  },

  async deleteRecord(id: string): Promise<{ success: boolean; message: string }> {
    const res = await api.delete<{ success: boolean; message: string }>(`/records/${id}`);
    return res.data;
  },

  async restoreRecord(id: string): Promise<MedicalRecordItem> {
    const res = await api.post<MedicalRecordItem>(`/records/${id}/restore`);
    return res.data;
  },

  async permanentDeleteRecord(id: string): Promise<{ success: boolean; message: string }> {
    const res = await api.delete<{ success: boolean; message: string }>(`/records/${id}`);
    return res.data;
  },

  async getTrashRecords(): Promise<MedicalRecordItem[]> {
    const res = await api.get<MedicalRecordItem[]>('/records/trash/all');
    return res.data;
  },

  async shareRecord(id: string, payload: ShareRecordPayload): Promise<{ success: boolean; message: string; share: any }> {
    const res = await api.post<{ success: boolean; message: string; share: any }>(`/records/${id}/share`, payload);
    return res.data;
  },

  async requestDocument(payload: RequestDocumentPayload): Promise<{ success: boolean; request_id: string; message: string }> {
    const res = await api.post<{ success: boolean; request_id: string; message: string }>('/records/request', payload);
    return res.data;
  }
};
