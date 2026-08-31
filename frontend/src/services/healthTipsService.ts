import { api } from './api';
import type {
  HealthTipItem,
  HealthTipListResponse,
  CategoryCountResponse,
  DailyTipReminderSettings,
  HealthActivityData,
} from '../types/healthTips';

export const healthTipsService = {
  async getHealthTips(params?: {
    category?: string;
    search?: string;
    saved_only?: boolean;
    page?: number;
    page_size?: number;
  }): Promise<HealthTipListResponse> {
    const query = new URLSearchParams();
    if (params?.category && params.category !== 'All' && params.category !== 'All Tips') {
      query.append('category', params.category);
    }
    if (params?.search && params.search.trim()) {
      query.append('search', params.search.trim());
    }
    if (params?.saved_only) {
      query.append('saved_only', 'true');
    }
    if (params?.page) {
      query.append('page', params.page.toString());
    }
    if (params?.page_size) {
      query.append('page_size', params.page_size.toString());
    }

    const res = await api.get<HealthTipListResponse>(`/health-tips?${query.toString()}`);
    return res.data;
  },

  async getTipOfTheDay(): Promise<HealthTipItem | null> {
    const res = await api.get<HealthTipItem | null>('/health-tips/today');
    return res.data;
  },

  async getRecommendedTips(limit = 4): Promise<HealthTipItem[]> {
    const res = await api.get<HealthTipItem[]>(`/health-tips/recommended?limit=${limit}`);
    return res.data;
  },

  async getPersonalizedTips(payload: any): Promise<HealthTipItem[]> {
    const res = await api.get<HealthTipItem[]>(`/health-tips/recommended?limit=6`);
    return res.data;
  },

  async getFeaturedTips(): Promise<HealthTipItem[]> {
    const res = await api.get<HealthTipItem[]>('/health-tips/featured');
    return res.data;
  },

  async getCategories(): Promise<CategoryCountResponse> {
    const res = await api.get<CategoryCountResponse>('/health-tips/categories');
    return res.data;
  },

  async getPopularTips(limit = 5): Promise<HealthTipItem[]> {
    const res = await api.get<HealthTipItem[]>(`/health-tips/popular?limit=${limit}`);
    return res.data;
  },

  async getSavedTips(): Promise<HealthTipItem[]> {
    const res = await api.get<HealthTipItem[]>('/health-tips/saved');
    return res.data;
  },

  async getRecentlyViewedTips(limit = 6): Promise<HealthTipItem[]> {
    const res = await api.get<HealthTipItem[]>(`/health-tips/recent?limit=${limit}`);
    return res.data;
  },

  async getHealthActivity(): Promise<HealthActivityData> {
    const res = await api.get<HealthActivityData>('/health-tips/activity');
    return res.data;
  },

  async getTipById(id: string): Promise<HealthTipItem> {
    const res = await api.get<HealthTipItem>(`/health-tips/${id}`);
    return res.data;
  },

  async getRelatedTips(id: string, category: string): Promise<HealthTipItem[]> {
    const res = await api.get<HealthTipItem[]>(`/health-tips/${id}/related?category=${encodeURIComponent(category)}`);
    return res.data;
  },

  async toggleSaveTip(tipId: string): Promise<{ is_saved: boolean }> {
    const res = await api.post<{ is_saved: boolean }>(`/health-tips/${tipId}/save`);
    return res.data;
  },

  async recordTipView(tipId: string): Promise<void> {
    try {
      await api.post(`/health-tips/${tipId}/view`);
    } catch (e) {
      console.warn('Failed to record tip view:', e);
    }
  },

  async getReminderSettings(): Promise<DailyTipReminderSettings> {
    const res = await api.get<DailyTipReminderSettings>('/health-tips/settings/reminder');
    return res.data;
  },

  async updateReminderSettings(settings: Partial<DailyTipReminderSettings>): Promise<DailyTipReminderSettings> {
    const res = await api.put<DailyTipReminderSettings>('/health-tips/settings/reminder', settings);
    return res.data;
  },
};
