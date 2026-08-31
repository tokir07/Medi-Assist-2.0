import axios from 'axios';
import type {
  UserSettings,
  UserSettingsUpdatePayload,
  AccountOverview,
  LoginHistoryItem,
  DeviceSessionItem,
} from '../types/settings';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

const getAuthHeaders = () => {
  const token = localStorage.getItem('mediassist_token') || localStorage.getItem('access_token');
  return {
    headers: {
      Authorization: token ? `Bearer ${token}` : '',
      'Content-Type': 'application/json',
    },
  };
};

export const settingsService = {
  // Get current user settings
  getSettings: async (): Promise<UserSettings> => {
    const res = await axios.get(`${API_BASE_URL}/settings`, getAuthHeaders());
    return res.data;
  },

  // Update user settings
  updateSettings: async (payload: UserSettingsUpdatePayload): Promise<UserSettings> => {
    const res = await axios.patch(`${API_BASE_URL}/settings`, payload, getAuthHeaders());
    return res.data;
  },

  // Get account overview details
  getAccountOverview: async (): Promise<AccountOverview> => {
    const res = await axios.get(`${API_BASE_URL}/settings/overview`, getAuthHeaders());
    return res.data;
  },

  // Get login history
  getLoginHistory: async (): Promise<LoginHistoryItem[]> => {
    const res = await axios.get(`${API_BASE_URL}/settings/login-history`, getAuthHeaders());
    return res.data;
  },

  // Get active device sessions
  getDevices: async (): Promise<DeviceSessionItem[]> => {
    const res = await axios.get(`${API_BASE_URL}/settings/devices`, getAuthHeaders());
    return res.data;
  },

  // Revoke device session
  revokeDevice: async (deviceId: string): Promise<{ success: boolean; message: string }> => {
    const res = await axios.post(`${API_BASE_URL}/settings/devices/${deviceId}/revoke`, {}, getAuthHeaders());
    return res.data;
  },

  // Toggle Two-Factor Authentication
  toggle2FA: async (enabled: boolean): Promise<{ enabled: boolean; message: string; qr_code_url?: string }> => {
    const res = await axios.post(`${API_BASE_URL}/settings/2fa/toggle`, { enabled }, getAuthHeaders());
    return res.data;
  },

  // Clear application cache
  clearCache: async (): Promise<{ success: boolean; message: string }> => {
    const res = await axios.post(`${API_BASE_URL}/settings/clear-cache`, {}, getAuthHeaders());
    return res.data;
  },

  // Deactivate account
  deactivateAccount: async (): Promise<{ success: boolean; message: string }> => {
    const res = await axios.post(`${API_BASE_URL}/settings/deactivate`, {}, getAuthHeaders());
    return res.data;
  },
};
