import axios from 'axios';
import type { PatientProfile, ProfileUpdatePayload, ChangePasswordPayload } from '../types/profile';

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

export const profileService = {
  // Fetch authenticated patient profile
  getProfile: async (): Promise<PatientProfile> => {
    const res = await axios.get(`${API_BASE_URL}/profile`, getAuthHeaders());
    return res.data;
  },

  // Update profile details
  updateProfile: async (payload: ProfileUpdatePayload): Promise<PatientProfile> => {
    const res = await axios.patch(`${API_BASE_URL}/profile`, payload, getAuthHeaders());
    return res.data;
  },

  // Change password
  changePassword: async (payload: ChangePasswordPayload): Promise<{ success: boolean; message: string }> => {
    const res = await axios.post(`${API_BASE_URL}/profile/change-password`, payload, getAuthHeaders());
    return res.data;
  },
};
