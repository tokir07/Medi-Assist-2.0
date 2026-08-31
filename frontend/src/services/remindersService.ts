import { api } from './api';
import type {
  ReminderItem,
  ReminderGroupedListResponse,
  ReminderSummaryStats,
  ReminderCalendarMonthData,
  ReminderHistoryResponse,
  ReminderCreatePayload,
  ReminderUpdatePayload,
} from '../types/reminders';

export const remindersService = {
  async getReminders(params?: {
    tab?: string;
    search?: string;
    date?: string;
  }): Promise<ReminderGroupedListResponse> {
    const query = new URLSearchParams();
    if (params?.tab && params.tab !== 'All Reminders' && params.tab !== 'All') {
      query.append('tab', params.tab);
    }
    if (params?.search && params.search.trim()) {
      query.append('search', params.search.trim());
    }
    if (params?.date) {
      query.append('date', params.date);
    }

    const res = await api.get<ReminderGroupedListResponse>(`/reminders?${query.toString()}`);
    return res.data;
  },

  async getSummary(): Promise<ReminderSummaryStats> {
    const res = await api.get<ReminderSummaryStats>('/reminders/summary');
    return res.data;
  },

  async getCalendarEvents(year: number, month: number): Promise<ReminderCalendarMonthData> {
    const res = await api.get<ReminderCalendarMonthData>(`/reminders/calendar?year=${year}&month=${month}`);
    return res.data;
  },

  async getHistory(action?: string, limit = 50): Promise<ReminderHistoryResponse> {
    const query = new URLSearchParams();
    if (action && action !== 'All') query.append('action', action);
    query.append('limit', limit.toString());

    const res = await api.get<ReminderHistoryResponse>(`/reminders/history?${query.toString()}`);
    return res.data;
  },

  async createReminder(payload: ReminderCreatePayload): Promise<ReminderItem> {
    const res = await api.post<ReminderItem>('/reminders', payload);
    return res.data;
  },

  async updateReminder(id: string, payload: ReminderUpdatePayload): Promise<ReminderItem> {
    const res = await api.put<ReminderItem>(`/reminders/${id}`, payload);
    return res.data;
  },

  async markCompleted(id: string): Promise<ReminderItem> {
    const res = await api.post<ReminderItem>(`/reminders/${id}/complete`);
    return res.data;
  },

  async snoozeReminder(id: string, snoozeMinutes = 15): Promise<ReminderItem> {
    const res = await api.post<ReminderItem>(`/reminders/${id}/snooze`, {
      snooze_minutes: snoozeMinutes,
    });
    return res.data;
  },

  async dismissReminder(id: string): Promise<ReminderItem> {
    const res = await api.post<ReminderItem>(`/reminders/${id}/dismiss`);
    return res.data;
  },

  async markAllTodayCompleted(): Promise<{ status: string; updated_count: number }> {
    const res = await api.post<{ status: string; updated_count: number }>('/reminders/complete-all-today');
    return res.data;
  },

  async deleteReminder(id: string): Promise<void> {
    await api.delete(`/reminders/${id}`);
  },
};
