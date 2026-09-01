import { api } from './api';
import type {
  UserSettings,
  UserSettingsUpdatePayload,
  AccountOverview,
  LoginHistoryItem,
  DeviceSessionItem,
} from '../types/settings';

export const settingsService = {
  // Get current user settings
  getSettings: async (): Promise<UserSettings> => {
    const res = await api.get<UserSettings>('/settings');
    return res.data;
  },

  // Update user settings
  updateSettings: async (payload: UserSettingsUpdatePayload): Promise<UserSettings> => {
    const res = await api.patch<UserSettings>('/settings', payload);
    return res.data;
  },

  // Get account overview details
  getAccountOverview: async (): Promise<AccountOverview> => {
    const res = await api.get<AccountOverview>('/settings/overview');
    return res.data;
  },

  // Get login history
  getLoginHistory: async (): Promise<LoginHistoryItem[]> => {
    const res = await api.get<LoginHistoryItem[]>('/settings/login-history');
    return res.data;
  },

  // Get active device sessions
  getDevices: async (): Promise<DeviceSessionItem[]> => {
    const res = await api.get<DeviceSessionItem[]>('/settings/devices');
    return res.data;
  },

  // Revoke device session
  revokeDevice: async (deviceId: string): Promise<{ success: boolean; message: string }> => {
    const res = await api.post<{ success: boolean; message: string }>(`/settings/devices/${deviceId}/revoke`, {});
    return res.data;
  },

  // Toggle Two-Factor Authentication
  toggle2FA: async (enabled: boolean): Promise<{ enabled: boolean; message: string; qr_code_url?: string }> => {
    const res = await api.post<{ enabled: boolean; message: string; qr_code_url?: string }>('/settings/2fa/toggle', { enabled });
    return res.data;
  },

  // Clear application cache
  clearCache: async (): Promise<{ success: boolean; message: string }> => {
    const res = await api.post<{ success: boolean; message: string }>('/settings/clear-cache', {});
    return res.data;
  },

  // Deactivate account
  deactivateAccount: async (): Promise<{ success: boolean; message: string }> => {
    const res = await api.post<{ success: boolean; message: string }>('/settings/deactivate', {});
    return res.data;
  },
};

